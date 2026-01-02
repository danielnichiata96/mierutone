"""Unit tests for analyze_text using stubbed tokenizer."""

import pytest

pytest.importorskip("sudachipy", reason="sudachipy is required for pitch analyzer")
pytest.importorskip("jaconv", reason="jaconv is required for pitch analyzer")

from app.services import pitch_analyzer
from app.services.pitch import analyzer as pitch_analyzer_module
from app.services.pitch import tokenizer as tokenizer_module
from app.services.pitch import lookup as lookup_module


class StubToken:
    def __init__(self, surface, reading, pos, lemma=None, normalized=None, proper=False):
        self._surface = surface
        self._reading = reading
        self._pos = pos
        self._lemma = lemma or surface
        self._normalized = normalized or surface
        self._proper = proper

    def surface(self):
        return self._surface

    def reading_form(self):
        return self._reading

    def dictionary_form(self):
        return self._lemma

    def normalized_form(self):
        return self._normalized

    def part_of_speech(self):
        return [self._pos]

    def split(self, mode):
        """Return self as a single-element list (no compound splitting)."""
        return [self]

    @property
    def is_proper(self):
        return self._proper


class StubTokenizer:
    def __init__(self, tokens):
        self._tokens = tokens

    def tokenize(self, text, mode):
        return self._tokens


@pytest.fixture()
def default_lookup(monkeypatch):
    monkeypatch.setattr(
        pitch_analyzer_module,
        "lookup_pitch",
        lambda *_args, **_kwargs: pitch_analyzer.PitchLookupResult(0, None, None, source="dictionary"),
    )


@pytest.fixture()
def stub_tokenizer(monkeypatch):
    tokens = [
        StubToken("hello", "hello", "noun"),
        StubToken("!", "!", "punct"),
        StubToken("world", "world", "noun"),
    ]
    monkeypatch.setattr(pitch_analyzer_module, "get_tokenizer", lambda: StubTokenizer(tokens))


@pytest.fixture()
def stub_proper(monkeypatch):
    monkeypatch.setattr(pitch_analyzer_module, "is_proper_noun", lambda token: token.is_proper)
    monkeypatch.setattr(pitch_analyzer_module, "get_proper_noun_type", lambda _token: "unknown")


@pytest.fixture()
def stub_particle(monkeypatch):
    monkeypatch.setattr(pitch_analyzer_module, "is_particle", lambda _pos: False)


def test_analyze_text_filters_punctuation(stub_tokenizer, default_lookup, stub_particle, stub_proper):
    result = pitch_analyzer.analyze_text("ignored")

    surfaces = [word.surface for word in result]
    assert surfaces == ["hello", "world"]


def test_analyze_text_particle_has_no_pattern(monkeypatch):
    tokens = [StubToken("particle", "pa", "p")]
    monkeypatch.setattr(pitch_analyzer_module, "get_tokenizer", lambda: StubTokenizer(tokens))
    monkeypatch.setattr(pitch_analyzer_module, "is_particle", lambda _pos: True)
    monkeypatch.setattr(pitch_analyzer_module, "is_proper_noun", lambda _token: False)

    result = pitch_analyzer.analyze_text("ignored")

    assert result[0].source == "particle"
    assert result[0].pitch_pattern == []
    assert result[0].confidence == "high"


def test_analyze_text_proper_noun_unknown(monkeypatch):
    tokens = [StubToken("name", "na", "n", proper=True)]
    monkeypatch.setattr(pitch_analyzer_module, "get_tokenizer", lambda: StubTokenizer(tokens))
    monkeypatch.setattr(pitch_analyzer_module, "is_particle", lambda _pos: False)
    monkeypatch.setattr(pitch_analyzer_module, "is_proper_noun", lambda token: token.is_proper)
    monkeypatch.setattr(pitch_analyzer_module, "get_proper_noun_type", lambda _token: "unknown")
    monkeypatch.setattr(
        pitch_analyzer_module,
        "lookup_pitch",
        lambda *_args, **_kwargs: pitch_analyzer.PitchLookupResult(None, None, None, source="unknown"),
    )

    result = pitch_analyzer.analyze_text("ignored")

    assert result[0].source == "proper_noun"
    assert result[0].pitch_pattern == []
    assert result[0].warning is not None


def test_analyze_text_proper_noun_in_dictionary(monkeypatch):
    tokens = [StubToken("name", "na", "n", proper=True)]
    monkeypatch.setattr(pitch_analyzer_module, "get_tokenizer", lambda: StubTokenizer(tokens))
    monkeypatch.setattr(pitch_analyzer_module, "is_particle", lambda _pos: False)
    monkeypatch.setattr(pitch_analyzer_module, "is_proper_noun", lambda token: token.is_proper)
    monkeypatch.setattr(pitch_analyzer_module, "get_proper_noun_type", lambda _token: "unknown")
    monkeypatch.setattr(
        pitch_analyzer_module,
        "lookup_pitch",
        lambda *_args, **_kwargs: pitch_analyzer.PitchLookupResult(
            1,
            None,
            None,
            source="dictionary",
            sources_agree=True,
        ),
    )

    result = pitch_analyzer.analyze_text("ignored")

    assert result[0].source == "dictionary_proper"
    assert result[0].confidence == "high"
    assert result[0].pitch_pattern
