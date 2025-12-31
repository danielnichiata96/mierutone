"""User achievements endpoints."""

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import require_auth, TokenData
from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("")
async def get_achievements(user: TokenData = Depends(require_auth)):
    """Get user achievements."""
    supabase = get_supabase_client(user.access_token)
    result = supabase.table("user_achievements").select("*").execute()  # RLS filters
    return {"achievements": result.data}


@router.post("/check")
async def check_achievements(user: TokenData = Depends(require_auth)):
    """Check and award new achievements based on current stats."""
    supabase = get_supabase_client(user.access_token)

    # Get current stats via RPC
    try:
        stats_result = supabase.rpc("get_user_stats").execute()
        if not stats_result.data:
            raise HTTPException(500, "Failed to fetch user stats")
        stats = stats_result.data
    except Exception as e:
        raise HTTPException(500, f"Stats RPC failed: {e}")

    # Get existing achievements (RLS filters by user)
    existing = supabase.table("user_achievements").select("achievement_type").execute()
    existing_types = {a["achievement_type"] for a in existing.data}

    # Check for new achievements
    new_achievements = []

    # Analysis milestones
    total_analyses = stats.get("total_analyses", 0)
    if total_analyses >= 1 and "first_analysis" not in existing_types:
        new_achievements.append("first_analysis")
    if total_analyses >= 10 and "10_analyses" not in existing_types:
        new_achievements.append("10_analyses")
    if total_analyses >= 100 and "100_analyses" not in existing_types:
        new_achievements.append("100_analyses")

    # Comparison milestones
    total_comparisons = stats.get("total_comparisons", 0)
    if total_comparisons >= 1 and "first_comparison" not in existing_types:
        new_achievements.append("first_comparison")

    # High score achievement
    if "score_90" not in existing_types:
        max_score = (
            supabase.table("comparison_scores")
            .select("score")
            .order("score", desc=True)
            .limit(1)
            .execute()
        )
        if max_score.data and max_score.data[0]["score"] >= 90:
            new_achievements.append("score_90")

    # Insert new achievements (upsert to handle concurrent calls)
    for achievement in new_achievements:
        supabase.table("user_achievements").upsert(
            {"user_id": user.user_id, "achievement_type": achievement},
            on_conflict="user_id,achievement_type",
        ).execute()

    return {"new_achievements": new_achievements}
