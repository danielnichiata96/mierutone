import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The 4 Pitch Patterns | Learn Japanese Pitch Accent",
  description: "Learn the four types of Japanese pitch accent patterns: Heiban, Atamadaka, Nakadaka, and Odaka. Visual examples and explanations.",
};

export default function PatternsPage() {
  return (
    <main className="min-h-screen bg-paper-white">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link href="/learn" className="text-ink-black/50 hover:text-ink-black transition-colors">
            Learn
          </Link>
          <span className="text-ink-black/30 mx-2">/</span>
          <span className="text-ink-black">Patterns</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-riso bg-secondary-300 flex items-center justify-center text-3xl">
              📊
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-ink-black">
                The 4 Pitch Patterns
              </h1>
              <p className="text-ink-black/50 font-mono">4つのアクセント型</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <article className="space-y-8">
          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Understanding Pitch Drop
            </h2>
            <p className="text-ink-black/80 leading-relaxed">
              Japanese pitch accent is defined by <strong>where the pitch drops</strong>.
              We use a number to indicate which mora has the drop:
            </p>
            <ul className="mt-4 space-y-2 text-ink-black/80">
              <li><strong>0</strong> = No drop (Heiban - flat)</li>
              <li><strong>1</strong> = Drop after 1st mora (Atamadaka - head-high)</li>
              <li><strong>2, 3, 4...</strong> = Drop after that mora (Nakadaka - middle-high)</li>
              <li><strong>N</strong> = Drop after last mora (Odaka - tail-high)</li>
            </ul>
          </section>

          {/* Pattern 1: Heiban */}
          <section className="riso-card p-6 border-l-4 border-primary-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-primary-500">0</span>
              <div>
                <h2 className="font-display text-xl font-bold text-ink-black">
                  平板型 Heiban
                </h2>
                <p className="text-sm text-ink-black/50">&quot;Flat&quot; pattern - no drop</p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-primary-300/10 rounded-riso">
              <p className="font-mono text-center text-lg">
                <span className="text-ink-cornflower">L</span>
                <span className="text-ink-coral">H H H</span>
                <span className="text-ink-black/40">...</span>
              </p>
              <p className="text-center text-sm text-ink-black/60 mt-2">
                Starts low, rises, stays high (including particles)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <p className="font-bold">桜 (さくら⁰)</p>
                <p className="text-ink-black/60">Cherry blossom</p>
                <p className="font-mono text-xs mt-1">さ↗く↗ら→</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <p className="font-bold">友達 (ともだち⁰)</p>
                <p className="text-ink-black/60">Friend</p>
                <p className="font-mono text-xs mt-1">と↗も↗だ↗ち→</p>
              </div>
            </div>

            <p className="text-sm text-ink-black/70 mt-4">
              <strong>Key:</strong> Heiban words stay high even when followed by particles.
              Say 桜が (sakura-ga) with the &quot;ga&quot; still high.
            </p>
          </section>

          {/* Pattern 2: Atamadaka */}
          <section className="riso-card p-6 border-l-4 border-accent-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-accent-500">1</span>
              <div>
                <h2 className="font-display text-xl font-bold text-ink-black">
                  頭高型 Atamadaka
                </h2>
                <p className="text-sm text-ink-black/50">&quot;Head-high&quot; pattern - drop after 1st</p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-accent-300/10 rounded-riso">
              <p className="font-mono text-center text-lg">
                <span className="text-ink-coral">H</span>
                <span className="text-ink-cornflower">L L L</span>
                <span className="text-ink-black/40">...</span>
              </p>
              <p className="text-center text-sm text-ink-black/60 mt-2">
                Starts high, immediately drops, stays low
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <p className="font-bold">猫 (ねこ¹)</p>
                <p className="text-ink-black/60">Cat</p>
                <p className="font-mono text-xs mt-1">ね↘こ</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <p className="font-bold">箸 (はし¹)</p>
                <p className="text-ink-black/60">Chopsticks</p>
                <p className="font-mono text-xs mt-1">は↘し</p>
              </div>
            </div>

            <p className="text-sm text-ink-black/70 mt-4">
              <strong>Key:</strong> Atamadaka is distinctive - the first mora is HIGH and
              everything after is LOW. Easy to recognize!
            </p>
          </section>

          {/* Pattern 3: Nakadaka */}
          <section className="riso-card p-6 border-l-4 border-secondary-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-secondary-500">2+</span>
              <div>
                <h2 className="font-display text-xl font-bold text-ink-black">
                  中高型 Nakadaka
                </h2>
                <p className="text-sm text-ink-black/50">&quot;Middle-high&quot; pattern - drop in middle</p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-secondary-300/10 rounded-riso">
              <p className="font-mono text-center text-lg">
                <span className="text-ink-cornflower">L</span>
                <span className="text-ink-coral">H H</span>
                <span className="text-ink-cornflower">L L</span>
                <span className="text-ink-black/40">...</span>
              </p>
              <p className="text-center text-sm text-ink-black/60 mt-2">
                Rises, peaks somewhere in the middle, then drops
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <p className="font-bold">卵 (たまご²)</p>
                <p className="text-ink-black/60">Egg</p>
                <p className="font-mono text-xs mt-1">た↗ま↘ご</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <p className="font-bold">男 (おとこ³)</p>
                <p className="text-ink-black/60">Man</p>
                <p className="font-mono text-xs mt-1">お↗と↗こ↘</p>
              </div>
            </div>

            <p className="text-sm text-ink-black/70 mt-4">
              <strong>Key:</strong> The number tells you where the peak is. 卵² means
              the pitch drops AFTER the 2nd mora.
            </p>
          </section>

          {/* Pattern 4: Odaka */}
          <section className="riso-card p-6 border-l-4 border-energy-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-energy-500">N</span>
              <div>
                <h2 className="font-display text-xl font-bold text-ink-black">
                  尾高型 Odaka
                </h2>
                <p className="text-sm text-ink-black/50">&quot;Tail-high&quot; pattern - drop after last</p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-energy-300/10 rounded-riso">
              <p className="font-mono text-center text-lg">
                <span className="text-ink-cornflower">L</span>
                <span className="text-ink-coral">H H H</span>
                <span className="text-ink-black/40">[+が]</span>
                <span className="text-ink-cornflower">L</span>
              </p>
              <p className="text-center text-sm text-ink-black/60 mt-2">
                Like Heiban, but drops when followed by a particle
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <p className="font-bold">橋 (はし²)</p>
                <p className="text-ink-black/60">Bridge</p>
                <p className="font-mono text-xs mt-1">は↗し↘が</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <p className="font-bold">山 (やま²)</p>
                <p className="text-ink-black/60">Mountain</p>
                <p className="font-mono text-xs mt-1">や↗ま↘が</p>
              </div>
            </div>

            <p className="text-sm text-ink-black/70 mt-4">
              <strong>Key:</strong> Odaka sounds identical to Heiban when alone!
              The difference only appears with particles. This is why 橋 vs 箸 requires context.
            </p>
          </section>

          {/* Summary */}
          <section className="riso-card p-6 bg-ink-black/5">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Quick Reference
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-ink-black/10">
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Name</th>
                    <th className="text-left py-2 px-3">Drop</th>
                    <th className="text-left py-2 px-3">Pattern</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-ink-black/5">
                    <td className="py-2 px-3 font-bold">0</td>
                    <td className="py-2 px-3">平板</td>
                    <td className="py-2 px-3">None</td>
                    <td className="py-2 px-3 font-mono">LHHH...</td>
                  </tr>
                  <tr className="border-b border-ink-black/5">
                    <td className="py-2 px-3 font-bold">1</td>
                    <td className="py-2 px-3">頭高</td>
                    <td className="py-2 px-3">After 1st</td>
                    <td className="py-2 px-3 font-mono">HLLL...</td>
                  </tr>
                  <tr className="border-b border-ink-black/5">
                    <td className="py-2 px-3 font-bold">2-N</td>
                    <td className="py-2 px-3">中高</td>
                    <td className="py-2 px-3">Middle</td>
                    <td className="py-2 px-3 font-mono">LHHL...</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold">N</td>
                    <td className="py-2 px-3">尾高</td>
                    <td className="py-2 px-3">After last</td>
                    <td className="py-2 px-3 font-mono">LHHH↘が</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/learn" className="riso-button-secondary text-center">
              ← Back to Learn
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
