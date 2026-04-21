# text_toxicity.py
# Harassment detection using fine-tuned ONNX model

import sys
import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer
from pathlib import Path

MODEL_DIR = Path(__file__).parent / "model"
FINE_TUNED_DIR = MODEL_DIR / "fine_tuned"
ONNX_MODEL = MODEL_DIR / "toxicity.onnx"
MAX_LEN = 128


class HarassmentDetector:
    """Detect harassment in text using fine-tuned model."""
    
    def __init__(self, use_onnx: bool = True):
        self.use_onnx = use_onnx and ONNX_MODEL.exists()
        
        tokenizer_path = FINE_TUNED_DIR if FINE_TUNED_DIR.exists() else "microsoft/xtremedistil-l6-h384-uncased"
        print(f"Loading tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)
        
        if self.use_onnx:
            print(f"Loading ONNX model: {ONNX_MODEL}")
            self.session = ort.InferenceSession(str(ONNX_MODEL), providers=["CPUExecutionProvider"])
        else:
            print(f"Loading PyTorch model: {FINE_TUNED_DIR}")
            from transformers import AutoModelForSequenceClassification
            import torch
            self.model = AutoModelForSequenceClassification.from_pretrained(FINE_TUNED_DIR)
            self.model.eval()
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.model.to(self.device)
        
        print("Text model loaded!")

    def predict(self, text: str) -> dict:
        """Predict if text contains harassment."""
        enc = self.tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=MAX_LEN,
            return_tensors="pt" if not self.use_onnx else "np"
        )
        
        if self.use_onnx:
            outputs = self.session.run(
                None,
                {
                    "input_ids": enc["input_ids"].astype(np.int64),
                    "attention_mask": enc["attention_mask"].astype(np.int64)
                }
            )
            logits = outputs[0][0]
        else:
            import torch
            with torch.no_grad():
                enc = {k: v.to(self.device) for k, v in enc.items()}
                outputs = self.model(**enc)
                logits = outputs.logits[0].cpu().numpy()
        
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / exp_logits.sum()
        
        pred_class = np.argmax(probs)
        confidence = probs[pred_class]
        is_harassment = pred_class == 1
        
        return {
            "is_harassment": is_harassment,
            "confidence": float(confidence),
            "label": "HARASSMENT" if is_harassment else "SAFE",
            "safe_prob": float(probs[0]),
            "harassment_prob": float(probs[1])
        }
