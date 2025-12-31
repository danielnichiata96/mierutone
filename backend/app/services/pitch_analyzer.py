"""Pitch accent analysis service using SudachiPy + Kanjium SQLite.

SudachiPy Mode C keeps compound words together for accurate pitch lookup.
Kanjium provides 124k+ pitch accent entries (CC BY-SA 4.0).
"""

import logging
import re
import sqlite3
from functools import lru_cache
from pathlib import Path

import jaconv
from sudachipy import dictionary, tokenizer

logger = logging.getLogger(__name__)

# Optional UniDic support for cross-validation
try:
    import fugashi
    import unidic
    UNIDIC_AVAILABLE = True
except ImportError:
    UNIDIC_AVAILABLE = False

from app.models.schemas import WordPitch, ComponentPitch, HomophoneCandidate, SourceType, ConfidenceType

DB_PATH = Path(__file__).parent.parent.parent / "data" / "pitch.db"


# =============================================================================
# Warning Messages (centralized for consistency and future i18n)
# =============================================================================

WARNINGS = {
    # Proper nouns - in Kanjium dictionary
    "proper_name_dict": "Name pitch may vary by region/family",
    "proper_place_dict": "Place name - pitch from dictionary",
    "proper_other_dict": "Proper noun - verify pronunciation",
    # Proper nouns - in UniDic only
    "proper_name_unidic": "Name from UniDic - pitch may vary",
    "proper_place_unidic": "Place from UniDic - verify locally",
    "proper_other_unidic": "Proper noun from UniDic only",
    # Proper nouns - not in any dictionary
    "proper_name_unknown": "Name not in dictionary - pitch varies",
    "proper_place_unknown": "Place not in dictionary - ask native speaker",
    "proper_other_unknown": "Proper noun - pronunciation uncertain",
    # Lookup quality
    "multiple_patterns": "Multiple accent patterns exist for this word",
    "reading_only": "Matched by reading only - verify with native speaker",
    "unidic_only": "From UniDic only - Kanjium had no entry",
    "rule_based": "No dictionary entry - using standard pitch rules",
    # Cross-validation
    "sources_disagree": "Kanjium and UniDic disagree - verify pronunciation",
    # Compound prediction
    "compound_rule": "Compound accent predicted - verify with native speaker",
    "compound_unpredictable": "Compound accent unpredictable - verify with native speaker",
    # Expression fallback
    "expression_parts": "Analyzed by splitting into parts",
}


# =============================================================================
# Compound Word Analysis Constants
# =============================================================================

# Valid POS for compound components
# 名詞: Required - 90% of McCawley compounds are noun-based
# 動詞/形容詞: Keep - appear as stems in compounds (出口, 早起き)
# Exclude: 副詞 (noise), 連体詞 (maintain tonal independence)
COMPOUND_VALID_POS = {"名詞", "動詞", "形容詞"}

# Sources reliable enough for compound prediction
# Excludes dictionary_reading to avoid propagating low-confidence
RELIABLE_SOURCES = {
    "dictionary", "dictionary_lemma",
    "dictionary_unidic", "dictionary_proper", "unidic_proper"
}

# High confidence sources - compound is "in dictionary" if source is one of these
HIGH_CONFIDENCE_SOURCES = {
    "dictionary", "dictionary_lemma", "dictionary_unidic",
    "dictionary_proper", "unidic_proper"
}


@lru_cache(maxsize=1)
def get_tokenizer():
    """Get cached SudachiPy tokenizer instance."""
    return dictionary.Dictionary().create()


@lru_cache(maxsize=1)
def get_unidic_tagger():
    """Get cached UniDic/fugashi tagger instance for cross-validation."""
    if not UNIDIC_AVAILABLE:
        return None
    try:
        return fugashi.Tagger(f'-d "{unidic.DICDIR}"')
    except Exception:
        return None


@lru_cache(maxsize=1)
def get_db_connection() -> sqlite3.Connection:
    """Get cached database connection."""
    if not DB_PATH.exists():
        raise FileNotFoundError(
            f"Pitch database not found at {DB_PATH}. "
            "Run 'python scripts/download_dictionary.py' to download it."
        )
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def count_morae(reading: str) -> int:
    """Count morae in a Japanese reading.

    Small kana (ゃゅょぁぃぅぇぉ) don't count as separate morae.
    Long vowel mark (ー) counts as one mora.
    """
    if not reading:
        return 0

    small_kana = set("ゃゅょャュョぁぃぅぇぉァィゥェォ")
    return sum(1 for char in reading if char not in small_kana)


