# app/pipeline/risk_scorer.py
# Composite risk scoring engine

from dataclasses import dataclass
from app.config import get_settings
from app.pipeline.fast_filter import FilterResult
from app.observability.logging import get_logger

logger = get_logger(__name__)


@dataclass
class RiskScore:
    """Composite risk assessment."""
    score: float  # 0-100
    level: str  # LOW, MEDIUM, HIGH
    components: dict  # breakdown of scoring factors
    repeat_offender: bool = False


class RiskScorer:
    """
    Computes a composite risk score (0-100) from multiple signals.

    Scoring formula:
    - Base score from model confidence (weighted by category severity)
    - Repeat offender boost (user history)
    - Multi-category penalty (multiple harmful categories = higher risk)

    Thresholds (configurable via env):
    - 0-30:  LOW    → Allow
    - 31-65: MEDIUM → Warning
    - 66-100: HIGH  → Deep Analysis
    """

    # Category severity weights (how dangerous each type is)
    CATEGORY_WEIGHTS = {
        # Text categories (from RoBERTa toxic-bert)
        "toxic": 0.6,
        "severe_toxic": 1.0,
        "obscene": 0.5,
        "threat": 1.0,
        "insult": 0.5,
        "identity_hate": 0.9,
        # Image categories
        "violence": 0.9,
        "nsfw": 0.8,
        "self_harm": 1.0,
        "hate_symbol": 0.9,
        # Generic fallback
        "harassment": 0.7,
        "bullying": 0.7,
    }

    # Repeat offender thresholds
    REPEAT_OFFENDER_VIOLATIONS = 3
    REPEAT_OFFENDER_BOOST = 15  # points added

    def __init__(self):
        self.settings = get_settings()

    def score(
        self,
        filter_result: FilterResult,
        user_history: dict | None = None,
    ) -> RiskScore:
        """
        Compute composite risk score.

        Args:
            filter_result: Output from fast filter stage.
            user_history: Optional user moderation history.

        Returns:
            RiskScore with level classification.
        """
        # 1. Base score from model confidence
        base_score = self._compute_base_score(filter_result)

        # 2. Multi-category penalty
        multi_cat_penalty = self._multi_category_penalty(filter_result)

        # 3. Repeat offender boost
        repeat_boost, is_repeat = self._repeat_offender_boost(user_history)

        # 4. Combine
        raw_score = base_score + multi_cat_penalty + repeat_boost
        final_score = min(100.0, max(0.0, raw_score))

        # 5. Classify level
        level = self._classify_level(final_score)

        result = RiskScore(
            score=round(final_score, 1),
            level=level,
            components={
                "base_score": round(base_score, 1),
                "multi_category_penalty": round(multi_cat_penalty, 1),
                "repeat_offender_boost": round(repeat_boost, 1),
            },
            repeat_offender=is_repeat,
        )

        logger.info(
            "risk_scored",
            score=result.score,
            level=result.level,
            components=result.components,
            repeat_offender=is_repeat,
        )
        return result

    def _compute_base_score(self, result: FilterResult) -> float:
        """
        Compute base score from model predictions.

        Uses weighted sum of flagged category scores.
        """
        if not result.is_flagged:
            # Even unflagged content gets a small score based on max prediction
            return result.max_score * 20  # Scale 0-1 → 0-20

        # Weighted sum of flagged category scores
        weighted_sum = 0.0
        weight_total = 0.0

        for category, score in result.scores.items():
            weight = self.CATEGORY_WEIGHTS.get(category.lower(), 0.5)
            weighted_sum += score * weight * 100
            weight_total += weight

        if weight_total > 0:
            return weighted_sum / weight_total
        return result.max_score * 60

    def _multi_category_penalty(self, result: FilterResult) -> float:
        """Add penalty when multiple harmful categories are detected."""
        num_categories = len(result.categories)
        if num_categories <= 1:
            return 0.0
        # Each additional category adds 5 points
        return (num_categories - 1) * 5.0

    def _repeat_offender_boost(self, user_history: dict | None) -> tuple[float, bool]:
        """Boost score for users with violation history."""
        if not user_history:
            return 0.0, False

        total_violations = user_history.get("total_violations", 0)
        is_repeat = total_violations >= self.REPEAT_OFFENDER_VIOLATIONS

        if is_repeat:
            return self.REPEAT_OFFENDER_BOOST, True
        elif total_violations > 0:
            # Smaller boost for users with some history
            return total_violations * 3.0, False
        return 0.0, False

    def _classify_level(self, score: float) -> str:
        """Map numeric score to risk level."""
        if score <= self.settings.risk_low_max:
            return "LOW"
        elif score <= self.settings.risk_medium_max:
            return "MEDIUM"
        else:
            return "HIGH"
