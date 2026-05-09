# app/models/clip_model.py
# CLIP model for multimodal text-image alignment (deep analysis only)

from PIL import Image
import numpy as np
from app.config import get_settings
from app.observability.logging import get_logger

logger = get_logger(__name__)


class CLIPModel:
    """
    CLIP (Contrastive Language-Image Pre-Training) model.

    Used in the deep analysis path to compute semantic alignment
    between text descriptions and image content. This helps detect
    subtle multimodal threats (e.g., threatening text overlaid on images).
    """

    def __init__(self):
        self.settings = get_settings()
        self.model = None
        self.preprocess = None
        self.tokenizer = None
        self._loaded = False
        self.device = None

    def load(self) -> None:
        """Load the CLIP model and preprocessor."""
        import torch
        try:
            import open_clip

            model_name = self.settings.clip_model_name
            cache_dir = self.settings.model_cache_path / "clip"
            cache_dir.mkdir(parents=True, exist_ok=True)

            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

            logger.info("loading_clip_model", model=model_name)

            # Use OpenCLIP for flexibility
            self.model, _, self.preprocess = open_clip.create_model_and_transforms(
                "ViT-B-32",
                pretrained="laion2b_s34b_b79k",
            )
            self.model = self.model.to(self.device)
            self.model.eval()

            self.tokenizer = open_clip.get_tokenizer("ViT-B-32")

            self._loaded = True
            logger.info("clip_model_loaded")

        except ImportError:
            logger.warning("clip_not_available", reason="open_clip not installed")
            self._loaded = False
        except Exception as e:
            logger.error("clip_load_failed", error=str(e))
            self._loaded = False

    def compute_similarity(self, image: Image.Image, texts: list[str]) -> dict:
        """
        Compute cosine similarity between an image and a list of text descriptions.

        Args:
            image: PIL Image.
            texts: List of text descriptions to compare against.

        Returns:
            Dict with similarities, best_match, and best_score.
        """
        if not self._loaded:
            return {"error": "CLIP model not loaded", "similarities": []}

        import torch

        # Preprocess image
        image_input = self.preprocess(image).unsqueeze(0).to(self.device)

        # Tokenize texts
        text_tokens = self.tokenizer(texts).to(self.device)

        with torch.no_grad():
            image_features = self.model.encode_image(image_input)
            text_features = self.model.encode_text(text_tokens)

            # Normalize
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)

            # Cosine similarity
            similarities = (image_features @ text_features.T).squeeze(0).cpu().numpy()

        sim_list = similarities.tolist()
        best_idx = int(np.argmax(sim_list))

        return {
            "similarities": dict(zip(texts, sim_list)),
            "best_match": texts[best_idx],
            "best_score": sim_list[best_idx],
        }

    def align_content(self, image: Image.Image, context_text: str | None = None) -> dict:
        """
        Analyze image alignment with harmful content categories.

        Args:
            image: Image to analyze.
            context_text: Optional surrounding text context.

        Returns:
            Dict with category alignment scores.
        """
        harmful_descriptions = [
            "a photo containing violence, fighting, or physical harm",
            "a photo containing nudity or sexual content",
            "a photo containing self-harm or suicide imagery",
            "a photo containing hate symbols or extremist content",
            "a photo containing drugs or substance abuse",
            "a safe and appropriate photo for children",
        ]

        result = self.compute_similarity(image, harmful_descriptions)

        if "error" in result:
            return result

        # Also check text-image alignment if context provided
        text_alignment = None
        if context_text:
            text_result = self.compute_similarity(image, [context_text, "unrelated content"])
            text_alignment = text_result["similarities"].get(context_text, 0.0)

        return {
            "category_scores": result["similarities"],
            "most_aligned": result["best_match"],
            "alignment_score": result["best_score"],
            "text_image_alignment": text_alignment,
        }

    @property
    def is_loaded(self) -> bool:
        return self._loaded
