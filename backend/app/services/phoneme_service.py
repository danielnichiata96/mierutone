"""Phoneme extraction service using pyopenjtalk."""

from functools import lru_cache

try:
    import pyopenjtalk
    PYOPENJTALK_AVAILABLE = True
except ImportError:
    PYOPENJTALK_AVAILABLE = False


# Mapping from pyopenjtalk phonemes to IPA
PHONEME_TO_IPA = {
    # Vowels
    "a": "a",
    "i": "i",
    "u": "ɯ",
    "e": "e",
    "o": "o",
    # Special vowels
    "A": "a",  # long vowel marker sometimes
    "I": "i",
    "U": "ɯ",
    "E": "e",
    "O": "o",
    # Consonants
    "k": "k",
    "g": "g",
    "s": "s",
    "z": "z",
    "t": "t",
    "d": "d",
    "n": "n",
    "h": "h",
    "b": "b",
    "p": "p",
    "m": "m",
    "y": "j",
    "r": "ɾ",
    "w": "w",
    # Affricates
    "ch": "t͡ɕ",
    "ts": "t͡s",
    "sh": "ɕ",
    "j": "d͡ʑ",
    # Special
    "N": "ɴ",  # moraic nasal (ん)
    "q": "ʔ",  # glottal stop (っ)
    "cl": "ʔ",  # another representation of っ
    "Q": "ʔ",
    # Fricatives
    "f": "ɸ",
    "v": "v",
    # Palatalized consonants
    "ky": "kʲ",
    "gy": "gʲ",
    "sy": "ɕ",
    "zy": "ʑ",
    "ty": "t͡ɕ",
    "dy": "d͡ʑ",
    "ny": "ɲ",
    "hy": "ç",
    "by": "bʲ",
    "py": "pʲ",
    "my": "mʲ",
    "ry": "ɾʲ",
    # Voiced fricatives
    "F": "ɸ",
    # Pause/silence
    "pau": "",
    "sil": "",
    "sp": "",
}


def phoneme_to_ipa(phoneme: str) -> str:
    """Convert a single pyopenjtalk phoneme to IPA."""
    # Check for exact match first
    if phoneme in PHONEME_TO_IPA:
        return PHONEME_TO_IPA[phoneme]

    # Check for palatalized consonants (2-char)
    if len(phoneme) >= 2 and phoneme[:2] in PHONEME_TO_IPA:
        return PHONEME_TO_IPA[phoneme[:2]]

    # Check for single char
    if len(phoneme) >= 1 and phoneme[0] in PHONEME_TO_IPA:
        return PHONEME_TO_IPA[phoneme[0]]

    # Return as-is if not found
    return phoneme


@lru_cache(maxsize=1000)
def extract_phonemes(text: str) -> str | None:
    """Extract IPA phonemes from Japanese text using pyopenjtalk.

    Args:
        text: Japanese text to analyze

    Returns:
        IPA transcription string, or None if pyopenjtalk not available
    """
    if not PYOPENJTALK_AVAILABLE:
        return None

    if not text:
        return None

    try:
        # Get full context labels from pyopenjtalk
        labels = pyopenjtalk.extract_fullcontext(text)

        phonemes = []
        for label in labels:
            # Extract phoneme from label (format: "xx^xx-PHONEME+xx=xx...")
            # The phoneme is between the - and + characters
            parts = label.split("-")
            if len(parts) >= 2:
                phoneme_part = parts[1].split("+")[0]
                if phoneme_part and phoneme_part not in ("pau", "sil", "sp"):
                    ipa = phoneme_to_ipa(phoneme_part)
                    if ipa:
                        phonemes.append(ipa)

        return "".join(phonemes) if phonemes else None

    except Exception:
        return None


def extract_phonemes_for_word(surface: str, reading: str) -> str | None:
    """Extract phonemes for a specific word.

    Uses reading (hiragana) for more accurate phoneme extraction.

    Args:
        surface: Original word (kanji/kana)
        reading: Hiragana reading of the word

    Returns:
        IPA transcription string
    """
    # Prefer reading for phoneme extraction (more reliable)
    return extract_phonemes(reading) or extract_phonemes(surface)


def is_available() -> bool:
    """Check if pyopenjtalk is available."""
    return PYOPENJTALK_AVAILABLE
