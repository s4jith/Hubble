# app/models/text_model.py
# RoBERTa-based text toxicity model with ONNX optimization

from pathlib import Path
import numpy as np
from app.config import get_settings
from app.observability.logging import get_logger

logger = get_logger(__name__)


class TextToxicityModel:
    """
    Text toxicity classifier using a RoBERTa-based model.

    Supports both ONNX (fast) and PyTorch (fallback) inference.
    Model: unitary/toxic-bert (multi-label toxicity detection).

    Labels: toxic, severe_toxic, obscene, threat, insult, identity_hate
    """

    LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]

    def __init__(self):
        self.settings = get_settings()
        self.tokenizer = None
        self.onnx_session = None
        self.pt_model = None
        self.device = None
        self._loaded = False

    def load(self) -> None:
        """Load the tokenizer and model (ONNX preferred, PyTorch fallback)."""
        from transformers import AutoTokenizer

        model_name = self.settings.text_model_name
        cache_dir = self.settings.model_cache_path / "roberta"
        onnx_path = cache_dir / "text_toxicity.onnx"

        logger.info("loading_text_model", model=model_name)

        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(model_name, cache_dir=cache_dir)

        if self.settings.onnx_enabled and onnx_path.exists():
            # Use existing ONNX model
            from app.models.onnx_utils import load_onnx_session
            self.onnx_session = load_onnx_session(onnx_path)
            logger.info("text_model_loaded", backend="onnx")
        elif self.settings.onnx_enabled:
            # Load PyTorch, export to ONNX, then use ONNX
            self._load_pytorch(model_name, cache_dir)
            self._export_onnx(onnx_path)
            # Switch to ONNX session
            from app.models.onnx_utils import load_onnx_session
            self.onnx_session = load_onnx_session(onnx_path)
            self.pt_model = None  # Free PyTorch memory
            logger.info("text_model_loaded", backend="onnx", note="exported_from_pytorch")
        else:
            # PyTorch only
            self._load_pytorch(model_name, cache_dir)
            logger.info("text_model_loaded", backend="pytorch")

        self._loaded = True

    def _load_pytorch(self, model_name: str, cache_dir: Path) -> None:
        """Load the PyTorch model."""
        import torch
        from transformers import AutoModelForSequenceClassification

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.pt_model = AutoModelForSequenceClassification.from_pretrained(
            model_name, cache_dir=cache_dir
        )
        self.pt_model.to(self.device)
        self.pt_model.eval()

    def _export_onnx(self, onnx_path: Path) -> None:
        """Export current PyTorch model to ONNX."""
        import torch
        from app.models.onnx_utils import export_to_onnx

        sample = self.tokenizer(
            "test input for export",
            return_tensors="pt",
            padding="max_length",
            truncation=True,
            max_length=128,
        )
        sample = {k: v.to(self.device) for k, v in sample.items()}

        export_to_onnx(
            model=self.pt_model,
            sample_input=sample,
            output_path=onnx_path,
            input_names=["input_ids", "attention_mask"],
            output_names=["logits"],
        )

    def predict(self, text: str) -> dict:
        """
        Predict toxicity scores for input text.

        Args:
            text: Input text to classify.

        Returns:
            Dict with:
                - labels: list of label names
                - scores: list of per-label probabilities
                - is_toxic: bool (any label > 0.5)
                - max_score: float (highest toxicity probability)
                - max_label: str (label with highest probability)
        """
        if not self._loaded:
            raise RuntimeError("Text model not loaded. Call load() first.")

        # Tokenize
        encoding = self.tokenizer(
            text,
            return_tensors="np" if self.onnx_session else "pt",
            padding="max_length",
            truncation=True,
            max_length=128,
        )

        if self.onnx_session:
            return self._predict_onnx(encoding)
        else:
            return self._predict_pytorch(encoding)

    def _predict_onnx(self, encoding: dict) -> dict:
        """Run ONNX inference."""
        from app.models.onnx_utils import onnx_inference

        inputs = {
            "input_ids": encoding["input_ids"].astype(np.int64),
            "attention_mask": encoding["attention_mask"].astype(np.int64),
        }
        outputs = onnx_inference(self.onnx_session, inputs)
        logits = outputs[0][0]  # (num_labels,)
        return self._format_output(logits)

    def _predict_pytorch(self, encoding: dict) -> dict:
        """Run PyTorch inference."""
        import torch

        inputs = {k: v.to(self.device) for k, v in encoding.items()}
        with torch.no_grad():
            outputs = self.pt_model(**inputs)
            logits = outputs.logits[0].cpu().numpy()
        return self._format_output(logits)

    def _format_output(self, logits: np.ndarray) -> dict:
        """Convert raw logits to formatted prediction dict."""
        # Sigmoid for multi-label classification
        scores = 1 / (1 + np.exp(-logits))
        scores = scores.tolist()

        # Handle case where model has fewer outputs than expected labels
        labels = self.LABELS[: len(scores)]

        label_scores = dict(zip(labels, scores))
        max_idx = int(np.argmax(scores))
        is_toxic = any(s > 0.5 for s in scores)

        return {
            "labels": labels,
            "scores": scores,
            "label_scores": label_scores,
            "is_toxic": is_toxic,
            "max_score": scores[max_idx],
            "max_label": labels[max_idx],
        }

    @property
    def is_loaded(self) -> bool:
        return self._loaded
