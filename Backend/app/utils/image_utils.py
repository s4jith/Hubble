# app/utils/image_utils.py
# Image preprocessing and manipulation utilities

from io import BytesIO
from PIL import Image
import numpy as np


def load_image_from_bytes(data: bytes) -> Image.Image:
    """Load a PIL Image from raw bytes."""
    return Image.open(BytesIO(data)).convert("RGB")


def resize_image(image: Image.Image, size: tuple[int, int] = (224, 224)) -> Image.Image:
    """Resize image to target dimensions, maintaining aspect ratio with center crop."""
    image = image.resize(size, Image.Resampling.LANCZOS)
    return image


def image_to_numpy(image: Image.Image) -> np.ndarray:
    """Convert PIL Image to normalized numpy array (C, H, W) float32."""
    arr = np.array(image, dtype=np.float32) / 255.0
    # HWC → CHW
    arr = np.transpose(arr, (2, 0, 1))
    return arr


def normalize_image(
    arr: np.ndarray,
    mean: tuple[float, ...] = (0.485, 0.456, 0.406),
    std: tuple[float, ...] = (0.229, 0.224, 0.225),
) -> np.ndarray:
    """Apply ImageNet normalization to a CHW numpy array."""
    mean_arr = np.array(mean, dtype=np.float32).reshape(3, 1, 1)
    std_arr = np.array(std, dtype=np.float32).reshape(3, 1, 1)
    return (arr - mean_arr) / std_arr


def preprocess_image_for_model(
    image: Image.Image, size: tuple[int, int] = (224, 224)
) -> np.ndarray:
    """Full preprocessing pipeline: resize → numpy → normalize → add batch dim."""
    image = resize_image(image, size)
    arr = image_to_numpy(image)
    arr = normalize_image(arr)
    return np.expand_dims(arr, axis=0)  # (1, C, H, W)


def image_to_base64(image: Image.Image, fmt: str = "JPEG", quality: int = 85) -> str:
    """Encode PIL Image as base64 string."""
    import base64
    buffer = BytesIO()
    image.save(buffer, format=fmt, quality=quality)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
