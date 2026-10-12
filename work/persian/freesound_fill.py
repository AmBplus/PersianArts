#!/usr/bin/env python3
"""Fill SFX gaps from Freesound by reusing freesound_fetch.py (same CC0 filter, pacing, 429 back-off,
manifest and resume logic). Only the category table is replaced.

Usage (repo root):  python -I work/persian/freesound_fill.py [--per-category 20] [--categories a,b] [--minutes 22]
"""
import importlib.util
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("freesound_fetch", HERE / "freesound_fetch.py")
fetch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fetch)

# taxonomy category -> (max duration s, queries); synth-tagged results are rejected by fetch.accept()
GAP_CATEGORIES = {
    "paper-pencil": (6.0, ["pencil writing on paper close", "pen scribble paper", "pencil line draw",
                           "marker squeak paper", "pencil sketch quick strokes"]),
    "slide": (6.0, ["paper slide on table", "card sliding across table", "sliding paper sheet"]),
    "sparkle-magic": (6.0, ["magic sparkle short", "fairy twinkle shimmer", "magic zing chime"]),
    "glitch": (6.0, ["digital glitch short", "glitch stutter burst"]),
    "tick-clock": (6.0, ["clock tick close", "countdown tick", "wall clock tick"]),
    "swoosh-transition": (6.0, ["swoosh transition", "fast swoosh scene change"]),
    "downlifter": (6.0, ["downlifter sweep", "reverse cymbal downlifter"]),
    "bubble": (6.0, ["bubble pop", "soap bubble pop"]),
    "success": (6.0, ["success chime short", "positive confirmation jingle"]),
    "fail": (6.0, ["fail buzzer short", "wrong answer buzz"]),
    "stamp-thud": (6.0, ["rubber stamp thud", "stamp on paper", "wooden stamp impact"]),
}

# second pass: alternative wording for categories that stayed under 10 usable clips
EXTRA_CATEGORIES = {
    "paper-pencil": (6.0, ["ballpoint pen writing", "handwriting on paper", "felt tip pen draw"]),
    "slide": (6.0, ["paper slide", "cardboard slide", "sliding card", "slide across wood"]),
    "sparkle-magic": (6.0, ["sparkle", "twinkle", "magic wand", "shimmer", "glitter sound"]),
    "glitch": (6.0, ["glitch", "digital error sound", "stutter"]),
    "tick-clock": (6.0, ["clock tick", "tick tock", "stopwatch tick", "metronome tick"]),
    "downlifter": (6.0, ["downlifter", "falling sweep", "descending swoosh", "reverse sweep down"]),
    "stamp-thud": (6.0, ["stamp", "stamp sound", "rubber stamp", "thud"]),
    "success": (6.0, ["success", "correct answer", "level up", "positive ding"]),
    "fail": (6.0, ["fail", "wrong buzz", "error buzzer", "game over"]),
}

if __name__ == "__main__":
    extra = "--extra" in sys.argv
    if extra:
        sys.argv.remove("--extra")
    fetch.CATEGORIES = EXTRA_CATEGORIES if extra else GAP_CATEGORIES
    fetch.LOG = HERE / ("freesound-fill-extra.log" if extra else "freesound-fill.log")
    fetch.main()
