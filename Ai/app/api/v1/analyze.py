# app/api/v1/analyze.py
# Core analysis endpoints — text, image, video

import time
import uuid
from dataclasses import asdict
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.api.schemas.requests import TextAnalysisRequest
from app.api.schemas.responses import (
    AnalysisResponse,
    DecisionDetail,
    RiskDetail,
    FilterDetail,
    DeepAnalysisDetail,
    ErrorResponse,
)
from app.services.mongo_service import mongo_service
from app.services.redis_service import redis_service
from app.pipeline.workflow import get_workflow, PipelineState
from app.observability.logging import get_logger
from app.config import get_settings

logger = get_logger(__name__)
settings = get_settings()

router = APIRouter(tags=["Analysis"])


# ──────────────────────────────────────────────
# Helper: Convert pipeline state to API response
# ──────────────────────────────────────────────

def _build_response(
    state: dict,
    input_type: str,
    request_id: str,
    start_time: float,
    cached: bool = False,
) -> AnalysisResponse:
    """Convert pipeline output state into the unified AnalysisResponse."""

    risk = state.get("risk_score")
    decision = state.get("decision")
    filter_result = state.get("filter_result")
    deep_result = state.get("deep_result")

    # Build nested models
    decision_detail = DecisionDetail(
        action=decision.action if decision else "WARNING",
        reason=decision.reason if decision else "Pipeline incomplete",
        severity=decision.severity if decision else "medium",
        should_alert_parent=decision.should_alert_parent if decision else False,
        escalation_notes=decision.escalation_notes if decision else None,
    )

    risk_detail = RiskDetail(
        score=risk.score if risk else 0.0,
        level=risk.level if risk else "LOW",
        components=risk.components if risk else {},
        repeat_offender=risk.repeat_offender if risk else False,
    )

    filter_detail = FilterDetail(
        is_flagged=filter_result.is_flagged if filter_result else False,
        scores=filter_result.scores if filter_result else {},
        max_score=filter_result.max_score if filter_result else 0.0,
        max_label=filter_result.max_label if filter_result else "",
        categories=filter_result.categories if filter_result else [],
    )

    deep_analysis = None
    if deep_result:
        deep_analysis = DeepAnalysisDetail(
            is_confirmed=deep_result.is_confirmed,
            severity=deep_result.severity,
            reasoning=deep_result.reasoning,
            categories=deep_result.categories,
            recommended_action=deep_result.recommended_action,
            confidence=deep_result.confidence,
            clip_scores=deep_result.clip_scores,
        )

    processing_time = int((time.time() - start_time) * 1000)

    return AnalysisResponse(
        request_id=request_id,
        input_type=input_type,
        status=decision_detail.action,
        risk_level=risk_detail.level,
        risk_score=risk_detail.score,
        categories=filter_detail.categories,
        confidence=filter_detail.max_score,
        decision=decision_detail,
        risk_detail=risk_detail,
        filter_detail=filter_detail,
        deep_analysis=deep_analysis,
        processing_time_ms=processing_time,
        trace_id=None,  # TODO: capture from LangSmith
        cached=cached,
    )


# ──────────────────────────────────────────────
# POST /analyze/text
# ──────────────────────────────────────────────

