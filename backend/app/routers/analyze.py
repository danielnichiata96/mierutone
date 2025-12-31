"""Analyze router - pitch accent analysis endpoint."""

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user, TokenData
from app.core.supabase import get_supabase_client
from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.pitch_analyzer import analyze_text

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
async def analyze(
    request: AnalyzeRequest,
    user: TokenData | None = Depends(get_current_user),
) -> AnalyzeResponse:
    """Analyze Japanese text and return pitch accent information.

    Args:
        request: Request containing Japanese text to analyze.

    Returns:
        Analysis result with pitch patterns for each word.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    words = analyze_text(request.text)

    # Auto-save to history if user is authenticated (BE-4)
    if user:
        try:
            supabase = get_supabase_client(user.access_token)
            supabase.table("analysis_history").insert(
                {
                    "user_id": user.user_id,
                    "text": request.text,
                    "word_count": len(words),
                }
            ).execute()
        except Exception:
            pass  # Don't fail analysis if history save fails

    return AnalyzeResponse(
        text=request.text,
        words=words,
    )
