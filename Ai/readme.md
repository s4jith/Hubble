# SentinelAI - Cyberbullying Detection System

A mobile-ready AI system for detecting cyberbullying through **text harassment** and **harmful images** (NSFW/violence).

---

## 📋 Project Overview

### Purpose
Real-time cyberbullying detection for mobile applications - built for **National Hackathon**.

### Modules

| Module | Description | Model Size | Output |
|--------|-------------|------------|--------|
| **Text Toxicity** | Detects harassment in text messages | 87 MB | HARASSMENT / SAFE |
| **Image Toxicity** | Detects NSFW/violence in images | 9.8 MB | safe / nsfw / violence |

---

## 🧠 Text Toxicity Detection

### Model Architecture
- **Base Model**: `distilbert-base-uncased` (DistilBERT - 66M parameters)
- **Technique**: **Transfer Learning** with fine-tuning
- **Head**: Binary classification layer (768 → 2)

### Dataset
- **Name**: SetFit/toxic_conversations (HuggingFace)
- **Source**: Jigsaw Toxic Comment Classification
- **Training Samples**: 50,000
- **Validation Samples**: 50,000
- **Labels**: Binary (toxic/safe)

### Training Details
| Parameter | Value |
|-----------|-------|
| Epochs | 3 |
| Batch Size | 32 |
| Learning Rate | 2e-5 |
| Optimizer | AdamW |
| Loss | CrossEntropyLoss |
| **Best F1 Score** | **0.6346** |

### Transfer Learning Approach
1. Loaded pre-trained DistilBERT (pre-trained on English Wikipedia + BookCorpus)
2. Added custom classification head
3. Fine-tuned entire model on toxic conversations dataset
4. Exported to ONNX (full precision, no quantization for accuracy)

### Files
```
Ai/text_toxicity/
├── model/
│   ├── fine_tuned/           # PyTorch checkpoint (~90MB)
│   └── toxicity.onnx         # ONNX model (87 MB)
├── train.py                  # Fine-tuning script
├── export.py                 # ONNX export
├── inference.py              # CLI interface
├── model.py                  # Model definition
└── requirements.txt
```

### Usage
```bash
cd Ai/text_toxicity
python inference.py "You are a worthless idiot"
# Output: 🔴 HARASSMENT DETECTED (98.1%)
```

---

## 🖼️ Image Toxicity Detection

### Model Architecture
- **Base Model**: MobileNetV2 (3.4M parameters)
- **Pre-trained on**: ImageNet (1000 classes)
- **Technique**: **Transfer Learning** with partial freezing
- **Output**: 3-class classification (safe, nsfw, violence)

### Dataset
- **Demo Dataset**: CIFAR-10 (as proxy)
  - safe: airplane, automobile, ship, truck
  - nsfw: cat, dog, frog (proxy)
  - violence: bird, deer, horse (proxy)
- **Training**: 3,000 images (1,000 per class)
- **Validation**: 600 images (200 per class)

> ⚠️ For production, replace with real NSFW/violence datasets:
> - Kaggle: Violence vs Non-Violence (11K images)
> - Kaggle: NSFW image datasets

### Training Details
| Parameter | Value |
|-----------|-------|
| Epochs | 5 |
| Batch Size | 32 |
| Learning Rate | 1e-4 |
| Optimizer | Adam |
| Loss | CrossEntropyLoss |
| Scheduler | StepLR (step=2, gamma=0.5) |
| **Best F1 Score** | **0.83** |

### Transfer Learning Approach
1. Loaded MobileNetV2 pre-trained on ImageNet
2. **Froze first 10 convolutional layers** (preserve general features)
3. Replaced classifier head:
   ```
   Dropout(0.3) → Linear(1280, 256) → ReLU → 
   Dropout(0.2) → Linear(256, 3)
   ```
4. Fine-tuned unfrozen layers on cyberbullying dataset
5. Data augmentation: RandomCrop, HorizontalFlip, Rotation, ColorJitter
6. Exported to ONNX (full precision, no quantization)

### Files
```
Ai/image_toxicity/
├── model/
│   ├── fine_tuned/            # PyTorch checkpoint (~10MB)
│   ├── cyberbullying.onnx     # ONNX model (9.8 MB)
│   └── vit/ (backup)          # Falconsai ViT model (344 MB)
├── train.py                   # Fine-tuning script
├── export.py                  # ONNX export
├── inference.py               # CLI with threat detection
├── data/                      # Training data
└── requirements.txt
```

### Usage
```bash
cd Ai/image_toxicity
python inference.py image.jpg
```

### Output
```
→ violence   [████████████        ] 62.6%
--------------------------------------------------
🔴 THREAT DETECTED: Violence/Gore
   This may be a threat or intimidation
```

---

## 🔧 Technical Implementation

### Why Transfer Learning?
1. **Limited training data** - Don't have millions of labeled cyberbullying examples
2. **Faster training** - Pre-trained weights provide good starting features
3. **Better generalization** - Models already understand language/image patterns

### Why No Quantization?
- Quantization reduces model size but can hurt accuracy
- For cyberbullying detection, **accuracy is critical** (false negatives are dangerous)
- Models kept at full precision (FP32)

### ONNX Export
- **Why ONNX?** Cross-platform compatibility for mobile (iOS/Android)
- **Benefits**: Runtime inference without PyTorch dependency
- Both models exported with dynamic batch size

---

## 📊 Summary

| Aspect | Text Toxicity | Image Toxicity |
|--------|--------------|----------------|
| **Base Model** | DistilBERT | MobileNetV2 |
| **Parameters** | 66M | 3.4M |
| **Pre-training** | English Wikipedia | ImageNet |
| **Fine-tuning Data** | 50K toxic conversations | 3K images (demo) |
| **Classes** | 2 (harassment/safe) | 3 (safe/nsfw/violence) |
| **F1 Score** | 0.63 | 0.83 |
| **ONNX Size** | 87 MB | 9.8 MB |
| **Quantized** | No | No |

---

## 🚀 Next Steps for Production

1. **Text Model**: Train on larger dataset for higher F1
2. **Image Model**: Replace CIFAR-10 proxy with real NSFW/violence datasets
3. **Mobile Integration**: Use ONNX Runtime for iOS/Android
4. **API**: Create REST API for real-time detection

---

## 📁 Project Structure

```
SentinelAI/
├── Ai/
│   ├── text_toxicity/       # Text harassment detection
│   │   ├── train.py         # Fine-tuning on Jigsaw dataset
│   │   ├── export.py        # ONNX export
│   │   ├── inference.py     # CLI interface
│   │   └── model/           # Trained models
│   └── image_toxicity/      # Image NSFW/violence detection
│       ├── train.py         # Fine-tuning MobileNetV2
│       ├── export.py        # ONNX export
│       ├── inference.py     # CLI with threat detection
│       └── model/           # Trained models
├── Backend/
├── Frontend/
└── .gitignore
```

---

## 🛠️ Requirements

```
torch
torchvision
transformers
onnx
onnxruntime
numpy
pillow
datasets
scikit-learn
tqdm
```

---

## 👤 Author

Built for **National Hackathon** - SentinelAI Cyberbullying Detection System