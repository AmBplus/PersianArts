#!/usr/bin/env python3
"""pa loop-check <final.mp4> [--frames 3] [--track <kit id>] [--strip out.jpg]
Seam gate for films whose story is a LOOP (the last frame flows into the first).
VIDEO: step across the seam (last frame -> first frame, mean abs luma diff, 80x80 gray) PASS if <= 1.5x the median in-film step (floor 0.8),
       WARN if above that but within the film's own p90 step (normal motion; look at the strip), FAIL above p90; colour step (mean RGB) is reported too. --frames N averages N frames each side.
AUDIO: RMS of the last 0.5 s vs the first 0.5 s within 1.5 dB, spectral centroid within 15% (WARN); beat phase: (first beat + duration - last beat)
       must be a whole number of beats within 20 ms (beat period from --track's .music.json when given, else librosa tracking) (WARN).
Output PASS / WARN / FAIL (exit 0 PASS or WARN, 1 FAIL) and a seam strip (last 0.5 s above the first 0.5 s, every 3 frames, via pa strip)."""
import argparse, json, subprocess, sys, tempfile
from pathlib import Path
import numpy as np
R = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(R / "work/persian/tools/pacing"))
import pacing_lib as P

SR = 22050

def rgb_mean(path, t):
    p = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(max(0, t)), "-i", str(path), "-frames:v", "1", "-vf", "scale=1:1,format=rgb24", "-f", "rawvideo", "-"], capture_output=True)
    return np.frombuffer(p.stdout[:3], dtype=np.uint8).astype(float) if len(p.stdout) >= 3 else np.zeros(3)

def audio(path):
    import librosa
    tmp = Path(tempfile.mkdtemp()) / "a.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-vn", "-ac", "1", "-ar", str(SR), str(tmp)], check=True)
    y, _ = librosa.load(str(tmp), sr=SR); return y

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("mp4"); ap.add_argument("--frames", type=int, default=3); ap.add_argument("--track"); ap.add_argument("--strip")
    a = ap.parse_args(); fails, warns, info = [], [], {}
    fr = P.frames_gray(a.mp4); n = a.frames
    steps = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2)); med = float(np.median(steps))
    seam = float(np.abs(fr[-n:].mean(axis=0) - fr[:n].mean(axis=0)).mean())  # mean of last N vs first N frames
    seam1 = float(np.abs(fr[-1] - fr[0]).mean())
    limit = max(1.5 * med, 0.8)
    dur = len(fr) / P.FPS
    c0, c1 = rgb_mean(a.mp4, 0.0), rgb_mean(a.mp4, dur - 0.1); col = float(np.abs(c0 - c1).mean())
    info["video"] = {"median_step": round(med, 3), "seam_step_last_to_first": round(seam1, 3), "seam_step_mean_%dframes" % n: round(seam, 3), "limit": round(limit, 3), "colour_diff_rgb": round(col, 1)}
    p90 = float(np.percentile(steps, 90)); info["video"]["p90_step"] = round(p90, 3)
    if seam1 > p90: fails.append("video seam step %.2f > the film's own p90 step %.2f: a visible jump from the last frame to the first" % (seam1, p90))
    elif seam1 > limit: warns.append("video seam step %.2f > 1.5 x median %.2f but within the film's normal motion (p90 %.2f): check the strip" % (seam1, limit, p90))
    if col > 12: warns.append("colour jump across the seam %.1f (RGB mean)" % col)
    y = audio(a.mp4); k = int(0.5 * SR)
    rms = lambda x: 20 * np.log10(max(float(np.sqrt(np.mean(x ** 2))), 1e-6))
    cen = lambda x: float((np.abs(np.fft.rfft(x * np.hanning(len(x)))) * np.fft.rfftfreq(len(x), 1 / SR)).sum() / max(np.abs(np.fft.rfft(x * np.hanning(len(x)))).sum(), 1e-9))
    r0, r1 = rms(y[:k]), rms(y[-k:]); c_0, c_1 = cen(y[:k]), cen(y[-k:])
    info["audio"] = {"rms_first_db": round(r0, 1), "rms_last_db": round(r1, 1), "centroid_first": round(c_0), "centroid_last": round(c_1)}
    if abs(r0 - r1) > 1.5: fails.append("audio RMS seam %.1f dB (first %.1f vs last %.1f), limit 1.5" % (r1 - r0, r0, r1))
    if abs(c0 := c_0 - c_1) / max(c_0, 1) > 0.15: warns.append("spectral centroid differs %.0f%% (limit 15%%)" % (100 * abs(c_0 - c_1) / max(c_0, 1)))
    import librosa
    oenv = librosa.onset.onset_strength(y=y, sr=SR); _, bf = librosa.beat.beat_track(onset_envelope=oenv, sr=SR); bt = librosa.frames_to_time(bf, sr=SR)
    beat = None
    if a.track:
        mj = R / "sound/library/kit/music" / (a.track.replace("tr-", "") + ".music.json")
        beat = json.load(open(mj, encoding="utf-8"))["beat_s"]
    elif len(bt) > 3: beat = float(np.median(np.diff(bt)))
    if beat and len(bt) > 2:
        total = (bt[0] + (len(y) / SR) - bt[-1]) / beat
        off_ms = abs(total - round(total)) * beat * 1000
        info["beat"] = {"beat_s": round(beat, 4), "first_beat_s": round(float(bt[0]), 3), "last_beat_s": round(float(bt[-1]), 3), "seam_offset_ms": round(off_ms, 1)}
        if off_ms > 20: warns.append("beat phase across the seam is off by %.0f ms (limit 20): the loop will stumble on repeat" % off_ms)
    out = a.strip or str(Path(a.mp4).with_suffix("")) + "-loop-seam.jpg"
    try:
        from PIL import Image
        s = Path(__file__).with_name("strip.py"); t1, t2 = Path(tempfile.mkdtemp()) / "a.jpg", Path(tempfile.mkdtemp()) / "b.jpg"
        subprocess.run([sys.executable, str(s), a.mp4, str(max(0, dur - 0.5)), str(dur), "--every", "3", "--out", str(t1), "--height", "180"], check=True, capture_output=True)
        subprocess.run([sys.executable, str(s), a.mp4, "0", "0.5", "--every", "3", "--out", str(t2), "--height", "180"], check=True, capture_output=True)
        A, B = Image.open(t1), Image.open(t2); W = max(A.width, B.width); S = Image.new("RGB", (W, A.height + B.height), (20, 20, 20)); S.paste(A, (0, 0)); S.paste(B, (0, A.height)); S.save(out, quality=82); info["strip"] = out
    except Exception as e:
        warns.append("strip not written: %s" % str(e)[:80])
    verdict = "FAIL" if fails else "WARN" if warns else "PASS"
    print("LOOP-CHECK %s: %s  (%.1f s)" % (Path(a.mp4).name, verdict, dur)); print(json.dumps(info))
    for f in fails: print("  FAIL", f)
    for w in warns: print("  warn", w)
    sys.exit(1 if fails else 0)

main()
