"""API tests for TTS endpoints."""

import asyncio
import base64
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

pytest.importorskip("azure.cognitiveservices.speech", reason="Azure SDK required for TTS")
pytest.importorskip("parselmouth", reason="parselmouth required for audio compare")
pytest.importorskip("fastdtw", reason="fastdtw required for audio compare")
pytest.importorskip("numpy", reason="numpy required for audio compare")
pytest.importorskip("scipy", reason="scipy required for audio compare")

from app.routers import tts as tts_router


def make_wav_bytes(payload_len: int = 0) -> bytes:
    header = b"RIFF" + (b"\x00" * 4) + b"WAVE" + (b"\x00" * (44 - 12))
    return header + (b"\x00" * payload_len)


@pytest.fixture()
def client():
    app = FastAPI()
    app.include_router(tts_router.router, prefix="/api")
    return TestClient(app)


def test_tts_audio_response(client, monkeypatch):
    wav_bytes = make_wav_bytes()

    def fake_synthesize_speech(text, voice, rate, pitch, volume):
        return wav_bytes, False

    monkeypatch.setattr(tts_router, "synthesize_speech", fake_synthesize_speech)

    response = client.post("/api/tts", json={"text": "hello"})

    assert response.status_code == 200
    assert response.headers["x-cache"] == "MISS"
    assert response.headers["content-disposition"] == "inline; filename=speech.wav"
    assert response.headers["cache-control"] == "public, max-age=86400"
    assert response.headers["content-type"].startswith("audio/wav")
    assert response.content == wav_bytes


def test_tts_missing_text_validation(client):
    response = client.post("/api/tts", json={})

    assert response.status_code == 422


def test_tts_timeout(client, monkeypatch):
    async def fake_wait_for(*args, **kwargs):
        raise asyncio.TimeoutError

    monkeypatch.setattr(tts_router.asyncio, "wait_for", fake_wait_for)

    response = client.post("/api/tts", json={"text": "hello"})

    assert response.status_code == 504
    assert response.json()["detail"] == "TTS timed out after 30s"


def test_tts_tts_error(client, monkeypatch):
    def fake_synthesize_speech(*args, **kwargs):
        raise tts_router.TTSError("boom")

    monkeypatch.setattr(tts_router, "synthesize_speech", fake_synthesize_speech)

    response = client.post("/api/tts", json={"text": "hello"})

    assert response.status_code == 503
    assert response.json()["detail"] == "boom"


