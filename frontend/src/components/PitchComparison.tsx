"use client";

import { useMemo } from "react";
import type { CompareResponse } from "@/lib/api";
import { RISO } from "@/lib/colors";

interface PitchComparisonProps {
  result: CompareResponse;
}

export function PitchComparison({ result }: PitchComparisonProps) {
  const { score, feedback, aligned_native, aligned_user } = result;

  // Generate SVG paths
  const { nativePath, userPath, width, height } = useMemo(() => {
    const padding = 20;
    const w = 600;
    const h = 200;

    const all = [...aligned_native, ...aligned_user];
    const minVal = Math.min(...all);
    const maxVal = Math.max(...all);
    const range = maxVal - minVal || 1;

    const scaleX = (i: number, arr: number[]) => {
      const divisor = arr.length - 1;
      if (divisor <= 0) return w / 2; // Center single point
      return padding + (i / divisor) * (w - 2 * padding);
    };

    const scaleY = (val: number) =>
      h - padding - ((val - minVal) / range) * (h - 2 * padding);

    const toPath = (arr: number[]) =>
      arr
        .map((val, i) => `${i === 0 ? "M" : "L"} ${scaleX(i, arr)} ${scaleY(val)}`)
        .join(" ");

    return {
      nativePath: toPath(aligned_native),
      userPath: toPath(aligned_user),
      width: w,
      height: h,
    };
  }, [aligned_native, aligned_user]);

  // Score color
  const scoreColor = useMemo(() => {
    if (score >= 80) return "text-secondary-500";
    if (score >= 60) return "text-energy-500";
    return "text-accent-500";
  }, [score]);

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="text-center border-b-2 border-ink-black/10 pb-6">
        <div className={`text-6xl font-display font-bold ${scoreColor}`}>
          {score}
        </div>
        <div className="text-sm text-ink-black/50 mt-1 font-mono">/ 100</div>
        <p className="mt-3 text-ink-black/70 font-sans font-medium">{feedback}</p>
      </div>

      {/* Pitch comparison visualization */}
      <div className="bg-paper-white rounded-riso-lg p-4 border-2 border-dashed border-ink-black/20">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={20}
              x2={width - 20}
              y1={height * ratio}
              y2={height * ratio}
              stroke={RISO.black}
              strokeOpacity={0.1}
              strokeDasharray="4 4"
            />
          ))}

          {/* Native pitch - "The Road" */}
          <path
            d={nativePath}
            fill="none"
            stroke={RISO.coral}
            strokeWidth={8}
            strokeOpacity={0.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* User pitch - "The Trail" */}
          <path
            d={userPath}
            fill="none"
            stroke={RISO.cornflower}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm font-medium">
          <div className="flex items-center gap-2">
            <div className="w-6 h-2 bg-accent-500/40 rounded" />
            <span className="text-ink-black/60">Native (target)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-primary-500 rounded" />
            <span className="text-ink-black/60">Your voice</span>
          </div>
        </div>
      </div>

      {/* Tips based on score */}
      {score < 80 && (
        <div className="text-sm text-ink-black/60 bg-energy-300/30 rounded-riso-lg p-4 border-2 border-energy-500/30">
          <strong className="text-ink-black/80">Tip:</strong>{" "}
          {score < 50
            ? "Listen to the native audio first, then try to match the melody pattern."
            : "Focus on matching the high and low points of the pitch curve."
          }
        </div>
      )}
    </div>
  );
}
