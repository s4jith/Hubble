# app/dependencies.py
# FastAPI dependency injection

from app.models.model_registry import model_registry
from app.services.redis_service import redis_service
from app.services.mongo_service import mongo_service


async def require_models():
    """Dependency: ensure models are loaded."""
    status = model_registry.get_status()
    if not status.get("text_model") and not status.get("image_model"):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="AI models not loaded. Server is starting up.",
        )
    return model_registry


async def require_mongo():
    """Dependency: ensure MongoDB is connected."""
    if not mongo_service.is_connected:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="MongoDB not available.",
        )
    return mongo_service
