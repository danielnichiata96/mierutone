"""Confidence and warning decision rules."""

from app.models.schemas import SourceType, ConfidenceType
from .constants import WARNINGS


def get_confidence_for_source(
    source: SourceType,
    sources_agree: bool | None = None,
) -> ConfidenceType:
    """Determine confidence level based on source type and cross-validation.

    Cross-validation rules:
    - If Kanjium and UniDic agree → boost confidence
    - If they disagree → reduce confidence (can't trust either fully)
    - If only one source → use base confidence

    Args:
        source: The primary data source
        sources_agree: True if Kanjium and UniDic agree, False if disagree, None if single source
    """
    # Base confidence by source type
    if source == "dictionary":
        base = "high"
    elif source in ("dictionary_lemma", "dictionary_proper", "expression_parts"):
        base = "medium"
    elif source in ("particle", "auxiliary"):
        return "high"  # Particles/auxiliaries don't need cross-validation
    else:  # dictionary_reading, dictionary_unidic, unidic_proper, rule, proper_noun, unknown
        base = "low"

    # Cross-validation: adjust confidence based on agreement
    if sources_agree is True:
        # Sources agree → boost confidence
        if base == "low":
            return "medium"
        elif base == "medium":
            return "high"
        # high stays high
    elif sources_agree is False:
        # Sources disagree → reduce confidence (conflicting data)
        if base == "high":
            return "medium"
        elif base == "medium":
            return "low"
        # low stays low

    return base


def get_proper_noun_warning(
    noun_type: str | None,
    source: SourceType,
) -> str:
    """Get appropriate warning for a proper noun based on its source."""
    # In Kanjium dictionary
    if source == "dictionary_proper":
        if noun_type == "人名":
            return WARNINGS["proper_name_dict"]
        elif noun_type == "地名":
            return WARNINGS["proper_place_dict"]
        else:
            return WARNINGS["proper_other_dict"]
    # In UniDic only (not in Kanjium)
    elif source == "unidic_proper":
        if noun_type == "人名":
            return WARNINGS["proper_name_unidic"]
        elif noun_type == "地名":
            return WARNINGS["proper_place_unidic"]
        else:
            return WARNINGS["proper_other_unidic"]
    # Not in any dictionary
    else:
        if noun_type == "人名":
            return WARNINGS["proper_name_unknown"]
        elif noun_type == "地名":
            return WARNINGS["proper_place_unknown"]
        else:
            return WARNINGS["proper_other_unknown"]


def get_lookup_warning(
    source: SourceType,
    has_multiple_patterns: bool,
    sources_agree: bool | None = None,
) -> str | None:
    """Get warning for lookup quality issues."""
    # Cross-validation disagreement is highest priority warning
    if sources_agree is False:
        return WARNINGS["sources_disagree"]
    # Then check other quality issues
    if has_multiple_patterns:
        return WARNINGS["multiple_patterns"]
    elif source == "dictionary_unidic":
        return WARNINGS["unidic_only"]
    elif source == "dictionary_reading":
        return WARNINGS["reading_only"]
    elif source == "rule":
        return WARNINGS["rule_based"]
    return None
