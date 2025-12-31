"""Unit tests for storage service."""

import pytest

pytest.importorskip("boto3", reason="boto3 required for storage service")
pytest.importorskip("botocore", reason="botocore required for storage service")

from botocore.exceptions import ClientError

from app.services import storage as storage_service


class FakeBody:
    def __init__(self, data):
        self.data = data
        self.closed = False

    def read(self):
        return self.data

    def close(self):
        self.closed = True


class FakeClient:
    def __init__(self):
        self.put_calls = []
        self.delete_calls = []
        self.head_calls = 0

    def get_object(self, Bucket, Key):
        return {"Body": FakeBody(b"data")}

    def put_object(self, Bucket, Key, Body, ContentType):
        self.put_calls.append((Bucket, Key, ContentType))

    def delete_object(self, Bucket, Key):
        self.delete_calls.append((Bucket, Key))

    def head_bucket(self, Bucket):
        self.head_calls += 1

    def get_paginator(self, name):
        class Paginator:
            def paginate(self, Bucket, Prefix):
                return [
                    {"Contents": [{"Key": "tts/one.wav"}, {"Key": "tts/two.wav"}]},
                    {"Contents": []},
                ]
        return Paginator()


@pytest.fixture(autouse=True)
def reset_storage_state(monkeypatch):
    storage_service._s3_client = None
    storage_service._r2_stats_cache = {}
    monkeypatch.setattr(storage_service.settings, "r2_enabled", True)
    monkeypatch.setattr(storage_service.settings, "r2_bucket_name", "bucket")
    yield


def test_r2_get_returns_none_without_client(monkeypatch):
    monkeypatch.setattr(storage_service, "_get_s3_client", lambda: None)

    assert storage_service.r2_get("tts/test.wav") is None


def test_r2_get_reads_body(monkeypatch):
    monkeypatch.setattr(storage_service, "_get_s3_client", lambda: FakeClient())

    assert storage_service.r2_get("tts/test.wav") == b"data"


def test_r2_get_no_such_key(monkeypatch):
    class NoKeyClient:
        def get_object(self, Bucket, Key):
            raise ClientError({"Error": {"Code": "NoSuchKey"}}, "GetObject")

    monkeypatch.setattr(storage_service, "_get_s3_client", lambda: NoKeyClient())

    assert storage_service.r2_get("tts/missing.wav") is None


def test_r2_put_and_delete(monkeypatch):
    client = FakeClient()
    monkeypatch.setattr(storage_service, "_get_s3_client", lambda: client)

    assert storage_service.r2_put("tts/test.wav", b"data") is True
    assert storage_service.r2_delete("tts/test.wav") is True
    assert client.put_calls
    assert client.delete_calls


def test_r2_list_keys(monkeypatch):
    monkeypatch.setattr(storage_service, "_get_s3_client", lambda: FakeClient())

    keys = storage_service.r2_list_keys()

    assert keys == ["tts/one.wav", "tts/two.wav"]


def test_r2_get_stats_uses_cache(monkeypatch):
    calls = {"count": 0}

    def fake_compute():
        calls["count"] += 1
        return {"connected": True, "objects": 1, "size_mb": 1.0}

    monkeypatch.setattr(storage_service, "_compute_r2_stats", fake_compute)
    # Use time > TTL (300) so initial empty cache (timestamp=0) is considered expired
    monkeypatch.setattr(storage_service.time, "time", lambda: 1000)

    stats1 = storage_service.r2_get_stats()
    stats2 = storage_service.r2_get_stats()

    assert stats1 == stats2
    assert calls["count"] == 1


def test_r2_get_stats_refreshes_after_ttl(monkeypatch):
    calls = {"count": 0}

    def fake_compute():
        calls["count"] += 1
        return {"connected": True, "objects": 1, "size_mb": 1.0}

    monkeypatch.setattr(storage_service, "_compute_r2_stats", fake_compute)
    # First call at 1000: 1000 - 0 = 1000 > TTL (300), triggers compute
    monkeypatch.setattr(storage_service.time, "time", lambda: 1000)

    storage_service.r2_get_stats()

    # Second call at 1400: 1400 - 1000 = 400 > TTL (300), triggers compute again
    monkeypatch.setattr(storage_service.time, "time", lambda: 1400)
    storage_service.r2_get_stats()

    assert calls["count"] == 2


def test_r2_health_check(monkeypatch):
    client = FakeClient()
    monkeypatch.setattr(storage_service, "_get_s3_client", lambda: client)

    assert storage_service.r2_health_check() is True


def test_r2_health_check_failure(monkeypatch):
    class BadClient:
        def head_bucket(self, Bucket):
            raise RuntimeError("boom")

    monkeypatch.setattr(storage_service, "_get_s3_client", lambda: BadClient())

    assert storage_service.r2_health_check() is False
