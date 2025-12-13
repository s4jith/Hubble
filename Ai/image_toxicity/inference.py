# inference.py
# Cyberbullying Image Detection
# 3-class: safe, nsfw, violence
# Detects harmful images sent as harassment

import sys
import numpy as np
from pathlib import Path
from PIL import Image
import onnxruntime as ort

MODEL_DIR = Path(__file__).parent / "model"
ONNX_MODEL = MODEL_DIR / "cyberbullying.onnx"
CLASS_NAMES = ["safe", "nsfw", "violence"]
THREAT_CLASSES = {"nsfw", "violence"}


class CyberbullyingDetector:
    """Detect cyberbullying content in images."""
    
    def __init__(self, model_path: str = None):
        self.model_path = Path(model_path) if model_path else ONNX_MODEL
        
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model not found: {self.model_path}\n"
                "Run 'python train.py' then 'python export.py' first."
            )
        
        print(f"Loading model: {self.model_path}")
        self.session = ort.InferenceSession(str(self.model_path), providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name
        print("Model loaded!\n")
    
    def preprocess(self, image_path: str) -> np.ndarray:
        """Preprocess image for MobileNetV2."""
        image = Image.open(image_path).convert("RGB")
        image = image.resize((224, 224))
        
        img_array = np.array(image).astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        img_array = (img_array - mean) / std
        
        img_array = img_array.transpose(2, 0, 1)
        img_array = np.expand_dims(img_array, 0).astype(np.float32)
        
        return img_array
    
    def predict(self, image_path: str) -> dict:
        """Predict image content type."""
        pixel_values = self.preprocess(image_path)
        
        outputs = self.session.run(None, {self.input_name: pixel_values})
        logits = outputs[0][0]
        
        # Softmax
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / exp_logits.sum()
        
        pred_class = np.argmax(probs)
        pred_name = CLASS_NAMES[pred_class]
        confidence = probs[pred_class]
        
        is_threat = pred_name in THREAT_CLASSES
        
        return {
            "prediction": pred_name,
            "is_threat": is_threat,
            "confidence": float(confidence),
            "probabilities": {name: float(probs[i]) for i, name in enumerate(CLASS_NAMES)}
        }
    
    def analyze(self, image_path: str) -> dict:
        """Analyze image and print formatted results."""
        result = self.predict(image_path)
        
        print(f'Input: "{Path(image_path).name}"')
        print("-" * 50)
        
        # Show all probabilities
        for name in CLASS_NAMES:
            prob = result["probabilities"][name]
            bar = "█" * int(prob * 20)
            if name == result["prediction"]:
                print(f"→ {name:10s} [{bar:20s}] {prob:.1%}")
            else:
                print(f"  {name:10s} [{bar:20s}] {prob:.1%}")
        
        print("-" * 50)
        
        # Threat assessment
        if result["is_threat"]:
            if result["prediction"] == "nsfw":
                print("🔴 THREAT DETECTED: NSFW/Explicit Content")
                print("   This may be harassment or inappropriate content")
            else:
                print("🔴 THREAT DETECTED: Violence/Gore")
                print("   This may be a threat or intimidation")
        else:
            print("🟢 SAFE: No harmful content detected")
        
        print(f"\nConfidence: {result['confidence']:.1%}")
        
        return result


def main():
    """CLI for cyberbullying image detection."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Cyberbullying Image Detection")
    parser.add_argument("image", nargs="?", help="Path to image")
    args = parser.parse_args()
    
    if not ONNX_MODEL.exists():
        print("❌ Model not found!")
        print("Run 'python train.py' then 'python export.py' first.")
        return
    
    detector = CyberbullyingDetector()
    
    if args.image:
        if not Path(args.image).exists():
            print(f"Error: File not found: {args.image}")
            return
        detector.analyze(args.image)
        return
    
    # Interactive mode
    print("=" * 50)
    print("Cyberbullying Image Detector")
    print("Detects: NSFW, Violence, Safe content")
    print("Enter image path or 'quit' to exit")
    print("=" * 50)
    
    while True:
        try:
            path = input("\nImage path: ").strip()
            if path.lower() in ("quit", "exit", "q"):
                print("Goodbye!")
                break
            if not path:
                continue
            if not Path(path).exists():
                print(f"File not found: {path}")
                continue
            
            print()
            detector.analyze(path)
            
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    main()
