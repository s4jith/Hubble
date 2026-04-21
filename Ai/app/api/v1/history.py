# app/api/v1/history.py
# Moderation history endpoints

from fastapi import APIRouter, HTTPException, Query
from app.api.schemas.responses import HistoryResponse
from app.services.mongo_service import mongo_service
from app.observability.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["History"])


@router.get(
    "/history/{user_id}",
    response_model=HistoryResponse,
    summary="Get moderation history for a user",
)
async def get_user_history(
    user_id: str,
    limit: int = Query(20, ge=1, le=100, description="Max results"),
    skip: int = Query(0, ge=0, description="Results to skip"),
):
    """
    Retrieve moderation history for a specific user.

    Returns past moderation decisions with timestamps,
    risk scores, and categories.
    """
    if not mongo_service.is_connected:
        raise HTTPException(
            status_code=503,
            detail="MongoDB not available — history querying disabled",
        )

    results = await mongo_service.get_moderation_history(user_id, limit=limit, skip=skip)

    return HistoryResponse(
        user_id=user_id,
        total=len(results),
        results=results,
    )


@router.get(
    "/history/{user_id}/summary",
    summary="Get aggregated user stats",
)
async def get_user_summary(user_id: str):
    """
    Get aggregated moderation statistics for a user.

    Includes total scans, violations, warnings, and category breakdown.
    """
    if not mongo_service.is_connected:
        raise HTTPException(status_code=503, detail="MongoDB not available")

    history = await mongo_service.get_user_history(user_id)
    if not history:
        return {
            "user_id": user_id,
            "total_scans": 0,
            "total_violations": 0,
            "total_warnings": 0,
            "violation_categories": {},
        }

    return history
