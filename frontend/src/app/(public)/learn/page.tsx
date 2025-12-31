import Link from "next/link";
import type { Metadata } from "next";
import { MusicIcon, ChartIcon, LinkIcon, PuzzleIcon } from "@/components/icons/DoodleIcons";
import { ExampleLink } from "@/components/ExampleLink";
import type { ComponentType } from "react";

export const metadata: Metadata = {
  title: "Learn Japanese Pitch Accent",
  description: "Understand moras, pitch patterns, and how Japanese melody works. Free educational content for mastering pitch accent.",
};

interface LearnTopic {
  id: string;
  title: string;
  titleJp: string;
  description: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  color: string;
  available: boolean;
}

const learnTopics: LearnTopic[] = [
  {
    id: "moras",
    title: "What are Moras?",
    titleJp: "拍とは",
    description: "Understanding the rhythmic units of Japanese - different from syllables!",
    Icon: MusicIcon,
    color: "bg-primary-300",
    available: true,
  },
  {
    id: "patterns",
    title: "The 4 Pitch Patterns",
    titleJp: "4つのアクセント型",
    description: "Heiban, Atamadaka, Nakadaka, Odaka - the building blocks of Japanese melody.",
    Icon: ChartIcon,
    color: "bg-secondary-300",
    available: true,
  },
  {
    id: "particles",
    title: "Particles & Pitch",
    titleJp: "助詞とアクセント",
    description: "How particles inherit pitch from the words they follow.",
    Icon: LinkIcon,
    color: "bg-accent-300",
    available: true,
  },
  {
    id: "compounds",
    title: "Compound Words",
    titleJp: "複合語",
    description: "How pitch changes when words combine - McCawley's rules explained.",
    Icon: PuzzleIcon,
    color: "bg-energy-300",
    available: true,
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
          {learnTopics.map((topic) => {
            const cardContent = (
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-riso ${topic.color} flex items-center justify-center`}>
                  <topic.Icon size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className={`font-display text-lg font-bold ${
                      topic.available
                        ? "text-ink-black group-hover:text-primary-500 transition-colors"
                        : "text-ink-black/70"
                    }`}>
                      {topic.title}
                    </h2>
                    {!topic.available && (
                      <span className="text-[10px] px-2 py-0.5 bg-ink-black/10 rounded-full text-ink-black/50 font-medium">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-black/50 font-mono mb-2">{topic.titleJp}</p>
                  <p className="text-sm text-ink-black/70">{topic.description}</p>
                </div>
              </div>
            );

            return topic.available ? (
              <Link
                key={topic.id}
                href={`/learn/${topic.id}`}
                className="riso-card riso-card-interactive p-6 group cursor-pointer"
              >
                {cardContent}
              </Link>
            ) : (
              <div
                key={topic.id}
                className="riso-card p-6 group opacity-70 cursor-default"
              >
                {cardContent}
              </div>
            );
          })}
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
              <ExampleLink
                word="箸"
                reading="はし"
                accent="¹"
                meaning="Chopsticks"
                pattern="HA-shi = HIGH-LOW"
                className="bg-primary-300/20"
              />
              <ExampleLink
                word="橋"
                reading="はし"
                accent="²"
                meaning="Bridge"
                pattern="ha-SHI(-ga) = LOW-HIGH(-LOW)"
                className="bg-secondary-300/20"
              />
            </div>

            <p className="text-sm text-ink-black/60 italic">
              Note: 橋 is <strong>Odaka</strong> - the pitch drop only appears on the following particle (が, を, etc.).
              In isolation, it sounds like a flat pattern!
            </p>

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

        {/* Sources */}
        <section className="mt-8 text-center text-xs text-ink-black/40">
          <p>
            Content based on{" "}
            <a href="https://www.nhk.or.jp/bunken/book/book_dic_accent.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-black/60">
              NHK日本語発音アクセント新辞典
            </a>
            {" "}and standard Tokyo dialect phonology.
          </p>
        </section>
      </div>
    </main>
  );
}
