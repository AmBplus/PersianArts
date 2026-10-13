import os, json, subprocess, sys
import numpy as np
REPO = os.environ.get("PA_REPO") or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
D = os.path.join(REPO, "media", "film-versions", "uni", "long-v1")
A = os.path.join(D, "audio")
SR = 48000
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(A, "mix-final.wav"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout, dtype=np.float32)
W, H = 1800, 360
cues = json.load(open(os.path.join(A, "cue-sheet.json")))["cues"]
try:
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(18, 3.6), dpi=100)
    t = np.arange(len(x)) / SR; ax.plot(t[::24], x[::24], lw=0.4, color="#2b3a67")
    for k in range(61): ax.axvline(k * 0.5, color="#bbb", lw=0.4)
    for c in cues:
        ax.axvline(c["time_s"], color="#d4572a" if not c["lead_in"] else "#2a9d8f", lw=1.2)
        if c["event"].endswith(("(ding)", "sub", "chime", "(tap)")) is False: ax.text(c["time_s"] + 0.02, 0.85, f"f{c['frame']}", fontsize=7, rotation=90, va="top")
    ax.set_xlim(0, 30); ax.set_ylim(-1, 1); ax.set_xlabel("s (grey = 0.5 s beats, orange = SFX hit frames, green = lead-in)"); fig.tight_layout(); fig.savefig(os.path.join(D, "audio", "waveform-long-v1.png"))
    print("matplotlib")
except ImportError:
    # numpy-only fallback: draw PNG via ffmpeg rawvideo
    img = np.full((H, W, 3), 255, np.uint8)
    cols = x[: len(x) // W * W].reshape(W, -1)
    mx, mn = cols.max(1), cols.min(1)
    for i in range(W):
        y0 = int(H / 2 - mx[i] * H / 2 * 0.95); y1 = int(H / 2 - mn[i] * H / 2 * 0.95)
        img[y0:y1 + 1, i] = (43, 58, 103)
    for k in range(61): img[:, min(W - 1, int(k * 0.5 / 30 * W))] = (200, 200, 200)
    for c in cues:
        px = min(W - 1, int(c["time_s"] / 30 * W)); img[:, px] = (212, 87, 42) if not c["lead_in"] else (42, 157, 143)
    p = subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-i", "-", os.path.join(A, "waveform-long-v1.png")], input=img.tobytes())
    print("numpy fallback")


