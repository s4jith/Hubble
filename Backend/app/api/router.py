# app/api/router.py
# Root router — aggregates all versioned API routes

from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.analyze import router as analyze_router
from app.api.v1.history import router as history_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.scan import router as scan_router
from app.api.v1.alerts import router as alerts_router

# Main API router
api_router = APIRouter()

# ── Unauthenticated: health + raw AI pipeline ──
api_router.include_router(health_router, prefix="")
api_router.include_router(analyze_router, prefix="/api/v1")
api_router.include_router(history_router, prefix="/api/v1")

# ── Auth ──
api_router.include_router(auth_router, prefix="/api/v1")

# ── Authenticated business logic ──
api_router.include_router(users_router, prefix="/api/v1")
api_router.include_router(scan_router, prefix="/api/v1")
api_router.include_router(alerts_router, prefix="/api/v1")
