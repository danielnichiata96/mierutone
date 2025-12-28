"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { WordPitch } from "@/types/pitch";
import { getAccentTypeName } from "@/types/pitch";
import { getTTSWithTimings, type WordTiming } from "@/lib/api";

interface PhraseFlowProps {
  words: WordPitch[];
}

interface MoraPoint {
  mora: string;
  pitch: "H" | "L" | "?";  // "?" for uncertain (proper nouns without dictionary)
  wordIndex: number;
  isParticle: boolean;
  isUncertain: boolean;  // true for proper nouns without dictionary entry
  surface: string;
}

/**
 * Determines the pitch of a particle based on the preceding word's accent type.
 */
function getParticlePitch(prevWord: WordPitch | null): "H" | "L" {
  if (!prevWord) return "L";

  const accentType = getAccentTypeName(prevWord.accent_type, prevWord.mora_count);

  if (accentType === "heiban") return "H";
  if (accentType === "odaka") return "L";

  return "L";
}

function isParticle(word: WordPitch): boolean {
  return word.part_of_speech === "助詞" || word.part_of_speech === "助動詞";
}

/**
 * Find the last non-particle word before the given index.
 * This is needed for particle sequences like には, では where the second
 * particle should inherit from the original content word, not the first particle.
 */
function findLastContentWord(words: WordPitch[], beforeIndex: number): WordPitch | null {
  for (let i = beforeIndex - 1; i >= 0; i--) {
    if (!isParticle(words[i])) {
      return words[i];
    }
  }
  return null;
}

function buildPhrasePoints(words: WordPitch[]): MoraPoint[] {
  const points: MoraPoint[] = [];

  words.forEach((word, wordIndex) => {
    const particle = isParticle(word);

    if (particle && wordIndex > 0) {
      // Find the last CONTENT word (not particle) to inherit pitch from
      const contentWord = findLastContentWord(words, wordIndex);
      const pitch = getParticlePitch(contentWord);

      word.morae.forEach((mora) => {
        points.push({
          mora,
          pitch,
          wordIndex,
          isParticle: true,
          isUncertain: false,
          surface: word.surface,
        });
      });
    } else {
      // Check if this is an uncertain word (proper noun without dictionary entry)
      const isUncertain = word.source === "proper_noun" && word.pitch_pattern.length === 0;

      word.morae.forEach((mora, moraIndex) => {
        const pitch = isUncertain
          ? "?"
          : (word.pitch_pattern[moraIndex] as "H" | "L") || "L";
        points.push({
          mora,
          pitch,
          wordIndex,
          isParticle: false,
          isUncertain,
          surface: word.surface,
        });
      });
    }
  });

  return points;
}

/**
 * Map word timings to mora indices for cursor animation
 */
function buildMoraTimings(
  words: WordPitch[],
  wordTimings: WordTiming[]
): { moraIndex: number; startMs: number; endMs: number }[] {
  const moraTimings: { moraIndex: number; startMs: number; endMs: number }[] = [];
  let moraIndex = 0;

  words.forEach((word, wordIndex) => {
    const timing = wordTimings.find((t) => t.text === word.surface);
    const wordMoraCount = word.morae.length;

    if (timing && wordMoraCount > 0) {
      // Distribute word duration evenly across its morae
      const moraDuration = timing.duration_ms / wordMoraCount || 100;

      for (let i = 0; i < wordMoraCount; i++) {
        moraTimings.push({
          moraIndex: moraIndex + i,
          startMs: timing.offset_ms + i * moraDuration,
          endMs: timing.offset_ms + (i + 1) * moraDuration,
        });
      }
    } else {
      // Fallback: estimate timing
      for (let i = 0; i < wordMoraCount; i++) {
        const estimatedStart = moraIndex * 150;
        moraTimings.push({
          moraIndex: moraIndex + i,
          startMs: estimatedStart + i * 150,
          endMs: estimatedStart + (i + 1) * 150,
        });
      }
    }

    moraIndex += wordMoraCount;
  });

  return moraTimings;
}

