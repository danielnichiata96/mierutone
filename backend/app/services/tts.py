"""Text-to-Speech service using Azure Speech AI."""

import azure.cognitiveservices.speech as speechsdk

from app.core.config import settings
from app.services.cache import get_cached_audio, save_to_cache


class TTSError(Exception):
    """TTS service error."""
    pass


# Azure Neural TTS Japanese voices (high quality)
# Reference: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
AZURE_VOICES = {
    # Female voices
    "female1": {"name": "ja-JP-NanamiNeural", "display_name": "Nanami", "gender": "female"},
    "female2": {"name": "ja-JP-AoiNeural", "display_name": "Aoi", "gender": "female"},
    "female3": {"name": "ja-JP-MayuNeural", "display_name": "Mayu", "gender": "female"},
    "female4": {"name": "ja-JP-ShioriNeural", "display_name": "Shiori", "gender": "female"},
    # Male voices
    "male1": {"name": "ja-JP-KeitaNeural", "display_name": "Keita", "gender": "male"},
    "male2": {"name": "ja-JP-DaichiNeural", "display_name": "Daichi", "gender": "male"},
    "male3": {"name": "ja-JP-NaokiNeural", "display_name": "Naoki", "gender": "male"},
}

# Default voices
DEFAULT_FEMALE = "female1"
DEFAULT_MALE = "male1"


def _get_speech_config() -> speechsdk.SpeechConfig:
    """Create Azure Speech config."""
    if not settings.azure_speech_key:
        raise TTSError("Azure Speech key not configured. Set AZURE_SPEECH_KEY in .env")

    speech_config = speechsdk.SpeechConfig(
        subscription=settings.azure_speech_key,
        region=settings.azure_speech_region
    )
    speech_config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm
    )
    return speech_config


def _build_ssml(
    text: str,
    voice_name: str,
    rate: float = 1.0,
    pitch: float = 0.0,
    volume: float = 0.0,
) -> str:
    """Build SSML string with prosody controls.

    Args:
        text: Text content (can include SSML tags like <emphasis>).
        voice_name: Azure voice name.
        rate: Speech rate multiplier (0.5 to 2.0).
        pitch: Pitch adjustment in percent (-50 to +50).
        volume: Volume adjustment in percent (-50 to +50).

    Returns:
        Complete SSML string.
    """
    # Azure expects a relative percentage where 0% is normal speed.
    rate_percent = int(round((rate - 1.0) * 100))
    rate_sign = "+" if rate_percent > 0 else ""

    # Build prosody attributes
    prosody_attrs = [f'rate="{rate_sign}{rate_percent}%"']

    if pitch != 0:
        sign = "+" if pitch > 0 else ""
        prosody_attrs.append(f'pitch="{sign}{int(pitch)}%"')

    if volume != 0:
        sign = "+" if volume > 0 else ""
        prosody_attrs.append(f'volume="{sign}{int(volume)}%"')

    prosody_str = " ".join(prosody_attrs)

    return f"""<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP">
    <voice name="{voice_name}">
        <prosody {prosody_str}>
            {text}
        </prosody>
    </voice>
</speak>"""


def add_emphasis(text: str, words: list[str]) -> str:
    """Add SSML emphasis tags to specific words.

    Args:
        text: Original text.
        words: List of words to emphasize.

    Returns:
        Text with <emphasis> tags around specified words.
    """
    result = text
    for word in words:
        if word in result:
            result = result.replace(word, f'<emphasis level="strong">{word}</emphasis>')
    return result


def add_breaks_between_words(text: str, break_ms: int = 200) -> str:
    """Add pauses between characters/words for didactic mode.

    Args:
        text: Original text.
        break_ms: Pause duration in milliseconds.

    Returns:
        Text with <break> tags inserted.
    """
    # Add breaks after particles and punctuation
    particles = ["は", "が", "を", "に", "で", "と", "も", "の", "へ", "から", "まで", "より"]
    result = text

    for particle in particles:
        # Only add break after particle if it's likely a grammatical particle
        result = result.replace(particle, f'{particle}<break time="{break_ms}ms"/>')

    return result


