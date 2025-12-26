# image_captioner.py
# Image captioning for cyberbullying detection using BLIP-2
# Generates detailed descriptions of images including violence/threat detection

import os
import requests
import base64
from typing import Optional, Union
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class ImageCaptioner:
    """
    Production-grade image captioning using BLIP-2.
    Supports both HuggingFace API and local inference.
    Optimized for detecting violence, threats, and harmful content.
    """
    
    # Models in order of preference (API mode)
    API_MODELS = [
        "Salesforce/blip2-opt-2.7b",
        "Salesforce/blip-image-captioning-large",
        "nlpconnect/vit-gpt2-image-captioning",
    ]
    
    # Prompt for detailed scene description (violence/threat focused)
    DETAIL_PROMPT = "Question: Describe this image in detail, including any people, their actions, objects, weapons, or threatening behavior. Answer:"
    SIMPLE_PROMPT = "a photo of"
    
    def __init__(self, use_api: bool = True, verbose: bool = True):
        """
        Initialize ImageCaptioner.
        
        Args:
            use_api: Use HuggingFace Inference API (recommended for production)
            verbose: Print progress messages
        """
        self.use_api = use_api
        self.verbose = verbose
        self.hf_token = os.getenv("HF_TOKEN")
        self.local_model = None
        self.local_processor = None
        
        if self.verbose:
            mode = "API" if use_api else "Local"
            print(f"ImageCaptioner initialized ({mode} mode)")
    
    def _log(self, message: str):
        """Print message if verbose mode enabled."""
        if self.verbose:
            print(message)
    
    def caption(
        self, 
        image_path: str, 
        detailed: bool = True,
        max_length: int = 100
    ) -> dict:
        """
        Generate caption for an image.
        
        Args:
            image_path: Path to image file
            detailed: Use detailed prompt for threat detection (recommended)
            max_length: Maximum caption length
            
        Returns:
            {
                "caption": str,
                "confidence": float,
                "model_used": str,
                "success": bool,
                "error": str (optional)
            }
        """
        if not os.path.exists(image_path):
            return {
                "caption": "",
                "confidence": 0.0,
                "success": False,
                "error": f"File not found: {image_path}"
            }
        
        if self.use_api:
            return self._caption_via_api(image_path, detailed, max_length)
        else:
            return self._caption_local(image_path, detailed, max_length)
    
    def _caption_via_api(
        self, 
        image_path: str, 
        detailed: bool,
        max_length: int
    ) -> dict:
        """Use HuggingFace Inference API with fallback models."""
        
        # Read and encode image
        with open(image_path, "rb") as f:
            image_data = f.read()
        
        headers = {"Content-Type": "application/json"}
        if self.hf_token:
            headers["Authorization"] = f"Bearer {self.hf_token}"
        
        # Try each model until one works
        for model_name in self.API_MODELS:
            api_url = f"https://router.huggingface.co/hf-inference/models/{model_name}"
            
            try:
                self._log(f"  Trying model: {model_name}")
                
                # Different payload format for different models
                if "blip2" in model_name:
                    # BLIP-2 supports VQA-style prompting
                    image_b64 = base64.b64encode(image_data).decode("utf-8")
                    payload = {
                        "inputs": {
                            "image": image_b64,
                            "text": self.DETAIL_PROMPT if detailed else self.SIMPLE_PROMPT
                        },
                        "parameters": {
                            "max_new_tokens": max_length
                        }
                    }
                    response = requests.post(
                        api_url,
                        headers=headers,
                        json=payload,
                        timeout=120
                    )
                else:
                    # Other models use raw image bytes
                    headers_img = {"Content-Type": "application/octet-stream"}
                    if self.hf_token:
                        headers_img["Authorization"] = f"Bearer {self.hf_token}"
                    
                    response = requests.post(
                        api_url,
                        headers=headers_img,
                        data=image_data,
                        timeout=120
                    )
                
                if response.status_code == 200:
                    result = response.json()
                    caption = self._extract_caption(result, model_name)
                    
                    if caption:
                        return {
                            "caption": caption,
                            "confidence": 0.85,  # API doesn't return confidence
                            "model_used": model_name,
                            "success": True
                        }
                
                elif response.status_code == 503:
                    self._log(f"    Model loading, trying next...")
                    continue
                else:
                    self._log(f"    Failed ({response.status_code}): {response.text[:100]}")
                    continue
                    
            except requests.exceptions.Timeout:
                self._log(f"    Timeout for {model_name}")
                continue
            except Exception as e:
                self._log(f"    Error: {str(e)[:100]}")
                continue
        
        # Fallback: Try OpenAI GPT-4V if available
        openai_result = self._caption_via_openai(image_path, detailed)
        if openai_result.get("success"):
            return openai_result
        
        return {
            "caption": "",
            "confidence": 0.0,
            "success": False,
            "error": "All API models failed. Try --local mode or set OPENAI_API_KEY/HF_TOKEN."
        }
    
    def _extract_caption(self, result: Union[list, dict, str], model_name: str) -> str:
        """Extract caption from different API response formats."""
        
        # Handle list response
        if isinstance(result, list):
            if len(result) > 0:
                item = result[0]
                if isinstance(item, dict):
                    return item.get("generated_text", "").strip()
                return str(item).strip()
        
        # Handle dict response
        if isinstance(result, dict):
            # BLIP-2 format
            if "generated_text" in result:
                return result["generated_text"].strip()
            # Other formats
            for key in ["text", "caption", "answer"]:
                if key in result:
                    return result[key].strip()
        
        # Handle string response
        if isinstance(result, str):
            return result.strip()
        
        return ""
    
    def _caption_via_openai(self, image_path: str, detailed: bool) -> dict:
        """
        Use OpenAI GPT-4 Vision for image captioning.
        This is a fallback when HuggingFace API fails.
        """
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            self._log("  OpenAI: No API key found")
            return {"success": False}
        
        try:
            self._log("  Trying OpenAI GPT-4 Vision...")
            
            # Read and encode image
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")
            
            # Detect image type
            image_type = "image/jpeg"
            if image_path.lower().endswith(".png"):
                image_type = "image/png"
            elif image_path.lower().endswith(".gif"):
                image_type = "image/gif"
            elif image_path.lower().endswith(".webp"):
                image_type = "image/webp"
            
            # Prepare prompt
            if detailed:
                prompt = """Describe this image in detail for a safety detection system.
Include:
- What is happening in the image
- Any people and their actions
- Any objects, especially weapons or dangerous items
- Any threatening or violent behavior
- The overall mood or context of the scene

Be specific and factual. Focus on observable details relevant to safety concerns."""
            else:
                prompt = "Briefly describe what is in this image."
            
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "gpt-4o-mini",  # Fast and affordable
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{image_type};base64,{image_data}",
                                    "detail": "high" if detailed else "low"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 300
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                caption = data["choices"][0]["message"]["content"].strip()
                
                return {
                    "caption": caption,
                    "confidence": 0.92,
                    "model_used": "OpenAI/gpt-4o-mini",
                    "success": True
                }
            else:
                self._log(f"    OpenAI Error ({response.status_code}): {response.text[:100]}")
                return {"success": False}
                
        except Exception as e:
            self._log(f"    OpenAI Error: {str(e)[:100]}")
            return {"success": False}
    
    def _caption_local(
        self, 
        image_path: str, 
        detailed: bool,
        max_length: int
    ) -> dict:
        """Local inference using transformers library."""
        
        try:
            import torch
            from PIL import Image
            
            # Lazy load model
            if self.local_model is None:
                self._log("Loading local BLIP-2 model (first time may take a while)...")
                self._load_local_model()
            
            if self.local_model is None:
                return {
                    "caption": "",
                    "confidence": 0.0,
                    "success": False,
                    "error": "Failed to load local model"
                }
            
            # Load and process image
            image = Image.open(image_path).convert("RGB")
            
            # Prepare inputs
            prompt = self.DETAIL_PROMPT if detailed else self.SIMPLE_PROMPT
            inputs = self.local_processor(
                image, 
                text=prompt,
                return_tensors="pt"
            ).to(self.device)
            
            # Generate caption
            with torch.no_grad():
                outputs = self.local_model.generate(
                    **inputs,
                    max_new_tokens=max_length,
                    do_sample=False,
                    num_beams=3
                )
            
            caption = self.local_processor.decode(outputs[0], skip_special_tokens=True)
            
            # Clean up prompt from response if present
            if caption.startswith(prompt):
                caption = caption[len(prompt):].strip()
            
            return {
                "caption": caption,
                "confidence": 0.90,
                "model_used": "Salesforce/blip2-opt-2.7b (local)",
                "success": True
            }
            
        except ImportError as e:
            return {
                "caption": "",
                "confidence": 0.0,
                "success": False,
                "error": f"Install required packages: pip install transformers torch pillow accelerate"
            }
        except Exception as e:
            return {
                "caption": "",
                "confidence": 0.0,
                "success": False,
                "error": str(e)
            }
    
    def _load_local_model(self):
        """Load BLIP-2 model for local inference."""
        try:
            import torch
            from transformers import Blip2Processor, Blip2ForConditionalGeneration
            
            model_name = "Salesforce/blip2-opt-2.7b"
            
            # Determine device
            if torch.cuda.is_available():
                self.device = torch.device("cuda")
                dtype = torch.float16
            else:
                self.device = torch.device("cpu")
                dtype = torch.float32
                self._log("  Warning: Using CPU. Inference will be slow.")
            
            self._log(f"  Loading processor...")
            self.local_processor = Blip2Processor.from_pretrained(model_name)
            
            self._log(f"  Loading model on {self.device}...")
            self.local_model = Blip2ForConditionalGeneration.from_pretrained(
                model_name,
                torch_dtype=dtype,
                device_map="auto" if torch.cuda.is_available() else None
            )
            
            if not torch.cuda.is_available():
                self.local_model = self.local_model.to(self.device)
            
            self._log("  Model loaded successfully!")
            
        except Exception as e:
            self._log(f"  Failed to load model: {e}")
            self.local_model = None
            self.local_processor = None


