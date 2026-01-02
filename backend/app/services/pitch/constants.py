"""Constants and warning messages for pitch analysis."""

from app.models.schemas import SourceType

# Warning Messages (centralized for consistency and future i18n)
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
    # Compound prediction
    "compound_rule": "Compound accent predicted - verify with native speaker",
    "compound_unpredictable": "Compound accent unpredictable - verify with native speaker",
    # Expression fallback
    "expression_parts": "Analyzed by splitting into parts",
}

# Valid POS for compound components
# 名詞: Required - 90% of McCawley compounds are noun-based
# 動詞/形容詞: Keep - appear as stems in compounds (出口, 早起き)
# Exclude: 副詞 (noise), 連体詞 (maintain tonal independence)
COMPOUND_VALID_POS = {"名詞", "動詞", "形容詞"}

# Sources reliable enough for compound prediction
# Excludes dictionary_reading to avoid propagating low-confidence
RELIABLE_SOURCES: set[SourceType] = {
    "dictionary", "dictionary_lemma",
    "dictionary_unidic", "dictionary_proper", "unidic_proper"
}

# High confidence sources - compound is "in dictionary" if source is one of these
HIGH_CONFIDENCE_SOURCES: set[SourceType] = {
    "dictionary", "dictionary_lemma", "dictionary_unidic",
    "dictionary_proper", "unidic_proper"
}

# Maximum length for homophone lookup (longer inputs are likely sentences)
MAX_HOMOPHONE_LENGTH = 10
