"""Unit tests for TTS utility helpers."""

import pytest

pytest.importorskip("azure.cognitiveservices.speech", reason="Azure SDK required for TTS module")

from app.services import tts as tts_service


def test_build_ssml_escapes_text_and_sets_rate():
    ssml = tts_service._build_ssml("<tag>&", "voice", rate=1.2)

    assert "&lt;tag&gt;&amp;" in ssml
    assert 'rate="+20%"' in ssml


def test_build_ssml_includes_pitch_and_volume_when_set():
    ssml = tts_service._build_ssml("hello", "voice", rate=1.0, pitch=-10, volume=5)

    assert 'rate="0%"' in ssml
    assert 'pitch="-10%"' in ssml
    assert 'volume="+5%"' in ssml


def test_add_emphasis_escapes_and_wraps_word():
    result = tts_service.add_emphasis("hello & bye", ["hello"])

    assert "<emphasis level=\"strong\">hello</emphasis>" in result
    assert "&amp;" in result


def test_add_breaks_between_words_end_boundary():
    # Function adds breaks after Japanese particles (は, が, etc.) at word boundaries
    result = tts_service.add_breaks_between_words("これは", break_ms=300)

    # は at end of string gets a break (matches $ in word_boundary pattern)
    assert result == 'これは<break time="300ms"/>'
