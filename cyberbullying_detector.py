# cyberbullying_detector.py
# Unified Cyberbullying Detection System
# 
# FLOW:
# - Text Input -> Text Toxicity Model -> Result
# - Image Input -> Deepfake Check:
#     - If Deepfake -> Return "Image is Deepfake"
#     - If Not Deepfake -> Image Captioner -> Text Toxicity Model -> Result

import os
from typing import Optional, Union
from pathlib import Path

from text_toxicity import HarassmentDetector
from image_captioner import ImageCaptioner, analyze_for_threats
from deepfake_detector import DeepfakeDetector


class CyberbullyingDetector:
    """
    Unified Cyberbullying Detection System.
    
    Pipeline:
    - Text: Direct analysis via text toxicity model
    - Image: Deepfake check first, then caption and analyze
    """
    
    def __init__(self, use_onnx: bool = True, use_api: bool = True, verbose: bool = True):
        """
        Initialize all detection models.
        
        Args:
            use_onnx: Use ONNX for text toxicity (faster)
            use_api: Use API for image models
            verbose: Print progress messages
        """
        self.verbose = verbose
        self._log("Initializing Cyberbullying Detector...")
        
        # Load models
        self._log("Loading Text Toxicity Model...")
        self.text_detector = HarassmentDetector(use_onnx=use_onnx)
        
        self._log("Loading Image Captioner...")
        self.image_captioner = ImageCaptioner(use_api=use_api, verbose=verbose)
        
        self._log("Loading Deepfake Detector...")
        self.deepfake_detector = DeepfakeDetector(use_api=use_api)
        
        self._log("All models loaded!")
    
    def _log(self, message: str):
        """Print if verbose mode enabled."""
        if self.verbose:
            print(message)
    
    def analyze(
        self, 
        text: Optional[str] = None, 
        image_path: Optional[str] = None,
        threshold: float = 0.65
    ) -> dict:
        """
        Main analysis method - handles both text and image inputs.
        
        Args:
            text: Text to analyze (optional)
            image_path: Path to image file (optional)
            threshold: Harassment detection threshold
            
        Returns:
            {
                "input_type": "text" | "image",
                "is_cyberbullying": bool,
                "is_deepfake": bool (for images),
                "label": str,
                "confidence": float,
                "details": dict
            }
        """
        # Validate input
        if not text and not image_path:
            return {
                "error": "No input provided. Please provide text or image_path.",
                "is_cyberbullying": False
            }
        
        # If image is provided, process image first
        if image_path:
            return self._analyze_image(image_path, threshold)
        
        # If only text is provided, analyze text directly
        return self._analyze_text(text, threshold)
    
    def _analyze_text(self, text: str, threshold: float = 0.65) -> dict:
        """
        Analyze text directly through text toxicity model.
        Also checks for threatening keywords.
        
        Args:
            text: Text to analyze
            threshold: Harassment detection threshold
            
        Returns:
            Detection result with is_cyberbullying, label, confidence
        """
        self._log(f"Analyzing text: '{text[:50]}...'")
        
        result = self.text_detector.predict(text, threshold=threshold)
        
        # Also check for threatening keywords (like we do for images)
        threat_analysis = analyze_for_threats(text)
        
        is_harassment = result["is_harassment"]
        # Only trigger on threat keywords if score is significant (>0.2)
        # This catches "I will kill you" but ignores minor keyword matches
        has_threats = threat_analysis["threat_score"] > 0.2
        is_cyberbullying = is_harassment or has_threats
        
        # Determine label
        if is_harassment and has_threats:
            label = "HARASSMENT + THREATS"
        elif is_harassment:
            label = "HARASSMENT"
        elif has_threats:
            label = "THREATENING"
        else:
            label = "SAFE"
        
        return {
            "input_type": "text",
            "is_cyberbullying": is_cyberbullying,
            "is_deepfake": False,  # Not applicable for text
            "label": label,
            "confidence": result["confidence"],
            "harassment_prob": result["harassment_prob"],
            "safe_prob": result["safe_prob"],
            "threat_score": threat_analysis["threat_score"],
            "details": {
                "has_negation": result.get("has_negation", False),
                "has_regional_slur": result.get("has_regional_slur", False),
                "threat_keywords": threat_analysis.get("keywords_found", []),
                "threshold": threshold
            }
        }
    
    def _analyze_image(self, image_path: str, threshold: float = 0.65) -> dict:
        """
        Analyze image through the pipeline:
        1. Check if deepfake
        2. If deepfake -> return deepfake result
        3. If not deepfake -> caption image -> analyze caption for toxicity
        
        Args:
            image_path: Path to image file
            threshold: Harassment detection threshold
            
        Returns:
            Detection result
        """
        # Validate file exists
        if not os.path.exists(image_path):
            return {
                "error": f"Image file not found: {image_path}",
                "is_cyberbullying": False,
                "is_deepfake": False
            }
        
        self._log(f"Analyzing image: {image_path}")
        
        # STEP 1: Check if image is a deepfake
        self._log("Step 1: Checking for deepfake...")
        deepfake_result = self.deepfake_detector.detect(image_path)
        
        is_deepfake = deepfake_result.get("is_deepfake", False)
        deepfake_confidence = deepfake_result.get("confidence", 0)
        
        # If deepfake detected with high confidence, return immediately
        if is_deepfake and deepfake_confidence > 0.6:
            self._log(f"DEEPFAKE DETECTED! Confidence: {deepfake_confidence*100:.1f}%")
            return {
                "input_type": "image",
                "is_cyberbullying": True,  # Deepfakes are considered cyberbullying/harmful
                "is_deepfake": True,
                "label": "DEEPFAKE DETECTED",
                "confidence": deepfake_confidence,
                "message": "This image appears to be AI-generated or manipulated (deepfake).",
                "details": {
                    "deepfake_confidence": deepfake_confidence,
                    "ai_score": deepfake_result.get("ai_score", 0),
                    "real_score": deepfake_result.get("real_score", 0),
                    "model_used": deepfake_result.get("model_used", "unknown")
                }
            }
        
        # STEP 2: Not a deepfake, generate caption
        self._log("Step 2: Image is real. Generating caption...")
        caption_result = self.image_captioner.caption(image_path, detailed=True)
        
        if not caption_result.get("success"):
            return {
                "input_type": "image",
                "is_cyberbullying": False,
                "is_deepfake": False,
                "label": "ANALYSIS FAILED",
                "error": caption_result.get("error", "Failed to caption image"),
                "confidence": 0
            }
        
        caption = caption_result["caption"]
        self._log(f"Caption: {caption}")
        
        # STEP 3: Analyze caption with text toxicity model ONLY
        # NOTE: We do NOT use keyword detection for AI-generated captions
        # because the AI often uses words like "no violence", "non-threatening"
        # which would trigger false positives with keyword matching
        self._log("Step 3: Analyzing caption for harassment...")
        toxicity_result = self.text_detector.predict(caption, threshold=threshold)
        
        # For image captions, rely ONLY on ML model - no keyword detection
        # The ML model is trained to understand context properly
        is_harassment = toxicity_result["is_harassment"]
        is_cyberbullying = is_harassment
        
        # Determine label based only on ML model result
        if is_harassment:
            label = "HARASSMENT DETECTED"
        else:
            label = "SAFE"
        
        return {
            "input_type": "image",
            "is_cyberbullying": is_cyberbullying,
            "is_deepfake": False,
            "label": label,
            "caption": caption,
            "confidence": toxicity_result["confidence"],
            "harassment_prob": toxicity_result["harassment_prob"],
            "safe_prob": toxicity_result["safe_prob"],
            "details": {
                "caption_model": caption_result.get("model_used", "unknown"),
                "threshold": threshold
            }
        }
    
    # Convenience methods
    def check_text(self, text: str, threshold: float = 0.65) -> dict:
        """Shortcut to analyze text."""
        return self.analyze(text=text, threshold=threshold)
    
    def check_image(self, image_path: str, threshold: float = 0.65) -> dict:
        """Shortcut to analyze image."""
        return self.analyze(image_path=image_path, threshold=threshold)


