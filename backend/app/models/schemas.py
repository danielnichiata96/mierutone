"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel


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
    source: str = "unknown"
    # Possible values for source:
    # - "dictionary"         = exact match in Kanjium database (high confidence)
    # - "dictionary_lemma"   = matched via dictionary form, e.g. 食べた→食べる (medium)
    # - "dictionary_reading" = matched by reading only, less reliable (low)
    # - "dictionary_proper"  = proper noun found in dictionary (medium, with warning)
    # - "proper_noun"        = proper noun NOT in dictionary (low, pitch uncertain)
    # - "particle"           = particle/auxiliary verb, inherits pitch from prev word
    # - "rule"               = no dictionary match, using standard pitch rules (low)
    # - "unknown"            = no data available

    confidence: str = "low"  # "high", "medium", or "low"
    warning: str | None = None  # Contextual warning for ambiguous/uncertain cases


class AnalyzeResponse(BaseModel):
    """Response body for /analyze endpoint."""
    text: str
    words: list[WordPitch]
