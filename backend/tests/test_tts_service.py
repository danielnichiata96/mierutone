"""Unit tests for TTS service behavior."""

import types

import pytest

pytest.importorskip("azure.cognitiveservices.speech", reason="Azure SDK required for TTS module")

from app.services import tts as tts_service


class StubConfig:
    def __init__(self):
        self.speech_synthesis_voice_name = None

    def set_speech_synthesis_output_format(self, _fmt):
        return None


class StubResult:
    def __init__(self, reason, audio_data=b"", cancellation_details=None):
        self.reason = reason
        self.audio_data = audio_data
        self.cancellation_details = cancellation_details


class StubCancellationDetails:
    def __init__(self, reason, error_details=None):
        self.reason = reason
        self.error_details = error_details


class StubSynthesizer:
    def __init__(self, speech_config, audio_config=None):
        self.speech_config = speech_config
        self.audio_config = audio_config
        self.next_result = None

    def speak_ssml_async(self, _ssml):
        return types.SimpleNamespace(get=lambda: self.next_result)


class StubSpeechSDK:
    ResultReason = types.SimpleNamespace(SynthesizingAudioCompleted="completed", Canceled="canceled")
    CancellationReason = types.SimpleNamespace(Error="error")

    def __init__(self, synthesizer):
        self.SpeechSynthesizer = lambda **kwargs: synthesizer


@pytest.fixture()
def stub_sdk(monkeypatch):
    synthesizer = StubSynthesizer(StubConfig())
    sdk = StubSpeechSDK(synthesizer)
    monkeypatch.setattr(tts_service, "speechsdk", sdk)
    monkeypatch.setattr(tts_service, "_get_speech_config", lambda: StubConfig())
    return synthesizer


def test_synthesize_speech_uses_cache(monkeypatch):
    monkeypatch.setattr(tts_service, "get_cached_audio", lambda *_: b"cached")

    audio, from_cache = tts_service.synthesize_speech("hello")

    assert audio == b"cached"
    assert from_cache is True


def test_synthesize_speech_success_saves_cache(stub_sdk, monkeypatch):
    stub_sdk.next_result = StubResult(
        tts_service.speechsdk.ResultReason.SynthesizingAudioCompleted,
        audio_data=b"data",
    )

    called = {"saved": False}

    def fake_save(*_args, **_kwargs):
        called["saved"] = True

    monkeypatch.setattr(tts_service, "get_cached_audio", lambda *_: None)
    monkeypatch.setattr(tts_service, "save_to_cache", fake_save)

    audio, from_cache = tts_service.synthesize_speech("hello")

    assert audio == b"data"
    assert from_cache is False
    assert called["saved"] is True


def test_synthesize_speech_canceled_error(stub_sdk, monkeypatch):
    stub_sdk.next_result = StubResult(
        tts_service.speechsdk.ResultReason.Canceled,
        cancellation_details=StubCancellationDetails(
            tts_service.speechsdk.CancellationReason.Error,
            error_details="boom",
        ),
    )

    monkeypatch.setattr(tts_service, "get_cached_audio", lambda *_: None)

    with pytest.raises(tts_service.TTSError) as exc:
        tts_service.synthesize_speech("hello")

    assert "Azure Speech error" in str(exc.value)


def test_synthesize_speech_canceled_reason(stub_sdk, monkeypatch):
    stub_sdk.next_result = StubResult(
        tts_service.speechsdk.ResultReason.Canceled,
        cancellation_details=StubCancellationDetails("Canceled"),
    )

    monkeypatch.setattr(tts_service, "get_cached_audio", lambda *_: None)

    with pytest.raises(tts_service.TTSError) as exc:
        tts_service.synthesize_speech("hello")

    assert "Azure Speech canceled" in str(exc.value)


def test_synthesize_speech_unknown_reason(stub_sdk, monkeypatch):
    stub_sdk.next_result = StubResult("unknown")

    monkeypatch.setattr(tts_service, "get_cached_audio", lambda *_: None)

    with pytest.raises(tts_service.TTSError) as exc:
        tts_service.synthesize_speech("hello")

    assert "Azure Speech failed with reason" in str(exc.value)


def test_check_azure_health_without_key(monkeypatch):
    monkeypatch.setattr(tts_service.settings, "azure_speech_key", "")

    assert tts_service.check_azure_health() is False


def test_check_azure_health_success(stub_sdk, monkeypatch):
    stub_sdk.next_result = StubResult(
        tts_service.speechsdk.ResultReason.SynthesizingAudioCompleted,
        audio_data=b"data",
    )

    monkeypatch.setattr(tts_service.settings, "azure_speech_key", "key")

    assert tts_service.check_azure_health() is True
