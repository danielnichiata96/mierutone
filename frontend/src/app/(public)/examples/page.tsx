"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { exampleCategories, type ExampleCategory, type IconName } from "@/data/examples";
import {
  WaveIcon,
  ShuffleIcon,
  HashIcon,
  RunIcon,
  PaletteIcon,
  MapIcon,
  ChatIcon,
  LinkIcon,
} from "@/components/icons/DoodleIcons";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import type { ComponentType } from "react";

const iconMap: Record<IconName, ComponentType<{ size?: number; className?: string }>> = {
  wave: WaveIcon,
  shuffle: ShuffleIcon,
  hash: HashIcon,
  run: RunIcon,
  palette: PaletteIcon,
  map: MapIcon,
  chat: ChatIcon,
  link: LinkIcon,
};

function CategoryCard({
  category,
  onSelect,
  defaultExpanded = false,
}: {
  category: ExampleCategory;
  onSelect: (text: string) => void;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="riso-card overflow-hidden">
      {/* Category Header */}
      <div className="w-full p-4 flex items-center gap-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${category.name} category`}
          className="flex items-center gap-4 flex-1 hover:bg-ink-black/5 transition-colors rounded-riso p-1 -m-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <div className={`w-12 h-12 rounded-riso flex items-center justify-center transition-colors ${isExpanded ? "bg-primary-500/20" : "bg-primary-300/30"}`}>
            {(() => {
              const Icon = iconMap[category.iconName];
              return <Icon size={24} />;
            })()}
          </div>
          <div className="flex-1 text-left">
            <h2 className="font-display text-lg font-bold text-ink-black">
              {category.name}
            </h2>
            <p className="text-xs text-ink-black/50 font-mono">{category.nameJp}</p>
            <p className="text-sm text-ink-black/60 mt-1">{category.description}</p>
          </div>
          <div className={`text-ink-black/40 transition-colors ${isExpanded ? "text-primary-500" : ""}`}>
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <AudioPlayButton text={category.nameJp} size="md" />
      </div>

      {/* Expanded Items */}
      {isExpanded && (
        <div className="border-t-2 border-ink-black/10 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {category.items.map((item) => (
              <div
                key={`${category.id}-${item.text}`}
                className="p-3 rounded-riso border-2 border-ink-black/10 hover:border-primary-500 hover:bg-primary-300/10 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => onSelect(item.text)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="font-bold text-ink-black group-hover:text-primary-500 transition-colors">
                      {item.text}
                    </p>
                    <p className="text-xs text-ink-black/50 truncate">{item.translation}</p>
                  </button>
                  <AudioPlayButton text={item.text} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamplesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSelect = (text: string) => {
    // Navigate to home with the text as a query parameter
    router.push(`/?text=${encodeURIComponent(text)}`);
  };

  // Filter categories and items based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return exampleCategories;

    const term = searchTerm.toLowerCase();
    return exampleCategories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.text.toLowerCase().includes(term) ||
            item.translation.toLowerCase().includes(term)
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [searchTerm]);

  const totalFilteredExamples = filteredCategories.reduce(
    (sum, cat) => sum + cat.items.length,
    0
  );

  return (
    <main className="min-h-screen bg-paper-white">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Header */}
        <section className="mb-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-black mb-3">
            Example Library
          </h1>
          <p className="text-ink-black/60 text-lg max-w-2xl mx-auto">
            Click any word or phrase to analyze its pitch pattern. Start with greetings and work your way up!
          </p>
        </section>

        {/* Search */}
        <section className="mb-6">
          <div className="relative max-w-md mx-auto">
            <input
              type="search"
              placeholder="Search examples (日本語 or English)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-white border-2 border-ink-black/10 rounded-riso focus:border-primary-500 focus:outline-none transition-colors"
              aria-label="Search examples"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-black/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-black/40 hover:text-ink-black transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="mb-8 flex justify-center gap-6 text-center">
          <div className="riso-card px-6 py-3">
            <p className="text-2xl font-bold text-ink-black">{filteredCategories.length}</p>
            <p className="text-xs text-ink-black/50">
              {searchTerm ? "Matching Categories" : "Categories"}
            </p>
          </div>
          <div className="riso-card px-6 py-3">
            <p className="text-2xl font-bold text-ink-black">{totalFilteredExamples}</p>
            <p className="text-xs text-ink-black/50">
              {searchTerm ? "Matching Examples" : "Examples"}
            </p>
          </div>
        </section>

        {/* Category List */}
        <section className="space-y-4">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onSelect={handleSelect}
                defaultExpanded={searchTerm.length > 0}
              />
            ))
          ) : (
            <div className="text-center py-12 text-ink-black/50">
              <p className="text-lg mb-2">No examples found for &ldquo;{searchTerm}&rdquo;</p>
              <button
                onClick={() => setSearchTerm("")}
                className="text-primary-500 hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="mt-12 text-center">
          <p className="text-ink-black/60 mb-4">
            Want to analyze your own text?
          </p>
          <Link href="/" className="riso-button-primary inline-block">
            Go to Analyzer
          </Link>
        </section>

        {/* Footer spacing */}
        <footer className="mt-16 pt-8 border-t border-ink-black/10 text-center text-xs text-ink-black/40">
          <p>
            {exampleCategories.reduce((sum, cat) => sum + cat.items.length, 0)} examples across {exampleCategories.length} categories
          </p>
        </footer>
      </div>
    </main>
  );
}
