# app/db/models/alert.py
# Alert Beanie document

from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from beanie import Document
from pydantic import Field


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, Enum):
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class AlertDocument(Document):
    """Parent alert generated when flagged content is detected for a child."""

    child_id: str
    parent_id: str
    scan_result_id: str

    title: str
    message: str
    guidance: str = ""

    severity: AlertSeverity = AlertSeverity.LOW
    categories: list[str] = Field(default_factory=list)
    severity_score: float = 0.0

    status: AlertStatus = AlertStatus.PENDING
    parent_notified: bool = False
    child_notified: bool = False

    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "alerts"

    def generate_content(self) -> None:
        """Populate title, message, guidance based on severity and categories."""
        category_text = ", ".join(self.categories) if self.categories else "potentially harmful content"
        score = int(self.severity_score * 100)

        if self.severity == AlertSeverity.LOW:
            self.title = "Mild Concern Detected"
            self.message = f"Content flagged for: {category_text}. Score: {score}/100."
            self.guidance = "This content contains some concerning elements. Consider talking about online safety."
        elif self.severity == AlertSeverity.MEDIUM:
            self.title = "Moderate Concern Detected"
            self.message = f"Concerning content detected: {category_text}. Score: {score}/100."
            self.guidance = "This content shows signs of potential cyberbullying. We recommend discussing this with your child."
        elif self.severity == AlertSeverity.HIGH:
            self.title = "⚠️ High Severity Alert"
            self.message = f"Serious concern detected: {category_text}. Score: {score}/100."
            self.guidance = "Immediate discussion with your child is recommended. Consider reaching out to school counselors."
        else:  # CRITICAL
            self.title = "🚨 CRITICAL ALERT - Immediate Action Required"
            self.message = f"Critical content detected: {category_text}. Score: {score}/100."
            self.guidance = "If there are threats of violence or self-harm, please contact emergency services immediately."
