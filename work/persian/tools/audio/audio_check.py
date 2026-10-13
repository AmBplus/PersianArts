#!/usr/bin/env python3
"""pa audio-check <final.mp4> [--transitions t1,t2,...] [--json]
Music continuity check of a FINAL mp4 (L-b). Per 1 s window: RMS (dBFS) and spectral centroid.
Thresholds (FAIL unless noted):
  RMS jump at each transition      <= 3.0 dB   (window after vs window before, 1 s each)
  RMS jump between neighbours      <= 1.5 dB   (WARN only; ignored within 1 s of a given transition)
  centroid jump at a transition    <= 40 %     (WARN)
  gap < -40 dBFS (0.1 s resolution) <= 0.5 s before the tail
  tail (last 0.25 s peak)          < -50 dBFS
  true peak                        <= -1.0 dBTP
  integrated loudness              -15.0 .. -14.0 LUFS (WARN outside -15.5..-13.5 = FAIL)
Exit 0 = pass (warnings allowed), 1 = fail. Needs ffmpeg + numpy."""
import argparse, json, re, subprocess, sys
import numpy as np

SR = 16000

def decode(path):
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
    return np.frombuffer(p.stdout, dtype=np.float32)

def db(x):
    return 20 * np.log10(max(float(x), 1e-6))

def rms(a):
    return db(np.sqrt(np.mean(a * a))) if len(a) else -120.0

def centroid(a):
    if len(a) < 256:
        return 0.0
    s = np.abs(np.fft.rfft(a * np.hanning(len(a))))
    f = np.fft.rfftfreq(len(a), 1 / SR)
    return float((s * f).sum() / max(s.sum(), 1e-9))

def ebu(path):
    p = subprocess.run(["ffmpeg", "-nostats", "-i", str(path), "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    t = p.stderr
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", t); P = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", t)
    return (float(I[-1]) if I else None), (float(P[-1]) if P else None)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("mp4"); ap.add_argument("--transitions", default=""); ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    x = decode(a.mp4); dur = len(x) / SR
    tr = [float(t) for t in a.transitions.split(",") if t.strip()]
    fails, warns = [], []
    win = [(i, rms(x[i * SR:(i + 1) * SR]), centroid(x[i * SR:(i + 1) * SR])) for i in range(int(dur))]
    near = lambda t: any(abs(t - u) <= 1.0 for u in tr)
    rows = []
    for t in tr:
        s = int(t * SR)
        b = x[max(0, s - SR):s]; f = x[s:s + SR]
        j = rms(f) - rms(b); cb, cf = centroid(b), centroid(f)
        cj = abs(cf - cb) / max(cb, 1.0) * 100
        rows.append({"t": t, "rms_jump_db": round(j, 2), "centroid_jump_pct": round(cj, 1)})
        if abs(j) > 3.0: fails.append("RMS jump %.1f dB at t=%.2f (limit 3.0): music/mix changes at this cut" % (j, t))
        if cj > 40: warns.append("centroid jump %.0f%% at t=%.2f" % (cj, t))
    for (i, r0, _), (_, r1, _) in zip(win, win[1:]):
        if abs(r1 - r0) > 1.5 and not near(i + 1):
            warns.append("RMS step %.1f dB between %ds and %ds (no transition given)" % (r1 - r0, i, i + 1))
    tail_start = max(0.0, dur - 0.5)
    run = best = 0.0; at = 0.0
    for k in range(int(tail_start * 10)):
        if rms(x[int(k * 0.1 * SR):int((k + 1) * 0.1 * SR)]) < -40:
            run += 0.1
            if run > best: best, at = run, k * 0.1
        else: run = 0.0
    if best > 0.5: fails.append("silence gap %.1f s (< -40 dBFS) ending near t=%.1f before the tail" % (best, at + 0.1))
    tail = db(np.max(np.abs(x[-int(0.25 * SR):]))) if len(x) else -120
    if tail >= -50: fails.append("tail peak %.1f dBFS (needs < -50)" % tail)
    I, TP = ebu(a.mp4)
    if TP is not None and TP > -1.0: fails.append("true peak %.1f dBTP (limit -1.0)" % TP)
    if I is not None:
        if I < -15.5 or I > -13.5: fails.append("loudness %.1f LUFS (target -14..-15)" % I)
        elif I < -15.0 or I > -14.0: warns.append("loudness %.1f LUFS outside -15..-14" % I)
    res = {"file": str(a.mp4), "dur": round(dur, 2), "lufs": I, "true_peak": TP, "tail_peak_dbfs": round(tail, 1), "max_gap_s": round(best, 1),
           "transitions": rows, "fails": fails, "warns": warns[:12], "pass": not fails}
    if a.json: print(json.dumps(res, indent=1))
    else:
        print("%s: %s  (%.1f s, %s LUFS, TP %s, tail %.1f dBFS, max gap %.1f s)" % (a.mp4, "PASS" if not fails else "FAIL", dur, I, TP, tail, best))
        for r in rows: print("  cut %.2f s: rms jump %+.2f dB, centroid %.0f%%" % (r["t"], r["rms_jump_db"], r["centroid_jump_pct"]))
        for f in fails: print("  FAIL", f)
        for w in warns[:12]: print("  warn", w)
    sys.exit(0 if not fails else 1)

main()
