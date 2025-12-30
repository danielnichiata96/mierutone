"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { SocialProof } from "@/components/SocialProof";

function LandingContent() {
  const router = useRouter();
  const [demoText, setDemoText] = useState("");

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoText.trim()) {
      router.push(`/app?text=${encodeURIComponent(demoText.trim())}`);
    } else {
      router.push("/app");
    }
  };

  return (
    <main className="min-h-screen bg-paper-white">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <div className="inline-block px-4 py-1.5 bg-primary-300/30 rounded-full text-sm font-medium text-primary-700 mb-4">
            Free & Open Source
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-black mb-4 leading-tight">
            See the invisible melody
            <br />
            of Japanese
          </h1>
          <p className="text-ink-black/60 text-lg max-w-2xl mx-auto mb-8">
            Visualize pitch accent patterns instantly. Understand what makes
            native speakers sound natural.
          </p>

          {/* Demo Input */}
          <form
            onSubmit={handleDemoSubmit}
            className="max-w-md mx-auto mb-8"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
                placeholder="Try: こんにちは"
                className="flex-1 px-4 py-3 border-2 border-ink-black/20 rounded-riso focus:border-primary-500 focus:outline-none transition-colors"
              />
              <button type="submit" className="riso-button-primary whitespace-nowrap">
                Analyze
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app" className="riso-button-primary">
              Open App
            </Link>
            <Link href="/learn" className="riso-button-secondary">
              Learn Pitch Patterns
            </Link>
          </div>
        </section>

        {/* Preview Image/Animation placeholder */}
        <section className="mb-16">
          <div className="riso-card p-8 text-center bg-gradient-to-br from-primary-300/20 to-secondary-300/20">
            <div className="flex justify-center gap-2 mb-4">
              {["こ", "ん", "に", "ち", "は"].map((char, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full mb-2 ${
                      i === 0 ? "bg-secondary-500" : "bg-primary-500"
                    }`}
                  />
                  <span className="text-2xl font-bold text-ink-black">{char}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-ink-black/60">
              See pitch patterns for any Japanese text
            </p>
          </div>
        </section>

        {/* Features Section */}
        <Features />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Pricing Section */}
        <Pricing />

        {/* Social Proof Section */}
        <SocialProof />

        {/* Footer */}
        <footer className="mt-8 pt-8 border-t-2 border-ink-black/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-ink-black/40 font-mono tracking-wide">
              MieruTone — Master the melody of Japanese
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
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-paper-white">
          <div className="container mx-auto px-6 py-12 max-w-5xl">
            <div className="animate-pulse">
              <div className="h-12 bg-ink-black/10 rounded-riso mb-4 w-2/3 mx-auto"></div>
              <div className="h-6 bg-ink-black/5 rounded-riso w-1/2 mx-auto"></div>
            </div>
          </div>
        </main>
      }
    >
      <LandingContent />
    </Suspense>
  );
}
