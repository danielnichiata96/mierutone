"""Cloudflare R2 storage service for permanent TTS cache."""

import logging
import time
import threading
from typing import Optional
from io import BytesIO

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError, NoCredentialsError

from app.core.config import settings

logger = logging.getLogger(__name__)

# Lazy-initialized S3 client
_s3_client = None

# Cached R2 stats (expensive to compute - lists entire bucket)
_r2_stats_cache: dict = {}
_r2_stats_lock = threading.Lock()
R2_STATS_TTL_SECONDS = 300  # 5 minutes


def _get_s3_client():
    """Get S3 client configured for Cloudflare R2."""
    global _s3_client

    if not settings.r2_enabled:
        return None

    if _s3_client is not None:
        return _s3_client

    if not all([settings.r2_account_id, settings.r2_access_key_id, settings.r2_secret_access_key]):
        logger.warning("R2 credentials not configured")
        return None

    try:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=Config(
                signature_version="s3v4",
                retries={"max_attempts": 3, "mode": "adaptive"},
            ),
        )
        logger.info("R2 client initialized successfully")
        return _s3_client
    except Exception as e:
        logger.error(f"Failed to initialize R2 client: {e}")
        return None


def r2_get(key: str) -> Optional[bytes]:
    """Get object from R2 bucket.

    Args:
        key: Object key (e.g., "tts/abc123.wav")

    Returns:
        Object bytes if found, None otherwise.
    """
    client = _get_s3_client()
    if not client:
        return None

    try:
        response = client.get_object(Bucket=settings.r2_bucket_name, Key=key)
        body = response["Body"]
        try:
            return body.read()
        finally:
            body.close()
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        if error_code == "NoSuchKey":
            return None
        logger.warning(f"R2 get failed for {key}: {e}")
        return None
    except Exception as e:
        logger.warning(f"R2 get error: {e}")
        return None


def r2_put(key: str, data: bytes, content_type: str = "audio/wav") -> bool:
    """Put object to R2 bucket.

    Args:
        key: Object key (e.g., "tts/abc123.wav")
        data: Object bytes.
        content_type: MIME type.

    Returns:
        True if successful, False otherwise.
    """
    client = _get_s3_client()
    if not client:
        return False

    try:
        client.put_object(
            Bucket=settings.r2_bucket_name,
            Key=key,
            Body=BytesIO(data),
            ContentType=content_type,
        )
        return True
    except ClientError as e:
        logger.warning(f"R2 put failed for {key}: {e}")
        return False
    except Exception as e:
        logger.warning(f"R2 put error: {e}")
        return False


def r2_delete(key: str) -> bool:
    """Delete object from R2 bucket.

    Args:
        key: Object key.

    Returns:
        True if successful, False otherwise.
    """
    client = _get_s3_client()
    if not client:
        return False

    try:
        client.delete_object(Bucket=settings.r2_bucket_name, Key=key)
        return True
    except Exception as e:
        logger.warning(f"R2 delete error: {e}")
        return False


def r2_list_keys(prefix: str = "tts/") -> list[str]:
    """List all keys with given prefix.

    Args:
        prefix: Key prefix to filter.

    Returns:
        List of object keys.
    """
    client = _get_s3_client()
    if not client:
        return []

    try:
        keys = []
        paginator = client.get_paginator("list_objects_v2")

        for page in paginator.paginate(Bucket=settings.r2_bucket_name, Prefix=prefix):
            for obj in page.get("Contents", []):
                keys.append(obj["Key"])

        return keys
    except Exception as e:
        logger.warning(f"R2 list error: {e}")
        return []


def _compute_r2_stats() -> dict:
    """Actually compute R2 stats by listing bucket (expensive)."""
    client = _get_s3_client()
    if not client:
        return {"connected": False, "objects": 0, "size_mb": 0}

    try:
        total_size = 0
        total_count = 0
        paginator = client.get_paginator("list_objects_v2")

        for page in paginator.paginate(Bucket=settings.r2_bucket_name, Prefix="tts/"):
            for obj in page.get("Contents", []):
                total_count += 1
                total_size += obj.get("Size", 0)

        return {
            "connected": True,
            "objects": total_count,
            "size_mb": round(total_size / (1024 * 1024), 2),
        }
    except Exception as e:
        logger.warning(f"R2 stats error: {e}")
        return {"connected": False, "objects": 0, "size_mb": 0, "error": str(e)}


def r2_get_stats() -> dict:
    """Get R2 bucket statistics with TTL caching.

    Caches results for 5 minutes to avoid expensive bucket listing on every call.

    Returns:
        Dict with object count and total size.
    """
    global _r2_stats_cache

    with _r2_stats_lock:
        cached_at = _r2_stats_cache.get("timestamp", 0)
        if time.time() - cached_at < R2_STATS_TTL_SECONDS:
            return _r2_stats_cache.get("stats", {"connected": False, "objects": 0, "size_mb": 0})

    # Compute outside lock to avoid blocking other threads
    stats = _compute_r2_stats()

    with _r2_stats_lock:
        _r2_stats_cache = {"stats": stats, "timestamp": time.time()}

    return stats


def r2_health_check() -> bool:
    """Check if R2 is accessible."""
    client = _get_s3_client()
    if not client:
        return False

    try:
        client.head_bucket(Bucket=settings.r2_bucket_name)
        return True
    except Exception:
        return False
