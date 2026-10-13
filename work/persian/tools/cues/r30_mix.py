#!/usr/bin/env python3
"""R30-SYNC: event-driven cue sheet + mix. Recorded audio only (slices of media/dana/music, varispeed pitch, filters, gains).
usage: python r30_mix.py [--track dana31-remix.mp3 --start 29.321 --root 9 --tag main --ver long-v3]
"""
import os, sys, json, csv, argparse, subprocess, wave
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import beatlib as B
from beatlib import REPO, MUS
ap = argparse.ArgumentParser()
ap.add_argument("--track", default="dana31-remix.mp3"); ap.add_argument("--start", type=float, default=29.321)
ap.add_argument("--atempo", type=float, default=0.9996); ap.add_argument("--root", type=int, default=9)  # pitch class of key root (A=9)
ap.add_argument("--tag", default="main"); ap.add_argument("--ver", default="long-v8")
ap.add_argument("--shift", type=float, default=0.0)
ap.add_argument("--sfxshift", type=float, default=0.0); ap.add_argument("--scan", action="store_true")
a = ap.parse_args()
VER = os.path.join(REPO, "media", "film-versions", "uni", a.ver); OUT = os.path.join(VER, "audio"); os.makedirs(OUT, exist_ok=True)
SR, FPS, DUR = 48000, 30, 30.0; N = int(SR * DUR)
ev = json.load(open(os.path.join(VER, "events.json")))["events"]
db = lambda v: 10 ** (v / 20)


def load(name, ss, dur, ch=1):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{ss}", "-t", f"{dur}", "-i", os.path.join(MUS, name), "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"]
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()
    return x.reshape(-1, ch) if ch > 1 else x


def pitch(x, r):
    n = int(len(x) / r); return np.interp(np.arange(n) * r, np.arange(len(x)), x).astype(np.float32)


def fade(x, a_=0.004, b_=0.05):
    x = x.copy(); na, nb = int(a_ * SR), int(b_ * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x


def norm(x, peak=1.0): return x / (np.abs(x).max() + 1e-9) * peak


def filt(x, fn):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); return np.fft.irfft(X * fn(f), len(x)).astype(np.float32)


hp = lambda x, fc: filt(x, lambda f: np.clip((f - fc * .5) / (fc * .5), 0, 1) ** 2)
lp = lambda x, fc: filt(x, lambda f: 1 / (1 + (f / fc) ** 4))


def f0_of(x, lo=150, hi=3000):
    seg = x[int(0.02 * SR): int(0.7 * SR)]; seg = seg * np.hanning(len(seg))
    M = np.abs(np.fft.rfft(seg, 1 << 18)); f = np.fft.rfftfreq(1 << 18, 1 / SR); s = (f > lo) & (f < hi)
    return float(f[s][np.argmax(M[s])])


def onset_idx(x, frac=0.3):
    k = int(0.001 * SR); e = np.sqrt(np.convolve(x ** 2, np.ones(k) / k, "same")); return int(np.argmax(e >= frac * e.max()))