def split_into_morae(reading: str) -> list[str]:
    """Split reading into individual morae."""
    morae = []
    small_kana = set("ゃゅょャュョぁぃぅぇぉァィゥェォ")
    i = 0

    while i < len(reading):
        char = reading[i]
        if i + 1 < len(reading) and reading[i + 1] in small_kana:
            morae.append(char + reading[i + 1])
            i += 2
        else:
            morae.append(char)
            i += 1

    return morae


def get_pitch_pattern(accent_type: int | None, mora_count: int) -> list[str]:
    """Generate pitch pattern (H/L) based on accent type.

    Japanese pitch accent rules:
    - Type 0 (Heiban/平板): L-H-H-H... (rises and stays high)
    - Type 1 (Atamadaka/頭高): H-L-L-L... (starts high, drops after 1st)
    - Type N (Nakadaka/中高 or Odaka/尾高): L-H-...-H-L (drops after Nth mora)
    """
    if mora_count == 0:
        return []

    if mora_count == 1:
        return ["H"] if accent_type == 1 else ["L"]

    if accent_type is None or accent_type < 0:
        accent_type = 0

    if accent_type == 0:
        return ["L"] + ["H"] * (mora_count - 1)
    elif accent_type == 1:
        return ["H"] + ["L"] * (mora_count - 1)
    else:
        pattern = ["L"]
        for i in range(2, mora_count + 1):
            pattern.append("H" if i <= accent_type else "L")
        return pattern


class PitchLookupResult:
    """Result of pitch accent lookup."""
    __slots__ = (
        "accent_type", "goshu", "goshu_jp", "source",
        "has_multiple_patterns", "unidic_accent", "sources_agree"
    )

    def __init__(
        self,
        accent_type: int | None,
        goshu: str | None,
        goshu_jp: str | None,
        source: SourceType = "unknown",
        has_multiple_patterns: bool = False,
        unidic_accent: int | None = None,
        sources_agree: bool | None = None,
    ):
        self.accent_type = accent_type
        self.goshu = goshu
        self.goshu_jp = goshu_jp
        self.source: SourceType = source
        self.has_multiple_patterns = has_multiple_patterns
        self.unidic_accent = unidic_accent
        # True if both sources have data and agree, False if disagree, None if only one source
        self.sources_agree = sources_agree


def lookup_unidic_accent(surface: str, reading_hira: str) -> int | None:
    """Look up pitch accent from UniDic via fugashi.

    UniDic provides aType (accent type) for words. This serves as a
    secondary source for cross-validation with Kanjium.

    Returns:
        Accent type (int) or None if not found/unavailable.
    """
    tagger = get_unidic_tagger()
    if not tagger:
        return None

    try:
        # Tokenize the surface form
        tokens = list(tagger(surface))
        if not tokens:
            return None

        # For single-token words, get the accent directly
        if len(tokens) == 1:
            token = tokens[0]
            # aType is the accent type field in UniDic
            atype = getattr(token.feature, 'aType', None)
            if atype is not None and atype != '*':
                # aType can be comma-separated for multiple patterns
                first_value = str(atype).split(',')[0].strip()
                try:
                    return int(first_value)
                except ValueError:
                    return None

        # For multi-token results, try to find a match by reading
        for token in tokens:
            token_reading = getattr(token.feature, 'kana', None)
            if token_reading:
                token_reading_hira = jaconv.kata2hira(token_reading)
                if token_reading_hira == reading_hira:
                    atype = getattr(token.feature, 'aType', None)
                    if atype is not None and atype != '*':
                        first_value = str(atype).split(',')[0].strip()
                        try:
                            return int(first_value)
                        except ValueError:
                            continue
    except Exception:
        # Don't let UniDic errors break the main flow
        pass

    return None


# =============================================================================
# Decision Rules (pure functions for testability)
# =============================================================================

def get_confidence_for_source(
    source: SourceType,
    sources_agree: bool | None = None,
) -> ConfidenceType:
    """Determine confidence level based on source type and cross-validation.

    Cross-validation rules:
    - If Kanjium and UniDic agree → boost confidence
    - If they disagree → reduce confidence (can't trust either fully)
    - If only one source → use base confidence

    Args:
        source: The primary data source
        sources_agree: True if Kanjium and UniDic agree, False if disagree, None if single source
    """
    # Base confidence by source type
    if source == "dictionary":
        base = "high"
    elif source in ("dictionary_lemma", "dictionary_proper", "expression_parts"):
        base = "medium"
    elif source in ("particle", "auxiliary"):
        return "high"  # Particles/auxiliaries don't need cross-validation
    else:  # dictionary_reading, dictionary_unidic, unidic_proper, rule, proper_noun, unknown
        base = "low"

    # Cross-validation: adjust confidence based on agreement
    if sources_agree is True:
        # Sources agree → boost confidence
        if base == "low":
            return "medium"
        elif base == "medium":
            return "high"
        # high stays high
    elif sources_agree is False:
        # Sources disagree → reduce confidence (conflicting data)
        if base == "high":
            return "medium"
        elif base == "medium":
            return "low"
        # low stays low

    return base


