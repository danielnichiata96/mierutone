export function HowItWorks() {
  const patterns = [
    {
      type: "平板",
      romaji: "Heiban",
      meaning: "Flat",
      description: "Starts low, rises, stays high",
      pattern: ["L", "H", "H", "H"],
      example: "さくら",
      color: "primary",
    },
    {
      type: "頭高",
      romaji: "Atamadaka",
      meaning: "Head-high",
      description: "Starts high, drops after first mora",
      pattern: ["H", "L", "L", "L"],
      example: "いのち",
      color: "accent",
    },
    {
      type: "中高",
      romaji: "Nakadaka",
      meaning: "Middle-high",
      description: "Rises then drops in the middle",
      pattern: ["L", "H", "H", "L"],
      example: "たまご",
      color: "secondary",
    },
    {
      type: "尾高",
      romaji: "Odaka",
      meaning: "Tail-high",
      description: "Drops after the last mora",
      pattern: ["L", "H", "H", "↓"],
      example: "おとこ",
      color: "primary",
    },
  ];

  return (
    <section className="mt-20 py-16 border-t-2 border-ink-black/10">
      <div className="text-center mb-10">
        <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">
          The 4 Pitch Patterns
        </h2>
        <p className="text-ink-black/60 font-medium max-w-xl mx-auto">
          Every Japanese word follows one of these patterns.
          Learn to see them, hear them, and speak them.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {patterns.map((p) => (
          <div key={p.romaji} className="riso-card p-5 text-center">
            {/* Pattern visualization */}
            <div className="flex justify-center items-end gap-1 h-12 mb-4">
              {p.pattern.map((level, i) => (
                <div
                  key={i}
                  className={`w-6 rounded-sm transition-all ${
                    level === "H"
                      ? "h-10 bg-accent-500"
                      : level === "L"
                      ? "h-5 bg-primary-500"
                      : "h-5 bg-ink-black/20"
                  }`}
                />
              ))}
            </div>

            {/* Type label */}
            <div className="font-display font-bold text-xl mb-1">
              {p.type}
            </div>
            <div className="text-sm text-ink-black/50 font-mono mb-2">
              {p.romaji}
            </div>

            {/* Description */}
            <p className="text-sm text-ink-black/60 font-medium">
              {p.description}
            </p>

            {/* Example */}
            <div className="mt-3 pt-3 border-t border-ink-black/10">
              <span className="text-lg font-sans">{p.example}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
