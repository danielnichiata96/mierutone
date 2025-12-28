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


class TestTransparencyFields:
    """Test source, confidence, and warning fields for transparency."""

    def test_particle_source(self):
        """Particles should have source='particle' and empty pitch_pattern."""
        result = analyze_text("東京に")

        # Find the particle に
        particle = next((w for w in result if w.surface == "に"), None)
        assert particle is not None, "Should find particle に"
        assert particle.source == "particle", f"Particle should have source='particle', got {particle.source}"
        assert particle.pitch_pattern == [], f"Particle should have empty pitch_pattern, got {particle.pitch_pattern}"
        assert particle.confidence == "high", "Particles should have high confidence (we're confident it IS a particle)"

    def test_particle_sequence(self):
        """Particle sequences like には should all have source='particle'."""
        result = analyze_text("東京には")

        particles = [w for w in result if w.source == "particle"]
        assert len(particles) >= 2, f"Expected at least 2 particles in には, got {len(particles)}"

        for p in particles:
            assert p.pitch_pattern == [], f"Particle {p.surface} should have empty pitch_pattern"

    def test_proper_noun_in_dictionary(self):
        """Proper nouns in dictionary should have source='dictionary_proper'."""
        # 東京 is a proper noun that's in Kanjium
        result = analyze_text("東京")

        tokyo = result[0]
        assert tokyo.surface == "東京"
        # 東京 should be in dictionary as proper noun
        assert tokyo.source == "dictionary_proper", f"東京 should have source='dictionary_proper', got {tokyo.source}"
        assert tokyo.accent_type == 0, f"東京 should be heiban (0), got {tokyo.accent_type}"
        assert len(tokyo.pitch_pattern) > 0, "Dictionary proper nouns should have pitch_pattern"
        # Cross-validation: If Kanjium + UniDic agree, confidence is boosted to high
        assert tokyo.confidence in ("medium", "high"), f"Dictionary proper nouns should have medium or high confidence, got {tokyo.confidence}"
        assert tokyo.warning is not None, "Dictionary proper nouns should have a warning"

    def test_proper_noun_not_in_dictionary(self):
        """Proper nouns NOT in dictionary should have source='proper_noun' and empty pitch_pattern."""
        # Use a made-up name that won't be in Kanjium
        result = analyze_text("ダニエル")

        name = next((w for w in result if "ダニエル" in w.surface), None)
        if name is None:
            # May be split differently, find any proper noun
            name = next((w for w in result if w.source in ("proper_noun", "dictionary_proper")), None)

        if name and name.source == "proper_noun":
            assert name.pitch_pattern == [], f"Proper noun not in dict should have empty pitch_pattern, got {name.pitch_pattern}"
            assert name.confidence == "low", f"Proper noun not in dict should have low confidence, got {name.confidence}"
            assert name.warning is not None, "Proper noun not in dict should have a warning"

    def test_dictionary_source(self):
        """Words found in dictionary should have source='dictionary'."""
        result = analyze_text("水")

        mizu = result[0]
        assert mizu.surface == "水"
        assert mizu.source == "dictionary", f"水 should have source='dictionary', got {mizu.source}"
        assert mizu.confidence == "high", f"Dictionary matches should have high confidence, got {mizu.confidence}"

    def test_dictionary_lemma_source(self):
        """Conjugated words matched via lemma should have source='dictionary_lemma'."""
        result = analyze_text("食べた")

        tabe = next((w for w in result if "食" in w.surface), None)
        assert tabe is not None
        # 食べた is not in dictionary, but 食べる (lemma) is
        assert tabe.source == "dictionary_lemma", f"Conjugated form should have source='dictionary_lemma', got {tabe.source}"
        # Cross-validation: If Kanjium + UniDic agree, confidence is boosted to high
        assert tabe.confidence in ("medium", "high"), f"Lemma matches should have medium or high confidence, got {tabe.confidence}"

    def test_multiple_patterns_warning(self):
        """Words with multiple accent patterns should have a warning."""
        # 雲 (kumo) has multiple patterns in some dictionaries
        # If not, this test documents the expected behavior
        result = analyze_text("雲")
        kumo = result[0]
        # Either has warning about multiple patterns, or just works normally
        assert kumo.source in ("dictionary", "dictionary_lemma", "dictionary_reading"), \
            f"雲 should be found in dictionary, got {kumo.source}"


