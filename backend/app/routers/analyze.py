"""Analyze router - pitch accent analysis endpoint."""

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user, TokenData
from app.core.supabase import get_supabase_client
from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.pitch_analyzer import analyze_text, is_homophone_lookup_candidate, lookup_homophones

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
async def analyze(
    request: AnalyzeRequest,
    user: TokenData | None = Depends(get_current_user),
) -> AnalyzeResponse:
    """Analyze Japanese text and return pitch accent information.

    Homophone mode: When input is short (≤10 chars), pure hiragana,
    and has ≥2 dictionary matches (e.g., "はし" → 箸, 橋, 端),
    returns all homophone candidates with kanji and pitch patterns.

    Standard mode: For kanji input, long hiragana sentences, or
    hiragana with only 0-1 matches, performs tokenization and lookup.

    Args:
        request: Request containing Japanese text to analyze.

    Returns:
        AnalyzeResponse with either:
        - is_homophone_lookup=True, homophones=[...] (homophone mode)
        - is_homophone_lookup=False, words=[...] (standard mode)
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    text = request.text.strip()

    # Check if this is a homophone lookup candidate (short, pure hiragana)
    is_candidate, normalized_reading = is_homophone_lookup_candidate(text)

    if is_candidate:
        homophones = lookup_homophones(normalized_reading)

        # Only use homophone mode if we found multiple candidates (>=2)
        # Otherwise fall back to standard tokenization
        if len(homophones) >= 2:
            # Auto-save to history if user is authenticated (BE-4)
            if user:
                try:
                    supabase = get_supabase_client(user.access_token)
                    supabase.table("analysis_history").insert(
                        {
                            "user_id": user.user_id,
                            "text": request.text,
                            "word_count": len(homophones),
                        }
                    ).execute()
                except Exception:
                    pass

            return AnalyzeResponse(
                text=request.text,
                words=[],  # Empty in homophone mode
                is_homophone_lookup=True,
                homophones=homophones,
            )
        # Fall through to standard analysis if 0-1 homophones found

    # Standard mode: tokenize and analyze
    try:
        words = analyze_text(text)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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
        is_homophone_lookup=False,
        homophones=None,
    )