@router.post(
    "/analyze/text",
    response_model=AnalysisResponse,
    responses={400: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
    summary="Analyze text content for cyberbullying",
)
async def analyze_text(request: TextAnalysisRequest):
    """
    Full moderation pipeline for text content.

    Pipeline: Preprocess → RoBERTa Filter → Risk Score → [Deep Analysis] → Decision
    """
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    start_time = time.time()

    logger.info("analyze_text_started", request_id=request_id, text_length=len(request.text))

    # Validate text length
    if len(request.text) > settings.max_text_length:
        raise HTTPException(status_code=400, detail=f"Text too long (max {settings.max_text_length} chars)")

    # Check cache
    cached_result = await redis_service.get_cached_result(request.text, "text")
    if cached_result:
        logger.info("analyze_text_cached", request_id=request_id)
        cached_result["request_id"] = request_id
        cached_result["cached"] = True
        cached_result["processing_time_ms"] = int((time.time() - start_time) * 1000)
        return AnalysisResponse(**cached_result)

    # Run pipeline
    try:
        workflow = get_workflow()
        initial_state: PipelineState = {
            "input_type": "text",
            "raw_content": request.text,
            "user_id": request.user_id,
        }

        result_state = await workflow.ainvoke(initial_state)

        # Check for pipeline errors
        if result_state.get("error"):
            raise HTTPException(status_code=500, detail=result_state["error"])

        response = _build_response(result_state, "text", request_id, start_time)

        # Cache the result
        await redis_service.cache_result(
            request.text, "text", response.model_dump()
        )

        # Log to MongoDB
        await _log_moderation(request_id, "text", request.user_id, response)

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error("analyze_text_failed", request_id=request_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ──────────────────────────────────────────────
# POST /analyze/image
# ──────────────────────────────────────────────

@router.post(
    "/analyze/image",
    response_model=AnalysisResponse,
    responses={400: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
    summary="Analyze image content for harmful material",
)
async def analyze_image(
    file: UploadFile = File(..., description="Image file to analyze"),
    user_id: str | None = Form(None, description="Optional user ID"),
    source_app: str | None = Form(None, description="Source application"),
):
    """
    Full moderation pipeline for image content.

    Pipeline: Preprocess → EfficientNet Filter → Risk Score → [CLIP + Gemini] → Decision
    """
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    start_time = time.time()

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, etc.)")

    logger.info("analyze_image_started", request_id=request_id, filename=file.filename)

    # Validate file size
    if file.size and file.size > settings.max_image_size:
        raise HTTPException(status_code=400, detail=f"Image too large (max {settings.max_image_size / 1024 / 1024}MB)")

    try:
        image_bytes = await file.read()

        workflow = get_workflow()
        initial_state: PipelineState = {
            "input_type": "image",
            "raw_content": image_bytes,
            "user_id": user_id,
        }

        result_state = await workflow.ainvoke(initial_state)

        if result_state.get("error"):
            raise HTTPException(status_code=500, detail=result_state["error"])

        response = _build_response(result_state, "image", request_id, start_time)

        # Log to MongoDB
        await _log_moderation(request_id, "image", user_id, response)

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error("analyze_image_failed", request_id=request_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")


# ──────────────────────────────────────────────
# POST /analyze/video
# ──────────────────────────────────────────────

@router.post(
    "/analyze/video",
    response_model=AnalysisResponse,
    responses={400: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
    summary="Analyze video content for harmful material",
)
async def analyze_video(
    file: UploadFile = File(..., description="Video file to analyze"),
    user_id: str | None = Form(None, description="Optional user ID"),
    source_app: str | None = Form(None, description="Source application"),
):
    """
    Full moderation pipeline for video content.

    Pipeline: Extract frames → Per-frame EfficientNet → Aggregate risk → [Deep Analysis] → Decision
    """
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    start_time = time.time()

    # Validate file type
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video (MP4, AVI, etc.)")

    logger.info("analyze_video_started", request_id=request_id, filename=file.filename)

    # Validate file size
    if file.size and file.size > settings.max_video_size:
        raise HTTPException(status_code=400, detail=f"Video too large (max {settings.max_video_size / 1024 / 1024}MB)")

    try:
        video_bytes = await file.read()

        workflow = get_workflow()
        initial_state: PipelineState = {
            "input_type": "video",
            "raw_content": video_bytes,
            "user_id": user_id,
        }

        result_state = await workflow.ainvoke(initial_state)

        if result_state.get("error"):
            raise HTTPException(status_code=500, detail=result_state["error"])

        response = _build_response(result_state, "video", request_id, start_time)

        # Log to MongoDB
        await _log_moderation(request_id, "video", user_id, response)

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error("analyze_video_failed", request_id=request_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Video analysis failed: {str(e)}")


# ──────────────────────────────────────────────
# Helper: Log moderation result to MongoDB
# ──────────────────────────────────────────────

async def _log_moderation(
    request_id: str,
    input_type: str,
    user_id: str | None,
    response: AnalysisResponse,
) -> None:
    """Log the moderation result and update user history."""
    try:
        log_entry = {
            "request_id": request_id,
            "input_type": input_type,
            "user_id": user_id,
            "status": response.status,
            "risk_level": response.risk_level,
            "risk_score": response.risk_score,
            "categories": response.categories,
            "processing_time_ms": response.processing_time_ms,
        }
        await mongo_service.log_moderation(log_entry)

        # Update user history
        if user_id:
            await mongo_service.update_user_history(user_id, {
                "risk_level": response.risk_level,
                "categories": response.categories,
            })
            # Invalidate cached history
            await redis_service.invalidate_user_history(user_id)

    except Exception as e:
        logger.warning("moderation_logging_failed", error=str(e))
