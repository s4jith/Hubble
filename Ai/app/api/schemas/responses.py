# app/api/schemas/responses.py
# Pydantic response models for API endpoints

from pydantic import BaseModel, Field
from typing import Optional, Literal, Any
from datetime import datetime


class DecisionDetail(BaseModel):
    """Details of the moderation decision."""
    action: Literal["ALLOWED", "WARNING", "BLOCKED"]
    reason: str
    severity: str
    should_alert_parent: bool = False
    escalation_notes: Optional[str] = None


class DeepAnalysisDetail(BaseModel):
    """Details from the deep analysis stage (only present for HIGH risk)."""
    is_confirmed: bool
    severity: str
    reasoning: str
    categories: list[str] = []
    recommended_action: str
    confidence: float
    clip_scores: dict = {}


class RiskDetail(BaseModel):
    """Breakdown of risk scoring."""
    score: float
    level: Literal["LOW", "MEDIUM", "HIGH"]
    components: dict = {}
    repeat_offender: bool = False


class FilterDetail(BaseModel):
    """Fast filter stage output."""
    is_flagged: bool
    scores: dict[str, float] = {}
    max_score: float
    max_label: str
    categories: list[str] = []


class AnalysisResponse(BaseModel):
    """
    Unified response for all /analyze/* endpoints.

    This is the primary contract between the AI engine
    and the Node.js backend (and any external consumers).
    """
    request_id: str = Field(..., description="Unique request identifier")
    input_type: Literal["text", "image", "video"]
    status: Literal["ALLOWED", "WARNING", "BLOCKED"]
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    risk_score: float = Field(..., ge=0, le=100, description="Composite risk score 0-100")
    categories: list[str] = Field(default_factory=list, description="Detected abuse categories")
    confidence: float = Field(..., ge=0, le=1, description="Overall confidence 0-1")

    # Detailed breakdowns
    decision: DecisionDetail
    risk_detail: RiskDetail
    filter_detail: FilterDetail
    deep_analysis: Optional[DeepAnalysisDetail] = None

    # Metadata
    processing_time_ms: int = Field(..., description="Total processing time in milliseconds")
    trace_id: Optional[str] = Field(None, description="LangSmith trace ID for observability")
    cached: bool = Field(False, description="Whether this result was served from cache")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "request_id": "req_abc123",
                    "input_type": "text",
                    "status": "WARNING",
                    "risk_level": "MEDIUM",
                    "risk_score": 45.2,
                    "categories": ["insult", "toxic"],
                    "confidence": 0.82,
                    "decision": {
                        "action": "WARNING",
                        "reason": "Content flagged as potentially harmful",
                        "severity": "medium",
                        "should_alert_parent": False,
                    },
                    "risk_detail": {
                        "score": 45.2,
                        "level": "MEDIUM",
                        "components": {
                            "base_score": 42.0,
                            "multi_category_penalty": 3.2,
                            "repeat_offender_boost": 0.0,
                        },
                        "repeat_offender": False,
                    },
                    "filter_detail": {
                        "is_flagged": True,
                        "scores": {"toxic": 0.78, "insult": 0.65},
                        "max_score": 0.78,
                        "max_label": "toxic",
                        "categories": ["toxic", "insult"],
                    },
                    "deep_analysis": None,
                    "processing_time_ms": 156,
                    "trace_id": None,
                    "cached": False,
                }
            ]
        }
    }


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    models: dict[str, bool]
    services: dict[str, bool]
    uptime_seconds: float


class HistoryResponse(BaseModel):
    """Moderation history response."""
    user_id: str
    total: int
    results: list[dict[str, Any]]


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: str
    request_id: Optional[str] = None
