# app/config.py
# Centralized configuration via Pydantic Settings

from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- Server ---
    host: str = "0.0.0.0"
    port: int = 8000
    env: str = "development"
    log_level: str = "INFO"

    # --- MongoDB ---
    mongodb_uri: str = "mongodb://localhost:27017/hubble"
    mongodb_db_name: str = "hubble"

    # --- Redis ---
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_ttl: int = 300  # seconds

    # --- Gemini ---
    gemini_api_keys: str = ""  # comma-separated
    gemini_model: str = "gemini-2.0-flash"

    # --- LangSmith ---
    langsmith_api_key: str = ""
    langsmith_project: str = "hubble-moderation"
    langsmith_tracing_v2: bool = True

    # --- Models ---
    model_cache_dir: str = "./model_cache"
    onnx_enabled: bool = True
    text_model_name: str = "unitary/toxic-bert"
    image_model_name: str = "google/efficientnet-b0"
    clip_model_name: str = "openai/clip-vit-base-patch32"

    # --- Risk Thresholds ---
    risk_low_max: int = 30
    risk_medium_max: int = 65

    # --- Content Limits ---
    max_text_length: int = 10000
    max_image_size: int = 10 * 1024 * 1024  # 10MB
    max_video_size: int = 50 * 1024 * 1024  # 50MB

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def gemini_keys_list(self) -> list[str]:
        """Parse comma-separated Gemini API keys."""
        if not self.gemini_api_keys:
            return []
        return [k.strip() for k in self.gemini_api_keys.split(",") if k.strip()]

    @property
    def model_cache_path(self) -> Path:
        """Resolved path for model cache directory."""
        path = Path(self.model_cache_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def is_production(self) -> bool:
        return self.env == "production"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
