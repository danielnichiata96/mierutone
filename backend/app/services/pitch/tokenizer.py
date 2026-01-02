"""SudachiPy tokenizer and POS utilities."""

from functools import lru_cache

from sudachipy import dictionary


@lru_cache(maxsize=1)
def get_tokenizer():
    """Get cached SudachiPy tokenizer instance."""
    return dictionary.Dictionary().create()


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
