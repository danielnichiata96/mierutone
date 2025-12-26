"""TTS router - text-to-speech endpoint using Azure Speech AI."""

import asyncio
import base64

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

# Timeout for Azure TTS synthesis (seconds)
TTS_TIMEOUT_SECONDS = 30

from app.services.tts import (
    synthesize_speech,
    synthesize_speech_with_timings,
    get_available_voices,
    check_azure_health,
    add_emphasis,
    add_breaks_between_words,
    TTSError,
    DEFAULT_FEMALE,
)
from app.services.cache import get_cache_stats, clear_cache, health_check as cache_health_check
from app.services.audio_compare import extract_pitch_timed, CompareError

router = APIRouter(prefix="/tts", tags=["tts"])


class TTSRequest(BaseModel):
    """Request body for /tts endpoint."""
    text: str = Field(..., min_length=1, max_length=500)
    voice: str = Field(default=DEFAULT_FEMALE, description="Voice key: female1-4, male1-3")
    rate: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: float = Field(default=0.0, ge=-50.0, le=50.0, description="Pitch adjustment in %")
    volume: float = Field(default=0.0, ge=-50.0, le=50.0, description="Volume adjustment in %")


@router.post("")
async def text_to_speech(request: TTSRequest) -> Response:
    """Convert Japanese text to speech using Azure Speech AI.

    Available voices:
    - female1-4: Female voices (Nanami, Aoi, Mayu, Shiori)
    - male1-3: Male voices (Keita, Daichi, Naoki)

    Args:
        request: TTS request with text, voice, and rate.

    Returns:
        WAV audio file.
    """
    try:
        audio_data, from_cache = await asyncio.wait_for(
            run_in_threadpool(
                synthesize_speech,
                text=request.text,
                voice=request.voice,
                rate=request.rate,
                pitch=request.pitch,
                volume=request.volume,
            ),
            timeout=TTS_TIMEOUT_SECONDS,
        )

        return Response(
            content=audio_data,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "inline; filename=speech.wav",
                "Cache-Control": "public, max-age=86400",
                "X-Cache": "HIT" if from_cache else "MISS",
            },
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail=f"TTS timed out after {TTS_TIMEOUT_SECONDS}s")
    except TTSError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


@router.get("/voices")
async def list_voices() -> dict[str, dict]:
    """List available Azure Speech Japanese voices.

    Returns dict with voice keys and their info (name, gender).
    """
    return get_available_voices()


HEALTH_TIMEOUT_SECONDS = 10


@router.get("/health")
async def tts_health() -> dict:
    """Check if Azure Speech is configured and accessible."""
    try:
        is_healthy = await asyncio.wait_for(
            run_in_threadpool(check_azure_health),
            timeout=HEALTH_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        is_healthy = False

    return {
        "status": "healthy" if is_healthy else "unavailable",
        "engine": "Azure Speech AI",
    }


@router.get("/cache/stats")
async def cache_stats() -> dict:
    """Get cache statistics (Redis hot + R2 cold)."""
    stats = get_cache_stats()
    total_requests = stats.hits + stats.misses
    return {
        "hits": stats.hits,
        "misses": stats.misses,
        "hit_rate": f"{stats.hits / total_requests * 100:.1f}%" if total_requests > 0 else "0%",
        "redis": {
            "hits": stats.redis_hits,
            "connected": stats.redis_connected,
        },
        "r2": {
            "hits": stats.r2_hits,
            "connected": stats.r2_connected,
            "objects": stats.r2_objects,
            "size_mb": stats.r2_size_mb,
        },
    }


@router.delete("/cache")
async def clear_audio_cache() -> dict:
    """Clear Redis cache (R2 is permanent storage)."""
    result = clear_cache()
    return {
        "redis_keys_deleted": result["redis_keys"],
        "message": f"Cleared {result['redis_keys']} Redis keys (R2 storage preserved)",
    }


@router.get("/cache/health")
async def cache_health() -> dict:
    """Check health of cache layers."""
    return cache_health_check()


class DidacticRequest(BaseModel):
    """Request body for /tts/didactic endpoint."""
    text: str = Field(..., min_length=1, max_length=500)
    voice: str = Field(default=DEFAULT_FEMALE, description="Voice key: female1-4, male1-3")
    emphasis_words: list[str] = Field(default=[], description="Words to emphasize")
    add_breaks: bool = Field(default=True, description="Add pauses after particles")
    break_ms: int = Field(default=300, ge=50, le=500, description="Pause duration in ms")
    rate: float = Field(default=0.65, ge=0.5, le=1.5, description="Slower rate for learning")


@router.post("/didactic")
async def didactic_speech(request: DidacticRequest) -> Response:
    """Generate didactic/teacher-mode speech with emphasis and pauses.

    This mode is optimized for learning:
    - Slower speech rate (default 0.8x)
    - Pauses after particles (は、が、を、etc.)
    - Emphasis on specified words

    Args:
        request: Didactic TTS request.

    Returns:
        WAV audio file.
    """
    try:
        # Process text with SSML enhancements
        processed_text = request.text
        has_ssml = False

        # Add emphasis to specified words (escapes text internally)
        if request.emphasis_words:
            processed_text = add_emphasis(processed_text, request.emphasis_words)
            has_ssml = True

        # Add breaks after particles
        if request.add_breaks:
            # Don't escape again if emphasis already escaped
            processed_text = add_breaks_between_words(processed_text, request.break_ms, escape=not has_ssml)
            has_ssml = True

        audio_data, from_cache = await asyncio.wait_for(
            run_in_threadpool(
                synthesize_speech,
                text=processed_text,
                voice=request.voice,
                rate=request.rate,
                pitch=0.0,
                volume=0.0,
                is_ssml=has_ssml,
            ),
            timeout=TTS_TIMEOUT_SECONDS,
        )

        return Response(
            content=audio_data,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "inline; filename=didactic_speech.wav",
                "Cache-Control": "public, max-age=86400",
                "X-Cache": "HIT" if from_cache else "MISS",
                "X-Mode": "didactic",
            },
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail=f"TTS timed out after {TTS_TIMEOUT_SECONDS}s")
    except TTSError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Didactic TTS failed: {str(e)}")


