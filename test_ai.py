import requests
import json
import io
from PIL import Image

URL = "http://localhost:8000/api/v1/analyze"

def create_dummy_image_bytes(color=(255, 0, 0)):
    img = Image.new('RGB', (224, 224), color=color)
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    buffered.seek(0)
    return buffered

def test_text():
    print("--- 1. Testing Text (RoBERTa) ---")
    data = {"text": "you are useless", "user_id": "test_user"}
    res = requests.post(f"{URL}/text", json=data)
    print("Status:", res.status_code)
    try:
        print(json.dumps(res.json(), indent=2))
    except Exception:
        print(res.text)

def test_image():
    print("\n--- 2. Testing Image (EfficientNet) ---")
    img_bytes = create_dummy_image_bytes((255, 0, 0))
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    data = {"user_id": "test_user"}
    res = requests.post(f"{URL}/image", files=files, data=data)
    print("Status:", res.status_code)
    try:
        print(json.dumps(res.json(), indent=2))
    except Exception:
        print(res.text)

def test_multimodal():
    print("\n--- 3. Testing Multimodal (CLIP + Gemini) ---")
    img_bytes = create_dummy_image_bytes((0, 255, 0))
    # Wait, the multimodal might not have an endpoint? 
    # analyze.py only has /analyze/text, /analyze/image, /analyze/video.
    # Ah, let's see how deep context with CLIP is triggered.
    # The image endpoint takes text? Let's check `analyze_image` in analyze.py
    pass

def test_deep_context():
    print("\n--- 4. Testing Deep Context (Gemini Pro Vision) ---")
    data = {"text": "wow you’re such a genius 😂", "user_id": "test_user"}
    res = requests.post(f"{URL}/text", json=data)
    print("Status:", res.status_code)
    try:
        print(json.dumps(res.json(), indent=2))
    except Exception:
        print(res.text)

if __name__ == "__main__":
    test_text()
    test_image()
    test_deep_context()