def analyze_for_threats(caption: str) -> dict:
    """
    Analyze caption for potential threatening content.
    This is a quick heuristic check before full toxicity analysis.
    
    IMPORTANT: Handles negation context - "no violence", "non-threatening" 
    are NOT counted as threats.
    
    Returns:
        {
            "has_violence_keywords": bool,
            "has_weapon_keywords": bool,
            "threat_score": float (0-1),
            "keywords_found": list
        }
    """
    caption_lower = caption.lower()
    
    # Negation patterns that negate threat keywords
    negation_patterns = [
        "no ", "not ", "non-", "non ", "without ", "lack of ", "absence of ",
        "aren't ", "isn't ", "don't ", "doesn't ", "didn't ", "won't ",
        "no signs of ", "no evidence of ", "appear to be ", "seems to be ",
        "there are no ", "there is no ", "free of ", "free from "
    ]
    
    # Safety phrases that indicate the content is safe
    safety_phrases = [
        "no safety concerns", "non-threatening", "no threat", "friendly",
        "no violence", "no weapons", "no conflict", "no aggression",
        "safe", "normal", "peaceful", "cheerful", "relaxed", "happy",
        "smiling", "posing", "selfie", "no signs of", "no observable"
    ]
    
    # Check if caption contains safety indicators
    has_safety_context = any(phrase in caption_lower for phrase in safety_phrases)
    
    violence_keywords = [
        "attack", "hit", "punch", "kick", "fight", "hurt", "harm",
        "assault", "beat", "slap", "push", "choke", "strangle",
        "blood", "bleeding", "injured", "wound", "dead", "kill"
    ]
    
    weapon_keywords = [
        "knife", "gun", "weapon", "sword", "bat", "stick",
        "pistol", "rifle", "blade"
    ]
    
    threatening_actions = [
        "threatening", "attacking", "pointing at", "holding knife",
        "holding gun", "aiming", "about to hurt", "going to hurt"
    ]
    
    def is_negated(text: str, keyword: str) -> bool:
        """Check if a keyword is preceded by a negation pattern."""
        idx = text.find(keyword)
        if idx == -1:
            return False
        
        # Check the text before the keyword (up to 30 chars)
        prefix = text[max(0, idx - 30):idx]
        
        # Check for negation patterns
        for neg in negation_patterns:
            if neg in prefix:
                return True
        
        return False
    
    found_keywords = []
    
    # Check for violence (non-negated)
    violence_found = []
    for kw in violence_keywords:
        if kw in caption_lower and not is_negated(caption_lower, kw):
            violence_found.append(kw)
    
    # Check for weapons (non-negated)
    weapons_found = []
    for kw in weapon_keywords:
        if kw in caption_lower and not is_negated(caption_lower, kw):
            weapons_found.append(kw)
    
    # Check for threatening actions (non-negated)
    actions_found = []
    for phrase in threatening_actions:
        if phrase in caption_lower and not is_negated(caption_lower, phrase):
            actions_found.append(phrase)
    
    found_keywords = violence_found + weapons_found + actions_found
    
    # Calculate threat score
    threat_score = 0.0
    if violence_found:
        threat_score += 0.3 * min(len(violence_found), 3) / 3
    if weapons_found:
        threat_score += 0.4 * min(len(weapons_found), 2) / 2
    if actions_found:
        threat_score += 0.3 * min(len(actions_found), 2) / 2
    
    # If caption has strong safety context, reduce threat score significantly
    if has_safety_context:
        threat_score *= 0.1  # Reduce by 90%
    
    return {
        "has_violence_keywords": len(violence_found) > 0,
        "has_weapon_keywords": len(weapons_found) > 0,
        "threat_score": round(min(threat_score, 1.0), 3),
        "keywords_found": found_keywords,
        "has_safety_context": has_safety_context
    }


