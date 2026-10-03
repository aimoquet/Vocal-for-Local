import os
import glob
import torch
from torch.utils.data import Dataset
import numpy as np
import torch.nn.functional as F
import soundfile as sf
import librosa

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from ml.feature_extraction import generate_mel_spectrogram

class AudioDeepfakeDataset(Dataset):
    """
    Dataset loader for deepfake audio detection.
    Supports WaveFake (e.g. fake_voice_* vs real_voice_*), standard real/fake folders,
    and recursive multi-condition dataset structures.
    """
    def __init__(self, data_dir, target_sr=16000, img_size=(128, 128), max_samples_per_class=None):
        self.data_dir = data_dir
        self.target_sr = target_sr
        self.img_size = img_size
        self.samples = []
        
        # Audio extensions to scan
        extensions = ('*.wav', '*.mp3', '*.flac', '*.ogg', '*.m4a')
        
        real_files = []
        fake_files = []
        
        # Walk directory tree
        for root, _, files in os.walk(data_dir):
            for file in files:
                if any(file.lower().endswith(ext.replace('*', '')) for ext in extensions):
                    full_path = os.path.join(root, file)
                    lower_path = full_path.lower().replace('\\', '/')
                    
                    # Check classification based on directory path or filename
                    if 'fake_voice' in lower_path or '/fake/' in lower_path or '\\fake\\' in full_path.lower() or 'deepfake' in lower_path or 'fake' in file.lower():
                        fake_files.append(full_path)
                    elif 'real_voice' in lower_path or '/real/' in lower_path or '\\real\\' in full_path.lower() or 'human' in lower_path or 'real' in file.lower():
                        real_files.append(full_path)
        
        # Optional sample balancing / limiting
        if max_samples_per_class is not None:
            real_files = real_files[:max_samples_per_class]
            fake_files = fake_files[:max_samples_per_class]
            
        for f in real_files:
            self.samples.append((f, 0)) # 0: REAL
        for f in fake_files:
            self.samples.append((f, 1)) # 1: FAKE
            
        print(f"[Dataset] Found {len(real_files)} REAL and {len(fake_files)} FAKE samples in: {data_dir}")
        print(f"[Dataset] Total dataset size: {len(self.samples)} samples.")

    def __len__(self):
        return len(self.samples)

    def _load_and_preprocess_audio(self, file_path):
        """Fast audio loading and preprocessing."""
        try:
            audio, sr = sf.read(file_path, dtype='float32')
            if len(audio.shape) > 1:
                audio = np.mean(audio, axis=1) # Mono conversion
            if sr != self.target_sr:
                audio = librosa.resample(audio, orig_sr=sr, target_sr=self.target_sr)
        except Exception:
            try:
                audio, sr = librosa.load(file_path, sr=self.target_sr)
            except Exception:
                audio = np.zeros(self.target_sr * 2, dtype=np.float32)

        # Remove leading/trailing silence if substantial
        if len(audio) > self.target_sr * 0.5:
            try:
                intervals = librosa.effects.split(audio, top_db=25)
                if len(intervals) > 0:
                    audio = audio[intervals[0][0]:intervals[-1][1]]
            except Exception:
                pass

        # Normalize
        max_val = np.max(np.abs(audio))
        if max_val > 1e-6:
            audio = audio / max_val
            
        return audio, self.target_sr

    def __getitem__(self, idx):
        file_path, label = self.samples[idx]
        
        try:
            audio, sr = self._load_and_preprocess_audio(file_path)
            mel_spec = generate_mel_spectrogram(audio, sr, n_mels=128)
            
            # Convert to Tensor (1, H, W) and resize to target img_size
            tensor_input = torch.tensor(mel_spec, dtype=torch.float32).unsqueeze(0).unsqueeze(0)
            tensor_input = F.interpolate(tensor_input, size=self.img_size, mode='bilinear', align_corners=False)
            
            return tensor_input.squeeze(0), torch.tensor(label, dtype=torch.long)
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            return torch.zeros((1, self.img_size[0], self.img_size[1]), dtype=torch.float32), torch.tensor(label, dtype=torch.long)