def test_tts_unexpected_error(client, monkeypatch):
    def fake_synthesize_speech(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(tts_router, "synthesize_speech", fake_synthesize_speech)

    response = client.post("/api/tts", json={"text": "hello"})

    assert response.status_code == 500
    assert response.json()["detail"] == "TTS failed: boom"


def test_tts_voices(client, monkeypatch):
    voices = {"female1": {"name": "Test", "gender": "female"}}
    monkeypatch.setattr(tts_router, "get_available_voices", lambda: voices)

    response = client.get("/api/tts/voices")

    assert response.status_code == 200
    assert response.json() == voices


def test_tts_health_healthy(client, monkeypatch):
    monkeypatch.setattr(tts_router, "check_azure_health", lambda: True)

    response = client.get("/api/tts/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "engine": "Azure Speech AI"}


def test_tts_health_unavailable(client, monkeypatch):
    monkeypatch.setattr(tts_router, "check_azure_health", lambda: False)

    response = client.get("/api/tts/health")

    assert response.status_code == 200
    assert response.json() == {"status": "unavailable", "engine": "Azure Speech AI"}


def test_cache_stats(client, monkeypatch):
    stats = SimpleNamespace(
        hits=2,
        misses=1,
        redis_hits=1,
        redis_connected=True,
        r2_hits=1,
        r2_connected=False,
        r2_objects=2,
        r2_size_mb=1.5,
    )
    monkeypatch.setattr(tts_router, "get_cache_stats", lambda: stats)

    response = client.get("/api/tts/cache/stats")

    assert response.status_code == 200
    assert response.json() == {
        "hits": 2,
        "misses": 1,
        "hit_rate": "66.7%",
        "redis": {"hits": 1, "connected": True},
        "r2": {"hits": 1, "connected": False, "objects": 2, "size_mb": 1.5},
    }


def test_clear_cache(client, monkeypatch):
    monkeypatch.setattr(tts_router, "clear_cache", lambda: {"redis_keys": 3})

    response = client.delete("/api/tts/cache")

    assert response.status_code == 200
    assert response.json() == {
        "redis_keys_deleted": 3,
        "message": "Cleared 3 Redis keys (R2 storage preserved)",
    }


def test_cache_health(client, monkeypatch):
    payload = {
        "redis": {"enabled": True, "connected": True},
        "r2": {"enabled": False, "connected": None},
    }
    monkeypatch.setattr(tts_router, "cache_health_check", lambda: payload)

    response = client.get("/api/tts/cache/health")

    assert response.status_code == 200
    assert response.json() == payload


def test_tts_with_pitch(client, monkeypatch):
    wav_bytes = make_wav_bytes()
    fake_pitch = SimpleNamespace(
        full_curve=[0.0, 110.0],
        pitch_values=[110.0],
        duration_ms=20,
    )

    def fake_synthesize_speech(text, voice, rate):
        return wav_bytes, False

    def fake_extract_pitch_timed(audio_bytes: bytes):
        return fake_pitch

    monkeypatch.setattr(tts_router, "synthesize_speech", fake_synthesize_speech)
    monkeypatch.setattr(tts_router, "extract_pitch_timed", fake_extract_pitch_timed)

    response = client.get("/api/tts/with-pitch", params={"text": "hello"})

    assert response.status_code == 200
    data = response.json()
    assert data["audio_base64"] == base64.b64encode(wav_bytes).decode("ascii")
    assert data["pitch_curve"] == [0.0, 110.0]
    assert data["voiced_curve"] == [110.0]
    assert data["duration_ms"] == 20


def test_tts_with_pitch_compare_error(client, monkeypatch):
    wav_bytes = make_wav_bytes()

    def fake_synthesize_speech(text, voice, rate):
        return wav_bytes, False

    def fake_extract_pitch_timed(audio_bytes: bytes):
        raise tts_router.CompareError("bad pitch")

    monkeypatch.setattr(tts_router, "synthesize_speech", fake_synthesize_speech)
    monkeypatch.setattr(tts_router, "extract_pitch_timed", fake_extract_pitch_timed)

    response = client.get("/api/tts/with-pitch", params={"text": "hello"})

    assert response.status_code == 422
    assert response.json()["detail"] == "bad pitch"


def test_tts_with_timings(client, monkeypatch):
    audio_bytes = make_wav_bytes(payload_len=32000)
    timings = [{"text": "hello", "offset_ms": 0.0, "duration_ms": 500.0}]

    def fake_synthesize_speech_with_timings(text, voice, rate):
        return audio_bytes, timings

    monkeypatch.setattr(
        tts_router,
        "synthesize_speech_with_timings",
        fake_synthesize_speech_with_timings,
    )

    response = client.get("/api/tts/with-timings", params={"text": "hello"})

    assert response.status_code == 200
    data = response.json()
    assert data["duration_ms"] == 1000
    assert data["word_timings"] == timings


def test_tts_with_timings_tts_error(client, monkeypatch):
    def fake_synthesize_speech_with_timings(text, voice, rate):
        raise tts_router.TTSError("bad timings")

    monkeypatch.setattr(
        tts_router,
        "synthesize_speech_with_timings",
        fake_synthesize_speech_with_timings,
    )

    response = client.get("/api/tts/with-timings", params={"text": "hello"})

    assert response.status_code == 503
    assert response.json()["detail"] == "bad timings"


def test_tts_didactic_ssml(client, monkeypatch):
    wav_bytes = make_wav_bytes()
    seen = {}

    def fake_synthesize_speech(text, voice, rate, pitch, volume, is_ssml=False):
        seen["is_ssml"] = is_ssml
        return wav_bytes, False

    monkeypatch.setattr(tts_router, "synthesize_speech", fake_synthesize_speech)

    response = client.post(
        "/api/tts/didactic",
        json={"text": "hello", "emphasis_words": ["hello"], "add_breaks": True},
    )

    assert response.status_code == 200
    assert seen["is_ssml"] is True
    assert response.headers["x-mode"] == "didactic"
