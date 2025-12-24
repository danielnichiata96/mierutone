"use client";

import { useState } from "react";
import { TextInput } from "@/components/TextInput";
import { PitchVisualizer } from "@/components/PitchVisualizer";
import { Legend } from "@/components/Legend";
import { RecordCompare } from "@/components/RecordCompare";
import { HowItWorks } from "@/components/HowItWorks";
import { SocialProof } from "@/components/SocialProof";
import { QuickExamples } from "@/components/QuickExamples";
import { analyzeText } from "@/lib/api";
import type { WordPitch } from "@/types/pitch";

export default function Home() {
  const [words, setWords] = useState<WordPitch[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecordCompare, setShowRecordCompare] = useState(false);

  const handleAnalyze = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentText(text);
    setShowRecordCompare(false);

    try {
      const response = await analyzeText(text);
      setWords(response.words);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze text");
      setWords([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper-white">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Hero Section */}
        <section className="mb-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-black mb-3">
            See the invisible structure of Japanese
          </h1>
          <p className="text-ink-black/60 text-lg max-w-2xl mx-auto">
            Visualize pitch accent patterns instantly. Understand the melody that makes Japanese sound natural.
          </p>
        </section>

        {/* Try It Now - Main Tool Section */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-secondary-500" />
            <span className="font-mono text-sm text-ink-black/50 uppercase tracking-wide">
              Try it now
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-4 space-y-6">
            <TextInput onAnalyze={handleAnalyze} isLoading={isLoading} />
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
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowRecordCompare(true)}
                      className="riso-button-secondary"
                    >
                      Record & Compare
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

        {/* Quick Examples Section */}
        <section className="mt-16">
          <QuickExamples onSelect={handleAnalyze} />
        </section>

        {/* How It Works Section */}
        <HowItWorks />

        {/* Social Proof Section */}
        <SocialProof />

        {/* Footer */}
        <footer className="mt-8 pt-8 border-t-2 border-ink-black/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-ink-black/40 font-mono tracking-wide">
              PitchLab JP — Master the melody of Japanese
            </p>
            <div className="flex gap-4 text-xs text-ink-black/40">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink-black transition-colors"
              >
                GitHub
              </a>
              <a
                href="mailto:feedback@pitchlab.jp"
                className="hover:text-ink-black transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
