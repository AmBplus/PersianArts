#!/usr/bin/env python3
"""Calibration test of pa pacing (T004). Builds a synthetic 20 s film: hard cuts between 5 distinct clips at KNOWN times that sit on bar
downbeats of a 120 BPM click track (a click every beat, loud downbeat). The tool must (a) detect the cuts within 60 ms, (b) report >= 90% of
cuts on beat with the audio-onset grid AND with the explicit grid (--cuts/--track path), (c) report >= 90% on bar with the explicit grid.
Run: sound/.venv/Scripts/python.exe work/persian/tools/pacing/test_calibration.py"""
import subprocess, sys, tempfile
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).parent))
import pacing_lib as P

BPM = 120.0; BEAT = 60 / BPM; BAR = 4 * BEAT; DUR = 20.0
CUTS = [4.0, 8.0, 12.0, 16.0]  # every 2 bars


def build(out):
    segs = []
    for i, (c1, c2) in enumerate([("red", "blue"), ("green", "yellow"), ("white", "black"), ("magenta", "cyan"), ("orange", "navy")]):
        segs.append("color=c=%s:s=360x640:r=30:d=4[a%d];color=c=%s:s=360x640:r=30:d=4[b%d];[a%d][b%d]blend=all_expr='A*(1-X/W)+B*(X/W)'[v%d]" % (c1, i, c2, i, i, i, i))
    fc = ";".join(segs) + ";" + "".join("[v%d]" % i for i in range(5)) + "concat=n=5:v=1:a=0[v]"
    audio = "aevalsrc='(0.3+0.5*lt(mod(t,%s),0.05))*sin(2*PI*1000*t)*lt(mod(t,%s),0.04)':d=%s:s=44100" % (BAR, BEAT, DUR)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-filter_complex", fc, "-f", "lavfi", "-i", audio, "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-t", str(DUR), str(out)], check=True)


def main():
    f = Path(tempfile.mkdtemp()) / "calib.mp4"; build(f)
    m = P.video_metrics(f); det = m["cuts_detected"]
    hit = [c for c in CUTS if any(abs(c - d) <= 0.06 for d in det)]
    print("known cuts", CUTS, "detected", det, "matched within 60 ms: %d/%d" % (len(hit), len(CUTS)))
    a_det = P.audio_metrics(f, det, DUR)
    grid = {"beats": [k * BEAT for k in range(int(DUR / BEAT))], "bars": [k * BAR for k in range(int(DUR / BAR))], "bpm": BPM, "source": "synthetic"}
    a_giv = P.audio_metrics(f, CUTS, DUR, grid)
    print("audio-onset grid, detected cuts : on beat %.0f%% on bar %s (tempo %.1f)" % (100 * (a_det["cuts_on_beat"] or 0), a_det["cuts_on_bar"], a_det["tempo_bpm"]))
    print("explicit grid, given cuts       : on beat %.0f%% on bar %.0f%%" % (100 * a_giv["cuts_on_beat"], 100 * a_giv["cuts_on_bar"]))
    ok = len(hit) >= 0.9 * len(CUTS) and (a_det["cuts_on_beat"] or 0) >= 0.9 and a_giv["cuts_on_beat"] >= 0.9 and a_giv["cuts_on_bar"] >= 0.9
    print("PASS calibration" if ok else "FAIL calibration"); sys.exit(0 if ok else 1)

main()