if __name__ == "__main__":
    import sys
    
    # Parse arguments
    use_local = "--local" in sys.argv
    detailed = "--simple" not in sys.argv
    
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    
    if not args:
        print("=" * 50)
        print("Image Captioner - BLIP-2 Based")
        print("=" * 50)
        print("\nUsage:")
        print("  python image_captioner.py <image_path> [options]")
        print("\nOptions:")
        print("  --local   Use local model (requires GPU)")
        print("  --simple  Use simple caption (faster)")
        print("\nExamples:")
        print("  python image_captioner.py photo.jpg")
        print("  python image_captioner.py photo.jpg --local")
        sys.exit(0)
    
    image_path = args[0]
    
    print(f"\n{'='*50}")
    print(f"Analyzing: {image_path}")
    print(f"Mode: {'Local' if use_local else 'API'}")
    print(f"Detail: {'Yes' if detailed else 'Simple'}")
    print(f"{'='*50}\n")
    
    # Initialize captioner
    captioner = ImageCaptioner(use_api=not use_local)
    
    # Generate caption
    result = captioner.caption(image_path, detailed=detailed)
    
    if result["success"]:
        print(f"\n{'='*50}")
        print(f"CAPTION:")
        print(f"  {result['caption']}")
        print(f"\nModel: {result.get('model_used', 'unknown')}")
        print(f"Confidence: {result['confidence']*100:.0f}%")
        
        # Threat analysis
        threat_analysis = analyze_for_threats(result["caption"])
        print(f"\nTHREAT ANALYSIS:")
        print(f"  Threat Score: {threat_analysis['threat_score']*100:.0f}%")
        if threat_analysis["keywords_found"]:
            print(f"  Keywords: {', '.join(threat_analysis['keywords_found'])}")
        else:
            print(f"  No threat keywords detected")
        print(f"{'='*50}\n")
    else:
        print(f"\nERROR: {result.get('error', 'Unknown error')}")
