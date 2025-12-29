"""Unit tests for main app endpoints."""

import pytest
from fastapi.testclient import TestClient

pytest.importorskip("azure.cognitiveservices.speech", reason="Azure SDK required for app import")
pytest.importorskip("parselmouth", reason="parselmouth required for app import")
pytest.importorskip("fastdtw", reason="fastdtw required for app import")
pytest.importorskip("numpy", reason="numpy required for app import")
pytest.importorskip("scipy", reason="scipy required for app import")
pytest.importorskip("sudachipy", reason="sudachipy required for app import")
pytest.importorskip("jaconv", reason="jaconv required for app import")
pytest.importorskip("redis", reason="redis required for app import")
pytest.importorskip("boto3", reason="boto3 required for app import")

from app.core.config import settings
from app.main import app


def test_root_endpoint():
    client = TestClient(app)

    response = client.get("/")

    assert response.status_code == 200
    payload = response.json()
    assert payload["name"] == settings.app_name
    assert payload["version"] == settings.app_version
    assert payload["docs"] == "/docs"


def test_health_endpoint():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "mierutone"}
