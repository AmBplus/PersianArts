#!/usr/bin/env python3
"""Measure the 38 reference templates -> docs/motion/knowledge/ref-pacing.json + ref-pacing-summary.json.
Run: sound/.venv/Scripts/python.exe work/persian/tools/pacing/analyze_refs.py [--jobs 6]"""
import json, sys, argparse, statistics as st
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import pacing_lib as P

R = Path(__file__).resolve().parents[4]
REF = R / "work/viditor-reference"
OUT = R / "docs/motion/knowledge"
TIERA = {7000, 6873, 7125, 5925, 7097, 5961}


def one(c):
    vid = REF / c["media"]["video"]
    aud = REF / c["media"]["audio"] if c["media"].get("audio") else None
    try:
        m = P.video_metrics(vid)
        a = P.audio_metrics(aud, m["cuts"], m["duration_s"]) if aud and aud.exists() else None
    except Exception as e:
        return {"id": c["id"], "error": str(e)[:200]}
    if a:
        a.pop("beats", None); a.pop("bars", None)
    m.pop("energy_curve_025s", None)
    return {"id": c["id"], "tier": c["tier"], "category": c["category"], "styleType": c["styleType"], "tags_music": c.get("music", {}), **m, "audio": a}


def q(v, p):
    v = sorted(x for x in v if x is not None)
    if not v: return None
    k = (len(v) - 1) * p; f = int(k); c = min(f + 1, len(v) - 1)
    return round(v[f] + (v[c] - v[f]) * (k - f), 2)


def summ(rows):
    def col(f): return [f(r) for r in rows]
    def rng(f):
        v = col(f); return {"p25": q(v, .25), "median": q(v, .5), "p75": q(v, .75)}
    ok = [r for r in rows if r.get("audio")]
    return {"n": len(rows), "shot_median_s": rng(lambda r: r["shot_median_s"]), "cuts_per_10s": rng(lambda r: r["cuts_per_10s"]),
            "elements_per_scene": rng(lambda r: r["elements_per_scene"]),
            "build_s": rng(lambda r: r["build_s_median"]), "hold_s": rng(lambda r: r["hold_s_median"]),
            "energy_ratio_intro_mid_outro": [q([r["energy_ratio"][i] for r in rows], .5) for i in range(3)],
            "duration_s": rng(lambda r: r["duration_s"]),
            "tempo_bpm": rng(lambda r: r["audio"]["tempo_bpm"]) if ok else None,
            "cuts_on_beat": {"p25": q([r["audio"]["cuts_on_beat"] for r in ok], .25), "median": q([r["audio"]["cuts_on_beat"] for r in ok], .5), "p75": q([r["audio"]["cuts_on_beat"] for r in ok], .75)} if ok else None,
            "cuts_on_bar": {"p25": q([r["audio"]["cuts_on_bar"] for r in ok], .25), "median": q([r["audio"]["cuts_on_bar"] for r in ok], .5), "p75": q([r["audio"]["cuts_on_bar"] for r in ok], .75)} if ok else None,
            "lufs_median": q([r["audio"]["lufs"] for r in ok], .5) if ok else None,
            "rms_arc_db_median": [q([r["audio"]["rms_arc_db"][i] for r in ok], .5) for i in range(3)] if ok else None}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--jobs", type=int, default=6); a = ap.parse_args()
    cands = json.load(open(REF / "candidates.json", encoding="utf-8"))["candidates"]
    with ProcessPoolExecutor(a.jobs) as ex: rows = list(ex.map(one, cands))
    bad = [r for r in rows if "error" in r]; rows = [r for r in rows if "error" not in r]
    OUT.mkdir(parents=True, exist_ok=True)
    json.dump(sorted(rows, key=lambda r: r["id"]), open(OUT / "ref-pacing.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    S = {"_meta": {"n": len(rows), "errors": bad, "tierA_ids_named_by_owner": sorted(TIERA)}, "by_style": {}, "by_style_ratio": {}, "all": summ(rows), "named_tier_A": summ([r for r in rows if r["id"] in TIERA])}
    for key, f in (("by_style", lambda r: r["styleType"]), ("by_style_ratio", lambda r: r["styleType"] + "|" + r["ratio"]), ):
        g = {}
        for r in rows: g.setdefault(f(r), []).append(r)
        S[key] = {k: summ(v) for k, v in sorted(g.items())}
    S["by_ratio"] = {}
    for r in rows: S["by_ratio"].setdefault(r["ratio"], []).append(r)
    S["by_ratio"] = {k: summ(v) for k, v in S["by_ratio"].items()}
    json.dump(S, open(OUT / "ref-pacing-summary.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("analyzed %d, errors %d -> %s" % (len(rows), len(bad), OUT))

if __name__ == "__main__":
    main()
