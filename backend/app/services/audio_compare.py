"""Audio comparison service using Parselmouth + DTW."""

import io
import logging
import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import parselmouth
from fastdtw import fastdtw
from scipy.spatial.distance import euclidean
from scipy.stats import zscore

logger = logging.getLogger(__name__)


@dataclass
class ComparisonResult:
    """Result of pitch comparison."""
    score: int  # 0-100
    distance: float  # Raw DTW distance
    native_pitch: list[float]  # Normalized pitch values
    user_pitch: list[float]  # Normalized pitch values
    aligned_native: list[float]  # After DTW alignment
    aligned_user: list[float]  # After DTW alignment
    alignment_path: list[tuple[int, int]]  # DTW path


class CompareError(Exception):
    """Audio comparison error."""
    pass


@dataclass
class TimedPitch:
    """Pitch data with timing information."""
    pitch_values: list[float]  # Voiced-only pitch values (Hz)
    full_curve: list[float]  # All frames (0 for unvoiced)
    duration_ms: int  # Actual audio duration in ms
    time_step_ms: int = 10  # Time between frames


def extract_pitch(audio_data: bytes) -> np.ndarray:
    """Extract pitch curve using Parselmouth (Praat).

    Args:
        audio_data: WAV audio bytes.

    Returns:
        Array of pitch values (Hz) for voiced segments.
    """
    result = extract_pitch_timed(audio_data)
    return np.array(result.pitch_values)


def extract_pitch_timed(audio_data: bytes) -> TimedPitch:
    """Extract pitch curve with timing information.

    Unlike extract_pitch(), this preserves the full timeline
    including unvoiced segments, which is needed for karaoke mode
    to sync the playhead with actual audio duration.

    Args:
        audio_data: WAV audio bytes.

    Returns:
        TimedPitch with both voiced-only and full curve data.
    """
    # Save to temp file (Parselmouth needs file path)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_data)
        temp_path = f.name

    try:
        snd = parselmouth.Sound(temp_path)

        # Get actual audio duration
        duration_ms = int(snd.duration * 1000)

        # Extract pitch with settings ideal for human voice
        pitch = snd.to_pitch(
            time_step=0.01,  # 10ms frames
            pitch_floor=75,  # Min Hz (bass voice)
            pitch_ceiling=600,  # Max Hz (high voice)
        )

        pitch_values = pitch.selected_array['frequency']
        pitch_values = pitch_values.astype(float)

        # Full curve with zeros for unvoiced (for timeline sync)
        full_curve = pitch_values.tolist()

        # Replace unvoiced (0) with NaN for voiced-only extraction
        pitch_with_nan = pitch_values.copy()
        pitch_with_nan[pitch_with_nan == 0] = np.nan

        # Remove NaN values (keep only voiced segments)
        voiced_values = pitch_with_nan[~np.isnan(pitch_with_nan)]

        if len(voiced_values) < 5:
            raise CompareError("Audio too short or no voice detected")

        return TimedPitch(
            pitch_values=voiced_values.tolist(),
            full_curve=full_curve,
            duration_ms=duration_ms,
        )

    finally:
        # Clean up temp file
        Path(temp_path).unlink(missing_ok=True)


def normalize_pitch(pitch_values: np.ndarray) -> np.ndarray:
    """Normalize pitch using Z-Score.

    This makes comparison focus on the SHAPE of the curve,
    not absolute frequency (ignores if voice is high or low).

    Args:
        pitch_values: Raw pitch values in Hz.

    Returns:
        Z-score normalized pitch values.
    """
    if len(pitch_values) < 2:
        return pitch_values

    normalized = zscore(pitch_values)

    # Handle edge case where std is 0
    if np.any(np.isnan(normalized)):
        return pitch_values - np.mean(pitch_values)

    return normalized


def compare_audio(native_audio: bytes, user_audio: bytes) -> ComparisonResult:
    """Compare user's pronunciation with native audio.

    Uses DTW (Dynamic Time Warping) to align the pitch curves
    even if the user speaks faster or slower than the native.

    Args:
        native_audio: Native speaker WAV audio bytes.
        user_audio: User's WAV audio bytes.

    Returns:
        ComparisonResult with score and alignment data.
    """
    # 1. Extract pitch from both audios
    try:
        pitch_native = extract_pitch(native_audio)
        pitch_user = extract_pitch(user_audio)
    except Exception as e:
        logger.exception(f"Pitch extraction failed: {e}")
        raise CompareError("Could not analyze audio - please ensure clear recording")

    # 2. Normalize using Z-Score (compare shape, not absolute Hz)
    norm_native = normalize_pitch(pitch_native)
    norm_user = normalize_pitch(pitch_user)

    # 3. DTW alignment - reshape for fastdtw
    native_seq = norm_native.reshape(-1, 1)
    user_seq = norm_user.reshape(-1, 1)

    # Calculate DTW distance and path
    distance, path = fastdtw(native_seq, user_seq, dist=euclidean)

    # 4. Create aligned sequences based on DTW path
    aligned_native = [norm_native[i] for i, j in path]
    aligned_user = [norm_user[j] for i, j in path]

    # 5. Calculate score (0-100)
    # Normalize distance by path length
    avg_distance = distance / len(path)

    # Convert to score (lower distance = higher score)
    # Typical distances range from 0 to ~3 for z-scored data
    score = max(0, min(100, int(100 - avg_distance * 30)))

    return ComparisonResult(
        score=score,
        distance=distance,
        native_pitch=norm_native.tolist(),
        user_pitch=norm_user.tolist(),
        aligned_native=aligned_native,
        aligned_user=aligned_user,
        alignment_path=path,
    )


def get_score_feedback(score: int) -> str:
    """Get feedback message based on score."""
    if score >= 90:
        return "Excellent! Native-like pitch pattern!"
    elif score >= 75:
        return "Great job! Minor adjustments needed."
    elif score >= 60:
        return "Good attempt. Focus on the pitch contour."
    elif score >= 40:
        return "Keep practicing. Pay attention to high/low patterns."
    else:
        return "Try again. Listen carefully to the native audio first."
