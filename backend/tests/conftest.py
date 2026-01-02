"""Shared test fixtures for pytest."""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# Skip imports if dependencies not available
pytest.importorskip("azure.cognitiveservices.speech", reason="Azure SDK required for app import")
pytest.importorskip("parselmouth", reason="parselmouth required for app import")
pytest.importorskip("fastdtw", reason="fastdtw required for app import")
pytest.importorskip("numpy", reason="numpy required for app import")
pytest.importorskip("scipy", reason="scipy required for app import")
pytest.importorskip("sudachipy", reason="sudachipy required for app import")
pytest.importorskip("jaconv", reason="jaconv required for app import")
pytest.importorskip("redis", reason="redis required for app import")
pytest.importorskip("boto3", reason="boto3 required for app import")


@pytest.fixture
def mock_token_data():
    """Create mock TokenData for authenticated requests."""
    from app.core.auth import TokenData
    return TokenData(
        user_id="test-user-uuid-123",
        email="test@example.com",
        access_token="mock-jwt-token"
    )


@pytest.fixture
def mock_supabase_client():
    """Create a mock Supabase client."""
    mock = MagicMock()

    # Default returns for common operations
    mock.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {}
    mock.table.return_value.select.return_value.execute.return_value.data = []
    mock.table.return_value.insert.return_value.execute.return_value.data = [{"id": "new-id-123"}]
    mock.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
    mock.table.return_value.upsert.return_value.execute.return_value = MagicMock()
    mock.table.return_value.delete.return_value.neq.return_value.execute.return_value = MagicMock()
    mock.rpc.return_value.execute.return_value.data = {
        "total_analyses": 5,
        "total_comparisons": 3,
        "avg_score": 85.5,
        "unique_texts": 4,
        "current_record_count": 8
    }

    return mock


@pytest.fixture
def authenticated_client(mock_token_data, mock_supabase_client):
    """TestClient with mocked authentication and Supabase."""
    from app.main import app
    from app.core.auth import require_auth
    from app.core.supabase import get_supabase_client

    # Override authentication
    app.dependency_overrides[require_auth] = lambda: mock_token_data

    # Override Supabase client
    def _get_mock_supabase(*args, **kwargs):
        return mock_supabase_client

    with patch("app.routers.user.get_supabase_client", _get_mock_supabase):
        with patch("app.routers.history.get_supabase_client", _get_mock_supabase):
            with patch("app.routers.achievements.get_supabase_client", _get_mock_supabase):
                yield TestClient(app), mock_supabase_client

    # Clean up overrides
    app.dependency_overrides.clear()


@pytest.fixture
def unauthenticated_client():
    """TestClient without authentication."""
    from app.main import app
    # Ensure no auth overrides
    app.dependency_overrides.clear()
    return TestClient(app)
