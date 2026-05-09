# app/services/redis_service.py
# Async Redis client for caching analysis results and user history

import json
import hashlib
from typing import Any
from app.config import get_settings
from app.observability.logging import get_logger

logger = get_logger(__name__)


class RedisService:
    """
    Async Redis client for caching.

    Caches:
    - Analysis results by content hash (avoid re-processing identical content)
    - User history summaries (avoid repeated MongoDB queries)
    """

    def __init__(self):
        self.settings = get_settings()
        self.client = None
        self._connected = False

    async def connect(self) -> None:
        """Establish Redis connection."""
        try:
            import redis.asyncio as aioredis

            self.client = aioredis.from_url(
                self.settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
            )
            # Test connection
            await self.client.ping()
            self._connected = True
            logger.info("redis_connected", url=self.settings.redis_url)
        except Exception as e:
            logger.warning("redis_connection_failed", error=str(e))
            self._connected = False

    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self.client:
            await self.client.close()
            self._connected = False
            logger.info("redis_disconnected")

    @staticmethod
    def _content_hash(content: str) -> str:
        """Generate a deterministic hash for content-based cache keys."""
        return hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]

    async def get_cached_result(self, content: str, input_type: str) -> dict | None:
        """
        Look up a cached analysis result.

        Args:
            content: The raw content (text, or image hash).
            input_type: 'text', 'image', or 'video'.

        Returns:
            Cached result dict or None.
        """
        if not self._connected:
            return None

        try:
            key = f"hubble:result:{input_type}:{self._content_hash(content)}"
            cached = await self.client.get(key)
            if cached:
                logger.debug("cache_hit", key=key)
                return json.loads(cached)
            return None
        except Exception as e:
            logger.warning("cache_get_failed", error=str(e))
            return None

    async def cache_result(self, content: str, input_type: str, result: dict) -> None:
        """
        Cache an analysis result.

        Args:
            content: The raw content (text, or image hash).
            input_type: 'text', 'image', or 'video'.
            result: The analysis result dict.
        """
        if not self._connected:
            return

        try:
            key = f"hubble:result:{input_type}:{self._content_hash(content)}"
            await self.client.setex(
                key,
                self.settings.redis_cache_ttl,
                json.dumps(result, default=str),
            )
            logger.debug("cache_set", key=key, ttl=self.settings.redis_cache_ttl)
        except Exception as e:
            logger.warning("cache_set_failed", error=str(e))

    async def get_user_history(self, user_id: str) -> dict | None:
        """Get cached user moderation history summary."""
        if not self._connected:
            return None

        try:
            key = f"hubble:user_history:{user_id}"
            cached = await self.client.get(key)
            return json.loads(cached) if cached else None
        except Exception:
            return None

    async def cache_user_history(self, user_id: str, history: dict) -> None:
        """Cache user moderation history summary (10 minute TTL)."""
        if not self._connected:
            return

        try:
            key = f"hubble:user_history:{user_id}"
            await self.client.setex(key, 600, json.dumps(history, default=str))
        except Exception:
            pass

    async def invalidate_user_history(self, user_id: str) -> None:
        """Invalidate cached user history after a new moderation event."""
        if not self._connected:
            return

        try:
            key = f"hubble:user_history:{user_id}"
            await self.client.delete(key)
        except Exception:
            pass

    @property
    def is_connected(self) -> bool:
        return self._connected


# Global singleton
redis_service = RedisService()
