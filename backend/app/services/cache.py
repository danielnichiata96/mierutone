"""TTS Cache Service - Redis (hot) + Cloudflare R2 (cold) architecture.

Cache flow:
- READ:  Redis → R2 → Miss (generate)
- WRITE: Redis + R2 (parallel)

Redis: Fast, volatile, 1-day TTL
R2: Permanent, cheap, unlimited scale
"""

import hashlib
import logging
import threading
from dataclasses import dataclass
from typing import Optional

import redis

from app.core.config import settings
from app.services.storage import r2_get, r2_put, r2_get_stats, r2_health_check

logger = logging.getLogger(__name__)


@dataclass
class CacheStats:
    """Cache statistics."""
    hits: int = 0
    misses: int = 0
    redis_hits: int = 0
    r2_hits: int = 0
    redis_connected: bool = False
    r2_connected: bool = False
    r2_objects: int = 0
    r2_size_mb: float = 0.0


# Global stats (thread-safe access via lock)
_stats = CacheStats()
_stats_lock = threading.Lock()

# Redis client (lazy initialization)
_redis_client: Optional[redis.Redis] = None


def _get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client with lazy initialization."""
    global _redis_client

    if not settings.redis_enabled:
        return None

    if _redis_client is not None:
        return _redis_client

    try:
        _redis_client = redis.from_url(
            settings.redis_url,
            decode_responses=False,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        _redis_client.ping()
        logger.info("Redis connected")
        return _redis_client
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}")
        _redis_client = None
        return None


def _get_cache_key(text: str, voice: str, params: str) -> str:
    """Generate cache key from TTS parameters."""
    content = f"{text}|{voice}|{params}"
    return hashlib.sha256(content.encode()).hexdigest()[:16]


def _redis_key(cache_key: str) -> str:
    """Redis key format."""
    return f"tts:{cache_key}"


def _r2_key(cache_key: str) -> str:
    """R2 object key format."""
    return f"tts/{cache_key}.wav"


def get_cached_audio(text: str, voice: str, params: str) -> Optional[bytes]:
    """Get audio from cache (Redis → R2 → None).

    Args:
        text: The text that was synthesized.
        voice: Voice name used.
        params: TTS parameters string (e.g., "1.00_0.0_0.0" for rate_pitch_volume).

    Returns:
        Audio bytes if cached, None otherwise.
    """
    cache_key = _get_cache_key(text, voice, params)

    # 1. Try Redis (hot cache)
    redis_client = _get_redis_client()
    if redis_client:
        try:
            data = redis_client.get(_redis_key(cache_key))
            if data:
                with _stats_lock:
                    _stats.hits += 1
                    _stats.redis_hits += 1
                return data
        except redis.RedisError as e:
            logger.warning(f"Redis get failed: {e}")

    # 2. Try R2 (cold storage)
    if settings.r2_enabled:
        data = r2_get(_r2_key(cache_key))
        if data:
            with _stats_lock:
                _stats.hits += 1
                _stats.r2_hits += 1

            # Promote to Redis for faster future access
            if redis_client:
                try:
                    redis_client.setex(
                        _redis_key(cache_key),
                        settings.redis_ttl_seconds,
                        data
                    )
                except redis.RedisError:
                    pass

            return data

    # 3. Cache miss
    with _stats_lock:
        _stats.misses += 1
    return None


def save_to_cache(text: str, voice: str, params: str, audio_data: bytes) -> None:
    """Save audio to cache (Redis + R2).

    Args:
        text: The text that was synthesized.
        voice: Voice name used.
        params: TTS parameters string (e.g., "1.00_0.0_0.0" for rate_pitch_volume).
        audio_data: WAV audio bytes to cache.
    """
    cache_key = _get_cache_key(text, voice, params)

    # Save to Redis (hot)
    redis_client = _get_redis_client()
    if redis_client:
        try:
            redis_client.setex(
                _redis_key(cache_key),
                settings.redis_ttl_seconds,
                audio_data
            )
        except redis.RedisError as e:
            logger.warning(f"Redis set failed: {e}")

    # Save to R2 (cold - permanent)
    if settings.r2_enabled:
        r2_put(_r2_key(cache_key), audio_data)


def get_cache_stats() -> CacheStats:
    """Get cache statistics."""
    # Redis status
    redis_client = _get_redis_client()
    redis_connected = redis_client is not None

    # R2 status (uses TTL cache internally)
    if settings.r2_enabled:
        r2_stats = r2_get_stats()
        r2_connected = r2_stats.get("connected", False)
        r2_objects = r2_stats.get("objects", 0)
        r2_size_mb = r2_stats.get("size_mb", 0.0)
    else:
        r2_connected = False
        r2_objects = 0
        r2_size_mb = 0.0

    with _stats_lock:
        _stats.redis_connected = redis_connected
        _stats.r2_connected = r2_connected
        _stats.r2_objects = r2_objects
        _stats.r2_size_mb = r2_size_mb
        # Return a copy to avoid race conditions
        return CacheStats(
            hits=_stats.hits,
            misses=_stats.misses,
            redis_hits=_stats.redis_hits,
            r2_hits=_stats.r2_hits,
            redis_connected=_stats.redis_connected,
            r2_connected=_stats.r2_connected,
            r2_objects=_stats.r2_objects,
            r2_size_mb=_stats.r2_size_mb,
        )


def clear_cache() -> dict:
    """Clear Redis cache only (R2 is permanent storage).

    Uses SCAN instead of KEYS to avoid blocking Redis.

    Returns:
        Dict with counts of deleted items.
    """
    global _stats
    result = {"redis_keys": 0}

    redis_client = _get_redis_client()
    if redis_client:
        try:
            # Use SCAN iterator to avoid blocking Redis
            deleted = 0
            cursor = 0
            while True:
                cursor, keys = redis_client.scan(cursor, match="tts:*", count=100)
                if keys:
                    deleted += redis_client.delete(*keys)
                if cursor == 0:
                    break
            result["redis_keys"] = deleted
        except redis.RedisError as e:
            logger.warning(f"Redis clear failed: {e}")

    # Reset stats (thread-safe)
    with _stats_lock:
        _stats.hits = 0
        _stats.misses = 0
        _stats.redis_hits = 0
        _stats.r2_hits = 0
    return result


def health_check() -> dict:
    """Check health of all cache layers."""
    redis_ok = _get_redis_client() is not None
    r2_ok = r2_health_check() if settings.r2_enabled else None

    return {
        "redis": {
            "enabled": settings.redis_enabled,
            "connected": redis_ok,
        },
        "r2": {
            "enabled": settings.r2_enabled,
            "connected": r2_ok,
        },
    }
