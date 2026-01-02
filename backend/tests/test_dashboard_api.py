"""Unit tests for dashboard API endpoints (TEST-1).

Tests cover:
- User profile and preferences (BE-1, BE-2)
- History (paginated, stats, export) (BE-3, BE-8)
- Achievements (BE-6)
- Account management (BE-7)
"""

import base64
import json
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# Skip if dependencies not available
pytest.importorskip("azure.cognitiveservices.speech", reason="Azure SDK required for app import")
pytest.importorskip("parselmouth", reason="parselmouth required for app import")
pytest.importorskip("fastdtw", reason="fastdtw required for app import")
pytest.importorskip("numpy", reason="numpy required for app import")
pytest.importorskip("scipy", reason="scipy required for app import")
pytest.importorskip("sudachipy", reason="sudachipy required for app import")
pytest.importorskip("jaconv", reason="jaconv required for app import")
pytest.importorskip("redis", reason="redis required for app import")
pytest.importorskip("boto3", reason="boto3 required for app import")

from app.main import app
from app.core.auth import require_auth, TokenData


# ============================================================================
# Helper to create test fixtures
# ============================================================================

def create_mock_token_data():
    """Create mock TokenData for authenticated requests."""
    return TokenData(
        user_id="test-user-uuid-123",
        email="test@example.com",
        access_token="mock-jwt-token"
    )


def create_mock_supabase():
    """Create a mock Supabase client with chainable methods."""
    mock = MagicMock()

    # Make table() chainable
    table_mock = MagicMock()
    mock.table.return_value = table_mock

    # select().eq().single().execute() chain
    select_mock = MagicMock()
    table_mock.select.return_value = select_mock
    eq_mock = MagicMock()
    select_mock.eq.return_value = eq_mock
    single_mock = MagicMock()
    eq_mock.single.return_value = single_mock
    single_mock.execute.return_value.data = None

    # select().order().limit().execute() chain
    order_mock = MagicMock()
    select_mock.order.return_value = order_mock
    order_mock.order.return_value = order_mock  # Allow chaining order calls
    limit_mock = MagicMock()
    order_mock.limit.return_value = limit_mock
    limit_mock.execute.return_value.data = []

    # select().execute() direct
    select_mock.execute.return_value.data = []

    # insert/update/upsert/delete chains
    table_mock.insert.return_value.execute.return_value.data = [{"id": "new-id"}]
    table_mock.update.return_value.eq.return_value.execute.return_value = MagicMock()
    table_mock.upsert.return_value.execute.return_value = MagicMock()
    table_mock.delete.return_value.neq.return_value.execute.return_value = MagicMock()

    # RPC
    mock.rpc.return_value.execute.return_value.data = {
        "total_analyses": 5,
        "total_comparisons": 3,
        "avg_score": 85.5,
        "unique_texts": 4,
        "current_record_count": 8
    }

    return mock


# ============================================================================
# User Profile Tests (BE-1)
# ============================================================================


class TestGetProfile:
    """Tests for GET /api/user/profile."""

    def test_get_profile_unauthorized(self):
        """Returns 401 when not authenticated."""
        app.dependency_overrides.clear()
        client = TestClient(app)
        response = client.get("/api/user/profile")
        assert response.status_code == 401

    def test_get_profile_returns_data(self):
        """Returns profile data when authenticated."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        # Set up mock to return profile data
        profile_data = {
            "id": "test-user-uuid-123",
            "display_name": "Test User",
            "avatar_url": "https://example.com/avatar.png"
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = profile_data

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.user.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.get("/api/user/profile")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Test User"
        assert data["email"] == "test@example.com"

    def test_get_profile_creates_default_if_missing(self):
        """Creates default profile if none exists."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        # Profile doesn't exist
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.user.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.get("/api/user/profile")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        # Should have called upsert to create default
        mock_supabase.table.return_value.upsert.assert_called()


