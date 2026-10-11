#!/usr/bin/env python3
"""Persian sound task, section 1: picture analysis (picture-locked cues).

decode_frames(path) -> motion energy array (one float per frame).
detect_cues(energy, fps) -> list of cues (frame, time, kind, strength).

Only Python 3 + numpy + ffmpeg required.
"""
import subprocess
import numpy as np

WIDTH, HEIGHT = 96, 54


def decode_frames(path, fps=30, size=(WIDTH, HEIGHT)):
    """Decode video to grayscale 96x54 frames and return motion energy per frame.

    m[f] = mean(|frame[f] - frame[f-1]|), smoothed with a 3-frame box filter; m[0] = 0.
    """
    w, h = size
    cmd = [
        "ffmpeg", "-v", "error", "-i", str(path),
        "-vf", "fps=%s,scale=%dx%d:flags=area,format=gray" % (fps, w, h),
        "-f", "rawvideo", "pipe:1",
    ]
    raw = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True).stdout
    n = len(raw) // (w * h)
    frames = np.frombuffer(raw[: n * w * h], dtype=np.uint8).reshape(n, h, w).astype(np.float32)
    if n < 2:
        return np.zeros(max(n, 0), dtype=np.float32)
    diff = np.abs(np.diff(frames, axis=0))
    m = diff.mean(axis=(1, 2))
    m = np.concatenate(([0.0], m))
    m = np.convolve(m, np.ones(3) / 3.0, mode="same")
    m[0] = 0.0
    return m


def _onset_strength(m):
    """Spectral-flux style onset: o[f] = max(0, m[f] - median(m[f-6:f]))."""
    n = len(m)
    o = np.zeros(n, dtype=np.float32)
    for f in range(1, n):
        lo = max(0, f - 6)
        if f - lo < 2:
            continue
        o[f] = max(0.0, m[f] - float(np.median(m[lo:f])))
    return o


def _cue(frame, time, kind, strength):
    return dict(frame=int(frame), time=round(float(time), 3), kind=kind, strength=round(float(strength), 3))


def detect_cues(energy, fps, max_cues=16, min_gap=5):
    """Peak-pick onsets and classify them into impact/whoosh/tick/pop (+intro/outro)."""
    m = np.asarray(energy, dtype=np.float32)
    n = len(m)
    if n < 8:
        return []
    o = _onset_strength(m)
    if o.max() <= 0:
        return []
    top5 = np.sort(o)[-min(5, n):]
    threshold = 0.6 * float(np.median(top5)) * 0.5
    peaks = [f for f in range(1, n - 1)
             if o[f] > threshold and o[f] >= o[f - 1] and o[f] >= o[f + 1]]
    if not peaks:
        return []
    # strongest first, keep at most max_cues, enforce min gap (5 frames = 0.17 s at 30 fps)
    peaks.sort(key=lambda f: o[f], reverse=True)
    kept = []
    for f in peaks:
        if all(abs(f - g) >= min_gap for g in kept):
            kept.append(f)
        if len(kept) >= max_cues:
            break
    kept.sort()

    omax = float(o.max())
    cues = [_cue(f, f / fps, "pop", o[f] / omax) for f in kept]

    # classify each cue from local context
    for cue in cues:
        f = cue["frame"]
        before = m[max(0, f - 6):f]
        pre_level = float(np.median(before)) if len(before) else 0.0
        sharp = pre_level < 0.25 * float(m[f]) if m[f] > 0 else False
        # whoosh: motion energy rises over >= 5 frames before the peak
        win = m[f - 5:f]
        rises = f >= 5 and bool(np.all(np.diff(win) >= -1e-9)) and m[f] > m[f - 5]
        if cue["strength"] >= 0.70 and sharp:
            cue["kind"] = "impact"
        elif rises:
            cue["kind"] = "whoosh"

    # tick: runs of >= 4 small cues (s < 0.45) with near-even spacing (CV < 0.35)
    small = [i for i, c in enumerate(cues) if c["strength"] < 0.45]
    run = []
    runs = []
    for idx in small:
        if run and idx == run[-1] + 1:
            run.append(idx)
        else:
            if len(run) >= 4:
                runs.append(run)
            run = [idx]
    if len(run) >= 4:
        runs.append(run)
    for run in runs:
        gaps = np.diff([cues[i]["frame"] for i in run])
        mean_gap = float(np.mean(gaps))
        cv = float(np.std(gaps) / mean_gap) if mean_gap > 0 else 1.0
        if cv < 0.35:
            for i in run:
                cues[i]["kind"] = "tick"

    # intro: video starts static (first cue after 0.25 s)
    if cues[0]["time"] > 0.25:
        cues.insert(0, _cue(0, 0.0, "intro", 0.0))
    # outro: last 12 % of frames static
    tail = max(1, int(round(n * 0.12)))
    tail_level = float(m[-tail:].mean()) if tail < n else float(m.mean())
    rest_level = float(m[:-tail].mean()) if n - tail > 0 else 1.0
    if tail_level < 0.10 * max(rest_level, 1e-9):
        cues.append(_cue(n - tail, (n - tail) / fps, "outro", 0.0))
    return cues


def analyze(path, fps=30):
    return detect_cues(decode_frames(path, fps), fps)


if __name__ == "__main__":
    import json
    import sys
    for p in sys.argv[1:]:
        print(p)
        print(json.dumps(analyze(p), indent=2))
