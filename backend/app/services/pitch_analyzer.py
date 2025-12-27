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

from app.models.schemas import WordPitch

DB_PATH = Path(__file__).parent.parent.parent / "data" / "pitch.db"


@lru_cache(maxsize=1)
def get_tokenizer():
    """Get cached SudachiPy tokenizer instance."""
    return dictionary.Dictionary().create()


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
    __slots__ = ("accent_type", "goshu", "goshu_jp", "source", "has_multiple_patterns")

    def __init__(
        self,
        accent_type: int | None,
        goshu: str | None,
        goshu_jp: str | None,
        source: str = "unknown",
        has_multiple_patterns: bool = False,
    ):
        self.accent_type = accent_type
        self.goshu = goshu
        self.goshu_jp = goshu_jp
        self.source = source  # "dictionary", "dictionary_lemma", "dictionary_reading", "unknown"
        self.has_multiple_patterns = has_multiple_patterns  # True if pattern has multiple values (e.g., "0,2")


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

    if not row:
        return PitchLookupResult(None, None, None, source="unknown")

    # Parse accent pattern (may have multiple values like "0,2")
    pattern = row["accent_pattern"]
    has_multiple = "," in pattern
    first_value = pattern.split(",")[0].strip()

    try:
        accent_type = int(first_value)
    except ValueError:
        accent_type = None

    return PitchLookupResult(
        accent_type,
        row["goshu"],
        row["goshu_jp"],
        source=source,
        has_multiple_patterns=has_multiple,
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

        # Handle particles specially - they don't have their own pitch
        if is_particle(pos):
            # Particles inherit pitch from the preceding word
            # We mark them specially so the frontend can handle the visualization
            source = "particle"
            confidence = "high"  # We're confident this IS a particle
            warning = None
            # Don't look up in dictionary - particles don't have independent pitch
            lookup_result = PitchLookupResult(None, None, None, source="particle")

        # Handle proper nouns specially - pitch varies by region/speaker
        elif is_proper_noun(token):
            # Try to look up in dictionary first (some proper nouns are in Kanjium)
            lookup_result = lookup_pitch(surface, reading_hira, lemma, normalized)

            if lookup_result.source != "unknown" and lookup_result.accent_type is not None:
                # Found in dictionary - use it but note it's a proper noun
                source = lookup_result.source
                confidence = "medium"  # Lower confidence for proper nouns
                noun_type = get_proper_noun_type(token)
                if noun_type == "人名":
                    warning = "Name pitch may vary by region/family"
                elif noun_type == "地名":
                    warning = "Place name - pitch from dictionary"
                else:
                    warning = "Proper noun - verify pronunciation"
            else:
                # Not in dictionary - mark as proper noun without pitch
                source = "proper_noun"
                confidence = "low"
                noun_type = get_proper_noun_type(token)
                if noun_type == "人名":
                    warning = "Name not in dictionary - pitch varies"
                elif noun_type == "地名":
                    warning = "Place not in dictionary - ask native speaker"
                else:
                    warning = "Proper noun - pronunciation uncertain"
                lookup_result = PitchLookupResult(None, None, None, source="proper_noun")
        else:
            # Look up pitch and goshu in database (with lemma/normalized fallbacks)
            lookup_result = lookup_pitch(surface, reading_hira, lemma, normalized)

            # Determine source and confidence
            source = lookup_result.source
            if lookup_result.accent_type is None and source == "unknown":
                # No dictionary match - we're using rule-based pattern
                source = "rule"

            # Confidence based on source
            if source == "dictionary":
                confidence = "high"
            elif source == "dictionary_lemma":
                confidence = "medium"
            elif source in ("dictionary_reading", "rule"):
                confidence = "low"
            else:
                confidence = "low"

            # Generate warning for ambiguous cases
            warning = None
            if lookup_result.has_multiple_patterns:
                warning = "Multiple accent patterns exist for this word"
            elif source == "dictionary_reading":
                warning = "Matched by reading only - verify with native speaker"
            elif source == "rule":
                warning = "No dictionary entry - using standard pitch rules"

        pitch_pattern = get_pitch_pattern(lookup_result.accent_type, mora_count)

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
