"""Deck and Card models for the learning system."""

from datetime import datetime
from pydantic import BaseModel


class Card(BaseModel):
    """A single learning card."""

    id: str
    word: str
    reading: str
    meaning: str | None = None
    accent_position: int
    accent_type: str  # heiban, atamadaka, nakadaka, odaka
    pitch_pattern: str  # LH, HL, LHL, etc.
    audio_url: str | None = None
    pair_word: str | None = None
    notes: str | None = None
    sort_order: int = 0


class DeckSummary(BaseModel):
    """Deck summary for library listing."""

    id: str
    slug: str
    title: str
    title_ja: str | None = None
    description: str | None = None
    phase: int
    is_free: bool
    card_count: int
    # User progress (populated if authenticated)
    cards_seen: int = 0
    cards_mastered: int = 0
    is_started: bool = False
    is_completed: bool = False
    progress_percent: int = 0


class DeckDetail(BaseModel):
    """Full deck with cards."""

    id: str
    slug: str
    title: str
    title_ja: str | None = None
    description: str | None = None
    phase: int
    is_free: bool
    card_count: int
    cards: list[Card]
    # User progress
    last_card_index: int = 0
    cards_seen: int = 0


class DeckListResponse(BaseModel):
    """Response for deck listing."""

    decks: list[DeckSummary]
    total_cards: int = 0
    cards_learned: int = 0


class ProgressUpdate(BaseModel):
    """Request to update deck progress."""

    card_index: int
    card_id: str | None = None
    seen: bool = True
    mastered: bool = False


class CardReviewResult(BaseModel):
    """Result of reviewing a card (for SRS)."""

    card_id: str
    result: str  # correct, incorrect, hard, easy


class ReviewDueResponse(BaseModel):
    """Cards due for review."""

    cards: list[Card]
    total_due: int
    estimated_minutes: int
