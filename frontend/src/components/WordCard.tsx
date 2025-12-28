"use client";

import type { WordPitch } from "@/types/pitch";
import { getAccentLabel, getSourceLabel, getConfidenceBorderClass } from "@/types/pitch";
import { PitchDot, RISO, getConfidenceStroke, PITCH_Y_HIGH, PITCH_Y_LOW, PITCH_Y_UNCERTAIN } from "./pitch";
import { PlayButton } from "./PlayButton";

interface WordCardProps {
  word: WordPitch;
}

// Riso palette only - origin shown via text, not background color
const ORIGIN_STYLE = "text-ink-black/60";

const ORIGIN_LABELS: Record<string, string> = {
  wago: "和語",
  kango: "漢語",
  gairaigo: "外来語",
  proper: "固有名詞",
  mixed: "混種語",
  symbol: "記号",
  unknown: "不明",
};

// Confidence shown via border style, not color/icon
// high = solid, medium = dashed, low = dotted

export function WordCard({ word }: WordCardProps) {
  const { morae, pitch_pattern, surface, reading, accent_type, mora_count, origin, origin_jp, lemma, source, confidence, warning } = word;

  // Skip words with no morae (shouldn't happen normally)
  if (!morae.length) return null;

  // Check if we have pitch data
  const hasPitchData = pitch_pattern.length > 0;
  const isParticle = source === "particle";

  const svgWidth = morae.length * 30;
  const svgHeight = 45;

  // Build points for polyline (only if we have pitch data)
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
    <div className="riso-card-interactive flex flex-col items-center min-w-[120px] relative group p-4">
      {/* Play button - top right */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <PlayButton text={surface} size="sm" />
      </div>

      {/* SVG Pitch Visualization */}
      <svg width={svgWidth} height={svgHeight + 25} className="mb-2">
        {hasPitchData ? (
          <>
            {/* Pitch line - styled by confidence */}
            <polyline
              points={points}
              fill="none"
              stroke={RISO.black}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={getConfidenceStroke(confidence).strokeDasharray}
              opacity={getConfidenceStroke(confidence).opacity}
            />

            {/* Pitch dots - using shared PitchDot component */}
            {pitch_pattern.map((pitch, i) => (
              <PitchDot
                key={i}
                x={i * 30 + 15}
                y={pitch === "H" ? PITCH_Y_HIGH : PITCH_Y_LOW}
                pitch={pitch as "H" | "L"}
              />
            ))}
          </>
        ) : isParticle ? (
          /* Particle - dashed line to indicate follows context */
          <>
            <line
              x1={10}
              y1={PITCH_Y_UNCERTAIN}
              x2={svgWidth - 10}
              y2={PITCH_Y_UNCERTAIN}
              stroke={RISO.black}
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity={0.4}
            />
            <text
              x={svgWidth / 2}
              y={PITCH_Y_UNCERTAIN + 6}
              textAnchor="middle"
              fontSize="12"
              fill={RISO.black}
              opacity={0.6}
              className="font-sans"
            >
              ~
            </text>
          </>
        ) : (
          /* Unknown pitch - using shared PitchDot with isUncertain */
          morae.map((_, i) => (
            <PitchDot
              key={i}
              x={i * 30 + 15}
              y={PITCH_Y_UNCERTAIN}
              pitch="?"
              isUncertain
            />
          ))
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

      {/* Word info */}
      <div className="text-lg font-bold text-ink-black font-sans">{surface}</div>
      <div className="text-sm text-ink-black/60 font-sans font-medium">{reading}</div>
      <div className="font-mono text-xs tracking-wider text-ink-black/60 mt-1">
        {hasPitchData
          ? pitch_pattern.join(" ")
          : isParticle
            ? <span className="text-ink-black/50 italic">Follows context</span>
            : <span className="text-ink-black/50 italic">Pitch unknown</span>}
      </div>
      <div className="text-xs text-ink-black/50 mt-1.5 text-center font-medium">
        {hasPitchData
          ? getAccentLabel(accent_type, mora_count, word.part_of_speech)
          : isParticle
            ? "See Phrase Flow"
            : "Unknown"}
      </div>
      <div className="text-[10px] text-ink-black/40 mt-0.5 font-mono tracking-wide">
        {word.part_of_speech}
      </div>

      {/* Origin label and Jisho link - Riso colors only */}
      <div className="flex items-center gap-2 mt-2">
        {(origin || origin_jp) && (
          <span className={`text-[10px] px-1.5 py-0.5 border border-ink-black/20 rounded font-medium ${ORIGIN_STYLE}`}>
            {origin_jp || (origin && ORIGIN_LABELS[origin]) || origin || "Unknown"}
          </span>
        )}
        {lemma && (
          <a
            href={`https://jisho.org/search/${encodeURIComponent(lemma)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-ink-black/60 hover:text-ink-black hover:underline font-medium"
            title={`Look up ${lemma} on Jisho`}
          >
            {lemma}
          </a>
        )}
      </div>

      {/* Source indicator - Riso style with border for confidence */}
      <div
        className={`flex items-center gap-1.5 mt-2 px-2 py-0.5 border border-ink-black/30 rounded text-ink-black/60 ${getConfidenceBorderClass(confidence)}`}
        title={`Source: ${getSourceLabel(source)} | Confidence: ${confidence}`}
      >
        <span className="text-[10px] font-medium">
          {getSourceLabel(source)}
        </span>
      </div>

      {/* Warning indicator - ink-black with dotted border */}
      {warning && (
        <div
          className="flex items-center gap-1 mt-1 text-[10px] text-ink-black/60 border border-ink-black/30 border-dotted px-2 py-0.5 rounded"
          title={warning}
        >
          <span className="text-ink-black/40">!</span>
          <span className="truncate max-w-[100px]">{warning}</span>
        </div>
      )}
    </div>
  );
}
