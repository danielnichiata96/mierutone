import type {
  DeckDetail,
  DeckListResponse,
  LearningStats,
} from "@/types/deck";
import { authFetch } from "./client";

export async function getDecks(phase?: number): Promise<DeckListResponse> {
  const params = phase ? `?phase=${phase}` : "";
  return authFetch(`/decks${params}`);
}

export async function getDeck(slug: string): Promise<DeckDetail> {
  return authFetch(`/decks/${slug}`, {
    errorMessages: {
      401: "Sign in to access this deck",
      404: "Deck not found",
    },
  });
}

export async function updateDeckProgress(
  slug: string,
  cardIndex: number,
  options: { seen?: boolean; mastered?: boolean; cardId?: string } = {}
): Promise<void> {
  return authFetch(`/decks/${slug}/progress`, {
    method: "POST",
    body: JSON.stringify({
      card_index: cardIndex,
      card_id: options.cardId,
      seen: options.seen ?? true,
      mastered: options.mastered ?? false,
    }),
  });
}

export async function getLearningStats(): Promise<LearningStats> {
  return authFetch("/decks/stats/summary");
}
