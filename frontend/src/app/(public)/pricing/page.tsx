"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { createCheckoutSession } from "@/lib/api";

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-primary-500 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="w-5 h-5 text-ink-black/30 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

const freeFeatures = [
  { name: "Unlimited pitch analysis", included: true },
  { name: "PhraseFlow visualization", included: true },
  { name: "80+ curated examples", included: true },
  { name: "Learn section with guides", included: true },
  { name: "Works on any device", included: true },
  { name: "TTS playback", included: true, limit: "50/day" },
  { name: "Record & Compare", included: true, limit: "3/day" },
  { name: "Analysis history", included: false },
  { name: "Progress tracking", included: false },
  { name: "Anki export", included: false },
  { name: "Personalized decks", included: false },
  { name: "Priority support", included: false },
];

const proFeatures = [
  { name: "Unlimited pitch analysis", included: true },
  { name: "PhraseFlow visualization", included: true },
  { name: "80+ curated examples", included: true },
  { name: "Learn section with guides", included: true },
  { name: "Works on any device", included: true },
  { name: "TTS playback", included: true, limit: "Unlimited" },
  { name: "Record & Compare", included: true, limit: "Unlimited" },
  { name: "Analysis history", included: true },
  { name: "Progress tracking", included: true },
  { name: "Anki export", included: true },
  { name: "Personalized decks", included: true, highlight: "ML-powered" },
  { name: "Priority support", included: true },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper-white">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Header */}
        <section className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-black mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-ink-black/60 text-lg max-w-2xl mx-auto">
            Start free and upgrade when you&apos;re ready to take your pitch
            accent practice to the next level.
          </p>
        </section>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Tier */}
          <div className="riso-card p-8 border-2 border-ink-black/20">
            <div className="mb-6">
              <span className="text-xs font-mono text-ink-black/60 uppercase tracking-wide">
                Free Forever
              </span>
              <div className="font-display text-4xl font-bold mt-2">$0</div>
              <p className="text-ink-black/50 text-sm mt-1">
                No credit card required
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {freeFeatures.map((feature) => (
                <li key={feature.name} className="flex items-center gap-3 text-sm">
                  {feature.included ? <CheckIcon /> : <XIcon />}
                  <span className={feature.included ? "" : "text-ink-black/40"}>
                    {feature.name}
                    {feature.limit && (
                      <span className="text-ink-black/40 ml-1">
                        ({feature.limit})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/app"
              className="riso-button-secondary w-full text-center block"
            >
              Get Started
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="riso-card p-8 border-2 border-primary-500 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <span className="text-xs font-mono text-primary-500 uppercase tracking-wide">
                Pro
              </span>
              <div className="font-display text-4xl font-bold mt-2">
                $9
                <span className="text-xl font-normal text-ink-black/50">
                  /month
                </span>
              </div>
              <p className="text-ink-black/50 text-sm mt-1">
                Cancel anytime
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {proFeatures.map((feature) => (
                <li key={feature.name} className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  <span>
                    {feature.name}
                    {feature.limit && (
                      <span className="text-primary-500 font-medium ml-1">
                        ({feature.limit})
                      </span>
                    )}
                    {feature.highlight && (
                      <span className="bg-primary-300/30 text-primary-700 text-xs px-2 py-0.5 rounded-full ml-2">
                        {feature.highlight}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-riso text-sm text-red-600">
                {error}
              </div>
            )}

            {user ? (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="riso-button-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Redirecting to checkout..." : "Upgrade to Pro"}
              </button>
            ) : (
              <Link
                href="/login?next=/pricing"
                className="riso-button-primary w-full text-center block"
              >
                Sign in to Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="riso-card p-6">
              <h3 className="font-bold mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-ink-black/60 text-sm">
                We accept all major credit cards (Visa, Mastercard, American
                Express) through Stripe. Your payment information is never
                stored on our servers.
              </p>
            </div>

            <div className="riso-card p-6">
              <h3 className="font-bold mb-2">Can I cancel anytime?</h3>
              <p className="text-ink-black/60 text-sm">
                Yes! You can cancel your subscription at any time. You&apos;ll
                continue to have Pro access until the end of your billing
                period.
              </p>
            </div>

            <div className="riso-card p-6">
              <h3 className="font-bold mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-ink-black/60 text-sm">
                Your analysis history and progress data are preserved. You can
                still view them, but won&apos;t be able to add new entries until
                you upgrade again.
              </p>
            </div>

            <div className="riso-card p-6">
              <h3 className="font-bold mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-ink-black/60 text-sm">
                We offer a 7-day money-back guarantee. If you&apos;re not
                satisfied with Pro features, contact us within 7 days of
                purchase for a full refund.
              </p>
            </div>

            <div className="riso-card p-6">
              <h3 className="font-bold mb-2">
                What are personalized decks?
              </h3>
              <p className="text-ink-black/60 text-sm">
                Our ML system analyzes your practice patterns and creates custom
                decks focusing on pitch patterns you struggle with most. It
                adapts as you improve!
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mt-16 py-12 border-t-2 border-ink-black/10">
          <h2 className="font-display text-2xl font-bold mb-4">
            Ready to master pitch accent?
          </h2>
          <p className="text-ink-black/60 mb-8">
            Join thousands of learners improving their Japanese pronunciation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app" className="riso-button-primary">
              Try Free Version
            </Link>
            <Link href="/learn" className="riso-button-secondary">
              Learn About Pitch Accent
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
