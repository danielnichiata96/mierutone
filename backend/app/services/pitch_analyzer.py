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
            "Run 'python scripts/import_kanjium.py' first."
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
    __slots__ = ("accent_type", "goshu", "goshu_jp")

    def __init__(self, accent_type: int | None, goshu: str | None, goshu_jp: str | None):
        self.accent_type = accent_type
        self.goshu = goshu
        self.goshu_jp = goshu_jp


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
        PitchLookupResult with accent_type, goshu, and goshu_jp.
    """
    try:
        conn = get_db_connection()
    except FileNotFoundError:
        return PitchLookupResult(None, None, None)

    cursor = conn.cursor()

    # Try exact match on surface + reading first
    cursor.execute(
        "SELECT accent_pattern, goshu, goshu_jp FROM pitch_accents WHERE surface = ? AND reading = ? LIMIT 1",
        (surface, reading_hira)
    )
    row = cursor.fetchone()

    # Fallback: match by surface only
    if not row:
        cursor.execute(
            "SELECT accent_pattern, goshu, goshu_jp FROM pitch_accents WHERE surface = ? LIMIT 1",
            (surface,)
        )
        row = cursor.fetchone()

    # Fallback: match by reading only
    if not row:
        cursor.execute(
            "SELECT accent_pattern, goshu, goshu_jp FROM pitch_accents WHERE reading = ? LIMIT 1",
            (reading_hira,)
        )
        row = cursor.fetchone()

    # Fallback: match by lemma/dictionary form (食べた → 食べる)
    if not row and lemma and lemma != surface:
        cursor.execute(
            "SELECT accent_pattern, goshu, goshu_jp FROM pitch_accents WHERE surface = ? LIMIT 1",
            (lemma,)
        )
        row = cursor.fetchone()

    # Fallback: match by normalized form (わたし → 私)
    if not row and normalized and normalized not in (surface, lemma):
        cursor.execute(
            "SELECT accent_pattern, goshu, goshu_jp FROM pitch_accents WHERE surface = ? LIMIT 1",
            (normalized,)
        )
        row = cursor.fetchone()

    if not row:
        return PitchLookupResult(None, None, None)

    # Parse accent pattern (may have multiple values like "0,2")
    pattern = row["accent_pattern"]
    first_value = pattern.split(",")[0].strip()

    try:
        accent_type = int(first_value)
    except ValueError:
        accent_type = None

    return PitchLookupResult(accent_type, row["goshu"], row["goshu_jp"])


def get_pos(token) -> str:
    """Extract part of speech from SudachiPy token."""
    pos = token.part_of_speech()
    return pos[0] if pos else "Unknown"


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

        # Look up pitch and goshu in database (with lemma/normalized fallbacks)
        lookup_result = lookup_pitch(surface, reading_hira, lemma, normalized)
        pitch_pattern = get_pitch_pattern(lookup_result.accent_type, mora_count)

        words_result.append(WordPitch(
            surface=surface,
            reading=reading_hira,
            accent_type=lookup_result.accent_type,
            mora_count=mora_count,
            morae=morae,
            pitch_pattern=pitch_pattern,
            part_of_speech=get_pos(token),
            origin=lookup_result.goshu,
            origin_jp=lookup_result.goshu_jp,
            lemma=lemma if lemma != surface else None,
        ))

    return words_result
