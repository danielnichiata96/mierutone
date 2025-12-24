"""Pitch accent analysis service using fugashi + unidic."""

import re
from functools import lru_cache

from fugashi import Tagger

from app.models.schemas import WordPitch


@lru_cache(maxsize=1)
def get_tagger() -> Tagger:
    """Get cached MeCab tagger instance."""
    return Tagger()


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
        # Heiban: L-H-H-H...
        return ["L"] + ["H"] * (mora_count - 1)
    elif accent_type == 1:
        # Atamadaka: H-L-L-L...
        return ["H"] + ["L"] * (mora_count - 1)
    else:
        # Nakadaka/Odaka: L-H-H-...-H-L
        pattern = ["L"]
        for i in range(2, mora_count + 1):
            pattern.append("H" if i <= accent_type else "L")
        return pattern


def parse_accent_type(atype_str: str | None) -> int | None:
    """Parse aType field from UniDic."""
    if not atype_str:
        return None

    first_value = atype_str.split(",")[0].strip()

    try:
        return int(first_value)
    except ValueError:
        return None


def kata_to_hira(text: str) -> str:
    """Convert katakana to hiragana."""
    result = []
    for char in text:
        code = ord(char)
        if 0x30A1 <= code <= 0x30F6:
            result.append(chr(code - 0x60))
        else:
            result.append(char)
    return "".join(result)


def extract_reading(word) -> str:
    """Extract hiragana reading from word features."""
    if hasattr(word.feature, 'kana') and word.feature.kana:
        return kata_to_hira(word.feature.kana)
    if hasattr(word.feature, 'pron') and word.feature.pron:
        return kata_to_hira(word.feature.pron)
    if hasattr(word.feature, 'lemma') and word.feature.lemma:
        return word.feature.lemma
    return word.surface


def get_pos(word) -> str:
    """Extract part of speech from word features."""
    if hasattr(word.feature, 'pos1') and word.feature.pos1:
        return word.feature.pos1
    return word.pos.split(",")[0] if word.pos else "Unknown"


# Mapping from UniDic goshu codes to English/Japanese labels
GOSHU_MAP = {
    "和": ("native", "和語"),      # Wago - native Japanese
    "漢": ("chinese", "漢語"),     # Kango - Chinese origin
    "外": ("foreign", "外来語"),   # Gairaigo - foreign loanword
    "固": ("proper", "固有名詞"),  # Koyuu - proper noun
    "混": ("mixed", "混種語"),     # Konshugo - mixed origin
    "記号": ("symbol", "記号"),    # Symbol
    "不明": ("unknown", "不明"),   # Unknown
}


def get_origin(word) -> tuple[str | None, str | None]:
    """Extract word origin (goshu) from word features.

    Returns:
        Tuple of (english_label, japanese_label) or (None, None) if not available.
    """
    if hasattr(word.feature, 'goshu') and word.feature.goshu:
        goshu = word.feature.goshu
        if goshu in GOSHU_MAP:
            return GOSHU_MAP[goshu]
        # Return raw value if not in map
        return (goshu, goshu)
    return (None, None)


def analyze_text(text: str) -> list[WordPitch]:
    """Analyze Japanese text and return pitch accent information."""
    tagger = get_tagger()
    words_result = []

    for word in tagger(text):
        surface = word.surface

        # Skip punctuation and whitespace
        if re.match(r'^[\s\u3000.,!?。、！？「」『』（）\(\)]+$', surface):
            continue

        reading = extract_reading(word)
        mora_count = count_morae(reading)
        morae = split_into_morae(reading)

        atype_raw = None
        if hasattr(word.feature, 'aType'):
            atype_raw = word.feature.aType

        accent_type = parse_accent_type(atype_raw)
        pitch_pattern = get_pitch_pattern(accent_type, mora_count)

        origin, origin_jp = get_origin(word)
        lemma = getattr(word.feature, 'lemma', None)

        words_result.append(WordPitch(
            surface=surface,
            reading=reading,
            accent_type=accent_type,
            mora_count=mora_count,
            morae=morae,
            pitch_pattern=pitch_pattern,
            part_of_speech=get_pos(word),
            origin=origin,
            origin_jp=origin_jp,
            lemma=lemma,
        ))

    return words_result
