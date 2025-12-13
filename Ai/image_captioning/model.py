from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import torch


class BlipCaptioner:
    def __init__(self, model_name: str = "Salesforce/blip-image-captioning-base", device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model_name = model_name
        self.processor = BlipProcessor.from_pretrained(model_name)
        self.model = BlipForConditionalGeneration.from_pretrained(model_name).to(self.device)
        self.model.eval()
        print("Model loaded successfully")

    def generate_caption(self, image: Image.Image, max_length: int = 50) -> str:
        inputs = self.processor(image, return_tensors="pt").to(self.device)

        with torch.no_grad():   
            outputs = self.model.generate(**inputs, max_length=max_length)

        caption = self.processor.decode(outputs[0], skip_special_tokens=True)
        return caption

    def save_model(self, save_path: str):
        self.model.save_pretrained(save_path)
        self.processor.save_pretrained(save_path)
        print(f"Model saved to {save_path}")
