"""API tests for analyze endpoint."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

pytest.importorskip("sudachipy", reason="sudachipy is required for analyze router")
pytest.importorskip("jaconv", reason="jaconv is required for analyze router")

from app.models.schemas import WordPitch
from app.routers import analyze as analyze_router


@pytest.fixture()
def client():
    app = FastAPI()
    app.include_router(analyze_router.router, prefix="/api")
    return TestClient(app)


def test_analyze_success(client, monkeypatch):
    def fake_analyze_text(text: str):
        return [
            WordPitch(
                surface="test",
                reading="test",
                accent_type=0,
                mora_count=1,
                morae=["te"],
                pitch_pattern=["L"],
                part_of_speech="noun",
                source="dictionary",
                confidence="high",
            )
        ]

    monkeypatch.setattr(analyze_router, "analyze_text", fake_analyze_text)

    response = client.post("/api/analyze", json={"text": "test"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["text"] == "test"
    assert len(payload["words"]) == 1
    assert payload["words"][0]["surface"] == "test"


def test_analyze_empty_text(client):
    response = client.post("/api/analyze", json={"text": "   "})

    assert response.status_code == 400
    assert response.json()["detail"] == "Text cannot be empty"


def test_analyze_missing_text(client):
    response = client.post("/api/analyze", json={})

    assert response.status_code == 422
