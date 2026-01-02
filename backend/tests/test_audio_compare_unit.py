"""Unit tests for audio comparison utilities."""

import pytest

pytest.importorskip("parselmouth", reason="parselmouth required for audio compare")
pytest.importorskip("fastdtw", reason="fastdtw required for audio compare")
pytest.importorskip("numpy", reason="numpy required for audio compare")
pytest.importorskip("scipy", reason="scipy required for audio compare")

import numpy as np

from app.services import audio_compare


def test_normalize_pitch_short_sequence_returns_original():
    data = np.array([100.0])

    result = audio_compare.normalize_pitch(data)

    assert np.array_equal(result, data)


def test_normalize_pitch_handles_zero_std():
    data = np.array([100.0, 100.0])

    result = audio_compare.normalize_pitch(data)

    assert np.array_equal(result, np.array([0.0, 0.0]))


def test_compare_audio_happy_path(monkeypatch):
    monkeypatch.setattr(audio_compare, "extract_pitch", lambda *_: np.array([1.0, 2.0]))
    monkeypatch.setattr(audio_compare, "normalize_pitch", lambda x: x)
    monkeypatch.setattr(audio_compare, "fastdtw", lambda *args, **kwargs: (0.0, [(0, 0), (1, 1)]))

    result = audio_compare.compare_audio(b"native", b"user")

    assert result.score == 100
    assert result.aligned_native == [1.0, 2.0]
    assert result.aligned_user == [1.0, 2.0]


def test_compare_audio_extract_pitch_error(monkeypatch):
    def boom(*_):
        raise ValueError("bad audio")

    monkeypatch.setattr(audio_compare, "extract_pitch", boom)

    with pytest.raises(audio_compare.CompareError) as exc:
        audio_compare.compare_audio(b"native", b"user")

    assert "Could not analyze audio" in str(exc.value)


def test_get_score_feedback_thresholds():
    assert audio_compare.get_score_feedback(90).startswith("Excellent")
    assert audio_compare.get_score_feedback(75).startswith("Great")
    assert audio_compare.get_score_feedback(60).startswith("Good")
    assert audio_compare.get_score_feedback(40).startswith("Keep")
    assert audio_compare.get_score_feedback(10).startswith("Try")
