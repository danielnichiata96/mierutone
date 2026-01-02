"""Kanjium database lookup."""

import sqlite3
from functools import lru_cache
from pathlib import Path

from app.models.schemas import SourceType, HomophoneCandidate
from .mora import count_morae, split_into_morae
from .patterns import get_pitch_pattern
from .unidic import lookup_unidic_accent
from .constants import MAX_HOMOPHONE_LENGTH

DB_PATH = Path(__file__).parent.parent.parent.parent / "data" / "pitch.db"


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
    source: SourceType = "unknown"

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
    """Check if text contains only hiragana characters."""
    if not text:
        return False

    # Hiragana Unicode range: U+3040 to U+309F
    for char in text:
        if not ('\u3040' <= char <= '\u309f'):
            return False

    return True


def normalize_for_homophone_lookup(text: str) -> str:
    """Strip punctuation and whitespace from text for homophone lookup."""
    strip_chars = set(
        # Whitespace (including full-width space U+3000)
        " \t\n\r\u3000"
        # Japanese punctuation (excluding ー which is part of words)
        "。、！？「」『』（）【】〈〉《》〔〕｛｝・…―～〜"
        # ASCII punctuation
        ".,!?()[]{}\"'`-_:;/\\@#$%^&*+=<>|"
    )
    return "".join(c for c in text if c not in strip_chars)


def is_homophone_lookup_candidate(text: str) -> tuple[bool, str]:
    """Check if text should trigger homophone lookup mode."""
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
    """Look up all homophones (words with same reading) in the database."""
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
