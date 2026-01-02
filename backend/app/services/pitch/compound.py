"""Compound word analysis using McCawley rules."""

import logging

import jaconv
from sudachipy import tokenizer

from app.models.schemas import ComponentPitch, SourceType, ConfidenceType
from .constants import (
    WARNINGS,
    COMPOUND_VALID_POS,
    RELIABLE_SOURCES,
    HIGH_CONFIDENCE_SOURCES,
)
from .mora import count_morae
from .patterns import get_pitch_pattern
from .tokenizer import get_pos, is_particle_like
from .lookup import lookup_pitch, PitchLookupResult

logger = logging.getLogger(__name__)


def is_component_reliable(pitch_result: PitchLookupResult, pos: str) -> bool:
    """Check if a component is reliable enough for compound prediction."""
    if pos not in COMPOUND_VALID_POS:
        return False  # Filter particles, suffixes, etc.
    if pitch_result.source not in RELIABLE_SOURCES:
        return False  # Unreliable sources
    if pitch_result.accent_type is None:
        return False  # No accent data
    return True


def predict_compound_accent(
    n1_morae: int,
    n2_morae: int,
    n2_accent: int | None
) -> int | None:
    """Apply McCawley rules to predict compound accent.

    McCawley Compound Accent Rules (Tokyo Dialect):
    - N2 ≤ 2 morae: accent on last mora of N1
    - N2 3-4 morae: accent on first mora of N2
    - N2 ≥ 5 morae: follow N2's original accent (offset by N1)
    """
    if n2_morae <= 2:
        # N2 short → accent on last mora of N1
        return n1_morae
    elif n2_morae in (3, 4):
        # N2 medium → accent on first mora of N2
        return n1_morae + 1
    else:  # n2_morae >= 5
        # N2 long → follow N2's original accent, offset by N1
        if n2_accent is None or n2_accent == 0:
            return None  # Can't predict heiban compounds reliably
        return n1_morae + n2_accent


def predict_compound_iterative(components: list[ComponentPitch]) -> int | None:
    """Apply McCawley rules iteratively for multi-part compounds."""
    if len(components) < 2:
        return None

    # Start with first component
    accumulated_morae = components[0].mora_count

    logger.debug(
        f"Compound prediction start: {components[0].surface} "
        f"({accumulated_morae} mora, accent={components[0].accent_type})"
    )

    # Apply rules pairwise: (N1+N2)→N12, (N12+N3)→N123, etc.
    new_accent = None
    for i in range(1, len(components)):
        n2 = components[i]
        new_accent = predict_compound_accent(
            accumulated_morae, n2.mora_count, n2.accent_type
        )

        logger.debug(
            f"Compound step {i}: {accumulated_morae} mora + "
            f"{n2.surface}({n2.mora_count} mora, accent={n2.accent_type}) "
            f"→ predicted accent={new_accent}"
        )

        if new_accent is None:
            return None  # Can't predict if any step fails

        accumulated_morae += n2.mora_count

    return new_accent


class CompoundAnalysis:
    """Result of compound word analysis."""
    __slots__ = ("components", "predicted_accent", "used_prediction", "all_reliable")

    def __init__(
        self,
        components: list[ComponentPitch],
        predicted_accent: int | None,
        used_prediction: bool,
        all_reliable: bool,
    ):
        self.components = components
        self.predicted_accent = predicted_accent
        self.used_prediction = used_prediction
        self.all_reliable = all_reliable


def resolve_compound_pitch(
    compound_analysis: CompoundAnalysis,
    compound_in_dict: bool,
    original_accent: int | None,
    original_source: SourceType,
    original_confidence: ConfidenceType,
    original_warning: str | None,
) -> tuple[int | None, SourceType, ConfidenceType, str | None]:
    """Resolve final pitch info for a compound word."""
    if compound_analysis.used_prediction:
        # Prediction succeeded
        return (
            compound_analysis.predicted_accent,
            "compound_rule",
            "low",
            WARNINGS["compound_rule"],
        )
    elif not compound_in_dict and compound_analysis.all_reliable:
        # Prediction was attempted but failed (e.g., N2≥5 heiban)
        return (
            None,
            "compound_rule",
            "low",
            WARNINGS["compound_unpredictable"],
        )
    else:
        # Use original (dict value or couldn't attempt prediction)
        return (original_accent, original_source, original_confidence, original_warning)


