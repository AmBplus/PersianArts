# v3.1 audio REMIX: Total War (expectation + its finale as BOTH the early climax and the
# closing climax) crossfaded into Risk for the feature chapters. Owner's direction:
# the track's ending is its best part — bring it up front right after the anticipation,
# then "remix" into another track for the features, and return to the ending at the close.
# Runs with cwd = work/dana/audio; paths repo-relative, no parent hops.
import json
import math
import wave

import numpy as np

SR = 48000
FILM_S = 70.6

def safe_path(p):
    return isinstance(p, str) and p != "" and ".." not in p and ":" not in p and not p.startswith("/")

def load_wav(path):
    if not safe_path(path):
        raise ValueError("bad path")
    with wave.open(path, "rb") as w:
        ch, sw, n = w.getnchannels(), w.getsampwidth(), w.getnframes()
        raw = w.readframes(n)
    if sw == 4:
        x = np.frombuffer(raw, dtype="<i4").astype(np.float64) / 2147483648.0
    elif sw == 2:
        x = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    else:
        raise ValueError("unexpected sample width")
    return x.reshape(-1, ch).T

def write_wav24(name, data):
    x = np.clip(data.T, -1, 1)
    i32 = (x.reshape(-1) * (2 ** 23 - 1)).astype("<i4")
    b = i32.view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(name, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(b)

# (source file, source start s, source end s, film start s). Consecutive segments
# crossfade over XFADE s (equal power); each segment is RMS-matched to a common level
# so splices from two masters sit at one loudness before the final master stage.
TW = "music/total-war-48.wav"
RK = "music/risk-48.wav"
XFADE = 0.5
SEGS = [
    (TW, 0.00, 16.80, 0.00),      # A anticipation (ends just past the first hit)
    (TW, 52.55, 65.60, 16.56),    # B early climax: the finale block up front (last hit lands ~28.6)
    (RK, 9.90, 29.60, 29.20),     # C features: Risk hook + drive (remix switch)
    (RK, 31.00, 34.80, 48.80),    # D breath: Risk dip/breakdown
    (TW, 52.55, 70.60, 52.30),    # E closing climax: the finale again, played in full
]

def seg_rms(x):
    return math.sqrt(np.mean(x * x) + 1e-12)

tw = load_wav(TW)
rk = load_wav(RK)
srcs = {TW: tw, RK: rk}

# RMS-match every segment to the anticipation segment's level
ref_rms = seg_rms(tw[:, : int(16.8 * SR)])
out = np.zeros((2, int(FILM_S * SR) + int(XFADE * SR) + SR))
for path, s0, s1, film0 in SEGS:
    a, b = int(s0 * SR), int(s1 * SR)
    seg = srcs[path][:, a:b].copy()
    g = ref_rms / seg_rms(seg)
    seg *= g
    i0 = int(film0 * SR)
    n = seg.shape[1]
    fade_in = np.minimum(np.linspace(0, 1, int(XFADE * SR)), 1.0)
    fade_in = np.sin(fade_in * math.pi / 2)  # equal-power
    if i0 == 0:
        seg[:, : 80] *= np.linspace(0, 1, 80)  # click guard at absolute zero
    else:
        seg[:, : len(fade_in)] *= fade_in
    out[:, i0:i0 + n] += seg
out = out[:, : int(FILM_S * SR)]
out[:, -int(1.4 * SR):] *= np.linspace(1, 0, int(1.4 * SR))

# ---------- SFX ----------
def load_mono(path):
    return load_wav(path)[0]

EVENTS = [
    (16.50, "sfx48/RunwayGroundSkim.wav", -22.0, 2.8, 0.8),
    (16.56, "sfx48/CelFlashStomp.wav", -16.0, 1.1, 0.2),
    (28.55, "sfx48/CountdownArcScatter.wav", -16.0, 1.2, 0.2),
    (29.20, "sfx48/RunwayGroundSkim.wav", -22.0, 2.8, 0.8),
    (37.20, "sfx48/SplitFlapFlip.wav", -20.0, 2.5, 0.8),
    (48.80, "sfx48/RunwayGroundSkim.wav", -22.0, 2.8, 0.8),
    (64.55, "sfx48/RadialWave.wav", -16.0, 5.5, 1.5),
]
need = out.shape[1]
for t, path, gain_db, max_s, fade_s in EVENTS:
    s = load_mono(path)[: int(max_s * SR)]
    nf = int(fade_s * SR)
    if nf > 0 and len(s) > nf:
        s[-nf:] *= np.linspace(1, 0, nf)
    i0 = int(t * SR)
    i1 = min(need, i0 + len(s))
    out[:, i0:i1] += s[: i1 - i0] * (10 ** (gain_db / 20))

# ---------- master (ffmpeg ebur128 is the reference; trim at the end) ----------
def bq(x, b, a):
    X = np.fft.rfft(x)
    w = 2 * np.pi * np.fft.rfftfreq(len(x), 1 / SR)
    z = np.exp(-1j * w)
    return np.fft.irfft(X * (b[0] + b[1] * z + b[2] * z * z) / (a[0] + a[1] * z + a[2] * z * z), len(x))

def lufs(data):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1, -2, 1], [1, -1.99004745483398, 0.99007225036621]
    y = np.stack([bq(bq(data[c], b1, a1), b2, a2) for c in range(2)])
    blk, st = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([np.mean(y[:, i * st:i * st + blk] ** 2) for i in range((y.shape[1] - blk) // st + 1)])
    L = -0.691 + 10 * np.log10(np.maximum(ms, 1e-12))
    k = L > -70
    if not k.any():
        return -70.0
    rel = -0.691 + 10 * np.log10(np.mean(ms[k]))
    k &= L >= rel - 10
    return float(-0.691 + 10 * np.log10(np.mean(ms[k]) if k.any() else np.mean(ms[L > -70])))

def true_peak(data):
    n = data.shape[1]
    L4 = 1 << int(np.ceil(np.log2(4 * n)))
    pk = 0.0
    for c in range(2):
        pk = max(pk, float(np.abs(np.fft.irfft(np.fft.rfft(data[c], L4), L4)).max()))
    return 20 * math.log10(pk + 1e-12)

mix = out
for _ in range(4):
    g = 10 ** ((-12.0 - lufs(mix)) / 20)
    cand = mix * g
    t = 10 ** (-2.8 / 20)
    m = np.abs(cand)
    cand = np.sign(cand) * np.where(m > t, t + (1 - t) * np.tanh((m - t) / (1 - t)), m)
    mix = cand
    if abs(lufs(mix) + 14.0) < 0.35:
        break
excess = true_peak(mix) + 2.0
if excess > 0:
    mix *= 10 ** (-excess / 20)
# final trim measured against ffmpeg ebur128 is applied after verifying this render
write_wav24("v3/dana31-remix.wav", mix)
print(json.dumps({"lufsInternal": round(lufs(mix), 2), "truePeakDbtp": round(true_peak(mix), 2)}))
