# gemini_analyzer.py
# Gemini Vision API - Simple 18+ content detection

import base64
import requests
from PIL import Image
from io import BytesIO
from typing import List


class GeminiAnalyzer:
    """Check if image content is appropriate for under 18."""
    
    def __init__(self, api_keys: List[str] = None):
        self.api_keys = api_keys or [
            "AIzaSyBF8UGyfdDnemBQ9xkavjjECjc937VA6xc",
            "AIzaSyATdOeX2rL18rrOn0hBAcyeRcRI0VlCbNs",
            "AIzaSyCkpI5wF_IMtBPnL9afoyF188gB2tAbxi4",
            "AIzaSyCiocMJvg-ACPzSm4l1hrudCNhxrmgbkoM"
        ]
        self.current_key_index = 0
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.model = "gemini-2.0-flash-exp"
        print(f"Gemini Analyzer ready with {len(self.api_keys)} API keys")
    
    @property
    def current_key(self) -> str:
        return self.api_keys[self.current_key_index]
    
    def rotate_key(self):
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        print(f"🔄 Switched to API key {self.current_key_index + 1}")
    
    def _encode_image(self, image: Image.Image) -> str:
        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=85)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")
    
    def analyze_image(self, image: Image.Image) -> dict:
        """
        Check if image is appropriate for under 18.
        Returns: VIOLATED (18+ content) or NON-VIOLATED (safe)
        """
        prompt = """You are a content moderator. Analyze this image and determine if it contains content NOT suitable for persons under 18 years old.

18+ content includes:
- Violence, gore, blood, weapons being used
- Nudity, sexual content, explicit material
- Drug use, alcohol abuse
- Hate symbols, extreme discrimination
- Self-harm, suicide related content
- Graphic accidents or disturbing imagery

Respond with ONLY one of these two words:
- VIOLATED (if image contains 18+ content)
- NON-VIOLATED (if image is safe for all ages)

Just respond with one word: VIOLATED or NON-VIOLATED"""
        
        image_data = self._encode_image(image.convert("RGB"))
        
        for _ in range(len(self.api_keys)):
            response = self._call_api(image_data, prompt)
            if response["success"]:
                return self._parse_response(response["text"])
            elif "429" in str(response.get("error", "")) or "quota" in str(response.get("error", "")).lower():
                self.rotate_key()
            else:
                # Return the error for other cases
                return {
                    "status": "ERROR",
                    "is_violated": False,
                    "description": response.get("error", "Unknown error")
                }
        
        return {"status": "ERROR", "is_violated": False, "description": "All API keys exhausted"}
    
    def _call_api(self, image_base64: str, prompt: str) -> dict:
        url = f"{self.base_url}/{self.model}:generateContent?key={self.current_key}"
        
        payload = {
            "contents": [{"parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": "image/jpeg", "data": image_base64}}
            ]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 50}
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code == 200:
                text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
                return {"success": True, "text": text.strip()}
            return {"success": False, "error": f"{response.status_code}: {response.text[:300]}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _parse_response(self, text: str) -> dict:
        """Parse simple VIOLATED / NON-VIOLATED response."""
        text_upper = text.upper().strip()
        
        if "VIOLATED" in text_upper and "NON" not in text_upper:
            return {
                "status": "VIOLATED",
                "is_violated": True,
                "description": "Content not suitable for under 18"
            }
        else:
            return {
                "status": "NON-VIOLATED", 
                "is_violated": False,
                "description": "Content is safe for all ages"
            }
