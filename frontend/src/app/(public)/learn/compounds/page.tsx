import Link from "next/link";
import type { Metadata } from "next";
import { PuzzleIcon } from "@/components/icons/DoodleIcons";
import { ExampleLink } from "@/components/ExampleLink";

export const metadata: Metadata = {
  title: "Compound Words | Learn Japanese Pitch Accent",
  description: "Learn how Japanese compound words form their pitch accent patterns. Understanding McCawley's rules and how two words combine into one.",
};

export default function CompoundsPage() {
  return (
    <main className="min-h-screen bg-paper-white">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link href="/learn" className="text-ink-black/50 hover:text-ink-black transition-colors">
            Learn
          </Link>
          <span className="text-ink-black/30 mx-2">/</span>
          <span className="text-ink-black">Compounds</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-riso bg-energy-300 flex items-center justify-center">
              <PuzzleIcon size={28} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-ink-black">
                Compound Words
              </h1>
              <p className="text-ink-black/50 font-mono">複合語（ふくごうご）</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <article className="space-y-8">
          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              When Words Combine
            </h2>
            <p className="text-ink-black/80 leading-relaxed">
              Japanese loves compound words - combining two or more words into one.
              When this happens, the pitch accent often changes according to predictable rules.
            </p>
            <p className="text-ink-black/80 leading-relaxed mt-4">
              For example, <strong>日本</strong> (にほん, Japan) + <strong>語</strong> (ご, language)
              = <strong>日本語</strong> (にほんご, Japanese language). The pitch pattern isn&apos;t
              just the two words stuck together - it forms a new pattern!
            </p>
          </section>

          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              McCawley&apos;s Rules
            </h2>
            <p className="text-ink-black/80 leading-relaxed mb-4">
              Linguist James McCawley identified patterns for <strong>predicting</strong> compound accent
              when a word isn&apos;t in the dictionary. The key factor is the <strong>mora count of N2</strong>:
            </p>

            <div className="p-4 bg-energy-300/20 rounded-riso border-l-4 border-energy-500 mb-4">
              <p className="text-sm text-ink-black/70">
                <strong>Important:</strong> These are predictive guidelines, not absolute rules.
                Dictionary entries (like 日本語⁰, 英語⁰, 花見³) override any prediction.
                Mierutone uses dictionary data when available, and only applies McCawley rules
                for unknown compounds.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-primary-300/20 rounded-riso border-l-4 border-primary-500">
                <h3 className="font-bold mb-2">N2 has 1-2 moras → Predict accent on last mora of N1</h3>
                <p className="text-sm text-ink-black/70 mb-3">
                  For short second elements, predict the accent falls on the last mora of N1.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <ExampleLink
                    word="出口"
                    reading="でぐち"
                    accent="¹"
                    meaning="Exit"
                    pattern="N1=で (1) + N2=ぐち (2) → ¹"
                  />
                  <ExampleLink
                    word="外国人"
                    reading="がいこくじん"
                    accent="⁴"
                    meaning="Foreigner"
                    pattern="N1=がいこく (4) + N2=じん (2) → ⁴"
                  />
                </div>
              </div>

              <div className="p-4 bg-secondary-300/20 rounded-riso border-l-4 border-secondary-500">
                <h3 className="font-bold mb-2">N2 has 3-4 moras → Predict accent on first mora of N2</h3>
                <p className="text-sm text-ink-black/70 mb-3">
                  Medium-length second elements shift the predicted accent to where N2 begins.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <ExampleLink
                    word="携帯電話"
                    reading="けいたいでんわ"
                    accent="⁵"
                    meaning="Mobile phone"
                    pattern="N1=けいたい (4) + N2=でんわ (3)"
                  />
                  <ExampleLink
                    word="国際空港"
                    reading="こくさいくうこう"
                    accent="⁵"
                    meaning="International airport"
                    pattern="N1=こくさい (4) + N2=くうこう (4)"
                  />
                </div>
              </div>

              <div className="p-4 bg-accent-300/20 rounded-riso border-l-4 border-accent-500">
                <h3 className="font-bold mb-2">N2 has 5+ moras → Follow N2&apos;s original accent</h3>
                <p className="text-sm text-ink-black/70 mb-3">
                  Long second elements (5+ moras) tend to keep their own accent pattern,
                  offset by the length of N1. This applies to longer technical terms and loanwords.
                </p>
                <p className="text-xs text-ink-black/50 italic">
                  Example: コミュニティーセンター⁶ - N2 preserves its accent shifted by N1.
                </p>
              </div>
            </div>
          </section>

          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Dictionary vs Rules
            </h2>
            <p className="text-ink-black/80 leading-relaxed">
              McCawley&apos;s rules are <strong>predictive guidelines</strong>, not absolute laws.
              Many common compounds have dictionary entries with their actual accent patterns,
              which may differ from the predicted pattern.
            </p>
            <div className="mt-4 p-4 bg-energy-300/20 rounded-riso">
              <p className="text-sm font-bold mb-2">How Mierutone handles this:</p>
              <ul className="text-sm text-ink-black/70 space-y-1">
                <li>• <strong>Dictionary match</strong> → Uses the recorded accent (high confidence)</li>
                <li>• <strong>No dictionary entry</strong> → Applies McCawley rules (lower confidence)</li>
                <li>• Shows component breakdown so you can see the analysis</li>
              </ul>
            </div>
          </section>

          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Compound Structure Breakdown
            </h2>
            <p className="text-ink-black/80 leading-relaxed mb-4">
              The analyzer shows you how compounds are split and analyzed:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-ink-black/10">
                    <th className="text-left py-2 px-3 font-bold">Compound</th>
                    <th className="text-left py-2 px-3 font-bold">N1</th>
                    <th className="text-left py-2 px-3 font-bold">N2</th>
                    <th className="text-left py-2 px-3 font-bold">N2 Moras</th>
                    <th className="text-left py-2 px-3 font-bold">Rule Applied</th>
                  </tr>
                </thead>
                <tbody className="text-ink-black/80">
                  <tr className="border-b border-ink-black/5">
                    <td className="py-3 px-3 font-bold">
                      <Link href="/?text=花見" className="text-primary-500 hover:underline">花見</Link>
                    </td>
                    <td className="py-3 px-3">花 (はな)</td>
                    <td className="py-3 px-3">見 (み)</td>
                    <td className="py-3 px-3 text-center">1</td>
                    <td className="py-3 px-3">Last mora of N1</td>
                  </tr>
                  <tr className="border-b border-ink-black/5">
                    <td className="py-3 px-3 font-bold">
                      <Link href="/?text=電車" className="text-primary-500 hover:underline">電車</Link>
                    </td>
                    <td className="py-3 px-3">電 (でん)</td>
                    <td className="py-3 px-3">車 (しゃ)</td>
                    <td className="py-3 px-3 text-center">1</td>
                    <td className="py-3 px-3">Last mora of N1</td>
                  </tr>
                  <tr className="border-b border-ink-black/5">
                    <td className="py-3 px-3 font-bold">
                      <Link href="/?text=大学生" className="text-primary-500 hover:underline">大学生</Link>
                    </td>
                    <td className="py-3 px-3">大学 (だいがく)</td>
                    <td className="py-3 px-3">生 (せい)</td>
                    <td className="py-3 px-3 text-center">2</td>
                    <td className="py-3 px-3">Last mora of N1</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold">
                      <Link href="/?text=外国人" className="text-primary-500 hover:underline">外国人</Link>
                    </td>
                    <td className="py-3 px-3">外国 (がいこく)</td>
                    <td className="py-3 px-3">人 (じん)</td>
                    <td className="py-3 px-3 text-center">2</td>
                    <td className="py-3 px-3">Last mora of N1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="riso-card p-6">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Common Compound Suffixes
            </h2>
            <p className="text-ink-black/80 leading-relaxed mb-4">
              Some suffixes appear frequently and follow consistent patterns:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">〜語</span>
                <p className="text-xs text-ink-black/60 mt-1">language (1 mora)</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">〜人</span>
                <p className="text-xs text-ink-black/60 mt-1">person (2 moras)</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">〜的</span>
                <p className="text-xs text-ink-black/60 mt-1">-tic/-like (2 moras)</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">〜会社</span>
                <p className="text-xs text-ink-black/60 mt-1">company (3 moras)</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">〜大学</span>
                <p className="text-xs text-ink-black/60 mt-1">university (4 moras)</p>
              </div>
              <div className="p-3 bg-ink-black/5 rounded-riso">
                <span className="font-mono text-lg">〜問題</span>
                <p className="text-xs text-ink-black/60 mt-1">problem (4 moras)</p>
              </div>
            </div>
          </section>

          <section className="riso-card p-6 bg-energy-300/10">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Practice Tips
            </h2>
            <ul className="space-y-3 text-ink-black/80">
              <li className="flex items-start gap-2">
                <span className="text-energy-600 font-bold">1.</span>
                <span>Start by learning common suffixes (-語, -人, -的) and their typical behavior.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-energy-600 font-bold">2.</span>
                <span>When you encounter a new compound, try to identify N1 and N2 first.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-energy-600 font-bold">3.</span>
                <span>Count the moras in N2 to predict where the accent might fall.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-energy-600 font-bold">4.</span>
                <span>Remember: dictionary entries override predictions. When in doubt, check!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-energy-600 font-bold">5.</span>
                <span>Use the analyzer to see both the compound pattern and component breakdown.</span>
              </li>
            </ul>
          </section>

          <section className="riso-card p-6 border-l-4 border-ink-black/20">
            <h2 className="font-display text-xl font-bold text-ink-black mb-4">
              Exceptions & Variations
            </h2>
            <p className="text-ink-black/80 leading-relaxed">
              Not all compounds follow McCawley&apos;s rules perfectly. Some factors that affect accent:
            </p>
            <ul className="mt-4 space-y-2 text-ink-black/80">
              <li>• <strong>Word origin (goshu):</strong> Native Japanese vs Sino-Japanese vs foreign loanwords</li>
              <li>• <strong>Frequency:</strong> Very common compounds may have crystallized patterns</li>
              <li>• <strong>Semantic bonding:</strong> How tightly the elements are fused</li>
              <li>• <strong>Regional variation:</strong> Dialects may differ from standard Tokyo accent</li>
            </ul>
            <p className="text-sm text-ink-black/60 mt-4 italic">
              When the analyzer shows &quot;compound_rule&quot; as the source with low confidence,
              it&apos;s applying McCawley rules as a prediction.
            </p>
          </section>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/learn/particles" className="riso-button-secondary text-center">
              ← Particles & Pitch
            </Link>
            <Link href="/learn" className="riso-button-secondary text-center">
              Back to Learn
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
                McCawley, James D. (1968). <em>The Phonological Component of a Grammar of Japanese</em>. Mouton.
              </li>
              <li>
                Kubozono, Haruo (2011). &quot;Japanese pitch accent.&quot; <em>The Blackwell Companion to Phonology</em>.
              </li>
              <li>
                <a href="https://www.nhk.or.jp/bunken/book/book_dic_accent.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-black/60">
                  NHK日本語発音アクセント新辞典
                </a>
                {" "}- Standard reference for Tokyo dialect pitch accent
              </li>
              <li>
                Pitch data from{" "}
                <a href="https://github.com/mifunetoshiro/kanjium" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-black/60">
                  Kanjium
                </a>
                {" "}dictionary project.
              </li>
            </ul>
          </section>
        </article>
      </div>
    </main>
  );
}
