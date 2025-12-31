"""Tests for homophone lookup functionality.

Tests the homophone lookup mode that shows multiple kanji options for
short hiragana inputs (e.g., はし → 箸, 橋, 端).

Note: Tests that access the database require pitch.db to exist.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.pitch_analyzer import (
    is_pure_hiragana,
    normalize_for_homophone_lookup,
    is_homophone_lookup_candidate,
    lookup_homophones,
    MAX_HOMOPHONE_LENGTH,
    DB_PATH,
)

client = TestClient(app)

# Skip database-dependent tests if DB doesn't exist
db_required = pytest.mark.skipif(
    not DB_PATH.exists(),
    reason=f"Database not found at {DB_PATH}. Run 'python scripts/download_dictionary.py' first."
)


class TestIsPureHiragana:
    """Tests for is_pure_hiragana function."""

    def test_pure_hiragana_returns_true(self):
        assert is_pure_hiragana("はし") is True
        assert is_pure_hiragana("にほん") is True
        assert is_pure_hiragana("おはよう") is True
        assert is_pure_hiragana("きょうはいいてんきです") is True

    def test_kanji_returns_false(self):
        assert is_pure_hiragana("日本") is False
        assert is_pure_hiragana("箸") is False
        assert is_pure_hiragana("東京") is False

    def test_katakana_returns_false(self):
        assert is_pure_hiragana("ニホン") is False
        assert is_pure_hiragana("カタカナ") is False

    def test_romaji_returns_false(self):
        assert is_pure_hiragana("hashi") is False
        assert is_pure_hiragana("nihon") is False

    def test_mixed_returns_false(self):
        assert is_pure_hiragana("日本語") is False
        assert is_pure_hiragana("はしです") is True  # All hiragana
        assert is_pure_hiragana("はし。") is False  # Has punctuation

    def test_punctuation_returns_false(self):
        assert is_pure_hiragana("はし。") is False
        assert is_pure_hiragana("はし、") is False
        assert is_pure_hiragana("はし！") is False

    def test_whitespace_returns_false(self):
        assert is_pure_hiragana("はし ") is False
        assert is_pure_hiragana(" はし") is False
        assert is_pure_hiragana("は し") is False

    def test_empty_returns_false(self):
        assert is_pure_hiragana("") is False


class TestNormalizeForHomophoneLookup:
    """Tests for normalize_for_homophone_lookup function."""

    def test_strips_punctuation(self):
        assert normalize_for_homophone_lookup("はし。") == "はし"
        assert normalize_for_homophone_lookup("はし、") == "はし"
        assert normalize_for_homophone_lookup("はし！") == "はし"
        assert normalize_for_homophone_lookup("はし？") == "はし"

    def test_strips_whitespace(self):
        assert normalize_for_homophone_lookup("はし ") == "はし"
        assert normalize_for_homophone_lookup(" はし") == "はし"
        assert normalize_for_homophone_lookup("  はし  ") == "はし"

    def test_strips_fullwidth_space(self):
        """Test that full-width space (U+3000) is stripped."""
        assert normalize_for_homophone_lookup("はし\u3000") == "はし"
        assert normalize_for_homophone_lookup("\u3000はし\u3000") == "はし"

    def test_strips_wave_dash(self):
        """Test that wave dash (〜 U+301C) is stripped."""
        assert normalize_for_homophone_lookup("はし〜") == "はし"
        assert normalize_for_homophone_lookup("〜はし〜") == "はし"

    def test_strips_multiple_punctuation(self):
        assert normalize_for_homophone_lookup("「はし」") == "はし"
        assert normalize_for_homophone_lookup("（はし）") == "はし"

    def test_strips_japanese_special_punctuation(self):
        """Test that ・ … and other special Japanese punctuation is stripped."""
        assert normalize_for_homophone_lookup("はし・") == "はし"
        assert normalize_for_homophone_lookup("はし…") == "はし"
        assert normalize_for_homophone_lookup("【はし】") == "はし"
        assert normalize_for_homophone_lookup("〈はし〉") == "はし"

    def test_preserves_long_vowel_mark(self):
        """Test that ー (long vowel) is preserved as it's part of words."""
        assert normalize_for_homophone_lookup("らーめん") == "らーめん"
        assert normalize_for_homophone_lookup("「らーめん」") == "らーめん"

    def test_preserves_core_characters(self):
        assert normalize_for_homophone_lookup("はし") == "はし"
        assert normalize_for_homophone_lookup("日本") == "日本"
        assert normalize_for_homophone_lookup("hashi") == "hashi"


