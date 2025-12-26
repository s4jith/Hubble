# Cyberbullying Detection System - Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (main.py)                     │
│                    Single Endpoint: /detect                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              CyberbullyingDetector (Unified Pipeline)           │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
           TEXT INPUT                      IMAGE INPUT
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐       ┌───────────────────────┐
        │  Text Toxicity    │       │  Step 1: Deepfake     │
        │  Model (ONNX)     │       │  Detection (HF API)   │
        └───────────────────┘       └───────────────────────┘
                    │                           │
                    ▼                   ┌───────┴───────┐
             SAFE / HARASSMENT     IS DEEPFAKE?   NOT DEEPFAKE
                                        │               │
                                        ▼               ▼
                                   DEEPFAKE      ┌───────────────┐
                                   DETECTED      │ Step 2: Image │
                                                 │ Captioning    │
                                                 │ (GPT-4V/BLIP) │
                                                 └───────────────┘
                                                        │
                                                        ▼
                                                 ┌───────────────┐
                                                 │ Step 3: Text  │
                                                 │ Toxicity      │
                                                 │ on Caption    │
                                                 └───────────────┘
                                                        │
                                                        ▼
                                                 SAFE / HARASSMENT
```

---

## 📊 Models Used

### 1. Text Toxicity Detection (Local ONNX)

| Property | Details |
|----------|---------|
| **Model** | `microsoft/xtremedistil-l6-h384-uncased` (fine-tuned) |
| **Format** | ONNX (optimized for CPU) |
| **File** | `model/toxicity.onnx` (~91 MB) |
| **Tokenizer** | `model/fine_tuned/` (HuggingFace tokenizer) |
| **Architecture** | 6-layer DistilBERT with 384 hidden dimensions |
| **Input** | Text (max 128 tokens) |
| **Output** | Binary classification (SAFE / HARASSMENT) |
| **Inference** | Local CPU via ONNX Runtime |

### 2. Image Captioning (API-based)

| Property | Details |
|----------|---------|
| **Primary Model** | `OpenAI GPT-4o-mini` (Vision) |
| **Fallback Models** | `Salesforce/blip2-opt-2.7b`, `Salesforce/blip-image-captioning-large` |
| **API** | OpenAI API / HuggingFace Inference API |
| **Architecture** | Vision-Language Model (VLM) |
| **Input** | Image (JPEG, PNG, GIF, WebP) |
| **Output** | Detailed text description of the image |
| **Purpose** | Convert image to text for toxicity analysis |

### 3. Deepfake Detection (API-based)

| Property | Details |
|----------|---------|
| **Primary Model** | `umm-maybe/AI-image-detector` |
| **Fallback Model** | `Organika/sdxl-detector` |
| **API** | HuggingFace Inference API |
| **Architecture** | Image Classification (CNN-based) |
| **Input** | Image |
| **Output** | Binary classification (REAL / AI-GENERATED) |
| **Purpose** | Detect if image is AI-generated or deepfake |

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend Framework** | FastAPI |
| **ML Inference** | ONNX Runtime (local), HuggingFace API, OpenAI API |
| **Tokenization** | HuggingFace Transformers |
| **Image Processing** | Pillow |
| **API Server** | Uvicorn |
| **Language** | Python 3.x |

---

## 📁 Project Files

| File | Purpose |
|------|---------|
| `main.py` | FastAPI server with `/detect` endpoint |
| `cyberbullying_detector.py` | Unified detection pipeline |
| `text_toxicity.py` | Text harassment detection (ONNX) |
| `image_captioner.py` | Image to text (GPT-4V/BLIP) |
| `deepfake_detector.py` | AI-generated image detection |
| `model/toxicity.onnx` | Fine-tuned ONNX model |
| `model/fine_tuned/` | Tokenizer files |
| `.env` | API keys (HF_TOKEN, OPENAI_API_KEY) |
| `requirements.txt` | Python dependencies |

---

## 🔄 Detection Flow

### Text Input
```
Text → Text Toxicity Model (ONNX) → SAFE or HARASSMENT
```

### Image Input
```
Image → Deepfake Check
         ├─ If AI-generated → DEEPFAKE DETECTED
         └─ If Real → Caption (GPT-4V) → Toxicity Model → SAFE or HARASSMENT
```

---

## 🚀 Running the API

```bash
# Activate virtual environment
.\venv\Scripts\activate

# Start the server
uvicorn main:app --reload

# Access Swagger UI
http://127.0.0.1:8000/docs
```

---

## 📡 API Endpoint

### POST /detect

**Request:**
- `text` (form field) - Text to analyze, OR
- `image` (file upload) - Image to analyze

**Response:**
```json
{
  "is_cyberbullying": true,
  "label": "HARASSMENT"
}
```

**Labels:**
- `SAFE` - No cyberbullying detected
- `HARASSMENT` - Harassment detected
- `THREATENING` - Threat detected (text only)
- `DEEPFAKE DETECTED` - AI-generated image detected
