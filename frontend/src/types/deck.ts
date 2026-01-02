// Deck system types

export type AccentType = 'heiban' | 'atamadaka' | 'nakadaka' | 'odaka';

export interface Card {
  id: string;
  word: string;
  reading: string;
  meaning?: string;
  accent_position: number;
  accent_type: AccentType;
  pitch_pattern: string;
  audio_url?: string;
  pair_word?: string;
  notes?: string;
  sort_order: number;
}

export interface DeckSummary {
  id: string;
  slug: string;
  title: string;
  title_ja?: string;
  description?: string;
  phase: number;
  is_free: boolean;
  card_count: number;
  // User progress
  cards_seen: number;
  cards_mastered: number;
  is_started: boolean;
  is_completed: boolean;
  progress_percent: number;
}

export interface DeckDetail {
  id: string;
  slug: string;
  title: string;
  title_ja?: string;
  description?: string;
  phase: number;
  is_free: boolean;
  card_count: number;
  cards: Card[];
  last_card_index: number;
  cards_seen: number;
}

export interface DeckListResponse {
  decks: DeckSummary[];
  total_cards: number;
  cards_learned: number;
}

export interface LearningStats {
  total_cards_seen: number;
  total_cards_mastered: number;
  decks_started: number;
  decks_completed: number;
  cards_due_today: number;
}

// Accent type display names
export const ACCENT_TYPE_LABELS: Record<AccentType, string> = {
  heiban: '平板',
  atamadaka: '頭高',
  nakadaka: '中高',
  odaka: '尾高',
};

// Phase labels
export const PHASE_LABELS: Record<number, string> = {
  1: 'Foundation',
  2: 'Core Vocabulary',
  3: 'Structure',
  4: 'Fluency',
};
