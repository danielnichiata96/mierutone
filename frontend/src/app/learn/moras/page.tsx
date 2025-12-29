import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What are Moras? | Learn Japanese Pitch Accent",
  description: "Understanding moras (拍) - the rhythmic units of Japanese. Learn how moras differ from syllables and why they matter for pitch accent.",
};

export default function MorasPage() {
  return (
    <main className="min-h-screen bg-paper-white">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link href="/learn" className="text-ink-black/50 hover:text-ink-black transition-colors">
            Learn
          </Link>
          <span className="text-ink-black/30 mx-2">/</span>
          <span className="text-ink-black">Moras</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-riso bg-primary-300 flex items-center justify-center text-3xl">
              🎵
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-ink-black">
                What are Moras?
              </h1>
              <p className="text-ink-black/50 font-mono">拍（はく）とは</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <article className="prose-custom space-y-8">
          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              The Rhythmic Unit of Japanese
            </h2>
            <p className="text-ink-black/80 leading-relaxed">
              A <strong>mora (拍)</strong> is the fundamental rhythmic unit in Japanese.
              Think of it as a &quot;beat&quot; in the language. While English speakers think in syllables,
              Japanese speakers think in moras.
            </p>
            <p className="text-ink-black/80 leading-relaxed mt-4">
              Each mora takes <strong>roughly the same amount of time</strong> to pronounce.
              This is why Japanese has such a distinctive rhythm compared to English.
            </p>
          </section>

          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Moras vs Syllables
            </h2>
            <p className="text-ink-black/80 leading-relaxed mb-4">
              In English, we count syllables. In Japanese, we count moras. They&apos;re often different:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-ink-black/10">
                    <th className="text-left py-2 px-3 font-bold">Word</th>
                    <th className="text-left py-2 px-3 font-bold">Reading</th>
                    <th className="text-center py-2 px-3 font-bold">Syllables</th>
                    <th className="text-center py-2 px-3 font-bold">Moras</th>
                    <th className="text-left py-2 px-3 font-bold">Breakdown</th>
                  </tr>
                </thead>
                <tbody className="text-ink-black/80">
                  <tr className="border-b border-ink-black/5">
                    <td className="py-3 px-3 font-bold">東京</td>
                    <td className="py-3 px-3">とうきょう</td>
                    <td className="py-3 px-3 text-center">2</td>
                    <td className="py-3 px-3 text-center font-bold text-primary-500">4</td>
                    <td className="py-3 px-3 font-mono text-xs">と・う・きょ・う</td>
                  </tr>
                  <tr className="border-b border-ink-black/5">
                    <td className="py-3 px-3 font-bold">学校</td>
                    <td className="py-3 px-3">がっこう</td>
                    <td className="py-3 px-3 text-center">2</td>
                    <td className="py-3 px-3 text-center font-bold text-primary-500">4</td>
                    <td className="py-3 px-3 font-mono text-xs">が・っ・こ・う</td>
                  </tr>
                  <tr className="border-b border-ink-black/5">
                    <td className="py-3 px-3 font-bold">新聞</td>
                    <td className="py-3 px-3">しんぶん</td>
                    <td className="py-3 px-3 text-center">2</td>
                    <td className="py-3 px-3 text-center font-bold text-primary-500">4</td>
                    <td className="py-3 px-3 font-mono text-xs">し・ん・ぶ・ん</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold">ちょっと</td>
                    <td className="py-3 px-3">ちょっと</td>
                    <td className="py-3 px-3 text-center">2</td>
                    <td className="py-3 px-3 text-center font-bold text-primary-500">4</td>
                    <td className="py-3 px-3 font-mono text-xs">ちょ・っ・と</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Mora Counting Rules
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-primary-300/20 rounded-riso">
                <h3 className="font-bold mb-2">1. Regular kana = 1 mora</h3>
                <p className="text-sm text-ink-black/70">
                  あ, い, う, え, お, か, き, く... Each single kana is one mora.
                </p>
              </div>

              <div className="p-4 bg-secondary-300/20 rounded-riso">
                <h3 className="font-bold mb-2">2. Long vowels = 2 moras</h3>
                <p className="text-sm text-ink-black/70">
                  おう, えい, ああ... The extended sound counts as an extra mora.
                  <br />
                  Example: おかあさん = お・か・あ・さ・ん (5 moras)
                </p>
              </div>

              <div className="p-4 bg-accent-300/20 rounded-riso">
                <h3 className="font-bold mb-2">3. Small っ (sokuon) = 1 mora</h3>
                <p className="text-sm text-ink-black/70">
                  The small tsu creates a pause that counts as a full mora.
                  <br />
                  Example: きっと = き・っ・と (3 moras)
                </p>
              </div>

              <div className="p-4 bg-energy-300/20 rounded-riso">
                <h3 className="font-bold mb-2">4. ん (n) = 1 mora</h3>
                <p className="text-sm text-ink-black/70">
                  The nasal sound counts as its own mora.
                  <br />
                  Example: にほん = に・ほ・ん (3 moras)
                </p>
              </div>

              <div className="p-4 bg-ink-black/5 rounded-riso">
                <h3 className="font-bold mb-2">5. Combo kana = 1 mora</h3>
                <p className="text-sm text-ink-black/70">
                  きょ, しゃ, ちゅ... Small kana combinations count as one mora.
                  <br />
                  Example: きょう = きょ・う (2 moras, not 3)
                </p>
              </div>
            </div>
          </section>

          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Why Moras Matter for Pitch
            </h2>
            <p className="text-ink-black/80 leading-relaxed mb-4">
              Pitch accent is assigned <strong>per mora</strong>, not per syllable.
              Each mora gets either a HIGH or LOW pitch assignment.
            </p>
            <p className="text-ink-black/80 leading-relaxed">
              This is why understanding moras is essential for mastering pitch accent.
              When we say a word has &quot;accent on the 2nd mora,&quot; we mean the 2nd rhythmic unit,
              which might be in the middle of what English speakers consider a single syllable.
            </p>
          </section>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/learn/patterns" className="riso-button-secondary text-center">
              Next: Pitch Patterns →
            </Link>
            <Link href="/" className="riso-button-primary text-center">
              Try the Analyzer
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
