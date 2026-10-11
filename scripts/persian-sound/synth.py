"""Deterministic numpy synthesis for Persian shotcraft sound.

Implements the SFX kinds of docs/PERSIAN-SOUND-SPEC.md section 1 (impact,
whoosh, tick, pop, riser) and the music instruments of section 2 (kick, clap,
hat, bass, pad, pluck incl. Karplus-Strong, sparkle) plus a small Schroeder
reverb and a profile-driven phrase renderer. No mixer/CLI/muxing here.
Only dependency: numpy.
"""
import json
import os
import re
import wave

import numpy as np

SR = 44100
_ROOT = os.path.dirname(os.path.abspath(__file__))
PROFILES_PATH = os.path.join(_ROOT, "profiles.json")


# ---------------------------------------------------------------- utilities

def fnv1a(s):
    h = 2166136261
    for b in str(s).encode("utf-8"):
        h ^= b
        h = (h * 16777619) & 0xFFFFFFFF
    return h


def db(g):
    return 10.0 ** (g / 20.0)


def _stereo(x):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    return x


def place(buf, x, t_sec, gain_db=0.0):
    """Mix signal x (already at final level) into stereo buffer buf at t_sec."""
    x = _stereo(x) * db(gain_db)
    i = int(round(t_sec * SR))
    if i < 0:
        x = x[-i:]
        i = 0
    if i >= len(buf):
        return
    n = min(len(x), len(buf) - i)
    if n > 0:
        buf[i:i + n] += x[:n]


