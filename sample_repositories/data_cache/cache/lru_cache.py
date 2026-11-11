"""
In-memory LRU Cache with TTL expiration support.
"""
import time
from typing import Any, Dict, Optional
from collections import OrderedDict

class TimedLRUCache:
    def __init__(self, capacity: int = 100):
        if capacity <= 0:
            raise ValueError("Capacity must be positive")
        self.capacity = capacity
        # Stores key -> (value, expires_at)
        self._data: OrderedDict[str, Dict[str, Any]] = OrderedDict()

    def set(self, key: str, value: Any, ttl_seconds: Optional[float] = None) -> None:
        """Stores key with optional TTL in seconds."""
        expires_at = time.time() + ttl_seconds if ttl_seconds is not None else None
        
        if key in self._data:
            self._data.move_to_end(key)
        self._data[key] = {"value": value, "expires_at": expires_at}
        
        if len(self._data) > self.capacity:
            # Evict oldest
            self._data.popitem(last=False)

    def get(self, key: str, default: Any = None) -> Any:
        """
        Retrieves value if present and not expired.
        
        BUG: Fails to check if expires_at is None before comparing time.time() > expires_at,
        causing a TypeError when retrieving keys set without a TTL!
        """
        if key not in self._data:
            return default
            
        entry = self._data[key]
        expires_at = entry["expires_at"]
        
        # BUG: Direct comparison raises TypeError if expires_at is None
        if time.time() > expires_at:
            del self._data[key]
            return default
            
        self._data.move_to_end(key)
        return entry["value"]

    def size(self) -> int:
        return len(self._data)

    def clear(self) -> None:
        self._data.clear()
