# app/pipeline/decision_engine.py
# Rule-based decision engine: final moderation verdict

from dataclasses import dataclass, field
from app.pipeline.risk_scorer import RiskScore
from app.pipeline.deep_analyzer import DeepAnalysisResult
from app.observability.logging import get_logger

logger = get_logger(__name__)


@dataclass
class Decision:
    """Final moderation decision."""
    action: str  # ALLOWED, WARNING, BLOCKED
    reason: str
    severity: str  # low, medium, high, critical
    categories: list[str] = field(default_factory=list)
    should_alert_parent: bool = False
    should_log: bool = True
    escalation_notes: str | None = None


class DecisionEngine:
    """
    Rule-based final decision engine.

    Takes risk score + optional deep analysis and produces a final verdict.

    Rules:
    - LOW risk  → ALLOWED (no action)
    - MEDIUM risk → WARNING (increment user warning count, log)
    - HIGH risk + deep_confirmed → BLOCKED (alert parent, log, escalate if critical)
    - HIGH risk + deep_not_confirmed → WARNING (false positive recovery)
    - Repeat offender with MEDIUM → BLOCKED (escalate)
    """

    def decide(
        self,
        risk: RiskScore,
        deep_result: DeepAnalysisResult | None = None,
        user_history: dict | None = None,
    ) -> Decision:
        """
        Produce final moderation decision.

        Args:
            risk: Composite risk score from the scoring engine.
            deep_result: Optional deep analysis result (only for HIGH risk).
            user_history: Optional user moderation history.

        Returns:
            Decision with action, reason, and metadata.
        """

        # === LOW RISK ===
        if risk.level == "LOW":
            decision = Decision(
                action="ALLOWED",
                reason="Content passed all safety checks",
                severity="low",
                should_log=False,  # Don't clutter logs with safe content
            )

        # === MEDIUM RISK ===
        elif risk.level == "MEDIUM":
            # Check for repeat offender escalation
            if risk.repeat_offender:
                decision = Decision(
                    action="BLOCKED",
                    reason="Repeat offender with moderately harmful content — escalated to block",
                    severity="high",
                    should_alert_parent=True,
                    escalation_notes="User has repeated violation history. Medium-risk content escalated.",
                )
            else:
                decision = Decision(
                    action="WARNING",
                    reason=f"Content flagged as potentially harmful (risk score: {risk.score})",
                    severity="medium",
                    should_alert_parent=False,
                )

        # === HIGH RISK ===
        elif risk.level == "HIGH":
            if deep_result and deep_result.is_confirmed:
                # Deep analysis confirms the threat
                severity = deep_result.severity
                should_escalate = severity == "critical"

                decision = Decision(
                    action="BLOCKED",
                    reason=deep_result.reasoning,
                    severity=severity,
                    categories=deep_result.categories,
                    should_alert_parent=True,
                    escalation_notes=(
                        "CRITICAL: Immediate review required. "
                        f"Recommended action: {deep_result.recommended_action}"
                        if should_escalate
                        else None
                    ),
                )
            elif deep_result and not deep_result.is_confirmed:
                # Deep analysis says it's a false positive
                decision = Decision(
                    action="WARNING",
                    reason=(
                        f"Content initially flagged as high-risk (score: {risk.score}) "
                        f"but deep analysis did not confirm threat. "
                        f"Reasoning: {deep_result.reasoning}"
                    ),
                    severity="low",
                    should_alert_parent=False,
                )
            else:
                # No deep analysis available — err on caution
                decision = Decision(
                    action="BLOCKED",
                    reason=f"High-risk content detected (score: {risk.score}). Deep analysis unavailable.",
                    severity="high",
                    should_alert_parent=True,
                    escalation_notes="Deep analysis was not performed. Manual review recommended.",
                )

        else:
            # Fallback
            decision = Decision(
                action="WARNING",
                reason="Unclassified risk level",
                severity="medium",
            )

        logger.info(
            "decision_made",
            action=decision.action,
            severity=decision.severity,
            alert_parent=decision.should_alert_parent,
            risk_score=risk.score,
            risk_level=risk.level,
        )
        return decision
