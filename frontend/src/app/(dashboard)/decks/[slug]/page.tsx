"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { getDeck, updateDeckProgress, textToSpeech, createAudioUrl, revokeAudioUrl } from "@/lib/api";
import type { DeckDetail, Card } from "@/types/deck";
import { ACCENT_TYPE_LABELS } from "@/types/deck";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-ink-black/10 rounded ${className}`} />
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="h-1 bg-ink-black/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary-500 rounded-full transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// Split Japanese text into mora (handles small kana properly)
function splitIntoMorae(text: string): string[] {
  const morae: string[] = [];
  const smallKana = /^[ゃゅょぁぃぅぇぉャュョァィゥェォー]$/;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    // Check if next char is small kana (combines with current)
    if (nextChar && smallKana.test(nextChar)) {
      morae.push(char + nextChar);
      i++; // Skip next char
    } else {
      morae.push(char);
    }
  }

  return morae;
}

function PitchPattern({ pattern, reading }: { pattern: string; reading: string }) {
  // Convert pattern like "LH" or "HLL" to visual representation
  const morae = splitIntoMorae(reading);
  const patternChars = pattern.split("");

  return (
    <div className="flex items-end gap-0.5 justify-center my-4">
      {morae.map((mora, i) => {
        const isHigh = patternChars[i] === "H";
        const nextIsHigh = patternChars[i + 1] === "H";
        const showDrop = isHigh && !nextIsHigh && i < morae.length - 1;

        return (
          <div key={i} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                isHigh
                  ? "bg-primary-500 text-white -translate-y-3"
                  : "bg-secondary-400 text-white"
              }`}
            >
              {mora}
            </div>
            {showDrop && (
              <div className="text-xs text-ink-black/40 mt-1">↘</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CardView({
  card,
  onNext,
  onPrev,
  currentIndex,
  totalCards,
  isFirst,
  isLast,
}: {
  card: Card;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalCards: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount or card change
  useEffect(() => {
    return () => {
      if (audioUrl) {
        revokeAudioUrl(audioUrl);
      }
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioUrl, audioElement]);

  const playAudio = useCallback(async () => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);

      // Get TTS audio
      const blob = await textToSpeech(card.reading, { voice: "female1" });
      const url = createAudioUrl(blob);
      setAudioUrl(url);

      // Play audio
      const audio = new Audio(url);
      setAudioElement(audio);

      audio.onended = () => {
        setIsPlaying(false);
      };

      await audio.play();
    } catch (err) {
      console.error("Failed to play audio:", err);
      toast.error("Failed to play audio");
      setIsPlaying(false);
    }
  }, [card.reading, isPlaying]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev();
      } else if (e.key === "Enter") {
        e.preventDefault();
        playAudio();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, playAudio]);

  return (
    <div className="riso-card p-8 max-w-lg mx-auto">
      {/* Card number */}
      <div className="text-center text-sm text-ink-black/40 mb-6">
        {currentIndex + 1} / {totalCards}
      </div>

      {/* Word */}
      <div className="text-center mb-2">
        <p className="text-5xl font-bold text-ink-black mb-2">{card.word}</p>
        <p className="text-xl text-ink-black/60">{card.reading}</p>
      </div>

      {/* Pitch pattern visualization */}
      <PitchPattern pattern={card.pitch_pattern} reading={card.reading} />

      {/* Accent info */}
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 bg-ink-black/5 rounded-lg text-sm">
          {ACCENT_TYPE_LABELS[card.accent_type]} ({card.accent_position})
        </span>
      </div>

      {/* Meaning */}
      {card.meaning && (
        <p className="text-center text-ink-black/60 mb-6">{card.meaning}</p>
      )}

      {/* Pair word hint */}
      {card.pair_word && (
        <p className="text-center text-sm text-ink-black/40 mb-6">
          Compare with: {card.pair_word}
        </p>
      )}

      {/* Audio button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={playAudio}
          disabled={isPlaying}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {isPlaying ? (
            <>
              <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
              Playing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Listen
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="flex items-center gap-1 px-4 py-2 text-ink-black/60 hover:text-ink-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-1 px-4 py-2 bg-ink-black text-white rounded-lg hover:bg-ink-black/80 transition-colors"
        >
          {isLast ? "Finish" : "Next"}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Keyboard hints */}
      <p className="text-center text-xs text-ink-black/30 mt-6">
        Use arrow keys or space to navigate, Enter to listen
      </p>
    </div>
  );
}

export default function StudyDeckPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [deck, setDeck] = useState<DeckDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!slug) return;

    getDeck(slug)
      .then((data) => {
        setDeck(data);
        // Resume from last position
        setCurrentIndex(Math.min(data.last_card_index, data.cards.length - 1));
      })
      .catch((err) => {
        console.error("Failed to load deck:", err);
        setError(err.message || "Failed to load deck");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleNext = useCallback(async () => {
    if (!deck) return;

    const isLast = currentIndex >= deck.cards.length - 1;

    // Save progress
    try {
      await updateDeckProgress(slug, currentIndex, {
        seen: true,
        cardId: deck.cards[currentIndex]?.id,
      });
    } catch (err) {
      console.error("Failed to save progress:", err);
      // Continue anyway - don't block navigation
    }

    if (isLast) {
      // Deck completed
      toast.success("Deck completed!");
      router.push("/decks");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [deck, currentIndex, slug, router]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="riso-card p-8 max-w-lg mx-auto">
          <Skeleton className="h-4 w-16 mx-auto mb-6" />
          <Skeleton className="h-16 w-32 mx-auto mb-4" />
          <Skeleton className="h-6 w-24 mx-auto mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-10 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
        <div className="riso-card p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/decks" className="riso-button-primary">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  if (!deck || deck.cards.length === 0) {
    return (
      <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
        <div className="riso-card p-8 text-center">
          <p className="text-ink-black/60 mb-4">This deck has no cards yet.</p>
          <Link href="/decks" className="riso-button-primary">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = deck.cards[currentIndex];

  // Guard against out-of-bounds access during navigation
  if (!currentCard) {
    return (
      <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
        <div className="riso-card p-8 text-center">
          <p className="text-ink-black/60">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/decks"
          className="flex items-center gap-1 text-ink-black/60 hover:text-ink-black transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <h1 className="font-display text-xl font-bold text-ink-black">
          {deck.title}
        </h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <ProgressBar current={currentIndex + 1} total={deck.cards.length} />
      </div>

      {/* Card */}
      <CardView
        card={currentCard}
        onNext={handleNext}
        onPrev={handlePrev}
        currentIndex={currentIndex}
        totalCards={deck.cards.length}
        isFirst={currentIndex === 0}
        isLast={currentIndex >= deck.cards.length - 1}
      />
    </div>
  );
}
