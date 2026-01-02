"""Unit tests for streak calculation logic."""

import pytest
from datetime import datetime, timezone, timedelta

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

from app.routers.history import calculate_streak


def make_date(days_ago: int) -> datetime:
    """Create a datetime for N days ago at noon UTC."""
    return datetime.now(timezone.utc).replace(hour=12, minute=0, second=0, microsecond=0) - timedelta(days=days_ago)


class TestStreakCalculation:
    """Tests for the calculate_streak function."""

    def test_empty_dates_returns_zero_streak(self):
        """Empty input returns zero streak."""
        result = calculate_streak([])
        assert result["current_streak"] == 0
        assert result["longest_streak"] == 0
        assert result["last_activity_date"] is None
        assert result["is_active_today"] is False

    def test_single_day_today_returns_one_streak(self):
        """Single activity today returns streak of 1."""
        result = calculate_streak([make_date(0)])
        assert result["current_streak"] == 1
        assert result["longest_streak"] == 1
        assert result["is_active_today"] is True

    def test_single_day_yesterday_returns_one_streak(self):
        """Single activity yesterday returns streak of 1 (still active)."""
        result = calculate_streak([make_date(1)])
        assert result["current_streak"] == 1
        assert result["longest_streak"] == 1
        assert result["is_active_today"] is False

    def test_two_consecutive_days_returns_two_streak(self):
        """Activity today and yesterday returns streak of 2."""
        result = calculate_streak([make_date(0), make_date(1)])
        assert result["current_streak"] == 2
        assert result["longest_streak"] == 2

    def test_gap_in_days_breaks_streak(self):
        """Gap in activity breaks current streak."""
        # Active today and 3 days ago (gap of 2 days)
        result = calculate_streak([make_date(0), make_date(3)])
        assert result["current_streak"] == 1
        assert result["longest_streak"] == 1

    def test_old_activity_no_current_streak(self):
        """Activity from 2+ days ago has no current streak."""
        result = calculate_streak([make_date(3)])
        assert result["current_streak"] == 0
        assert result["longest_streak"] == 1
        assert result["is_active_today"] is False

    def test_longest_streak_in_past(self):
        """Longest streak can be in the past, not current."""
        # Current: 1 day (today), Past: 3 consecutive days
        dates = [
            make_date(0),  # Today
            # Gap
            make_date(5),  # 5 days ago
            make_date(6),  # 6 days ago
            make_date(7),  # 7 days ago
        ]
        result = calculate_streak(dates)
        assert result["current_streak"] == 1
        assert result["longest_streak"] == 3

    def test_multiple_activities_same_day_count_as_one(self):
        """Multiple activities on the same day count as one day."""
        today = datetime.now(timezone.utc)
        dates = [
            today.replace(hour=9),
            today.replace(hour=12),
            today.replace(hour=18),
        ]
        result = calculate_streak(dates)
        assert result["current_streak"] == 1
        assert result["longest_streak"] == 1

    def test_seven_day_streak(self):
        """Full week of activity returns 7-day streak."""
        dates = [make_date(i) for i in range(7)]
        result = calculate_streak(dates)
        assert result["current_streak"] == 7
        assert result["longest_streak"] == 7

    def test_streak_with_yesterday_as_most_recent(self):
        """Streak continues if most recent activity is yesterday."""
        # Yesterday and day before yesterday (2-day streak, still active)
        dates = [make_date(1), make_date(2)]
        result = calculate_streak(dates)
        assert result["current_streak"] == 2
        assert result["longest_streak"] == 2

    def test_unsorted_dates_still_work(self):
        """Dates don't need to be sorted on input."""
        dates = [make_date(2), make_date(0), make_date(1)]  # Out of order
        result = calculate_streak(dates)
        assert result["current_streak"] == 3
        assert result["longest_streak"] == 3

    def test_returns_last_activity_date(self):
        """Returns the most recent activity date."""
        dates = [make_date(1), make_date(2)]
        result = calculate_streak(dates)
        assert result["last_activity_date"] is not None
        # Should be yesterday's date
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).date()
        assert result["last_activity_date"] == yesterday.isoformat()