def get_proper_noun_warning(
    noun_type: str | None,
    source: SourceType,
) -> str:
    """Get appropriate warning for a proper noun based on its source."""
    # In Kanjium dictionary
    if source == "dictionary_proper":
        if noun_type == "人名":
            return WARNINGS["proper_name_dict"]
        elif noun_type == "地名":
            return WARNINGS["proper_place_dict"]
        else:
            return WARNINGS["proper_other_dict"]
    # In UniDic only (not in Kanjium)
    elif source == "unidic_proper":
        if noun_type == "人名":
            return WARNINGS["proper_name_unidic"]
        elif noun_type == "地名":
            return WARNINGS["proper_place_unidic"]
        else:
            return WARNINGS["proper_other_unidic"]
    # Not in any dictionary
    else:
        if noun_type == "人名":
            return WARNINGS["proper_name_unknown"]
        elif noun_type == "地名":
            return WARNINGS["proper_place_unknown"]
        else:
            return WARNINGS["proper_other_unknown"]


def get_lookup_warning(
    source: SourceType,
    has_multiple_patterns: bool,
    sources_agree: bool | None = None,
) -> str | None:
    """Get warning for lookup quality issues."""
    # Cross-validation disagreement is highest priority warning
    if sources_agree is False:
        return WARNINGS["sources_disagree"]
    # Then check other quality issues
    if has_multiple_patterns:
        return WARNINGS["multiple_patterns"]
    elif source == "dictionary_unidic":
        return WARNINGS["unidic_only"]
    elif source == "dictionary_reading":
        return WARNINGS["reading_only"]
    elif source == "rule":
        return WARNINGS["rule_based"]
    return None


def should_generate_pitch_pattern(source: SourceType) -> bool:
    """Determine if we should generate a pitch pattern for this source type."""
    # Particles, auxiliaries, and uncertain proper nouns don't get pitch patterns
    return source not in ("particle", "auxiliary", "proper_noun")


# =============================================================================
# Compound Word Analysis Functions
# =============================================================================

def is_component_reliable(pitch_result: PitchLookupResult, pos: str) -> bool:
    """Check if a component is reliable enough for compound prediction.

    Args:
        pitch_result: Lookup result for the component
        pos: Part of speech of the component

    Returns:
        True if the component can be used for compound accent prediction
    """
    if pos not in COMPOUND_VALID_POS:
        return False  # Filter particles, suffixes, etc.
    if pitch_result.source not in RELIABLE_SOURCES:
        return False  # Unreliable sources (proper_noun, unknown, rule, dictionary_reading)
    if pitch_result.accent_type is None:
        return False  # No accent data
    return True


def predict_compound_accent(
    n1_morae: int,
    n2_morae: int,
    n2_accent: int | None
) -> int | None:
    """Apply McCawley rules to predict compound accent.

    McCawley Compound Accent Rules (Tokyo Dialect):
    - N2 ≤ 2 morae: accent on last mora of N1
    - N2 3-4 morae: accent on first mora of N2
    - N2 ≥ 5 morae: follow N2's original accent (offset by N1)

    Args:
        n1_morae: Mora count of the first component
        n2_morae: Mora count of the second component
        n2_accent: Accent type of the second component

    Returns:
        Predicted accent position, or None if unpredictable
    """
    if n2_morae <= 2:
        # N2 short → accent on last mora of N1
        return n1_morae
    elif n2_morae in (3, 4):
        # N2 medium → accent on first mora of N2
        return n1_morae + 1
    else:  # n2_morae >= 5
        # N2 long → follow N2's original accent, offset by N1
        if n2_accent is None or n2_accent == 0:
            return None  # Can't predict heiban compounds reliably
        return n1_morae + n2_accent  # Offset N2's accent by N1 length


