"use client";

import type { HomophoneCandidate } from "@/types/pitch";
import { getAccentLabel } from "@/types/pitch";
import { PitchDot, PitchCard, RISO, PITCH_Y_HIGH, PITCH_Y_LOW } from "./pitch";

interface HomophoneCardProps {
  candidate: HomophoneCandidate;
  voice?: string;
  rate?: number;
}

const ORIGIN_LABELS: Record<string, string> = {
  wago: "和語",
  kango: "漢語",
  gairaigo: "外来語",
  proper: "固有名詞",
  mixed: "混種語",
  symbol: "記号",
  unknown: "不明",
};

export function HomophoneCard({ candidate, voice, rate }: HomophoneCardProps) {
  const { surface, reading, morae, pitch_pattern, accent_type, mora_count, origin, origin_jp } = candidate;

  // Skip if no morae
  if (!morae.length) return null;

  const hasPitchData = pitch_pattern.length > 0;

  const svgWidth = morae.length * 30;
  const svgHeight = 45;

  // Build points for polyline
  const points = hasPitchData
    ? pitch_pattern
        .map((pitch, i) => {
          const x = i * 30 + 15;
          const y = pitch === "H" ? 10 : 35;
          return `${x},${y}`;
        })
        .join(" ")
    : "";

  return (
    <PitchCard surface={surface} size="md" voice={voice} rate={rate}>
      {/* Large Kanji display - prominent */}
      <div className="text-3xl font-bold text-ink-black font-sans mb-1 mt-4">{surface}</div>

      {/* Furigana reading */}
      <div className="text-sm text-ink-black/60 font-sans font-medium mb-3">{reading}</div>

      {/* SVG Pitch Visualization */}
      <svg width={svgWidth} height={svgHeight + 25} className="mb-2">
        {hasPitchData && (
          <>
            {/* Pitch line */}
            <polyline
              points={points}
              fill="none"
              stroke={RISO.black}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pitch dots */}
            {pitch_pattern.map((pitch, i) => (
              <PitchDot
                key={i}
                x={i * 30 + 15}
                y={pitch === "H" ? PITCH_Y_HIGH : PITCH_Y_LOW}
                pitch={pitch as "H" | "L"}
              />
            ))}
          </>
        )}

        {/* Mora text */}
        {morae.map((mora, i) => (
          <text
            key={i}
            x={i * 30 + 15}
            y={svgHeight + 20}
            textAnchor="middle"
            fontSize="16"
            fontWeight="500"
            fill={RISO.black}
            className="font-sans"
          >
            {mora}
          </text>
        ))}
      </svg>

      {/* Pitch pattern text */}
      <div className="font-mono text-xs tracking-wider text-ink-black/60 mt-1">
        {hasPitchData ? pitch_pattern.join(" ") : <span className="italic">Unknown</span>}
      </div>

      {/* Accent type label */}
      <div className="text-xs text-ink-black/50 mt-1.5 text-center font-medium">
        {hasPitchData ? getAccentLabel(accent_type, mora_count) : "Unknown"}
      </div>

      {/* Origin and Jisho link */}
      <div className="flex items-center gap-2 mt-2">
        {(origin || origin_jp) && (
          <span className="text-[10px] px-1.5 py-0.5 border border-ink-black/20 rounded font-medium text-ink-black/60">
            {origin_jp || (origin && ORIGIN_LABELS[origin]) || origin || "Unknown"}
          </span>
        )}
        <a
          href={`https://jisho.org/search/${encodeURIComponent(surface)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-ink-black/60 hover:text-ink-black hover:underline font-medium"
          title={`Look up ${surface} on Jisho`}
        >
          Jisho
        </a>
      </div>
    </PitchCard>
  );
}
