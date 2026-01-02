"""User history endpoints for analyses and comparison scores."""

import base64
import csv
import io
import json
from datetime import datetime, timezone, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.auth import require_auth, TokenData
from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/history", tags=["history"])


# ============================================================================
# Schemas
# ============================================================================


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


class PaginatedResponse(BaseModel):
    """Response with cursor-based pagination."""

    items: list[dict]
    next_cursor: str | None
    has_more: bool


# ============================================================================
# Basic History Endpoints (existing)
# ============================================================================


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


# ============================================================================
# Paginated History (BE-3)
# ============================================================================


@router.get("/paginated", response_model=PaginatedResponse)
async def get_history_paginated(
    type: Literal["analysis", "comparison"],
    limit: int = Query(20, le=100),
    cursor: str | None = None,
    direction: Literal["next", "prev"] = "next",
    user: TokenData = Depends(require_auth),
):
    """Get paginated history with cursor-based pagination."""
    supabase = get_supabase_client(user.access_token)
    table = "analysis_history" if type == "analysis" else "comparison_scores"

    # Build base query - RLS handles user filtering
    query = supabase.table(table).select("*")

    if cursor:
        try:
            decoded = json.loads(base64.b64decode(cursor))
            cursor_ts = decoded["created_at"]
            cursor_id = decoded["id"]
        except Exception as e:
            raise HTTPException(400, f"Invalid cursor: {e}")

        if direction == "next":
            # Items older than cursor
            query = query.or_(
                f"created_at.lt.{cursor_ts},"
                f"and(created_at.eq.{cursor_ts},id.lt.{cursor_id})"
            )
        else:
            # Items newer than cursor
            query = query.or_(
                f"created_at.gt.{cursor_ts},"
                f"and(created_at.eq.{cursor_ts},id.gt.{cursor_id})"
            )

    # Order by (created_at, id) for stable pagination
    desc = direction == "next"
    query = query.order("created_at", desc=desc).order("id", desc=desc).limit(limit + 1)
    result = query.execute()

    items = result.data[:limit]
    has_more = len(result.data) > limit

    next_cursor = None
    if has_more and items:
        last = items[-1]
        next_cursor = base64.b64encode(
            json.dumps({"created_at": last["created_at"], "id": last["id"]}).encode()
        ).decode()

    return {"items": items, "next_cursor": next_cursor, "has_more": has_more}


# ============================================================================
# Stats (existing, improved)
# ============================================================================


def calculate_streak(activity_dates: list[datetime]) -> dict:
    """Calculate current streak and longest streak from activity dates.

    Args:
        activity_dates: List of datetime objects representing activity timestamps.

    Returns:
        Dict with current_streak, longest_streak, and last_activity_date.
    """
    if not activity_dates:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity_date": None,
            "is_active_today": False,
        }

    # Convert to dates only (no time) and get unique dates
    unique_dates = sorted(set(d.date() for d in activity_dates), reverse=True)

    if not unique_dates:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity_date": None,
            "is_active_today": False,
        }

    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)

    # Check if active today or yesterday (streak continues if active yesterday)
    most_recent = unique_dates[0]
    is_active_today = most_recent == today
    streak_starts = most_recent in (today, yesterday)

    # Calculate current streak
    current_streak = 0
    if streak_starts:
        current_streak = 1
        check_date = most_recent - timedelta(days=1)

        for date in unique_dates[1:]:
            if date == check_date:
                current_streak += 1
                check_date -= timedelta(days=1)
            elif date < check_date:
                break

    # Calculate longest streak (scan all dates)
    longest_streak = 0
    if unique_dates:
        streak = 1
        for i in range(1, len(unique_dates)):
            if unique_dates[i - 1] - unique_dates[i] == timedelta(days=1):
                streak += 1
            else:
                longest_streak = max(longest_streak, streak)
                streak = 1
        longest_streak = max(longest_streak, streak)

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_activity_date": most_recent.isoformat(),
        "is_active_today": is_active_today,
    }


@router.get("/stats")
async def get_stats(user: TokenData = Depends(require_auth)):
    """Get user statistics including streak info."""
    supabase = get_supabase_client(user.access_token)

    # Fetch analyses and scores with timestamps
    analyses = (
        supabase.table("analysis_history").select("id, text, created_at").execute()
    )
    scores = supabase.table("comparison_scores").select("score, text, created_at").execute()

    # Calculate basic stats
    avg_score = (
        sum(s["score"] for s in scores.data) / len(scores.data) if scores.data else None
    )

    unique_texts = len(
        {a["text"] for a in analyses.data} | {s["text"] for s in scores.data}
    )

    # Calculate streak from activity dates
    activity_dates = []
    for a in analyses.data:
        if a.get("created_at"):
            try:
                dt = datetime.fromisoformat(a["created_at"].replace("Z", "+00:00"))
                activity_dates.append(dt)
            except (ValueError, TypeError):
                pass

    for s in scores.data:
        if s.get("created_at"):
            try:
                dt = datetime.fromisoformat(s["created_at"].replace("Z", "+00:00"))
                activity_dates.append(dt)
            except (ValueError, TypeError):
                pass

    streak_info = calculate_streak(activity_dates)

    return {
        "total_analyses": len(analyses.data),
        "total_comparisons": len(scores.data),
        "avg_score": round(avg_score, 1) if avg_score else None,
        "unique_texts": unique_texts,
        "current_record_count": len(analyses.data) + len(scores.data),
        **streak_info,
    }


# ============================================================================
# Clear History (BE-3)
# ============================================================================


@router.delete("")
async def clear_history(user: TokenData = Depends(require_auth)):
    """Clear all user history."""
    supabase = get_supabase_client(user.access_token)

    # RLS ensures only user's own records are deleted
    # Supabase requires a filter for DELETE, use neq with impossible UUID
    supabase.table("analysis_history").delete().neq(
        "id", "00000000-0000-0000-0000-000000000000"
    ).execute()
    supabase.table("comparison_scores").delete().neq(
        "id", "00000000-0000-0000-0000-000000000000"
    ).execute()

    return {"success": True}


# ============================================================================
# Export Data (BE-8)
# ============================================================================


@router.post("/export")
async def export_data(
    format: Literal["json", "csv"] = "json",
    user: TokenData = Depends(require_auth),
):
    """Export user data in JSON or CSV format."""
    supabase = get_supabase_client(user.access_token)

    # RLS filters automatically by user
    analyses = supabase.table("analysis_history").select("*").limit(10000).execute()
    scores = supabase.table("comparison_scores").select("*").limit(10000).execute()
    profile = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user.user_id)
        .single()
        .execute()
    )

    if format == "json":
        return {
            "profile": profile.data,
            "analyses": analyses.data,
            "comparison_scores": scores.data,
            "exported_at": datetime.now(timezone.utc).isoformat(),
        }

    # CSV format - unified table with type column
    output = io.StringIO()

    rows = []
    for a in analyses.data:
        rows.append(
            {
                "type": "analysis",
                "id": a["id"],
                "text": a["text"],
                "value": a["word_count"],
                "created_at": a["created_at"],
            }
        )
    for s in scores.data:
        rows.append(
            {
                "type": "comparison",
                "id": s["id"],
                "text": s["text"],
                "value": s["score"],
                "created_at": s["created_at"],
            }
        )

    # Sort by date descending
    rows.sort(key=lambda x: x["created_at"], reverse=True)

    writer = csv.DictWriter(
        output, fieldnames=["type", "id", "text", "value", "created_at"]
    )
    writer.writeheader()
    writer.writerows(rows)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mierutone_export.csv"},
    )
