"""Unit tests for cache service."""

import pytest

pytest.importorskip("redis", reason="redis required for cache service")

from app.services import cache as cache_service


class FakeRedis:
    def __init__(self):
        self.store = {}
        self.setex_calls = []
        self.deleted = []
        self.scan_calls = 0

    def get(self, key):
        return self.store.get(key)

    def setex(self, key, ttl, data):
        self.setex_calls.append((key, ttl, data))
        self.store[key] = data

    def scan(self, cursor, match=None, count=100):
        self.scan_calls += 1
        if cursor == 0:
            return 0, [b"tts:one", b"tts:two"]
        return 0, []

    def delete(self, *keys):
        self.deleted.extend(keys)
        return len(keys)

    def ping(self):
        return True


@pytest.fixture(autouse=True)
def reset_cache_state(monkeypatch):
    cache_service._stats = cache_service.CacheStats()
    cache_service._redis_client = None
    monkeypatch.setattr(cache_service.settings, "redis_enabled", True)
    monkeypatch.setattr(cache_service.settings, "redis_ttl_seconds", 120)
    monkeypatch.setattr(cache_service.settings, "r2_enabled", False)
    yield


def test_get_cached_audio_redis_hit(monkeypatch):
    redis_client = FakeRedis()
    cache_key = cache_service._get_cache_key("text", "voice", "params")
    redis_client.store[cache_service._redis_key(cache_key)] = b"data"
    monkeypatch.setattr(cache_service, "_get_redis_client", lambda: redis_client)

    result = cache_service.get_cached_audio("text", "voice", "params")

    assert result == b"data"
    assert cache_service._stats.hits == 1
    assert cache_service._stats.redis_hits == 1


def test_get_cached_audio_r2_hit_promotes_redis(monkeypatch):
    redis_client = FakeRedis()
    monkeypatch.setattr(cache_service, "_get_redis_client", lambda: redis_client)
    monkeypatch.setattr(cache_service, "r2_get", lambda *_: b"r2")
    monkeypatch.setattr(cache_service.settings, "r2_enabled", True)

    result = cache_service.get_cached_audio("text", "voice", "params")

    assert result == b"r2"
    assert cache_service._stats.hits == 1
    assert cache_service._stats.r2_hits == 1
    assert len(redis_client.setex_calls) == 1


def test_get_cached_audio_miss_increments(monkeypatch):
    monkeypatch.setattr(cache_service, "_get_redis_client", lambda: None)
    monkeypatch.setattr(cache_service.settings, "r2_enabled", False)

    result = cache_service.get_cached_audio("text", "voice", "params")

    assert result is None
    assert cache_service._stats.misses == 1


def test_save_to_cache_writes_both_layers(monkeypatch):
    redis_client = FakeRedis()
    monkeypatch.setattr(cache_service, "_get_redis_client", lambda: redis_client)
    monkeypatch.setattr(cache_service, "r2_put", lambda *_: True)
    monkeypatch.setattr(cache_service.settings, "r2_enabled", True)

    cache_service.save_to_cache("text", "voice", "params", b"data")

    assert len(redis_client.setex_calls) == 1


def test_clear_cache_scans_and_resets_stats(monkeypatch):
    redis_client = FakeRedis()
    monkeypatch.setattr(cache_service, "_get_redis_client", lambda: redis_client)
    cache_service._stats.hits = 5
    cache_service._stats.misses = 2
    cache_service._stats.redis_hits = 3
    cache_service._stats.r2_hits = 1

    result = cache_service.clear_cache()

    assert result["redis_keys"] == 2
    assert cache_service._stats.hits == 0
    assert cache_service._stats.misses == 0
    assert cache_service._stats.redis_hits == 0
    assert cache_service._stats.r2_hits == 0


def test_get_cache_stats_includes_r2(monkeypatch):
    redis_client = FakeRedis()
    monkeypatch.setattr(cache_service, "_get_redis_client", lambda: redis_client)
    monkeypatch.setattr(cache_service.settings, "r2_enabled", True)
    monkeypatch.setattr(
        cache_service,
        "r2_get_stats",
        lambda: {"connected": True, "objects": 4, "size_mb": 1.0},
    )

    stats = cache_service.get_cache_stats()

    assert stats.redis_connected is True
    assert stats.r2_connected is True
    assert stats.r2_objects == 4
    assert stats.r2_size_mb == 1.0


def test_health_check_reports_layers(monkeypatch):
    monkeypatch.setattr(cache_service, "_get_redis_client", lambda: FakeRedis())
    monkeypatch.setattr(cache_service.settings, "r2_enabled", True)
    monkeypatch.setattr(cache_service, "r2_health_check", lambda: True)

    result = cache_service.health_check()

    assert result["redis"]["connected"] is True
    assert result["r2"]["connected"] is True
