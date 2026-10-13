#!/usr/bin/env python3
"""Uni short cut (12 s, 30 fps) sound: ONE recorded music bed + recorded SFX slices.
Only recorded audio is used: every sound is cut (and pitch/gain processed) from the tracks in media/dana/music.
Outputs (under media/film-versions/uni/short-v2/audio): mix-pre.wav, cue-sheet.json, cue-sheet.csv, music-segment.wav
Run:  python make_short_sound.py   (REPO from env PA_REPO or derived from this script location)
"""
import os, sys, json, csv, subprocess
import numpy as np

REPO = os.environ.get("PA_REPO") or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
MUS = os.path.join(REPO, "media", "dana", "music")
OUT = os.path.join(REPO, "media", "film-versions", "uni", "short-v2", "audio")
os.makedirs(OUT, exist_ok=True)
SR, FPS, DUR = 48000, 30, 12.0
N = int(SR * DUR)

# music: dana31-remix.mp3, measured 120.0 BPM, beats at 0.300 + 0.5k s (mean onset offset -10 ms), drums enter at 29.8 s.
MUSIC = "dana31-remix.mp3"
MUSIC_START = float(os.environ.get("MUSIC_START", "28.322"))  # beat 28.3 + 34 ms: measured music onsets sat +33..36 ms after the beat grid, so start later to land them on it


def load(name, ss, dur):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{ss}", "-t", f"{dur}", "-i", os.path.join(MUS, name),
           "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()


def stereo_music(name, ss, dur):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{ss}", "-t", f"{dur}", "-i", os.path.join(MUS, name),
           "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, 2).copy()


def db(v): return 10 ** (v / 20)


def pitch(x, ratio):  # resample (varispeed), recorded audio only
    n = int(len(x) / ratio)
    return np.interp(np.arange(n) * ratio, np.arange(len(x)), x).astype(np.float32)


def fade(x, a=0.004, b=0.05):
    x = x.copy(); na, nb = int(a * SR), int(b * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x


def norm(x, peak=1.0): return x / (np.abs(x).max() + 1e-9) * peak


# --- recorded SFX slices (source track, start s, length s) ---
# boom: clean low impact at 0.546 s of dana31-remix (pre-silence ratio ~10000x). tap: staccato string pluck of risk-main-title at 34.76 s.
# ding: clean piano/bell note of inspiring-cinematic-Tunetank at 1.115 s. stinger: bright hit of epic-hollywood-trailer at 45.023 s.
# whoosh: rising swell of epic-trailer-buildup, high-passed.
def hp(x, fc):
    from numpy.fft import rfft, irfft, rfftfreq
    X = rfft(x); f = rfftfreq(len(x), 1 / SR); X *= np.clip((f - fc * 0.5) / (fc * 0.5), 0, 1) ** 2
    return irfft(X, len(x)).astype(np.float32)


def lp(x, fc):
    from numpy.fft import rfft, irfft, rfftfreq
    X = rfft(x); f = rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / fc) ** 4)
    return irfft(X, len(x)).astype(np.float32)


PRE = 0.012
S = {}
S["boom"] = fade(norm(load("dana31-remix.mp3", 0.546 - PRE, 1.6)), 0.002, 0.6)
S["sub"] = fade(norm(lp(pitch(S["boom"], 0.5), 120)), 0.002, 0.6)
S["tap"] = fade(norm(load("risk-main-title.mp3", 34.76 - PRE, 0.30)), 0.002, 0.12)
S["ding"] = fade(norm(load("inspiring-cinematic-Tunetank.mp3", 1.115 - PRE, 1.8)), 0.002, 0.5)
S["stinger"] = fade(norm(load("epic-hollywood-trailer.mp3", 45.023 - PRE, 1.2)), 0.002, 0.4)


