# app/api/v1/scan.py
# Authenticated scan endpoints — wraps the AI pipeline and persists results

import time
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from app.core.dependencies import get_current_user, require_role
from app.db.models.user import UserDocument, UserRole
from app.db.models.scan_result import ScanResultDocument, RiskLevel
from app.db.models.alert import AlertDocument, AlertSeverity, AlertStatus
from app.pipeline.workflow import get_workflow, PipelineState
from app.observability.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/scan", tags=["Scan"])

_SEVERITY_MAP = {
    "LOW": AlertSeverity.LOW,
    "MEDIUM": AlertSeverity.MEDIUM,
    "HIGH": AlertSeverity.HIGH,
    "CRITICAL": AlertSeverity.CRITICAL,
}


async def _run_pipeline_and_persist(
    input_type: str,
    raw_content,
    user: UserDocument,
) -> dict:
    """Run the AI pipeline, persist ScanResult and optional Alert, return result dict."""
    start = time.time()

    workflow = get_workflow()
    state: PipelineState = {
        "input_type": input_type,
        "raw_content": raw_content,
        "user_id": str(user.id),
    }
    result = await workflow.ainvoke(state)

    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])

    risk = result.get("risk_score")
    decision = result.get("decision")
    filter_result = result.get("filter_result")
    deep_result = result.get("deep_result")

    risk_level_str = risk.level if risk else "LOW"
    risk_score = risk.score if risk else 0.0
    action = decision.action if decision else "ALLOWED"
    categories = filter_result.categories if filter_result else []
    is_flagged = filter_result.is_flagged if filter_result else False
    reasoning = deep_result.reasoning if deep_result else None
    processing_ms = int((time.time() - start) * 1000)

    # Persist ScanResult
    scan_doc = ScanResultDocument(
        user_id=str(user.id),
        input_type=input_type,
        content_preview=(raw_content[:200] if isinstance(raw_content, str) else None),
        risk_level=RiskLevel(risk_level_str),
        risk_score=risk_score,
        categories=categories,
        is_flagged=is_flagged,
        action=action,
        reasoning=reasoning,
        processing_time_ms=processing_ms,
        deep_analysis_used=deep_result is not None,
    )
    await scan_doc.insert()

    # Create Alert if child account and content is flagged
    if is_flagged and user.role == UserRole.CHILD and user.parent_id:
        severity = _SEVERITY_MAP.get(risk_level_str, AlertSeverity.LOW)
        alert = AlertDocument(
            child_id=str(user.id),
            parent_id=user.parent_id,
            scan_result_id=str(scan_doc.id),
            severity=severity,
            categories=categories,
            severity_score=risk_score,
        )
        alert.generate_content()
        await alert.insert()
        logger.info("alert_created", alert_id=str(alert.id), child_id=str(user.id))

    return {
        "request_id": f"req_{uuid.uuid4().hex[:12]}",
        "input_type": input_type,
        "scan_id": str(scan_doc.id),
        "status": action,
        "risk_level": risk_level_str,
        "risk_score": risk_score,
        "categories": categories,
        "is_flagged": is_flagged,
        "reasoning": reasoning,
        "processing_time_ms": processing_ms,
    }


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

class ScanTextRequest(BaseModel):
    text: str


@router.post("/text")
async def scan_text(
    body: ScanTextRequest,
    user: UserDocument = Depends(get_current_user),
):
    """Scan text content. Requires authentication."""
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    result = await _run_pipeline_and_persist("text", body.text, user)
    return {"success": True, **result}


@router.post("/image")
async def scan_image(
    file: UploadFile = File(...),
    user: UserDocument = Depends(get_current_user),
):
    """Scan image content. Requires authentication."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    result = await _run_pipeline_and_persist("image", image_bytes, user)
    return {"success": True, **result}


@router.get("/history")
async def get_scan_history(
    page: int = 1,
    limit: int = 20,
    user: UserDocument = Depends(get_current_user),
):
    """Get scan history for the current user."""
    skip = (page - 1) * limit
    scans = await ScanResultDocument.find(
        ScanResultDocument.user_id == str(user.id)
    ).sort(-ScanResultDocument.created_at).skip(skip).limit(limit).to_list()

    return {
        "success": True,
        "page": page,
        "limit": limit,
        "results": [
            {
                "id": str(s.id),
                "input_type": s.input_type,
                "risk_level": s.risk_level.value,
                "risk_score": s.risk_score,
                "action": s.action,
                "is_flagged": s.is_flagged,
                "categories": s.categories,
                "created_at": s.created_at.isoformat(),
            }
            for s in scans
        ],
    }
