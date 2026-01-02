"""Deck and learning endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.auth import require_auth, optional_auth, TokenData
from app.core.supabase import get_supabase_client, get_public_supabase_client
from app.models.deck import (
    DeckSummary,
    DeckDetail,
    DeckListResponse,
    Card,
    ProgressUpdate,
)

router = APIRouter(prefix="/decks", tags=["decks"])


# ============================================================================
# List Decks
# ============================================================================


@router.get("", response_model=DeckListResponse)
async def list_decks(
    phase: int | None = Query(None, ge=1, le=4),
    user: TokenData | None = Depends(optional_auth),
):
    """List all decks with optional user progress."""
    supabase = get_public_supabase_client()

    # Fetch decks
    query = supabase.table("decks").select("*").order("sort_order")
    if phase:
        query = query.eq("phase", phase)

    result = query.execute()
    decks_data = result.data or []

    # Fetch user progress if authenticated
    user_progress = {}
    if user:
        auth_supabase = get_supabase_client(user.access_token)
        progress_result = (
            auth_supabase.table("user_deck_progress")
            .select("*")
            .execute()
        )
        for p in progress_result.data or []:
            user_progress[p["deck_id"]] = p

    # Build response
    decks = []
    total_cards = 0
    cards_learned = 0

    for d in decks_data:
        progress = user_progress.get(d["id"], {})
        cards_seen = progress.get("cards_seen", 0)
        cards_mastered = progress.get("cards_mastered", 0)
        card_count = d["card_count"]

        total_cards += card_count
        cards_learned += cards_mastered

        decks.append(
            DeckSummary(
                id=d["id"],
                slug=d["slug"],
                title=d["title"],
                title_ja=d.get("title_ja"),
                description=d.get("description"),
                phase=d["phase"],
                is_free=d["is_free"],
                card_count=card_count,
                cards_seen=cards_seen,
                cards_mastered=cards_mastered,
                is_started=cards_seen > 0,
                is_completed=progress.get("completed_at") is not None,
                progress_percent=int((cards_seen / card_count * 100) if card_count > 0 else 0),
            )
        )

    return DeckListResponse(
        decks=decks,
        total_cards=total_cards,
        cards_learned=cards_learned,
    )


# ============================================================================
# Get Deck Detail
# ============================================================================


@router.get("/{slug}", response_model=DeckDetail)
async def get_deck(
    slug: str,
    user: TokenData | None = Depends(optional_auth),
):
    """Get deck with all cards."""
    supabase = get_public_supabase_client()

    # Fetch deck
    deck_result = supabase.table("decks").select("*").eq("slug", slug).single().execute()

    if not deck_result.data:
        raise HTTPException(404, "Deck not found")

    deck = deck_result.data

    # Check access (Pro decks require auth + subscription)
    if not deck["is_free"]:
        if not user:
            raise HTTPException(401, "Sign in to access this deck")
        # TODO: Check if user is Pro (for now, allow all authenticated users)

    # Fetch cards
    cards_result = (
        supabase.table("cards")
        .select("*")
        .eq("deck_id", deck["id"])
        .order("sort_order")
        .execute()
    )

    cards = [
        Card(
            id=c["id"],
            word=c["word"],
            reading=c["reading"],
            meaning=c.get("meaning"),
            accent_position=c["accent_position"],
            accent_type=c["accent_type"],
            pitch_pattern=c["pitch_pattern"],
            audio_url=f"/api/tts?text={c['reading']}&voice=female1" if c["reading"] else None,
            pair_word=c.get("pair_word"),
            notes=c.get("notes"),
            sort_order=c["sort_order"],
        )
        for c in cards_result.data or []
    ]

    # Get user progress
    last_card_index = 0
    cards_seen = 0
    if user:
        auth_supabase = get_supabase_client(user.access_token)
        progress_result = (
            auth_supabase.table("user_deck_progress")
            .select("*")
            .eq("deck_id", deck["id"])
            .maybeSingle()
            .execute()
        )
        if progress_result.data:
            last_card_index = progress_result.data.get("last_card_index", 0)
            cards_seen = progress_result.data.get("cards_seen", 0)

    return DeckDetail(
        id=deck["id"],
        slug=deck["slug"],
        title=deck["title"],
        title_ja=deck.get("title_ja"),
        description=deck.get("description"),
        phase=deck["phase"],
        is_free=deck["is_free"],
        card_count=deck["card_count"],
        cards=cards,
        last_card_index=last_card_index,
        cards_seen=cards_seen,
    )


# ============================================================================
# Update Progress
# ============================================================================


@router.post("/{slug}/progress")
async def update_progress(
    slug: str,
    data: ProgressUpdate,
    user: TokenData = Depends(require_auth),
):
    """Update user's progress in a deck."""
    supabase = get_supabase_client(user.access_token)

    # Get deck ID
    deck_result = (
        get_public_supabase_client()
        .table("decks")
        .select("id, card_count")
        .eq("slug", slug)
        .single()
        .execute()
    )

    if not deck_result.data:
        raise HTTPException(404, "Deck not found")

    deck_id = deck_result.data["id"]
    card_count = deck_result.data["card_count"]

    # Check if progress exists
    existing = (
        supabase.table("user_deck_progress")
        .select("id, cards_seen, cards_mastered")
        .eq("deck_id", deck_id)
        .maybeSingle()
        .execute()
    )

    now = "now()"

    if existing.data:
        # Update existing progress
        update_data = {
            "last_card_index": data.card_index,
            "last_studied_at": now,
        }

        # Update cards_seen if this is a new card
        if data.seen and data.card_index >= existing.data["cards_seen"]:
            update_data["cards_seen"] = data.card_index + 1

        # Mark as mastered if applicable
        if data.mastered:
            update_data["cards_mastered"] = existing.data["cards_mastered"] + 1

        # Check if completed
        if update_data.get("cards_seen", existing.data["cards_seen"]) >= card_count:
            update_data["completed_at"] = now

        supabase.table("user_deck_progress").update(update_data).eq(
            "id", existing.data["id"]
        ).execute()

    else:
        # Create new progress
        insert_data = {
            "user_id": user.user_id,
            "deck_id": deck_id,
            "last_card_index": data.card_index,
            "cards_seen": 1 if data.seen else 0,
            "cards_mastered": 1 if data.mastered else 0,
            "last_studied_at": now,
        }

        supabase.table("user_deck_progress").insert(insert_data).execute()

    return {"success": True}


# ============================================================================
# Learning Stats
# ============================================================================


@router.get("/stats/summary")
async def get_learning_stats(user: TokenData = Depends(require_auth)):
    """Get user's overall learning statistics."""
    supabase = get_supabase_client(user.access_token)

    # Get all deck progress
    progress_result = supabase.table("user_deck_progress").select("*").execute()
    progress_data = progress_result.data or []

    # Calculate totals
    total_cards_seen = sum(p["cards_seen"] for p in progress_data)
    total_cards_mastered = sum(p["cards_mastered"] for p in progress_data)
    decks_started = len([p for p in progress_data if p["cards_seen"] > 0])
    decks_completed = len([p for p in progress_data if p.get("completed_at")])

    # Get cards due for review (SRS) - simplified for now
    # TODO: Implement full SRS query
    cards_due_result = (
        supabase.table("user_card_progress")
        .select("id")
        .lte("next_review_at", "now()")
        .execute()
    )
    cards_due = len(cards_due_result.data or [])

    return {
        "total_cards_seen": total_cards_seen,
        "total_cards_mastered": total_cards_mastered,
        "decks_started": decks_started,
        "decks_completed": decks_completed,
        "cards_due_today": cards_due,
    }
