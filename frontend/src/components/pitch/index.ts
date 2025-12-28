/**
 * Pitch visualization components and utilities.
 *
 * Shared between WordCard and PhraseFlow to prevent divergence.
 */

export { PitchDot, type PitchDotProps } from "./PitchDot";
export { PitchGlow, type PitchGlowProps } from "./PitchGlow";

// Re-export color utilities for convenience
export {
  RISO,
  getPitchColor,
  getConfidenceStroke,
  PITCH_Y_HIGH,
  PITCH_Y_LOW,
  PITCH_Y_UNCERTAIN,
  DOT_RADIUS,
  DOT_RADIUS_ACTIVE,
  STROKE_STYLES,
  OPACITY,
} from "@/lib/colors";

/**
 * Calculate Y position for a pitch value.
 */
export function getPitchY(pitch: "H" | "L" | "?", isUncertain: boolean = false): number {
  if (isUncertain || pitch === "?") return 22; // middle
  return pitch === "H" ? 10 : 35;
}
