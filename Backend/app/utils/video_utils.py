# app/utils/video_utils.py
# Video frame extraction using OpenCV

import tempfile
from pathlib import Path
from PIL import Image
import numpy as np


def extract_frames(
    video_bytes: bytes,
    max_frames: int = 10,
    fps_sample: int = 1,
) -> list[Image.Image]:
    """
    Extract key frames from a video file.

    Args:
        video_bytes: Raw video file bytes.
        max_frames: Maximum number of frames to extract.
        fps_sample: Extract 1 frame every N seconds.

    Returns:
        List of PIL Images (RGB).
    """
    import cv2

    # Write to temp file (OpenCV needs file path)
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    frames: list[Image.Image] = []

    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            raise ValueError("Failed to open video file")

        video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_interval = int(video_fps * fps_sample)

        if frame_interval < 1:
            frame_interval = 1

        frame_idx = 0
        while cap.isOpened() and len(frames) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                # BGR → RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(rgb_frame)
                frames.append(pil_image)

            frame_idx += 1

        cap.release()
    finally:
        # Clean up temp file
        Path(tmp_path).unlink(missing_ok=True)

    return frames


def get_video_metadata(video_bytes: bytes) -> dict:
    """Extract basic metadata from video file."""
    import cv2

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            return {"error": "Failed to open video"}

        metadata = {
            "fps": cap.get(cv2.CAP_PROP_FPS),
            "frame_count": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            "duration_seconds": (
                int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) / cap.get(cv2.CAP_PROP_FPS)
                if cap.get(cv2.CAP_PROP_FPS) > 0
                else 0
            ),
        }
        cap.release()
        return metadata
    finally:
        Path(tmp_path).unlink(missing_ok=True)
