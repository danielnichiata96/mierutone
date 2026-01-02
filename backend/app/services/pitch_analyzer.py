"""Pitch accent analysis service - backwards compatibility re-exports.

This module re-exports from the pitch package for backwards compatibility.
New code should import directly from app.services.pitch.
"""

# Re-export everything from the pitch package
from app.services.pitch import (
    # Main
    analyze_text,
    # Lookup
    lookup_pitch,
    lookup_homophones,
    is_homophone_lookup_candidate,
    is_pure_hiragana,
    normalize_for_homophone_lookup,
    PitchLookupResult,
    # Mora
    count_morae,
    split_into_morae,
    # Patterns
    get_pitch_pattern,
    should_generate_pitch_pattern,
    # Tokenizer
    get_tokenizer,
    get_pos,
    is_particle,
    is_auxiliary,
    is_particle_like,
    is_proper_noun,
    get_proper_noun_type,
    # Constants
    WARNINGS,
)

# Additional re-exports for test compatibility
from app.services.pitch.unidic import (
    UNIDIC_AVAILABLE,
    get_unidic_tagger,
    lookup_unidic_accent,
)
from app.services.pitch.confidence import (
    get_confidence_for_source,
    get_proper_noun_warning,
    get_lookup_warning,
)
from app.services.pitch.compound import (
    predict_compound_accent,
    predict_compound_iterative,
    is_component_reliable,
    analyze_compound,
    resolve_compound_pitch,
    CompoundAnalysis,
    ExpressionFallbackResult,
    analyze_expression_fallback,
)
from app.services.pitch.constants import (
    COMPOUND_VALID_POS,
    RELIABLE_SOURCES,
    HIGH_CONFIDENCE_SOURCES,
    MAX_HOMOPHONE_LENGTH,
)
from app.services.pitch.lookup import (
    get_db_connection,
    DB_PATH,
)

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
    "get_db_connection",
    "DB_PATH",
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
    # UniDic
    "UNIDIC_AVAILABLE",
    "get_unidic_tagger",
    "lookup_unidic_accent",
    # Confidence
    "get_confidence_for_source",
    "get_proper_noun_warning",
    "get_lookup_warning",
    # Compound
    "predict_compound_accent",
    "predict_compound_iterative",
    "is_component_reliable",
    "analyze_compound",
    "resolve_compound_pitch",
    "CompoundAnalysis",
    "ExpressionFallbackResult",
    "analyze_expression_fallback",
    # Constants
    "WARNINGS",
    "COMPOUND_VALID_POS",
    "RELIABLE_SOURCES",
    "HIGH_CONFIDENCE_SOURCES",
    "MAX_HOMOPHONE_LENGTH",
]
