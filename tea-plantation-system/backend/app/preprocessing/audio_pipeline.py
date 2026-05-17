from io import BytesIO

import librosa
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample
from PIL import Image


TARGET_SR = 16000
TARGET_SAMPLES = 48000


def preprocess_audio(audio_bytes: bytes) -> np.ndarray:
    sr, signal = wavfile.read(BytesIO(audio_bytes))
    if signal.ndim > 1:
        signal = signal.mean(axis=1)
    duration = len(signal) / float(sr)
    if duration < 1:
        raise ValueError("AUDIO_TOO_SHORT")

    signal = signal.astype(np.float32)
    if sr != TARGET_SR:
        signal = resample(signal, int(len(signal) * TARGET_SR / sr))

    freq = np.fft.rfftfreq(len(signal), 1 / TARGET_SR)
    fft = np.fft.rfft(signal)
    fft[(freq < 200) | (freq > 8000)] = 0
    signal = np.fft.irfft(fft)

    if len(signal) > TARGET_SAMPLES:
        signal = signal[:TARGET_SAMPLES]
    elif len(signal) < TARGET_SAMPLES:
        signal = np.pad(signal, (0, TARGET_SAMPLES - len(signal)))

    mel = librosa.feature.melspectrogram(y=signal, sr=TARGET_SR, n_mels=128, hop_length=512, n_fft=2048)
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mel_norm = (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-8)
    mel_img = Image.fromarray((mel_norm * 255).astype(np.uint8)).resize((128, 128), Image.Resampling.BILINEAR)
    mel_arr = np.asarray(mel_img).astype(np.float32) / 255.0
    mel_3ch = np.stack([mel_arr, mel_arr, mel_arr], axis=-1)
    return np.expand_dims(mel_3ch, axis=0)
