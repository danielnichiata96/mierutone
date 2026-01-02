"""Unit tests for extract_pitch_timed cleanup and errors."""

import pytest

pytest.importorskip("parselmouth", reason="parselmouth required for audio compare")
pytest.importorskip("numpy", reason="numpy required for audio compare")

import numpy as np

from app.services import audio_compare


# Minimal valid WAV header for testing (44 bytes header + some data)
def make_wav_bytes(data_size: int = 100) -> bytes:
    """Create minimal valid WAV file bytes for testing."""
    # WAV header structure
    header = b'RIFF'
    header += (36 + data_size).to_bytes(4, 'little')  # file size - 8
    header += b'WAVE'
    header += b'fmt '
    header += (16).to_bytes(4, 'little')  # fmt chunk size
    header += (1).to_bytes(2, 'little')   # audio format (PCM)
    header += (1).to_bytes(2, 'little')   # num channels
    header += (44100).to_bytes(4, 'little')  # sample rate
    header += (88200).to_bytes(4, 'little')  # byte rate
    header += (2).to_bytes(2, 'little')   # block align
    header += (16).to_bytes(2, 'little')  # bits per sample
    header += b'data'
    header += data_size.to_bytes(4, 'little')
    return header + b'\x00' * data_size


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

    result = audio_compare.extract_pitch_timed(make_wav_bytes())

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
        audio_compare.extract_pitch_timed(make_wav_bytes())

    assert calls


def test_extract_pitch_timed_invalid_wav_raises():
    """Test that non-WAV data raises CompareError."""
    # Create data larger than MIN_AUDIO_SIZE (100 bytes) but not a valid WAV
    invalid_data = b"not a wav file at all" + b"\x00" * 100
    with pytest.raises(audio_compare.CompareError, match="Invalid audio format"):
        audio_compare.extract_pitch_timed(invalid_data)


def test_extract_pitch_timed_empty_data_raises():
    """Test that empty data raises CompareError."""
    with pytest.raises(audio_compare.CompareError, match="empty or too small"):
        audio_compare.extract_pitch_timed(b"")
