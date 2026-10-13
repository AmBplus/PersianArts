import sys, json, glob, os
import numpy as np, librosa
sys.stdout.reconfigure(encoding="utf-8")
S = "media/music-staging/viditor"
def audit(i):
    y, sr = librosa.load(f"{S}/{i}.wav", sr=22050, mono=True, duration=90)
    dur = len(y) / sr
    rms = librosa.feature.rms(y=y)[0]
    db = 20 * np.log10(rms + 1e-9)
    n = len(db); q = max(1, n // 4)
    arc = [round(float(np.mean(db[k*q:(k+1)*q])), 1) for k in range(4)]
    S_ = np.abs(librosa.stft(y, n_fft=2048))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    tot = S_.sum() + 1e-9
    bass = float(S_[freqs < 150].sum() / tot)
    cent = float(np.mean(librosa.feature.spectral_centroid(S=S_, sr=sr)))
    flat = float(np.mean(librosa.feature.spectral_flatness(S=S_)))
    mid = float(S_[(freqs > 300) & (freqs < 3000)].sum() / tot)
    vocal_proxy = round(mid * (1 - min(flat * 10, 1)), 3)
    on = librosa.onset.onset_detect(y=y, sr=sr, units="time")
    density = round(len(on) / dur, 2)
    mel = librosa.power_to_db(librosa.feature.melspectrogram(y=y, sr=sr, n_mels=40))
    k = int(2 * sr / 512)
    a = mel[:, :k].mean(axis=1); b = mel[:, -k:].mean(axis=1)
    loop = round(float(np.corrcoef(a, b)[0, 1]), 3)
    return dict(id=i, dur=round(dur, 1), arc_db=arc, bass_ratio=round(bass, 3), centroid_hz=round(cent),
                flatness=round(flat, 4), vocal_proxy=vocal_proxy, onset_per_s=density, loop_corr=loop)
ids = sys.argv[1:]
res = [audit(i) for i in ids]
json.dump(res, open("media/music-staging/viditor/audit-metrics.json", "w", encoding="utf-8"), indent=1)
for r in res: print(r)
