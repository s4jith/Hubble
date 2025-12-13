import torch
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import os


def export_to_torchscript(save_path: str = "model/blip_scripted.pt"):

    print("Loading BLIP model...")
    processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
    model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
    model.eval()

    processor.save_pretrained("model/processor")
    
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    torch.save(model.state_dict(), save_path)
    print(f"Model weights saved to {save_path}")
    print("Processor saved to model/processor")


if __name__ == "__main__":
    export_to_torchscript()