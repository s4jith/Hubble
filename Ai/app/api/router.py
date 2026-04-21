# app/api/router.py
# Root router — aggregates all versioned API routes

from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.analyze import router as analyze_router
from app.api.v1.history import router as history_router

# Main API router
api_router = APIRouter()

# Mount v1 routes
api_router.include_router(health_router, prefix="")
api_router.include_router(analyze_router, prefix="/api/v1")
api_router.include_router(history_router, prefix="/api/v1")
