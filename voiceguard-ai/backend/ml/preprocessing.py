import os
import subprocess
import tempfile
import librosa
import numpy as np
import soundfile as sf

def convert_audio_to_wav(input_path, target_sr=16000):
    """
    Decodes any audio container (WebM, Opus, MP3, M4A, OGG, WAV) using imageio-ffmpeg
    and outputs a standardized 16kHz mono WAV file.
    """
    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        temp_wav.close()

        cmd = [
            ffmpeg_exe, "-y", "-i", input_path,
            "-ar", str(target_sr),
            "-ac", "1",
            temp_wav.name
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode == 0 and os.path.exists(temp_wav.name) and os.path.getsize(temp_wav.name) > 0:
            return temp_wav.name
    except Exception as e:
        print(f"[Audio Decoding] FFmpeg decode error: {e}")
    
    return input_path

def load_audio(file_path, target_sr=16000):
    """Load audio file with automatic format conversion and resample to target_sr."""
    wav_path = convert_audio_to_wav(file_path, target_sr)
    try:
        audio, sr = sf.read(wav_path, dtype='float32')
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1) # Convert stereo to mono
        if sr != target_sr:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)
            sr = target_sr
    except Exception:
        try:
            audio, sr = librosa.load(wav_path, sr=target_sr)
        except Exception:
            # Synthetic fallback wave if audio payload is corrupt
            sr = target_sr
            audio = np.zeros(target_sr * 2, dtype=np.float32)
    finally:
        if wav_path != file_path and os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except Exception:
                pass

    return audio, sr

def normalize_audio(audio):
    """Normalize audio amplitude to [-1, 1]."""
    if len(audio) == 0:
        return audio
    max_val = np.max(np.abs(audio))
    if max_val > 1e-6:
        return audio / max_val
    return audio

def remove_silence(audio, top_db=25):
    """Remove silence from beginning and end of audio."""
    if len(audio) < 8000:
        return audio
    try:
        intervals = librosa.effects.split(audio, top_db=top_db)
        if len(intervals) > 0:
            trimmed = audio[intervals[0][0]:intervals[-1][1]]
            if len(trimmed) >= 8000:
                return trimmed
    except Exception:
        pass
    return audio

def preprocess_pipeline(file_path, target_sr=16000, min_duration=1.0):
    """Run full preprocessing pipeline on an audio file with minimum duration guarantee."""
    audio, sr = load_audio(file_path, target_sr)
    audio = remove_silence(audio)
    audio = normalize_audio(audio)
    
    # Ensure minimum audio length (at least 1 second / 16000 samples)
    min_samples = int(sr * min_duration)
    if len(audio) < min_samples:
        if len(audio) == 0:
            audio = np.zeros(min_samples, dtype=np.float32)
        else:
            repeats = int(np.ceil(min_samples / len(audio)))
            audio = np.tile(audio, repeats)[:min_samples]
            
    return audio, sr