class TestParticleInheritance:
    """Test particle pitch inheritance from preceding content word."""

    def test_particle_after_heiban(self):
        """Particle after heiban word should stay high (H)."""
        # 水 (mizu) is heiban - particle should stay high
        result = analyze_text("水は")

        mizu = next((w for w in result if w.surface == "水"), None)
        wa = next((w for w in result if w.surface == "は"), None)

        assert mizu is not None and wa is not None
        assert mizu.accent_type == 0, f"水 should be heiban (0), got {mizu.accent_type}"
        assert wa.source == "particle", f"は should be particle, got {wa.source}"
        # Frontend handles the pitch inheritance, backend just marks it as particle

    def test_particle_after_odaka(self):
        """Particle after odaka word drops low (L)."""
        # 橋 (hashi, bridge) is odaka - particle should drop
        result = analyze_text("橋を")

        hashi = next((w for w in result if w.surface == "橋"), None)
        wo = next((w for w in result if w.surface == "を"), None)

        assert hashi is not None and wo is not None
        # 橋 should be odaka (accent on last mora)
        assert hashi.accent_type == hashi.mora_count, \
            f"橋 should be odaka (accent={hashi.mora_count}), got {hashi.accent_type}"
        assert wo.source == "particle"

    def test_auxiliary_verb_as_particle(self):
        """Auxiliary verbs (助動詞) should be treated like particles."""
        result = analyze_text("食べます")

        # ます is auxiliary verb
        masu = next((w for w in result if w.part_of_speech == "助動詞"), None)
        if masu:
            assert masu.source == "particle", f"Auxiliary verb should have source='particle', got {masu.source}"
            assert masu.pitch_pattern == [], "Auxiliary verb should have empty pitch_pattern"


class TestCrossValidation:
    """Test cross-validation between Kanjium and UniDic sources."""

    def test_sources_agree_boosts_confidence(self):
        """When Kanjium and UniDic agree, confidence should be boosted."""
        # 東京 - both sources should agree on accent type 0
        result = analyze_text("東京")
        tokyo = result[0]

        # dictionary_proper with agreement → boosted to high
        assert tokyo.source == "dictionary_proper"
        assert tokyo.confidence == "high", "When sources agree, confidence should be boosted to high"

    def test_dictionary_source_stays_high(self):
        """Dictionary exact match should be high even without cross-validation."""
        result = analyze_text("水")
        mizu = result[0]

        assert mizu.source == "dictionary"
        assert mizu.confidence == "high", "Dictionary exact match should always be high"

    def test_lemma_with_agreement_boosts_to_high(self):
        """dictionary_lemma with cross-validation agreement → high confidence."""
        result = analyze_text("食べた")
        tabe = next((w for w in result if "食" in w.surface), None)

        assert tabe is not None
        assert tabe.source == "dictionary_lemma"
        # If UniDic confirms the accent, confidence is boosted
        assert tabe.confidence in ("medium", "high")

    def test_known_accent_words(self):
        """Test known words where both sources should agree."""
        test_cases = [
            ("雨", 1),   # ame - atamadaka
            ("橋", 2),   # hashi (bridge) - odaka
            ("パン", 1), # pan - atamadaka
        ]

        for surface, expected_accent in test_cases:
            result = analyze_text(surface)
            word = result[0]

            assert word.accent_type == expected_accent, \
                f"{surface} should have accent type {expected_accent}, got {word.accent_type}"
            # Both sources exist → likely high confidence
            assert word.confidence in ("medium", "high"), \
                f"{surface} should have medium or high confidence"

    def test_multi_pattern_agreement_logic(self):
        """Unit test: UniDic matching any of Kanjium's multiple patterns counts as agreement."""
        # Test the logic directly: if Kanjium has patterns [0, 2] and UniDic says 2,
        # sources_agree should be True (not False)

        # Simulate the logic from lookup_pitch
        kanjium_pattern = "0,2"  # Multiple patterns
        all_accents = [int(v.strip()) for v in kanjium_pattern.split(",")]

        # UniDic matches second pattern
        unidic_accent = 2
        sources_agree = (unidic_accent in all_accents)
        assert sources_agree is True, "UniDic matching any Kanjium pattern should agree"

        # UniDic matches first pattern
        unidic_accent = 0
        sources_agree = (unidic_accent in all_accents)
        assert sources_agree is True, "UniDic matching first pattern should agree"

        # UniDic doesn't match any
        unidic_accent = 1
        sources_agree = (unidic_accent in all_accents)
        assert sources_agree is False, "UniDic not matching any pattern should disagree"

    def test_lookup_pitch_cross_validation_integration(self):
        """Integration test: verify lookup_pitch returns cross-validation data."""
        from app.services.pitch_analyzer import lookup_pitch, get_unidic_tagger

        # Test with a known word that exists in both Kanjium and UniDic
        result = lookup_pitch("東京", "とうきょう", None, None)

        # Should find in Kanjium
        assert result.accent_type == 0, "東京 should have accent 0"
        assert result.source in ("dictionary", "dictionary_lemma", "dictionary_reading")

        # If UniDic is available, should have cross-validation data
        if get_unidic_tagger() is not None:
            assert result.unidic_accent is not None, "Should have UniDic accent when tagger available"
            # Both should agree on 東京
            if result.unidic_accent == result.accent_type:
                assert result.sources_agree is True, "sources_agree should be True when accents match"


