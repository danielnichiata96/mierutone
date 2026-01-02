"""Pitch accent analysis package.

This package provides Japanese pitch accent analysis using:
- SudachiPy for tokenization (Mode C for compounds)
- Kanjium SQLite database for pitch lookups
- UniDic for cross-validation (optional)
- McCawley rules for compound prediction
"""

# Main analyzer function
from .analyzer import analyze_text

# Lookup functions
from .lookup import (
    lookup_pitch,
    lookup_homophones,
    is_homophone_lookup_candidate,
    is_pure_hiragana,
    normalize_for_homophone_lookup,
    PitchLookupResult,
)

# Mora utilities
from .mora import count_morae, split_into_morae

# Pattern generation
from .patterns import get_pitch_pattern, should_generate_pitch_pattern

# Tokenizer utilities
from .tokenizer import (
    get_tokenizer,
    get_pos,
    is_particle,
    is_auxiliary,
    is_particle_like,
    is_proper_noun,
    get_proper_noun_type,
)

# Constants
from .constants import WARNINGS

__all__ = [
    # Main
    "analyze_text",
    # Lookup
    "lookup_pitch",
    "lookup_homophones",
    "is_homophone_lookup_candidate",
    "is_pure_hiragana",
    "normalize_for_homophone_lookup",
    "PitchLookupResult",
    # Mora
    "count_morae",
    "split_into_morae",
    # Patterns
    "get_pitch_pattern",
    "should_generate_pitch_pattern",
    # Tokenizer
    "get_tokenizer",
    "get_pos",
    "is_particle",
    "is_auxiliary",
    "is_particle_like",
    "is_proper_noun",
    "get_proper_noun_type",
    # Constants
    "WARNINGS",
]
