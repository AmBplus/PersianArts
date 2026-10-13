import sys, os, glob, json, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from beatlib import *
out = {}
for p in sorted(glob.glob(os.path.join(MUS, "*.mp3"))):
    nm = os.path.basename(p); x = decode(nm); dur = len(x) / SR
    e = onset_env(x); bpm = global_tempo(e)
    (kc, key), _ = key_mode(x); br = brightness(x)
    rows = []
    for s in np.arange(0, max(0.1, dur - 30), 1.0) if dur >= 31 else []:
        r = fit_window(e, float(s)); rows.append(r)
    ok = [r for r in rows if abs(r["bpm"] - 120) / 120 <= 0.02]
    ok.sort(key=lambda r: r["med_res_ms"] + 0.3 * r["max_res_ms"] - 5 * r["n_det"] / r["n_beats"])
    best = ok[0] if ok else None
    print(f"{nm:42s} dur {dur:6.1f} globalBPM {bpm:6.1f} key {key} ({kc:.2f}) centroid {br:6.0f}Hz  windows {len(rows)} ok120 {len(ok)}")
    if best: print("    best", {k: (round(v, 3) if isinstance(v, float) else v) for k, v in best.items()})
    out[nm] = dict(dur=dur, bpm=bpm, key=key, keyc=kc, centroid=br, best=best, top=ok[:5])
json.dump(out, open(os.path.join(os.environ.get("TMPDIR", "."), "r30_analysis.json"), "w"), default=float, indent=1)