def main():
    """Interactive testing mode."""
    print("=" * 60)
    print("CYBERBULLYING DETECTION SYSTEM")
    print("=" * 60)
    print("\nPipeline:")
    print("  Text -> Text Toxicity Model -> Result")
    print("  Image -> Deepfake Check -> Caption -> Toxicity -> Result")
    print("-" * 60)
    
    detector = CyberbullyingDetector()
    
    print("\nCommands:")
    print("  text <message>  - Analyze text")
    print("  image <path>    - Analyze image")
    print("  quit            - Exit")
    print("-" * 60)
    
    while True:
        try:
            user_input = input("\n> ").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() in ["quit", "exit", "q"]:
                print("Goodbye!")
                break
            
            parts = user_input.split(maxsplit=1)
            command = parts[0].lower()
            
            if command == "text" and len(parts) >= 2:
                text = parts[1]
                result = detector.check_text(text)
                
                print(f"\n{'='*40}")
                print(f"Result: {result['label']}")
                print(f"Is Cyberbullying: {result['is_cyberbullying']}")
                print(f"Confidence: {result['confidence']*100:.1f}%")
                print(f"Harassment Prob: {result['harassment_prob']*100:.1f}%")
                print(f"{'='*40}")
                
            elif command == "image" and len(parts) >= 2:
                image_path = parts[1]
                result = detector.check_image(image_path)
                
                print(f"\n{'='*40}")
                if result.get("is_deepfake"):
                    print(f"⚠️  DEEPFAKE DETECTED!")
                    print(f"Confidence: {result['confidence']*100:.1f}%")
                    print(result.get("message", ""))
                else:
                    print(f"Result: {result['label']}")
                    print(f"Caption: {result.get('caption', 'N/A')}")
                    print(f"Is Cyberbullying: {result['is_cyberbullying']}")
                    if result.get("threat_score"):
                        print(f"Threat Score: {result['threat_score']*100:.1f}%")
                print(f"{'='*40}")
                
            else:
                print("Usage: text <message> | image <path>")
                
        except KeyboardInterrupt:
            print("\n\nInterrupted. Goodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    main()