def env_ad(n, attack, decay, curve=5.0):
    t = np.arange(n) / SR
    e = np.exp(-curve * np.clip(t - attack, 0, None) / max(decay, 1e-4))
    na = max(1, int(attack * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def fft_band(x, lo=None, hi=None):
    """Smooth band-pass via FFT (zero phase, deterministic)."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1.0 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1.0 / (1.0 + np.exp(-(f - lo) / max(lo * 0.25, 5.0)))
    if hi:
        g *= 1.0 / (1.0 + np.exp((f - hi) / max(hi * 0.25, 5.0)))
    return np.fft.irfft(X * g, n)


def fft_lpf(x, fc):
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1.0 / SR)
    g = 1.0 / np.sqrt(1.0 + (f / max(fc, 1.0)) ** 2)
    return np.fft.irfft(X * g, n)


def saw(freq, n, phase=0.0):
    ph = (freq * np.arange(n) / SR + phase) % 1.0
    return 2.0 * ph - 1.0


def sweep_noise(dur, f0, f1, q=3.0, rng=None, rise_amp=False):
    """Noise through a time-varying log-domain gaussian band-pass (OLA)."""
    rng = rng or np.random.default_rng(0)
    n = int(dur * SR)
    x = rng.standard_normal(n)
    win, hop = 4096, 1024
    out = np.zeros(n + win)
    winf = np.hanning(win)
    freqs = np.fft.rfftfreq(win, 1.0 / SR)
    lf = np.log(np.maximum(freqs, 1.0))
    centers = np.geomspace(max(f0, 30.0), max(f1, 30.0), max(2, n // hop))
    window_env = (np.linspace(0.25, 1.0, len(centers)) if rise_amp
                  else np.ones(len(centers)))
    for j, c in enumerate(centers):
        seg = x[j * hop:j * hop + win]
        if len(seg) < win:
            seg = np.pad(seg, (0, win - len(seg)))
        X = np.fft.rfft(seg * winf)
        bw = max(c / q, 60.0)
        g = np.exp(-0.5 * ((lf - np.log(c)) * c / bw) ** 2)
        out[j * hop:j * hop + win] += window_env[j] * np.fft.irfft(X * g, win)
    y = out[:n]
    m = np.max(np.abs(y))
    return y / m if m > 0 else y


# ------------------------------------------------------- Schroeder reverb

def _delay(x, d):
    y = np.zeros_like(x)
    if d < len(x):
        y[d:] = x[:len(x) - d]
    return y


def _comb(x, dt, fb):
    D = max(1, int(dt * SR))
    y = np.zeros_like(x)
    term, k = x.copy(), 0
    while k * D < len(x) and k < 400:
        y += (fb ** k) * term
        term = _delay(term, D)
        k += 1
    return y


def _allpass(x, dt, g):
    D = max(1, int(dt * SR))
    y = -g * x.copy()
    term, k = _delay(x, D), 0
    while k * D < len(x) and k < 400:
        y += (g ** k) * term
        term = _delay(term, D)
        k += 1
    return y


def reverb(x, wet=0.18):
    """Small Schroeder reverb: 4 combs + 2 allpass, wet/dry mix."""
    x = _stereo(x)
    dry = x * (1.0 - wet)
    wetb = np.zeros_like(x)
    combs = [(0.0297, 0.77), (0.0371, 0.75), (0.0411, 0.73), (0.0437, 0.71)]
    for ch in range(2):
        mono = x[:, ch]
        y = sum(_comb(mono, d, fb) for d, fb in combs)
        y = _allpass(y, 0.005, 0.7)
        y = _allpass(y, 0.0017, 0.7)
        m = np.max(np.abs(y))
        if m > 0:
            y /= m
        wetb[:, ch] = y
    a, b = wetb[:, 0].copy(), wetb[:, 1].copy()      # tiny stereo width
    wetb[:, 0] = 0.9 * a + 0.1 * b
    wetb[:, 1] = 0.1 * a + 0.9 * b
    return dry + wet * wetb


# ------------------------------------------------------------- SFX kinds

def impact(rng=None, gain_db=-6.0):
    rng = rng or np.random.default_rng(0)
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    f = 90.0 * (40.0 / 90.0) ** np.clip(t / 0.3, 0, 1)   # 90 -> 40 Hz thump
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, 0.002, 0.22)
    burst = fft_band(rng.standard_normal(n), 150, 2500) * env_ad(n, 0.001, 0.05)
    y = thump + 0.5 * burst
    y = reverb(y, wet=0.35)                              # short tail
    y = y / np.max(np.abs(y))
    return _stereo(y) * db(gain_db)


def whoosh(rng=None, gain_db=-10.0, dur=0.45, direction="down"):
    rng = rng or np.random.default_rng(0)
    lo, hi = (600.0, 3500.0) if direction == "up" else (3500.0, 600.0)
    y = sweep_noise(dur, lo, hi, q=2.5, rng=rng)
    n = len(y)
    y *= env_ad(n, dur * 0.55, dur * 0.4, curve=3.0)
    y /= max(np.max(np.abs(y)), 1e-9)
    return _stereo(y) * db(gain_db)


def tick(rng=None, gain_db=-14.0, timbre=0):
    rng = rng or np.random.default_rng(0)
    n = int(0.03 * SR)
    y = fft_band(rng.standard_normal(n), 3000 if timbre == 0 else 5000, 14000)
    y *= env_ad(n, 0.0005, 0.006, curve=8.0)
    y /= max(np.max(np.abs(y)), 1e-9)
    return _stereo(y) * db(gain_db)


def pop(rng=None, gain_db=-16.0):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    f = 880.0 * (440.0 / 880.0) ** np.clip(t / 0.06, 0, 1)  # 880 -> 440 in 60 ms
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, 0.001, 0.05, curve=7.0)
    rng = rng or np.random.default_rng(0)
    y += 0.05 * fft_band(rng.standard_normal(n), 800, 6000) * env_ad(n, 0.0005, 0.02)
    y /= max(np.max(np.abs(y)), 1e-9)
    return _stereo(y) * db(gain_db)


def riser(rng=None, gain_db=-12.0, dur=1.1):
    rng = rng or np.random.default_rng(0)
    y = sweep_noise(dur, 250.0, 6500.0, q=2.0, rng=rng, rise_amp=True)
    n = len(y)
    y *= np.linspace(0.05, 1.0, n) ** 2                 # rising into the cue
    y[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
    y /= max(np.max(np.abs(y)), 1e-9)
    return _stereo(y) * db(gain_db)


# -------------------------------------------------------- music instruments

def kick(rng=None, gain_db=-12.0):
    rng = rng or np.random.default_rng(7)
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    f = 120.0 * (45.0 / 120.0) ** np.clip(t / 0.15, 0, 1)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, 0.001, 0.12, curve=6.0)
    click = fft_band(rng.standard_normal(n), 2000, 9000)
    y += 0.25 * click * env_ad(n, 0.0002, 0.006, curve=10.0)
    y /= max(np.max(np.abs(y)), 1e-9)
    return _stereo(y) * db(gain_db)


def clap(rng=None, gain_db=-16.0):
    rng = rng or np.random.default_rng(0)
    n = int(0.09 * SR)
    y = fft_band(rng.standard_normal(n), 1200, 3500)
    y *= env_ad(n, 0.001, 0.055, curve=7.0)
    for d_ms in (10.0, 21.0):                           # multi-tap clap feel
        d = int(d_ms * SR / 1000)
        y[d:] += 0.5 * y[:-d]
    y /= max(np.max(np.abs(y)), 1e-9)
    return _stereo(y) * db(gain_db)


def hat(rng=None, gain_db=-22.0, dur=0.025):
    rng = rng or np.random.default_rng(0)
    n = int(dur * SR)
    y = fft_band(rng.standard_normal(n), 7000, None)
    y *= env_ad(n, 0.0004, dur * 0.7, curve=9.0)
    y /= max(np.max(np.abs(y)), 1e-9)
    return _stereo(y) * db(gain_db)


def bass(freq, dur=0.4, gain_db=-18.0):
    n = int(dur * SR)
    y = saw(freq, n) * 0.6 + np.sin(np.pi * freq * np.arange(n) / SR) * 0.4
    y = fft_lpf(y, 280.0)                               # lowpass ~280 Hz
    y *= env_ad(n, 0.004, dur * 0.8, curve=4.0)
    y /= max(np.max(np.abs(y)), 1e-9)
    return _stereo(y) * db(gain_db)


def pad(freqs, dur=2.0, gain_db=-24.0, attack=0.25):
    n = int(dur * SR)
    y = np.zeros(n)
    for f0 in freqs:
        for det in (-7.0, 0.0, 7.0):
            ph = np.random.default_rng(int(abs(f0 * det) * 7 + f0)).uniform(0, 1)
            y += saw(f0 * 2 ** (det / 1200.0), n, phase=ph) / (3 * len(freqs))
    y = fft_lpf(y, 1200.0)
    t = np.arange(n) / SR
    env = np.minimum(1.0, t / attack) * np.minimum(1.0, np.maximum(0.0, dur - t) / 0.3)
    y *= env
    y /= max(np.max(np.abs(y)), 1e-9)
    return _stereo(y) * db(gain_db)


def pluck(freq, dur=0.6, gain_db=-20.0, engine="karplus", rng=None):
    """Karplus-Strong pluck ('karplus'/'setar') or additive marimba pluck."""
    n = int(dur * SR)
    rng = rng or np.random.default_rng(int(freq * 1000) % (2 ** 31))
    if engine == "marimba":
        t = np.arange(n) / SR
        y = (np.sin(2 * np.pi * freq * t) * np.exp(-t * 9)
             + 0.4 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t * 18)
             + 0.2 * np.sin(2 * np.pi * freq * 10 * t) * np.exp(-t * 30))
        y *= env_ad(n, 0.002, dur * 0.5)
    else:
        damp = 0.496 if engine == "setar" else 0.5      # setar rings longer
        N = max(2, int(SR / freq))
        buf = rng.uniform(-1.0, 1.0, N)
        y = np.empty(n)
        idx = 0
        for i in range(n):
            cur = buf[idx]
            y[i] = cur
            nxt = idx + 1
            if nxt >= N:
                nxt = 0
            buf[idx] = damp * (cur + buf[nxt])
            idx = nxt
        y *= env_ad(n, 0.002, dur)
    y /= max(np.max(np.abs(y)), 1e-9)
    return _stereo(y) * db(gain_db)


def sparkle(freq, dur=0.5, gain_db=-26.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * freq * t + 0.3 * np.sin(2 * np.pi * freq * 2.01 * t))
    y *= env_ad(n, 0.001, dur * 0.6, curve=5.0)
    y /= max(np.max(np.abs(y)), 1e-9)
    return _stereo(y) * db(gain_db)


# ------------------------------------------------------------ note parsing

_NOTE = dict(C=0, D=2, E=4, F=5, G=7, A=9, B=11)


def note_hz(name):
    m = re.match(r"^([A-G])([#b]?)(-?\d)(?:([+-])(\d+))?$", name.strip())
    if not m:
        raise ValueError("bad note: " + repr(name))
    semis = _NOTE[m.group(1)] + (1 if m.group(2) == "#" else
                                 -1 if m.group(2) == "b" else 0)
    cents = ((1 if m.group(4) == "+" else -1) * int(m.group(5))) if m.group(4) else 0
    midi = 12 * (int(m.group(3)) + 1) + semis
    return 440.0 * 2 ** ((midi - 69) / 12.0) * 2 ** (cents / 1200.0)


# ----------------------------------------------------------- profile data

def load_profiles():
    with open(PROFILES_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _pattern_times(pattern, dur, beat, rng):
    """Beat positions for a layer pattern over dur seconds."""
    total = dur / beat
    t = []
    if pattern == "4-floor":
        t = list(np.arange(0, total, 1.0))
    elif pattern == "light":
        t = list(np.arange(0, total, 2.0))
        t += [b + 2.5 for b in np.arange(0, total - 2.5, 4.0)]
    elif pattern == "8ths":
        t = list(np.arange(0, total, 0.5))
    elif pattern == "offbeats":
        t = [x for x in np.arange(0, total, 0.5) if abs(x % 1.0 - 0.5) < 1e-6]
    elif pattern == "2/4":
        t = [b for b in np.arange(0, total, 1.0) if int(round(b)) % 2 == 1]
    elif pattern in ("roots", "pops"):
        t = list(np.arange(0, total, 2.0))
    elif pattern == "motif":
        t = list(np.arange(0, total, 0.5))
    elif pattern == "sparse":
        t = [float(x) for x in np.arange(0, total, 1.0) if rng.random() < 0.25]
    elif pattern == "typewriter":
        t = list(np.arange(0.25, min(total, 3.0), 0.25))
    elif pattern == "drone":
        t = [0.0]
    return [b for b in t if b * beat < dur]


def render_phrase(profile_name, dur=4.0, seed="test", with_sfx=True):
    """Render a sting-style attack -> groove -> resolve phrase for a profile.

    Returns (stereo float64 array, sample rate). Deterministic for a seed."""
    profiles = load_profiles()
    if profile_name not in profiles:
        profile_name = "clean-tech"
    p = profiles[profile_name]
    rng = np.random.default_rng(fnv1a(profile_name + "|" + seed))
    bpm = rng.uniform(*p["bpm"])
    beat = 60.0 / bpm
    tail = 0.45
    buf = np.zeros((int((dur + tail) * SR), 2))
    wetbuf = np.zeros_like(buf)
    scale = [note_hz(x) for x in p["scale"]]
    L = p["layers"]

    def layer(kind):
        cfg = L.get(kind)
        return cfg if isinstance(cfg, dict) else None

    for kind in ("kick", "clap", "hat", "tick", "pop"):
        cfg = layer(kind)
        if not cfg:
            continue
        for bpos in _pattern_times(cfg.get("pattern", "light"), dur, beat, rng):
            t = bpos * beat
            if kind == "hat" and p.get("swing"):
                t += (bpos % 1.0 > 0.25) * p["swing"] * 0.5 * beat
            g = cfg.get("gain", -20.0)
            if kind == "tick":
                g += rng.uniform(-1.5, 1.5)
                place(wetbuf, tick(rng, timbre=int(rng.integers(0, 2))), t, g)
            elif kind == "kick":
                place(buf, kick(rng), t, g)
            elif kind == "clap":
                place(buf, clap(rng), t, g)
            elif kind == "hat":
                place(buf, hat(rng), t, g)
            else:
                place(wetbuf, pop(rng), t, g)

    cfg = layer("bass")
    if cfg:
        for bpos in _pattern_times(cfg.get("pattern", "roots"), dur, beat, rng):
            f = scale[int(rng.integers(0, max(1, len(scale) // 2)))] * 0.5
            place(buf, bass(f, dur=min(0.45, beat * 0.9)), bpos * beat,
                  cfg.get("gain", -18.0))

    cfg = layer("pad")
    if cfg:
        degs = cfg.get("degrees", [0, 2, 4])
        chord = [scale[d % len(scale)] * 2 ** (d // len(scale)) for d in degs]
        place(wetbuf, pad(chord, dur=dur, attack=0.25), 0.0, cfg.get("gain", -24.0))
    cfg = layer("drone")
    if cfg:
        notes = [note_hz(x) for x in cfg["notes"]]
        place(wetbuf, pad(notes, dur=dur, attack=0.6), 0.0, cfg.get("gain", -26.0))

    cfg = layer("pluck")
    if cfg:
        step = int(cfg.get("step", 2))
        deg = 0
        for bpos in _pattern_times(cfg.get("pattern", "motif"), dur, beat, rng)[::step]:
            deg = int(np.clip(deg + rng.integers(-2, 3), 0, len(scale) * 2 - 1))
            f = scale[deg % len(scale)] * 2 ** (deg // len(scale))
            eng = cfg.get("engine", "karplus")
            place(wetbuf, pluck(f, dur=0.6, engine=eng, rng=rng), bpos * beat,
                  cfg.get("gain", -20.0))
            if cfg.get("ornament") and rng.random() < 0.5:
                place(wetbuf, pluck(f * 2 ** (2 / 12.0), dur=0.25, engine=eng, rng=rng),
                      bpos * beat - 0.05, cfg.get("gain", -20.0) + 6.0)

    cfg = layer("sparkle")
    if cfg:
        for bpos in _pattern_times("sparse", dur, beat, rng)[:3]:
            place(wetbuf, sparkle(scale[-1] * 2, dur=0.5), bpos * beat,
                  cfg.get("gain", -26.0))

    # resolve: final tonic chord rings ~0.45 s past the end
    place(buf, pad(scale[:3], dur=tail + 0.15, attack=0.05),
          float(int(dur / beat)) * beat, -20.0)

    sfx = p.get("sfx", {})
    if with_sfx and sfx.get("riser"):
        place(wetbuf, riser(rng), 0.0, -14.0)
    if with_sfx and sfx.get("impact"):
        place(buf, impact(rng), 0.0, -10.0)

    buf += reverb(wetbuf, wet=p.get("reverb_wet", 0.18))

    y = buf                                            # fades, no end click
    fi, fo = int(0.06 * SR), int(0.04 * SR)
    y[:fi] *= np.linspace(0, 1, fi)[:, None]
    y[-fo:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, fo)))[:, None]
    m = np.max(np.abs(y))
    if m > 0.98:
        y *= 0.98 / m
    return y, SR


# ---------------------------------------------------------------- wav i/o

def write_wav(path, data, sr=SR):
    data = np.asarray(data, dtype=np.float64)
    if data.ndim == 1:
        data = np.stack([data, data], axis=1)
    pcm = np.clip(np.round(data * 32767.0), -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