class TestUpdateProfile:
    """Tests for PATCH /api/user/profile."""

    def test_update_profile_unauthorized(self):
        """Returns 401 when not authenticated."""
        app.dependency_overrides.clear()
        client = TestClient(app)
        response = client.patch("/api/user/profile", json={"display_name": "New Name"})
        assert response.status_code == 401

    def test_update_profile_success(self):
        """Successfully updates profile."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.user.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.patch("/api/user/profile", json={"display_name": "New Name"})

        app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["success"] is True


# ============================================================================
# User Preferences Tests (BE-2)
# ============================================================================


class TestGetPreferences:
    """Tests for GET /api/user/preferences."""

    def test_get_preferences_unauthorized(self):
        """Returns 401 when not authenticated."""
        app.dependency_overrides.clear()
        client = TestClient(app)
        response = client.get("/api/user/preferences")
        assert response.status_code == 401

    def test_get_preferences_returns_data(self):
        """Returns preferences data when authenticated."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        prefs_data = {
            "default_voice": "female1",
            "playback_speed": 1.0,
            "show_accent_numbers": True,
            "show_part_of_speech": False,
            "show_confidence": True
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = prefs_data

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.user.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.get("/api/user/preferences")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["default_voice"] == "female1"
        assert data["playback_speed"] == 1.0


class TestUpdatePreferences:
    """Tests for PATCH /api/user/preferences."""

    def test_update_preferences_unauthorized(self):
        """Returns 401 when not authenticated."""
        app.dependency_overrides.clear()
        client = TestClient(app)
        response = client.patch("/api/user/preferences", json={"default_voice": "male1"})
        assert response.status_code == 401

    def test_update_preferences_invalid_voice(self):
        """Returns 400 for invalid voice option."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.user.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.patch("/api/user/preferences", json={"default_voice": "invalid_voice"})

        app.dependency_overrides.clear()

        assert response.status_code == 400
        assert "Invalid voice" in response.json()["detail"]

    def test_update_preferences_invalid_speed(self):
        """Returns 400 for playback speed out of range."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.user.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.patch("/api/user/preferences", json={"playback_speed": 2.5})

        app.dependency_overrides.clear()

        assert response.status_code == 400
        assert "Playback speed" in response.json()["detail"]

    def test_update_preferences_valid(self):
        """Successfully updates preferences."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.user.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.patch("/api/user/preferences", json={
                "default_voice": "male1",
                "playback_speed": 1.2,
                "show_accent_numbers": False
            })

        app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["success"] is True


# ============================================================================
# History Tests (BE-3)
# ============================================================================


class TestGetHistoryPaginated:
    """Tests for GET /api/history/paginated."""

    def test_get_history_paginated_unauthorized(self):
        """Returns 401 when not authenticated."""
        app.dependency_overrides.clear()
        client = TestClient(app)
        response = client.get("/api/history/paginated?type=analysis")
        assert response.status_code == 401

    def test_get_history_paginated_missing_type(self):
        """Returns 422 when type parameter is missing."""
        mock_token = create_mock_token_data()
        app.dependency_overrides[require_auth] = lambda: mock_token

        client = TestClient(app)
        response = client.get("/api/history/paginated")

        app.dependency_overrides.clear()

        assert response.status_code == 422

    def test_get_history_paginated_valid(self):
        """Returns paginated history data."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        items = [
            {"id": "1", "text": "東京", "created_at": "2024-01-01T00:00:00Z", "word_count": 1},
            {"id": "2", "text": "大阪", "created_at": "2024-01-02T00:00:00Z", "word_count": 1}
        ]
        mock_supabase.table.return_value.select.return_value.order.return_value.order.return_value.limit.return_value.execute.return_value.data = items

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.history.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.get("/api/history/paginated?type=analysis&limit=10")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "next_cursor" in data
        assert "has_more" in data

    def test_get_history_paginated_invalid_cursor(self):
        """Returns 400 for invalid cursor."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.history.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.get("/api/history/paginated?type=analysis&cursor=invalid")

        app.dependency_overrides.clear()

        assert response.status_code == 400
        assert "Invalid cursor" in response.json()["detail"]

    def test_get_history_paginated_with_valid_cursor(self):
        """Handles valid cursor correctly."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        # Create a valid cursor
        cursor_data = {"created_at": "2024-01-01T00:00:00Z", "id": "test-id"}
        valid_cursor = base64.b64encode(json.dumps(cursor_data).encode()).decode()

        mock_supabase.table.return_value.select.return_value.or_.return_value.order.return_value.order.return_value.limit.return_value.execute.return_value.data = []

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.history.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.get(f"/api/history/paginated?type=analysis&cursor={valid_cursor}")

        app.dependency_overrides.clear()

        assert response.status_code == 200


