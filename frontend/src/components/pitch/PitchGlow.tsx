/**
 * PitchGlow - Animated glow effect for active/playing pitch points.
 */

import { RISO } from "@/lib/colors";

export interface PitchGlowProps {
  /** X position in SVG */
  x: number;
  /** Y position in SVG */
  y: number;
  /** Glow radius */
  radius?: number;
}

export function PitchGlow({ x, y, radius = 14 }: PitchGlowProps) {
  return (
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill="none"
      stroke={RISO.coral}
      strokeWidth="2"
      opacity="0.5"
      className="animate-pulse"
    />
  );
}
