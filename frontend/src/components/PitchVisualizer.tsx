"use client";

import type { WordPitch } from "@/types/pitch";
import { WordCard } from "./WordCard";
import { PhraseFlow } from "./PhraseFlow";

interface PitchVisualizerProps {
  words: WordPitch[];
}

export function PitchVisualizer({ words }: PitchVisualizerProps) {
  if (!words.length) {
    return (
      <div className="text-center py-16 text-ink-black/50 font-medium">
        <p className="text-lg">Enter Japanese text to see pitch patterns</p>
        <p className="text-sm mt-2 text-ink-black/40">Visualize the invisible structure of pitch accent</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phrase flow - connected visualization */}
      <PhraseFlow words={words} />

      {/* Individual word cards */}
      <div className="flex flex-wrap gap-4">
        {words.map((word, index) => (
          <WordCard key={`${word.surface}-${index}`} word={word} />
        ))}
      </div>
    </div>
  );
}
