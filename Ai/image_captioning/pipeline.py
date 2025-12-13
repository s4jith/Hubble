# pipeline.py
# Image → Caption → Toxicity Analysis Pipeline
# Combines BLIP captioning with text harassment detection

import sys
import os
from pathlib import Path
from PIL import Image

# Add parent directory for text_toxicity imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from model import BlipCaptioner
from text_toxicity.inference import HarassmentDetector


class ImageHarmDetector:
    """Detect harmful content in images via caption analysis."""
    
    def __init__(self):
        """Initialize both BLIP captioner and harassment detector."""
        print("=" * 50)
        print("Loading Image Harm Detection Pipeline")
        print("=" * 50)
        
        print("\n[1/2] Loading BLIP Image Captioner...")
        self.captioner = BlipCaptioner()
        
        print("\n[2/2] Loading Harassment Detector...")
        self.detector = HarassmentDetector()
        
        print("\n✅ Pipeline ready!")
        print("=" * 50)
    
    def analyze_image(self, image_path: str) -> dict:
        """
        Analyze an image for harmful content.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            dict with caption, toxicity analysis, and final verdict
        """
        # Step 1: Load image
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        image = Image.open(image_path).convert("RGB")
        
        # Step 2: Generate caption
        caption = self.captioner.generate_caption(image)
        
        # Step 3: Analyze caption for harassment
        toxicity_result = self.detector.predict(caption)
        
        # Final result
        result = {
            "image_path": image_path,
            "caption": caption,
            "is_harmful": toxicity_result["is_harassment"],
            "label": "HARMFUL" if toxicity_result["is_harassment"] else "SAFE",
            "confidence": toxicity_result["confidence"],
            "safe_prob": toxicity_result["safe_prob"],
            "harmful_prob": toxicity_result["harassment_prob"]
        }
        
        return result
    
    def analyze_pil_image(self, image: Image.Image) -> dict:
        """Analyze a PIL Image object for harmful content."""
        caption = self.captioner.generate_caption(image)
        toxicity_result = self.detector.predict(caption)
        
        return {
            "caption": caption,
            "is_harmful": toxicity_result["is_harassment"],
            "label": "HARMFUL" if toxicity_result["is_harassment"] else "SAFE",
            "confidence": toxicity_result["confidence"],
            "safe_prob": toxicity_result["safe_prob"],
            "harmful_prob": toxicity_result["harassment_prob"]
        }
    
    def display_result(self, result: dict):
        """Pretty print the analysis result."""
        print("\n" + "=" * 50)
        print("📷 IMAGE ANALYSIS RESULT")
        print("=" * 50)
        
        if "image_path" in result:
            print(f"Image: {result['image_path']}")
        
        print(f"\n📝 Caption: \"{result['caption']}\"")
        print("-" * 50)
        
        if result["is_harmful"]:
            print(f"🔴 VERDICT: {result['label']}")
            bar = "█" * int(result['harmful_prob'] * 20)
            print(f"   Harmful: [{bar:20s}] {result['harmful_prob']:.1%}")
        else:
            print(f"🟢 VERDICT: {result['label']}")
            bar = "█" * int(result['safe_prob'] * 20)
            print(f"   Safe:    [{bar:20s}] {result['safe_prob']:.1%}")
        
        print(f"   Confidence: {result['confidence']:.1%}")
        print("=" * 50)


def main():
    """Command-line interface for image harm detection."""
    if len(sys.argv) < 2:
        print("Usage: python pipeline.py <image_path>")
        print("Example: python pipeline.py test-images/sample.jpg")
        return
    
    image_path = sys.argv[1]
    
    # Initialize pipeline
    pipeline = ImageHarmDetector()
    
    # Analyze image
    result = pipeline.analyze_image(image_path)
    
    # Display result
    pipeline.display_result(result)


if __name__ == "__main__":
    main()
