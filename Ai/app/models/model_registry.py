# app/models/model_registry.py
# Singleton model registry — loads and manages all ML models

from app.models.text_model import TextToxicityModel
from app.models.image_model import ImageClassificationModel
from app.models.clip_model import CLIPModel
from app.observability.logging import get_logger

logger = get_logger(__name__)


class ModelRegistry:
    """
    Central registry for all ML models.

    Provides lazy-loading and lifecycle management.
    Models are loaded once and reused across requests.
    """

    def __init__(self):
        self._text_model: TextToxicityModel | None = None
        self._image_model: ImageClassificationModel | None = None
        self._clip_model: CLIPModel | None = None

    async def load_all(self) -> dict[str, bool]:
        """
        Load all models. Called during application startup.

        Returns:
            Dict of model name → loaded status.
        """
        results = {}

        # Text model (required)
        logger.info("registry_loading", model="text_toxicity")
        try:
            self._text_model = TextToxicityModel()
            self._text_model.load()
            results["text"] = True
        except Exception as e:
            logger.error("text_model_load_failed", error=str(e))
            results["text"] = False

        # Image model (required)
        logger.info("registry_loading", model="image_classifier")
        try:
            self._image_model = ImageClassificationModel()
            self._image_model.load()
            results["image"] = True
        except Exception as e:
            logger.error("image_model_load_failed", error=str(e))
            results["image"] = False

        # CLIP model (optional — only for deep analysis)
        logger.info("registry_loading", model="clip")
        try:
            self._clip_model = CLIPModel()
            self._clip_model.load()
            results["clip"] = self._clip_model.is_loaded
        except Exception as e:
            logger.warning("clip_model_load_failed", error=str(e))
            results["clip"] = False

        logger.info("registry_loaded", results=results)
        return results

    @property
    def text_model(self) -> TextToxicityModel:
        if self._text_model is None or not self._text_model.is_loaded:
            raise RuntimeError("Text model not available")
        return self._text_model

    @property
    def image_model(self) -> ImageClassificationModel:
        if self._image_model is None or not self._image_model.is_loaded:
            raise RuntimeError("Image model not available")
        return self._image_model

    @property
    def clip_model(self) -> CLIPModel:
        if self._clip_model is None:
            raise RuntimeError("CLIP model not available")
        return self._clip_model

    @property
    def clip_available(self) -> bool:
        return self._clip_model is not None and self._clip_model.is_loaded

    def get_status(self) -> dict:
        """Get health status of all models."""
        return {
            "text_model": self._text_model.is_loaded if self._text_model else False,
            "image_model": self._image_model.is_loaded if self._image_model else False,
            "clip_model": self._clip_model.is_loaded if self._clip_model else False,
        }


# Global singleton
model_registry = ModelRegistry()
