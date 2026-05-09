# app/db/connection.py
# Beanie ODM initialization — reuses the existing mongo_service Motor client

from beanie import init_beanie
from app.observability.logging import get_logger

logger = get_logger(__name__)


async def connect_db() -> None:
    """Initialize Beanie ODM using the already-connected mongo_service client."""
    from app.services.mongo_service import mongo_service
    from app.db.models.user import UserDocument
    from app.db.models.scan_result import ScanResultDocument
    from app.db.models.alert import AlertDocument

    if not mongo_service._connected or mongo_service.client is None:
        logger.error("beanie_init_skipped", reason="mongo_service not connected")
        return

    try:
        db = mongo_service.client[mongo_service.settings.mongodb_db_name]
        await init_beanie(
            database=db,
            document_models=[UserDocument, ScanResultDocument, AlertDocument],
            allow_index_dropping=False,
        )
        logger.info("beanie_initialized", db=mongo_service.settings.mongodb_db_name)
    except Exception as e:
        logger.error("beanie_init_failed", error=str(e))
        raise


async def close_db() -> None:
    """No-op — Motor client is closed by mongo_service.disconnect()."""
    pass
