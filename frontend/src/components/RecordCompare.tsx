"use client";

import { useState, useCallback } from "react";
import { Recorder } from "./Recorder";
import { PitchComparison } from "./PitchComparison";
import { PlayButton } from "./PlayButton";
import { comparePronunciation, type CompareResponse } from "@/lib/api";
import { useAchievements } from "@/hooks/useAchievements";
import { usePreferences } from "@/hooks/usePreferences";

interface RecordCompareProps {
  text: string;
}

type State = "ready" | "recorded" | "comparing" | "done";

export function RecordCompare({ text }: RecordCompareProps) {
  const [state, setState] = useState<State>("ready");
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const { checkForAchievements } = useAchievements();
  const { preferences } = usePreferences();

  const handleRecordingComplete = useCallback((blob: Blob) => {
    setAudioBlob(blob);
    setState("recorded");
    setError(null);
  }, []);

  const handleCompare = useCallback(async () => {
    if (!audioBlob) return;

    setState("comparing");
    setError(null);

    try {
      const compareResult = await comparePronunciation(text, audioBlob);
      setResult(compareResult);
      setState("done");
      // Check for achievements after successful comparison
      checkForAchievements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
      setState("recorded");
    }
  }, [audioBlob, text, checkForAchievements]);

  const handleReset = useCallback(() => {
    setState("ready");
    setResult(null);
    setAudioBlob(null);
    setError(null);
  }, []);

  return (
    <div className="riso-card space-y-6">
      {/* Header */}
      <div className="text-center border-b-2 border-ink-black/10 pb-4">
        <h3 className="font-display font-bold text-sm text-ink-black/70 mb-2 tracking-wide">
          Record & Compare
        </h3>
        <p className="text-2xl font-sans font-bold text-ink-black">{text}</p>
      </div>

      {/* Listen first */}
      <div className="flex justify-center items-center gap-3">
        <span className="text-sm text-ink-black/50 font-medium">Listen first:</span>
        <PlayButton
          text={text}
          size="md"
          voice={preferences.default_voice}
          rate={preferences.playback_speed}
        />
      </div>

      {/* Recorder */}
      {state !== "done" && (
        <Recorder
          onRecordingComplete={handleRecordingComplete}
          disabled={state === "comparing"}
        />
      )}

      {/* Compare button */}
      {state === "recorded" && (
        <div className="flex justify-center">
          <button
            onClick={handleCompare}
            className="riso-button text-lg px-8 py-3"
          >
            Compare My Pronunciation
          </button>
        </div>
      )}

      {/* Loading */}
      {state === "comparing" && (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-ink-black/50 font-mono text-sm">Analyzing pitch patterns...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center p-4 bg-accent-300/30 rounded-riso-lg border-2 border-accent-500">
          <p className="text-accent-500 font-bold">{error}</p>
          <button
            onClick={handleReset}
            className="mt-2 text-sm text-ink-black/50 hover:text-ink-black transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {state === "done" && result && (
        <>
          <PitchComparison result={result} />

          <div className="flex justify-center pt-4 border-t-2 border-ink-black/10">
            <button
              onClick={handleReset}
              className="riso-button-secondary"
            >
              Try Again
            </button>
          </div>
        </>
      )}
    </div>
  );
}
