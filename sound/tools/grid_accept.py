#!/usr/bin/env python3
"""grid_accept.py - print the grid acceptance table for music_map sidecars; exit 1 if any FAIL.

    python3 sound/tools/grid_accept.py sound/library/bgm/*.music.json

Gates (video-shotcraft music-beat-sync.md section 3): match >= 98 %, mean_abs < 10 ms,
drift < 5 ms over the track, first drum-active beat on a real attack. The gate values are read
from each sidecar (grid.gates), the verdict is RE-computed here from the stored numbers so a
hand-edited verdict cannot slip through.
"""
import json
import sys


def check(sc):
    g = sc["grid"]
    gates = g["gates"]
    why = []
    if g["match"] is None or g["match"] < gates["match_min"]:
        why.append(f"match {g['match']:.1%} < {gates['match_min']:.0%}")
    if g["mean_abs_ms"] is None or g["mean_abs_ms"] >= gates["mean_abs_max_ms"]:
        why.append(f"mean_abs {g['mean_abs_ms']} >= {gates['mean_abs_max_ms']} ms")
    if g["drift_ms"] is None or g["drift_ms"] >= gates["drift_max_ms"]:
        why.append(f"drift {g['drift_ms']} >= {gates['drift_max_ms']} ms")
    if not g["first_beat_on_attack"]:
        why.append("first beat not on an attack")
    # reasons recorded by music_map that are not one of the four gates (too little drum material ...)
    extra = [r for r in g["reasons"] if not r.startswith(("match ", "mean_abs", "drift", "first drum-active"))]
    why += extra
    return ("FAIL" if why else "PASS"), why


def main(paths):
    if not paths:
        print(__doc__)
        return 2
    rows, bad = [], 0
    for p in paths:
        with open(p, encoding="utf-8") as f:
            sc = json.load(f)
        v, why = check(sc)
        g = sc["grid"]
        bad += v == "FAIL"
        rows.append((sc["file"], f"{sc['bpm']:.2f}", f"{sc['t0']:.4f}", g["winner"], f"{g['match']:.1%}",
                     "-" if g["mean_abs_ms"] is None else f"{g['mean_abs_ms']:.2f}",
                     "-" if g["drift_ms"] is None else f"{g['drift_ms']:.2f}",
                     "yes" if g["first_beat_on_attack"] else "NO", v, "; ".join(why)))
    head = ("file", "bpm", "t0_s", "grid", "match", "mean_abs_ms", "drift_ms", "beat0", "verdict", "reasons")
    w = [max(len(str(r[i])) for r in rows + [head]) for i in range(9)]
    line = lambda r: "  ".join(str(r[i]).ljust(w[i]) for i in range(9)) + ("  " + r[9] if r[9] else "")
    print(line(head))
    for r in rows:
        print(line(r))
    print(f"{len(rows) - bad}/{len(rows)} PASS")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
