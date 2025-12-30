import Link from "next/link";

export function Pricing() {
  return (
    <section className="py-16 border-t-2 border-ink-black/10">
      <div className="text-center mb-10">
        <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">
          Free to use. Forever.
        </h2>
        <p className="text-ink-black/60 max-w-xl mx-auto">
          MieruTone is open source and free. We believe pitch accent education should be accessible to everyone.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="riso-card p-8 border-2 border-primary-500">
          <div className="text-center mb-6">
            <span className="text-xs font-mono text-primary-500 uppercase tracking-wide">Current Plan</span>
            <div className="font-display text-4xl font-bold mt-2">Free</div>
            <p className="text-ink-black/50 text-sm mt-1">No credit card required</p>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              "Unlimited pitch analysis",
              "Text-to-speech playback",
              "Voice comparison tool",
              "80+ curated examples",
              "Learn section with guides",
              "Works on any device",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Link href="/" className="riso-button-primary w-full text-center block">
            Start Learning Now
          </Link>
        </div>

        <p className="text-center text-xs text-ink-black/40 mt-6">
          Want to support development?{" "}
          <a
            href="https://github.com/danielnichiata96/mierutone"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink-black/60"
          >
            Star us on GitHub
          </a>
        </p>
      </div>
    </section>
  );
}