export function PhraseFlow({ words }: PhraseFlowProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMoraIndex, setCurrentMoraIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const moraTimingsRef = useRef<{ moraIndex: number; startMs: number; endMs: number }[]>([]);

  const points = buildPhrasePoints(words);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        // Only revoke blob URLs, not data URLs
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
    };
  }, []);

  const animateCursor = useCallback(() => {
    if (!audioRef.current || audioRef.current.paused) {
      setCurrentMoraIndex(null);
      return;
    }

    const currentTimeMs = audioRef.current.currentTime * 1000;

    // Find which mora should be highlighted
    const currentMora = moraTimingsRef.current.find(
      (t) => currentTimeMs >= t.startMs && currentTimeMs < t.endMs
    );

    if (currentMora) {
      setCurrentMoraIndex(currentMora.moraIndex);
    }

    animationRef.current = requestAnimationFrame(animateCursor);
  }, []);

  const handlePlay = async () => {
    if (isPlaying) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsPlaying(false);
      setCurrentMoraIndex(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get full text from words
      const fullText = words.map((w) => w.surface).join("");

      // Fetch TTS with timings
      const result = await getTTSWithTimings(fullText);

      // Build mora timings from word timings
      moraTimingsRef.current = buildMoraTimings(words, result.wordTimings);

      // Create audio element
      if (audioRef.current && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(result.audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        animateCursor();
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentMoraIndex(null);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      audio.onerror = () => {
        setError("Audio playback failed");
        setIsPlaying(false);
      };

      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audio");
    } finally {
      setIsLoading(false);
    }
  };

  if (!words.length || !points.length) return null;

  const moraWidth = 32;
  const svgWidth = points.length * moraWidth + 20;
  const svgHeight = 80;

  return (
    <div className="riso-card p-4 overflow-x-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-ink-black/50 font-medium">
          Phrase Flow — shows pitch across word boundaries
        </span>
        <button
          onClick={handlePlay}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${isPlaying
              ? "bg-ink-coral/20 text-ink-coral hover:bg-ink-coral/30"
              : "bg-ink-cornflower/20 text-ink-cornflower hover:bg-ink-cornflower/30"
            }
            ${isLoading ? "opacity-50 cursor-wait" : "cursor-pointer"}
          `}
        >
          {isLoading ? (
            <>
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Loading...
            </>
          ) : isPlaying ? (
            <>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              Stop
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play with cursor
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-500 mb-2">{error}</div>
      )}

      <div className="inline-block min-w-full bg-white rounded-lg" style={{ minWidth: svgWidth }}>
        <svg width={svgWidth} height={svgHeight}>
          {/* Background */}
          <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="white" rx="8" />

          {/* Pitch line segments - dashed for particles, skip uncertain */}
          {points.map((point, i) => {
            if (i === 0) return null;
            const prevPoint = points[i - 1];

            // Skip line if either point is uncertain
            if (point.isUncertain || prevPoint.isUncertain) return null;

            const x1 = (i - 1) * moraWidth + moraWidth / 2 + 10;
            const y1 = prevPoint.pitch === "H" ? 20 : 50;
            const x2 = i * moraWidth + moraWidth / 2 + 10;
            const y2 = point.pitch === "H" ? 20 : 50;

            // Use dashed line when connecting to a particle
            const isDashed = point.isParticle;

            return (
              <line
                key={`line-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#2A2A2A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={isDashed ? "4,3" : "none"}
                opacity={isDashed ? 0.6 : 1}
              />
            );
          })}

        {/* Pitch dots and mora labels */}
        {points.map((point, i) => {
          const x = i * moraWidth + moraWidth / 2 + 10;
          // Uncertain points go in the middle
          const y = point.isUncertain ? 35 : (point.pitch === "H" ? 20 : 50);
          const fillColor = point.isUncertain
            ? "#fbbf24"  // amber for uncertain
            : point.pitch === "H" ? "#FF99A0" : "#82A8E5";

          const isActive = currentMoraIndex === i;
          const strokeColor = isActive
            ? "#f59e0b"
            : point.isUncertain
            ? "#d97706"
            : point.isParticle
            ? "#9333ea"
            : "#2A2A2A";
          const strokeWidth = isActive ? 4 : point.isParticle ? 2.5 : 1.5;
          const radius = isActive ? 9 : 6;

          return (
            <g key={i}>
              {/* Active glow effect */}
              {isActive && (
                <circle
                  cx={x}
                  cy={y}
                  r={14}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  opacity="0.4"
                  className="animate-pulse"
                />
              )}

              {/* Dot or "?" for uncertain */}
              {point.isUncertain ? (
                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="600"
                  fill="#d97706"
                >
                  ?
                </text>
              ) : (
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className={isActive ? "transition-all duration-75" : ""}
                />
              )}

              {/* Mora label */}
              <text
                x={x}
                y={72}
                textAnchor="middle"
                fontSize={isActive ? "16" : "14"}
                fontWeight={isActive ? "700" : point.isParticle ? "600" : "500"}
                fill={isActive ? "#f59e0b" : point.isParticle ? "#9333ea" : "#2A2A2A"}
                className="font-sans transition-all"
              >
                {point.mora}
              </text>
            </g>
          );
        })}

        {/* Word boundary markers */}
        {points.map((point, i) => {
          if (i === 0) return null;
          const prevPoint = points[i - 1];
          if (prevPoint.wordIndex !== point.wordIndex) {
            const x = i * moraWidth + 10;
            return (
              <line
                key={`boundary-${i}`}
                x1={x}
                y1={12}
                x2={x}
                y2={58}
                stroke="#2A2A2A"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity={0.3}
              />
            );
          }
          return null;
        })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-ink-black/60">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#FF99A0] border border-ink-black/30"></span>
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#82A8E5] border border-ink-black/30"></span>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-200 border-2 border-violet-600"></span>
          <span>Particle</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-amber-600 font-bold text-xs">?</span>
          <span>Uncertain</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 border-2 border-amber-500"></span>
          <span>Playing</span>
        </div>
      </div>
    </div>
  );
}
