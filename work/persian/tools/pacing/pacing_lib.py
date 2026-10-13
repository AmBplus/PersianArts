"""Shared pacing measurements for reference videos and our own films (pa pacing, analyze_refs.py).
Video: ffmpeg scene detect (threshold 0.3) + 24 fps frame-diff spikes; motion energy per 0.25 s; element appearances in the
central band (frame-diff peaks) -> per scene: n elements, build time (scene start -> last appearance), hold time (last appearance -> next cut).
Audio: librosa beat tracking (22.05 kHz mono), bar phase from onset strength, cut-to-beat/bar fractions (60 ms), LUFS, RMS arc.
Needs numpy + librosa (sound/.venv) and ffmpeg."""
import json, re, subprocess, tempfile, os
from pathlib import Path
import numpy as np

W = H = 80
FPS = 24
TOL = 0.060


def probe(path):
    j = json.loads(subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)], capture_output=True, text=True).stdout)
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    n, d = v["r_frame_rate"].split("/")
    w, h = int(v["width"]), int(v["height"])
    r = w / h
    ratio = "16x9" if abs(r - 16 / 9) < .05 else "9x16" if abs(r - 9 / 16) < .05 else "1x1" if abs(r - 1) < .05 else "4x5" if abs(r - .8) < .05 else "other"
    return {"duration_s": round(float(j["format"]["duration"]), 2), "fps": round(float(n) / float(d), 2), "w": w, "h": h, "ratio": ratio,
            "has_audio": any(s["codec_type"] == "audio" for s in j["streams"])}


