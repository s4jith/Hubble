# app/api/v1/health.py
# Health check endpoints

import time
from fastapi import APIRouter
from app.api.schemas.responses import HealthResponse
from app.models.model_registry import model_registry
from app.services.redis_service import redis_service
from app.services.mongo_service import mongo_service
from app.services.gemini_service import gemini_service

router = APIRouter(tags=["Health"])

_startup_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Full health check — reports status of all models and services.
    """
    model_status = model_registry.get_status()
    all_models_ok = all(model_status.values())

    service_status = {
        "mongodb": mongo_service.is_connected,
        "redis": redis_service.is_connected,
        "gemini": gemini_service.is_initialized,
    }

    overall = "healthy" if all_models_ok else "degraded"

    return HealthResponse(
        status=overall,
        version="4.0.0",
        models=model_status,
        services=service_status,
        uptime_seconds=round(time.time() - _startup_time, 1),
    )


@router.get("/health/models")
async def model_health():
    """Detailed model status."""
    return model_registry.get_status()


@router.get("/health/ping")
async def ping():
    """Lightweight liveness probe."""
    return {"status": "ok"}
