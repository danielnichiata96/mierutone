/**
 * PitchDot - Shared component for rendering a pitch point.
 *
 * Renders either:
 * - A colored dot (coral=H, cornflower=L) with appropriate stroke style
 * - A "?" text for uncertain pitch
 */

import {
  RISO,
  getPitchColor,
  DOT_RADIUS,
  DOT_RADIUS_ACTIVE,
  STROKE_STYLES,
  OPACITY,
} from "@/lib/colors";

export interface PitchDotProps {
  /** X position in SVG */
  x: number;
  /** Y position in SVG */
  y: number;
  /** Pitch level */
  pitch: "H" | "L" | "?";
  /** Whether this point is uncertain (proper noun without dictionary) */
  isUncertain?: boolean;
  /** Whether this is a particle (inherits pitch from context) */
  isParticle?: boolean;
  /** Whether this is a dictionary proper noun (has pitch but may vary) */
  isDictionaryProper?: boolean;
  /** Whether this point is currently active/playing */
  isActive?: boolean;
}

export function PitchDot({
  x,
  y,
  pitch,
  isUncertain = false,
  isParticle = false,
  isDictionaryProper = false,
  isActive = false,
}: PitchDotProps) {
  // Determine stroke style
  const getStrokeStyle = () => {
    if (isActive) return STROKE_STYLES.active;
    if (isParticle) return STROKE_STYLES.particle;
    if (isDictionaryProper) return STROKE_STYLES.dictionaryProper;
    return STROKE_STYLES.normal;
  };

  // Determine opacity
  const getOpacity = () => {
    if (isUncertain && isParticle) return OPACITY.particleUncertain;
    if (isUncertain) return OPACITY.uncertain;
    if (isParticle) return OPACITY.particle;
    if (isDictionaryProper) return OPACITY.dictionaryProper;
    return OPACITY.full;
  };

  const strokeStyle = getStrokeStyle();
  const opacity = getOpacity();
  const radius = isActive ? DOT_RADIUS_ACTIVE : DOT_RADIUS;
  const strokeColor = isActive ? RISO.coral : RISO.black;

  // Render "?" for uncertain pitch
  if (isUncertain) {
    return (
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fontSize="16"
        fontWeight="600"
        fill={RISO.black}
        opacity={opacity}
      >
        ?
      </text>
    );
  }

  // Render dot
  return (
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill={getPitchColor(pitch)}
      stroke={strokeColor}
      strokeWidth={strokeStyle.width}
      strokeDasharray={strokeStyle.dasharray}
      opacity={opacity}
      className={isActive ? "transition-all duration-75" : ""}
    />
  );
}