def predict_compound_iterative(components: list[ComponentPitch]) -> int | None:
    """Apply McCawley rules iteratively for multi-part compounds.

    For compounds with >2 components, apply rules pairwise:
    (N1 + N2) → N12, then (N12 + N3) → N123, etc.

    Args:
        components: List of compound components with accent info

    Returns:
        Predicted accent position, or None if unpredictable
    """
    if len(components) < 2:
        return None

    # Start with first component
    accumulated_morae = components[0].mora_count
    # Note: accumulated_accent not used in current rules, but kept for logging

    logger.debug(
        f"Compound prediction start: {components[0].surface} "
        f"({accumulated_morae} mora, accent={components[0].accent_type})"
    )

    # Apply rules pairwise: (N1+N2)→N12, (N12+N3)→N123, etc.
    for i in range(1, len(components)):
        n2 = components[i]
        new_accent = predict_compound_accent(
            accumulated_morae, n2.mora_count, n2.accent_type
        )

        logger.debug(
            f"Compound step {i}: {accumulated_morae} mora + "
            f"{n2.surface}({n2.mora_count} mora, accent={n2.accent_type}) "
            f"→ predicted accent={new_accent}"
        )

        if new_accent is None:
            return None  # Can't predict if any step fails

        accumulated_morae += n2.mora_count

    return new_accent


class CompoundAnalysis:
    """Result of compound word analysis."""
    __slots__ = ("components", "predicted_accent", "used_prediction", "all_reliable")

    def __init__(
        self,
        components: list[ComponentPitch],
        predicted_accent: int | None,
        used_prediction: bool,
        all_reliable: bool,
    ):
        self.components = components
        self.predicted_accent = predicted_accent
        self.used_prediction = used_prediction
        self.all_reliable = all_reliable


def resolve_compound_pitch(
    compound_analysis: CompoundAnalysis,
    compound_in_dict: bool,
    original_accent: int | None,
    original_source: SourceType,
    original_confidence: ConfidenceType,
    original_warning: str | None,
) -> tuple[int | None, SourceType, ConfidenceType, str | None]:
    """Resolve final pitch info for a compound word.

    Decision logic:
    1. If compound is in high-confidence dict → use original (dict wins)
    2. If prediction succeeded → use predicted accent
    3. If prediction failed (None) but was attempted → show as unpredictable
    4. Otherwise → use original

    Returns:
        (accent_type, source, confidence, warning)
    """
    if compound_analysis.used_prediction:
        # Prediction succeeded
        return (
            compound_analysis.predicted_accent,
            "compound_rule",
            "low",
            WARNINGS["compound_rule"],
        )
    elif not compound_in_dict and compound_analysis.all_reliable:
        # Prediction was attempted but failed (e.g., N2≥5 heiban)
        return (
            None,
            "compound_rule",
            "low",
            WARNINGS["compound_unpredictable"],
        )
    else:
        # Use original (dict value or couldn't attempt prediction)
        return (original_accent, original_source, original_confidence, original_warning)


def analyze_compound(token, compound_in_dict: bool) -> CompoundAnalysis | None:
    """Split a compound word and analyze each component.

    Always shows components for educational value.
    Only predicts accent if:
    1. Compound NOT in dictionary (high confidence source)
    2. ALL components are reliable (known accent, valid POS)

    Args:
        token: SudachiPy token to analyze
        compound_in_dict: True if compound was found in a high-confidence source

    Returns:
        CompoundAnalysis with components and optional predicted accent,
        or None if not a valid compound (single part or < 2 valid components)
    """
    # Split using Mode A (smallest units)
    parts = token.split(tokenizer.Tokenizer.SplitMode.A)
    if len(parts) <= 1:
        return None  # Not a compound

    # Filter by POS - only keep nouns, verbs, adjectives
    filtered_parts = [p for p in parts if get_pos(p) in COMPOUND_VALID_POS]
    if len(filtered_parts) < 2:
        return None  # Not enough valid components

    # Look up pitch for each component
    components: list[ComponentPitch] = []
    all_reliable = True

    for part in filtered_parts:
        reading_hira = jaconv.kata2hira(part.reading_form())
        pos = get_pos(part)
        lemma = part.dictionary_form()
        normalized = part.normalized_form()

        pitch = lookup_pitch(part.surface(), reading_hira, lemma, normalized)
        reliable = is_component_reliable(pitch, pos)

        if not reliable:
            all_reliable = False

        components.append(ComponentPitch(
            surface=part.surface(),
            reading=reading_hira,
            accent_type=pitch.accent_type,
            mora_count=count_morae(reading_hira),
            part_of_speech=pos,
            reliable=reliable,
        ))

    # Only predict if compound NOT in dictionary AND all components reliable
    predicted_accent = None
    can_predict = not compound_in_dict and all_reliable and len(components) >= 2

    if can_predict:
        predicted_accent = predict_compound_iterative(components)
        logger.debug(
            f"Compound '{token.surface()}': components={[c.surface for c in components]}, "
            f"predicted_accent={predicted_accent}"
        )

    return CompoundAnalysis(
        components=components,
        predicted_accent=predicted_accent,
        used_prediction=can_predict and predicted_accent is not None,
        all_reliable=all_reliable,
    )



