"use client";

interface QuickExamplesProps {
  onSelect: (text: string) => void;
}

export function QuickExamples({ onSelect }: QuickExamplesProps) {
  const examples = [
    {
      category: "Minimal Pairs",
      items: [
        { text: "箸と橋", hint: "hashi (chopsticks vs bridge)" },
        { text: "雨と飴", hint: "ame (rain vs candy)" },
        { text: "酒と鮭", hint: "sake (alcohol vs salmon)" },
      ],
    },
    {
      category: "Greetings",
      items: [
        { text: "おはようございます", hint: "Good morning" },
        { text: "こんにちは", hint: "Hello" },
        { text: "ありがとうございます", hint: "Thank you" },
      ],
    },
    {
      category: "Common Phrases",
      items: [
        { text: "日本語を勉強しています", hint: "I'm studying Japanese" },
        { text: "東京に行きたいです", hint: "I want to go to Tokyo" },
        { text: "これはいくらですか", hint: "How much is this?" },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-accent-500" />
        <span className="font-mono text-sm text-ink-black/50 uppercase tracking-wide">
          Quick Examples
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {examples.map((group) => (
          <div key={group.category} className="riso-card-outline p-4">
            <h3 className="font-display font-bold text-sm text-ink-black/70 mb-3">
              {group.category}
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => (
                <button
                  key={item.text}
                  onClick={() => onSelect(item.text)}
                  className="w-full text-left p-2 rounded-riso hover:bg-primary-300/20 transition-colors group"
                >
                  <div className="font-sans text-ink-black group-hover:text-primary-500 transition-colors">
                    {item.text}
                  </div>
                  <div className="text-xs text-ink-black/40 font-mono">
                    {item.hint}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
