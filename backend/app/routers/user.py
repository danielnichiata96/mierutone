"""User profile and preferences endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client

from app.core.auth import require_auth, TokenData
from app.core.config import settings
from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/user", tags=["user"])

VALID_VOICES = ["female1", "female2", "female3", "female4", "male1", "male2", "male3"]


# ============================================================================
# Schemas
# ============================================================================


class ProfileResponse(BaseModel):
    """User profile data."""

    id: str
    display_name: str | None
    avatar_url: str | None
    email: str | None


class ProfileUpdate(BaseModel):
    """Profile update request."""

    display_name: str


class PreferencesResponse(BaseModel):
    """User preferences data."""

    default_voice: str
    playback_speed: float
    show_accent_numbers: bool
    show_part_of_speech: bool
    show_confidence: bool


class PreferencesUpdate(BaseModel):
    """Preferences update request."""

    default_voice: str | None = None
    playback_speed: float | None = None
    show_accent_numbers: bool | None = None
    show_part_of_speech: bool | None = None
    show_confidence: bool | None = None


# ============================================================================
# Profile Endpoints (BE-1)
# ============================================================================


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user: TokenData = Depends(require_auth)):
    """Get user profile."""
    supabase = get_supabase_client(user.access_token)
    result = (
        supabase.table("profiles").select("*").eq("id", user.user_id).single().execute()
    )

    if not result.data:
        # Profile doesn't exist (trigger didn't run) - create defaults with upsert to handle race
        defaults = {"id": user.user_id, "display_name": user.email, "avatar_url": None}
        supabase.table("profiles").upsert(defaults, on_conflict="id").execute()
        return {**defaults, "email": user.email}

    return {**result.data, "email": user.email}


@router.patch("/profile")
async def update_profile(data: ProfileUpdate, user: TokenData = Depends(require_auth)):
    """Update user profile."""
    supabase = get_supabase_client(user.access_token)
    supabase.table("profiles").update(
        {
            "display_name": data.display_name,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", user.user_id).execute()
    return {"success": True}


# ============================================================================
# Preferences Endpoints (BE-2)
# ============================================================================


@router.get("/preferences", response_model=PreferencesResponse)
async def get_preferences(user: TokenData = Depends(require_auth)):
    """Get user preferences."""
    supabase = get_supabase_client(user.access_token)
    result = (
        supabase.table("user_preferences")
        .select("*")
        .eq("id", user.user_id)
        .single()
        .execute()
    )

    if not result.data:
        # Preferences don't exist (trigger didn't run) - create defaults with upsert to handle race
        defaults = {
            "id": user.user_id,
            "default_voice": "female1",
            "playback_speed": 1.0,
            "show_accent_numbers": True,
            "show_part_of_speech": False,
            "show_confidence": True,
        }
        supabase.table("user_preferences").upsert(defaults, on_conflict="id").execute()
        return defaults

    return result.data


@router.patch("/preferences")
async def update_preferences(
    data: PreferencesUpdate, user: TokenData = Depends(require_auth)
):
    """Update user preferences."""
    supabase = get_supabase_client(user.access_token)
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if not update_data:
        return {"success": True}

    # Validate voice option
    if "default_voice" in update_data and update_data["default_voice"] not in VALID_VOICES:
        raise HTTPException(400, f"Invalid voice. Must be one of: {VALID_VOICES}")

    # Validate playback speed
    if "playback_speed" in update_data:
        speed = update_data["playback_speed"]
        if not (0.5 <= speed <= 1.5):
            raise HTTPException(400, "Playback speed must be between 0.5 and 1.5")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    supabase.table("user_preferences").update(update_data).eq(
        "id", user.user_id
    ).execute()
    return {"success": True}


# ============================================================================
# Account Management (BE-7)
# ============================================================================


@router.delete("/account")
async def delete_account(user: TokenData = Depends(require_auth)):
    """Delete user account and all associated data."""
    if not settings.supabase_service_role_key:
        raise HTTPException(500, "Service role key not configured")

    # Use service role client for admin operations
    admin_client = create_client(
        settings.supabase_url, settings.supabase_service_role_key
    )

    # CASCADE on FKs handles deleting related data automatically
    admin_client.auth.admin.delete_user(user.user_id)

    return {"success": True}
