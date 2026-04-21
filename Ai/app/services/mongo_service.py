# app/services/mongo_service.py
# Async MongoDB client for moderation logs and user history

from datetime import datetime, timezone
from typing import Any
from app.config import get_settings
from app.observability.logging import get_logger

logger = get_logger(__name__)


class MongoService:
    """
    Async MongoDB client using Motor.

    Collections:
    - moderation_logs: Full pipeline run traces
    - user_history: Aggregated user moderation stats
    """

    def __init__(self):
        self.settings = get_settings()
        self.client = None
        self.db = None
        self._connected = False

    async def connect(self) -> None:
        """Establish MongoDB connection."""
        try:
            from motor.motor_asyncio import AsyncIOMotorClient

            self.client = AsyncIOMotorClient(
                self.settings.mongodb_uri,
                serverSelectionTimeoutMS=5000,
            )
            # Verify connection
            await self.client.server_info()

            self.db = self.client[self.settings.mongodb_db_name]
            self._connected = True
            logger.info("mongodb_connected", db=self.settings.mongodb_db_name)

            # Create indexes
            await self._create_indexes()
        except Exception as e:
            logger.warning("mongodb_connection_failed", error=str(e))
            self._connected = False

    async def _create_indexes(self) -> None:
        """Create necessary indexes for performance."""
        try:
            # moderation_logs indexes
            logs = self.db["moderation_logs"]
            await logs.create_index("user_id")
            await logs.create_index("created_at")
            await logs.create_index([("user_id", 1), ("created_at", -1)])

            # user_history indexes
            history = self.db["user_history"]
            await history.create_index("user_id", unique=True)

            logger.info("mongodb_indexes_created")
        except Exception as e:
            logger.warning("mongodb_index_creation_failed", error=str(e))

    async def disconnect(self) -> None:
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            self._connected = False
            logger.info("mongodb_disconnected")

    # ---- Moderation Logs ----

    async def log_moderation(self, log_entry: dict) -> str | None:
        """
        Store a complete moderation pipeline run.

        Args:
            log_entry: Full pipeline result including input, scores, decisions.

        Returns:
            Inserted document ID or None.
        """
        if not self._connected:
            return None

        try:
            log_entry["created_at"] = datetime.now(timezone.utc)
            result = await self.db["moderation_logs"].insert_one(log_entry)
            logger.debug("moderation_logged", doc_id=str(result.inserted_id))
            return str(result.inserted_id)
        except Exception as e:
            logger.error("moderation_log_failed", error=str(e))
            return None

    async def get_moderation_history(
        self,
        user_id: str,
        limit: int = 20,
        skip: int = 0,
    ) -> list[dict]:
        """Get moderation history for a user."""
        if not self._connected:
            return []

        try:
            cursor = (
                self.db["moderation_logs"]
                .find({"user_id": user_id})
                .sort("created_at", -1)
                .skip(skip)
                .limit(limit)
            )
            results = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                results.append(doc)
            return results
        except Exception as e:
            logger.error("history_fetch_failed", error=str(e))
            return []

    # ---- User History (aggregated stats) ----

    async def get_user_history(self, user_id: str) -> dict | None:
        """Get aggregated moderation stats for a user."""
        if not self._connected:
            return None

        try:
            doc = await self.db["user_history"].find_one({"user_id": user_id})
            if doc:
                doc["_id"] = str(doc["_id"])
            return doc
        except Exception as e:
            logger.error("user_history_fetch_failed", error=str(e))
            return None

    async def update_user_history(self, user_id: str, moderation_result: dict) -> None:
        """
        Update aggregated user history after a moderation event.

        Tracks:
        - total_scans, total_violations, total_warnings
        - violation_categories (count per category)
        - last_violation_at
        - risk_trend (recent violation rate)
        """
        if not self._connected:
            return

        try:
            risk_level = moderation_result.get("risk_level", "LOW")
            categories = moderation_result.get("categories", [])

            update_ops: dict[str, Any] = {
                "$inc": {"total_scans": 1},
                "$set": {"last_scan_at": datetime.now(timezone.utc)},
                "$setOnInsert": {"user_id": user_id, "created_at": datetime.now(timezone.utc)},
            }

            if risk_level == "HIGH":
                update_ops["$inc"]["total_violations"] = 1
                update_ops["$set"]["last_violation_at"] = datetime.now(timezone.utc)
                for cat in categories:
                    update_ops["$inc"][f"violation_categories.{cat}"] = 1
            elif risk_level == "MEDIUM":
                update_ops["$inc"]["total_warnings"] = 1

            await self.db["user_history"].update_one(
                {"user_id": user_id},
                update_ops,
                upsert=True,
            )
        except Exception as e:
            logger.error("user_history_update_failed", error=str(e))

    @property
    def is_connected(self) -> bool:
        return self._connected


# Global singleton
mongo_service = MongoService()
