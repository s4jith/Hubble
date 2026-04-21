# tests/test_pipeline.py
# Integration tests for the moderation pipeline

import pytest
from unittest.mock import MagicMock, AsyncMock, patch

from app.pipeline.preprocessor import Preprocessor, ProcessedText
from app.pipeline.fast_filter import FastFilter, FilterResult
from app.pipeline.risk_scorer import RiskScorer, RiskScore
from app.pipeline.decision_engine import DecisionEngine, Decision
from app.pipeline.deep_analyzer import DeepAnalysisResult


class TestPreprocessor:
    """Tests for the Preprocessor module."""

    def setup_method(self):
        self.preprocessor = Preprocessor()

    def test_process_text_basic(self):
        result = self.preprocessor.process_text("Hello, this is a test message")
        assert isinstance(result, ProcessedText)
        assert result.cleaned == "Hello, this is a test message"
        assert result.word_count == 6

    def test_process_text_whitespace_normalization(self):
        result = self.preprocessor.process_text("Hello   \t  world  \n  test")
        assert result.cleaned == "Hello world test"
        assert result.word_count == 3

    def test_process_text_zero_width_removal(self):
        result = self.preprocessor.process_text("He\u200bllo\u200cWo\u200drld")
        assert "\u200b" not in result.cleaned
        assert "\u200c" not in result.cleaned

    def test_process_text_empty_after_clean(self):
        result = self.preprocessor.process_text("   ")
        assert result.cleaned == ""
        assert result.word_count == 1  # split("") still gives ['']


class TestRiskScorer:
    """Tests for the RiskScorer module."""

    def setup_method(self):
        self.scorer = RiskScorer()

    def test_low_risk_unflagged(self):
        result = FilterResult(
            input_type="text",
            is_flagged=False,
            scores={"toxic": 0.1, "insult": 0.05},
            max_score=0.1,
            max_label="toxic",
            categories=[],
            confidence=0.1,
        )
        score = self.scorer.score(result)
        assert score.level == "LOW"
        assert score.score < 30

    def test_high_risk_flagged(self):
        result = FilterResult(
            input_type="text",
            is_flagged=True,
            scores={"severe_toxic": 0.95, "threat": 0.9, "insult": 0.8},
            max_score=0.95,
            max_label="severe_toxic",
            categories=["severe_toxic", "threat", "insult"],
            confidence=0.95,
        )
        score = self.scorer.score(result)
        assert score.level == "HIGH"
        assert score.score > 65

    def test_repeat_offender_boost(self):
        result = FilterResult(
            input_type="text",
            is_flagged=True,
            scores={"toxic": 0.6},
            max_score=0.6,
            max_label="toxic",
            categories=["toxic"],
            confidence=0.6,
        )
        history = {"total_violations": 5}
        score = self.scorer.score(result, history)
        assert score.repeat_offender is True
        assert score.components["repeat_offender_boost"] > 0

    def test_no_user_history(self):
        result = FilterResult(
            input_type="text",
            is_flagged=False,
            scores={},
            max_score=0.05,
            max_label="safe",
            categories=[],
            confidence=0.05,
        )
        score = self.scorer.score(result, None)
        assert score.repeat_offender is False


class TestDecisionEngine:
    """Tests for the DecisionEngine module."""

    def setup_method(self):
        self.engine = DecisionEngine()

    def test_low_risk_allowed(self):
        risk = RiskScore(score=10.0, level="LOW", components={})
        decision = self.engine.decide(risk)
        assert decision.action == "ALLOWED"
        assert decision.should_alert_parent is False

    def test_medium_risk_warning(self):
        risk = RiskScore(score=45.0, level="MEDIUM", components={})
        decision = self.engine.decide(risk)
        assert decision.action == "WARNING"
        assert decision.should_alert_parent is False

    def test_high_risk_confirmed_blocked(self):
        risk = RiskScore(score=80.0, level="HIGH", components={})
        deep = DeepAnalysisResult(
            is_confirmed=True,
            severity="high",
            reasoning="Explicit threat detected",
            recommended_action="block",
            confidence=0.9,
        )
        decision = self.engine.decide(risk, deep)
        assert decision.action == "BLOCKED"
        assert decision.should_alert_parent is True

    def test_high_risk_not_confirmed_warning(self):
        risk = RiskScore(score=70.0, level="HIGH", components={})
        deep = DeepAnalysisResult(
            is_confirmed=False,
            severity="low",
            reasoning="Content is sarcastic, not a real threat",
            recommended_action="allow",
            confidence=0.85,
        )
        decision = self.engine.decide(risk, deep)
        assert decision.action == "WARNING"
        assert decision.severity == "low"

    def test_repeat_offender_medium_escalated(self):
        risk = RiskScore(
            score=50.0, level="MEDIUM", components={}, repeat_offender=True
        )
        decision = self.engine.decide(risk)
        assert decision.action == "BLOCKED"
        assert decision.should_alert_parent is True

    def test_high_risk_no_deep_analysis_caution(self):
        risk = RiskScore(score=75.0, level="HIGH", components={})
        decision = self.engine.decide(risk, deep_result=None)
        assert decision.action == "BLOCKED"
        assert "unavailable" in decision.reason.lower() or "Manual" in decision.escalation_notes
