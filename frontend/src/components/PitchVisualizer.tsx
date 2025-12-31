"use client";

import type { WordPitch, HomophoneCandidate } from "@/types/pitch";
import { WordCard, type DisplayPreferences } from "./WordCard";
import { HomophoneCard } from "./HomophoneCard";
import { PhraseFlow } from "./PhraseFlow";

interface PitchVisualizerProps {
  words: WordPitch[];
  displayPrefs?: DisplayPreferences;
  isHomophoneLookup?: boolean;
  homophones?: HomophoneCandidate[] | null;
  searchReading?: string;
}

export function PitchVisualizer({
  words,
  displayPrefs,
  isHomophoneLookup = false,
  homophones,
  searchReading,
}: PitchVisualizerProps) {
  // Homophone lookup mode - show all kanji options
  if (isHomophoneLookup) {
    if (!homophones?.length) {
      return (
        <div className="text-center py-16 text-ink-black/50 font-medium">
          <p className="text-lg">No matches found for &quot;{searchReading}&quot;</p>
          <p className="text-sm mt-2 text-ink-black/40">
            Try a different hiragana reading or enter kanji directly
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header explaining homophone mode */}
        <div className="text-center pb-4 border-b border-ink-black/10">
          <p className="text-sm text-ink-black/60">
            <span className="font-medium text-ink-black">「{searchReading}」</span>
            {" "}has {homophones.length} possible meaning{homophones.length > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-ink-black/40 mt-1">
            Each kanji has a different pitch accent
          </p>
        </div>

        {/* Homophone cards grid */}
        <div className="flex flex-wrap justify-center gap-4">
          {homophones.map((candidate, index) => (
            <HomophoneCard
              key={`${candidate.surface}-${index}`}
              candidate={candidate}
              voice={displayPrefs?.voice}
              rate={displayPrefs?.rate}
            />
          ))}
        </div>
      </div>
    );
  }

  // Standard mode - show analyzed words
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
          <WordCard key={`${word.surface}-${index}`} word={word} displayPrefs={displayPrefs} />
        ))}
      </div>
    </div>
  );
}
