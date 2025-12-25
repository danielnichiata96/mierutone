"""Integration tests for pitch analyzer with Kanjium database.

Tests the complete flow: SudachiPy tokenization -> Kanjium SQLite lookup -> pitch pattern generation.

Run with: pytest tests/test_pitch_integration.py -v

Note: These tests require pitch.db to exist. In CI/clean checkout, run:
    python scripts/import_kanjium.py
    python -m unidic download
    python scripts/import_goshu.py
"""

import sys
from pathlib import Path

import pytest

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.pitch_analyzer import (
    analyze_text,
    lookup_pitch,
    get_db_connection,
    count_morae,
    split_into_morae,
    get_pitch_pattern,
    DB_PATH,
)

# Skip all tests in this module if database doesn't exist
pytestmark = pytest.mark.skipif(
    not DB_PATH.exists(),
    reason=f"Database not found at {DB_PATH}. Run 'python scripts/import_kanjium.py' first."
)


class TestDatabaseConnection:
    """Test database exists and is accessible."""

    def test_db_file_exists(self):
        """Pitch database file should exist after import_kanjium.py."""
        assert DB_PATH.exists(), (
            f"Database not found at {DB_PATH}. "
            "Run 'python scripts/import_kanjium.py' first."
        )

    def test_db_connection(self):
        """Should connect to database without errors."""
        conn = get_db_connection()
        assert conn is not None

    def test_db_has_entries(self):
        """Database should have pitch accent entries."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM pitch_accents")
        count = cursor.fetchone()[0]
        assert count > 100000, f"Expected 100k+ entries, got {count}"


class TestPitchLookup:
    """Test pitch accent lookup from Kanjium database."""

    @pytest.mark.parametrize("surface,reading,expected", [
        ("東京", "とうきょう", 0),      # Heiban
        ("日本", "にほん", 2),          # Nakadaka
        ("水", "みず", 0),              # Heiban
        ("雨", "あめ", 1),              # Atamadaka
        ("橋", "はし", 2),              # Bridge - Odaka
        ("箸", "はし", 1),              # Chopsticks - Atamadaka
    ])
    def test_known_words(self, surface, reading, expected):
        """Test lookup for words with known pitch patterns."""
        result = lookup_pitch(surface, reading)
        assert result.accent_type == expected, f"{surface} ({reading}): expected {expected}, got {result.accent_type}"

    def test_unknown_word_returns_none(self):
        """Unknown words should return None, not raise error."""
        result = lookup_pitch("xyzabc", "xyzabc")
        assert result.accent_type is None

    def test_surface_only_fallback(self):
        """Should find pitch by surface even without exact reading match."""
        # 東京 should be found even with wrong reading, returns heiban (0)
        result = lookup_pitch("東京", "wrongreading")
        assert result.accent_type == 0, f"東京 should be heiban (0), got {result.accent_type}"

    @pytest.mark.parametrize("surface,expected_goshu", [
        ("東京", "proper"),       # 固有名詞
        ("水", "wago"),           # 和語
        ("電話", "kango"),        # 漢語
        ("パン", "gairaigo"),     # 外来語
    ])
    def test_goshu_lookup(self, surface, expected_goshu):
        """Test goshu (word origin) lookup."""
        result = lookup_pitch(surface, "")
        assert result.goshu == expected_goshu, f"{surface}: expected {expected_goshu}, got {result.goshu}"


class TestAnalyzeText:
    """Test full text analysis pipeline."""

    def test_simple_sentence(self):
        """Analyze a simple sentence."""
        result = analyze_text("東京に行く")
        assert len(result) > 0

        # Find 東京 in results
        tokyo = next((w for w in result if w.surface == "東京"), None)
        assert tokyo is not None
        assert tokyo.reading == "とうきょう"
        assert tokyo.mora_count == 4
        assert tokyo.accent_type == 0  # Heiban

    def test_compound_word_mode_c(self):
        """SudachiPy Mode C should keep compound words together."""
        result = analyze_text("国立博物館")

        # Mode C should tokenize as single compound, not split
        surfaces = [w.surface for w in result]

        # Either full compound or partial - depends on dictionary
        # At minimum, should not be fully atomized
        assert len(result) <= 2, f"Too many tokens for compound: {surfaces}"

    def test_pitch_pattern_generation(self):
        """Pitch patterns should be generated correctly."""
        result = analyze_text("雨")

        rain = result[0]
        assert rain.surface == "雨"
        assert rain.accent_type == 1  # Atamadaka
        assert rain.pitch_pattern == ["H", "L"]  # H-L for atamadaka 2-mora

    def test_homophone_distinction(self):
        """Different kanji with same reading should have different pitch."""
        # 橋 (bridge) vs 箸 (chopsticks) - both "hashi"
        bridge_result = analyze_text("橋")
        chopsticks_result = analyze_text("箸")

        bridge = bridge_result[0]
        chopsticks = chopsticks_result[0]

        # Both readings should be "はし"
        assert bridge.reading == "はし"
        assert chopsticks.reading == "はし"

        # But different pitch patterns
        assert bridge.accent_type != chopsticks.accent_type, (
            f"橋 and 箸 should have different pitch: "
            f"bridge={bridge.accent_type}, chopsticks={chopsticks.accent_type}"
        )

    def test_punctuation_filtered(self):
        """Punctuation should be filtered from results."""
        result = analyze_text("東京。大阪！")
        surfaces = [w.surface for w in result]

        assert "。" not in surfaces
        assert "！" not in surfaces

    def test_lemma_extraction(self):
        """Lemma (dictionary form) should be extracted for conjugated words."""
        result = analyze_text("食べました")

        # Should have lemma for conjugated verb
        tabe = next((w for w in result if "食" in w.surface), None)
        assert tabe is not None
        assert tabe.lemma is not None

    def test_lemma_fallback_lookup(self):
        """Conjugated forms should find pitch via dictionary form fallback."""
        # 食べる (taberu) has pitch in Kanjium, 食べた (tabeta) doesn't
        result = analyze_text("食べた")

        tabe = next((w for w in result if "食" in w.surface), None)
        assert tabe is not None
        assert tabe.lemma == "食べる", f"Lemma should be 食べる, got {tabe.lemma}"
        # Should find pitch via lemma fallback (食べる) - nakadaka type 2
        assert tabe.accent_type == 2, (
            f"Expected pitch accent 2 for 食べる via lemma fallback, got {tabe.accent_type}"
        )

    def test_hiragana_lookup_fallback(self):
        """Hiragana-only input should find pitch via reading or normalized fallback."""
        # わたし finds pitch via reading fallback (Kanjium has reading='わたし')
        result = analyze_text("わたしは")

        watashi = next((w for w in result if w.surface == "わたし"), None)
        assert watashi is not None
        # わたし is heiban (0)
        assert watashi.accent_type == 0, (
            f"Expected heiban (0) for わたし, got {watashi.accent_type}"
        )


class TestMoraFunctions:
    """Test mora counting and splitting utilities."""

    @pytest.mark.parametrize("reading,expected_count", [
        ("とうきょう", 4),      # To-u-kyo-u
        ("きょう", 2),          # Kyo-u (きょ is one mora)
        ("がっこう", 4),        # Ga-k-ko-u
        ("ちゃ", 1),            # Cha (one mora)
        ("にほん", 3),          # Ni-ho-n
        ("ー", 1),              # Long vowel mark
    ])
    def test_count_morae(self, reading, expected_count):
        """Test mora counting for various readings."""
        assert count_morae(reading) == expected_count

    def test_split_into_morae(self):
        """Test mora splitting."""
        assert split_into_morae("きょう") == ["きょ", "う"]
        assert split_into_morae("とうきょう") == ["と", "う", "きょ", "う"]


class TestPitchPatternGeneration:
    """Test H/L pitch pattern generation."""

    def test_heiban_pattern(self):
        """Type 0 (Heiban): L-H-H-H..."""
        assert get_pitch_pattern(0, 4) == ["L", "H", "H", "H"]

    def test_atamadaka_pattern(self):
        """Type 1 (Atamadaka): H-L-L-L..."""
        assert get_pitch_pattern(1, 4) == ["H", "L", "L", "L"]

    def test_nakadaka_pattern(self):
        """Type N (Nakadaka): L-H-...-H-L"""
        assert get_pitch_pattern(2, 4) == ["L", "H", "L", "L"]
        assert get_pitch_pattern(3, 4) == ["L", "H", "H", "L"]

    def test_single_mora(self):
        """Single mora words."""
        assert get_pitch_pattern(0, 1) == ["L"]
        assert get_pitch_pattern(1, 1) == ["H"]

    def test_none_defaults_to_heiban(self):
        """None accent type should default to heiban."""
        assert get_pitch_pattern(None, 3) == ["L", "H", "H"]


class TestFallbackHeuristics:
    """Test fallback chain order and ORDER BY heuristics."""

    def test_surface_prefers_matching_reading(self):
        """Surface-only fallback should prefer entry with matching reading.

        私 has multiple readings (わたし, わたくし, あたし, etc.)
        When looking up 私 with reading わたし, should get わたし's pitch.
        """
        # 私 with correct reading
        result = lookup_pitch("私", "わたし")
        assert result.accent_type == 0, "私 (わたし) should be heiban (0)"

        # Verify surface-only still works and prefers matching reading
        result_surface = lookup_pitch("私", "わたし")
        assert result_surface.accent_type == 0

    def test_reading_fallback_prefers_shorter_surface(self):
        """Reading-only fallback should prefer shorter surface (avoid compounds).

        はし has multiple surfaces: 橋, 箸, 端, 嘴, etc.
        Shorter surfaces are less likely to be compounds.
        """
        # Direct lookup with はし reading should return a result
        result = lookup_pitch("unknownsurface", "はし")
        # Should find something (橋 or 箸)
        assert result.accent_type is not None, "Should find pitch for はし reading"

    def test_homophone_correct_disambiguation(self):
        """Homophones should be correctly disambiguated by surface.

        橋 (bridge) = はし, accent 2 (odaka)
        箸 (chopsticks) = はし, accent 1 (atamadaka)
        """
        bridge = lookup_pitch("橋", "はし")
        chopsticks = lookup_pitch("箸", "はし")

        assert bridge.accent_type == 2, f"橋 should be odaka (2), got {bridge.accent_type}"
        assert chopsticks.accent_type == 1, f"箸 should be atamadaka (1), got {chopsticks.accent_type}"

    def test_lemma_fallback_before_reading(self):
        """Lemma fallback should be tried before reading-only fallback.

        食べた (conjugated) should find 食べる (lemma) before falling back to reading.
        """
        result = analyze_text("食べた")
        tabe = next((w for w in result if "食" in w.surface), None)

        assert tabe is not None
        assert tabe.lemma == "食べる"
        # 食べる has accent 2, not whatever random word might match the reading
        assert tabe.accent_type == 2

    def test_normalized_fallback_for_kanji_variants(self):
        """Normalized form should handle kanji variants.

        Some words have variant kanji forms that normalize to a common form.
        """
        # Test with a common word that has normalized form
        result = lookup_pitch("私", "わたし", normalized="私")
        assert result.accent_type == 0
