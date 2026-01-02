"""Mora counting and splitting utilities."""

# Characters that are valid in Japanese readings
HIRAGANA_RANGE = ('\u3040', '\u309f')  # ぁ-ゟ
KATAKANA_RANGE = ('\u30a0', '\u30ff')  # ゠-ヿ
LONG_VOWEL = 'ー'

# Small kana that don't count as separate morae
SMALL_KANA = frozenset("ゃゅょャュョぁぃぅぇぉァィゥェォ")


def _is_japanese_kana(char: str) -> bool:
    """Check if character is hiragana or katakana."""
    return (
        HIRAGANA_RANGE[0] <= char <= HIRAGANA_RANGE[1]
        or KATAKANA_RANGE[0] <= char <= KATAKANA_RANGE[1]
        or char == LONG_VOWEL
    )


def count_morae(reading: str) -> int:
    """Count morae in a Japanese reading.

    Small kana (ゃゅょぁぃぅぇぉ) don't count as separate morae.
    Long vowel mark (ー) counts as one mora.

    Args:
        reading: Japanese reading in hiragana or katakana.

    Returns:
        Number of morae in the reading. Returns 0 for empty or invalid input.
    """
    # Guard: Empty string
    if not reading:
        return 0

    # Guard: Filter out non-Japanese characters
    # This handles edge cases where romaji or other chars slip through
    valid_chars = [c for c in reading if _is_japanese_kana(c)]

    if not valid_chars:
        return 0

    return sum(1 for char in valid_chars if char not in SMALL_KANA)


def split_into_morae(reading: str) -> list[str]:
    """Split reading into individual morae.

    Args:
        reading: Japanese reading in hiragana or katakana.

    Returns:
        List of mora strings. Returns empty list for empty or invalid input.
    """
    # Guard: Empty string
    if not reading:
        return []

    morae = []
    i = 0

    while i < len(reading):
        char = reading[i]

        # Guard: Skip non-Japanese characters
        if not _is_japanese_kana(char):
            i += 1
            continue

        # Check if next char is small kana (forms combined mora)
        if i + 1 < len(reading) and reading[i + 1] in SMALL_KANA:
            morae.append(char + reading[i + 1])
            i += 2
        else:
            morae.append(char)
            i += 1

    return morae