def frames_gray(path):
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-an", "-vf", "fps=%d,scale=%d:%d,format=gray" % (FPS, W, H), "-f", "rawvideo", "-"], capture_output=True)
    a = np.frombuffer(p.stdout, dtype=np.uint8)
    return a[: len(a) // (W * H) * W * H].reshape(-1, H, W).astype(np.float32)


def scene_cuts(path, thr=0.3):
    p = subprocess.run(["ffmpeg", "-nostats", "-i", str(path), "-an", "-vf", "scale=320:-2,select='gt(scene,%s)',showinfo" % thr, "-f", "null", "-"], capture_output=True, text=True)
    return [float(x) for x in re.findall(r"pts_time:([\d.]+)", p.stderr)]


def merge(ts, gap=0.3):
    out = []
    for t in sorted(ts):
        if not out or t - out[-1] > gap:
            out.append(t)
    return out


def video_metrics(path, dur=None):
    info = probe(path)
    dur = dur or info["duration_s"]
    fr = frames_gray(path)
    d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2)) if len(fr) > 1 else np.zeros(1)  # d[i] = change into frame i+1
    sc = scene_cuts(path)
    # frame-diff fallback: hard spikes
    spikes = [(i + 1) / FPS for i in range(1, len(d) - 1) if d[i] > 14 and d[i] > 3.0 * max(d[i - 1], d[i + 1], 1e-3)]
    # soft cuts (fades/wipes): content change across +-0.25 s that is large vs the clip's own median
    k = FPS // 4
    soft = []
    if len(fr) > 4 * k:
        sd = np.array([np.abs(fr[i + k] - fr[i - k]).mean() for i in range(k, len(fr) - k)])
        thr_s = max(10.0, 2.5 * float(np.median(sd)))
        for i in range(1, len(sd) - 1):
            if sd[i] > thr_s and sd[i] >= sd[max(0, i - k):i + k].max():
                soft.append((i + k) / FPS)
    cuts = [c for c in merge(sc + spikes + soft, gap=0.6) if 0.4 < c < dur - 0.3]
    cutf = {int(round(c * FPS)) for c in cuts}
    # motion energy per 0.25 s (cut frames removed)
    dd = d.copy()
    for f in cutf:
        for k in (f - 1, f):
            if 0 <= k < len(dd): dd[k] = np.nan
    step = FPS // 4 if FPS >= 4 else 1
    en = [float(np.nanmean(dd[i:i + step])) if np.isfinite(dd[i:i + step]).any() else 0.0 for i in range(0, len(dd), step)]
    n = len(en); thirds = [np.mean(en[: n // 3]), np.mean(en[n // 3: 2 * n // 3]), np.mean(en[2 * n // 3:])] if n >= 6 else [np.mean(en)] * 3
    mean_en = float(np.mean(en)) or 1e-6
    # central-band element events
    cb = np.abs(np.diff(fr[:, int(H * .2):int(H * .8), int(W * .1):int(W * .9)], axis=0)).mean(axis=(1, 2)) if len(fr) > 1 else np.zeros(1)
    for f in cutf:
        for k in range(f - 2, f + 2):
            if 0 <= k < len(cb): cb[k] = 0
    med = float(np.median(cb)); mad = float(np.median(np.abs(cb - med))) or 0.05
    thr = max(med + 2.5 * mad, 0.35)
    ev = []
    for i in range(1, len(cb) - 1):
        if cb[i] > thr and cb[i] >= cb[i - 1] and cb[i] >= cb[i + 1]:
            t = (i + 1) / FPS
            if not ev or t - ev[-1] >= 0.25: ev.append(t)
    bounds = [0.0] + cuts + [dur]
    scenes = []
    for a, b in zip(bounds, bounds[1:]):
        e = [t for t in ev if a + 0.1 <= t < b - 0.05]
        last = max(e) if e else a
        scenes.append({"start": round(a, 2), "end": round(b, 2), "len": round(b - a, 2), "elements": len(e), "build_s": round(last - a, 2), "hold_s": round(b - last, 2)})
    lens = [s["len"] for s in scenes]
    return {**info, "cuts": [round(c, 2) for c in cuts], "n_scenes": len(scenes), "shot_mean_s": round(float(np.mean(lens)), 2), "shot_median_s": round(float(np.median(lens)), 2),
            "cuts_per_10s": round(len(cuts) / dur * 10, 2), "energy_thirds": [round(float(x), 2) for x in thirds],
            "energy_ratio": [round(float(x) / mean_en, 2) for x in thirds], "energy_curve_025s": [round(x, 2) for x in en],
            "scenes": scenes, "elements_per_scene": round(float(np.mean([s["elements"] for s in scenes])), 2),
            "build_s_median": round(float(np.median([s["build_s"] for s in scenes])), 2), "hold_s_median": round(float(np.median([s["hold_s"] for s in scenes])), 2)}


def lufs(path):
    t = subprocess.run(["ffmpeg", "-nostats", "-i", str(path), "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", t)
    return float(I[-1]) if I else None


def audio_metrics(path, cuts, dur):
    import librosa
    tmp = Path(tempfile.mkdtemp()) / "a.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-vn", "-ac", "1", "-ar", "22050", str(tmp)], check=True)
    y, sr = librosa.load(str(tmp), sr=22050)
    os.remove(tmp)
    if len(y) < sr * 2:
        return None
    oenv = librosa.onset.onset_strength(y=y, sr=sr)
    tempo, bf = librosa.beat.beat_track(onset_envelope=oenv, sr=sr)
    tempo = float(np.atleast_1d(tempo)[0])
    bt = librosa.frames_to_time(bf, sr=sr)
    # fold tempo into 80-160 BPM
    while tempo < 80: tempo *= 2
    while tempo > 160: tempo /= 2
    bars = np.array([])
    if len(bt) >= 8:
        st = oenv[np.clip(bf, 0, len(oenv) - 1)]
        ph = [st[k::4].sum() for k in range(4)]
        k = int(np.argmax(ph)); bars = bt[k::4]
    def frac(grid):
        if not len(cuts) or not len(grid): return None
        return round(float(np.mean([np.min(np.abs(grid - c)) <= TOL for c in cuts])), 3)
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=1024)[0]
    n = len(rms); db = lambda x: round(float(20 * np.log10(max(float(np.sqrt(np.mean(x ** 2))), 1e-6))), 1)
    arc = [db(rms[: n // 3]), db(rms[n // 3: 2 * n // 3]), db(rms[2 * n // 3:])]
    return {"tempo_bpm": round(tempo, 1), "beat_s": round(60 / tempo, 4), "cuts_on_beat": frac(bt), "cuts_on_bar": frac(bars), "lufs": lufs(path),
            "rms_arc_db": arc, "beats": [round(float(b), 3) for b in bt[:400]], "bars": [round(float(b), 3) for b in bars[:120]]}