class ExpressionFallbackResult:
    """Result of expression fallback analysis using Mode A split."""
    __slots__ = ("components", "combined_pattern", "success")

    def __init__(
        self,
        components: list[ComponentPitch],
        combined_pattern: list[str],
        success: bool,
    ):
        self.components = components
        self.combined_pattern = combined_pattern
        self.success = success


def analyze_expression_fallback(token) -> ExpressionFallbackResult | None:
    """Fallback analysis for expressions not found in dictionary.
    
    When a token (especially interjections like おはようございます) is not found
    in the dictionary, try splitting it using Mode A and analyze each part.
    
    Args:
        token: SudachiPy token to analyze
        
    Returns:
        ExpressionFallbackResult with components and combined pattern,
        or None if splitting doesn't help
    """
    # Split using Mode A (smallest units)
    parts = token.split(tokenizer.Tokenizer.SplitMode.A)
    if len(parts) <= 1:
        return None  # Can't split further
    
    components: list[ComponentPitch] = []
    combined_pattern: list[str] = []
    has_known_accent = False
    
    for part in parts:
        reading_hira = jaconv.kata2hira(part.reading_form())
        pos = get_pos(part)
        lemma = part.dictionary_form()
        normalized = part.normalized_form()
        
        # Look up pitch for this part
        pitch = lookup_pitch(part.surface(), reading_hira, lemma, normalized)
        
        mora_count = count_morae(reading_hira)
        
        # Determine if this part has reliable pitch data
        reliable = pitch.source in RELIABLE_SOURCES and pitch.accent_type is not None
        if reliable:
            has_known_accent = True
        
        # Generate pattern for this part
        if mora_count == 0:
            part_pattern = []  # Skip empty readings
        elif pitch.accent_type is not None:
            part_pattern = get_pitch_pattern(pitch.accent_type, mora_count)
        elif is_particle_like(pos):
            # Particles/auxiliaries: follow the previous pitch (simplified: use H)
            part_pattern = ["H"] * mora_count if combined_pattern and combined_pattern[-1] == "H" else ["L"] * mora_count
        else:
            # Unknown: default to heiban-like (L then H)
            part_pattern = ["L"] + ["H"] * (mora_count - 1) if mora_count > 1 else ["H"]
        
        combined_pattern.extend(part_pattern)
        
        components.append(ComponentPitch(
            surface=part.surface(),
            reading=reading_hira,
            accent_type=pitch.accent_type,
            mora_count=mora_count,
            part_of_speech=pos,
            reliable=reliable,
        ))
    
    # Only return if we found at least one part with known accent
    if not has_known_accent:
        return None
    
    return ExpressionFallbackResult(
        components=components,
        combined_pattern=combined_pattern,
        success=True,
    )


