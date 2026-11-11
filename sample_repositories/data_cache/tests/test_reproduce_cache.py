import pytest
from cache.lru_cache import TimedLRUCache

def test_cache_without_ttl_reproduction():
    # Setting a key without TTL sets expires_at to None.
    # Calling get("persistent") crashes with TypeError on unpatched code!
    cache = TimedLRUCache(capacity=5)
    cache.set("persistent", "data-payload", ttl_seconds=None)
    
    val = cache.get("persistent")
    assert val == "data-payload", f"Expected 'data-payload', got {val}"