def analyze_compound(token, compound_in_dict: bool) -> CompoundAnalysis | None:
    """Split a compound word and analyze each component."""
    # Split using Mode A (smallest units)
    parts = token.split(tokenizer.Tokenizer.SplitMode.A)
    if len(parts) <= 1:
        return None  # Not a compound

    # Filter by POS - only keep nouns, verbs, adjectives
    filtered_parts = [p for p in parts if get_pos(p) in COMPOUND_VALID_POS]
    if len(filtered_parts) < 2:
        return None  # Not enough valid components

    # Look up pitch for each component
    components: list[ComponentPitch] = []
    all_reliable = True

    for part in filtered_parts:
        reading_hira = jaconv.kata2hira(part.reading_form())
        pos = get_pos(part)
        lemma = part.dictionary_form()
        normalized = part.normalized_form()

        pitch = lookup_pitch(part.surface(), reading_hira, lemma, normalized)
        reliable = is_component_reliable(pitch, pos)

        if not reliable:
            all_reliable = False

        components.append(ComponentPitch(
            surface=part.surface(),
            reading=reading_hira,
            accent_type=pitch.accent_type,
            mora_count=count_morae(reading_hira),
            part_of_speech=pos,
            reliable=reliable,
        ))

    # Only predict if compound NOT in dictionary AND all components reliable
    predicted_accent = None
    can_predict = not compound_in_dict and all_reliable and len(components) >= 2

    if can_predict:
        predicted_accent = predict_compound_iterative(components)
        logger.debug(
            f"Compound '{token.surface()}': components={[c.surface for c in components]}, "
            f"predicted_accent={predicted_accent}"
        )

    return CompoundAnalysis(
        components=components,
        predicted_accent=predicted_accent,
        used_prediction=can_predict and predicted_accent is not None,
        all_reliable=all_reliable,
    )


class ExpressionFallbackResult:
    """Result of expression fallback analysis using Mode A split."""
    __slots__ = ("components", "combined_pattern", "success")

    def __init__(
        self,
        components: list[ComponentPitch],
        combined_pattern: list[str],
        success: bool,
    ):
        self.components = components
        self.combined_pattern = combined_pattern
        self.success = success


def analyze_expression_fallback(token) -> ExpressionFallbackResult | None:
    """Fallback analysis for expressions not found in dictionary."""
    # Split using Mode A (smallest units)
    parts = token.split(tokenizer.Tokenizer.SplitMode.A)
    if len(parts) <= 1:
        return None  # Can't split further

    components: list[ComponentPitch] = []
    combined_pattern: list[str] = []
    has_known_accent = False

    for part in parts:
        reading_hira = jaconv.kata2hira(part.reading_form())
        pos = get_pos(part)
        lemma = part.dictionary_form()
        normalized = part.normalized_form()

        # Look up pitch for this part
        pitch = lookup_pitch(part.surface(), reading_hira, lemma, normalized)

        mora_count = count_morae(reading_hira)

        # Determine if this part has reliable pitch data
        reliable = pitch.source in RELIABLE_SOURCES and pitch.accent_type is not None
        if reliable:
            has_known_accent = True

        # Generate pattern for this part
        if mora_count == 0:
            part_pattern = []  # Skip empty readings
        elif pitch.accent_type is not None:
            part_pattern = get_pitch_pattern(pitch.accent_type, mora_count)
        elif is_particle_like(pos):
            # Particles/auxiliaries: follow the previous pitch
            part_pattern = ["H"] * mora_count if combined_pattern and combined_pattern[-1] == "H" else ["L"] * mora_count
        else:
            # Unknown: default to heiban-like (L then H)
            part_pattern = ["L"] + ["H"] * (mora_count - 1) if mora_count > 1 else ["H"]

        combined_pattern.extend(part_pattern)

        components.append(ComponentPitch(
            surface=part.surface(),
            reading=reading_hira,
            accent_type=pitch.accent_type,
            mora_count=mora_count,
            part_of_speech=pos,
            reliable=reliable,
        ))

    # Only return if we found at least one part with known accent
    if not has_known_accent:
        return None

    return ExpressionFallbackResult(
        components=components,
        combined_pattern=combined_pattern,
        success=True,
    )