class TestGetHistoryStats:
    """Tests for GET /api/history/stats."""

    def test_get_stats_unauthorized(self):
        """Returns 401 when not authenticated."""
        app.dependency_overrides.clear()
        client = TestClient(app)
        response = client.get("/api/history/stats")
        assert response.status_code == 401

    def test_get_stats_returns_data(self):
        """Returns user statistics."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.history.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.get("/api/history/stats")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert "total_analyses" in data
        assert "total_comparisons" in data


class TestClearHistory:
    """Tests for DELETE /api/history."""

    def test_clear_history_unauthorized(self):
        """Returns 401 when not authenticated."""
        app.dependency_overrides.clear()
        client = TestClient(app)
        response = client.delete("/api/history")
        assert response.status_code == 401

    def test_clear_history_success(self):
        """Successfully clears history."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.history.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.delete("/api/history")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["success"] is True


class TestExportData:
    """Tests for POST /api/history/export."""

    def test_export_unauthorized(self):
        """Returns 401 when not authenticated."""
        app.dependency_overrides.clear()
        client = TestClient(app)
        response = client.post("/api/history/export")
        assert response.status_code == 401

    def test_export_json(self):
        """Exports data as JSON."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "id": "test-user",
            "display_name": "Test"
        }

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.history.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.post("/api/history/export?format=json")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert "profile" in data
        assert "analyses" in data
        assert "comparison_scores" in data
        assert "exported_at" in data

    def test_export_csv(self):
        """Exports data as CSV."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "id": "test-user",
            "display_name": "Test"
        }

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.history.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.post("/api/history/export?format=csv")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]
        assert "attachment" in response.headers["content-disposition"]


# ============================================================================
# Achievements Tests (BE-6)
# ============================================================================


class TestGetAchievements:
    """Tests for GET /api/achievements."""

    def test_get_achievements_unauthorized(self):
        """Returns 401 when not authenticated."""
        app.dependency_overrides.clear()
        client = TestClient(app)
        response = client.get("/api/achievements")
        assert response.status_code == 401

    def test_get_achievements_returns_data(self):
        """Returns user achievements."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        achievements = [
            {"id": "1", "achievement_type": "first_analysis", "achieved_at": "2024-01-01T00:00:00Z"}
        ]
        mock_supabase.table.return_value.select.return_value.execute.return_value.data = achievements

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.achievements.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.get("/api/achievements")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data


class TestCheckAchievements:
    """Tests for POST /api/achievements/check."""

    def test_check_achievements_unauthorized(self):
        """Returns 401 when not authenticated."""
        app.dependency_overrides.clear()
        client = TestClient(app)
        response = client.post("/api/achievements/check")
        assert response.status_code == 401

    def test_check_achievements_first_analysis(self):
        """Awards first_analysis achievement."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        # Stats show 1 analysis
        mock_supabase.rpc.return_value.execute.return_value.data = {
            "total_analyses": 1,
            "total_comparisons": 0,
            "avg_score": None,
            "unique_texts": 1,
            "current_record_count": 1
        }

        # No existing achievements
        mock_supabase.table.return_value.select.return_value.execute.return_value.data = []

        # High score check returns empty
        mock_supabase.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value.data = []

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.achievements.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.post("/api/achievements/check")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert "new_achievements" in data
        assert "first_analysis" in data["new_achievements"]

    def test_check_achievements_no_duplicates(self):
        """Does not award already-earned achievements."""
        mock_token = create_mock_token_data()
        mock_supabase = create_mock_supabase()

        # Stats show 1 analysis
        mock_supabase.rpc.return_value.execute.return_value.data = {
            "total_analyses": 1,
            "total_comparisons": 0,
            "avg_score": None,
            "unique_texts": 1,
            "current_record_count": 1
        }

        # Already have first_analysis
        mock_supabase.table.return_value.select.return_value.execute.return_value.data = [
            {"achievement_type": "first_analysis"}
        ]

        mock_supabase.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value.data = []

        app.dependency_overrides[require_auth] = lambda: mock_token

        with patch("app.routers.achievements.get_supabase_client", return_value=mock_supabase):
            client = TestClient(app)
            response = client.post("/api/achievements/check")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert "first_analysis" not in data["new_achievements"]
