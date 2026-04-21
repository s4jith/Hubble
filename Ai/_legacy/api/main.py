# main.py
# FastAPI Backend - Content Safety API
# Simple 18+ content detection

import sys
from pathlib import Path
from io import BytesIO

parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from PIL import Image

from local_models import ViolenceDetector, HarassmentDetector
from gemini_models import GeminiAnalyzer


app = FastAPI(
    title="SentinelAI - Content Safety API",
    description="18+ content detection for text and images",
    version="3.0.0",
    docs_url="/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# Global models
text_detector = None
violence_detector = None
gemini_analyzer = None


# Request/Response Models
class TextRequest(BaseModel):
    text: str

class TextResponse(BaseModel):
    text: str
    status: str  # VIOLATED or NON-VIOLATED
    is_violated: bool
    confidence: float
    description: str

class ImageResponse(BaseModel):
    status: str  # VIOLATED or NON-VIOLATED
    is_violated: bool
    violence_detected: bool
    gemini_status: str
    description: str

class HealthResponse(BaseModel):
    status: str
    text_model: str
    violence_model: str
    gemini_model: str


@app.on_event("startup")
async def load_models():
    global text_detector, violence_detector, gemini_analyzer
    print("\n🚀 Loading AI models...")
    print("[1/3] Loading Text Detector...")
    text_detector = HarassmentDetector()
    print("[2/3] Loading Violence Detector...")
    violence_detector = ViolenceDetector()
    print("[3/3] Loading Gemini Analyzer...")
    gemini_analyzer = GeminiAnalyzer()
    print("\n✅ API Ready!\n")


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "SentinelAI Content Safety API",
        "version": "3.0.0",
        "endpoints": {
            "health": "/health",
            "text": "POST /analyze/text",
            "image": "POST /analyze/image",
            "docs": "/docs"
        }
    }

@app.get("/favicon.ico")
async def favicon():
    return Response(content=b"", media_type="image/x-icon")

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "text_model": "loaded" if text_detector else "not loaded",
        "violence_model": "loaded" if violence_detector else "not loaded",
        "gemini_model": "loaded" if gemini_analyzer else "not loaded"
    }


@app.post("/analyze/text", response_model=TextResponse, tags=["Analysis"])
async def analyze_text(request: TextRequest):
    """
    Analyze text content.
    Returns: VIOLATED (18+ content) or NON-VIOLATED (safe)
    """
    if not text_detector:
        raise HTTPException(status_code=503, detail="Model not loaded")
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    result = text_detector.predict(request.text)
    
    # If harassment probability >= 60%, mark as VIOLATED
    is_violated = result["harassment_prob"] >= 0.60
    
    return {
        "text": request.text,
        "status": "VIOLATED" if is_violated else "NON-VIOLATED",
        "is_violated": is_violated,
        "confidence": result["confidence"],
        "description": "Content not suitable for under 18" if is_violated else "Content is safe"
    }


@app.post("/analyze/image", response_model=ImageResponse, tags=["Analysis"])
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze image content using Violence Detector + Gemini.
    Returns: VIOLATED (18+ content) or NON-VIOLATED (safe)
    """
    if not violence_detector or not gemini_analyzer:
        raise HTTPException(status_code=503, detail="Models not loaded")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
        
        # Step 1: Local violence detection (fast)
        violence_result = violence_detector.predict(image)
        
        # Step 2: Gemini analysis (detailed)
        gemini_result = gemini_analyzer.analyze_image(image)
        
        # Final decision: VIOLATED if either detects 18+ content
        violence_detected = violence_result["is_violent"]
        gemini_violated = gemini_result.get("is_violated", False)
        
        is_violated = violence_detected or gemini_violated
        
        return {
            "status": "VIOLATED" if is_violated else "NON-VIOLATED",
            "is_violated": is_violated,
            "violence_detected": violence_detected,
            "gemini_status": gemini_result.get("status", "UNKNOWN"),
            "description": "Content not suitable for under 18" if is_violated else "Content is safe for all ages"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
