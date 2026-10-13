#!/usr/bin/env python3
"""Tests for the tool fixes made after S07: run-gates --scenery, pacing --one-take, audio-check --events, pa time phase 'env'.
Run: python work/persian/tools/test_s07_fixes.py   (needs ffmpeg and node; builds a 4 s synthetic clip in a temp dir)"""
import json, subprocess, sys, tempfile
from pathlib import Path

T = Path(__file__).resolve().parent
ROOT = T.parents[2]
VENV = ROOT / "sound" / ".venv" / "Scripts" / "python.exe"
PY = str(VENV) if VENV.exists() else sys.executable


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", cwd=ROOT, **kw)
    return (r.stdout or "") + (r.stderr or ""), r.returncode


def main():
    with tempfile.TemporaryDirectory() as d:
        mp4 = str(Path(d) / "clip.mp4")
        out, rc = run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=s=270x480:r=30:d=4", "-f", "lavfi", "-i", "sine=frequency=440:d=4",
                       "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", mp4])
        assert rc == 0, out
        # (a) scenery switch
        o1, _ = run(["node", str(T / "gates/run-gates.mjs"), mp4, "--no-logo", "--only", "edge", "--scenery"])
        assert "edge-touch" in o1 and "N/A" in o1, o1
        o2, _ = run(["node", str(T / "gates/run-gates.mjs"), mp4, "--no-logo", "--only", "edge"])
        assert "edge-touch" in o2 and "scenery film" not in o2, o2
        # (b) pacing one-take
        o3, _ = run([PY, str(T / "pacing/pacing.py"), mp4, "--one-take"])
        assert "one-take mode" in o3 and "cuts on beat (60 ms)" not in o3 and "median shot length (s)" not in o3, o3
        # (d) audio-check --events
        ev_ok = Path(d) / "ev_ok.json"; ev_bad = Path(d) / "ev_bad.json"
        ev_ok.write_text(json.dumps({"bpm": 120, "t0_s": 0.0, "fps": 30, "events": [{"name": "a", "t_s": 0.5}, {"name": "b", "t_s": 1.0}]}))
        ev_bad.write_text(json.dumps({"bpm": 120, "t0_s": 0.0, "fps": 30, "events": [{"name": "a", "t_s": 0.5}, {"name": "late", "t_s": 1.013}, {"name": "beyond", "t_s": 9.0}]}))
        o4, _ = run([PY, str(T / "audio/audio_check.py"), mp4, "--events", str(ev_ok)])
        assert "events on the beat grid: 2 of 2" in o4, o4
        o5, _ = run([PY, str(T / "audio/audio_check.py"), mp4, "--events", str(ev_bad)])
        assert "off the beat grid" in o5 and "late +13.0 ms" in o5 and "event beyond the film" in o5, o5
    # (c) time phase env
    o6, _ = run(["node", "--input-type=module", "-e", f"import {{PHASES}} from '{(T / 'timing/time.mjs').as_uri()}'; console.log(PHASES.includes('env') ? 'ENV-OK' : 'ENV-MISSING')"])
    assert "ENV-OK" in o6, o6
    print("test_s07_fixes PASS (scenery switch, one-take pacing, audio-check --events, time phase env)")


if __name__ == "__main__":
    main()
