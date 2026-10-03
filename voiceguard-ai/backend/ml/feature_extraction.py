import librosa
import numpy as np

def extract_mfcc(audio, sr, n_mfcc=13):
    mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc)
    return np.mean(mfccs.T, axis=0)

def generate_mel_spectrogram(audio, sr, n_mels=128):
    mel_spec = librosa.feature.melspectrogram(y=audio, sr=sr, n_mels=n_mels)
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    return mel_spec_db

def extract_spectral_features(audio, sr):
    spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=audio, sr=sr))
    spectral_bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=audio, sr=sr))
    spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=audio, sr=sr, roll_percent=0.85))
    zero_crossing_rate = np.mean(librosa.feature.zero_crossing_rate(y=audio))
    rms_energy = np.mean(librosa.feature.rms(y=audio))
    
    return {
        "spectral_centroid": float(spectral_centroid),
        "spectral_bandwidth": float(spectral_bandwidth),
        "spectral_rolloff": float(spectral_rolloff),
        "zero_crossing_rate": float(zero_crossing_rate),
        "rms_energy": float(rms_energy)
    }

def get_all_features(audio, sr):
    mfcc = extract_mfcc(audio, sr)
    spectral = extract_spectral_features(audio, sr)
    
    features = {
        "mfcc": mfcc.tolist(),
        **spectral
    }
    return features
