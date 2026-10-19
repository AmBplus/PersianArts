#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""summarize.py — aggregate work/persian/tools/cards/out/posters.json into the
storylab-beauty library design-system deliverables.

Outputs (media/briefs-local/storylab-beauty/):
  library-palettes.csv, library-type-scale.csv, library-devices.csv,
  library-stats.json  (all aggregate numbers used by the markdown standard)
"""
import os, sys, json, csv, collections, math

REPO = r"D:\P\project\persianArts"
OUT = os.path.join(REPO, "work", "persian", "tools", "cards", "out")
DST = os.path.join(REPO, "media", "briefs-local", "storylab-beauty")


def hex_rgb(h):
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (1, 3, 5))


def dist(a, b):
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def cluster_colours(rows, key, tol=0.10):
    """Greedy single-pass clustering of hex strings; returns clusters sorted by size."""
    clusters = []
    for r in rows:
        h = r[key]
        if not h:
            continue
        c = hex_rgb(h)
        placed = False
        for cl in clusters:
            if dist(c, cl["centre"]) <= tol:
                cl["members"].append(h)
                n = len(cl["members"])
                cl["centre"] = tuple((cl["centre"][i] * (n - 1) + c[i]) / n for i in range(3))
                cl["paths"].append(r["path"])
                placed = True
                break
        if not placed:
            clusters.append(dict(centre=c, members=[h], paths=[r["path"]]))
    clusters.sort(key=lambda cl: -len(cl["members"]))
    return clusters


def median(xs):
    xs = sorted(xs)
    n = len(xs)
    if n == 0:
        return 0.0
    return xs[n // 2] if n % 2 else (xs[n // 2 - 1] + xs[n // 2]) / 2.0


def pct(xs, q):
    xs = sorted(xs)
    if not xs:
        return 0.0
    i = min(len(xs) - 1, max(0, int(round(q * (len(xs) - 1)))))
    return xs[i]


def colour_family(h):
    """Deterministic short name for a hex colour (luminance band + hue word)."""
    r, g, b = hex_rgb(h)
    L = 0.2126 * r + 0.7152 * g + 0.0722 * b
    mx, mn = max(r, g, b), min(r, g, b)
    s = 0.0 if mx <= 0 else (mx - mn) / mx
    # hue
    if mx == mn:
        hue = "neutral"
    elif mx == r:
        hue = "warm" if g >= b else "rose"
    elif mx == g:
        hue = "green"
    else:
        hue = "blue"
    warm = (r - b) > 0.06
    if L < 0.10:
        return "near-black" + (" navy" if b > r else "")
    if L < 0.22:
        return "deep " + ("navy" if b >= r else "umber")
    if L < 0.40:
        return "charcoal" if s < 0.25 else ("olive" if hue == "green" else "deep " + hue)
    if L < 0.65:
        return "grey" if s < 0.18 else (hue + " mid")
    if L < 0.85:
        return "pale warm" if warm else ("pale grey" if s < 0.15 else "pale " + hue)
    if s < 0.12:
        return "paper white"
    return "cream" if warm else ("mint" if hue == "green" else "pale " + hue)


def palette_families(rows, tol=0.16, min_members=2):
    """Cluster whole 5-colour palettes (luminance-ordered) into palette families."""
    vecs = []
    for r in rows:
        cols = [c for c in r["palette"] if c]
        if len(cols) < 3:
            continue
        ordered = sorted(cols, key=lambda h: -sum(hex_rgb(h)[i] * w for i, w in
                                                  enumerate((0.2126, 0.7152, 0.0722))))
        v = [hex_rgb(h) for h in ordered]
        while len(v) < 5:
            v.append(v[-1])
        vecs.append((r, v[:5]))
    fams = []
    for r, v in vecs:
        best = None
        for f in fams:
            rms = math.sqrt(sum(dist(v[i], f["centre"][i]) ** 2 for i in range(5)) / 5.0)
            if best is None or rms < best[0]:
                best = (rms, f)
        if best and best[0] <= tol:
            f = best[1]
            n = len(f["members"])
            f["centre"] = [tuple((f["centre"][i][k] * n + v[i][k]) / (n + 1) for k in range(3))
                           for i in range(5)]
            f["members"].append((r, v))
        else:
            fams.append(dict(centre=[tuple(c) for c in v], members=[(r, v)]))
    out = []
    for f in fams:
        if len(f["members"]) < min_members:
            continue
        # medoid = member closest to the family centre
        med = min(f["members"], key=lambda m: sum(dist(m[1][i], f["centre"][i]) for i in range(5)))
        hexes = ["#%02X%02X%02X" % tuple(int(round(x * 255)) for x in c) for c in med[1]]
        out.append(dict(hexes=hexes, n=len(f["members"]),
                        mean_lum=sum(m[0]["mean_lum"] for m in f["members"]) / len(f["members"]),
                        ex=med[0]["path"], members=[m[0] for m in f["members"]]))
    out.sort(key=lambda f: -f["n"])
    return out


def main():
    rows = json.load(open(os.path.join(OUT, "posters.json"), encoding="utf-8"))
    os.makedirs(DST, exist_ok=True)
    ty = [r for r in rows if r["kind"] == "typography"]
    sc = [r for r in rows if r["kind"] == "shotcraft"]
    stats = dict(n_total=len(rows), n_typography=len(ty), n_shotcraft=len(sc))

    # ---- palettes: cluster the 5 median-cut colours across all posters
    allc = []
    for r in rows:
        for h in r["palette"]:
            if h:
                allc.append(dict(hex=h, path=r["path"]))
    cl = cluster_colours(allc, "hex", 0.10)
    pal_rows = []
    for i, c in enumerate(cl[:16], 1):
        reps = c["members"][:5]
        while len(reps) < 5:
            reps.append("")
        pal_rows.append(dict(palette_id="P%02d" % i, name="", hex1=reps[0], hex2=reps[1],
                             hex3=reps[2], hex4=reps[3], hex5=reps[4],
                             mean_luminance="", usage_count=len(c["members"]),
                             example_path=c["paths"][0]))
    stats["palette_clusters"] = [dict(hex="".join("#%02X%02X%02X" % tuple(int(round(v * 255)) for v in cl_i["centre"])),
                                      n=len(cl_i["members"]), ex=cl_i["paths"][0])
                                 for cl_i in cl[:16]]

    # ---- background / luminance
    bgs = cluster_colours(rows, "bg_hex", 0.10)
    stats["bg_clusters"] = [dict(hex="#%02X%02X%02X" % tuple(int(round(v * 255)) for v in c["centre"]),
                                 n=len(c["members"]), ex=c["paths"][0]) for c in bgs[:10]]
    lums = [r["mean_lum"] for r in rows]
    stats["mean_lum"] = dict(
        n=len(lums), min=round(min(lums), 4), p10=round(pct(lums, .10), 4),
        p25=round(pct(lums, .25), 4), median=round(median(lums), 4),
        p75=round(pct(lums, .75), 4), p90=round(pct(lums, .90), 4), max=round(max(lums), 4),
        mean=round(sum(lums) / len(lums), 4))
    dark = [l for l in lums if l < 0.30]
    light = [l for l in lums if l > 0.70]
    mid = [l for l in lums if 0.30 <= l <= 0.70]
    stats["bimodality"] = dict(dark=len(dark), mid=len(mid), light=len(light),
                               dark_pct=round(100.0 * len(dark) / len(lums), 1),
                               mid_pct=round(100.0 * len(mid) / len(lums), 1),
                               light_pct=round(100.0 * len(light) / len(lums), 1),
                               dark_mean=round(sum(dark) / max(1, len(dark)), 4),
                               light_mean=round(sum(light) / max(1, len(light)), 4))
    ty_lums = [r["mean_lum"] for r in ty]
    sc_lums = [r["mean_lum"] for r in sc]
    stats["mean_lum_by_kind"] = dict(
        typography=dict(n=len(ty_lums), median=round(median(ty_lums), 4),
                        dark_pct=round(100.0 * sum(1 for l in ty_lums if l < 0.30) / max(1, len(ty_lums)), 1)),
        shotcraft=dict(n=len(sc_lums), median=round(median(sc_lums), 4),
                       dark_pct=round(100.0 * sum(1 for l in sc_lums if l < 0.30) / max(1, len(sc_lums)), 1)))
    stats["bg_frac"] = dict(median=round(median([r["bg_frac"] for r in rows]), 3),
                            p25=round(pct([r["bg_frac"] for r in rows], .25), 3),
                            p75=round(pct([r["bg_frac"] for r in rows], .75), 3))
    ctr = [r["contrast"] for r in rows]
    stats["contrast"] = dict(median=round(median(ctr), 2), p10=round(pct(ctr, .10), 2),
                             p90=round(pct(ctr, .90), 2), min=round(min(ctr), 2),
                             n_ge_4_5=int(sum(1 for c in ctr if c >= 4.5)),
                             n_ge_3_0=int(sum(1 for c in ctr if c >= 3.0)),
                             ge_4_5_pct=round(100.0 * sum(1 for c in ctr if c >= 4.5) / len(ctr), 1))
    stats["std_lum"] = dict(median=round(median([r["std_lum"] for r in rows]), 4))

    # ---- type scale
    with open(os.path.join(DST, "library-type-scale.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["poster_path", "technique", "frame_w", "frame_h", "type_block_h",
                    "type_h_ratio", "line_count", "est_font_px_1080"])
        for r in rows:
            w.writerow([r["path"], r["technique"], r["frame_w"], r["frame_h"],
                        r["type_block_h"], r["type_h_ratio"], r["line_count"],
                        r["est_font_px_1080"]])
    ratios = [r["type_h_ratio"] for r in rows]
    single = [r["type_h_ratio"] for r in rows if r["line_count"] == 1]
    stats["type_ratio"] = dict(n=len(ratios), min=round(min(ratios), 4),
                               p10=round(pct(ratios, .10), 4), p25=round(pct(ratios, .25), 4),
                               median=round(median(ratios), 4), p75=round(pct(ratios, .75), 4),
                               p90=round(pct(ratios, .90), 4), max=round(max(ratios), 4),
                               single_line_n=len(single), single_line_median=round(median(single), 4))
    big = [r for r in rows if r["type_h_ratio"] >= 0.12]
    stats["big_type"] = dict(n=len(big), pct=round(100.0 * len(big) / len(rows), 1))
    stats["type_px"] = dict(median=round(median([r["est_font_px_1080"] for r in rows]), 1),
                            p25=round(pct([r["est_font_px_1080"] for r in rows], .25), 1),
                            p75=round(pct([r["est_font_px_1080"] for r in rows], .75), 1),
                            max=round(max(r["est_font_px_1080"] for r in rows), 1))
    # per-kind
    for kind, sel in (("typography", ty), ("shotcraft", sc)):
        sel = [r for r in sel if r["type_h_ratio"] > 0.02]
        if sel:
            stats["type_ratio_" + kind] = dict(
                n=len(sel), median=round(median([r["type_h_ratio"] for r in sel]), 4),
                p25=round(pct([r["type_h_ratio"] for r in sel], .25), 4),
                p75=round(pct([r["type_h_ratio"] for r in sel], .75), 4),
                p90=round(pct([r["type_h_ratio"] for r in sel], .90), 4))

    # ---- devices
    with open(os.path.join(DST, "library-devices.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["poster_path", "technique", "has_dotgrid", "has_accent", "accent_hex",
                    "has_radius", "has_glow", "has_border"])
        for r in rows:
            w.writerow([r["path"], r["technique"], int(r["has_dotgrid"]), int(r["has_accent"]),
                        r["accent_hex"], int(r["has_radius"]), int(r["has_glow"]),
                        int(r["has_border"])])
    dev = {}
    for k in ("has_dotgrid", "has_accent", "has_radius", "has_glow", "has_border"):
        n = sum(1 for r in rows if r[k])
        dev[k] = dict(n=n, pct=round(100.0 * n / len(rows), 1),
                      typography_n=sum(1 for r in ty if r[k]),
                      typography_pct=round(100.0 * sum(1 for r in ty if r[k]) / max(1, len(ty)), 1),
                      shotcraft_n=sum(1 for r in sc if r[k]),
                      shotcraft_pct=round(100.0 * sum(1 for r in sc if r[k]) / max(1, len(sc)), 1))
    stats["devices"] = dev
    acc = [r for r in rows if r["has_accent"]]
    stats["accent_hues"] = collections.Counter(
        "#%02X%02X%02X" % tuple(int(round(v * 255)) for v in hex_rgb(r["accent_hex"]))
        for r in acc).most_common(12)
    stats["accent_families"] = [dict(hex="#%02X%02X%02X" % tuple(int(round(v * 255)) for v in c["centre"]),
                                     n=len(c["members"]), ex=c["paths"][0])
                                for c in cluster_colours(acc, "accent_hex", 0.14)[:10]]
    stats["radius"] = dict(n_ge4=sum(1 for r in rows if r["radius_px"] >= 4),
                           median_of_detected=median([r["radius_px"] for r in rows if r["radius_px"] >= 4]),
                           max=max(r["radius_px"] for r in rows))
    stats["texture_periodicity"] = dict(
        median=round(median([r["dotgrid_score"] for r in rows]), 3),
        p10=round(pct([r["dotgrid_score"] for r in rows], .10), 3),
        p90=round(pct([r["dotgrid_score"] for r in rows], .90), 3),
        n_ge_030=sum(1 for r in rows if r["dotgrid_score"] >= 0.30),
        n_ge_050=sum(1 for r in rows if r["dotgrid_score"] >= 0.50),
        pct_ge_030=round(100.0 * sum(1 for r in rows if r["dotgrid_score"] >= 0.30) / len(rows), 1))

    # ---- palettes CSV: whole-poster palette families (>=2 posters), luminance-ordered
    fams = palette_families(rows, tol=0.16, min_members=2)
    pal_rows = []
    for i, f in enumerate(fams, 1):
        name = "%s + %s" % (colour_family(f["hexes"][0]), colour_family(f["hexes"][-1]))
        pal_rows.append(dict(palette_id="P%02d" % i, name=name, hex1=f["hexes"][0],
                             hex2=f["hexes"][1], hex3=f["hexes"][2], hex4=f["hexes"][3],
                             hex5=f["hexes"][4], mean_luminance=round(f["mean_lum"], 4),
                             usage_count=f["n"], example_path=f["ex"]))
    stats["palette_families"] = [dict(palette_id=p["palette_id"], name=p["name"],
                                      hexes=[p["hex1"], p["hex2"], p["hex3"], p["hex4"], p["hex5"]],
                                      mean_luminance=p["mean_luminance"],
                                      usage_count=p["usage_count"], example_path=p["example_path"])
                                 for p in pal_rows]
    stats["palette_families_n"] = len(pal_rows)
    stats["palette_families_cover"] = sum(p["usage_count"] for p in pal_rows)
    with open(os.path.join(DST, "library-palettes.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["palette_id", "name", "hex1", "hex2", "hex3", "hex4", "hex5",
                    "mean_luminance", "usage_count", "example_path"])
        for p in pal_rows:
            w.writerow([p["palette_id"], p["name"], p["hex1"], p["hex2"], p["hex3"], p["hex4"],
                        p["hex5"], p["mean_luminance"], p["usage_count"], p["example_path"]])

    # ---- per category stats for shotcraft + typography archetypes
    cats = collections.Counter(r["category"] for r in sc)
    stats["shotcraft_categories"] = cats.most_common(20)
    stats["typography_archetypes"] = collections.Counter(r["category"] for r in ty).most_common(20)
    stats["typography_titles"] = [(r["technique"], r["title_fa"], r["category"]) for r in ty]

    # ---- extra cross-check numbers (used by the standard)
    HOUSE = hex_rgb("#0D1D2C")
    def near_house(r):
        return dist(hex_rgb(r["bg_hex"]), HOUSE) <= 0.10
    stats["house_plate"] = dict(
        total_n=sum(1 for r in rows if near_house(r)),
        total_pct=round(100.0 * sum(1 for r in rows if near_house(r)) / len(rows), 1),
        typography_n=sum(1 for r in ty if near_house(r)),
        typography_pct=round(100.0 * sum(1 for r in ty if near_house(r)) / max(1, len(ty)), 1),
        shotcraft_n=sum(1 for r in sc if near_house(r)),
        shotcraft_pct=round(100.0 * sum(1 for r in sc if near_house(r)) / max(1, len(sc)), 1))
    def top_bg(sel, k=5):
        return [("#%02X%02X%02X" % tuple(int(round(v * 255)) for v in c["centre"]),
                 len(c["members"]), c["paths"][0])
                for c in cluster_colours(sel, "bg_hex", 0.10)[:k]]
    stats["top_bg_typography"] = top_bg(ty)
    stats["top_bg_shotcraft"] = top_bg(sc)
    tyx = [r["est_font_px_1080"] for r in ty]
    stats["type_px_typography"] = dict(
        n=len(tyx), min=round(min(tyx), 1), p25=round(pct(tyx, .25), 1),
        median=round(median(tyx), 1), p75=round(pct(tyx, .75), 1), p90=round(pct(tyx, .90), 1),
        max=round(max(tyx), 1))
    ladder = [20, 24, 40, 72, 120, 168, 260]
    buckets = collections.Counter()
    on = 0
    for r in rows:
        v = r["est_font_px_1080"]
        if v <= 0:
            continue
        step = min(ladder, key=lambda s: abs(s - v))
        if abs(step - v) <= 0.20 * step:
            on += 1
            buckets[step] += 1
        else:
            buckets["off-ladder"] += 1
    stats["type_ladder"] = dict(ladder=ladder, on_ladder=on,
                                pct_on_ladder=round(100.0 * on / max(1, len([r for r in rows if r['est_font_px_1080'] > 0])), 1),
                                buckets=dict(buckets))
    af = [r["accent_frac"] for r in acc]
    stats["accent_area"] = dict(n=len(af), median_pct=round(100 * median(af), 3),
                                p90_pct=round(100 * pct(af, .90), 3), max_pct=round(100 * max(af), 3),
                                n_over_10pct=int(sum(1 for a in af if a > 0.10)))
    lags = [r["texture_lag_px"] * 8 for r in rows if r["texture_lag_px"] > 0]
    stats["texture_pitch_px1920"] = dict(n=len(lags), median=median(lags),
                                         p25=pct(lags, .25), p75=pct(lags, .75),
                                         mode=collections.Counter(lags).most_common(5))
    ins = [r["border_inset"] for r in rows if r["has_border"]]
    stats["border_inset"] = dict(n=len(ins), median=median(ins), p25=pct(ins, .25), p75=pct(ins, .75))
    stats["type_position"] = dict(
        median_y0_frac=round(median([r["type_y0"] / r["frame_h"] for r in rows]), 3),
        typography_y0_frac=round(median([r["type_y0"] / r["frame_h"] for r in ty]), 3),
        shotcraft_y0_frac=round(median([r["type_y0"] / r["frame_h"] for r in sc]), 3))
    stats["type_cov"] = dict(median=round(median([r["type_cov"] for r in rows]), 4))
    stats["lines"] = dict(counter=dict(collections.Counter(r["line_count"] for r in rows).most_common(8)),
                          median=median([r["line_count"] for r in rows]))
    stats["bg_frac_by_kind"] = dict(
        typography=round(median([r["bg_frac"] for r in ty]), 3),
        shotcraft=round(median([r["bg_frac"] for r in sc]), 3))
    stats["contrast_by_kind"] = dict(
        typography=round(median([r["contrast"] for r in ty]), 2),
        shotcraft=round(median([r["contrast"] for r in sc]), 2))

    json.dump(stats, open(os.path.join(OUT, "stats.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in stats.items()
                      if k not in ("typography_titles", "shotcraft_categories",
                                   "typography_archetypes", "accent_hues")},
                     ensure_ascii=False, indent=1)[:6000])


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
