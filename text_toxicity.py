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

    def predict(self, text: str, threshold: float = 0.65) -> dict:
        """Predict if text contains harassment with adjustable threshold.
        
        Args:
            text: Input text to analyze
            threshold: Minimum confidence (0-1) to classify as harassment. 
                      Default 0.65 reduces false positives.
        """
        # Check for negation patterns that reduce harassment likelihood
        text_lower = text.lower()
        negation_patterns = [
            "not ", "don't ", "dont ", "didn't ", "didnt ", 
            "won't ", "wont ", "wouldn't ", "wouldnt ",
            "never ", "no ", "cannot ", "can't ", "cant "
        ]
        has_negation = any(pattern in text_lower for pattern in negation_patterns)
        
        # Hindi/regional slang keywords that should be flagged
        regional_offensive = [
            "mota", "motapa", "moti",  # Fat in Hindi
            "kala", "kali",  # Black (often used offensively)
            "pagal", "pagli",  # Crazy
            "chutiya", "chutiye",  # Common Hindi slur
            "gandu", "gandi",  # Offensive terms
            "randi", "harami",  # Vulgar terms
        ]
        has_regional_slur = any(slur in text_lower for slur in regional_offensive)
        
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
        
        harassment_prob = float(probs[1])
        safe_prob = float(probs[0])
        
        # Apply contextual rules
        if has_negation:
            # Reduce harassment probability for negations
            harassment_prob *= 0.5
            safe_prob = 1 - harassment_prob
        
        if has_regional_slur:
            # Boost harassment probability for regional offensive terms
            harassment_prob = min(harassment_prob * 1.5, 0.95)
            safe_prob = 1 - harassment_prob
        
        # Use threshold instead of simple argmax
        is_harassment = harassment_prob >= threshold
        confidence = harassment_prob if is_harassment else safe_prob
        
        return {
            "is_harassment": is_harassment,
            "confidence": float(confidence),
            "label": "HARASSMENT" if is_harassment else "SAFE",
            "safe_prob": float(safe_prob),
            "harassment_prob": float(harassment_prob),
            "has_negation": has_negation,
            "has_regional_slur": has_regional_slur,
            "threshold": threshold
        }


def main():
    """Interactive mode: get sentence input and predict toxicity."""
    print("=" * 50)
    print("Text Toxicity/Harassment Detector")
    print("=" * 50)
    
    # Initialize the detector
    detector = HarassmentDetector()
    
    print("\nReady! Enter a sentence to analyze (or 'quit' to exit)\n")
    
    while True:
        try:
            sentence = input("Enter text: ").strip()
            
            if sentence.lower() in ['quit', 'exit', 'q']:
                print("Goodbye!")
                break
            
            if not sentence:
                print("Please enter a valid sentence.\n")
                continue
            
            # Get prediction
            result = detector.predict(sentence)
            
            # Display results
            print("\n" + "-" * 40)
            print(f"Input: {sentence}")
            print(f"Label: {result['label']}")
            print(f"Confidence: {result['confidence']:.2%}")
            print(f"Safe Probability: {result['safe_prob']:.2%}")
            print(f"Harassment Probability: {result['harassment_prob']:.2%}")
            print(f"Threshold: {result['threshold']:.2%}")
            if result.get('has_negation'):
                print("⚠️  Negation detected (reduced harassment score)")
            if result.get('has_regional_slur'):
                print("🚨 Regional offensive term detected")
            print("-" * 40 + "\n")
            
        except KeyboardInterrupt:
            print("\n\nInterrupted. Goodbye!")
            break
        except Exception as e:
            print(f"Error: {e}\n")


if __name__ == "__main__":
    main()
