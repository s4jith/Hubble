# app/pipeline/preprocessor.py
# Input preprocessing: normalization, frame extraction, cleaning

import re
from dataclasses import dataclass, field
from PIL import Image
from app.config import get_settings
from app.observability.logging import get_logger

logger = get_logger(__name__)


@dataclass
class ProcessedText:
    """Preprocessed text content."""
    original: str
    cleaned: str
    word_count: int
    char_count: int
    language: str = "en"  # placeholder for language detection


@dataclass
class ProcessedImage:
    """Preprocessed image content."""
    image: Image.Image
    width: int
    height: int
    format: str = "RGB"


@dataclass
class ProcessedVideo:
    """Preprocessed video — a list of extracted frames."""
    frames: list[ProcessedImage] = field(default_factory=list)
    frame_count: int = 0
    duration_seconds: float = 0.0
    metadata: dict = field(default_factory=dict)


class Preprocessor:
    """
    Input preprocessing for all content types.

    - Text: cleaning, normalization
    - Image: resize, format conversion
    - Video: frame extraction + per-frame preprocessing
    """

    def __init__(self):
        self.settings = get_settings()

    def process_text(self, text: str) -> ProcessedText:
        """
        Clean and normalize input text.

        - Strip excessive whitespace
        - Remove zero-width characters
        - Normalize unicode
        """
        import unicodedata

        # Remove zero-width characters often used for obfuscation
        cleaned = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)

        # Normalize unicode
        cleaned = unicodedata.normalize("NFKC", cleaned)

        # Collapse excessive whitespace
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        result = ProcessedText(
            original=text,
            cleaned=cleaned,
            word_count=len(cleaned.split()),
            char_count=len(cleaned),
        )

        logger.debug(
            "text_preprocessed",
            word_count=result.word_count,
            char_count=result.char_count,
        )
        return result

    def process_image(self, image_bytes: bytes) -> ProcessedImage:
        """
        Load and preprocess image from bytes.

        - Convert to RGB
        - Record dimensions
        """
        from app.utils.image_utils import load_image_from_bytes

        image = load_image_from_bytes(image_bytes)
        width, height = image.size

        result = ProcessedImage(
            image=image,
            width=width,
            height=height,
        )

        logger.debug("image_preprocessed", width=width, height=height)
        return result

    def process_video(self, video_bytes: bytes) -> ProcessedVideo:
        """
        Extract key frames from video.

        Uses OpenCV to sample frames at configured intervals.
        """
        from app.utils.video_utils import extract_frames, get_video_metadata

        metadata = get_video_metadata(video_bytes)
        frames_pil = extract_frames(
            video_bytes,
            max_frames=self.settings.video_max_frames,
            fps_sample=self.settings.video_fps_sample,
        )

        processed_frames = []
        for frame in frames_pil:
            w, h = frame.size
            processed_frames.append(
                ProcessedImage(image=frame, width=w, height=h)
            )

        result = ProcessedVideo(
            frames=processed_frames,
            frame_count=len(processed_frames),
            duration_seconds=metadata.get("duration_seconds", 0.0),
            metadata=metadata,
        )

        logger.debug(
            "video_preprocessed",
            frames_extracted=result.frame_count,
            duration=result.duration_seconds,
        )
        return result
