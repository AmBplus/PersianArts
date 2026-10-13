#!/usr/bin/env python3
"""pa music-pick --mood confident|playful|dramatic|calm|tech --bpm 100-124 --duration 24 [--ratio 9x16] [--top 3]
Ranks the kit tracks (sound/library/kit/music/*.music.json): mood tags (+synonyms), BPM fit to the range, grid verdict
(PASS preferred; FAIL = beat grid not reliable), energy-arc fit (first <duration> s of the excerpt vs the reference arc), and
prints the top picks with reasons and the bar grid (cut times) for the film. Advisory."""
import argparse, glob, json, math
from pathlib import Path
R = Path(__file__).resolve().parents[4]
MOOD = {"confident": ["corporate", "steady", "upbeat", "promo", "clean", "driving", "tech-house", "house", "groove", "bright"],
        "tech": ["tech-house", "driving", "house", "groove", "clean", "underscore", "promo"],
        "playful": ["happy", "marimba", "bright", "upbeat", "house", "groove", "playful", "quirky"],
        "dramatic": ["epic", "cinematic", "driving", "promo", "dramatic", "mysterious"],
        "emotional": ["emotional", "warm", "calm", "elegant", "nostalgic"],
        "calm": ["light", "background", "underscore", "clean", "steady", "cinematic", "calm", "elegant", "warm"]}
REF_ARC = [1.0, 1.05, 0.85]  # intro/mid/outro energy ratio of good references (docs/motion/knowledge/PACING-PROFILES.md)

def main():
    ap = argparse.ArgumentParser(description=__doc__); ap.add_argument("--mood", required=True, choices=MOOD); ap.add_argument("--bpm", default="100-124")
    ap.add_argument("--duration", type=float, default=24); ap.add_argument("--ratio"); ap.add_argument("--top", type=int, default=3)
    a = ap.parse_args(); lo, hi = [float(x) for x in a.bpm.split("-")]
    rows = []
    for f in glob.glob(str(R / "sound/library/kit/music/*.music.json")):
        m = json.load(open(f, encoding="utf-8")); k = m["kit"]; tags = k.get("mood_tags", [])
        s = 0.0; why = []
        hit = [t for t in tags if t in MOOD[a.mood]]
        s += 3.0 * len(hit) / max(1, len(MOOD[a.mood]) ** 0.5); 
        if hit: why.append("mood tags match: " + ",".join(hit))
        else: why.append("no mood-tag match (%s)" % ",".join(tags))
        b = m["bpm"]; d = 0 if lo <= b <= hi else min(abs(b - lo), abs(b - hi))
        s += 3.0 - min(3.0, d / 4.0); why.append("bpm %.1f %s" % (b, "in range" if d == 0 else "%.0f outside" % d))
        v = m["grid"]["verdict"]; s += 2.0 if v == "PASS" else -1.0; why.append("grid " + v + (" (cuts may drift)" if v != "PASS" else ""))
        n = max(3, int(a.duration / m["bar_s"])); e = m["energy_per_bar"][:n]; t = len(e) // 3 or 1
        th = [sum(e[:t]) / t, sum(e[t:2 * t]) / max(1, len(e[t:2 * t])), sum(e[2 * t:]) / max(1, len(e[2 * t:]))]; mean = sum(th) / 3 or 1
        ar = [x / mean for x in th]; dist = sum(abs(x - y) for x, y in zip(ar, REF_ARC)); s += 2.0 - min(2.0, dist * 2)
        why.append("arc over %.0f s %s vs ref %s" % (a.duration, "/".join("%.2f" % x for x in ar), "/".join("%.2f" % x for x in REF_ARC)))
        intro = next((x for x in m["sections"] if x["kind"] == "intro"), None)
        if intro and intro["to_bar"] * m["bar_s"] > 0.2 * a.duration: s -= 0.7; why.append("long intro %.0f s" % (intro["to_bar"] * m["bar_s"]))
        bars = [round(m["t0"] + i * m["bar_s"], 2) for i in range(int(a.duration / m["bar_s"]) + 1)]
        rows.append((s, k["id"], why, bars, m["bar_s"], m["beat_s"], m.get("safe_cuts", [])[:8]))
    rows.sort(reverse=True)
    print("MUSIC PICK mood=%s bpm=%s duration=%.0fs%s" % (a.mood, a.bpm, a.duration, " ratio=" + a.ratio if a.ratio else ""))
    for i, (s, tid, why, bars, bar_s, beat_s, safe) in enumerate(rows[:a.top], 1):
        print("%d. %s  score %.1f  (bar %.3f s = 4 x %.3f s)" % (i, tid, s, bar_s, beat_s))
        for w in why: print("     - " + w)
        print("     cut grid (bar times, s): " + ", ".join(str(b) for b in bars[:14]) + (" ..." if len(bars) > 14 else ""))
        print("     phrase-safe bars: %s" % safe)
main()
