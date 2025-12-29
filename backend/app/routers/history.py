"""User history endpoints for analyses and comparison scores."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import require_auth, TokenData
from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/history", tags=["history"])


class AnalysisCreate(BaseModel):
    """Request to save an analysis."""

    text: str
    word_count: int


class ScoreCreate(BaseModel):
    """Request to save a comparison score."""

    text: str
    score: float


class HistoryResponse(BaseModel):
    """Response containing user history."""

    analyses: list[dict]
    scores: list[dict]


@router.post("/analysis")
async def save_analysis(
    data: AnalysisCreate,
    user: TokenData = Depends(require_auth),
):
    """Save an analysis to user history."""
    supabase = get_supabase_client(user.access_token)
    result = (
        supabase.table("analysis_history")
        .insert(
            {
                "user_id": user.user_id,
                "text": data.text,
                "word_count": data.word_count,
            }
        )
        .execute()
    )
    return {"success": True, "id": result.data[0]["id"]}


@router.post("/score")
async def save_score(
    data: ScoreCreate,
    user: TokenData = Depends(require_auth),
):
    """Save a comparison score."""
    supabase = get_supabase_client(user.access_token)
    result = (
        supabase.table("comparison_scores")
        .insert(
            {
                "user_id": user.user_id,
                "text": data.text,
                "score": data.score,
            }
        )
        .execute()
    )
    return {"success": True, "id": result.data[0]["id"]}


@router.get("", response_model=HistoryResponse)
async def get_history(
    user: TokenData = Depends(require_auth),
    limit: int = 50,
):
    """Get user's history (analyses + scores)."""
    supabase = get_supabase_client(user.access_token)

    analyses = (
        supabase.table("analysis_history")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )  # RLS filters by user automatically

    scores = (
        supabase.table("comparison_scores")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    return {
        "analyses": analyses.data,
        "scores": scores.data,
    }


@router.get("/stats")
async def get_stats(user: TokenData = Depends(require_auth)):
    """Get user statistics."""
    supabase = get_supabase_client(user.access_token)

    analysis_count = (
        supabase.table("analysis_history")
        .select("id", count="exact")
        .execute()
    )  # RLS filters by user

    scores = supabase.table("comparison_scores").select("score").execute()

    avg_score = (
        sum(s["score"] for s in scores.data) / len(scores.data) if scores.data else 0
    )

    return {
        "total_analyses": analysis_count.count,
        "total_comparisons": len(scores.data),
        "average_score": round(avg_score, 1),
    }
