# Deck System Schema

## Data Models

### Deck (Static Content)

```sql
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- "first-steps", "minimal-pairs"
  title TEXT NOT NULL,                  -- "First Steps"
  title_ja TEXT,                        -- "はじめの一歩" (optional)
  description TEXT,
  phase INTEGER NOT NULL DEFAULT 1,     -- 1-4 (learning phase)
  is_free BOOLEAN NOT NULL DEFAULT false,
  card_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Card (Static Content)

```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,

  -- Word data
  word TEXT NOT NULL,                   -- "橋"
  reading TEXT NOT NULL,                -- "はし"
  meaning TEXT,                         -- "bridge"

  -- Pitch data
  accent_position INTEGER NOT NULL,     -- 0 = 平板, 1 = 頭高, 2+ = 中高/尾高
  accent_type TEXT NOT NULL,            -- "heiban", "atamadaka", "nakadaka", "odaka"
  pitch_pattern TEXT NOT NULL,          -- "LH", "HL", "LHL", etc.

  -- Audio (TTS cache key)
  audio_key TEXT,                       -- R2/cache key for TTS audio

  -- Metadata
  sort_order INTEGER NOT NULL DEFAULT 0,
  pair_word TEXT,                       -- For minimal pairs: "箸" pairs with "橋"
  notes TEXT,                           -- Learning notes

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cards_deck_id ON cards(deck_id);
```

### UserDeckProgress (Per-user)

```sql
CREATE TABLE user_deck_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,

  -- Progress
  cards_seen INTEGER NOT NULL DEFAULT 0,
  cards_mastered INTEGER NOT NULL DEFAULT 0,
  last_card_index INTEGER NOT NULL DEFAULT 0,  -- Resume position

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  last_studied_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  UNIQUE(user_id, deck_id)
);

CREATE INDEX idx_user_deck_progress_user ON user_deck_progress(user_id);
```

### UserCardProgress (Per-user, per-card - for SRS)

```sql
CREATE TABLE user_card_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,

  -- SRS fields
  ease_factor REAL NOT NULL DEFAULT 2.5,      -- SM-2 ease factor
  interval_days INTEGER NOT NULL DEFAULT 0,    -- Days until next review
  repetitions INTEGER NOT NULL DEFAULT 0,      -- Successful reviews in a row
  next_review_at TIMESTAMPTZ,                  -- When to show again

  -- Stats
  times_seen INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  last_result TEXT,                            -- "correct", "incorrect"

  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,

  UNIQUE(user_id, card_id)
);

CREATE INDEX idx_user_card_progress_user ON user_card_progress(user_id);
CREATE INDEX idx_user_card_progress_review ON user_card_progress(user_id, next_review_at);
```

## Row Level Security (RLS)

```sql
-- Decks: Public read (content is static)
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Decks are viewable by everyone" ON decks FOR SELECT USING (true);

-- Cards: Public read
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cards are viewable by everyone" ON cards FOR SELECT USING (true);

-- User progress: User can only see/modify their own
ALTER TABLE user_deck_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own deck progress" ON user_deck_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deck progress" ON user_deck_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deck progress" ON user_deck_progress
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE user_card_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own card progress" ON user_card_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own card progress" ON user_card_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own card progress" ON user_card_progress
  FOR UPDATE USING (auth.uid() = user_id);
```

## Pydantic Models (Backend)

```python
from pydantic import BaseModel
from datetime import datetime

class DeckSummary(BaseModel):
    id: str
    slug: str
    title: str
    title_ja: str | None
    description: str | None
    phase: int
    is_free: bool
    card_count: int
    # User progress (if authenticated)
    cards_seen: int = 0
    cards_mastered: int = 0
    is_started: bool = False
    is_completed: bool = False

class Card(BaseModel):
    id: str
    word: str
    reading: str
    meaning: str | None
    accent_position: int
    accent_type: str
    pitch_pattern: str
    audio_url: str | None
    pair_word: str | None
    notes: str | None

class DeckDetail(BaseModel):
    id: str
    slug: str
    title: str
    title_ja: str | None
    description: str | None
    phase: int
    is_free: bool
    cards: list[Card]
    # User progress
    last_card_index: int = 0
```

## TypeScript Types (Frontend)

```typescript
interface DeckSummary {
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
}

interface Card {
  id: string;
  word: string;
  reading: string;
  meaning?: string;
  accent_position: number;
  accent_type: 'heiban' | 'atamadaka' | 'nakadaka' | 'odaka';
  pitch_pattern: string;
  audio_url?: string;
  pair_word?: string;
  notes?: string;
}

interface DeckDetail {
  id: string;
  slug: string;
  title: string;
  title_ja?: string;
  description?: string;
  phase: number;
  is_free: boolean;
  cards: Card[];
  last_card_index: number;
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/decks` | List all decks with user progress |
| GET | `/api/decks/{slug}` | Get deck with cards |
| POST | `/api/decks/{slug}/progress` | Update user progress |
| GET | `/api/review` | Get cards due for SRS review |
| POST | `/api/review/{card_id}` | Submit review result |
