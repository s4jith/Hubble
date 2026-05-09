# app/pipeline/fast_filter.py
# First-pass AI classification using ONNX-optimized models

from dataclasses import dataclass, field
from PIL import Image
from app.models.model_registry import model_registry
from app.pipeline.preprocessor import ProcessedText, ProcessedImage
from app.observability.logging import get_logger

logger = get_logger(__name__)


@dataclass
class FilterResult:
    """Output from the fast filter stage."""
    input_type: str  # "text", "image"
    is_flagged: bool
    scores: dict[str, float] = field(default_factory=dict)
    max_score: float = 0.0
    max_label: str = ""
    categories: list[str] = field(default_factory=list)
    confidence: float = 0.0


class FastFilter:
    """
    Fast AI filter using ONNX-optimized models.

    - RoBERTa for text toxicity (multi-label)
    - EfficientNet for image classification

    This is the first gate in the pipeline. Designed for speed (<200ms).
    """

    # Toxicity threshold for flagging
    TEXT_FLAG_THRESHOLD = 0.4
    IMAGE_FLAG_THRESHOLD = 0.5

    def filter_text(self, processed: ProcessedText) -> FilterResult:
        """
        Run RoBERTa text toxicity inference.

        Args:
            processed: Preprocessed text input.

        Returns:
            FilterResult with per-category toxicity scores.
        """
        text_model = model_registry.text_model
        prediction = text_model.predict(processed.cleaned)

        # Determine which categories are flagged
        flagged_categories = []
        label_scores = prediction.get("label_scores", {})
        for label, score in label_scores.items():
            if score > self.TEXT_FLAG_THRESHOLD:
                flagged_categories.append(label)

        is_flagged = len(flagged_categories) > 0

        result = FilterResult(
            input_type="text",
            is_flagged=is_flagged,
            scores=label_scores,
            max_score=prediction["max_score"],
            max_label=prediction["max_label"],
            categories=flagged_categories,
            confidence=prediction["max_score"],
        )

        logger.info(
            "fast_filter_text",
            flagged=is_flagged,
            max_label=result.max_label,
            max_score=round(result.max_score, 3),
            categories=flagged_categories,
        )
        return result

    def filter_image(self, processed: ProcessedImage) -> FilterResult:
        """
        Run EfficientNet image classification inference.

        Args:
            processed: Preprocessed image input.

        Returns:
            FilterResult with image classification scores.
        """
        image_model = model_registry.image_model
        prediction = image_model.predict(processed.image)

        # Map model output to categories
        scores = {}
        for label, score in zip(prediction["labels"], prediction["scores"]):
            scores[label] = score

        flagged_categories = []
        for label, score in scores.items():
            if score > self.IMAGE_FLAG_THRESHOLD:
                # Check if this is a harmful category
                safe_labels = {"safe", "non-violence", "non_violence", "normal", "neutral"}
                if label.lower().replace("-", "_").replace(" ", "_") not in safe_labels:
                    flagged_categories.append(label)

        is_flagged = prediction["is_harmful"]

        result = FilterResult(
            input_type="image",
            is_flagged=is_flagged,
            scores=scores,
            max_score=prediction["max_score"],
            max_label=prediction["max_label"],
            categories=flagged_categories,
            confidence=prediction["max_score"],
        )

        logger.info(
            "fast_filter_image",
            flagged=is_flagged,
            max_label=result.max_label,
            max_score=round(result.max_score, 3),
        )
        return result
