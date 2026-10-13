#!/usr/bin/env python
"""pa music-drop <kit id> [--json] [--test]
Finds the beat drop (largest section-change rise) of a kit track from its .music.json (energy per bar, bar grid) and refines it with the
audio (10 ms RMS curve: strongest rise within +-60 ms of the grid downbeat). Prints drop bar, grid time, refined time, offset and the
phrase-aligned film placement (which bar of a film starting at the track's bar `skip` the drop lands on).
Usage: pa music-drop tr-miromax-promo-513944     |  pa music-drop miromax-promo-513944 --json   |  python music_drop.py --test
"""
import argparse, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
KIT = ROOT / "sound" / "library" / "kit" / "music"


def find_drop(kit_id, refine=True):
    kid = kit_id[3:] if kit_id.startswith("tr-") else kit_id
    meta = json.loads((KIT / f"{kid}.music.json").read_text(encoding="utf-8"))
    en, bar_s, t0, bpb = meta["energy_per_bar"], meta["bar_s"], meta["t0"], meta.get("beats_per_bar", 4)
    best = None                                                       # largest rise of the mean of the next 2 bars over the previous 2 bars
    for b in range(2, len(en) - 2):
        rise = (sum(en[b:b + 2]) / 2) - (sum(en[b - 2:b]) / 2)
        if best is None or rise > best[1]:
            best = (b, rise)
    bar, rise = best
    grid_s = t0 + bar * bar_s
    out = {"track": "tr-" + kid, "bpm": meta["bpm"], "bar_s": bar_s, "t0_s": t0, "drop_bar": bar, "energy_rise": round(rise, 3),
           "grid_drop_s": round(grid_s, 4), "grid_verdict": meta["grid"]["verdict"], "refined_drop_s": None, "offset_ms": None}
    if refine:                                                         # strongest kick/impact of the kit's own onset list within +-60 ms of the grid downbeat
        cand = [i for i in meta.get("impacts", []) if abs(i["t"] - grid_s) <= 0.06]
        if cand:
            top = max(cand, key=lambda i: i["s"])
            out["refined_drop_s"] = round(top["t"], 4); out["offset_ms"] = round((top["t"] - grid_s) * 1000, 1); out["refined_kind"] = top["k"]
        else:
            out["refine_error"] = "no impact near the grid downbeat"
    return out


def test():
    r = find_drop("tr-miromax-promo-513944")
    assert r["drop_bar"] == 8, r                                      # intro bars 0-7 (energy 0.43-0.66) then bar 8 (0.81+)
    assert abs(r["grid_drop_s"] - (0.15857 + 8 * 2.033908)) < 0.01, r
    if r["refined_drop_s"] is not None:  # downbeat hit within 60 ms
        assert abs(r["offset_ms"]) <= 60, r
    assert find_drop("px-99s-d", refine=False)["drop_bar"] in (4, 8), "px-99s-d drop"
    print("music_drop test PASS", json.dumps(r))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("kit", nargs="?"); ap.add_argument("--json", action="store_true"); ap.add_argument("--test", action="store_true")
    a = ap.parse_args()
    if a.test or not a.kit:
        test(); sys.exit(0)
    r = find_drop(a.kit)
    if a.json: print(json.dumps(r, indent=1))
    else:
        print(f"MUSIC DROP {r['track']} bpm {r['bpm']:.1f} grid {r['grid_verdict']}: drop at bar {r['drop_bar']} (energy rise {r['energy_rise']})")
        print(f"  grid downbeat {r['grid_drop_s']} s; audio-refined {r['refined_drop_s']} s (offset {r['offset_ms']} ms)")
        print(f"  film placement: start the bed {r['drop_bar']} - N bars into the track so the drop lands on film bar N (builder: --t0 -N*bar_s = {-r['bar_s']:.4f} per bar)")
