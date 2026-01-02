"""Supabase client for database operations."""

from supabase import create_client, Client

from app.core.config import settings


def get_supabase_client(access_token: str | None = None) -> Client:
    """Create Supabase client. Pass access_token for RLS-protected operations.

    Uses anon key + user JWT. RLS policies enforce access control.
    Backend validates JWT separately (auth.py), then passes token to Supabase for RLS.
    """
    client = create_client(settings.supabase_url, settings.supabase_anon_key)

    if access_token:
        # Set Authorization header for PostgREST (enables RLS)
        client.postgrest.auth(access_token)

    return client


def get_public_supabase_client() -> Client:
    """Create Supabase client for public (anonymous) access.

    Use this for reading public content like decks and cards.
    RLS policies should allow SELECT for anonymous users on these tables.
    """
    return create_client(settings.supabase_url, settings.supabase_anon_key)
