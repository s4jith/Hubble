# export.py
# Export Cyberbullying MobileNetV2 to ONNX
# 3-class: safe, nsfw, violence

import torch
import torch.nn as nn
import onnx
from torchvision import models
from pathlib import Path
import numpy as np

MODEL_DIR = Path("model")
FINE_TUNED_DIR = MODEL_DIR / "fine_tuned"
ONNX_PATH = MODEL_DIR / "cyberbullying.onnx"
NUM_CLASSES = 3
CLASS_NAMES = ["safe", "nsfw", "violence"]


class CyberbullyingMobileNet(nn.Module):
    """MobileNetV2 for 3-class cyberbullying detection."""
    
    def __init__(self, num_classes=3):
        super().__init__()
        self.base = models.mobilenet_v2(weights=None)
        
        in_features = self.base.classifier[1].in_features
        self.base.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(256, num_classes)
        )
    
    def forward(self, x):
        return self.base(x)


def export_to_onnx():
    """Export to ONNX (full precision for accuracy)."""
    MODEL_DIR.mkdir(exist_ok=True)
    
    model = CyberbullyingMobileNet(num_classes=NUM_CLASSES)
    
    # Load fine-tuned weights
    weights_path = FINE_TUNED_DIR / "model.pth"
    if weights_path.exists():
        print(f"Loading fine-tuned weights from: {weights_path}")
        model.load_state_dict(torch.load(weights_path, map_location="cpu"))
        print("✅ Fine-tuned weights loaded!")
    else:
        print("⚠️ No fine-tuned weights found. Run 'python train.py' first.")
        return
    
    model.eval()
    
    # Export
    dummy_input = torch.randn(1, 3, 224, 224)
    
    print("Exporting to ONNX (full precision, no quantization)...")
    torch.onnx.export(
        model,
        dummy_input,
        str(ONNX_PATH),
        input_names=["pixel_values"],
        output_names=["logits"],
        dynamic_axes={
            "pixel_values": {0: "batch"},
            "logits": {0: "batch"}
        },
        opset_version=14,
        do_constant_folding=True
    )
    
    # Merge external data if created
    data_file = Path(str(ONNX_PATH) + ".data")
    if data_file.exists():
        print("Merging external data...")
        onnx_model = onnx.load(str(ONNX_PATH), load_external_data=True)
        onnx.save_model(onnx_model, str(ONNX_PATH), save_as_external_data=False)
        data_file.unlink()
    
    file_size = ONNX_PATH.stat().st_size / (1024 * 1024)
    print(f"\n✅ ONNX Model Saved: {ONNX_PATH.resolve()}")
    print(f"   Size: {file_size:.1f} MB (full precision for max accuracy)")
    print(f"   Classes: {CLASS_NAMES}")


def verify_model():
    """Verify ONNX model."""
    import onnxruntime as ort
    
    print("\nVerifying model...")
    session = ort.InferenceSession(str(ONNX_PATH), providers=["CPUExecutionProvider"])
    
    test_input = np.random.randn(1, 3, 224, 224).astype(np.float32)
    outputs = session.run(None, {"pixel_values": test_input})
    
    logits = outputs[0][0]
    probs = np.exp(logits) / np.exp(logits).sum()
    
    print("  Output probabilities:")
    for i, name in enumerate(CLASS_NAMES):
        print(f"    {name}: {probs[i]:.2%}")
    
    print("\n✅ Model verification passed!")
    print("Run 'python inference.py <image_path>' to test.")


if __name__ == "__main__":
    export_to_onnx()
    verify_model()
