# Compare a rebuilt film audio against an original: LUFS/TP/tail, cue time table, envelope correlation, band-energy difference.
# Usage: sound/.venv/Scripts/python.exe -I sound/tools/mixer/compare_sound.py --orig a.mp4 --new b.mp4 --orig-cues cues.json --new-cues cues.json --out cmp.json
import argparse, json, re, subprocess
from pathlib import Path
import numpy as np
R = Path(__file__).resolve().parents[3]

def pcm(p, sr=16000):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(p), "-vn", "-ac", "1", "-ar", str(sr), "-f", "f32le", "pipe:1"], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.float32)

def stats(p):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(p), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    t = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-sseof", "-0.25", "-i", str(p), "-af", "astats=measure_overall=Peak_level", "-f", "null", "-"], capture_output=True, text=True).stderr
    return {"lufs": float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1]), "tp": float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)[-1]), "tail": re.findall(r"Peak level dB: (-?[\d.]+|-inf)", t)[-1]}

def frames(x, sr, w=0.25):
    n = int(sr * w); k = len(x) // n
    return np.sqrt((x[:k * n].reshape(k, n) ** 2).mean(1) + 1e-12)

ap = argparse.ArgumentParser()
for a in ("orig", "new", "orig-cues", "new-cues", "out"): ap.add_argument("--" + a, required=True)
a = ap.parse_args()
man = {e["original_path"]: e["id"] for e in json.load(open(R / "sound/library/kit/manifest.json", encoding="utf-8"))["entries"]}
oc = json.load(open(a.orig_cues, encoding="utf-8")); nc = json.load(open(a.new_cues, encoding="utf-8"))
rows = []
for o in oc:
    cid = man.get(o["file"])
    cand = [n for n in nc if n["clip"] == cid]
    if not cand:
        rows.append({"orig_n": o["n"], "clip": cid, "orig_t": o["t_s"], "new_t": None, "delta_ms": None, "kind": o["kind"], "orig_event": o["event"][:40]}); continue
    n = min(cand, key=lambda c: abs(c["t_s"] - o["t_s"]))
    rows.append({"orig_n": o["n"], "clip": cid, "kind": o["kind"], "orig_t": o["t_s"], "new_t": n["t_s"], "delta_ms": round((n["t_s"] - o["t_s"]) * 1000, 1),
                 "gain_delta_db": round(n["gain_db"] - o["gain_db"], 1), "orig_event": o["event"][:40]})
d = [abs(r["delta_ms"]) for r in rows if r["delta_ms"] is not None]
dp = [abs(r["delta_ms"]) for r in rows if r["delta_ms"] is not None and r["kind"] == "payoff"]
sr = 16000
A, B = pcm(a.orig, sr), pcm(a.new, sr); L = min(len(A), len(B)); A, B = A[:L], B[:L]
fa, fb = frames(A, sr), frames(B, sr)
corr = float(np.corrcoef(20 * np.log10(fa), 20 * np.log10(fb))[0, 1]); corr_lin = float(np.corrcoef(fa, fb)[0, 1])
def bands(x):
    out = []; n = sr  # 1 s frames
    edges = [0, 150, 500, 2000, 5000, 8000]
    for i in range(len(x) // n):
        s = np.abs(np.fft.rfft(x[i * n:(i + 1) * n] * np.hanning(n))) ** 2; f = np.fft.rfftfreq(n, 1 / sr)
        out.append([10 * np.log10(s[(f >= edges[j]) & (f < edges[j + 1])].sum() + 1e-12) for j in range(5)])
    return np.array(out), edges
Sa, edges = bands(A); Sb, _ = bands(B)
diff = (Sb - Sa)
res = {"orig": stats(a.orig), "new": stats(a.new), "cue_rows": rows, "cue_matched": len(d), "cue_total": len(rows),
       "cue_abs_delta_ms": {"max": max(d), "median": float(np.median(d)), "within_5ms": sum(1 for x in d if x <= 5), "payoff_max": max(dp), "payoff_within_5ms": sum(1 for x in dp if x <= 5), "payoff_n": len(dp)},
       "envelope_corr_0p25s": {"log_rms": round(corr, 3), "linear_rms": round(corr_lin, 3)},
       "band_energy_diff_db_mean_abs": {"%d-%dHz" % (edges[j], edges[j + 1]): round(float(np.abs(diff[:, j]).mean()), 1) for j in range(5)},
       "band_energy_diff_db_mean_signed(new-orig)": {"%d-%dHz" % (edges[j], edges[j + 1]): round(float(diff[:, j].mean()), 1) for j in range(5)}}
Path(a.out).write_text(json.dumps(res, indent=1), encoding="utf-8")
print(json.dumps({k: v for k, v in res.items() if k != "cue_rows"}, indent=1))
