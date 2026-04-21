# app/pipeline/deep_analyzer.py
# Deep analysis layer: CLIP + Gemini reasoning (HIGH risk only)

from dataclasses import dataclass, field
from PIL import Image
from app.models.model_registry import model_registry
from app.services.gemini_service import gemini_service
from app.pipeline.fast_filter import FilterResult
from app.utils.image_utils import image_to_base64
from app.observability.logging import get_logger

logger = get_logger(__name__)


@dataclass
class DeepAnalysisResult:
    """Output from the deep analysis stage."""
    is_confirmed: bool  # Does deep analysis confirm the threat?
    severity: str  # low, medium, high, critical
    reasoning: str  # Explanation from Gemini
    categories: list[str] = field(default_factory=list)
    recommended_action: str = "warn"  # allow, warn, block, escalate
    confidence: float = 0.0
    clip_scores: dict = field(default_factory=dict)
    gemini_raw: dict = field(default_factory=dict)


class DeepAnalyzer:
    """
    Deep analysis layer invoked only for HIGH-risk content.

    Pipeline:
    1. CLIP multimodal alignment (if image present)
    2. Gemini reasoning via LangChain
    3. Combine signals into final assessment

    This layer trades speed for accuracy — expected latency: 1-3 seconds.
    """

    async def analyze_text(
        self,
        text: str,
        filter_result: FilterResult,
    ) -> DeepAnalysisResult:
        """
        Deep analysis for flagged text content.

        Args:
            text: Original text content.
            filter_result: Results from the fast filter stage.

        Returns:
            DeepAnalysisResult with Gemini reasoning.
        """
        logger.info("deep_analysis_text_started")

        # Prepare context from fast filter
        context = {
            "flagged_categories": filter_result.categories,
            "max_score": filter_result.max_score,
            "max_label": filter_result.max_label,
            "all_scores": filter_result.scores,
        }

        # Invoke Gemini for contextual reasoning
        gemini_result = await gemini_service.analyze_text(text, context)

        result = self._build_result(gemini_result)

        logger.info(
            "deep_analysis_text_complete",
            confirmed=result.is_confirmed,
            severity=result.severity,
            action=result.recommended_action,
        )
        return result

    async def analyze_image(
        self,
        image: Image.Image,
        filter_result: FilterResult,
        context_text: str | None = None,
    ) -> DeepAnalysisResult:
        """
        Deep analysis for flagged image content.

        Args:
            image: PIL Image.
            filter_result: Results from the fast filter.
            context_text: Optional text accompanying the image.

        Returns:
            DeepAnalysisResult with CLIP alignment + Gemini reasoning.
        """
        logger.info("deep_analysis_image_started")

        # Step 1: CLIP multimodal alignment
        clip_scores = {}
        if model_registry.clip_available:
            try:
                clip_result = model_registry.clip_model.align_content(image, context_text)
                clip_scores = clip_result
                logger.info("clip_alignment_complete", most_aligned=clip_result.get("most_aligned"))
            except Exception as e:
                logger.warning("clip_alignment_failed", error=str(e))

        # Step 2: Gemini image reasoning
        context = {
            "flagged_categories": filter_result.categories,
            "max_score": filter_result.max_score,
            "clip_alignment": clip_scores.get("most_aligned", "unknown"),
        }

        image_b64 = image_to_base64(image)
        gemini_result = await gemini_service.analyze_image(image_b64, context)

        result = self._build_result(gemini_result, clip_scores)

        logger.info(
            "deep_analysis_image_complete",
            confirmed=result.is_confirmed,
            severity=result.severity,
        )
        return result

    def _build_result(
        self,
        gemini_result: dict,
        clip_scores: dict | None = None,
    ) -> DeepAnalysisResult:
        """Build DeepAnalysisResult from Gemini response."""
        if "error" in gemini_result:
            # Gemini failed — err on the side of caution
            return DeepAnalysisResult(
                is_confirmed=True,  # Assume harmful if we can't verify
                severity="medium",
                reasoning=f"Deep analysis unavailable: {gemini_result['error']}. Defaulting to caution.",
                recommended_action="warn",
                confidence=0.3,
                clip_scores=clip_scores or {},
                gemini_raw=gemini_result,
            )

        return DeepAnalysisResult(
            is_confirmed=gemini_result.get("is_confirmed", False),
            severity=gemini_result.get("severity", "medium"),
            reasoning=gemini_result.get("reasoning", "No reasoning provided"),
            categories=gemini_result.get("categories", []),
            recommended_action=gemini_result.get("recommended_action", "warn"),
            confidence=gemini_result.get("confidence", 0.5),
            clip_scores=clip_scores or {},
            gemini_raw=gemini_result,
        )
