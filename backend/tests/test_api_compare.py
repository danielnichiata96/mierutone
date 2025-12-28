"""API tests for compare endpoints."""

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

from app.routers import compare as compare_router


def make_wav_bytes(payload_len: int = 0) -> bytes:
    header = b"RIFF" + (b"\x00" * 4) + b"WAVE" + (b"\x00" * (44 - 12))
    return header + (b"\x00" * payload_len)


@pytest.fixture()
def client():
    app = FastAPI()
    app.include_router(compare_router.router, prefix="/api")
    return TestClient(app)


def test_compare_base64_success(client, monkeypatch):
    wav_bytes = make_wav_bytes()

    def fake_synthesize_speech(text: str):
        return wav_bytes, False

    def fake_compare_audio(native_audio: bytes, user_audio: bytes):
        return SimpleNamespace(
            score=80,
            native_pitch=[1.0, 2.0],
            user_pitch=[1.0, 2.0],
            aligned_native=[1.0],
            aligned_user=[1.0],
        )

    monkeypatch.setattr(compare_router, "synthesize_speech", fake_synthesize_speech)
    monkeypatch.setattr(compare_router, "compare_audio", fake_compare_audio)

    payload = {
        "text": "hello",
        "user_audio_base64": base64.b64encode(wav_bytes).decode("ascii"),
    }

    response = client.post("/api/compare", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 80
    assert data["feedback"] == "Great job! Minor adjustments needed."
    assert data["aligned_user"] == [1.0]


def test_compare_base64_data_uri_success(client, monkeypatch):
    wav_bytes = make_wav_bytes()

    def fake_synthesize_speech(text: str):
        return wav_bytes, False

    def fake_compare_audio(native_audio: bytes, user_audio: bytes):
        return SimpleNamespace(
            score=95,
            native_pitch=[1.0],
            user_pitch=[1.0],
            aligned_native=[1.0],
            aligned_user=[1.0],
        )

    monkeypatch.setattr(compare_router, "synthesize_speech", fake_synthesize_speech)
    monkeypatch.setattr(compare_router, "compare_audio", fake_compare_audio)

    payload = {
        "text": "hello",
        "user_audio_base64": "data:audio/wav;base64," + base64.b64encode(wav_bytes).decode("ascii"),
    }

    response = client.post("/api/compare", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 95
    assert data["feedback"] == "Excellent! Native-like pitch pattern!"


def test_compare_invalid_base64(client):
    payload = {
        "text": "hello",
        "user_audio_base64": "notbase64",
    }

    response = client.post("/api/compare", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid base64 audio data"


def test_compare_audio_too_small(client):
    payload = {
        "text": "hello",
        "user_audio_base64": base64.b64encode(b"short").decode("ascii"),
    }

    response = client.post("/api/compare", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Audio data too small - recording may have failed"


def test_compare_invalid_audio_format(client):
    bad_bytes = b"NOPE" + (b"\x00" * 40)
    payload = {
        "text": "hello",
        "user_audio_base64": base64.b64encode(bad_bytes).decode("ascii"),
    }

    response = client.post("/api/compare", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid audio format - expected WAV, WebM, MP4, or OGG"


def test_compare_tts_error(client, monkeypatch):
    wav_bytes = make_wav_bytes()

    def fake_synthesize_speech(text: str):
        raise compare_router.TTSError("boom")

    monkeypatch.setattr(compare_router, "synthesize_speech", fake_synthesize_speech)

    payload = {
        "text": "hello",
        "user_audio_base64": base64.b64encode(wav_bytes).decode("ascii"),
    }

    response = client.post("/api/compare", json=payload)

    assert response.status_code == 503
    assert response.json()["detail"] == "TTS failed: boom"


def test_compare_compare_error(client, monkeypatch):
    wav_bytes = make_wav_bytes()

    def fake_synthesize_speech(text: str):
        return wav_bytes, False

    def fake_compare_audio(native_audio: bytes, user_audio: bytes):
        raise compare_router.CompareError("no pitch")

    monkeypatch.setattr(compare_router, "synthesize_speech", fake_synthesize_speech)
    monkeypatch.setattr(compare_router, "compare_audio", fake_compare_audio)

    payload = {
        "text": "hello",
        "user_audio_base64": base64.b64encode(wav_bytes).decode("ascii"),
    }

    response = client.post("/api/compare", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"] == "no pitch"


def test_compare_compare_unexpected_error(client, monkeypatch):
    wav_bytes = make_wav_bytes()

    def fake_synthesize_speech(text: str):
        return wav_bytes, False

    def fake_compare_audio(native_audio: bytes, user_audio: bytes):
        raise RuntimeError("boom")

    monkeypatch.setattr(compare_router, "synthesize_speech", fake_synthesize_speech)
    monkeypatch.setattr(compare_router, "compare_audio", fake_compare_audio)

    payload = {
        "text": "hello",
        "user_audio_base64": base64.b64encode(wav_bytes).decode("ascii"),
    }

    response = client.post("/api/compare", json=payload)

    assert response.status_code == 500
    assert response.json()["detail"] == "Comparison failed: boom"


def test_compare_upload_success(client, monkeypatch):
    wav_bytes = make_wav_bytes()

    def fake_synthesize_speech(text: str):
        return wav_bytes, False

    def fake_compare_audio(native_audio: bytes, user_audio: bytes):
        return SimpleNamespace(
            score=90,
            native_pitch=[1.0],
            user_pitch=[1.0],
            aligned_native=[1.0],
            aligned_user=[1.0],
        )

    monkeypatch.setattr(compare_router, "synthesize_speech", fake_synthesize_speech)
    monkeypatch.setattr(compare_router, "compare_audio", fake_compare_audio)

    response = client.post(
        "/api/compare/upload",
        data={"text": "hello"},
        files={"user_audio": ("test.wav", wav_bytes, "audio/wav")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 90
    assert data["aligned_native"] == [1.0]


def test_compare_upload_audio_too_small(client, monkeypatch):
    wav_bytes = make_wav_bytes()

    def fake_synthesize_speech(text: str):
        return wav_bytes, False

    monkeypatch.setattr(compare_router, "synthesize_speech", fake_synthesize_speech)

    response = client.post(
        "/api/compare/upload",
        data={"text": "hello"},
        files={"user_audio": ("test.wav", b"short", "audio/wav")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Audio file too small - upload may have failed"


def test_compare_upload_invalid_audio_format(client, monkeypatch):
    wav_bytes = make_wav_bytes()
    bad_bytes = b"NOPE" + (b"\x00" * 40)

    def fake_synthesize_speech(text: str):
        return wav_bytes, False

    monkeypatch.setattr(compare_router, "synthesize_speech", fake_synthesize_speech)

    response = client.post(
        "/api/compare/upload",
        data={"text": "hello"},
        files={"user_audio": ("test.wav", bad_bytes, "audio/wav")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid audio format - expected WAV, WebM, MP4, or OGG"
