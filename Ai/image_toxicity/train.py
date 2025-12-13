# train.py
# Train MobileNetV2 for Cyberbullying Image Detection
# Multi-class: safe, nsfw, violence
# For hackathon - optimized for accuracy

import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset, ConcatDataset
from torchvision import models, transforms
from sklearn.metrics import accuracy_score, f1_score, classification_report
from tqdm import tqdm
from pathlib import Path
from PIL import Image
import numpy as np
import urllib.request
import zipfile
import shutil

# Configuration
OUTPUT_DIR = Path("model/fine_tuned")
DATA_DIR = Path("data")
BATCH_SIZE = 32
EPOCHS = 5
LEARNING_RATE = 1e-4
NUM_CLASSES = 3  # safe, nsfw, violence
CLASS_NAMES = ["safe", "nsfw", "violence"]


class CyberbullyingDataset(Dataset):
    """Dataset for cyberbullying image detection."""
    
    def __init__(self, root_dir, transform=None):
        self.root_dir = Path(root_dir)
        self.transform = transform
        self.samples = []
        
        # Load images from class subdirectories
        for class_idx, class_name in enumerate(CLASS_NAMES):
            class_dir = self.root_dir / class_name
            if class_dir.exists():
                for img_path in class_dir.glob("*.jpg"):
                    self.samples.append((img_path, class_idx))
                for img_path in class_dir.glob("*.png"):
                    self.samples.append((img_path, class_idx))
                for img_path in class_dir.glob("*.jpeg"):
                    self.samples.append((img_path, class_idx))
        
        print(f"Loaded {len(self.samples)} images from {root_dir}")
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        try:
            image = Image.open(img_path).convert("RGB")
            if self.transform:
                image = self.transform(image)
            return image, label
        except Exception as e:
            # Return a blank image if loading fails
            image = Image.new("RGB", (224, 224), (128, 128, 128))
            if self.transform:
                image = self.transform(image)
            return image, label


class CyberbullyingMobileNet(nn.Module):
    """MobileNetV2 for 3-class cyberbullying detection."""
    
    def __init__(self, num_classes=3, pretrained=True):
        super().__init__()
        self.base = models.mobilenet_v2(
            weights=models.MobileNet_V2_Weights.IMAGENET1K_V1 if pretrained else None
        )
        
        # Freeze early layers
        for param in self.base.features[:10].parameters():
            param.requires_grad = False
        
        # Replace classifier for 3 classes
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


def download_sample_data():
    """Download and organize sample data for training.
    
    Creates a sample dataset structure. In production, replace with
    actual NSFW and violence datasets from Kaggle.
    """
    print("\n" + "="*50)
    print("DATASET SETUP")
    print("="*50)
    
    # Create directory structure
    for class_name in CLASS_NAMES:
        (DATA_DIR / "train" / class_name).mkdir(parents=True, exist_ok=True)
        (DATA_DIR / "val" / class_name).mkdir(parents=True, exist_ok=True)
    
    # Check if data already exists
    train_count = sum(1 for _ in (DATA_DIR / "train").rglob("*.jpg"))
    if train_count > 100:
        print(f"Found {train_count} training images. Using existing data.")
        return True
    
    print("\n⚠️ For best accuracy, download these datasets from Kaggle:")
    print("1. Violence vs Non-Violence: kaggle.com/datasets/mohamedmustafa/real-life-violence-situations-dataset")
    print("2. NSFW Dataset: kaggle.com/datasets/benjaminhalstead/nsfw-and-sfw-images")
    print("\nOrganize images into:")
    print(f"  {DATA_DIR}/train/safe/")
    print(f"  {DATA_DIR}/train/nsfw/")
    print(f"  {DATA_DIR}/train/violence/")
    
    # Create synthetic demo data using CIFAR-10 as placeholder
    print("\n📦 Creating demo dataset from CIFAR-10 (replace with real data)...")
    
    from torchvision import datasets
    
    # Download CIFAR-10
    cifar_train = datasets.CIFAR10(DATA_DIR / "cifar", train=True, download=True)
    cifar_test = datasets.CIFAR10(DATA_DIR / "cifar", train=False, download=True)
    
    # Map CIFAR classes to our categories
    # Safe: airplane(0), automobile(1), ship(8), truck(9)
    # NSFW proxy: cat(3), dog(5), frog(6) - just for demo structure
    # Violence proxy: bird(2), deer(4), horse(7) - just for demo structure
    
    safe_classes = {0, 1, 8, 9}
    nsfw_classes = {3, 5, 6}
    violence_classes = {2, 4, 7}
    
    counts = {"safe": 0, "nsfw": 0, "violence": 0}
    max_per_class = 1000
    
    for i, (image, label) in enumerate(tqdm(cifar_train, desc="Creating train set")):
        if label in safe_classes and counts["safe"] < max_per_class:
            save_path = DATA_DIR / "train" / "safe" / f"{i}.jpg"
            image.save(save_path)
            counts["safe"] += 1
        elif label in nsfw_classes and counts["nsfw"] < max_per_class:
            save_path = DATA_DIR / "train" / "nsfw" / f"{i}.jpg"
            image.save(save_path)
            counts["nsfw"] += 1
        elif label in violence_classes and counts["violence"] < max_per_class:
            save_path = DATA_DIR / "train" / "violence" / f"{i}.jpg"
            image.save(save_path)
            counts["violence"] += 1
    
    # Create validation set
    val_counts = {"safe": 0, "nsfw": 0, "violence": 0}
    max_val = 200
    
    for i, (image, label) in enumerate(tqdm(cifar_test, desc="Creating val set")):
        if label in safe_classes and val_counts["safe"] < max_val:
            save_path = DATA_DIR / "val" / "safe" / f"{i}.jpg"
            image.save(save_path)
            val_counts["safe"] += 1
        elif label in nsfw_classes and val_counts["nsfw"] < max_val:
            save_path = DATA_DIR / "val" / "nsfw" / f"{i}.jpg"
            image.save(save_path)
            val_counts["nsfw"] += 1
        elif label in violence_classes and val_counts["violence"] < max_val:
            save_path = DATA_DIR / "val" / "violence" / f"{i}.jpg"
            image.save(save_path)
            val_counts["violence"] += 1
    
    print(f"\nTrain set: {counts}")
    print(f"Val set: {val_counts}")
    print("\n⚠️ This is demo data. Replace with real NSFW/violence images for production!")
    
    return True


