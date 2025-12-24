
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { SpeakerIcon, SparkleIcon } from "@/components/icons/DoodleIcons";
import type { QuizWord, PitchPattern } from "@/types/quiz";
import { PATTERN_INFO } from "@/types/quiz";
import { PatternButton } from "./PatternButton";
import { textToSpeech } from "@/lib/api";

interface QuizCardProps {
  word: QuizWord;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}

const patterns: PitchPattern[] = ["heiban", "atamadaka", "nakadaka", "odaka"];

export function QuizCard({
  word,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
}: QuizCardProps) {
  const [selectedPattern, setSelectedPattern] = useState<PitchPattern | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Cleanup audio URL on unmount or word change
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  // Reset state when word changes
  useEffect(() => {
    // Revoke previous audio URL
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setSelectedPattern(null);
    setAnswered(false);
    setAudioUrl(null);
    setAudioError(null);
  }, [word]);

  const playAudio = useCallback(async () => {
    if (isPlaying) return;

    setIsPlaying(true);
    setAudioError(null);

    try {
      // Use cached audio or fetch new
      let url = audioUrl;
      if (!url) {
        const blob = await textToSpeech(word.word);
        url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setAudioUrl(url);
      }

      const audio = new Audio(url);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setAudioError("Audio playback failed");
      };
      await audio.play();
    } catch {
      setIsPlaying(false);
      setAudioError("Failed to load audio");
    }
  }, [word.word, audioUrl, isPlaying]);

  const handlePatternSelect = (pattern: PitchPattern) => {
    if (answered) return;

    setSelectedPattern(pattern);
    setAnswered(true);
    onAnswer(pattern === word.pattern);
  };

  const getCorrectness = (pattern: PitchPattern): boolean | null => {
    if (!answered) return null;
    if (pattern === word.pattern) return true;
    if (pattern === selectedPattern) return false;
    return null;
  };

  return (
    <div className="riso-card space-y-6 animate-soft-fade-in">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-ink-black/50">
          Question {questionNumber} / {totalQuestions}
        </span>
        <div className="flex-1 mx-4 h-2 bg-ink-black/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-700 ease-out"
            style={{ width: `${(questionNumber / totalQuestions) * 100}% ` }}
          />
        </div>
      </div>

      {/* Word Display */}
      <div className="text-center py-8">
        <div className="font-display text-5xl font-bold text-ink-black mb-2 animate-gentle-bounce">
          {word.word}
        </div>
        <div className="text-lg text-ink-black/60">{word.reading}</div>
        {answered && (
          <div className="mt-2 text-sm text-ink-black/50 animate-soft-fade-in">{word.meaning}</div>
        )}
      </div>

      {/* Play Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={playAudio}
          disabled={isPlaying}
          className="riso-button-secondary flex items-center gap-2 transform active:scale-95 transition-cozy"
        >
          {isPlaying ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Playing...
            </>
          ) : (
            <>
              <SpeakerIcon size={18} className="inline-block" />
              Listen
            </>
          )}
        </button>
      </div>
      {audioError && (
        <p className="text-center text-sm text-accent-500">{audioError}</p>
      )}

      {/* Pattern Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {patterns.map((pattern) => (
          <div key={pattern} className="transition-cozy hover:-translate-y-1">
            <PatternButton
              pattern={pattern}
              isSelected={selectedPattern === pattern}
              isCorrect={getCorrectness(pattern)}
              disabled={answered}
              onClick={() => handlePatternSelect(pattern)}
            />
          </div>
        ))}
      </div>

      {/* Feedback & Next */}
      {answered && (
        <div className="pt-4 border-t-2 border-ink-black/10 space-y-4 animate-soft-fade-in">
          <div
            className={`text - center p - 4 rounded - riso transition - cozy ${selectedPattern === word.pattern
                ? "bg-secondary-300/30 border-2 border-secondary-500"
                : "bg-paper-off border-2 border-ink-black/10"
              } `}
          >
            {selectedPattern === word.pattern ? (
              <p className="font-bold text-ink-black flex items-center justify-center gap-2">
                <SparkleIcon size={24} className="text-amber-500" /> That's right!
              </p>
            ) : (
              <p className="font-bold text-ink-black flex items-center justify-center gap-2">
                <SpeakerIcon size={40} className="text-ink-black group-hover:scale-110 transition-transform duration-300 inline-block" />
                <span>Good try! It was:</span>{" "}
                {PATTERN_INFO[word.pattern].labelJp} ({PATTERN_INFO[word.pattern].label})
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onNext}
              className="riso-button animate-scale-press"
            >
              {questionNumber === totalQuestions ? "Finish Collection" : "Next Word"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
