"""Main pitch accent analyzer - orchestrates all modules."""

import re

import jaconv
from sudachipy import tokenizer

from app.models.schemas import WordPitch, SourceType, ConfidenceType
from .constants import WARNINGS, HIGH_CONFIDENCE_SOURCES
from .mora import count_morae, split_into_morae
from .tokenizer import (
    get_tokenizer,
    get_pos,
    is_particle,
    is_auxiliary,
    is_particle_like,
    is_proper_noun,
    get_proper_noun_type,
)
from .patterns import get_pitch_pattern, should_generate_pitch_pattern
from .confidence import (
    get_confidence_for_source,
    get_proper_noun_warning,
    get_lookup_warning,
)
from .lookup import lookup_pitch, PitchLookupResult
from .compound import (
    analyze_compound,
    analyze_expression_fallback,
    resolve_compound_pitch,
)


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

        pos = get_pos(token)

        # Determine source, confidence, warning using decision rules
        source: SourceType
        confidence: ConfidenceType
        warning: str | None

        if is_particle(pos):
            # Particles inherit pitch from context - don't look up
            source = "particle"
            confidence = "high"  # Confident it IS a particle
            warning = None
            lookup_result = PitchLookupResult(None, None, None, source="particle")

        elif is_auxiliary(pos):
            # Auxiliary verbs also inherit pitch from context - don't look up
            source = "auxiliary"
            confidence = "high"  # Confident it IS an auxiliary verb
            warning = None
            lookup_result = PitchLookupResult(None, None, None, source="auxiliary")

        elif is_proper_noun(token):
            # Try dictionary first, then decide based on result
            lookup_result = lookup_pitch(surface, reading_hira, lemma, normalized)
            noun_type = get_proper_noun_type(token)

            # Determine source based on where the data came from
            if lookup_result.source == "dictionary_unidic":
                # Found in UniDic only, not in Kanjium
                source = "unidic_proper"
                confidence = get_confidence_for_source(source, lookup_result.sources_agree)
            elif lookup_result.source != "unknown" and lookup_result.accent_type is not None:
                # Found in Kanjium
                source = "dictionary_proper"
                confidence = get_confidence_for_source(source, lookup_result.sources_agree)
            else:
                # Not in any dictionary
                source = "proper_noun"
                confidence = "low"
                lookup_result = PitchLookupResult(None, None, None, source="proper_noun")

            # Proper nouns get their own warning, but disagreement takes priority
            if lookup_result.sources_agree is False:
                warning = WARNINGS["sources_disagree"]
            else:
                warning = get_proper_noun_warning(noun_type, source)

        else:
            # Regular word - look up in database
            lookup_result = lookup_pitch(surface, reading_hira, lemma, normalized)
            source = lookup_result.source

            # No match → use rule-based
            if lookup_result.accent_type is None and source == "unknown":
                source = "rule"

            # Pass cross-validation result for confidence and warning
            confidence = get_confidence_for_source(source, lookup_result.sources_agree)
            warning = get_lookup_warning(
                source, lookup_result.has_multiple_patterns, lookup_result.sources_agree
            )

        # Compound analysis: check if this word splits into components
        compound_analysis = None
        expression_fallback = None
        components = None
        is_compound = False
        final_accent_type = lookup_result.accent_type

        # Only analyze compounds for non-particles/auxiliaries and non-proper-nouns
        if not is_particle_like(pos) and not is_proper_noun(token):
            compound_in_dict = source in HIGH_CONFIDENCE_SOURCES
            compound_analysis = analyze_compound(token, compound_in_dict)

            if compound_analysis is not None:
                is_compound = True
                components = compound_analysis.components

                # Resolve final pitch using extracted decision logic
                final_accent_type, source, confidence, warning = resolve_compound_pitch(
                    compound_analysis,
                    compound_in_dict,
                    lookup_result.accent_type,
                    source,
                    confidence,
                    warning,
                )

        # Expression fallback: if lookup failed and no compound analysis helped,
        # try splitting with Mode A and analyzing parts
        if (source == "rule" or final_accent_type is None) and not is_compound and not is_particle_like(pos) and not is_proper_noun(token):
            expression_fallback = analyze_expression_fallback(token)

            if expression_fallback is not None and expression_fallback.success:
                # Use the combined pattern from parts
                is_compound = True  # Show as compound for UI
                components = expression_fallback.components
                pitch_pattern = expression_fallback.combined_pattern
                source = "expression_parts"
                confidence = get_confidence_for_source(source)
                warning = WARNINGS["expression_parts"]
                # Set accent_type to None since it's a combined pattern
                final_accent_type = None

        # Generate pitch pattern only for appropriate sources
        if expression_fallback is None or not expression_fallback.success:
            pitch_pattern = (
                get_pitch_pattern(final_accent_type, mora_count)
                if should_generate_pitch_pattern(source) and final_accent_type is not None
                else []
            )

        words_result.append(WordPitch(
            surface=surface,
            reading=reading_hira,
            accent_type=final_accent_type,
            mora_count=mora_count,
            morae=morae,
            pitch_pattern=pitch_pattern,
            part_of_speech=pos,
            origin=lookup_result.goshu,
            origin_jp=lookup_result.goshu_jp,
            lemma=lemma if lemma != surface else None,
            source=source,
            confidence=confidence,
            warning=warning,
            is_compound=is_compound,
            components=components,
        ))

    return words_result