def lookup_pitch(
    surface: str,
    reading_hira: str,
    lemma: str | None = None,
    normalized: str | None = None,
) -> PitchLookupResult:
    """Look up pitch accent and goshu in database.

    Args:
        surface: Word surface form (kanji/kana)
        reading_hira: Reading in hiragana
        lemma: Dictionary form (e.g., 食べる for 食べた)
        normalized: Normalized form (e.g., 私 for わたし)

    Returns:
        PitchLookupResult with accent_type, goshu, goshu_jp, and source.
    """
    try:
        conn = get_db_connection()
    except FileNotFoundError:
        return PitchLookupResult(None, None, None, source="unknown")

    cursor = conn.cursor()
    row = None
    source = "unknown"

    # Fallback chain (most specific → least specific):
    # 1. surface + reading (exact) → "dictionary"
    # 2. surface only → "dictionary"
    # 3. lemma/dictionary form → "dictionary_lemma"
    # 4. normalized form → "dictionary_lemma"
    # 5. reading only → "dictionary_reading"

    # 1. Exact match: surface + reading
    cursor.execute(
        "SELECT accent_pattern, goshu, goshu_jp FROM pitch_accents WHERE surface = ? AND reading = ? LIMIT 1",
        (surface, reading_hira)
    )
    row = cursor.fetchone()
    if row:
        source = "dictionary"

    # 2. Surface only (prefer entry where reading matches)
    if not row:
        cursor.execute(
            "SELECT accent_pattern, goshu, goshu_jp FROM pitch_accents "
            "WHERE surface = ? ORDER BY (reading = ?) DESC LIMIT 1",
            (surface, reading_hira)
        )
        row = cursor.fetchone()
        if row:
            source = "dictionary"

    # 3. Lemma/dictionary form (食べた → 食べる)
    if not row and lemma and lemma != surface:
        cursor.execute(
            "SELECT accent_pattern, goshu, goshu_jp FROM pitch_accents "
            "WHERE surface = ? ORDER BY (reading = ?) DESC LIMIT 1",
            (lemma, reading_hira)
        )
        row = cursor.fetchone()
        if row:
            source = "dictionary_lemma"

    # 4. Normalized form (わたし → 私)
    if not row and normalized and normalized not in (surface, lemma):
        cursor.execute(
            "SELECT accent_pattern, goshu, goshu_jp FROM pitch_accents "
            "WHERE surface = ? ORDER BY (reading = ?) DESC LIMIT 1",
            (normalized, reading_hira)
        )
        row = cursor.fetchone()
        if row:
            source = "dictionary_lemma"

    # 5. Reading only (last resort - prefer shorter surface to avoid compounds)
    if not row and reading_hira:
        cursor.execute(
            "SELECT accent_pattern, goshu, goshu_jp FROM pitch_accents "
            "WHERE reading = ? ORDER BY LENGTH(surface) ASC LIMIT 1",
            (reading_hira,)
        )
        row = cursor.fetchone()
        if row:
            source = "dictionary_reading"

    # Get UniDic accent for cross-validation
    unidic_accent = lookup_unidic_accent(surface, reading_hira)

    if not row:
        # No Kanjium match - check if UniDic has data
        if unidic_accent is not None:
            return PitchLookupResult(
                unidic_accent,
                None,
                None,
                source="dictionary_unidic",  # UniDic-only source (transparent)
                has_multiple_patterns=False,
                unidic_accent=unidic_accent,
                sources_agree=None,  # Only one source
            )
        return PitchLookupResult(None, None, None, source="unknown")

    # Parse accent pattern (may have multiple values like "0,2")
    pattern = row["accent_pattern"]
    has_multiple = "," in pattern

    # Parse ALL accent patterns for cross-validation
    all_accents: list[int] = []
    for val in pattern.split(","):
        try:
            all_accents.append(int(val.strip()))
        except ValueError:
            pass

    # Use first valid accent as the primary
    accent_type = all_accents[0] if all_accents else None

    # Determine if sources agree - check if UniDic matches ANY Kanjium pattern
    sources_agree: bool | None = None
    if all_accents and unidic_accent is not None:
        sources_agree = (unidic_accent in all_accents)

    return PitchLookupResult(
        accent_type,
        row["goshu"],
        row["goshu_jp"],
        source=source,
        has_multiple_patterns=has_multiple,
        unidic_accent=unidic_accent,
        sources_agree=sources_agree,
    )


def is_pure_hiragana(text: str) -> bool:
    """Check if text contains only hiragana characters.

    Returns True for inputs like "はし", "にほん", "おはよう".
    Returns False for inputs containing kanji, katakana, romaji, or punctuation.

    Note: This is strict - no punctuation or whitespace allowed.
    Use normalize_for_homophone_lookup() to clean input first.
    """
    if not text:
        return False

    # Hiragana Unicode range: U+3040 to U+309F
    for char in text:
        if not ('\u3040' <= char <= '\u309f'):
            return False

    return True


def normalize_for_homophone_lookup(text: str) -> str:
    """Strip punctuation and whitespace from text for homophone lookup.

    Removes common Japanese and ASCII punctuation, whitespace, and
    special characters that might surround a word in user input.

    Args:
        text: Raw input text

    Returns:
        Cleaned text with non-punctuation characters preserved
    """
    # Common punctuation to strip (Japanese + ASCII)
    # Note: ー (long vowel) is NOT stripped as it's part of words like ラーメン
    strip_chars = set(
        # Whitespace (including full-width space U+3000)
        " \t\n\r\u3000"
        # Japanese punctuation (excluding ー which is part of words)
        "。、！？「」『』（）【】〈〉《》〔〕｛｝・…―～〜"
        # ASCII punctuation
        ".,!?()[]{}\"'`-_:;/\\@#$%^&*+=<>|"
    )
    return "".join(c for c in text if c not in strip_chars)


# Maximum length for homophone lookup (longer inputs are likely sentences)
MAX_HOMOPHONE_LENGTH = 10


