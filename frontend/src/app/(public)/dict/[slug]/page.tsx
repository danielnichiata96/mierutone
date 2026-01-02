import { Metadata } from "next";
import { cache } from "react";
import { PitchVisualizer } from "@/components/PitchVisualizer";
import { Legend } from "@/components/Legend";
import { analyzeText } from "@/lib/api";
import NextLink from "next/link";
import { getAccentLabel } from "@/types/pitch";
import { DictionarySearch } from "@/components/DictionarySearch";

interface Props {
    params: { slug: string };
}

// Cached fetch to deduplicate between generateMetadata and page render
const getAnalysis = cache(async (text: string) => {
    return analyzeText(text);
});

// Safe decode that returns null on invalid escape sequences
function safeDecodeSlug(slug: string): string | null {
    try {
        return decodeURIComponent(slug);
    } catch {
        return null;
    }
}

// Validate input contains only expected characters (Japanese, basic punctuation)
// Prevents XSS via malicious URL slugs
function isValidJapaneseText(text: string): boolean {
    // Allow:
    // - \u3040-\u309F: Hiragana (incl. ゝゞ repeat marks)
    // - \u30A0-\u30FF: Katakana (incl. ー prolonged, ・ middle dot, ヽヾ repeat)
    // - \u4E00-\u9FFF: CJK Unified Ideographs (kanji)
    // - \u3000-\u303F: CJK Punctuation (incl. 々 repeat, 　 fullwidth space, 「」quotes)
    // - \uFF00-\uFFEF: Fullwidth forms (incl. ！？ fullwidth punctuation)
    // - Basic ASCII alphanumerics and whitespace
    // Block: <, >, ", ', &, script tags, control chars, etc.
    const validPattern = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF0-9a-zA-Z\s]+$/;
    return validPattern.test(text) && text.length <= 500;
}

// Safely serialize JSON-LD to prevent XSS via </script> injection
// Escapes characters that could break out of script context
function safeJsonLd(obj: object): string {
    return JSON.stringify(obj)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/\u2028/g, "\\u2028")  // LINE SEPARATOR
        .replace(/\u2029/g, "\\u2029"); // PARAGRAPH SEPARATOR
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const text = safeDecodeSlug(params.slug);
    if (!text) {
        return { title: "Dictionary | MieruTone" };
    }

    try {
        const data = await getAnalysis(text);
        const title = data.is_homophone_lookup
            ? `Pitch accent for 「${text}」 (${data.homophones?.length} variations)`
            : `Pitch accent for ${text}`;

        return {
            title,
            description: `Learn the correct pitch accent for ${text}. MieruTone helps you visualize Japanese intonation and pronunciation clearly.`,
            openGraph: {
                title,
                description: `See the pitch accent pattern for ${text} with interactive visualizations.`,
                type: "website",
            },
        };
    } catch {
        return { title: "Dictionary | MieruTone" };
    }
}

export default async function DictionaryPage({ params }: Props) {
    const text = safeDecodeSlug(params.slug);
    const displayText = text ?? params.slug; // Fallback to raw slug for display
    let data;
    let error = null;

    // Validate text contains only expected Japanese characters
    const isValidInput = text && isValidJapaneseText(text);

    if (!text) {
        error = "Invalid URL encoding";
    } else if (!isValidInput) {
        error = "Invalid characters in input";
    } else {
        try {
            data = await getAnalysis(text);
        } catch (e) {
            error = e instanceof Error ? e.message : "Failed to analyze text";
        }
    }

    // Generate JSON-LD for LLM discovery (only for valid, sanitized input)
    const jsonLd = data && isValidInput ? {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "name": text,
        "description": data.is_homophone_lookup
            ? `Japanese word or phrase with ${data.homophones?.length} possible pitch accent patterns.`
            : `Analyzed Japanese phrase: ${text}`,
        "inDefinedTermSet": "https://mierutone.com/dictionary",
        "url": `https://mierutone.com/dict/${encodeURIComponent(text)}`,
    } : null;

    return (
        <main className="min-h-screen bg-paper-white">
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
                />
            )}

            <div className="container mx-auto px-6 py-8 max-w-5xl">
                <header className="mb-8">
                    <NextLink href="/" className="text-sm font-bold text-ink-black/40 hover:text-primary-500 transition-colors flex items-center gap-2 mb-4">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Analyzer
                    </NextLink>
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-black mb-2 leading-tight">
                        {displayText}
                    </h1>
                    <p className="text-ink-black/60 text-base">
                        Detailed pitch accent analysis and visualization
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <section className="lg:col-span-4 space-y-6">
                        <div className="riso-card bg-primary-50">
                            <h3 className="font-bold text-ink-black border-b border-primary-100 pb-2 mb-3">Quick Summary</h3>
                            {data?.is_homophone_lookup ? (
                                <p className="text-sm text-ink-black/70">
                                    This reading has multiple possible accent patterns depending on the kanji.
                                </p>
                            ) : (
                                <ul className="space-y-2 text-sm">
                                    {data?.words.map((w, i) => (
                                        <li key={i} className="flex justify-between">
                                            <span className="font-medium">{w.surface}</span>
                                            <span className="text-ink-black/50">{getAccentLabel(w.accent_type, w.mora_count)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <Legend />
                    </section>

                    <section className="lg:col-span-8">
                        {error ? (
                            <div className="riso-card border-accent-500 bg-accent-300/30 text-center">
                                <p className="text-accent-500 font-bold mb-2">Analysis Failed</p>
                                <p className="text-ink-black/70 text-sm">{error}</p>
                            </div>
                        ) : data && (
                            <div className="space-y-6">
                                <div className="riso-card min-h-[280px]">
                                    <PitchVisualizer
                                        words={data.words}
                                        isHomophoneLookup={data.is_homophone_lookup}
                                        homophones={data.homophones}
                                        searchReading={displayText}
                                    />
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <section className="mt-12 border-t-2 border-ink-black/5 pt-12">
                    <h2 className="text-xl font-bold text-ink-black mb-6">Explore More</h2>
                    <DictionarySearch />
                </section>
            </div>
        </main>
    );
}
