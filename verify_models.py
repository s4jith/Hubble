import asyncio
from PIL import Image
import io

import os
import sys

# Add Ai dir to sys path to import its modules
sys.path.append("d:/Github/Hubble/Ai")

from app.models.model_registry import model_registry
from app.services.gemini_service import gemini_service

def create_dummy_image(color=(255, 0, 0)):
    img = Image.new('RGB', (224, 224), color=color)
    return img

async def main():
    print("========================================")
    print(" VERIFYING LOCAL MODELS")
    print("========================================")
    
    # Load all models
    print("\n--- Loading Models ---")
    await model_registry.load_all()

    status = model_registry.get_status()

    # 1. Verify RoBERTa (Text Model)
    print("\n--- 1. Testing RoBERTa (Text Model) ---")
    if status.get("text_model"):
        res = model_registry.text_model.predict("you are useless")
        print(f"Result for 'you are useless': Flagged={res['is_toxic']}, Max Score={res['max_score']:.4f}, Label={res['max_label']}")
    else:
        print("RoBERTa model not available!")

    # 2. Verify EfficientNet (Image Model)
    print("\n--- 2. Testing EfficientNet (Image Model) ---")
    if status.get("image_model"):
        img = create_dummy_image()
        res = model_registry.image_model.predict(img)
        print(f"Result for dummy image: Harmful={res['is_harmful']}, Max Score={res['max_score']:.4f}, Label={res['max_label']}")
    else:
        print("EfficientNet model not available!")

    # 3. Verify CLIP (Multimodal)
    print("\n--- 3. Testing CLIP (Multimodal) ---")
    if status.get("clip_model"):
        img = create_dummy_image()
        res = model_registry.clip_model.align_content(img, "a violent and abusive image")
        print(f"CLIP Alignment Result: Most Aligned Category={res.get('most_aligned')}")
    else:
        print("CLIP model not available!")

    # 4. Verify Gemini Fallback (No API Keys)
    print("\n--- 4. Testing Gemini Fallback (Deep Context) ---")
    gemini_service.initialize()
    if not gemini_service.is_initialized:
        print("Gemini correctly bypassed (No API keys configured). Testing fallback...")
        res = await gemini_service.analyze_text("testing fallback")
        print(f"Fallback Response: {res}")
    else:
        print("Gemini is fully active (API keys found).")

    print("\n========================================")
    print(" ALL TESTS COMPLETED")
    print("========================================")

if __name__ == "__main__":
    asyncio.run(main())