def is_homophone_lookup_candidate(text: str) -> tuple[bool, str]:
    """Check if text should trigger homophone lookup mode.

    Homophone lookup is for short, single-word hiragana inputs where
    the user wants to see all possible kanji representations.

    Args:
        text: Raw input text

    Returns:
        Tuple of (should_lookup, normalized_text)
        - should_lookup: True if this should be a homophone lookup
        - normalized_text: Cleaned text for the lookup
    """
    # Normalize first
    normalized = normalize_for_homophone_lookup(text.strip())

    # Must have content after normalization
    if not normalized:
        return False, ""

    # Must be short (likely a single word, not a sentence)
    if len(normalized) > MAX_HOMOPHONE_LENGTH:
        return False, ""

    # Must be pure hiragana
    if not is_pure_hiragana(normalized):
        return False, ""

    return True, normalized


def lookup_homophones(reading: str) -> list[HomophoneCandidate]:
    """Look up all homophones (words with same reading) in the database.

    Used when user enters pure hiragana input to show all possible
    kanji representations with their pitch accents.

    Args:
        reading: Hiragana reading to search for (e.g., "はし")

    Returns:
        List of HomophoneCandidate with different kanji and pitch patterns.
    """
    try:
        conn = get_db_connection()
    except FileNotFoundError:
        return []

    cursor = conn.cursor()

    # Get all entries with this reading, ordered by accent pattern
    cursor.execute(
        """SELECT DISTINCT surface, reading, accent_pattern, goshu, goshu_jp
           FROM pitch_accents
           WHERE reading = ?
           ORDER BY accent_pattern, surface""",
        (reading,)
    )

    rows = cursor.fetchall()

    if not rows:
        return []

    candidates: list[HomophoneCandidate] = []
    seen_surfaces: set[str] = set()

    for row in rows:
        surface = row["surface"]

        # Skip duplicates (same kanji)
        if surface in seen_surfaces:
            continue
        seen_surfaces.add(surface)

        # Parse accent pattern (take first if multiple like "0,2")
        pattern_str = row["accent_pattern"]
        try:
            accent_type = int(pattern_str.split(",")[0].strip())
        except ValueError:
            accent_type = None

        mora_count = count_morae(reading)
        morae = split_into_morae(reading)
        pitch_pattern = get_pitch_pattern(accent_type, mora_count) if accent_type is not None else []

        candidates.append(HomophoneCandidate(
            surface=surface,
            reading=reading,
            accent_type=accent_type,
            mora_count=mora_count,
            morae=morae,
            pitch_pattern=pitch_pattern,
            origin=row["goshu"],
            origin_jp=row["goshu_jp"],
        ))

    return candidates


def get_pos(token) -> str:
    """Extract part of speech from SudachiPy token."""
    pos = token.part_of_speech()
    return pos[0] if pos else "Unknown"


def is_particle(pos: str) -> bool:
    """Check if part of speech is a particle (助詞)."""
    return pos == "助詞"


def is_auxiliary(pos: str) -> bool:
    """Check if part of speech is an auxiliary verb (助動詞)."""
    return pos == "助動詞"


def is_particle_like(pos: str) -> bool:
    """Check if part of speech behaves like a particle (inherits pitch)."""
    return pos in ("助詞", "助動詞")


def is_proper_noun(token) -> bool:
    """Check if token is a proper noun (固有名詞)."""
    pos = token.part_of_speech()
    return len(pos) > 1 and pos[1] == "固有名詞"


def get_proper_noun_type(token) -> str | None:
    """Get the type of proper noun (人名, 地名, etc.)."""
    pos = token.part_of_speech()
    if len(pos) > 2 and pos[1] == "固有名詞":
        return pos[2]  # 人名, 地名, 一般, etc.
    return None


