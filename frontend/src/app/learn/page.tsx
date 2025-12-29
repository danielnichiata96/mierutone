import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn Japanese Pitch Accent",
  description: "Understand moras, pitch patterns, and how Japanese melody works. Free educational content for mastering pitch accent.",
};

const learnTopics = [
  {
    id: "moras",
    title: "What are Moras?",
    titleJp: "拍とは",
    description: "Understanding the rhythmic units of Japanese - different from syllables!",
    icon: "🎵",
    color: "bg-primary-300",
  },
  {
    id: "patterns",
    title: "The 4 Pitch Patterns",
    titleJp: "4つのアクセント型",
    description: "Heiban, Atamadaka, Nakadaka, Odaka - the building blocks of Japanese melody.",
    icon: "📊",
    color: "bg-secondary-300",
  },
  {
    id: "particles",
    title: "Particles & Pitch",
    titleJp: "助詞とアクセント",
    description: "How particles inherit pitch from the words they follow.",
    icon: "🔗",
    color: "bg-accent-300",
  },
  {
    id: "compounds",
    title: "Compound Words",
    titleJp: "複合語",
    description: "How pitch changes when words combine - McCawley's rules explained.",
    icon: "🧩",
    color: "bg-energy-300",
  },
];

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-paper-white">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Header */}
        <section className="mb-12 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-black mb-3">
            Learn Pitch Accent
          </h1>
          <p className="text-ink-black/60 text-lg max-w-2xl mx-auto">
            Master the melody of Japanese. Start with the fundamentals and build your way up.
          </p>
        </section>

        {/* Topic Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {learnTopics.map((topic) => (
            <Link
              key={topic.id}
              href={`/learn/${topic.id}`}
              className="riso-card-interactive p-6 group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-riso ${topic.color} flex items-center justify-center text-2xl`}>
                  {topic.icon}
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-ink-black group-hover:text-primary-500 transition-colors">
                    {topic.title}
                  </h2>
                  <p className="text-xs text-ink-black/50 font-mono mb-2">{topic.titleJp}</p>
                  <p className="text-sm text-ink-black/70">{topic.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* Quick Overview */}
        <section className="riso-card p-8">
          <h2 className="font-display text-xl font-bold text-ink-black mb-6 text-center">
            Quick Overview: What is Pitch Accent?
          </h2>

          <div className="space-y-6 text-ink-black/80">
            <p>
              Japanese is a <strong>pitch-accent language</strong>. Unlike English (stress-accent)
              or Chinese (tonal), Japanese uses <strong>HIGH</strong> and <strong>LOW</strong> pitch
              patterns to distinguish meaning.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary-300/20 rounded-riso">
                <p className="font-bold mb-2">箸 (はし)</p>
                <p className="text-sm">HA-shi = <span className="text-ink-coral font-bold">HIGH</span>-<span className="text-ink-cornflower font-bold">LOW</span></p>
                <p className="text-sm text-ink-black/60">Chopsticks</p>
              </div>
              <div className="p-4 bg-secondary-300/20 rounded-riso">
                <p className="font-bold mb-2">橋 (はし)</p>
                <p className="text-sm">ha-SHI = <span className="text-ink-cornflower font-bold">LOW</span>-<span className="text-ink-coral font-bold">HIGH</span></p>
                <p className="text-sm text-ink-black/60">Bridge</p>
              </div>
            </div>

            <p>
              Getting pitch wrong won&apos;t always cause misunderstanding, but it&apos;s the difference
              between sounding <strong>natural</strong> and sounding <strong>foreign</strong>.
            </p>

            <div className="text-center pt-4">
              <Link href="/" className="riso-button-primary">
                Try the Analyzer
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
