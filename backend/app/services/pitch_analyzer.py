"""Pitch accent analysis service using SudachiPy + Kanjium SQLite.

SudachiPy Mode C keeps compound words together for accurate pitch lookup.
Kanjium provides 124k+ pitch accent entries (CC BY-SA 4.0).
"""

import re
import sqlite3
from functools import lru_cache
from pathlib import Path

import jaconv
from sudachipy import dictionary, tokenizer

# Optional UniDic support for cross-validation
try:
    import fugashi
    import unidic
    UNIDIC_AVAILABLE = True
except ImportError:
    UNIDIC_AVAILABLE = False

from app.models.schemas import WordPitch, SourceType, ConfidenceType

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
    elif source in ("dictionary_lemma", "dictionary_proper"):
        base = "medium"
    elif source == "particle":
        return "high"  # Particles don't need cross-validation
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
    # Particles and uncertain proper nouns don't get pitch patterns
    return source not in ("particle", "proper_noun")


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


def get_pos(token) -> str:
    """Extract part of speech from SudachiPy token."""
    pos = token.part_of_speech()
    return pos[0] if pos else "Unknown"


def is_particle(pos: str) -> bool:
    """Check if part of speech is a particle or auxiliary verb."""
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

        # Generate pitch pattern only for appropriate sources
        pitch_pattern = (
            get_pitch_pattern(lookup_result.accent_type, mora_count)
            if should_generate_pitch_pattern(source)
            else []
        )

        words_result.append(WordPitch(
            surface=surface,
            reading=reading_hira,
            accent_type=lookup_result.accent_type,
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
        ))

    return words_result
