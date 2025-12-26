# main.py
# FastAPI Backend for Cyberbullying Detection
# 
# Single unified endpoint - accepts text OR image, returns yes/no
# Run with: uvicorn main:app --reload
# Swagger UI: http://localhost:8000/docs

import os
import shutil
import tempfile
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from pydantic import BaseModel

from cyberbullying_detector import CyberbullyingDetector

# Initialize FastAPI app
app = FastAPI(
    title="Cyberbullying Detection API",
    description="""
    Simple API for detecting cyberbullying in text or images.
    
    ## Usage:
    Send either **text** OR an **image** to the `/detect` endpoint.
    
    ## Response:
    - `is_cyberbullying`: **true** or **false**
    - `label`: Brief description (SAFE, HARASSMENT, THREATENING, DEEPFAKE)
    """,
    version="2.0.0"
)

# Initialize detector (singleton)
detector = None

def get_detector():
    """Get or initialize the detector singleton."""
    global detector
    if detector is None:
        print("Initializing Cyberbullying Detector...")
        detector = CyberbullyingDetector(use_onnx=True, use_api=True, verbose=True)
    return detector


# Simple Response Model
class DetectionResult(BaseModel):
    """Simple binary detection result."""
    is_cyberbullying: bool
    label: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "is_cyberbullying": True,
                "label": "HARASSMENT"
            }
        }


# Startup event
@app.on_event("startup")
async def startup_event():
    """Load models on startup."""
    print("Loading models...")
    get_detector()
    print("API Ready!")


# Health check
@app.get("/", tags=["Health"])
async def root():
    """Health check."""
    return {"status": "ok", "message": "Cyberbullying Detection API"}


# SINGLE UNIFIED ENDPOINT
@app.post("/detect", response_model=DetectionResult, tags=["Detection"])
async def detect(
    text: Optional[str] = Form(default=None, description="Text to analyze"),
    image: Optional[UploadFile] = File(default=None, description="Image to analyze")
):
    """
    **Detect cyberbullying in text or image.**
    
    Send either:
    - `text`: A text message to analyze
    - `image`: An image file to analyze
    
    Returns:
    - `is_cyberbullying`: **true** if cyberbullying detected, **false** otherwise
    - `label`: SAFE, HARASSMENT, THREATENING, or DEEPFAKE DETECTED
    """
    # Validate input - must provide either text or image (not both, not neither)
    if not text and not image:
        raise HTTPException(
            status_code=400, 
            detail="Please provide either 'text' or 'image'"
        )
    
    det = get_detector()
    
    # CASE 1: Text input
    if text and not image:
        result = det.check_text(text)
        return DetectionResult(
            is_cyberbullying=result["is_cyberbullying"],
            label=result["label"]
        )
    
    # CASE 2: Image input
    if image:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid image type. Allowed: jpg, png, gif, webp"
            )
        
        temp_path = None
        try:
            # Save to temp file
            suffix = os.path.splitext(image.filename)[1] or ".jpg"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                shutil.copyfileobj(image.file, temp_file)
                temp_path = temp_file.name
            
            # Analyze image
            result = det.check_image(temp_path)
            
            # Determine label
            if result.get("is_deepfake"):
                label = "DEEPFAKE DETECTED"
            else:
                label = result.get("label", "UNKNOWN")
            
            return DetectionResult(
                is_cyberbullying=result.get("is_cyberbullying", False),
                label=label
            )
            
        finally:
            # Cleanup temp file
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
    
    # Fallback (shouldn't reach here)
    return DetectionResult(is_cyberbullying=False, label="SAFE")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
