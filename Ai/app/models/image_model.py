# app/models/image_model.py
# EfficientNet-based image classification model with ONNX optimization

from pathlib import Path
import numpy as np
from PIL import Image
from app.config import get_settings
from app.observability.logging import get_logger

logger = get_logger(__name__)


class ImageClassificationModel:
    """
    Image content classifier using EfficientNet.

    Detects violence, NSFW content, and other harmful imagery.
    Supports ONNX (fast) and PyTorch (fallback) inference.
    """

    LABELS = ["safe", "violence", "nsfw", "self_harm", "hate_symbol"]

    def __init__(self):
        self.settings = get_settings()
        self.processor = None
        self.onnx_session = None
        self.pt_model = None
        self.device = None
        self._loaded = False
        self._num_labels = len(self.LABELS)

    def load(self) -> None:
        """Load the image processor and model."""
        from transformers import AutoImageProcessor, AutoModelForImageClassification

        model_name = self.settings.image_model_name
        cache_dir = self.settings.model_cache_path / "efficientnet"
        onnx_path = cache_dir / "image_classifier.onnx"

        logger.info("loading_image_model", model=model_name)

        # Load image processor
        try:
            self.processor = AutoImageProcessor.from_pretrained(
                model_name, cache_dir=cache_dir
            )
        except Exception:
            # Fallback: use a generic processor
            from transformers import AutoImageProcessor
            self.processor = AutoImageProcessor.from_pretrained(
                "google/efficientnet-b0", cache_dir=cache_dir
            )

        if self.settings.onnx_enabled and onnx_path.exists():
            from app.models.onnx_utils import load_onnx_session
            self.onnx_session = load_onnx_session(onnx_path)
            logger.info("image_model_loaded", backend="onnx")
        else:
            self._load_pytorch(model_name, cache_dir)
            if self.settings.onnx_enabled:
                try:
                    self._export_onnx(onnx_path)
                    from app.models.onnx_utils import load_onnx_session
                    self.onnx_session = load_onnx_session(onnx_path)
                    self.pt_model = None
                    logger.info("image_model_loaded", backend="onnx", note="exported")
                except Exception as e:
                    logger.warning("onnx_export_failed", error=str(e), fallback="pytorch")
            else:
                logger.info("image_model_loaded", backend="pytorch")

        self._loaded = True

    def _load_pytorch(self, model_name: str, cache_dir: Path) -> None:
        """Load PyTorch model."""
        import torch
        from transformers import AutoModelForImageClassification

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        try:
            self.pt_model = AutoModelForImageClassification.from_pretrained(
                model_name, cache_dir=cache_dir
            )
        except Exception:
            # If the model doesn't exist as a pretrained classifier, load base EfficientNet
            self.pt_model = AutoModelForImageClassification.from_pretrained(
                "google/efficientnet-b0", cache_dir=cache_dir
            )
        self.pt_model.to(self.device)
        self.pt_model.eval()

        # Update labels from model config if available
        if hasattr(self.pt_model.config, "id2label"):
            model_labels = list(self.pt_model.config.id2label.values())
            if model_labels:
                self._num_labels = len(model_labels)

    def _export_onnx(self, onnx_path: Path) -> None:
        """Export to ONNX."""
        import torch
        from app.models.onnx_utils import export_to_onnx

        dummy_input = torch.randn(1, 3, 224, 224).to(self.device)
        export_to_onnx(
            model=self.pt_model,
            sample_input={"pixel_values": dummy_input},
            output_path=onnx_path,
            input_names=["pixel_values"],
            output_names=["logits"],
        )

    def predict(self, image: Image.Image) -> dict:
        """
        Classify an image for harmful content.

        Args:
            image: PIL Image (RGB).

        Returns:
            Dict with labels, scores, is_harmful, max_score, max_label.
        """
        if not self._loaded:
            raise RuntimeError("Image model not loaded. Call load() first.")

        # Preprocess with the model's processor
        inputs = self.processor(images=image, return_tensors="np" if self.onnx_session else "pt")

        if self.onnx_session:
            return self._predict_onnx(inputs)
        else:
            return self._predict_pytorch(inputs)

    def _predict_onnx(self, inputs) -> dict:
        """ONNX inference."""
        from app.models.onnx_utils import onnx_inference

        pixel_values = inputs["pixel_values"].astype(np.float32)
        outputs = onnx_inference(self.onnx_session, {"pixel_values": pixel_values})
        logits = outputs[0][0]
        return self._format_output(logits)

    def _predict_pytorch(self, inputs) -> dict:
        """PyTorch inference."""
        import torch

        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = self.pt_model(**inputs)
            logits = outputs.logits[0].cpu().numpy()
        return self._format_output(logits)

    def _format_output(self, logits: np.ndarray) -> dict:
        """Convert logits to prediction dict."""
        # Softmax for single-label classification
        exp_logits = np.exp(logits - np.max(logits))
        scores = (exp_logits / exp_logits.sum()).tolist()

        # Map to our labels (or use model's own labels)
        if self.pt_model and hasattr(self.pt_model.config, "id2label"):
            labels = [self.pt_model.config.id2label.get(i, f"class_{i}") for i in range(len(scores))]
        else:
            labels = [f"class_{i}" for i in range(len(scores))]

        max_idx = int(np.argmax(scores))

        # Determine if harmful (anything not classified as safe/non-violent)
        safe_keywords = {"safe", "non-violence", "non_violence", "normal", "neutral"}
        is_harmful = labels[max_idx].lower().replace("-", "_").replace(" ", "_") not in safe_keywords

        return {
            "labels": labels,
            "scores": scores,
            "is_harmful": is_harmful,
            "max_score": scores[max_idx],
            "max_label": labels[max_idx],
        }

    @property
    def is_loaded(self) -> bool:
        return self._loaded
