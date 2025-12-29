"""Unit tests for extract_pitch_timed cleanup and errors."""

import pytest

pytest.importorskip("parselmouth", reason="parselmouth required for audio compare")
pytest.importorskip("numpy", reason="numpy required for audio compare")

import numpy as np

from app.services import audio_compare


class StubPitch:
    def __init__(self, freqs):
        self.selected_array = {"frequency": np.array(freqs)}


class StubSound:
    def __init__(self, _path, freqs, duration=0.1):
        self._freqs = freqs
        self.duration = duration

    def to_pitch(self, **_kwargs):
        return StubPitch(self._freqs)


def test_extract_pitch_timed_success_cleans_up(monkeypatch):
    calls = []

    def fake_unlink(self, missing_ok=False):
        calls.append(self)

    monkeypatch.setattr(audio_compare.Path, "unlink", fake_unlink, raising=False)

    def fake_sound(path):
        return StubSound(path, [0, 100, 110, 120, 130, 140])

    monkeypatch.setattr(audio_compare.parselmouth, "Sound", fake_sound)

    result = audio_compare.extract_pitch_timed(b"audio")

    assert result.duration_ms == 100
    assert len(result.pitch_values) >= 5
    assert calls


def test_extract_pitch_timed_short_audio_raises(monkeypatch):
    calls = []

    def fake_unlink(self, missing_ok=False):
        calls.append(self)

    monkeypatch.setattr(audio_compare.Path, "unlink", fake_unlink, raising=False)

    def fake_sound(path):
        return StubSound(path, [0, 0, 0])

    monkeypatch.setattr(audio_compare.parselmouth, "Sound", fake_sound)

    with pytest.raises(audio_compare.CompareError):
        audio_compare.extract_pitch_timed(b"audio")

    assert calls
