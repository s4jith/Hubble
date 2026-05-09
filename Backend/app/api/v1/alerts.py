# app/api/v1/alerts.py
# Alert endpoints for parents and children

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.dependencies import get_current_user
from app.db.models.user import UserDocument, UserRole
from app.db.models.alert import AlertDocument, AlertStatus
from app.observability.logging import get_logger
from datetime import datetime

logger = get_logger(__name__)
router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("")
async def list_alerts(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    user: UserDocument = Depends(get_current_user),
):
    """List alerts. Parents see all their children's alerts; children see their own."""
    skip = (page - 1) * limit

    if user.role == UserRole.PARENT:
        query = AlertDocument.find(AlertDocument.parent_id == str(user.id))
    else:
        query = AlertDocument.find(AlertDocument.child_id == str(user.id))

    if status:
        query = query.find(AlertDocument.status == AlertStatus(status))
    if severity:
        from app.db.models.alert import AlertSeverity
        query = query.find(AlertDocument.severity == AlertSeverity(severity))

    alerts = await query.sort(-AlertDocument.created_at).skip(skip).limit(limit).to_list()
    return {
        "success": True,
        "page": page,
        "limit": limit,
        "alerts": [_fmt(a) for a in alerts],
    }


@router.get("/{alert_id}")
async def get_alert(
    alert_id: str,
    user: UserDocument = Depends(get_current_user),
):
    alert = await AlertDocument.get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    _check_access(alert, user)
    return {"success": True, "alert": _fmt(alert)}


class AcknowledgeRequest(BaseModel):
    resolution_notes: Optional[str] = None


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    user: UserDocument = Depends(get_current_user),
):
    alert = await AlertDocument.get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    _check_access(alert, user)
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_at = datetime.utcnow()
    alert.updated_at = datetime.utcnow()
    await alert.save()
    return {"success": True, "alert": _fmt(alert)}


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    body: AcknowledgeRequest,
    user: UserDocument = Depends(get_current_user),
):
    if user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Only parents can resolve alerts")
    alert = await AlertDocument.get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.parent_id != str(user.id):
        raise HTTPException(status_code=403, detail="Cannot resolve this alert")
    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by = str(user.id)
    alert.resolution_notes = body.resolution_notes
    alert.updated_at = datetime.utcnow()
    await alert.save()
    return {"success": True, "alert": _fmt(alert)}


@router.get("/stats/summary")
async def alert_stats(user: UserDocument = Depends(get_current_user)):
    if user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Only parents can view stats")
    alerts = await AlertDocument.find(
        AlertDocument.parent_id == str(user.id)
    ).to_list()

    by_severity: dict = {}
    by_status: dict = {}
    by_category: dict = {}
    for a in alerts:
        by_severity[a.severity.value] = by_severity.get(a.severity.value, 0) + 1
        by_status[a.status.value] = by_status.get(a.status.value, 0) + 1
        for c in a.categories:
            by_category[c] = by_category.get(c, 0) + 1

    return {
        "success": True,
        "total": len(alerts),
        "by_severity": by_severity,
        "by_status": by_status,
        "by_category": by_category,
    }


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _check_access(alert: AlertDocument, user: UserDocument):
    if alert.parent_id != str(user.id) and alert.child_id != str(user.id):
        raise HTTPException(status_code=403, detail="Cannot access this alert")


def _fmt(a: AlertDocument) -> dict:
    return {
        "id": str(a.id),
        "child_id": a.child_id,
        "parent_id": a.parent_id,
        "title": a.title,
        "message": a.message,
        "guidance": a.guidance,
        "severity": a.severity.value,
        "categories": a.categories,
        "status": a.status.value,
        "created_at": a.created_at.isoformat(),
        "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None,
        "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
    }
