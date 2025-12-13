# pipeline.py
# Image → Caption → Toxicity Analysis Pipeline
# Combines BLIP captioning with text harassment detection
# Includes threshold-based classification with severity levels

import sys
import os
from pathlib import Path
from PIL import Image

# Add parent directory for text_toxicity imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from model import BlipCaptioner
from text_toxicity.inference import HarassmentDetector


# Threshold Configuration
THRESHOLDS = {
    "HARMFUL": 0.85,      # > 85% harmful = HARMFUL
    "SAFE": 0.85,         # > 85% safe = SAFE
    # Below thresholds = NEUTRAL with levels
}


def classify_result(harmful_prob: float, safe_prob: float) -> dict:
    """
    Classify based on probability thresholds.
    
    Returns:
        dict with label, level, severity, and color code
    """
    if harmful_prob >= THRESHOLDS["HARMFUL"]:
        return {
            "label": "HARMFUL",
            "level": 3,
            "severity": "HIGH",
            "emoji": "🔴",
            "description": "High-risk harmful content detected"
        }
    elif safe_prob >= THRESHOLDS["SAFE"]:
        return {
            "label": "SAFE",
            "level": 0,
            "severity": "NONE",
            "emoji": "🟢",
            "description": "Content is safe"
        }
    elif harmful_prob >= 0.70:
        return {
            "label": "NEUTRAL",
            "level": 2,
            "severity": "MEDIUM",
            "emoji": "🟠",
            "description": "Potentially concerning - review recommended"
        }
    elif harmful_prob >= 0.50:
        return {
            "label": "NEUTRAL",
            "level": 1,
            "severity": "LOW",
            "emoji": "🟡",
            "description": "Borderline content - may need review"
        }
    else:
        return {
            "label": "SAFE",
            "level": 0,
            "severity": "NONE",
            "emoji": "🟢",
            "description": "Content appears safe"
        }


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
            dict with caption, toxicity analysis, classification level, and verdict
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        image = Image.open(image_path).convert("RGB")
        
        # Generate caption
        caption = self.captioner.generate_caption(image)
        
        # Analyze caption for harassment
        toxicity_result = self.detector.predict(caption)
        
        # Classify with thresholds
        classification = classify_result(
            toxicity_result["harassment_prob"],
            toxicity_result["safe_prob"]
        )
        
        return {
            "image_path": image_path,
            "caption": caption,
            "safe_prob": toxicity_result["safe_prob"],
            "harmful_prob": toxicity_result["harassment_prob"],
            # Classification results
            "label": classification["label"],
            "level": classification["level"],
            "severity": classification["severity"],
            "emoji": classification["emoji"],
            "description": classification["description"],
            # Quick boolean checks
            "is_harmful": classification["label"] == "HARMFUL",
            "is_safe": classification["label"] == "SAFE",
            "is_neutral": classification["label"] == "NEUTRAL",
        }
    
    def analyze_pil_image(self, image: Image.Image) -> dict:
        """Analyze a PIL Image object for harmful content."""
        caption = self.captioner.generate_caption(image)
        toxicity_result = self.detector.predict(caption)
        
        classification = classify_result(
            toxicity_result["harassment_prob"],
            toxicity_result["safe_prob"]
        )
        
        return {
            "caption": caption,
            "safe_prob": toxicity_result["safe_prob"],
            "harmful_prob": toxicity_result["harassment_prob"],
            "label": classification["label"],
            "level": classification["level"],
            "severity": classification["severity"],
            "emoji": classification["emoji"],
            "description": classification["description"],
            "is_harmful": classification["label"] == "HARMFUL",
            "is_safe": classification["label"] == "SAFE",
            "is_neutral": classification["label"] == "NEUTRAL",
        }
    
    def display_result(self, result: dict):
        """Pretty print the analysis result."""
        print("\n" + "=" * 55)
        print("📷 IMAGE ANALYSIS RESULT")
        print("=" * 55)
        
        if "image_path" in result:
            print(f"Image: {result['image_path']}")
        
        print(f"\n📝 Caption: \"{result['caption']}\"")
        print("-" * 55)
        
        # Show verdict with level
        emoji = result["emoji"]
        label = result["label"]
        level = result["level"]
        severity = result["severity"]
        
        if result["is_harmful"]:
            print(f"{emoji} VERDICT: {label} (Level {level} - {severity})")
            bar = "█" * int(result['harmful_prob'] * 20)
            print(f"   Harmful Score: [{bar:20s}] {result['harmful_prob']:.1%}")
        elif result["is_neutral"]:
            print(f"{emoji} VERDICT: {label} (Level {level} - {severity})")
            bar_h = "█" * int(result['harmful_prob'] * 20)
            bar_s = "█" * int(result['safe_prob'] * 20)
            print(f"   Harmful Score: [{bar_h:20s}] {result['harmful_prob']:.1%}")
            print(f"   Safe Score:    [{bar_s:20s}] {result['safe_prob']:.1%}")
        else:
            print(f"{emoji} VERDICT: {label} (Level {level})")
            bar = "█" * int(result['safe_prob'] * 20)
            print(f"   Safe Score:    [{bar:20s}] {result['safe_prob']:.1%}")
        
        print(f"\n💡 {result['description']}")
        print("=" * 55)
        
        # Return action recommendation
        if level >= 2:
            print("\n⚠️  ACTION: Content should be reviewed/flagged")
        elif level == 1:
            print("\n📋 ACTION: Consider manual review")


def main():
    """Command-line interface for image harm detection."""
    if len(sys.argv) < 2:
        print("Usage: python pipeline.py <image_path>")
        print("Example: python pipeline.py test-images/sample.jpg")
        print("\nClassification Levels:")
        print("  🟢 SAFE      (Level 0) - Safe content")
        print("  🟡 NEUTRAL   (Level 1) - Borderline, may need review")
        print("  🟠 NEUTRAL   (Level 2) - Concerning, review recommended")
        print("  🔴 HARMFUL   (Level 3) - High-risk, should be flagged")
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
