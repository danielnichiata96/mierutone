"use client";

import type { WordPitch } from "@/types/pitch";
import { getAccentLabel, getSourceLabel, getConfidenceColor } from "@/types/pitch";
import { PlayButton } from "./PlayButton";

interface WordCardProps {
  word: WordPitch;
}

const ORIGIN_COLORS: Record<string, string> = {
  wago: "bg-emerald-100 text-emerald-700",
  kango: "bg-amber-100 text-amber-700",
  gairaigo: "bg-sky-100 text-sky-700",
  proper: "bg-violet-100 text-violet-700",
  mixed: "bg-slate-100 text-slate-600",
  symbol: "bg-gray-100 text-gray-500",
  unknown: "bg-gray-100 text-gray-400",
};

const ORIGIN_LABELS: Record<string, string> = {
  wago: "和語",
  kango: "漢語",
  gairaigo: "外来語",
  proper: "固有名詞",
  mixed: "混種語",
  symbol: "記号",
  unknown: "不明",
};

const CONFIDENCE_ICONS: Record<string, string> = {
  high: "●",
  medium: "◐",
  low: "○",
};

export function WordCard({ word }: WordCardProps) {
  const { morae, pitch_pattern, surface, reading, accent_type, mora_count, origin, origin_jp, lemma, source, confidence, warning } = word;

  if (!morae.length || !pitch_pattern.length) return null;

  const svgWidth = morae.length * 30;
  const svgHeight = 45;

  // Build points for polyline
  const points = pitch_pattern
    .map((pitch, i) => {
      const x = i * 30 + 15;
      const y = pitch === "H" ? 10 : 35;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="riso-card-interactive flex flex-col items-center min-w-[120px] relative group p-4">
      {/* Play button - top right */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <PlayButton text={surface} size="sm" />
      </div>

      {/* SVG Pitch Visualization */}
      <svg width={svgWidth} height={svgHeight + 25} className="mb-2">
        {/* Pitch line */}
        <polyline
          points={points}
          fill="none"
          stroke="#2A2A2A"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pitch dots */}
        {pitch_pattern.map((pitch, i) => {
          const x = i * 30 + 15;
          const y = pitch === "H" ? 10 : 35;
          const fillColor = pitch === "H" ? "#FF99A0" : "#82A8E5";

          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={5}
              fill={fillColor}
              stroke="#2A2A2A"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Mora text */}
        {morae.map((mora, i) => (
          <text
            key={i}
            x={i * 30 + 15}
            y={svgHeight + 20}
            textAnchor="middle"
            fontSize="16"
            fontWeight="500"
            fill="#2A2A2A"
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
        {pitch_pattern.join(" ")}
      </div>
      <div className="text-xs text-ink-black/50 mt-1.5 text-center font-medium">
        {getAccentLabel(accent_type, mora_count, word.part_of_speech)}
      </div>
      <div className="text-[10px] text-ink-black/40 mt-0.5 font-mono tracking-wide">
        {word.part_of_speech}
      </div>

      {/* Origin badge and Jisho link */}
      <div className="flex items-center gap-2 mt-2">
        {(origin || origin_jp) && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${origin ? (ORIGIN_COLORS[origin] || "bg-gray-100 text-gray-600") : "bg-gray-100 text-gray-600"}`}>
            {origin_jp || (origin && ORIGIN_LABELS[origin]) || origin || "Unknown"}
          </span>
        )}
        {lemma && (
          <a
            href={`https://jisho.org/search/${encodeURIComponent(lemma)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-ink-cornflower hover:text-ink-cornflower/80 hover:underline font-medium"
            title={`Look up ${lemma} on Jisho`}
          >
            {lemma}
          </a>
        )}
      </div>

      {/* Confidence indicator */}
      <div className="flex items-center gap-1.5 mt-2" title={`Source: ${getSourceLabel(source)}`}>
        <span className={`text-xs ${getConfidenceColor(confidence, source)}`}>
          {source === "particle" ? "◆" : source === "proper_noun" ? "★" : (CONFIDENCE_ICONS[confidence] || "○")}
        </span>
        <span className={`text-[10px] font-medium ${
          source === "particle" ? "text-violet-600" :
          source === "proper_noun" ? "text-amber-600" :
          "text-ink-black/40"
        }`}>
          {getSourceLabel(source)}
        </span>
      </div>

      {/* Warning indicator */}
      {warning && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded" title={warning}>
          <span>⚠</span>
          <span className="truncate max-w-[100px]">{warning}</span>
        </div>
      )}
    </div>
  );
}
