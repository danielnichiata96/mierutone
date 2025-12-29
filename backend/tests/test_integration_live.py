"""Live integration tests for external services.

Set RUN_INTEGRATION_TESTS=1 to enable these tests.
"""

import os
import sqlite3
import uuid

import pytest

from app.core.config import settings
from app.services import pitch_analyzer


def _should_run() -> bool:
    return os.getenv("RUN_INTEGRATION_TESTS") == "1"


def test_db_lookup_integration():
    if not _should_run():
        pytest.skip("RUN_INTEGRATION_TESTS != 1")
    if not pitch_analyzer.DB_PATH.exists():
        pytest.skip("pitch.db not found")

    conn = sqlite3.connect(pitch_analyzer.DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute(
            "SELECT surface, reading FROM pitch_accents "
            "WHERE surface IS NOT NULL AND surface != '' "
            "ORDER BY length(surface) ASC LIMIT 1"
        ).fetchone()
    finally:
        conn.close()

    if not row:
        pytest.skip("No pitch_accents rows found")

    result = pitch_analyzer.lookup_pitch(row["surface"], row["reading"] or "")

    assert result.accent_type is not None


def test_api_analyze_integration():
    if not _should_run():
        pytest.skip("RUN_INTEGRATION_TESTS != 1")
    if not pitch_analyzer.DB_PATH.exists():
        pytest.skip("pitch.db not found")

    pytest.importorskip("azure.cognitiveservices.speech", reason="Azure SDK required for app import")
    pytest.importorskip("parselmouth", reason="parselmouth required for app import")
    pytest.importorskip("fastdtw", reason="fastdtw required for app import")
    pytest.importorskip("numpy", reason="numpy required for app import")
    pytest.importorskip("scipy", reason="scipy required for app import")
    pytest.importorskip("sudachipy", reason="sudachipy required for app import")
    pytest.importorskip("jaconv", reason="jaconv required for app import")
    pytest.importorskip("redis", reason="redis required for app import")
    pytest.importorskip("boto3", reason="boto3 required for app import")

    from fastapi.testclient import TestClient
    from app.main import app

    conn = sqlite3.connect(pitch_analyzer.DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute(
            "SELECT surface FROM pitch_accents "
            "WHERE surface IS NOT NULL AND surface != '' "
            "ORDER BY length(surface) ASC LIMIT 1"
        ).fetchone()
    finally:
        conn.close()

    if not row:
        pytest.skip("No pitch_accents rows found")

    client = TestClient(app)
    response = client.post("/api/analyze", json={"text": row["surface"]})

    assert response.status_code == 200
    data = response.json()
    assert data["words"]
    assert any(word["source"].startswith("dictionary") for word in data["words"])


def test_redis_integration_set_get():
    if not _should_run():
        pytest.skip("RUN_INTEGRATION_TESTS != 1")

    redis = pytest.importorskip("redis", reason="redis required for integration test")

    if not settings.redis_enabled:
        pytest.skip("redis not enabled")

    try:
        client = redis.from_url(settings.redis_url, socket_connect_timeout=1, socket_timeout=1)
        client.ping()
    except Exception as exc:
        pytest.skip(f"redis not available: {exc}")

    key = f"integration:test:{uuid.uuid4()}"
    try:
        client.setex(key, 60, b"ping")
        assert client.get(key) == b"ping"
    finally:
        client.delete(key)


def test_r2_integration_put_get_delete():
    if not _should_run():
        pytest.skip("RUN_INTEGRATION_TESTS != 1")

    pytest.importorskip("boto3", reason="boto3 required for integration test")
    pytest.importorskip("botocore", reason="botocore required for integration test")

    if not settings.r2_enabled:
        pytest.skip("r2 not enabled")
    if not all([
        settings.r2_account_id,
        settings.r2_access_key_id,
        settings.r2_secret_access_key,
        settings.r2_bucket_name,
    ]):
        pytest.skip("r2 credentials not configured")

    from app.services import storage as storage_service

    key = f"tts/integration-{uuid.uuid4()}.wav"
    data = b"integration"

    try:
        assert storage_service.r2_put(key, data) is True
        assert storage_service.r2_get(key) == data
    finally:
        storage_service.r2_delete(key)
