"""Unit tests for phoneme service."""

import pytest

from app.services import phoneme_service


def test_phoneme_to_ipa_known_and_unknown():
    assert phoneme_service.phoneme_to_ipa("k") == phoneme_service.PHONEME_TO_IPA["k"]
    assert phoneme_service.phoneme_to_ipa("ky") == phoneme_service.PHONEME_TO_IPA["ky"]
    assert phoneme_service.phoneme_to_ipa("xyz") == "xyz"


def test_extract_phonemes_unavailable(monkeypatch):
    monkeypatch.setattr(phoneme_service, "PYOPENJTALK_AVAILABLE", False)
    phoneme_service.extract_phonemes.cache_clear()

    assert phoneme_service.extract_phonemes("hello") is None


def test_extract_phonemes_with_stubbed_labels(monkeypatch):
    class StubOpenJTalk:
        @staticmethod
        def extract_fullcontext(_):
            return [
                "xx^xx-k+xx",
                "xx^xx-a+xx",
                "xx^xx-pau+xx",
            ]

    monkeypatch.setattr(phoneme_service, "PYOPENJTALK_AVAILABLE", True)
    monkeypatch.setattr(phoneme_service, "pyopenjtalk", StubOpenJTalk)
    phoneme_service.extract_phonemes.cache_clear()

    result = phoneme_service.extract_phonemes("hello")

    assert result == "ka"


def test_extract_phonemes_for_word_prefers_reading(monkeypatch):
    def fake_extract(text: str):
        return "reading" if text == "reading" else "surface"

    monkeypatch.setattr(phoneme_service, "extract_phonemes", fake_extract)

    assert phoneme_service.extract_phonemes_for_word("surface", "reading") == "reading"


def test_extract_phonemes_for_word_falls_back_to_surface(monkeypatch):
    def fake_extract(text: str):
        if text == "reading":
            return None
        return "surface"

    monkeypatch.setattr(phoneme_service, "extract_phonemes", fake_extract)

    assert phoneme_service.extract_phonemes_for_word("surface", "reading") == "surface"