PRE = 0.012
S = {}
boom = fade(norm(load("dana31-remix.mp3", 0.546 - PRE, 1.6)), 0.002, 0.6)
sub = fade(norm(lp(pitch(boom, 0.5), 120)), 0.002, 0.6)
S["boom"] = norm(boom + 0.8 * sub[: len(boom)])[: int(0.9 * SR)]; S["boom"] = fade(S["boom"], 0.002, 0.3)
S["tick"] = fade(norm(hp(load("risk-main-title.mp3", 34.76 - PRE, 0.30), 1500))[: int(0.12 * SR)], 0.001, 0.08)
S["pluck_src"] = fade(norm(load("risk-main-title.mp3", 34.76 - PRE, 0.30)), 0.002, 0.12)
S["ding_src"] = fade(norm(load("inspiring-cinematic-Tunetank.mp3", 1.115 - PRE, 1.8)), 0.002, 0.5)
S["stinger"] = fade(norm(load("epic-hollywood-trailer.mp3", 45.023 - PRE, 1.2)), 0.002, 0.4)
x = load("epic-trailer-buildup.mp3", 0, 60); step = int(0.1 * SR); w = SR; best = (0, 0)
for i in range(0, len(x) - w, step):
    r = np.sqrt((x[i + 2 * w // 3:i + w] ** 2).mean() + 1e-9) / np.sqrt((x[i:i + w // 3] ** 2).mean() + 1e-9)
    if r > best[0]: best = (r, i / SR)
sw = load("epic-trailer-buildup.mp3", best[1], 1.0)[: int(0.7 * SR)]
sw = hp(sw, 800); sw = norm(sw * np.linspace(0, 1, len(sw)) ** 2); S["whoosh"] = fade(sw, 0.05, 0.03)

PENT = [0, 2, 4, 7, 9]


def note_freqs(lo=170, hi=900):
    out = []
    for m in range(0, 120):
        f = 440 * 2 ** ((m - 69) / 12)
        if lo <= f <= hi and ((m - a.root) % 12) in PENT: out.append(f)
    return out


NF = note_freqs()
f_ding = f0_of(S["ding_src"]); f_pl = f0_of(S["pluck_src"], 150, 1200)


def pitched(src, f0, idx, tail):
    c = [f for f in NF if 0.6 <= f / f0 <= 2.6] or [f0]
    f = c[idx % len(c)]; r = f / f0; y = pitch(src, r)[: int(tail * SR)]
    return fade(y, 0.002, min(0.35, tail * .6)), r, f


def build(e, i):
    t = e["type"]; L = []
    if t == "hero":
        d, r, f = pitched(S["ding_src"], f_ding, i, 0.5); L = [(S["boom"], -6, "boom", ""), (d, -12, "ding", f"{f:.0f}Hz")]
    elif t == "text": L = [(S["tick"], -17, "tick", "")]
    elif t == "art":
        d, r, f = pitched(S["ding_src"], f_ding, i + 2, 0.45); L = [(d, -12, "shimmer", f"{f:.0f}Hz")]
    elif t == "wipe": L = [(S["whoosh"], -13, "whoosh", ""), (S["boom"], -15, "boom", "")]
    elif t == "logo":
        if e["id"] == "shield": L = [(S["stinger"], -8, "stinger", "")]
        else:
            d, r, f = pitched(S["ding_src"], f_ding, i, 0.5); L = [(d, -10, "shimmer", f"{f:.0f}Hz")]
    elif t == "pill":
        p, r, f = pitched(S["pluck_src"], f_pl, i, 0.25); L = [(p, -12, "pluck", f"{f:.0f}Hz")]
    elif t == "cut":
        d, r, f = pitched(S["ding_src"], f_ding, i, 0.5); L = [(S["boom"], -8, "boom", ""), (d, -11, "shimmer", f"{f:.0f}Hz")]
    elif t == "cta": L = [(S["stinger"], -5, "stinger", ""), (S["boom"], -7, "boom", "")]
    return L


HITS = {"hero", "logo", "cta", "wipe", "cut"}
bus = np.zeros((N, 2), np.float32); duck = np.zeros(N, np.float32); sheet = []; placed = []
for i, e in enumerate(ev):
    t0 = e["frame"] / FPS + a.sfxshift
    for smp, g, kind, lab in build(e, i):
        oi = int(np.argmax(np.abs(smp))) if kind == "whoosh" else onset_idx(smp, 0.3)
        pos = int(round(t0 * SR)) - oi
        y = smp.copy()
        if pos < 0: y = y[-pos:]; pos = 0
        y = y[: max(0, N - pos)] * db(-6) * db(g)
        bus[pos:pos + len(y), 0] += y; bus[pos:pos + len(y), 1] += y
        placed.append(dict(frame=e["frame"], id=e["id"], kind=kind, pos=pos, oi=oi, y=y))
        sheet.append(dict(frame=e["frame"], time_s=round(t0, 4), id=e["id"], type=e["type"], label=e["label"], sfx=kind, gain_db=g, note=lab,
                          attack_lag_ms=round(oi / SR * 1e3, 1), start_time_s=round(pos / SR, 4), dur_s=round(len(y) / SR, 3)))
    if e["type"] in HITS:
        s0 = max(0, int((t0 - .02) * SR)); b = min(N, int((t0 + .15) * SR)); r2 = min(N, int((t0 + .45) * SR))
        duck[s0:b] = np.maximum(duck[s0:b], 3.0); duck[b:r2] = np.maximum(duck[b:r2], 3.0 * np.linspace(1, 0, r2 - b))
def put(smp, t0, g, kind, ident, fr, peak=False):
    global bus
    oi = int(np.argmax(np.abs(smp))) if peak else onset_idx(smp, 0.3)
    pos = int(round(t0 * SR)) - oi; y = smp.copy()
    if pos < 0: y = y[-pos:]; pos = 0
    y = y[: max(0, N - pos)] * db(-6) * db(g)
    bus[pos:pos + len(y), 0] += y; bus[pos:pos + len(y), 1] += y
    placed.append(dict(frame=fr, id=ident, kind=kind, pos=pos, oi=oi, y=y))
    sheet.append(dict(frame=fr, time_s=round(t0, 4), id=ident, type="roll", label="S4 roll", sfx=kind, gain_db=g, note="", attack_lag_ms=round(oi / SR * 1e3, 1), start_time_s=round(pos / SR, 4), dur_s=round(len(y) / SR, 3)))
rt = pitch(S["tick"], 1.25)[: int(0.05 * SR)]; rt = fade(rt, 0.001, 0.03)
for j, fr in enumerate([386, 388, 390, 392.5, 395, 397.5, 400]):
    put(rt, fr / FPS, -13 + j * 0.8, "roll", f"roll{j}", int(round(fr)))
put(S["whoosh"], 400 / FPS, -15, "whoosh", "rollRiser", 400, peak=True)
act = np.zeros(N // (SR // 100) + 2)
for p in placed:
    k = int(0.02 * SR); env = np.sqrt(np.convolve(p["y"] ** 2, np.ones(k) / k, "same")); idx = np.where(env >= 0.1 * env.max())[0]
    en = (p["pos"] + (idx[-1] if len(idx) else len(p["y"]))) // (SR // 100)
    act[p["pos"] // (SR // 100): en] += 1
max_sim = int(act.max())


def render_music(start):
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.4f}", "-t", "31", "-i", os.path.join(MUS, a.track), "-af", f"atempo={a.atempo}", "-ar", str(SR), "-ac", "2", "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, 2).copy()


def beat_resid(m):
    mono = m.mean(1)[:int(DUR * SR)]
    mono22 = np.interp(np.arange(0, len(mono), SR / B.SR), np.arange(len(mono)), mono).astype(np.float32)
    e = B.onset_env(mono22); ts = []; ks = []; vs = []
    for k in range(60):
        tt = np.arange(0.5 * k - 0.06, 0.5 * k + 0.0601, 0.001); val = B.interp(e, tt); j = int(np.argmax(val))
        if val[j] > 1.0 and 0.5 * k - 0.05 > 0: ts.append(tt[j]); ks.append(k); vs.append(val[j])
    global LASTV; LASTV = np.array(vs)
    ts = np.array(ts); ks = np.array(ks)
    return ts - 0.5 * ks, ks


cl = np.zeros(B.SR * 4, np.float32); cl[B.SR * 2] = 1.0; cl = np.convolve(cl, np.hanning(9), "same").astype(np.float32)
ce = B.onset_env(cl); tt = np.arange(1.9, 2.1, 0.0005); BIAS = float(tt[np.argmax(B.interp(ce, tt))] - 2.0)
if os.environ.get("FINESCAN"):
    for d in np.arange(-0.010, 0.0101, 0.002):
        mm_ = render_music(a.start + d); rr, _k = beat_resid(mm_); rr = rr - BIAS
        print("start %.3f med|.| %.1f max %.1f n %d" % (a.start + d, np.median(np.abs(rr)) * 1e3, np.abs(rr).max() * 1e3, len(rr)), flush=True)
    sys.exit()
if a.scan:
    out = []
    for s0 in np.arange(a.start % 0.5 + 0.0, 40.0, 0.5):
        st = s0 + 0.0
        for _ in range(3):
            mm_ = render_music(st); rr, _k = beat_resid(mm_); rr = rr - BIAS
            if len(rr) < 20: break
            md = float(np.median(rr)); st += md * a.atempo
        else:
            pass
        if len(rr) < 20: continue
        mm_ = render_music(st); rr, _k = beat_resid(mm_); rr = rr - BIAS
        mo = mm_.mean(1)[:N]; w_ = int(0.5 * SR); rms = np.array([np.sqrt((mo[i:i + w_] ** 2).mean()) for i in range(0, N - w_, w_)])
        dip = 20 * np.log10(rms[2:-2].min() / np.median(rms) + 1e-9)
        print("start %.3f n %d med %.1f max %.1f dip %.1f dB" % (st, len(rr), np.median(np.abs(rr)) * 1e3, np.abs(rr).max() * 1e3, dip), flush=True)
    sys.exit()
start = a.start + a.shift
for it in range(4):
    m = render_music(start); res, ks = beat_resid(m); res = res - BIAS
    med = float(np.median(res))
    if abs(med) < 0.002: break
    start += med * a.atempo
m = render_music(start); res, ks = beat_resid(m); res = res - BIAS
print("music start", round(start, 4), "bias_ms", round(BIAS * 1e3, 2), "iters", it)
m = m[:N]
if len(m) < N: m = np.pad(m, ((0, N - len(m)), (0, 0)))
m[: int(.3 * SR)] *= np.linspace(0, 1, int(.3 * SR))[:, None]; m[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None]
ARC = [(0, -5.0), (75, -5.0), (100, -2.0), (195, 0.0), (330, 0.0), (350, 0.5), (480, 0.5), (500, -0.5), (630, -0.5), (750, 1.5), (780, 0.5), (900, 0.5)]
af_ = np.interp(np.arange(N) / SR * FPS, [c[0] for c in ARC], [c[1] for c in ARC]); k0 = int(0.15 * SR); af_ = np.convolve(af_, np.ones(k0) / k0, "same")
m *= (10 ** (af_ / 20))[:, None]
k = int(0.02 * SR); duck = np.convolve(duck, np.ones(k) / k, "same"); m *= (10 ** (-duck / 20))[:, None]
m *= db(-19) / np.sqrt((m ** 2).mean())
mix = m + bus; pk = np.abs(mix).max()
if pk > .95: mix *= .95 / pk


def wr(p, x):
    w = wave.open(p, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes()); w.close()


sfx = "" if a.tag == "main" else "-" + a.tag
wr(os.path.join(OUT, f"mix-pre{sfx}.wav"), mix); wr(os.path.join(OUT, f"music-bed{sfx}.wav"), m); wr(os.path.join(OUT, f"sfx-bus{sfx}.wav"), bus)
j = subprocess.run(["ffmpeg", "-hide_banner", "-i", os.path.join(OUT, f"mix-pre{sfx}.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
mm = json.loads(j[j.rindex("{"):j.rindex("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=7:measured_I={mm['input_i']}:measured_TP={mm['input_tp']}:measured_LRA={mm['input_lra']}:measured_thresh={mm['input_thresh']}:offset={mm['target_offset']}:linear=true,"
      "alimiter=limit=0.84:level=disabled,aresample=48000")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(OUT, f"mix-pre{sfx}.wav"), "-af", af, "-ar", "48000", "-c:a", "pcm_s16le", os.path.join(OUT, f"mix-final-raw{sfx}.wav")], check=True)
# alimiter lookahead delays the signal: measure the lag against mix-pre and remove it exactly
def rd(p_):
    w_ = wave.open(p_); d_ = np.frombuffer(w_.readframes(w_.getnframes()), "<i2").astype(np.float32).reshape(-1, 2) / 32767; w_.close(); return d_
fr_ = rd(os.path.join(OUT, f"mix-final-raw{sfx}.wav")); pr_ = rd(os.path.join(OUT, f"mix-pre{sfx}.wav"))
a_, b_ = pr_[4800:-4800, 0], fr_[:, 0]
LAG = max(range(0, 1200), key=lambda l: float(a_ @ b_[4800 + l:4800 + l + len(a_)]))
fr_ = np.concatenate([fr_[LAG:], np.zeros((LAG, 2), np.float32)])[:N]
print("limiter lag removed:", LAG, "samples")
wr(os.path.join(OUT, f"mix-final{sfx}.wav"), fr_)
np.savez_compressed(os.path.join(OUT, f"placed{sfx}.npz"), **{f"{i}_{p['frame']}_{p['kind']}": p["y"] for i, p in enumerate(placed)},
                    meta=np.array([[p["frame"], p["pos"], p["oi"]] for p in placed]))
json.dump(dict(fps=FPS, frames=900, music=dict(file=a.track, start_s=round(start, 4), atempo=a.atempo, root_pc=a.root,
     beat_resid_ms=dict(median_abs=round(float(np.median(np.abs(res))) * 1e3, 2), max_abs=round(float(np.abs(res).max()) * 1e3, 2), n=int(len(res)), detector_bias_ms=round(BIAS * 1e3, 2))),
     max_simultaneous_sfx=max_sim, dingf0=f_ding, pluckf0=f_pl, cues=sheet), open(os.path.join(OUT, f"cue-sheet{sfx}.json"), "w"), indent=1)
with open(os.path.join(OUT, f"cue-sheet{sfx}.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(sheet[0].keys())); w.writeheader(); w.writerows(sheet)
strong = LASTV >= 0.5 * np.median(LASTV); rs = res[strong]
print("strong-onset beats (%d of %d): median|.| %.1f ms max %.1f ms" % (strong.sum(), len(res), np.median(np.abs(rs)) * 1e3, np.abs(rs).max() * 1e3))
print("beat resid median|.| %.2f ms max %.2f ms n=%d" % (np.median(np.abs(res)) * 1e3, np.abs(res).max() * 1e3, len(res)), "max_sim", max_sim, "peak", float(pk), "ding f0", f_ding, "pluck f0", f_pl)
