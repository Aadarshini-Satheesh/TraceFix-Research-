import pytest
import time
from cache.lru_cache import TimedLRUCache

def test_lru_eviction():
    cache = TimedLRUCache(capacity=2)
    cache.set("a", 1, ttl_seconds=60)
    cache.set("b", 2, ttl_seconds=60)
    cache.set("c", 3, ttl_seconds=60)
    assert cache.get("a") is None
    assert cache.get("b") == 2
    assert cache.get("c") == 3

def test_cache_expiration():
    cache = TimedLRUCache(capacity=10)
    cache.set("temp", "expired", ttl_seconds=0.01)
    time.sleep(0.03)
    assert cache.get("temp") is None

def test_cache_miss_returns_default():
    cache = TimedLRUCache(capacity=5)
    assert cache.get("missing", "fallback") == "fallback"
