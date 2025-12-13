from model import BlipCaptioner
from PIL import Image
import os


def load_image(image_path: str) -> Image.Image:
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    return Image.open(image_path).convert("RGB")


def caption_image(image_path: str, captioner: BlipCaptioner = None) -> str:

    if captioner is None:
        captioner = BlipCaptioner()
    
    image = load_image(image_path)
    caption = captioner.generate_caption(image)
    return caption


def caption_from_pil(image: Image.Image, captioner: BlipCaptioner = None) -> str:

    if captioner is None:
        captioner = BlipCaptioner()
    
    return captioner.generate_caption(image)

if __name__ == "__main__":
    import sys
    
    captioner = BlipCaptioner()
    
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        caption = caption_image(image_path, captioner)
        print(f"\n📷 Image: {image_path}")
        print(f"📝 Caption: {caption}")
    else:
        print("Usage: python inference.py <image_path>")
        print("\nExample: python inference.py test_image.jpg")