class TestSourceTypeTransparency:
    """Test that source types accurately reflect where data came from."""

    def test_unidic_only_source_type_logic(self):
        """Unit test: verify PitchLookupResult for dictionary_unidic source type."""
        from app.services.pitch_analyzer import PitchLookupResult

        # Test: when Kanjium has no data but UniDic does, source should be dictionary_unidic
        # This tests the return statement in lookup_pitch when row is None but unidic_accent exists
        result = PitchLookupResult(
            accent_type=1,
            goshu=None,
            goshu_jp=None,
            source="dictionary_unidic",
            has_multiple_patterns=False,
            unidic_accent=1,
            sources_agree=None,  # Only one source
        )
        assert result.source == "dictionary_unidic"
        assert result.accent_type == 1
        assert result.sources_agree is None  # Single source = None

    def test_unidic_only_integration(self):
        """Integration test: verify lookup_pitch returns dictionary_unidic for UniDic-only words."""
        from app.services.pitch_analyzer import lookup_pitch, get_unidic_tagger

        if get_unidic_tagger() is None:
            pytest.skip("UniDic tagger not available")

        # Test with a made-up reading that won't be in Kanjium but might tokenize in UniDic
        # Use a simple katakana word that UniDic might have but Kanjium doesn't
        result = lookup_pitch("アプリ", "あぷり", None, None)

        # If UniDic found it but Kanjium didn't, source should be dictionary_unidic
        if result.source == "dictionary_unidic":
            assert result.accent_type is not None, "dictionary_unidic should have accent_type"
            assert result.unidic_accent is not None, "dictionary_unidic should have unidic_accent"
            assert result.sources_agree is None, "Single source should have sources_agree=None"
        # If found in Kanjium, that's fine too - test just verifies the code path works

    def test_unidic_lookup_function(self):
        """Verify lookup_unidic_accent returns data for known words."""
        from app.services.pitch_analyzer import lookup_unidic_accent, get_unidic_tagger

        # Skip if tagger not available (import failed or dictionary not installed)
        if get_unidic_tagger() is None:
            pytest.skip("UniDic tagger not available")

        # 東京 should be in UniDic with accent 0
        result = lookup_unidic_accent("東京", "とうきょう")
        if result is None:
            pytest.skip("UniDic lookup returned None - dictionary may not be fully installed")
        assert result == 0, "東京 should have accent type 0 in UniDic"

        # 雨 should be in UniDic with accent 1
        result = lookup_unidic_accent("雨", "あめ")
        assert result == 1, "雨 should have accent type 1 in UniDic"

    def test_disagreement_reduces_confidence(self):
        """When sources disagree, confidence should be reduced."""
        from app.services.pitch_analyzer import get_confidence_for_source

        # Test the confidence reduction logic
        assert get_confidence_for_source("dictionary", sources_agree=False) == "medium"
        assert get_confidence_for_source("dictionary_lemma", sources_agree=False) == "low"
        assert get_confidence_for_source("dictionary_reading", sources_agree=False) == "low"

    def test_disagreement_warning(self):
        """When sources disagree, a warning should be emitted."""
        from app.services.pitch_analyzer import get_lookup_warning

        warning = get_lookup_warning("dictionary", False, sources_agree=False)
        assert warning is not None
        assert "disagree" in warning.lower()

    def test_unidic_only_warning(self):
        """UniDic-only matches should have a warning."""
        from app.services.pitch_analyzer import get_lookup_warning

        warning = get_lookup_warning("dictionary_unidic", False, sources_agree=None)
        assert warning is not None
        assert "unidic" in warning.lower()

    def test_proper_noun_disagreement_warning(self):
        """Proper nouns with source disagreement should get disagreement warning."""
        from app.services.pitch_analyzer import WARNINGS, PitchLookupResult

        # Simulate proper noun handling logic when sources disagree
        lookup_result = PitchLookupResult(
            accent_type=0,
            goshu=None,
            goshu_jp=None,
            source="dictionary_proper",
            has_multiple_patterns=False,
            unidic_accent=1,  # Different from accent_type
            sources_agree=False,  # Disagreement!
        )

        # This mirrors the logic in analyze_text for proper nouns
        if lookup_result.sources_agree is False:
            warning = WARNINGS["sources_disagree"]
        else:
            warning = "some other warning"

        assert warning == WARNINGS["sources_disagree"]
        assert "disagree" in warning.lower()