class TTSWithPitchResponse(BaseModel):
    """Response for /tts/with-pitch endpoint."""
    audio_base64: str
    pitch_curve: list[float]  # Full curve with 0s for unvoiced (for timeline sync)
    voiced_curve: list[float]  # Voiced-only values (for comparison scoring)
    duration_ms: int  # Actual audio duration
    time_step_ms: int = 10  # Time between pitch frames


MAX_TEXT_LENGTH = 500


@router.get("/with-pitch", response_model=TTSWithPitchResponse)
async def tts_with_pitch(
    text: str = Query(..., min_length=1, max_length=MAX_TEXT_LENGTH),
    voice: str = DEFAULT_FEMALE,
    rate: float = Query(default=1.0, ge=0.5, le=2.0),
) -> TTSWithPitchResponse:
    """Generate TTS audio with pitch curve for visualization.

    Returns both the audio (base64 encoded) and extracted pitch
    curve for real-time visualization.

    Args:
        text: Japanese text to synthesize.
        voice: Voice key (female1-4, male1-3).
        rate: Speech rate (0.5-2.0, default: 1.0).

    Returns:
        Audio as base64 + pitch curves + actual duration.
    """
    # 1. Generate TTS audio
    try:
        audio_bytes, from_cache = await asyncio.wait_for(
            run_in_threadpool(synthesize_speech, text, voice, rate),
            timeout=TTS_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail=f"TTS timed out after {TTS_TIMEOUT_SECONDS}s")
    except TTSError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # 2. Extract pitch curve with timing info
    try:
        timed_pitch = await run_in_threadpool(extract_pitch_timed, audio_bytes)
    except CompareError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pitch extraction failed: {str(e)}")

    # 3. Encode audio as base64
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

    return TTSWithPitchResponse(
        audio_base64=audio_b64,
        pitch_curve=timed_pitch.full_curve,  # Full timeline for visualization
        voiced_curve=timed_pitch.pitch_values,  # Voiced-only for scoring
        duration_ms=timed_pitch.duration_ms,  # Actual audio duration
    )


class WordTimingItem(BaseModel):
    """Word timing information."""
    text: str
    offset_ms: float
    duration_ms: float


class TTSWithTimingsResponse(BaseModel):
    """Response for /tts/with-timings endpoint."""
    audio_base64: str
    word_timings: list[WordTimingItem]
    duration_ms: int


@router.get("/with-timings", response_model=TTSWithTimingsResponse)
async def tts_with_timings(
    text: str = Query(..., min_length=1, max_length=MAX_TEXT_LENGTH),
    voice: str = DEFAULT_FEMALE,
    rate: float = Query(default=1.0, ge=0.5, le=2.0),
) -> TTSWithTimingsResponse:
    """Generate TTS audio with word boundary timings for cursor sync.

    Returns audio (base64) and timing information for each word,
    enabling synchronized cursor animation in the UI.

    Args:
        text: Japanese text to synthesize.
        voice: Voice key (female1-4, male1-3).
        rate: Speech rate (0.5-2.0, default: 1.0).

    Returns:
        Audio as base64 + word timings array.
    """
    try:
        audio_bytes, timings = await asyncio.wait_for(
            run_in_threadpool(synthesize_speech_with_timings, text, voice, rate),
            timeout=TTS_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail=f"TTS timed out after {TTS_TIMEOUT_SECONDS}s")
    except TTSError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS with timings failed: {str(e)}")

    # Calculate total duration from audio (WAV header: bytes 4-8 = file size)
    # For 16kHz 16-bit mono: duration = (file_size - 44) / (16000 * 2) * 1000
    audio_size = len(audio_bytes)
    duration_ms = int((audio_size - 44) / 32000 * 1000)

    # Encode audio as base64
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

    return TTSWithTimingsResponse(
        audio_base64=audio_b64,
        word_timings=[WordTimingItem(**t) for t in timings],
        duration_ms=duration_ms,
    )
