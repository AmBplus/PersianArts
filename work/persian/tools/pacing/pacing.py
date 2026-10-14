#!/usr/bin/env python3
"""pa pacing <film.mp4|film.html> [--html film.html] [--chars 12,30,...] [--profile teaser|story|typography|ad] [--ratio 9x16] [--md out.md]
Measures OUR film like the 38 references (docs/motion/knowledge/ref-pacing*.json) and prints a verdict per metric against the
profile p25..p75 (too fast / ok / too slow). Advisory: scores inform, never block (exit 0 always).
Needs the sound venv (numpy, librosa): sound/.venv/Scripts/python.exe"""
import argparse, json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import pacing_lib as P

R = Path(__file__).resolve().parents[4]
KN = R / "docs/motion/knowledge"
PROFILE = {"teaser": "promo-teaser", "story": "story-reels", "typography": "typography-motion", "ad": "story-reels"}
AR = re.compile(r"[؀-ۿ]")


def verdict(v, rng, lo_word="too fast", hi_word="too slow"):
    if v is None or not rng or rng.get("p25") is None: return "n/a"
    if v < rng["p25"]: return lo_word
    if v > rng["p75"]: return hi_word
    return "ok"


def html_chars(html):
    t = Path(html).read_text(encoding="utf-8", errors="ignore")
    parts = re.split(r'(?=<(?:section|div)[^>]*(?:data-scene|class="[^"]*\bscene\b))', t)
    parts = [p for p in parts if re.match(r'<(?:section|div)[^>]*(?:data-scene|class="[^"]*\bscene\b)', p)]
    return [len(AR.findall(re.sub(r"<[^>]+>", " ", p))) for p in parts]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("film"); ap.add_argument("--html"); ap.add_argument("--chars"); ap.add_argument("--profile"); ap.add_argument("--ratio"); ap.add_argument("--md"); ap.add_argument("--label"); ap.add_argument("--cuts", help="real cut times: comma list of seconds or an events.json (cut_frames/fps); preferred over detection"); ap.add_argument("--track", help="kit music id: beat/bar grid from its .music.json (period) + film offset t0_s from --events/--cuts json (default 0)"); ap.add_argument("--events", help="events.json with bpm/t0_s/cut_frames")
    ap.add_argument("--one-take", action="store_true", help="one continuous camera/shot (no real cuts): skip the cut-based rows (shot length, cuts per 10 s, build/hold, cuts on beat/bar)")
    a = ap.parse_args()
    mp4 = a.film if a.film.lower().endswith(".mp4") else None
    if not mp4: sys.exit("pacing needs an mp4 for the numbers (html is optional via --html)")
    real = None; ev = None
    for src in (a.events, a.cuts if a.cuts and a.cuts.lower().endswith(".json") else None):
        if src: ev = json.load(open(src, encoding="utf-8"))
    if a.cuts:
        if ev is not None and a.cuts.lower().endswith(".json"):
            real = [cf / float(ev.get("fps", 30)) for cf in ev.get("cut_frames", []) if cf > 0]
        else: real = [float(x) for x in a.cuts.split(",") if x.strip()]
    elif ev and ev.get("cut_frames"): real = [cf / float(ev.get("fps", 30)) for cf in ev["cut_frames"] if cf > 0]
    m = P.video_metrics(mp4, cuts_override=real)
    ratio = a.ratio or m["ratio"]
    prof = a.profile or ("story" if ratio == "9x16" else "teaser")
    S = json.load(open(KN / "ref-pacing-summary.json", encoding="utf-8"))
    style = PROFILE[prof]
    ref = S["by_style"][style]
    refr = S["by_ratio"].get(ratio) or ref
    if prof == "ad": ref = S["by_ratio"]["9x16"]
    grid = None
    if a.track or (ev and ev.get("bpm")):
        import numpy as _np
        if a.track:
            mj = json.load(open(R / "sound/library/kit/music" / (next((c for c in (a.track, a.track[3:] if a.track.startswith("tr-") else a.track, "tr-" + a.track) if (R / "sound/library/kit/music" / (c + ".music.json")).exists()), a.track) + ".music.json"), encoding="utf-8")); bpm = float(ev.get("bpm") or mj["bpm"]) if ev else mj["bpm"]
        else: bpm = float(ev["bpm"])
        t0 = float(ev.get("t0_s", 0.0)) if ev else 0.0; bs = 60.0 / bpm
        grid = {"beats": [t0 + k * bs for k in range(int((m["duration_s"] - t0) / bs) + 1)], "bars": [t0 + k * 4 * bs for k in range(int((m["duration_s"] - t0) / (4 * bs)) + 1)], "bpm": bpm, "source": "track grid %s bpm %.2f t0 %.3f" % (a.track or "events.json", bpm, t0)}
    au = P.audio_metrics(mp4, m["cuts"], m["duration_s"], grid) if m["has_audio"] else None
    chars = [int(x) for x in a.chars.split(",")] if a.chars else (html_chars(a.html) if a.html else None)
    L = []
    P_ = L.append
    P_("PACING %s  (%s, %.1f s, ratio %s, profile %s=%s, n_ref=%d)  [advisory]" % (a.label or Path(mp4).name, "%dx%d" % (m["w"], m["h"]), m["duration_s"], ratio, prof, style, ref["n"]))
    if real: P_("cuts: %d given, %d detected; detected cuts matching a real cut within 120 ms: %d" % (len(real), len(m["cuts_detected"]), sum(1 for r in real if any(abs(r - d) <= 0.12 for d in m["cuts_detected"]))))
    if au: P_("beat/bar grid source: %s" % au["grid_source"])
    P_("%-28s %-9s %-16s %s" % ("metric", "ours", "ref p25..p75", "verdict"))
    findings = []
    def row(name, v, rng, lo="too fast", hi="too slow", fmt="%.2f"):
        if a.one_take and name in ("median shot length (s)", "cuts per 10 s", "elements per scene", "build time median (s)", "hold time median (s)"): return
        vd = verdict(v, rng, lo, hi)
        P_("%-28s %-9s %-16s %s" % (name, fmt % v if v is not None else "-", "%s..%s" % (rng["p25"], rng["p75"]) if rng and rng.get("p25") is not None else "-", vd))
        if vd not in ("ok", "n/a"): findings.append((name, v, rng, vd))
    row("median shot length (s)", m["shot_median_s"], ref["shot_median_s"])
    row("cuts per 10 s", m["cuts_per_10s"], ref["cuts_per_10s"], "too slow", "too fast")
    first3 = sum(1 for c in m["cuts"] if c < 3.0)
    if not a.one_take: P_("%-28s %-9d %-16s %s" % ("cuts in first 3 s", first3, ">= 1 typical", "ok" if first3 >= 1 else "no early cut/hook change"))
    row("elements per scene", m["elements_per_scene"], ref["elements_per_scene"], "sparse", "busy")
    row("build time median (s)", m["build_s_median"], ref["build_s"], "build too quick", "build too slow")
    row("hold time median (s)", m["hold_s_median"], ref["hold_s"], "hold too short", "hold long")
    if a.one_take: P_("one-take mode: cut-based rows (shot length, cuts per 10 s, build/hold, cuts on beat/bar) are not applicable")
    er = m["energy_ratio"]; rer = ref["energy_ratio_intro_mid_outro"]
    P_("%-28s %-9s %-16s %s" % ("energy intro/mid/outro", "/".join("%.2f" % x for x in er), "/".join("%.2f" % x for x in rer),
       "flat (no arc)" if max(er) - min(er) < 0.15 else "ok (arc present)" if er[2] <= er[1] + 0.05 else "outro hotter than middle"))
    if au:
        row("tempo (bpm, from mix)", au["tempo_bpm"], ref["tempo_bpm"], "slow music", "fast music")
        if au["cuts_on_beat"] is None: au["cuts_on_beat"] = au["cuts_on_bar"] = 0.0; P_("note: no cuts in this clip, beat/bar alignment shown as 0%")
        chance_beat = min(1.0, 2 * P.TOL / au["beat_s"]); chance_bar = chance_beat / 4
        if not a.one_take: P_("%-28s %-9s %-16s %s" % ("cuts on beat (60 ms)", "%.0f%%" % (100 * au["cuts_on_beat"]), "chance %.0f%%, ref %.0f%%" % (100 * chance_beat, 100 * ref["cuts_on_beat"]["median"]),
           "locked" if au["cuts_on_beat"] >= 0.6 else "near chance: cuts not beat-locked"))
        if not a.one_take: P_("%-28s %-9s %-16s %s" % ("cuts on bar downbeat", "%.0f%%" % (100 * au["cuts_on_bar"]), "chance %.0f%%" % (100 * chance_bar), "locked" if au["cuts_on_bar"] >= 0.5 else "near/below chance: cuts not bar-locked"))
        P_("%-28s %-9s %-16s" % ("loudness LUFS / RMS arc dB", "%s" % au["lufs"], "/".join(str(x) for x in au["rms_arc_db"])))
        if not a.one_take and m["cuts"] and au["cuts_on_beat"] < 0.4: findings.append(("cuts on beat", au["cuts_on_beat"], None, "not beat-locked"))
    else:
        P_("audio: none (silent film) - beat/bar/loudness not measured")
    if not a.one_take: P_("scenes (start-end, len, elements, build, hold%s):" % (", chars, hold floor" if chars else ""))
    for i, s in enumerate([] if a.one_take else m["scenes"]):
        extra = ""
        if chars and i < len(chars) and chars[i]:
            floor = 0.6 + 0.045 * chars[i]
            ok = (s["len"] - s["build_s"]) >= floor
            extra = "  chars %d floor %.2f s %s" % (chars[i], floor, "ok" if ok else "READABILITY RISK")
            if not ok: findings.append(("scene %d hold below readability floor" % (i + 1), s["len"] - s["build_s"], None, "floor %.2f" % floor))
        P_("  %2d %5.2f-%5.2f len %4.2f el %2d build %4.2f hold %4.2f%s" % (i + 1, s["start"], s["end"], s["len"], s["elements"], s["build_s"], s["hold_s"], extra))
    P_("note: hold = last element appearance -> next cut (proxy); readability floor uses scene length minus build time.")
    out = "\n".join(L)
    print(out)
    if a.md:
        Path(a.md).write_text("```\n" + out + "\n```\n", encoding="utf-8")
    json.dump({"metrics": {k: m[k] for k in m if k != "energy_curve_025s"}, "audio": {k: v for k, v in (au or {}).items() if k not in ("beats", "bars")}, "findings": [(f[0], f[1], f[3]) for f in findings]}, open(Path(a.md).with_suffix(".json") if a.md else Path(__file__).with_name(".last.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=str)


main()
