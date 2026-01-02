"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getDecks } from "@/lib/api";
import type { DeckSummary, DeckListResponse } from "@/types/deck";
import { PHASE_LABELS } from "@/types/deck";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-ink-black/10 rounded ${className}`} />
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 bg-ink-black/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary-500 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

function DeckCard({ deck }: { deck: DeckSummary }) {
  const phaseLabel = PHASE_LABELS[deck.phase] || `Phase ${deck.phase}`;

  return (
    <Link
      href={`/learn/${deck.slug}`}
      className="riso-card p-5 hover:border-primary-400 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-bold text-ink-black group-hover:text-primary-600 transition-colors">
            {deck.title}
          </h3>
          {deck.title_ja && (
            <p className="text-sm text-ink-black/50">{deck.title_ja}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {deck.is_free ? (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
              Free
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded">
              Pro
            </span>
          )}
        </div>
      </div>

      {deck.description && (
        <p className="text-sm text-ink-black/60 mb-4 line-clamp-2">
          {deck.description}
        </p>
      )}

      <div className="space-y-2">
        <ProgressBar percent={deck.progress_percent} />
        <div className="flex items-center justify-between text-xs text-ink-black/50">
          <span>{deck.cards_seen} / {deck.card_count} cards</span>
          <span>{phaseLabel}</span>
        </div>
      </div>

      {deck.is_completed && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Completed
        </div>
      )}
    </Link>
  );
}

function DeckCardSkeleton() {
  return (
    <div className="riso-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-5 w-12 rounded" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <Skeleton className="h-1.5 w-full rounded-full" />
    </div>
  );
}

export default function LearnPage() {
  const [data, setData] = useState<DeckListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  useEffect(() => {
    getDecks(selectedPhase ?? undefined)
      .then(setData)
      .catch((err) => {
        console.error("Failed to load decks:", err);
        toast.error("Failed to load decks");
      })
      .finally(() => setLoading(false));
  }, [selectedPhase]);

  // Group decks by phase
  const decksByPhase = data?.decks.reduce((acc, deck) => {
    if (!acc[deck.phase]) acc[deck.phase] = [];
    acc[deck.phase].push(deck);
    return acc;
  }, {} as Record<number, DeckSummary[]>) || {};

  const phases = Object.keys(decksByPhase).map(Number).sort();

  return (
    <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
      {/* Header */}
      <section className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-black mb-2">
          Learn
        </h1>
        <p className="text-ink-black/60">
          Master pitch accent with guided practice
        </p>
      </section>

      {/* Stats Summary */}
      {data && (
        <section className="mb-8">
          <div className="riso-card p-5 bg-gradient-to-r from-primary-300/10 to-secondary-300/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-ink-black">
                  {data.cards_learned} / {data.total_cards}
                </p>
                <p className="text-sm text-ink-black/60">words learned</p>
              </div>
              <div className="w-32">
                <ProgressBar
                  percent={data.total_cards > 0
                    ? (data.cards_learned / data.total_cards) * 100
                    : 0
                  }
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Phase Filter */}
      <section className="mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedPhase(null)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              selectedPhase === null
                ? "bg-ink-black text-white"
                : "bg-ink-black/5 text-ink-black/70 hover:bg-ink-black/10"
            }`}
          >
            All
          </button>
          {[1, 2, 3, 4].map((phase) => (
            <button
              key={phase}
              onClick={() => setSelectedPhase(phase)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedPhase === phase
                  ? "bg-ink-black text-white"
                  : "bg-ink-black/5 text-ink-black/70 hover:bg-ink-black/10"
              }`}
            >
              {PHASE_LABELS[phase]}
            </button>
          ))}
        </div>
      </section>

      {/* Deck Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <DeckCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.decks.length === 0 ? (
        <div className="riso-card p-8 text-center">
          <p className="text-ink-black/60 mb-4">
            No decks available yet.
          </p>
        </div>
      ) : selectedPhase ? (
        // Filtered view - flat grid
        <div className="grid md:grid-cols-2 gap-4">
          {data?.decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      ) : (
        // All view - grouped by phase
        <div className="space-y-8">
          {phases.map((phase) => (
            <section key={phase}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display text-lg font-bold text-ink-black">
                  {PHASE_LABELS[phase]}
                </h2>
                {phase === 1 && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                    Free
                  </span>
                )}
                {phase > 1 && (
                  <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded">
                    Pro
                  </span>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {decksByPhase[phase].map((deck) => (
                  <DeckCard key={deck.id} deck={deck} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
