# Hubble Models

Production-ready models for cyberbullying detection.

## Models Included

| Model | File | Description |
|-------|------|-------------|
| **Deepfake Detection** | `deepfake_detector.py` | Detect AI-generated/deepfake images |
| **Image Captioning** | `image_captioner.py` | Generate detailed image descriptions |
| **Text Toxicity** | `text_toxicity.py` | Detect harassment in text |

## Setup

```bash
pip install -r requirements.txt
```

## Quick Usage

### Deepfake Detection
```python
from deepfake_detector import DeepfakeDetector

detector = DeepfakeDetector(use_api=True)
result = detector.detect("image.jpg")
print(result)  # {"is_deepfake": False, "confidence": 0.92}
```

### Image Captioning
```python
from image_captioner import ImageCaptioner

captioner = ImageCaptioner(use_api=True)
result = captioner.caption("image.jpg")
print(result["caption"])  # "A person standing in a park..."
```

### Text Toxicity
```python
from text_toxicity import HarassmentDetector

detector = HarassmentDetector()
result = detector.predict("You're so ugly!")
print(result)  # {"is_harassment": True, "confidence": 0.95}
```

## API Keys

Set in `.env` file:
```
HF_TOKEN=hf_xxxxxxx        # HuggingFace (free)
OPENAI_API_KEY=sk-xxxxxx   # OpenAI (optional fallback)
```
