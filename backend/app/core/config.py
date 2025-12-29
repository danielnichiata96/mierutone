"""Application configuration."""

from pathlib import Path

from pydantic_settings import BaseSettings

# Get the backend directory (where .env is located)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application settings."""

    app_name: str = "MieruTone API"
    app_version: str = "0.1.0"
    debug: bool = False

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://mierutone.com",
        "https://www.mierutone.com",
    ]

    # API
    api_prefix: str = "/api"

    # Azure Speech AI (TTS)
    azure_speech_key: str = ""
    azure_speech_region: str = "eastus"

    # Redis Cache (hot)
    redis_url: str = "redis://localhost:6379"
    redis_enabled: bool = True
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

    class Config:
        env_file = BACKEND_DIR / ".env"
        extra = "ignore"


settings = Settings()
