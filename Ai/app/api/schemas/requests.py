# app/api/schemas/requests.py
# Pydantic request models for API endpoints

from pydantic import BaseModel, Field
from typing import Optional


class TextAnalysisRequest(BaseModel):
    """Request body for text analysis."""
    text: str = Field(..., min_length=1, max_length=10000, description="Text content to analyze")
    user_id: Optional[str] = Field(None, description="Optional user ID for history tracking")
    source_app: Optional[str] = Field(None, description="Source application (e.g., 'instagram', 'whatsapp')")
    metadata: Optional[dict] = Field(None, description="Additional metadata")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "text": "You are so ugly nobody likes you",
                    "user_id": "user_123",
                    "source_app": "instagram",
                }
            ]
        }
    }


class ImageAnalysisRequest(BaseModel):
    """Metadata for image analysis (file sent as multipart)."""
    user_id: Optional[str] = Field(None, description="Optional user ID for history tracking")
    source_app: Optional[str] = Field(None, description="Source application")


class VideoAnalysisRequest(BaseModel):
    """Metadata for video analysis (file sent as multipart)."""
    user_id: Optional[str] = Field(None, description="Optional user ID for history tracking")
    source_app: Optional[str] = Field(None, description="Source application")


class HistoryRequest(BaseModel):
    """Parameters for history queries."""
    limit: int = Field(20, ge=1, le=100, description="Maximum results to return")
    skip: int = Field(0, ge=0, description="Number of results to skip")
