# app/db/connection.py
# Beanie ODM initialization using PyMongo async client for Beanie compatibility.

from beanie import init_beanie
from app.config import get_settings
from app.observability.logging import get_logger

logger = get_logger(__name__)

_beanie_client = None


async def connect_db() -> None:
    """Initialize Beanie ODM using PyMongo's async client."""
    from pymongo import AsyncMongoClient
    from app.db.models.user import UserDocument
    from app.db.models.scan_result import ScanResultDocument
    from app.db.models.alert import AlertDocument
    global _beanie_client

    settings = get_settings()

    if not settings.mongodb_uri:
        logger.error("beanie_init_skipped", reason="mongodb_uri_missing")
        return

    try:
        if _beanie_client is None:
            _beanie_client = AsyncMongoClient(
                settings.mongodb_uri,
                serverSelectionTimeoutMS=5000,
            )

        db = _beanie_client[settings.mongodb_db_name]
        await init_beanie(
            database=db,
            document_models=[UserDocument, ScanResultDocument, AlertDocument],
            allow_index_dropping=False,
        )
        logger.info("beanie_initialized", db=settings.mongodb_db_name)
    except Exception as e:
        logger.error("beanie_init_failed", error=str(e))
        raise


async def close_db() -> None:
    """Close the Beanie PyMongo async client."""
    global _beanie_client
    if _beanie_client is not None:
        await _beanie_client.close()
        _beanie_client = None
