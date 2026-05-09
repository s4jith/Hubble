# app/db/models/scan_result.py
# ScanResult Beanie document

from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from beanie import Document
from pydantic import Field


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ScanResultDocument(Document):
    """Persisted result of a content scan through the AI pipeline."""

    user_id: str
    input_type: str                     # text | image | video
    content_preview: Optional[str] = None  # first 200 chars of text, or filename

    # Risk
    risk_level: RiskLevel = RiskLevel.LOW
    risk_score: float = 0.0
    categories: list[str] = Field(default_factory=list)
    is_flagged: bool = False

    # Decision
    action: str = "ALLOWED"             # ALLOWED | WARNED | BLOCKED | ESCALATED
    reasoning: Optional[str] = None

    # Pipeline metadata
    processing_time_ms: int = 0
    deep_analysis_used: bool = False

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "scan_results"
