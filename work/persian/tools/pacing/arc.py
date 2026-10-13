#!/usr/bin/env python3
"""pa arc <shape> -Bpm 118 -Duration 24   (optional helper; INSPIRATION ONLY: every film defines its own story)
Prints a scene table (bars, beats, seconds) for a chosen story shape from docs/motion/recipes/arcs.json, to paste into the
film.html header AFTER you wrote your own logline/protagonist/emotional arc. Without a shape it lists the menu."""
import argparse, json, sys
from pathlib import Path
A = json.load(open(Path(__file__).resolve().parents[4] / "docs/motion/recipes/arcs.json", encoding="utf-8"))
ALIAS = {"teaser": "reveal-ladder", "story": "problem-turn", "ad": "count-stack", "typo": "type-statement"}
ap = argparse.ArgumentParser(); ap.add_argument("shape", nargs="?"); ap.add_argument("--bpm", type=float, default=118); ap.add_argument("--duration", type=float, default=24)
a = ap.parse_args()
if not a.shape:
    print("shapes (optional menu, inspiration only):")
    for k, v in A["shapes"].items(): print("  %-18s %s  [%s]" % (k, v["idea"], ", ".join(v["fits"])))
    sys.exit(0)
k = ALIAS.get(a.shape, a.shape); sh = A["shapes"][k]
beat = 60 / a.bpm; bar = 4 * beat; bars = max(len(sh["scenes"]), round(a.duration / bar))
w = [s["weight"] for s in sh["scenes"]]; tot = sum(w)
beats = [max(1, round(bars * x / tot)) * 4 for x in w]  # whole bars: every cut lands on a bar downbeat
diff = bars * 4 - sum(beats)
beats[beats.index(max(beats))] += diff   # absorb the remainder in the longest scene
print("ARC %s @ %.0f BPM: bar %.3f s, beat %.3f s, %d bars = %.1f s (asked %.0f s)  -- INSPIRATION ONLY: write your own story first" % (k, a.bpm, bar, beat, bars, bars * bar, a.duration))
print("idea: " + sh["idea"])
print("%-3s %-44s %-9s %-5s %-13s %-6s %-6s %s" % ("#", "role", "start", "beats", "t (s)", "build", "hold>=", "cut / sound hit"))
b0 = 0
for i, (s, nb) in enumerate(zip(sh["scenes"], beats), 1):
    t0, t1 = b0 * beat, (b0 + nb) * beat
    print("%-3d %-44s %-9s %-5d %5.2f-%-6.2f %-6.1f %-6.1f %s | %s" % (i, s["role"][:44], "bar%d.%d" % (b0 // 4 + 1, b0 % 4 + 1), nb, t0, t1, min(s["build_s"], (t1 - t0) * .6), s["hold_min_s"], s["transition_into_next"], s["sound_hit"]))
    b0 += nb
print("hold floor for Persian text: 0.6 s + 0.045 s per character. Cuts land on bar downbeats; role-final hit on the last bar.")