def get_transforms():
    """Get train and validation transforms."""
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    return train_transform, val_transform


def train_epoch(model, loader, criterion, optimizer, device):
    """Train for one epoch."""
    model.train()
    total_loss = 0
    all_preds = []
    all_labels = []
    
    progress = tqdm(loader, desc="Training")
    for images, labels in progress:
        images = images.to(device)
        labels = labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        preds = torch.argmax(outputs, dim=1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())
        
        progress.set_postfix({"loss": f"{loss.item():.4f}"})
    
    accuracy = accuracy_score(all_labels, all_preds)
    return total_loss / len(loader), accuracy


def evaluate(model, loader, criterion, device):
    """Evaluate model."""
    model.eval()
    total_loss = 0
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for images, labels in tqdm(loader, desc="Evaluating"):
            images = images.to(device)
            labels = labels.to(device)
            
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            total_loss += loss.item()
            preds = torch.argmax(outputs, dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    accuracy = accuracy_score(all_labels, all_preds)
    f1 = f1_score(all_labels, all_preds, average='macro')
    
    # Print per-class metrics
    print("\nPer-class metrics:")
    print(classification_report(all_labels, all_preds, target_names=CLASS_NAMES))
    
    return total_loss / len(loader), accuracy, f1


def save_model(model):
    """Save model checkpoint."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), OUTPUT_DIR / "model.pth")
    print(f"Model saved to: {OUTPUT_DIR.resolve()}")


def main():
    # Setup device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Setup data
    download_sample_data()
    train_transform, val_transform = get_transforms()
    
    train_dataset = CyberbullyingDataset(DATA_DIR / "train", train_transform)
    val_dataset = CyberbullyingDataset(DATA_DIR / "val", val_transform)
    
    if len(train_dataset) == 0:
        print("❌ No training data found. Please add images to data/train/")
        return
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, num_workers=0)
    
    print(f"\nTrain samples: {len(train_dataset)}")
    print(f"Val samples: {len(val_dataset)}")
    
    # Create model
    print("\nCreating MobileNetV2 model (3-class)...")
    model = CyberbullyingMobileNet(num_classes=NUM_CLASSES, pretrained=True)
    model.to(device)
    
    # Class weights for imbalanced data
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LEARNING_RATE
    )
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=2, gamma=0.5)
    
    print(f"\nStarting training for {EPOCHS} epochs...")
    print("-" * 50)
    
    best_f1 = 0
    
    for epoch in range(EPOCHS):
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc, val_f1 = evaluate(model, val_loader, criterion, device)
        scheduler.step()
        
        print(f"\nEpoch {epoch+1}/{EPOCHS}")
        print(f"  Train Loss: {train_loss:.4f}, Acc: {train_acc:.4f}")
        print(f"  Val Loss: {val_loss:.4f}, Acc: {val_acc:.4f}, F1: {val_f1:.4f}")
        
        if val_f1 > best_f1:
            best_f1 = val_f1
            save_model(model)
            print(f"  ✅ New best model saved (F1: {val_f1:.4f})")
    
    print("\n" + "=" * 50)
    print(f"Training complete! Best Macro F1: {best_f1:.4f}")
    print(f"Model saved to: {OUTPUT_DIR.resolve()}")
    print("\nNext: Run 'python export.py' to create ONNX model")


if __name__ == "__main__":
    main()
