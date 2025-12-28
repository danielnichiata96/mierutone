"""Unit tests for pitch analyzer rules and lookup fallbacks."""

import sqlite3

import pytest

pytest.importorskip("sudachipy", reason="sudachipy is required for pitch analyzer")
pytest.importorskip("jaconv", reason="jaconv is required for pitch analyzer")

from app.services import pitch_analyzer


def make_db(rows: list[tuple[str, str, str, str | None, str | None]]):
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute(
        "CREATE TABLE pitch_accents (surface TEXT, reading TEXT, accent_pattern TEXT, goshu TEXT, goshu_jp TEXT)"
    )
    if rows:
        conn.executemany(
            "INSERT INTO pitch_accents (surface, reading, accent_pattern, goshu, goshu_jp) VALUES (?, ?, ?, ?, ?)",
            rows,
        )
    conn.commit()
    return conn


def test_lookup_prefers_lemma_before_normalized(monkeypatch):
    conn = make_db([
        ("lemma", "read", "3", None, None),
        ("normalized", "read", "4", None, None),
    ])
    monkeypatch.setattr(pitch_analyzer, "get_db_connection", lambda: conn)
    monkeypatch.setattr(pitch_analyzer, "lookup_unidic_accent", lambda *_: None)

    result = pitch_analyzer.lookup_pitch(
        surface="surface",
        reading_hira="read",
        lemma="lemma",
        normalized="normalized",
    )

    assert result.accent_type == 3
    assert result.source == "dictionary_lemma"


def test_lookup_reading_fallback_prefers_shorter_surface(monkeypatch):
    conn = make_db([
        ("longer", "read", "6", None, None),
        ("short", "read", "5", None, None),
    ])
    monkeypatch.setattr(pitch_analyzer, "get_db_connection", lambda: conn)
    monkeypatch.setattr(pitch_analyzer, "lookup_unidic_accent", lambda *_: None)

    result = pitch_analyzer.lookup_pitch(surface="unknown", reading_hira="read")

    assert result.accent_type == 5
    assert result.source == "dictionary_reading"


def test_lookup_unidic_fallback_when_db_missing(monkeypatch):
    conn = make_db([])
    monkeypatch.setattr(pitch_analyzer, "get_db_connection", lambda: conn)
    monkeypatch.setattr(pitch_analyzer, "lookup_unidic_accent", lambda *_: 2)

    result = pitch_analyzer.lookup_pitch(surface="surface", reading_hira="read")

    assert result.accent_type == 2
    assert result.source == "dictionary_reading"
    assert result.sources_agree is None


def test_sources_agree_true_and_false(monkeypatch):
    conn = make_db([
        ("word", "read", "2", None, None),
    ])
    monkeypatch.setattr(pitch_analyzer, "get_db_connection", lambda: conn)

    monkeypatch.setattr(pitch_analyzer, "lookup_unidic_accent", lambda *_: 2)
    result = pitch_analyzer.lookup_pitch(surface="word", reading_hira="read")
    assert result.sources_agree is True

    monkeypatch.setattr(pitch_analyzer, "lookup_unidic_accent", lambda *_: 3)
    result = pitch_analyzer.lookup_pitch(surface="word", reading_hira="read")
    assert result.sources_agree is False


def test_multiple_patterns_flag(monkeypatch):
    conn = make_db([
        ("word", "read", "1,2", None, None),
    ])
    monkeypatch.setattr(pitch_analyzer, "get_db_connection", lambda: conn)
    monkeypatch.setattr(pitch_analyzer, "lookup_unidic_accent", lambda *_: None)

    result = pitch_analyzer.lookup_pitch(surface="word", reading_hira="read")

    assert result.has_multiple_patterns is True


def test_confidence_rules():
    assert pitch_analyzer.get_confidence_for_source("dictionary") == "high"
    assert pitch_analyzer.get_confidence_for_source("dictionary_lemma") == "medium"
    assert pitch_analyzer.get_confidence_for_source("dictionary_reading") == "low"
    assert pitch_analyzer.get_confidence_for_source("rule") == "low"
    assert pitch_analyzer.get_confidence_for_source("particle") == "high"

    assert pitch_analyzer.get_confidence_for_source("dictionary_lemma", True) == "high"
    assert pitch_analyzer.get_confidence_for_source("dictionary_reading", True) == "medium"


def test_warning_rules():
    warnings = pitch_analyzer.WARNINGS

    assert pitch_analyzer.get_lookup_warning("dictionary", False) is None
    assert pitch_analyzer.get_lookup_warning("dictionary_reading", False) == warnings["reading_only"]
    assert pitch_analyzer.get_lookup_warning("rule", False) == warnings["rule_based"]
    assert pitch_analyzer.get_lookup_warning("dictionary", True) == warnings["multiple_patterns"]


def test_proper_noun_warning_fallbacks():
    warnings = pitch_analyzer.WARNINGS

    assert pitch_analyzer.get_proper_noun_warning("unknown", True) == warnings["proper_other_dict"]
    assert pitch_analyzer.get_proper_noun_warning("unknown", False) == warnings["proper_other_unknown"]


def test_should_generate_pitch_pattern():
    assert pitch_analyzer.should_generate_pitch_pattern("dictionary") is True
    assert pitch_analyzer.should_generate_pitch_pattern("particle") is False
    assert pitch_analyzer.should_generate_pitch_pattern("proper_noun") is False
