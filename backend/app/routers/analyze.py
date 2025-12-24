"""Analyze router - pitch accent analysis endpoint."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.pitch_analyzer import analyze_text

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze Japanese text and return pitch accent information.

    Args:
        request: Request containing Japanese text to analyze.

    Returns:
        Analysis result with pitch patterns for each word.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    words = analyze_text(request.text)

    return AnalyzeResponse(
        text=request.text,
        words=words,
    )
