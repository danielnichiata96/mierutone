"use client";

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { TextInput } from "@/components/TextInput";
import { normalizeInput } from "@/lib/normalizeInput";
import { PitchVisualizer } from "@/components/PitchVisualizer";
import { Legend } from "@/components/Legend";
import { RecordCompare } from "@/components/RecordCompare";
import { QuickExamples } from "@/components/QuickExamples";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { analyzeText } from "@/lib/api";
import { useAchievements } from "@/hooks/useAchievements";
import { usePreferences } from "@/hooks/usePreferences";
import type { WordPitch, HomophoneCandidate } from "@/types/pitch";
import type { DisplayPreferences } from "@/components/WordCard";

// Featured examples for pre-analysis (rotates daily)
const FEATURED_EXAMPLES = [
  "東京に行きたい",
  "おはようございます",
  "日本語を勉強する",
  "ありがとうございます",
];

function getDailyExample(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return FEATURED_EXAMPLES[dayOfYear % FEATURED_EXAMPLES.length];
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [words, setWords] = useState<WordPitch[]>([]);
  const [isHomophoneLookup, setIsHomophoneLookup] = useState(false);
  const [homophones, setHomophones] = useState<HomophoneCandidate[] | null>(null);
  const [currentText, setCurrentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecordCompare, setShowRecordCompare] = useState(false);
  const [initialText, setInitialText] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { checkForAchievements } = useAchievements();
  const { preferences } = usePreferences();

  // Map user preferences to display preferences
  const displayPrefs: DisplayPreferences = useMemo(() => ({
    showAccentNumbers: preferences.show_accent_numbers,
    showPartOfSpeech: preferences.show_part_of_speech,
    showConfidence: preferences.show_confidence,
    voice: preferences.default_voice,
    rate: preferences.playback_speed,
  }), [preferences]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleAnalyze = useCallback(async (text: string, isAutoLoad = false) => {
    setIsLoading(true);
    setError(null);
    setCurrentText(text);
    setShowRecordCompare(false);

    if (!isAutoLoad) {
      setHasInteracted(true);
    }

    try {
      const response = await analyzeText(text);

      // Handle homophone lookup mode vs standard mode
      if (response.is_homophone_lookup) {
        setIsHomophoneLookup(true);
        setHomophones(response.homophones);
        setWords([]);
      } else {
        setIsHomophoneLookup(false);
        setHomophones(null);
        setWords(response.words);
      }

      // Update URL with text param (only if user interacted)
      if (!isAutoLoad) {
        const url = new URL(window.location.href);
        url.searchParams.set("text", text);
        window.history.replaceState({}, "", url.toString());
      }

      // Check for achievements after successful analysis
      if (!isAutoLoad) {
        checkForAchievements();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze text");
      setWords([]);
      setIsHomophoneLookup(false);
      setHomophones(null);
    } finally {
      setIsLoading(false);
    }
  }, [checkForAchievements]);

  // Check for text query parameter or load featured example
  useEffect(() => {
    const textParam = searchParams.get("text");
    if (textParam) {
      const normalized = normalizeInput(textParam);
      if (normalized !== initialText) {
        setInitialText(normalized);
        setHasInteracted(true);
        handleAnalyze(normalized);
      }
    } else if (!initialText && !hasInteracted) {
      // No URL param - load featured example
      const example = getDailyExample();
      setInitialText(example);
      handleAnalyze(example, true);
    }
  }, [searchParams, initialText, hasInteracted, handleAnalyze]);

  // ESC key to close RecordCompare
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && showRecordCompare) {
        setShowRecordCompare(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showRecordCompare]);

  const handleShare = async () => {
    // Make sure URL has the text param before sharing
    const url = new URL(window.location.href);
    url.searchParams.set("text", currentText);
    const shareUrl = url.toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: "MieruTone - Pitch Accent",
          text: currentText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
    }
  };

  return (
    <main className="min-h-screen bg-paper-white">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Hero + Search - Above the fold */}
        <section className="mb-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-black mb-2 leading-tight">
            See the melody of Japanese
          </h1>
          <p className="text-ink-black/60 text-base mb-6">
            Visualize pitch accent patterns instantly
          </p>
        </section>

        {/* Main Analyzer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-4 space-y-6">
            <TextInput
              onAnalyze={(text) => handleAnalyze(text)}
              isLoading={isLoading}
              initialValue={initialText}
            />
            <Legend />
          </section>

          <section className="lg:col-span-8">
            {error ? (
              <div className="riso-card border-accent-500 bg-accent-300/30 text-center">
                <p className="text-accent-500 font-bold mb-2">Analysis Failed</p>
                <p className="text-ink-black/70 text-sm">{error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="riso-card min-h-[280px]">
                  <PitchVisualizer
                    words={words}
                    displayPrefs={displayPrefs}
                    isHomophoneLookup={isHomophoneLookup}
                    homophones={homophones}
                    searchReading={currentText}
                  />
                </div>

                {(words.length > 0 || (isHomophoneLookup && homophones?.length)) && !showRecordCompare && (
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => setShowRecordCompare(true)}
                      className="riso-button-secondary"
                    >
                      <span className="hidden sm:inline">Record & Compare</span>
                      <span className="sm:hidden">Record</span>
                    </button>
                    <button
                      onClick={handleShare}
                      className="riso-button-ghost flex items-center gap-2"
                      title="Share this analysis"
                    >
                      {copied ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                          </svg>
                          Share
                        </>
                      )}
                    </button>
                  </div>
                )}

                {showRecordCompare && currentText && (
                  <div className="space-y-4">
                    <RecordCompare text={currentText} />
                    <div className="text-center">
                      <button
                        onClick={() => setShowRecordCompare(false)}
                        className="riso-button-ghost text-sm"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Quick Examples */}
        <section className="mt-12">
          <QuickExamples onSelect={(text) => handleAnalyze(text)} />
        </section>

        {/* Below the fold - Marketing (only visible on scroll) */}
        <div className="mt-20 pt-12 border-t-2 border-ink-black/10">
          <Features />
          <HowItWorks />

          {/* Minimal footer */}
          <footer className="mt-12 pt-8 border-t-2 border-ink-black/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-ink-black/40 font-mono tracking-wide">
                MieruTone — Free & Open Source
              </p>
              <div className="flex gap-4 text-xs text-ink-black/40">
                <a
                  href="https://github.com/danielnichiata96/mierutone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ink-black transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="mailto:feedback@mierutone.com"
                  className="hover:text-ink-black transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-paper-white">
          <div className="container mx-auto px-6 py-8 max-w-5xl">
            <div className="animate-pulse text-center">
              <div className="h-10 bg-ink-black/10 rounded-riso mb-4 w-2/3 mx-auto"></div>
              <div className="h-5 bg-ink-black/5 rounded-riso w-1/3 mx-auto mb-8"></div>
              <div className="h-12 bg-ink-black/10 rounded-riso w-full max-w-md mx-auto"></div>
            </div>
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
