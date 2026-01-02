"""Application configuration."""

import json
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings

# Get the backend directory (where .env is located)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

# Default CORS origins (used if CORS_ORIGINS env var is not set)
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://mierutone.com",
    "https://www.mierutone.com",
]


class Settings(BaseSettings):
    """Application settings."""

    app_name: str = "MieruTone API"
    app_version: str = "0.1.0"
    debug: bool = False

    # CORS - accepts JSON array or comma-separated string from env var
    cors_origins: list[str] = DEFAULT_CORS_ORIGINS

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from env var (JSON or comma-separated)."""
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return DEFAULT_CORS_ORIGINS
            # Try JSON first
            if v.startswith("["):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            # Fall back to comma-separated
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return DEFAULT_CORS_ORIGINS

    # API
    api_prefix: str = "/api"

    # Azure Speech AI (TTS)
    azure_speech_key: str = ""
    azure_speech_region: str = "eastus"

    # Redis Cache (hot)
    # redis_enabled defaults to False; set REDIS_ENABLED=true or provide REDIS_URL to enable
    redis_url: str = ""
    redis_enabled: bool = False
    redis_ttl_seconds: int = 86400  # 1 day in Redis

    # Cloudflare R2 (cold storage)
    r2_enabled: bool = False
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "mierutone-tts-cache"

    # Supabase (Auth + Database)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_jwt_public_key: str = ""
    supabase_service_role_key: str = ""  # For admin operations (delete account)

    class Config:
        env_file = BACKEND_DIR / ".env"
        extra = "ignore"


settings = Settings()
