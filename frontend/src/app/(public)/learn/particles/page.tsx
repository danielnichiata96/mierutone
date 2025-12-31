import Link from "next/link";
import type { Metadata } from "next";
import { LinkIcon } from "@/components/icons/DoodleIcons";
import { ExampleLink } from "@/components/ExampleLink";

export const metadata: Metadata = {
  title: "Particles & Pitch | Learn Japanese Pitch Accent",
  description: "Learn how Japanese particles inherit pitch from the words they follow. Understanding the relationship between particles and pitch accent.",
};

export default function ParticlesPage() {
  return (
    <main className="min-h-screen bg-paper-white">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link href="/learn" className="text-ink-black/50 hover:text-ink-black transition-colors">
            Learn
          </Link>
          <span className="text-ink-black/30 mx-2">/</span>
          <span className="text-ink-black">Particles</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-riso bg-accent-300 flex items-center justify-center">
              <LinkIcon size={28} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-ink-black">
                Particles & Pitch
              </h1>
              <p className="text-ink-black/50 font-mono">助詞（じょし）とアクセント</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <article className="space-y-8">
          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Particles Don&apos;t Have Their Own Pitch
            </h2>
            <p className="text-ink-black/80 leading-relaxed">
              Japanese particles (が, は, を, に, etc.) don&apos;t have independent pitch accents.
              Instead, they <strong>inherit their pitch</strong> from the word they follow.
              This is why particles are critical for distinguishing certain accent patterns.
            </p>
            <p className="text-ink-black/80 leading-relaxed mt-4">
              Think of particles as &quot;pitch followers&quot; - they simply continue whatever
              pitch pattern came before them.
            </p>
          </section>

          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              How Particles Reveal Accent Type
            </h2>
            <p className="text-ink-black/80 leading-relaxed mb-4">
              Remember <strong>Heiban (平板)</strong> vs <strong>Odaka (尾高)</strong>?
              They sound identical in isolation! The difference only appears when a particle follows:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-ink-black/10">
                    <th className="text-left py-2 px-3 font-bold">Word</th>
                    <th className="text-left py-2 px-3 font-bold">Type</th>
                    <th className="text-left py-2 px-3 font-bold">Alone</th>
                    <th className="text-left py-2 px-3 font-bold">+ が</th>
                  </tr>
                </thead>
                <tbody className="text-ink-black/80">
                  <tr className="border-b border-ink-black/5">
                    <td className="py-3 px-3">
                      <Link href="/?text=桜" className="text-primary-500 hover:underline font-bold">桜</Link>
                      <span className="text-ink-black/50 ml-1">(cherry)</span>
                    </td>
                    <td className="py-3 px-3">Heiban⁰</td>
                    <td className="py-3 px-3 font-mono">さ↗くら―</td>
                    <td className="py-3 px-3 font-mono text-primary-500">さ↗くら<strong>が</strong>―</td>
                  </tr>
                  <tr className="border-b border-ink-black/5">
                    <td className="py-3 px-3">
                      <Link href="/?text=山" className="text-primary-500 hover:underline font-bold">山</Link>
                      <span className="text-ink-black/50 ml-1">(mountain)</span>
                    </td>
                    <td className="py-3 px-3">Odaka²</td>
                    <td className="py-3 px-3 font-mono">や↗ま―</td>
                    <td className="py-3 px-3 font-mono text-accent-500">や↗ま<strong>↘が</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-ink-black/60 mt-4 italic">
              Notice: 桜が stays high on the particle, while 山が drops on the particle.
              Without the particle, both would sound the same!
            </p>
          </section>

          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              The Three Particle Behaviors
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-primary-300/20 rounded-riso">
                <h3 className="font-bold mb-2">1. After Heiban (平板) → Stays HIGH</h3>
                <p className="text-sm text-ink-black/70">
                  Heiban words have no pitch drop, so particles continue high.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <ExampleLink
                    word="友達が"
                    meaning="friend (subj.)"
                    pattern="と↗もだち<が>―"
                    showAudio={false}
                  />
                  <ExampleLink
                    word="桜を"
                    meaning="cherry (obj.)"
                    pattern="さ↗くら<を>―"
                    showAudio={false}
                  />
                </div>
              </div>

              <div className="p-4 bg-accent-300/20 rounded-riso">
                <h3 className="font-bold mb-2">2. After Odaka (尾高) → DROP to LOW</h3>
                <p className="text-sm text-ink-black/70">
                  Odaka words drop on the particle - this is their defining feature!
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <ExampleLink
                    word="橋が"
                    meaning="bridge (subj.)"
                    pattern="は↗し↘<が>"
                    showAudio={false}
                  />
                  <ExampleLink
                    word="山を"
                    meaning="mountain (obj.)"
                    pattern="や↗ま↘<を>"
                    showAudio={false}
                  />
                </div>
              </div>

              <div className="p-4 bg-secondary-300/20 rounded-riso">
                <h3 className="font-bold mb-2">3. After Atamadaka/Nakadaka → Already LOW</h3>
                <p className="text-sm text-ink-black/70">
                  The drop already happened within the word, so particles stay low.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <ExampleLink
                    word="猫が"
                    meaning="cat (subj.)"
                    pattern="ね↘こ<が>"
                    showAudio={false}
                  />
                  <ExampleLink
                    word="卵を"
                    meaning="egg (obj.)"
                    pattern="た↗ま↘ご<を>"
                    showAudio={false}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Common Particles Reference
            </h2>
            <p className="text-ink-black/80 leading-relaxed mb-4">
              All of these particles follow the same pitch inheritance rules:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">が</span>
                <p className="text-xs text-ink-black/60 mt-1">subject</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">を</span>
                <p className="text-xs text-ink-black/60 mt-1">object</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">に</span>
                <p className="text-xs text-ink-black/60 mt-1">direction</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">へ</span>
                <p className="text-xs text-ink-black/60 mt-1">toward</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">で</span>
                <p className="text-xs text-ink-black/60 mt-1">at/by</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">と</span>
                <p className="text-xs text-ink-black/60 mt-1">with</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">から</span>
                <p className="text-xs text-ink-black/60 mt-1">from</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">まで</span>
                <p className="text-xs text-ink-black/60 mt-1">until</p>
              </div>
            </div>
          </section>

          <section className="riso-card p-6 border-l-4 border-energy-500">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Special Case: は (Topic Marker)
            </h2>
            <p className="text-ink-black/80 leading-relaxed">
              The topic marker <strong>は</strong> follows the same rules as other particles,
              but it often appears in longer phrases where multiple pitch patterns interact.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <ExampleLink
                word="私は"
                reading="わたし"
                accent="⁰"
                meaning="I (topic) - Heiban, stays high"
                pattern="わ↗たし<は>―"
              />
              <ExampleLink
                word="彼女は"
                reading="かのじょ"
                accent="¹"
                meaning="She (topic) - Atamadaka, stays low"
                pattern="か↘のじょ<は>"
              />
            </div>
          </section>

          <section className="riso-card p-6 bg-accent-300/10">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Practice Tips
            </h2>
            <ul className="space-y-3 text-ink-black/80">
              <li className="flex items-start gap-2">
                <span className="text-accent-500 font-bold">1.</span>
                <span>When learning new vocabulary, always learn the accent number. It tells you what happens to following particles.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-500 font-bold">2.</span>
                <span>Practice saying words with particles attached: 「猫が」「桜を」「山へ」</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-500 font-bold">3.</span>
                <span>Pay special attention to Heiban vs Odaka pairs - they&apos;re only different when particles follow!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-500 font-bold">4.</span>
                <span>Use the analyzer to see how particles connect to different word types.</span>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/learn/patterns" className="riso-button-secondary text-center">
              ← Pitch Patterns
            </Link>
            <Link href="/learn/compounds" className="riso-button-secondary text-center">
              Compound Words →
            </Link>
            <Link href="/" className="riso-button-primary text-center">
              Try the Analyzer
            </Link>
          </div>

          {/* Sources */}
          <section className="mt-8 pt-6 border-t border-ink-black/10 text-xs text-ink-black/40">
            <p className="font-bold mb-2">Sources</p>
            <ul className="space-y-1">
              <li>
                <a href="https://www.nhk.or.jp/bunken/book/book_dic_accent.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-black/60">
                  NHK日本語発音アクセント新辞典
                </a>
                {" "}- Standard reference for Tokyo dialect pitch accent
              </li>
              <li>
                Vance, Timothy J. (2008). <em>The Sounds of Japanese</em>. Cambridge University Press.
              </li>
              <li>
                Kawahara, Shigeto (2015). &quot;The phonology of Japanese accent.&quot; <em>Handbook of Japanese Phonetics and Phonology</em>.
              </li>
            </ul>
          </section>
        </article>
      </div>
    </main>
  );
}
