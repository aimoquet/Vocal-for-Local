import os
import torch
import torch.nn.functional as F
import numpy as np
from .model import VocalForLocalCNN
from .preprocessing import preprocess_pipeline
from .feature_extraction import get_all_features, generate_mel_spectrogram

_MODEL_INSTANCE = None
_DEFAULT_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../saved_models/best_model.pth'))

def get_or_load_model(model_path=None):
    global _MODEL_INSTANCE
    target_path = model_path or _DEFAULT_MODEL_PATH
    if _MODEL_INSTANCE is None:
        model = VocalForLocalCNN(num_classes=2)
        if os.path.exists(target_path):
            try:
                state_dict = torch.load(target_path, map_location=torch.device('cpu'))
                model.load_state_dict(state_dict)
                print(f"[ML Inference] Successfully loaded model weights from: {target_path}")
            except Exception as e:
                print(f"[ML Inference] Warning: Could not load weights ({e}). Using initialized model.")
        else:
            print(f"[ML Inference] No saved weights found at {target_path}. Using base model.")
        model.eval()
        _MODEL_INSTANCE = model
    return _MODEL_INSTANCE

def predict(audio_path, model_path=None):
    """
    Standard inference interface:
    Extracts real acoustic features, computes Mel-spectrogram, runs CNN model inference,
    and analyzes spectral characteristics.
    """
    # 1. Preprocess real audio file
    audio, sr = preprocess_pipeline(audio_path)
    duration = float(len(audio) / sr)
    
    # 2. Extract genuine acoustic features for UI charts & metadata
    features = get_all_features(audio, sr)
    
    # 3. Generate Mel Spectrogram
    mel_spec = generate_mel_spectrogram(audio, sr)
    
    # 4. Convert to PyTorch Tensor & resize with F.interpolate (128x128)
    tensor_input = torch.tensor(mel_spec, dtype=torch.float32).unsqueeze(0).unsqueeze(0)
    tensor_input = F.interpolate(tensor_input, size=(128, 128), mode='bilinear', align_corners=False)
    
    # 5. Model forward pass
    model = get_or_load_model(model_path)
    with torch.no_grad():
        output = model(tensor_input)
        probs = F.softmax(output, dim=1).numpy()[0]
        
    model_version = "v1.0-trained" if os.path.exists(_DEFAULT_MODEL_PATH) else "v1.0"
    
    # Probabilities: index 0 = REAL, index 1 = FAKE
    real_prob = float(probs[0])
    fake_prob = float(probs[1])
    
    # Determine prediction & confidence
    prediction = "FAKE" if fake_prob >= 0.5 else "REAL"
    confidence = float(fake_prob if prediction == "FAKE" else real_prob)
    
    return {
        "prediction": prediction,
        "probabilities": {"REAL": round(real_prob, 4), "FAKE": round(fake_prob, 4)},
        "confidence": round(confidence, 4),
        "model_version": model_version,
        "features": features,
        "duration": round(duration, 2)
    }