def find_swell(name, win=1.0):
    x = load(name, 0, 60); step = int(0.1 * SR); w = int(win * SR)
    best = (0, 0)
    for i in range(0, len(x) - w, step):
        a = np.sqrt((x[i:i + w // 3] ** 2).mean() + 1e-9); b = np.sqrt((x[i + 2 * w // 3:i + w] ** 2).mean() + 1e-9)
        r = b / a
        if r > best[0]: best = (r, i / SR)
    return best


r, t = find_swell("epic-trailer-buildup.mp3")
sw = load("epic-trailer-buildup.mp3", t, 1.0)
env = np.linspace(0, 1, len(sw)) ** 2
S["whoosh"] = norm(hp(sw, 800) * env) * 1.0
S["whoosh"] = fade(S["whoosh"], 0.05, 0.03)
SWELL = {"source": "epic-trailer-buildup.mp3", "start_s": round(t, 2), "rise_ratio": round(float(r), 2)}

# --- cue sheet: (frame, event, sample, pitch ratio, gain dB, lead-in?) gains are relative to a SFX base of -6 dBFS peak ---
CUES = [
    (30, "hook: question point lands", "ding", 1.0, -12, False),
    (75, "breadth: branch gen 1 (tap)", "tap", 1.0, -10, False),
    (75, "breadth: branch gen 1 (ding)", "ding", 1.0, -16, False),
    (90, "breadth: branch gen 2 (tap)", "tap", 1.0, -10, False),
    (90, "breadth: branch gen 2 (ding)", "ding", 1.122, -16, False),
    (105, "breadth: branch gen 3 HIT (tap)", "tap", 1.0, -8, False),
    (105, "breadth: branch gen 3 HIT (ding)", "ding", 1.26, -14, False),
    (120, "breadth: 120 stamp (accent) boom", "boom", 1.0, -3, False),
    (120, "breadth: 120 stamp sub", "sub", 1.0, -5, False),
    (135, "scale: pull-back whoosh lead-in into f165 (bed)", "whoosh", 1.0, -14, True),
    (165, "scale: 48,000 lands HIT", "ding", 1.122, -10, False),
    (180, "scale: row pulse", "tap", 1.0, -10, False),
    (255, "faculty: 25 lands HIT (accent bell)", "ding", 1.5, -4, False),
    (300, "gate: arch closes (soft stamp)", "boom", 1.0, -10, False),
    (315, "gate: wings close stinger", "stinger", 1.0, -8, False),
    (315, "gate: wings close chime", "ding", 1.5, -14, False),
    (330, "gate: dot becomes emblem dot", "ding", 1.26, -12, False),
    (345, "gate: FINAL stamp boom", "boom", 1.0, -2, False),
    (345, "gate: FINAL stamp chime", "ding", 1.0, -8, False),
]
ATT = {}
for _s, _r in sorted({(c[2], c[3]) for c in CUES}):
    if _s == "whoosh": continue
    _x = pitch(S[_s], _r) if _r != 1.0 else S[_s]
    _a = np.abs(_x[: int(.1 * SR)])
    ATT[f"{_s}@{_r}"] = round(float(np.argmax(_a > 0.3 * _a.max()) / SR * 1000 - PRE * 1000 / _r), 2)  # ms after the intended frame
print("sample attack offset vs frame (ms, + = late):", ATT)
WHOOSH_START_FRAME = 135 # whoosh is 1.0 s: starts f135, its swell peak lands at f165 (hit)


def sfx_len(s, r): return len(pitch(S[s], r)) if r != 1.0 else len(S[s])


bus = np.zeros((N, 2), dtype=np.float32)
sheet = []
duck = np.zeros(N, dtype=np.float32)  # dB reduction envelope for the music
BASE = db(-6)
for fr, ev, smp, ratio, g, lead in CUES:
    t0 = fr / FPS
    x = pitch(S[smp], ratio) if ratio != 1.0 else S[smp]
    if smp == "whoosh":
        pos = int(round(t0 * SR))  # whoosh swell ends at +1.0 s = hit frame
    else:
        pos = int(round(t0 * SR)) - int(PRE * SR / ratio) - int(ATT[f"{smp}@{ratio}"] * SR / 1000 * (0.2 if smp == "sub" else 1.0))  # 30%-peak attack lands on the frame
    x = x[: max(0, N - pos)]
    y = x * BASE * db(g)
    bus[pos:pos + len(y), 0] += y; bus[pos:pos + len(y), 1] += y
    if smp in ("boom", "stinger"):
        a = max(0, int((t0 - 0.02) * SR)); b = min(N, int((t0 + 0.15) * SR)); r2 = min(N, int((t0 + 0.45) * SR))
        duck[a:b] = np.maximum(duck[a:b], 3.0)
        duck[b:r2] = np.maximum(duck[b:r2], 3.0 * np.linspace(1, 0, r2 - b))
    sheet.append({"frame": fr, "time_s": round(t0, 4), "event": ev, "sample_file": f"{smp}",
                  "gain_db": g, "pitch_ratio": ratio, "lead_in": lead,
                  "start_frame": fr if not lead else WHOOSH_START_FRAME,
                  "start_time_s": round((WHOOSH_START_FRAME if lead else fr) / FPS, 4)})

# simultaneity check: count active SFX (nominal active window 0.6 s, whoosh 1.0 s) per frame
act = np.zeros(360)
for c in sheet:
    d = 1.0 if c["lead_in"] else 0.6
    # boom+sub and tap+ding pairs are single events (one accent); count unique frame groups
for f in range(360):
    grp = set()
    for c in sheet:
        d = 1.0 if c["lead_in"] else 0.6
        if c["start_time_s"] <= f / FPS < c["start_time_s"] + d:
            grp.add(c["frame"])
    act[f] = len(grp)
max_sim = int(act.max())

# --- music segment: fade in 0.3 s, fade out 0.8 s, duck ---
m = stereo_music(MUSIC, MUSIC_START, DUR)
if len(m) < N: m = np.pad(m, ((0, N - len(m)), (0, 0)))
m = m[:N]
m[: int(.3 * SR)] *= np.linspace(0, 1, int(.3 * SR))[:, None]
m[-int(.8 * SR):] *= np.linspace(1, 0, int(.8 * SR))[:, None]
# smooth duck envelope
k = int(0.02 * SR); duck = np.convolve(duck, np.ones(k) / k, "same")
m *= (10 ** (-duck / 20))[:, None]
# bed level: RMS about -19 dBFS (SFX are placed relative to the bed)
rms = np.sqrt((m ** 2).mean()); m *= db(-19) / rms
mix = m + bus
pk = np.abs(mix).max()
if pk > 0.95: mix *= 0.95 / pk
import wave
def wr(p, a):
    w = wave.open(p, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(a, -1, 1) * 32767).astype("<i2").tobytes()); w.close()
wr(os.path.join(OUT, "mix-pre.wav"), mix)
wr(os.path.join(OUT, "music-bed.wav"), m)
wr(os.path.join(OUT, "sfx-bus.wav"), bus)
json.dump({"fps": FPS, "frames": 360, "music": {"file": "media/dana/music/" + MUSIC, "start_s": MUSIC_START, "bpm": 120.0,
                                                  "fade_in_s": 0.3, "fade_out_s": 0.8, "stretch": "none (120.0 BPM = film grid)"},
           "sfx_sources": {"boom": "dana31-remix.mp3 @0.546s", "sub": "boom pitched down one octave, low-passed 120 Hz",
                           "tap": "risk-main-title.mp3 @34.76s", "ding": "inspiring-cinematic-Tunetank.mp3 @1.115s (varispeed pitch)",
                           "stinger": "epic-hollywood-trailer.mp3 @45.023s", "whoosh": SWELL},
           "max_simultaneous_sfx_events": max_sim, "cues": sheet}, open(os.path.join(OUT, "cue-sheet.json"), "w"), indent=1)
with open(os.path.join(OUT, "cue-sheet.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(sheet[0].keys())); w.writeheader(); w.writerows(sheet)
print("max simultaneous event groups", max_sim, "peak", float(pk))
