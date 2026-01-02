"""Pitch pattern generation."""

from app.models.schemas import SourceType


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
        return ["L"] + ["H"] * (mora_count - 1)
    elif accent_type == 1:
        return ["H"] + ["L"] * (mora_count - 1)
    else:
        pattern = ["L"]
        for i in range(2, mora_count + 1):
            pattern.append("H" if i <= accent_type else "L")
        return pattern


def should_generate_pitch_pattern(source: SourceType) -> bool:
    """Determine if we should generate a pitch pattern for this source type."""
    # Particles, auxiliaries, and uncertain proper nouns don't get pitch patterns
    return source not in ("particle", "auxiliary", "proper_noun")