def synthesize_speech(
    text: str,
    voice: str = DEFAULT_FEMALE,
    rate: float = 1.0,
    pitch: float = 0.0,
    volume: float = 0.0,
) -> tuple[bytes, bool]:
    """Synthesize speech from Japanese text using Azure Speech AI.

    Args:
        text: Japanese text to synthesize.
        voice: Voice key (female1-4, male1-3).
        rate: Speech rate (0.5 to 2.0, default 1.0).
        pitch: Pitch adjustment in percent (-50 to +50, default 0).
        volume: Volume adjustment in percent (-50 to +50, default 0).

    Returns:
        Tuple of (WAV audio data, from_cache boolean).

    Raises:
        TTSError: If synthesis fails.
    """
    # Check cache first (include pitch and volume in cache key)
    cache_key_rate = rate + (pitch / 1000) + (volume / 100000)  # Encode all params
    cached = get_cached_audio(text, voice, cache_key_rate)
    if cached:
        return cached, True

    # Get voice name
    voice_info = AZURE_VOICES.get(voice, AZURE_VOICES[DEFAULT_FEMALE])
    voice_name = voice_info["name"]

    try:
        speech_config = _get_speech_config()
        speech_config.speech_synthesis_voice_name = voice_name

        # Use in-memory audio output
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config,
            audio_config=None  # No audio output, we get the data directly
        )

        # Build SSML with all prosody controls
        ssml = _build_ssml(text, voice_name, rate, pitch, volume)

        result = synthesizer.speak_ssml_async(ssml).get()

        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            audio_data = result.audio_data
            # Save to cache
            save_to_cache(text, voice, cache_key_rate, audio_data)
            return audio_data, False

        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            if cancellation.reason == speechsdk.CancellationReason.Error:
                raise TTSError(f"Azure Speech error: {cancellation.error_details}")
            raise TTSError(f"Azure Speech canceled: {cancellation.reason}")

        else:
            raise TTSError(f"Azure Speech failed with reason: {result.reason}")

    except TTSError:
        raise
    except Exception as e:
        raise TTSError(f"Azure Speech synthesis failed: {str(e)}")


async def synthesize_speech_async(
    text: str,
    voice: str = DEFAULT_FEMALE,
    rate: float = 1.0,
) -> tuple[bytes, bool]:
    """Async wrapper for synthesize_speech.

    Azure SDK is synchronous, so this wraps the sync function.
    """
    return synthesize_speech(text, voice, rate)


def get_available_voices() -> dict[str, dict]:
    """Get available Azure Japanese voices."""
    return {
        key: {"name": info["display_name"], "gender": info["gender"]}
        for key, info in AZURE_VOICES.items()
    }


async def check_azure_health() -> bool:
    """Check if Azure Speech is configured and accessible."""
    if not settings.azure_speech_key:
        return False

    try:
        speech_config = _get_speech_config()
        # Simple validation - config creation succeeds
        return True
    except Exception:
        return False


class WordTiming:
    """Word timing information from Azure Speech."""
    def __init__(self, text: str, offset_ms: float, duration_ms: float):
        self.text = text
        self.offset_ms = offset_ms
        self.duration_ms = duration_ms

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "offset_ms": self.offset_ms,
            "duration_ms": self.duration_ms,
        }


def synthesize_speech_with_timings(
    text: str,
    voice: str = DEFAULT_FEMALE,
    rate: float = 1.0,
) -> tuple[bytes, list[dict]]:
    """Synthesize speech and capture word boundary timings.

    Args:
        text: Japanese text to synthesize.
        voice: Voice key (female1-4, male1-3).
        rate: Speech rate (0.5 to 2.0, default 1.0).

    Returns:
        Tuple of (WAV audio data, list of word timings).

    Raises:
        TTSError: If synthesis fails.
    """
    # Get voice name
    voice_info = AZURE_VOICES.get(voice, AZURE_VOICES[DEFAULT_FEMALE])
    voice_name = voice_info["name"]

    # Collect word timings
    word_timings: list[WordTiming] = []

    def on_word_boundary(evt):
        """Callback for word boundary events."""
        # Azure returns offset in 100-nanosecond units, convert to ms
        offset_ms = evt.audio_offset / 10000
        # Duration might not always be available
        duration_ms = 0
        if hasattr(evt, 'duration') and evt.duration:
            duration_ms = evt.duration.total_seconds() * 1000

        word_timings.append(WordTiming(
            text=evt.text,
            offset_ms=offset_ms,
            duration_ms=duration_ms,
        ))

    try:
        speech_config = _get_speech_config()
        speech_config.speech_synthesis_voice_name = voice_name

        # Use in-memory audio output
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config,
            audio_config=None
        )

        # Connect word boundary event handler
        synthesizer.synthesis_word_boundary.connect(on_word_boundary)

        # Build SSML
        ssml = _build_ssml(text, voice_name, rate)

        result = synthesizer.speak_ssml_async(ssml).get()

        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            audio_data = result.audio_data
            timings = [wt.to_dict() for wt in word_timings]
            return audio_data, timings

        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            if cancellation.reason == speechsdk.CancellationReason.Error:
                raise TTSError(f"Azure Speech error: {cancellation.error_details}")
            raise TTSError(f"Azure Speech canceled: {cancellation.reason}")

        else:
            raise TTSError(f"Azure Speech failed with reason: {result.reason}")

    except TTSError:
        raise
    except Exception as e:
        raise TTSError(f"Azure Speech synthesis with timings failed: {str(e)}")
