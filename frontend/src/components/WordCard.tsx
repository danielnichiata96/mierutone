"use client";

import type { WordPitch, ComponentPitch } from "@/types/pitch";
import { getAccentLabel, getSourceLabel, getConfidenceBorderClass } from "@/types/pitch";
import { PitchDot, RISO, getConfidenceStroke, PITCH_Y_HIGH, PITCH_Y_LOW, PITCH_Y_UNCERTAIN } from "./pitch";
import { PlayButton } from "./PlayButton";

/**
 * Renders a single compound component in neutral/grey style.
 */
function CompoundComponent({ component }: { component: ComponentPitch }) {
  const accentLabel = component.accent_type === 0 ? "⁰" : component.accent_type ? `${component.accent_type}` : "?";
  return (
    <div
      className={`inline-flex items-baseline gap-0.5 px-1.5 py-0.5 rounded border ${
        component.reliable
          ? "border-ink-black/30 bg-ink-black/5"
          : "border-ink-black/20 bg-ink-black/5 border-dashed"
      }`}
      title={`${component.reading} | ${component.mora_count} mora | ${component.part_of_speech}${
        !component.reliable ? " (unreliable)" : ""
      }`}
    >
      <span className="text-sm font-medium text-ink-black/80">{component.surface}</span>
      <sup className="text-[10px] text-ink-black/50">{accentLabel}</sup>
    </div>
  );
}

export interface DisplayPreferences {
  showAccentNumbers?: boolean;
  showPartOfSpeech?: boolean;
  showConfidence?: boolean;
  voice?: string;
  rate?: number;
}

interface WordCardProps {
  word: WordPitch;
  displayPrefs?: DisplayPreferences;
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

export function WordCard({ word, displayPrefs = {} }: WordCardProps) {
  const {
    showAccentNumbers = true,
    showPartOfSpeech = false,
    showConfidence = true,
    voice,
    rate,
  } = displayPrefs;

  const { morae, pitch_pattern, surface, reading, accent_type, mora_count, origin, origin_jp, lemma, source, confidence, warning } = word;

  // Skip words with no morae (shouldn't happen normally)
  if (!morae.length) return null;

  // Check if we have pitch data
  const hasPitchData = pitch_pattern.length > 0;
  // Particles (助詞) and auxiliaries (助動詞) both follow context pitch
  const isParticleLike = source === "particle" || source === "auxiliary";

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
        <PlayButton text={surface} size="sm" voice={voice} rate={rate} />
      </div>

      {/* SVG Pitch Visualization - mt-4 creates space for play button */}
      <svg width={svgWidth} height={svgHeight + 25} className="mb-2 mt-4">
        {hasPitchData ? (
          <>
            {/* Pitch line - styled by confidence (when enabled) */}
            <polyline
              points={points}
              fill="none"
              stroke={RISO.black}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={showConfidence ? getConfidenceStroke(confidence).strokeDasharray : undefined}
              opacity={showConfidence ? getConfidenceStroke(confidence).opacity : 1}
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
        ) : isParticleLike ? (
          /* Particle/Auxiliary - dashed line to indicate follows context */
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
          : isParticleLike
            ? <span className="text-ink-black/50 italic">Follows context</span>
            : <span className="text-ink-black/50 italic">Pitch unknown</span>}
      </div>
      {showAccentNumbers && (
        <div className="text-xs text-ink-black/50 mt-1.5 text-center font-medium">
          {hasPitchData
            ? getAccentLabel(accent_type, mora_count, word.part_of_speech)
            : isParticleLike
              ? "See Phrase Flow"
              : "Unknown"}
        </div>
      )}
      {showPartOfSpeech && (
        <div className="text-[10px] text-ink-black/40 mt-0.5 font-mono tracking-wide">
          {word.part_of_speech}
        </div>
      )}

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
      {showConfidence && (
        <div
          className={`flex items-center gap-1.5 mt-2 px-2 py-0.5 border border-ink-black/30 rounded text-ink-black/60 ${getConfidenceBorderClass(confidence)}`}
          title={`Source: ${getSourceLabel(source)} | Confidence: ${confidence}`}
        >
          <span className="text-[10px] font-medium">
            {getSourceLabel(source)}
          </span>
        </div>
      )}

      {/* Warning indicator - ink-black with dotted border */}
      {warning && (
        <div
          className="flex items-center gap-1 mt-1 text-[10px] text-ink-black/60 border border-ink-black/30 border-dotted px-2 py-0.5 rounded max-w-full"
          title={warning}
        >
          <span className="text-ink-black/40 shrink-0">!</span>
          <span className="text-center">{warning}</span>
        </div>
      )}

      {/* Compound breakdown - shown when word has components */}
      {word.is_compound && word.components && word.components.length > 0 && (
        <div className="mt-3 pt-2 border-t border-ink-black/10 w-full">
          <div className="text-[10px] text-ink-black/50 mb-1.5 font-medium">
            Components
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {word.components.map((comp, i) => (
              <span key={i} className="inline-flex items-center">
                {i > 0 && <span className="text-ink-black/30 mx-0.5 text-xs">+</span>}
                <CompoundComponent component={comp} />
              </span>
            ))}
          </div>
          {/* Prediction status indicator - only for compound_rule source */}
          {source === "compound_rule" ? (
            word.accent_type !== null ? (
              <div className="text-[10px] text-ink-black/50 mt-1.5 italic text-center">
                Accent predicted (McCawley)
              </div>
            ) : (
              <div className="text-[10px] text-ink-black/50 mt-1.5 italic text-center flex items-center justify-center gap-1">
                <span className="text-ink-black/40">?</span>
                <span>Cannot predict - verify with native</span>
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