def analyze_text(text: str) -> list[WordPitch]:
    """Analyze Japanese text and return pitch accent information.

    Uses SudachiPy Mode C to keep compound words together,
    then looks up pitch patterns in Kanjium database.
    """
    tok = get_tokenizer()
    mode = tokenizer.Tokenizer.SplitMode.C  # Keep compounds together
    words_result = []

    for token in tok.tokenize(text, mode):
        surface = token.surface()

        # Skip punctuation and whitespace
        if re.match(r'^[\s\u3000.,!?。、！？「」『』（）\(\)\-ー～]+$', surface):
            continue

        # SudachiPy returns reading in katakana, convert to hiragana for DB lookup
        reading_kata = token.reading_form()
        reading_hira = jaconv.kata2hira(reading_kata) if reading_kata else surface

        mora_count = count_morae(reading_hira)
        morae = split_into_morae(reading_hira)

        # Get dictionary form (lemma) and normalized form for fallback lookups
        lemma = token.dictionary_form()
        normalized = token.normalized_form()

        pos = get_pos(token)

        # Determine source, confidence, warning using decision rules
        source: SourceType
        confidence: ConfidenceType
        warning: str | None

        if is_particle(pos):
            # Particles inherit pitch from context - don't look up
            source = "particle"
            confidence = "high"  # Confident it IS a particle
            warning = None
            lookup_result = PitchLookupResult(None, None, None, source="particle")

        elif is_auxiliary(pos):
            # Auxiliary verbs also inherit pitch from context - don't look up
            source = "auxiliary"
            confidence = "high"  # Confident it IS an auxiliary verb
            warning = None
            lookup_result = PitchLookupResult(None, None, None, source="auxiliary")

        elif is_proper_noun(token):
            # Try dictionary first, then decide based on result
            lookup_result = lookup_pitch(surface, reading_hira, lemma, normalized)
            noun_type = get_proper_noun_type(token)

            # Determine source based on where the data came from
            if lookup_result.source == "dictionary_unidic":
                # Found in UniDic only, not in Kanjium
                source = "unidic_proper"
                confidence = get_confidence_for_source(source, lookup_result.sources_agree)
            elif lookup_result.source != "unknown" and lookup_result.accent_type is not None:
                # Found in Kanjium
                source = "dictionary_proper"
                confidence = get_confidence_for_source(source, lookup_result.sources_agree)
            else:
                # Not in any dictionary
                source = "proper_noun"
                confidence = "low"
                lookup_result = PitchLookupResult(None, None, None, source="proper_noun")

            # Proper nouns get their own warning, but disagreement takes priority
            if lookup_result.sources_agree is False:
                warning = WARNINGS["sources_disagree"]
            else:
                warning = get_proper_noun_warning(noun_type, source)

        else:
            # Regular word - look up in database
            lookup_result = lookup_pitch(surface, reading_hira, lemma, normalized)
            source = lookup_result.source

            # No match → use rule-based
            if lookup_result.accent_type is None and source == "unknown":
                source = "rule"

            # Pass cross-validation result for confidence and warning
            confidence = get_confidence_for_source(source, lookup_result.sources_agree)
            warning = get_lookup_warning(
                source, lookup_result.has_multiple_patterns, lookup_result.sources_agree
            )

        # Compound analysis: check if this word splits into components
        compound_analysis = None
        expression_fallback = None
        components = None
        is_compound = False
        final_accent_type = lookup_result.accent_type

        # Only analyze compounds for non-particles/auxiliaries and non-proper-nouns
        if not is_particle_like(pos) and not is_proper_noun(token):
            compound_in_dict = source in HIGH_CONFIDENCE_SOURCES
            compound_analysis = analyze_compound(token, compound_in_dict)

            if compound_analysis is not None:
                is_compound = True
                components = compound_analysis.components

                # Resolve final pitch using extracted decision logic
                final_accent_type, source, confidence, warning = resolve_compound_pitch(
                    compound_analysis,
                    compound_in_dict,
                    lookup_result.accent_type,
                    source,
                    confidence,
                    warning,
                )

        # Expression fallback: if lookup failed and no compound analysis helped,
        # try splitting with Mode A and analyzing parts
        # Skip for particles/auxiliaries and proper nouns (they have special handling)
        if (source == "rule" or final_accent_type is None) and not is_compound and not is_particle_like(pos) and not is_proper_noun(token):
            expression_fallback = analyze_expression_fallback(token)
            
            if expression_fallback is not None and expression_fallback.success:
                # Use the combined pattern from parts
                is_compound = True  # Show as compound for UI
                components = expression_fallback.components
                pitch_pattern = expression_fallback.combined_pattern
                source = "expression_parts"
                confidence = get_confidence_for_source(source)
                warning = WARNINGS["expression_parts"]
                # Set accent_type to None since it's a combined pattern
                final_accent_type = None

        # Generate pitch pattern only for appropriate sources
        # Don't generate pattern if accent is None (unpredictable compound or unknown)
        # Skip if expression_fallback already set the pattern
        if expression_fallback is None or not expression_fallback.success:
            pitch_pattern = (
                get_pitch_pattern(final_accent_type, mora_count)
                if should_generate_pitch_pattern(source) and final_accent_type is not None
                else []
            )

        words_result.append(WordPitch(
            surface=surface,
            reading=reading_hira,
            accent_type=final_accent_type,
            mora_count=mora_count,
            morae=morae,
            pitch_pattern=pitch_pattern,
            part_of_speech=pos,
            origin=lookup_result.goshu,
            origin_jp=lookup_result.goshu_jp,
            lemma=lemma if lemma != surface else None,
            source=source,
            confidence=confidence,
            warning=warning,
            is_compound=is_compound,
            components=components,
        ))

    return words_result
