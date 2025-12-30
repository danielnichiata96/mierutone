"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TextInput } from "@/components/TextInput";
import { PitchVisualizer } from "@/components/PitchVisualizer";
import { Legend } from "@/components/Legend";
import { RecordCompare } from "@/components/RecordCompare";
import { QuickExamples } from "@/components/QuickExamples";
import { analyzeText } from "@/lib/api";
import type { WordPitch } from "@/types/pitch";

function AppContent() {
  const searchParams = useSearchParams();
  const [words, setWords] = useState<WordPitch[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecordCompare, setShowRecordCompare] = useState(false);
  const [initialText, setInitialText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleAnalyze = useCallback(async (text: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentText(text);
    setShowRecordCompare(false);

    try {
      const response = await analyzeText(text);
      setWords(response.words);

      // Update URL with text param
      const url = new URL(window.location.href);
      url.searchParams.set("text", text);
      window.history.replaceState({}, "", url.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze text");
      setWords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for text query parameter
  useEffect(() => {
    const textParam = searchParams.get("text");
    if (textParam && textParam !== initialText) {
      setInitialText(textParam);
      handleAnalyze(textParam);
    }
  }, [searchParams, initialText, handleAnalyze]);

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
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "MieruTone - Pitch Accent",
          text: currentText,
          url,
        });
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
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
        {/* Header */}
        <section className="mb-6">
          <h1 className="font-display text-2xl font-bold text-ink-black mb-1">
            Pitch Accent Analyzer
          </h1>
          <p className="text-ink-black/60 text-sm">
            Type Japanese text to see pitch patterns instantly
          </p>
        </section>

        {/* Main Tool */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-4 space-y-6">
            <TextInput
              onAnalyze={handleAnalyze}
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
                  <PitchVisualizer words={words} />
                </div>

                {words.length > 0 && !showRecordCompare && (
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
          <QuickExamples onSelect={handleAnalyze} />
        </section>
      </div>
    </main>
  );
}

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-paper-white">
          <div className="container mx-auto px-6 py-8 max-w-5xl">
            <div className="animate-pulse">
              <div className="h-8 bg-ink-black/10 rounded-riso mb-4 w-1/3"></div>
              <div className="h-4 bg-ink-black/5 rounded-riso w-1/2"></div>
            </div>
          </div>
        </main>
      }
    >
      <AppContent />
    </Suspense>
  );
}
