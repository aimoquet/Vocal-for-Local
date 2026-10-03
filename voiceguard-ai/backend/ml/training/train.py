import os
import sys
import time
import argparse
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from ml.model import VocalForLocalCNN
from ml.training.dataset import AudioDeepfakeDataset

def train_model(data_dir=None, epochs=15, batch_size=16, lr=0.0005, max_samples_per_class=None):
    print("=" * 60)
    print(" Vocal for Local - Deepfake Audio Model Training Pipeline")
    print("=" * 60)
    
    # Locate dataset directory
    if data_dir is None:
        # Check standard paths in order
        candidates = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../dataset')),
            os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../dataset/wavefake_2s')),
            os.path.abspath(os.path.join(os.path.dirname(__file__), '../../dataset'))
        ]
        for path in candidates:
            if os.path.exists(path) and len(os.listdir(path)) > 0:
                data_dir = path
                break
                
    if not data_dir or not os.path.exists(data_dir):
        print(f"[ERROR] Dataset directory not found. Please provide valid dataset path.")
        return

    print(f"Loading dataset from: {data_dir}")
    dataset = AudioDeepfakeDataset(data_dir, max_samples_per_class=max_samples_per_class)
    
    if len(dataset) == 0:
        print(f"[ERROR] No valid audio samples found in: {data_dir}")
        return

    # Train / Validation Split (85% train, 15% validation)
    train_size = int(0.85 * len(dataset))
    val_size = len(dataset) - train_size
    
    if val_size == 0:
        train_dataset = dataset
        val_dataset = dataset
    else:
        train_dataset, val_dataset = random_split(
            dataset, 
            [train_size, val_size],
            generator=torch.Generator().manual_seed(42)
        )
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, drop_last=True if len(train_dataset) > batch_size else False)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device} | Total Train: {len(train_dataset)} | Total Val: {len(val_dataset)}")
    
    # Initialize Enhanced Model
    model = VocalForLocalCNN(num_classes=2).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
    
    save_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../saved_models'))
    os.makedirs(save_dir, exist_ok=True)
    model_save_path = os.path.join(save_dir, 'best_model.pth')
    
    best_val_acc = 0.0
    best_val_loss = float('inf')
    
    print(f"\nStarting training for {epochs} epochs (Batch Size: {batch_size}, Initial LR: {lr})...\n")
    start_time = time.time()
    
    for epoch in range(epochs):
        epoch_start = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            
            # Gradient clipping for stability
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
        train_loss = running_loss / total if total > 0 else 0.0
        train_acc = 100.0 * correct / total if total > 0 else 0.0
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item() * inputs.size(0)
                _, predicted = torch.max(outputs.data, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
                
        val_loss = val_loss / val_total if val_total > 0 else 0.0
        val_acc = 100.0 * val_correct / val_total if val_total > 0 else 0.0
        
        scheduler.step()
        epoch_dur = time.time() - epoch_start
        
        print(f"Epoch [{epoch+1:02d}/{epochs:02d}] ({epoch_dur:.1f}s) - "
              f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | "
              f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}%")
        
        # Save best model based on validation accuracy and loss
        if val_acc > best_val_acc or (val_acc == best_val_acc and val_loss < best_val_loss):
            best_val_acc = val_acc
            best_val_loss = val_loss
            torch.save(model.state_dict(), model_save_path)
            print(f"  * Saved new best model checkpoint to: {model_save_path} (Val Acc: {best_val_acc:.2f}%)")
            
    total_elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print(f"Training Complete in {total_elapsed/60:.2f} minutes!")
    print(f"Best Validation Accuracy: {best_val_acc:.2f}%")
    print(f"Saved Model Weights Path: {model_save_path}")
    print("=" * 60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Vocal for Local Deepfake Audio Detection Model")
    parser.add_argument("--data_dir", type=str, default=None, help="Path to dataset directory (e.g. voiceguard-ai/dataset)")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.0005, help="Learning rate")
    parser.add_argument("--max_samples", type=int, default=None, help="Max samples per class (for faster training)")
    args = parser.parse_args()
    
    train_model(
        data_dir=args.data_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        max_samples_per_class=args.max_samples
    )