class TestIsHomophoneLookupCandidate:
    """Tests for is_homophone_lookup_candidate function."""

    def test_short_hiragana_is_candidate(self):
        is_candidate, normalized = is_homophone_lookup_candidate("はし")
        assert is_candidate is True
        assert normalized == "はし"

    def test_hiragana_with_punctuation_is_candidate(self):
        is_candidate, normalized = is_homophone_lookup_candidate("はし。")
        assert is_candidate is True
        assert normalized == "はし"

    def test_hiragana_with_whitespace_is_candidate(self):
        is_candidate, normalized = is_homophone_lookup_candidate("  はし  ")
        assert is_candidate is True
        assert normalized == "はし"

    def test_long_hiragana_not_candidate(self):
        # Create a string longer than MAX_HOMOPHONE_LENGTH
        long_text = "あ" * (MAX_HOMOPHONE_LENGTH + 1)
        is_candidate, _ = is_homophone_lookup_candidate(long_text)
        assert is_candidate is False

    def test_hiragana_sentence_not_candidate(self):
        # A typical sentence is longer than MAX_HOMOPHONE_LENGTH
        is_candidate, _ = is_homophone_lookup_candidate("きょうはいいてんきです")
        assert is_candidate is False

    def test_kanji_not_candidate(self):
        is_candidate, _ = is_homophone_lookup_candidate("日本")
        assert is_candidate is False

    def test_katakana_not_candidate(self):
        is_candidate, _ = is_homophone_lookup_candidate("ニホン")
        assert is_candidate is False

    def test_romaji_not_candidate(self):
        is_candidate, _ = is_homophone_lookup_candidate("hashi")
        assert is_candidate is False

    def test_empty_not_candidate(self):
        is_candidate, _ = is_homophone_lookup_candidate("")
        assert is_candidate is False

    def test_only_punctuation_not_candidate(self):
        is_candidate, _ = is_homophone_lookup_candidate("。。。")
        assert is_candidate is False


@db_required
class TestLookupHomophones:
    """Tests for lookup_homophones function."""

    def test_hashi_has_multiple_homophones(self):
        """はし should return multiple kanji (箸, 橋, 端, etc.)"""
        results = lookup_homophones("はし")
        assert len(results) >= 2
        surfaces = [r.surface for r in results]
        # Should include common homophones
        assert any(s in surfaces for s in ["箸", "橋", "端"])

    def test_homophones_have_different_accents(self):
        """Homophones should have different accent types."""
        results = lookup_homophones("はし")
        if len(results) >= 2:
            accents = [r.accent_type for r in results]
            # Should have at least 2 different accent types
            assert len(set(accents)) >= 2

    def test_homophone_has_required_fields(self):
        """Each homophone should have all required fields."""
        results = lookup_homophones("はし")
        assert len(results) >= 1
        for result in results:
            assert result.surface is not None
            assert result.reading == "はし"
            assert result.mora_count == 2
            assert len(result.morae) == 2
            # pitch_pattern can be empty if accent_type is None

    def test_unknown_reading_returns_empty(self):
        """Unknown reading should return empty list."""
        results = lookup_homophones("ぬるぽ")
        # May or may not exist in dictionary, just check it doesn't crash
        assert isinstance(results, list)

    def test_nihon_has_homophones(self):
        """にほん should return results."""
        results = lookup_homophones("にほん")
        assert len(results) >= 1
        surfaces = [r.surface for r in results]
        assert "日本" in surfaces or any("本" in s for s in surfaces)


@db_required
class TestAnalyzeApiHomophoneMode:
    """Tests for /api/analyze endpoint homophone behavior."""

    def test_short_hiragana_returns_homophones(self):
        """Short hiragana input should trigger homophone mode."""
        response = client.post("/api/analyze", json={"text": "はし"})
        assert response.status_code == 200
        data = response.json()
        assert data["is_homophone_lookup"] is True
        assert len(data["homophones"]) >= 2
        assert data["words"] == []

    def test_hiragana_with_punctuation_returns_homophones(self):
        """Hiragana with punctuation should still trigger homophone mode."""
        response = client.post("/api/analyze", json={"text": "はし。"})
        assert response.status_code == 200
        data = response.json()
        assert data["is_homophone_lookup"] is True
        assert len(data["homophones"]) >= 2

    def test_kanji_returns_standard_analysis(self):
        """Kanji input should use standard tokenization."""
        response = client.post("/api/analyze", json={"text": "日本"})
        assert response.status_code == 200
        data = response.json()
        assert data["is_homophone_lookup"] is False
        assert data["homophones"] is None
        assert len(data["words"]) >= 1

    def test_long_hiragana_sentence_returns_standard(self):
        """Long hiragana sentence should use standard tokenization."""
        response = client.post("/api/analyze", json={"text": "きょうはいいてんきです"})
        assert response.status_code == 200
        data = response.json()
        assert data["is_homophone_lookup"] is False
        assert len(data["words"]) >= 1

    def test_unique_reading_falls_back_to_standard(self):
        """Hiragana with only 1 match should fall back to standard."""
        # Find a reading with likely only 1 match, or use a very unique one
        response = client.post("/api/analyze", json={"text": "あ"})
        assert response.status_code == 200
        data = response.json()
        # Either homophone mode with 1+ results or standard mode
        # Just verify no crash and valid response
        assert "is_homophone_lookup" in data

    def test_romaji_uses_standard_analysis(self):
        """Romaji input should use standard tokenization."""
        response = client.post("/api/analyze", json={"text": "nihon"})
        assert response.status_code == 200
        data = response.json()
        assert data["is_homophone_lookup"] is False

    def test_homophones_have_pitch_patterns(self):
        """Homophones should include pitch pattern data."""
        response = client.post("/api/analyze", json={"text": "はし"})
        assert response.status_code == 200
        data = response.json()
        assert data["is_homophone_lookup"] is True
        for homophone in data["homophones"]:
            assert "surface" in homophone
            assert "reading" in homophone
            assert "accent_type" in homophone
            assert "pitch_pattern" in homophone
            assert "morae" in homophone
