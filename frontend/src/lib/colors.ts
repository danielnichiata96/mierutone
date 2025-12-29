/**
 * Riso color palette - Japanese Risograph inspired.
 *
 * Only 3 semantic colors: coral (HIGH), cornflower (LOW), black (text/neutral).
 * Confidence is indicated via stroke style, not color.
 */

// Core Riso palette (matches tailwind.config.js ink.* tokens)
export const RISO = {
  coral: "#FF99A0",      // HIGH pitch
  cornflower: "#82A8E5", // LOW pitch
  black: "#2A2A2A",      // Text, uncertain, neutral
  // Additional palette colors (use sparingly)
  mint: "#99E6C9",
  sunflower: "#FFC850",
} as const;

/**
 * Get fill color for pitch level.
 */
export function getPitchColor(pitch: "H" | "L" | "?"): string {
  switch (pitch) {
    case "H": return RISO.coral;
    case "L": return RISO.cornflower;
    case "?": return RISO.black;
  }
}

/**
 * Stroke style for confidence level (SVG).
 */
export function getConfidenceStroke(confidence: "high" | "medium" | "low"): {
  strokeDasharray: string;
  opacity: number;
} {
  switch (confidence) {
    case "high": return { strokeDasharray: "none", opacity: 1 };
    case "medium": return { strokeDasharray: "4,2", opacity: 0.85 };
    case "low": return { strokeDasharray: "2,2", opacity: 0.7 };
  }
}

// ============================================================================
// Pitch Rendering Constants
// ============================================================================

/** Y position for HIGH pitch (upper) */
export const PITCH_Y_HIGH = 10;
/** Y position for LOW pitch (lower) */
export const PITCH_Y_LOW = 35;
/** Y position for uncertain pitch (middle) */
export const PITCH_Y_UNCERTAIN = 22;

/** Default dot radius */
export const DOT_RADIUS = 5;
/** Active/playing dot radius */
export const DOT_RADIUS_ACTIVE = 9;

/** Stroke styles for special markers */
export const STROKE_STYLES = {
  particle: { dasharray: "6,4", width: 2 },
  dictionaryProper: { dasharray: "2,4", width: 2 },
  normal: { dasharray: "none", width: 1.5 },
  active: { dasharray: "none", width: 4 },
} as const;

/** Opacity levels */
export const OPACITY = {
  full: 1,
  dictionaryProper: 0.85,
  particle: 0.7,
  uncertain: 0.5,
  particleUncertain: 0.4,
} as const;
