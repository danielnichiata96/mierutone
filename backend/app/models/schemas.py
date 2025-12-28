"""Pydantic schemas for API requests and responses."""

from typing import Literal

from pydantic import BaseModel


# =============================================================================
# Literal types for source and confidence (shared with frontend via API)
# =============================================================================

SourceType = Literal[
    "dictionary",          # Exact match in Kanjium database (high confidence)
    "dictionary_lemma",    # Matched via dictionary form, e.g. 食べた→食べる (medium)
    "dictionary_reading",  # Matched by reading only, less reliable (low)
    "dictionary_unidic",   # Matched via UniDic only (Kanjium had no entry) (low)
    "dictionary_proper",   # Proper noun found in Kanjium dictionary (medium, with warning)
    "unidic_proper",       # Proper noun found in UniDic only (low, with warning)
    "proper_noun",         # Proper noun NOT in any dictionary (low, pitch uncertain)
    "particle",            # Particle/auxiliary verb, inherits pitch from prev word
    "rule",                # No dictionary match, using standard pitch rules (low)
    "unknown",             # No data available
]

ConfidenceType = Literal["high", "medium", "low"]


class AnalyzeRequest(BaseModel):
    """Request body for /analyze endpoint."""
    text: str


class WordPitch(BaseModel):
    """Pitch information for a single word."""
    surface: str  # Original text (kanji/kana)
    reading: str  # Hiragana reading
    accent_type: int | None  # aType: position where pitch drops (0=heiban)
    mora_count: int
    morae: list[str]  # Individual morae
    pitch_pattern: list[str]  # ["L", "H", "H", "L"] per mora
    part_of_speech: str
    origin: str | None = None  # Word origin: native, chinese, foreign, proper
    origin_jp: str | None = None  # Japanese label: 和語, 漢語, 外来語, 固有名詞
    lemma: str | None = None  # Dictionary form (e.g., 食べる for 食べ)

    # Transparency fields - indicate data source and reliability
    source: SourceType = "unknown"
    confidence: ConfidenceType = "low"
    warning: str | None = None  # Contextual warning for ambiguous/uncertain cases


class AnalyzeResponse(BaseModel):
    """Response body for /analyze endpoint."""
    text: str
    words: list[WordPitch]
