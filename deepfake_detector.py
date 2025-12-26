# deepfake_detector.py
# Detects if an image is AI-generated or deepfake

import os
import requests
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class DeepfakeDetector:
    """
    AI-generated/Deepfake image detection.
    Uses Hugging Face Inference API with multiple model fallbacks.
    """
    
    # Models in order of preference
    MODELS = [
        "umm-maybe/AI-image-detector",
        "Organika/sdxl-detector",
    ]
    
    def __init__(self, use_api: bool = True):
        self.use_api = use_api
        self.hf_token = os.getenv("HF_TOKEN")
        self.model = None
        print("Deepfake Detector initialized!")
    
    def detect(self, image_path: str) -> dict:
        """
        Detect if an image is AI-generated/deepfake.
        
        Returns:
            {
                "is_deepfake": bool,
                "confidence": float,
                "label": str
            }
        """
        if not os.path.exists(image_path):
            return {"error": f"File not found: {image_path}"}
        
        if self.use_api:
            return self._detect_via_api(image_path)
        else:
            return self._detect_local(image_path)
    
    def _detect_via_api(self, image_path: str) -> dict:
        """Use Hugging Face Inference API with fallback models."""
        
        with open(image_path, "rb") as f:
            image_data = f.read()
        
        headers = {"Content-Type": "application/octet-stream"}
        if self.hf_token:
            headers["Authorization"] = f"Bearer {self.hf_token}"
        
        # Try each model until one works
        for model_name in self.MODELS:
            api_url = f"https://router.huggingface.co/hf-inference/models/{model_name}"
            
            try:
                print(f"Trying model: {model_name}")
                response = requests.post(
                    api_url,
                    headers=headers,
                    data=image_data,
                    timeout=60
                )
                
                if response.status_code == 200:
                    results = response.json()
                    return self._parse_results(results, model_name)
                
                elif response.status_code == 503:
                    print(f"  Model {model_name} is loading, trying next...")
                    continue
                else:
                    print(f"  Model {model_name} failed: {response.status_code}")
                    continue
                    
            except Exception as e:
                print(f"  Error with {model_name}: {e}")
                continue
        
        return {
            "is_deepfake": None,
            "confidence": 0,
            "error": "All models failed. Try again later or use --local mode."
        }
    
    def _parse_results(self, results: list, model_name: str) -> dict:
        """Parse results from different model formats."""
        
        ai_score = 0
        real_score = 0
        
        for item in results:
            label = item.get("label", "").lower()
            score = item.get("score", 0)
            
            # Different models use different labels
            if any(x in label for x in ["artificial", "ai", "fake", "generated", "synthetic"]):
                ai_score = max(ai_score, score)
            elif any(x in label for x in ["real", "human", "authentic", "natural"]):
                real_score = max(real_score, score)
        
        # Determine result
        is_deepfake = ai_score > real_score
        confidence = ai_score if is_deepfake else real_score
        
        return {
            "is_deepfake": is_deepfake,
            "confidence": round(confidence, 4),
            "ai_score": round(ai_score, 4),
            "real_score": round(real_score, 4),
            "model_used": model_name,
            "label": "AI-GENERATED" if is_deepfake else "REAL"
        }
    
    def _detect_local(self, image_path: str) -> dict:
        """Local detection using transformers."""
        try:
            from transformers import pipeline
            
            if self.model is None:
                print("Loading local AI detection model...")
                # Try multiple models
                models_to_try = [
                    "Organika/sdxl-detector",
                    "umm-maybe/AI-image-detector"
                ]
                
                for model_name in models_to_try:
                    try:
                        self.model = pipeline(
                            "image-classification",
                            model=model_name
                        )
                        self.local_model_name = model_name
                        print(f"Loaded: {model_name}")
                        break
                    except Exception as e:
                        print(f"Failed to load {model_name}: {e}")
                        continue
            
            if self.model is None:
                return {"error": "Could not load any detection model"}
            
            results = self.model(image_path)
            return self._parse_results(results, self.local_model_name)
            
        except ImportError:
            return {"error": "Install: pip install transformers torch"}
        except Exception as e:
            return {"error": str(e)}


if __name__ == "__main__":
    import sys
    
    # Check for --local flag
    use_local = "--local" in sys.argv
    if use_local:
        sys.argv.remove("--local")
    
    detector = DeepfakeDetector(use_api=not use_local)
    
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        print(f"\nAnalyzing: {image_path}\n")
        result = detector.detect(image_path)
        
        if result.get("is_deepfake") is not None:
            print(f"\n{'='*40}")
            print(f"RESULT: {result['label']}")
            print(f"Confidence: {result['confidence']*100:.1f}%")
            print(f"AI Score: {result.get('ai_score', 0)*100:.1f}%")
            print(f"Real Score: {result.get('real_score', 0)*100:.1f}%")
            print(f"Model: {result.get('model_used', 'unknown')}")
            print(f"{'='*40}")
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")
    else:
        print("Usage: python deepfake_detector.py <image_path>")
