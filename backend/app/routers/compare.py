"""Compare router - pitch comparison endpoint."""

import base64
import binascii

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from app.core.auth import get_current_user, TokenData
from app.core.supabase import get_supabase_client
from app.services.audio_compare import compare_audio, get_score_feedback, CompareError
from app.services.tts import synthesize_speech, TTSError

router = APIRouter(prefix="/compare", tags=["compare"])


def _is_valid_audio(data: bytes) -> bool:
    """Check if data has a valid audio file signature."""
    if len(data) < 12:
        return False
    # WAV: RIFF....WAVE
    if data[:4] == b"RIFF" and data[8:12] == b"WAVE":
        return True
    # WebM/Matroska: 0x1A45DFA3
    if data[:4] == b"\x1a\x45\xdf\xa3":
        return True
    # MP4/M4A: ftyp at offset 4
    if data[4:8] == b"ftyp":
        return True
    # OGG: OggS
    if data[:4] == b"OggS":
        return True
    return False


class CompareRequest(BaseModel):
    """Request for comparison with base64 audio."""
    text: str  # The Japanese text being practiced
    user_audio_base64: str  # User's recording as base64


class CompareResponse(BaseModel):
    """Response with comparison results."""
    score: int
    feedback: str
    native_pitch: list[float]
    user_pitch: list[float]
    aligned_native: list[float]
    aligned_user: list[float]


@router.post("", response_model=CompareResponse)
async def compare_pronunciation(
    request: CompareRequest,
    user: TokenData | None = Depends(get_current_user),
) -> CompareResponse:
    """Compare user's pronunciation with native TTS.

    1. Generates native audio using TTS
    2. Extracts pitch from both audios
    3. Aligns using DTW
    4. Calculates similarity score

    Args:
        request: Text and user's audio recording.

    Returns:
        Comparison score and pitch data for visualization.
    """
    # 1. Decode user audio from base64 (lenient for legacy clients)
    try:
        # Strip data URI prefix if present (e.g., "data:audio/wav;base64,...")
        audio_data = request.user_audio_base64
        if "," in audio_data and audio_data.startswith("data:"):
            audio_data = audio_data.split(",", 1)[1]
        user_audio = base64.b64decode(audio_data)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="Invalid base64 audio data")

    # Validate decoded audio has minimum size and looks like audio
    if len(user_audio) < 44:  # WAV header alone is 44 bytes
        raise HTTPException(status_code=400, detail="Audio data too small - recording may have failed")
    # Check for common audio file signatures
    if not _is_valid_audio(user_audio):
        raise HTTPException(status_code=400, detail="Invalid audio format - expected WAV, WebM, MP4, or OGG")

    # 2. Generate native audio via TTS (run in threadpool - blocking I/O)
    try:
        native_audio, _ = await run_in_threadpool(synthesize_speech, request.text)
    except TTSError as e:
        raise HTTPException(status_code=503, detail=f"TTS failed: {str(e)}")

    # 3. Compare (run in threadpool - CPU-bound)
    try:
        result = await run_in_threadpool(compare_audio, native_audio, user_audio)
    except CompareError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

    # Auto-save score if user is authenticated (BE-5)
    if user:
        try:
            supabase = get_supabase_client(user.access_token)
            supabase.table("comparison_scores").insert(
                {
                    "user_id": user.user_id,
                    "text": request.text,
                    "score": result.score,
                }
            ).execute()
        except Exception:
            pass  # Don't fail comparison if history save fails

    return CompareResponse(
        score=result.score,
        feedback=get_score_feedback(result.score),
        native_pitch=result.native_pitch,
        user_pitch=result.user_pitch,
        aligned_native=result.aligned_native,
        aligned_user=result.aligned_user,
    )


@router.post("/upload", response_model=CompareResponse)
async def compare_with_upload(
    text: str = Form(...),
    user_audio: UploadFile = File(...),
    user: TokenData | None = Depends(get_current_user),
) -> CompareResponse:
    """Compare using file upload instead of base64.

    Alternative endpoint for larger audio files.
    """
    # 1. Generate native audio via TTS (run in threadpool - blocking I/O)
    try:
        native_audio, _ = await run_in_threadpool(synthesize_speech, text)
    except TTSError as e:
        raise HTTPException(status_code=503, detail=f"TTS failed: {str(e)}")

    # 2. Read and validate uploaded file
    try:
        user_audio_bytes = await user_audio.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read audio file")

    if len(user_audio_bytes) < 44:
        raise HTTPException(status_code=400, detail="Audio file too small - upload may have failed")
    if not _is_valid_audio(user_audio_bytes):
        raise HTTPException(status_code=400, detail="Invalid audio format - expected WAV, WebM, MP4, or OGG")

    # 3. Compare (run in threadpool - CPU-bound)
    try:
        result = await run_in_threadpool(compare_audio, native_audio, user_audio_bytes)
    except CompareError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

    # Auto-save score if user is authenticated (BE-5)
    if user:
        try:
            supabase = get_supabase_client(user.access_token)
            supabase.table("comparison_scores").insert(
                {
                    "user_id": user.user_id,
                    "text": text,
                    "score": result.score,
                }
            ).execute()
        except Exception:
            pass  # Don't fail comparison if history save fails

    return CompareResponse(
        score=result.score,
        feedback=get_score_feedback(result.score),
        native_pitch=result.native_pitch,
        user_pitch=result.user_pitch,
        aligned_native=result.aligned_native,
        aligned_user=result.aligned_user,
    )
