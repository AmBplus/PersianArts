#!/usr/bin/env python3
"""R30-SYNC verification on the FINAL audio (wav or decoded mp4 audio). usage: r30_verify.py <audio file> [--tag main] [--ver long-v3] [--png]"""
import os, sys, json, subprocess, argparse
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import beatlib as B
from beatlib import REPO
ap = argparse.ArgumentParser(); ap.add_argument("audio"); ap.add_argument("--tag", default="main"); ap.add_argument("--ver", default="long-v3"); ap.add_argument("--png", action="store_true")
a = ap.parse_args()
SR = 48000; FPS = 30
OUT = os.path.join(REPO, "media", "film-versions", "uni", a.ver, "audio"); sfx = "" if a.tag == "main" else "-" + a.tag
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", a.audio, "-t", "30", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout, dtype=np.float32)
Z = np.load(os.path.join(OUT, f"placed{sfx}.npz")); meta = Z["meta"]; keys = [k for k in Z.files if k != "meta"]
cs = json.load(open(os.path.join(OUT, f"cue-sheet{sfx}.json")))
W = int(0.08 * SR); rows = []
cl = np.zeros(B.SR * 4, np.float32); cl[B.SR * 2] = 1.0; cl = np.convolve(cl, np.hanning(9), "same").astype(np.float32)
ce = B.onset_env(cl); tt = np.arange(1.9, 2.1, 0.0005); BIAS = float(tt[np.argmax(B.interp(ce, tt))] - 2.0)
x22 = np.interp(np.arange(0, len(x), SR / B.SR), np.arange(len(x)), x).astype(np.float32); env = B.onset_env(x22)
for (key, (fr, pos, oi)) in zip(keys, meta):
    y = Z[key]; kind = key.split("_")[-1]
    if len(y) == 0: continue
    if kind == "whoosh": a0 = max(0, oi - int(0.15 * SR)); a1 = oi + int(0.02 * SR)
    else: a0 = max(0, oi - int(0.010 * SR)); a1 = min(len(y), oi + int(0.12 * SR if kind == 'boom' else 0.06 * SR))
    y = y[a0:a1]; pos = pos + a0; L = len(y); y = y - y.mean(); yn = np.sqrt((y ** 2).sum()) + 1e-9; best = (-1e9, 0)
    for lag in range(-W, W + 1, 2):
        s = pos + lag
        if s < 0 or s + L > len(x): continue
        seg = x[s:s + L]; c = float((seg - seg.mean()) @ y) / (np.sqrt(((seg - seg.mean()) ** 2).sum()) * yn + 1e-9)
        if c > best[0]: best = (c, lag)
    c, lag = best
    for l2 in range(lag - 1, lag + 2):  # refine to 1 sample
        s = pos + l2
        if s >= 0 and s + L <= len(x):
            seg = x[s:s + L]; c2 = float((seg - seg.mean()) @ y) / (np.sqrt(((seg - seg.mean()) ** 2).sum()) * yn + 1e-9)
            if c2 > c: c, lag = c2, l2
    t_ev = fr / FPS
    tt2 = np.arange(t_ev - 0.08, t_ev + 0.0801, 0.001); v = B.interp(env, tt2); fl = float(tt2[np.argmax(v)] - BIAS - t_ev)
    rows.append(dict(frame=int(fr), kind=kind, key=key, lag_ms=lag / SR * 1e3, err_frames=lag / SR * FPS, flux_ms=fl * 1e3, ncc=c))
pre = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(OUT, f"mix-pre{sfx}.wav"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout, dtype=np.float32)
n_ = min(len(pre), len(x)); lags = range(-2400, 2401, 1)
gl = max(lags, key=lambda l: float(pre[2400:n_ - 2400] @ x[2400 + l:n_ - 2400 + l]))
print("global lag final vs mix-pre: %d samples = %.2f ms (%.3f frames)" % (gl, gl / SR * 1e3, gl / SR * FPS))
good = [r for r in rows if r["ncc"] >= 0.5]
print("detectable (NCC>=0.5): %d/%d sounds; undetectable ones are masked by music, not counted" % (len(good), len(rows)))
rows_all = rows; rows = good
err = np.array([r["err_frames"] for r in rows]); ordr = sorted(rows, key=lambda r: -abs(r["err_frames"]))
print("matched-filter lag per SFX (%d sounds on %d events): median|err| %.3f frames, max %.3f frames (%.1f ms); within 1 frame: %d/%d" % (
    len(rows), len({r['frame'] for r in rows}), np.median(np.abs(err)), np.abs(err).max(), np.abs(err).max() / FPS * 1e3, int((np.abs(err) <= 1).sum()), len(err)))
print("worst 5:"); [print("  f%-4d %-8s err %+.3f fr (%+.1f ms) ncc %.2f flux-onset-in-mix %+.1f ms" % (r["frame"], r["kind"], r["err_frames"], r["lag_ms"], r["ncc"], r["flux_ms"])) for r in ordr[:5]]
fl = np.array([r["flux_ms"] for r in rows if r["kind"] in ("boom", "stinger", "ding", "shimmer", "pluck", "tick")])
print("flux-onset (contaminated by music beats on the same grid) median|.| %.1f ms, within 1 frame %d/%d" % (np.median(np.abs(fl)), int((np.abs(fl) <= 33.4).sum()), len(fl)))
json.dump(rows, open(os.path.join(OUT, f"verify{sfx}.json"), "w"), indent=1, default=float)
if a.png:
    from PIL import Image, ImageDraw
    PX = 120; Wd = 30 * PX; H = 720; im = Image.new("RGB", (Wd, H), (18, 20, 26)); d = ImageDraw.Draw(im)
    ev = json.load(open(os.path.join(REPO, "media", "film-versions", "uni", a.ver, "events.json")))["events"]
    mid = 360; n = len(x)
    for px in range(Wd):
        s = int(px / PX * SR); e_ = int((px + 1) / PX * SR); seg = x[s:e_]
        if len(seg): d.line([(px, mid - int(seg.max() * 330)), (px, mid - int(seg.min() * 330))], fill=(110, 160, 220))
    t0 = cs["music"]["beat_resid_ms"]
    for k in range(60): d.line([(int(k * 0.5 * PX), 0), (int(k * 0.5 * PX), 30)], fill=(90, 120, 255), width=2)   # beat grid ticks at top
    for e in ev:
        px = int(e["frame"] / FPS * PX); d.line([(px, 40), (px, H - 60)], fill=(255, 70, 70), width=1); d.text((px + 2, 42 + (e["frame"] // 15 % 6) * 11), e["type"], fill=(255, 150, 150))
    for r in rows:
        if r["kind"] in ("tick", "pluck", "boom", "ding", "shimmer", "stinger", "whoosh"):
            px = int((r["frame"] / FPS + r["lag_ms"] / 1e3) * PX); d.polygon([(px - 4, H - 50), (px + 4, H - 50), (px, H - 38)], fill=(80, 255, 120))
    for sec in range(31): d.text((sec * PX + 2, H - 20), f"{sec}s", fill=(160, 160, 170))
    d.text((6, H - 36), "red = event frames | blue ticks (top) = music beat grid 0.5k s | green = SFX transient found by matched filter in the final mix", fill=(220, 220, 220))
    p = os.path.join(OUT, "sync-check.png"); im.save(p); print("png", p)
