# violence_detector.py
# Violence detection using ViT model (98.8% accuracy)
# Model: jaranohaal/vit-base-violence-detection

from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch


class ViolenceDetector:
    """Detect violence in images using fine-tuned ViT model."""
    
    def __init__(self, model_name: str = "jaranohaal/vit-base-violence-detection", device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model_name = model_name
        
        print(f"Loading violence detection model: {model_name}...")
        self.processor = AutoImageProcessor.from_pretrained(model_name)
        self.model = AutoModelForImageClassification.from_pretrained(model_name).to(self.device)
        self.model.eval()
        
        # Label mapping: LABEL_0 = Non-Violence, LABEL_1 = Violence
        self.label_map = {0: "Non-Violence", 1: "Violence"}
        print(f"Violence detector loaded!")
    
    def predict(self, image: Image.Image) -> dict:
        """Predict if image contains violence."""
        inputs = self.processor(image, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits[0]
        
        probs = torch.softmax(logits, dim=0).cpu().numpy()
        pred_idx = int(probs.argmax())
        
        violence_prob = float(probs[1]) if len(probs) > 1 else 0.0
        
        return {
            "is_violent": pred_idx == 1,
            "violence_prob": violence_prob,
            "non_violence_prob": float(probs[0]),
            "label": self.label_map.get(pred_idx, f"LABEL_{pred_idx}"),
            "confidence": float(probs[pred_idx])
        }
