"""Descriptors per owner track: duration, bass ratio (<150 Hz share of power), spectral centroid, RMS. Read-only."""
import json, sys, subprocess
from pathlib import Path
import numpy as np
import librosa

OWNER = Path(r"D:\P\project\persianArts\media\music-staging\owner")
out = {}
for p in sorted(OWNER.iterdir()):
    if p.suffix.lower() not in (".mp3", ".wav"):
        continue
    y, sr = librosa.load(str(p), sr=22050, mono=True)
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512)) ** 2
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    total = S.sum() + 1e-12
    bass = S[freqs < 150].sum() / total
    cent = librosa.feature.spectral_centroid(S=np.sqrt(S), sr=sr)[0]
    rms = librosa.feature.rms(S=np.sqrt(S))[0]
    out[p.name] = {"bass_ratio": round(float(bass), 4), "centroid_hz": round(float(np.median(cent)), 1),
                   "rms_db": round(float(20 * np.log10(np.median(rms) + 1e-9)), 2), "dur_s": round(len(y) / sr, 2)}
    print(p.name, out[p.name], flush=True)
(OWNER.parent / "owner-descriptors.tmp.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
