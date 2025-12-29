"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { exampleCategories, type ExampleCategory, type Example } from "@/data/examples";

function CategoryCard({
  category,
  onSelect,
}: {
  category: ExampleCategory;
  onSelect: (text: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="riso-card overflow-hidden">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-4 hover:bg-ink-black/5 transition-colors"
      >
        <div className="w-12 h-12 rounded-riso bg-primary-300/30 flex items-center justify-center text-2xl">
          {category.icon}
        </div>
        <div className="flex-1 text-left">
          <h2 className="font-display text-lg font-bold text-ink-black">
            {category.name}
          </h2>
          <p className="text-xs text-ink-black/50 font-mono">{category.nameJp}</p>
          <p className="text-sm text-ink-black/60 mt-1">{category.description}</p>
        </div>
        <div className="text-ink-black/40">
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Items */}
      {isExpanded && (
        <div className="border-t-2 border-ink-black/10 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {category.items.map((item, index) => (
              <button
                key={index}
                onClick={() => onSelect(item.text)}
                className="p-3 rounded-riso border-2 border-ink-black/10 hover:border-primary-500 hover:bg-primary-300/10 transition-all text-left group"
              >
                <p className="font-bold text-ink-black group-hover:text-primary-500 transition-colors">
                  {item.text}
                </p>
                <p className="text-xs text-ink-black/50 truncate">{item.translation}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamplesPage() {
  const router = useRouter();

  const handleSelect = (text: string) => {
    // Navigate to home with the text as a query parameter
    router.push(`/?text=${encodeURIComponent(text)}`);
  };

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

        {/* Quick Stats */}
        <section className="mb-8 flex justify-center gap-6 text-center">
          <div className="riso-card px-6 py-3">
            <p className="text-2xl font-bold text-ink-black">{exampleCategories.length}</p>
            <p className="text-xs text-ink-black/50">Categories</p>
          </div>
          <div className="riso-card px-6 py-3">
            <p className="text-2xl font-bold text-ink-black">
              {exampleCategories.reduce((sum, cat) => sum + cat.items.length, 0)}
            </p>
            <p className="text-xs text-ink-black/50">Examples</p>
          </div>
        </section>

        {/* Category List */}
        <section className="space-y-4">
          {exampleCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onSelect={handleSelect}
            />
          ))}
        </section>

        {/* CTA */}
        <section className="mt-12 text-center">
          <p className="text-ink-black/60 mb-4">
            Want to analyze your own text?
          </p>
          <button
            onClick={() => router.push("/")}
            className="riso-button-primary"
          >
            Go to Analyzer
          </button>
        </section>
      </div>
    </main>
  );
}
