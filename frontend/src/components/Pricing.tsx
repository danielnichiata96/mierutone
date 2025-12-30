import Link from "next/link";

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

export function Pricing() {
  const freeFeatures = [
    "Unlimited pitch analysis",
    "PhraseFlow visualization",
    "80+ curated examples",
    "TTS playback (50/day)",
    "Record & Compare (3/day)",
  ];

  const proFeatures = [
    "Everything in Free",
    "Unlimited TTS & Compare",
    "Analysis history",
    "Progress tracking",
    "Anki export",
    "Personalized ML decks",
  ];

  return (
    <section className="py-16 border-t-2 border-ink-black/10">
      <div className="text-center mb-10">
        <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">
          Free to start. Upgrade when ready.
        </h2>
        <p className="text-ink-black/60 max-w-xl mx-auto">
          Get started with powerful free features. Upgrade to Pro for unlimited
          access and advanced tools.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free Tier */}
        <div className="riso-card p-6 border-2 border-ink-black/20">
          <div className="text-center mb-4">
            <span className="text-xs font-mono text-ink-black/60 uppercase tracking-wide">
              Free Forever
            </span>
            <div className="font-display text-3xl font-bold mt-1">$0</div>
          </div>

          <ul className="space-y-2 mb-6">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <CheckIcon />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/app"
            className="riso-button-secondary w-full text-center block text-sm"
          >
            Get Started
          </Link>
        </div>

        {/* Pro Tier */}
        <div className="riso-card p-6 border-2 border-primary-500 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary-500 text-white text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wide">
              Popular
            </span>
          </div>

          <div className="text-center mb-4">
            <span className="text-xs font-mono text-primary-500 uppercase tracking-wide">
              Pro
            </span>
            <div className="font-display text-3xl font-bold mt-1">
              $9
              <span className="text-lg font-normal text-ink-black/50">
                /mo
              </span>
            </div>
          </div>

          <ul className="space-y-2 mb-6">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <CheckIcon />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/pricing"
            className="riso-button-primary w-full text-center block text-sm"
          >
            Learn More
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-ink-black/40 mt-6">
        <Link href="/pricing" className="underline hover:text-ink-black/60">
          Compare all features
        </Link>
        {" | "}
        <a
          href="https://github.com/danielnichiata96/mierutone"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-ink-black/60"
        >
          Star us on GitHub
        </a>
      </p>
    </section>
  );
}
