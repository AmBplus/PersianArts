"""Beat tracker (numpy only): spectral-flux onset envelope, autocorrelation tempo, LS beat-phase fit."""
import os, subprocess, numpy as np
REPO = os.environ.get("PA_REPO") or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
MUS = os.path.join(REPO, "media", "dana", "music")
SR = 22050; NFFT = 1024; HOP = 128; FR = SR / HOP

def decode(name, sr=SR, ch=1, ss=None, t=None, extra=None):
    cmd = ["ffmpeg", "-v", "error"]
    if ss is not None: cmd += ["-ss", str(ss)]
    if t is not None: cmd += ["-t", str(t)]
    cmd += ["-i", os.path.join(MUS, name)]
    if extra: cmd += ["-af", extra]
    cmd += ["-f", "f32le", "-ac", str(ch), "-ar", str(sr), "-"]
    a = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32)
    return a.reshape(-1, ch) if ch > 1 else a.copy()

def onset_env(x):
    w = np.hanning(NFFT).astype(np.float32)
    n = 1 + (len(x) - NFFT) // HOP
    idx = np.arange(NFFT)[None, :] + HOP * np.arange(n)[:, None]
    S = np.abs(np.fft.rfft(x[idx] * w, axis=1))[:, 2:372]  # up to ~8 kHz
    L = np.log1p(200 * S)
    d = np.maximum(L[1:] - L[:-1], 0).sum(1)
    d = np.concatenate([[0], d])
    k = int(0.4 * FR); m = np.convolve(d, np.ones(k) / k, "same")
    e = np.maximum(d - m, 0)
    return e / (e.std() + 1e-9)   # frame i centred at time (i*HOP + NFFT/2)/SR ; we correct below

T0 = (NFFT / 2) / SR  # centre offset of frame 0 (flux frame i uses frames i-1,i -> centre ~ same)

def global_tempo(e):
    e = e - e.mean(); n = len(e)
    ac = np.correlate(e, e, "full")[n - 1:]
    lo, hi = int(FR * 60 / 200), int(FR * 60 / 60)
    seg = ac[lo:hi]
    # pick strongest, with parabolic refine
    i = int(np.argmax(seg)) + lo
    if 1 <= i < len(ac) - 1:
        a, b, c = ac[i - 1], ac[i], ac[i + 1]; den = a - 2 * b + c
        d = 0.5 * (a - c) / den if den != 0 else 0
    else: d = 0
    return 60 * FR / (i + d)

def interp(e, t):  # sample envelope at times t (seconds, absolute)
    f = (np.asarray(t) - T0) * FR
    return np.interp(f, np.arange(len(e)), e, left=0, right=0)

def fit_window(e, s, dur=30.0, period=0.5, search=0.02):
    """For window [s,s+dur): scan period in 0.5*(1±search) & phase; LS refine. Returns dict."""
    best = None
    ph = np.arange(0, 0.5, 0.002)
    for p in np.linspace(period * (1 - search), period * (1 + search), 21):
        k = np.arange(int(dur / p))
        sc = np.array([interp(e, s + f + k * p).sum() for f in ph])
        j = int(np.argmax(sc))
        if best is None or sc[j] > best[0]: best = (sc[j], p, ph[j])
    sc, p, f = best
    for it in range(3):  # LS refine on local maxima near predicted beats
        k = np.arange(int(dur / p)); pred = s + f + k * p
        ts, ks, ws = [], [], []
        for kk, tp in zip(k, pred):
            tt = np.arange(tp - 0.05, tp + 0.0501, 0.002); v = interp(e, tt); j = int(np.argmax(v))
            if v[j] > 0.8: ts.append(tt[j]); ks.append(kk); ws.append(v[j])
        if len(ts) < 8: break
        ts, ks, ws = map(np.array, (ts, ks, ws))
        A = np.stack([np.ones_like(ks), ks], 1).astype(float); W = np.sqrt(ws)[:, None]
        coef = np.linalg.lstsq(A * W, ts * W[:, 0], rcond=None)[0]
        f, p = coef[0] - s, coef[1]
    res = ts - (s + f + ks * p)
    return dict(start=s, period=p, bpm=60 / p, phase=f, score=float(sc) / len(k), n_det=len(ts), n_beats=len(k),
                med_res_ms=float(np.median(np.abs(res)) * 1e3), max_res_ms=float(np.abs(res).max() * 1e3),
                ibi_std_ms=float(np.std(np.diff(ts) / np.diff(ks)) * 1e3) if len(ts) > 2 else 99)

KS_MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
KS_MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
def key_mode(x, sr=SR):
    n = 4096; hop = 2048; w = np.hanning(n)
    fr = np.arange(0, len(x) - n, hop)
    acc = np.zeros(12); fq = np.fft.rfftfreq(n, 1 / sr)
    sel = (fq > 65) & (fq < 2000); pc = (np.round(12 * np.log2(fq[sel] / 440.0)).astype(int) + 9) % 12
    for i in fr:
        m = np.abs(np.fft.rfft(x[i:i + n] * w))[sel]
        acc += np.bincount(pc, weights=m ** 2, minlength=12)
    acc = np.sqrt(acc)
    best = (-2, "")
    for r in range(12):
        for nm, pr in (("major", KS_MAJ), ("minor", KS_MIN)):
            c = np.corrcoef(acc, np.roll(pr, r))[0, 1]
            if c > best[0]: best = (c, f"{'C C# D D# E F F# G G# A A# B'.split()[r]} {nm}")
    return best, acc / acc.sum()

def brightness(x, sr=SR):
    n = 2048; seg = x[: len(x) // n * n].reshape(-1, n) * np.hanning(n)
    M = np.abs(np.fft.rfft(seg, axis=1)); fq = np.fft.rfftfreq(n, 1 / sr)
    return float((M * fq).sum() / (M.sum() + 1e-9))
