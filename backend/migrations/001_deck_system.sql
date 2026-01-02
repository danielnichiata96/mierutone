-- Migration: Deck System
-- Description: Tables for deck-based learning system
-- Run in Supabase SQL Editor

-- ============================================================================
-- DECKS (Static content - learning decks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_ja TEXT,
  description TEXT,
  phase INTEGER NOT NULL DEFAULT 1 CHECK (phase BETWEEN 1 AND 4),
  is_free BOOLEAN NOT NULL DEFAULT false,
  card_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Public read (content is static)
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Decks are viewable by everyone" ON decks FOR SELECT USING (true);

-- ============================================================================
-- CARDS (Static content - individual learning items)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,

  -- Word data
  word TEXT NOT NULL,
  reading TEXT NOT NULL,
  meaning TEXT,

  -- Pitch data
  accent_position INTEGER NOT NULL,
  accent_type TEXT NOT NULL CHECK (accent_type IN ('heiban', 'atamadaka', 'nakadaka', 'odaka')),
  pitch_pattern TEXT NOT NULL,

  -- Audio
  audio_key TEXT,

  -- Metadata
  sort_order INTEGER NOT NULL DEFAULT 0,
  pair_word TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_deck_order ON cards(deck_id, sort_order);

-- RLS: Public read
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cards are viewable by everyone" ON cards FOR SELECT USING (true);

-- ============================================================================
-- USER DECK PROGRESS (Per-user deck tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_deck_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,

  -- Progress
  cards_seen INTEGER NOT NULL DEFAULT 0,
  cards_mastered INTEGER NOT NULL DEFAULT 0,
  last_card_index INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  last_studied_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  UNIQUE(user_id, deck_id)
);

CREATE INDEX IF NOT EXISTS idx_user_deck_progress_user ON user_deck_progress(user_id);

-- RLS: Users own their progress
ALTER TABLE user_deck_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deck progress" ON user_deck_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deck progress" ON user_deck_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deck progress" ON user_deck_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- USER CARD PROGRESS (Per-user, per-card - for SRS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_card_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,

  -- SRS fields (SM-2 algorithm)
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ,

  -- Stats
  times_seen INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  last_result TEXT CHECK (last_result IN ('correct', 'incorrect', 'hard', 'easy')),

  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,

  UNIQUE(user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_user_card_progress_user ON user_card_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_card_progress_review ON user_card_progress(user_id, next_review_at);

-- RLS: Users own their progress
ALTER TABLE user_card_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own card progress" ON user_card_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own card progress" ON user_card_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own card progress" ON user_card_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- SEED: Initial Decks
-- ============================================================================

INSERT INTO decks (slug, title, title_ja, description, phase, is_free, card_count, sort_order)
VALUES
  ('first-steps', 'First Steps', 'はじめの一歩', 'Learn the 4 basic pitch accent patterns with common words', 1, true, 30, 1),
  ('minimal-pairs', 'Minimal Pairs', 'ミニマルペア', 'Words that differ only in pitch - train your ear', 1, true, 50, 2)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- HELPER: Update deck card_count trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE decks SET card_count = card_count + 1 WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE decks SET card_count = card_count - 1 WHERE id = OLD.deck_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deck_card_count
AFTER INSERT OR DELETE ON cards
FOR EACH ROW EXECUTE FUNCTION update_deck_card_count();
