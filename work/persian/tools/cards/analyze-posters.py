#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
analyze-posters.py — measure the PersianArts visual library into a design system.

READ-ONLY over library/**. Writes JSON + CSV only where told.

Measurements per poster (960x540 webp posters):
  * 5-colour median-cut palette (hex)
  * mean luminance (Rec.709) + luminance histogram spread (std, p10/p50/p90, IQR)
  * dominant background colour, its hex, its frame share
  * background-vs-foreground WCAG contrast ratio
  * type block: height of the largest text band as a fraction of frame height,
    line count inside the band, per-line height -> est_font_px at 1080p
  * devices: dot-grid/periodic texture (FFT peak ratio in background),
    single saturated accent hue (HSV), panel corner radius (px),
    glow/bloom halo (radial falloff), border/stroke (long straight edges)

Usage:
  python analyze-posters.py --out work/persian/tools/cards/out
"""
import os, sys, json, csv, math, argparse, time

import numpy as np
from PIL import Image

REPO = r"D:\P\project\persianArts"
LIB = os.path.join(REPO, "library", "media")

# ----------------------------------------------------------------- discovery

def discover():
    items = []
    ty = os.path.join(LIB, "typography")
    for d in sorted(os.listdir(ty)):
        p = os.path.join(ty, d, "poster.webp")
        if os.path.exists(p):
            meta = {}
            mp = os.path.join(ty, d, "meta.json")
            if os.path.exists(mp):
                try:
                    meta = json.load(open(mp, encoding="utf-8"))
                except Exception:
                    meta = {}
            items.append(dict(kind="typography", category=meta.get("archetype", ""),
                              technique=d, title_fa=meta.get("titleFa", ""),
                              model_id=meta.get("modelId", ""), seed=meta.get("seed", ""),
                              line1=meta.get("line1", ""), path=p))
    sc = os.path.join(LIB, "reference", "shotcraft")
    for c in sorted(os.listdir(sc)):
        cp = os.path.join(sc, c)
        if not os.path.isdir(cp):
            continue
        for t in sorted(os.listdir(cp)):
            p = os.path.join(cp, t, "poster.webp")
            if os.path.exists(p):
                items.append(dict(kind="shotcraft", category=c, technique=t,
                                  title_fa="", model_id="", seed="", line1="", path=p))
    return items

# ------------------------------------------------------------------- colours

def median_cut(px, k=5):
    """px: N x 3 float array in [0,1]. Returns list of (mean_rgb, npix)."""
    boxes = [px]
    while len(boxes) < k:
        best_i, bestscore = -1, -1.0
        for bi, b in enumerate(boxes):
            if len(b) < 2:
                continue
            rng = b.max(0) - b.min(0)
            score = float(rng.max()) * math.log2(len(b) + 1)
            if score > bestscore:
                bestscore, best_i = score, bi
        if best_i < 0:
            break
        best = boxes[best_i]
        ch = int(np.argmax(best.max(0) - best.min(0)))
        b = best[np.argsort(best[:, ch])]
        m = len(b) // 2
        if m == 0:
            break
        boxes[best_i] = b[:m]
        boxes.append(b[m:])
    out = [(b.mean(0), len(b)) for b in boxes if len(b)]
    out.sort(key=lambda t: -t[1])
    return out


def hex_of(rgb):
    return "#%02X%02X%02X" % tuple(int(round(max(0.0, min(1.0, c)) * 255)) for c in rgb)


def lum709(rgb):
    """rgb: (...,3) in 0..1 -> Rec.709 relative luminance."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(l1, l2):
    a, b = max(l1, l2), min(l1, l2)
    return (a + 0.05) / (b + 0.05)


def dominant_colour(px, step=24):
    """Coarse mode of the pixel cloud, refined by averaging pixels in the bin."""
    q = np.clip((px * step).astype(np.int32), 0, step - 1)
    key = q[:, 0] * step * step + q[:, 1] * step + q[:, 2]
    vals, counts = np.unique(key, return_counts=True)
    top = vals[np.argmax(counts)]
    sel = key == top
    mean = px[sel].mean(0)
    return mean, float(counts.max()) / len(px)

# --------------------------------------------------------------- ink / type

def box_profile(a, win):
    """Centred moving average along axis 0 of 1-D array `a`."""
    if win <= 1:
        return a
    k = np.ones(win) / win
    return np.convolve(a, k, mode="same")


def line_pitch(prof):
    """Dominant line pitch (px) from a row-ink profile; 0 if not periodic."""
    n = len(prof)
    if n < 12:
        return 0.0, 0
    a = prof - prof.mean()
    if np.abs(a).sum() < 1e-9:
        return 0.0, 0
    F = np.fft.rfft(a, 4 * n)
    ac = np.fft.irfft(F * np.conj(F))[:n]
    if ac[0] <= 0:
        return 0.0, 0
    ac = ac / ac[0]
    lo, hi = 6, min(160, n - 2)
    if hi <= lo:
        return 0.0, 0
    best, k = -1.0, 0
    for i in range(lo, hi):
        if ac[i] > ac[i - 1] and ac[i] >= ac[i + 1] and ac[i] > best:
            best, k = ac[i], i
    if k == 0 or best < 0.22:
        return 0.0, 0
    return float(k), int(round(n / float(k)))


def type_block(ink):
    """ink: HxW bool. Returns (band_h, line_count, y0, y1, coverage, pitch)."""
    h, w = ink.shape
    rows = ink.mean(1)
    if rows.max() <= 0:
        return 0, 0, 0, 0, 0.0, 0.0
    sm = box_profile(rows, max(3, int(round(h * 0.012)) | 1))
    thr = max(0.03, 0.15 * sm.max())
    on = sm >= thr
    # contiguous runs, merging gaps shorter than a line gap
    idx = np.flatnonzero(on)
    if len(idx) == 0:
        return 0, 0, 0, 0, 0.0, 0.0
    gap_max = int(round(h * 0.05))
    runs = []
    s, prev = idx[0], idx[0]
    for i in idx[1:]:
        if i - prev <= gap_max:
            prev = i
        else:
            runs.append((s, prev))
            s = prev = i
    runs.append((s, prev))
    cand = [(b - a, float(sm[a:b + 1].max()), float(sm[a:b + 1].sum()), a, b) for a, b in runs]
    solid = [c for c in cand if c[1] >= 0.10]
    pick = max(solid, key=lambda c: (c[0], c[2])) if solid else max(cand, key=lambda c: c[2])
    _, _, _, y0, y1 = pick
    band = ink[y0:y1 + 1]
    prof = band.mean(1)
    pitch, lines_fft = line_pitch(prof)
    if pitch > 0 and lines_fft >= 2:
        lines = lines_fft
    else:
        # run-based count; merge dips shorter than 2% of the frame (diacritic gaps)
        rows2 = box_profile(prof, 3)
        if rows2.max() <= 0:
            lines = 1
        else:
            thr2 = max(0.05, 0.30 * rows2.max())
            on2 = rows2 >= thr2
            idx2 = np.flatnonzero(on2)
            r2 = []
            if len(idx2):
                s2, prev2 = idx2[0], idx2[0]
                for i in idx2[1:]:
                    if i - prev2 <= max(2, int(round(h * 0.02))):
                        prev2 = i
                    else:
                        r2.append((s2, prev2))
                        s2 = prev2 = i
                r2.append((s2, prev2))
            r2 = [q for q in r2 if q[1] - q[0] + 1 >= max(2, int(round(h * 0.004)))]
            lines = max(1, len(r2))
        pitch = (y1 - y0 + 1) / float(max(1, lines))
    lines = max(1, lines)
    band_h = y1 - y0 + 1
    cov = float(band.sum()) / band.size
    return band_h, lines, int(y0), int(y1), cov, float(pitch)

# ------------------------------------------------------------------ devices

def texture_periodicity(gray, bg_mask):
    """Regular-texture score = strongest normalised autocorrelation peak (lag 5..45)
    of the high-passed background region, averaged over the x and y profiles."""
    h, w = gray.shape
    k = 5
    pad = np.pad(gray, k // 2, mode="edge")
    acc = np.zeros_like(gray)
    for dy in range(k):
        for dx in range(k):
            acc += pad[dy:dy + h, dx:dx + w]
    hp = (gray - acc / (k * k)) * bg_mask
    if bg_mask.sum() < 0.10 * h * w:
        return 0.0, 0.0, 0
    scores = []
    lags = []
    for axis in (0, 1):                       # rows (y) then columns (x)
        prof = hp.mean(axis=axis)
        a = prof - prof.mean()
        if np.abs(a).sum() < 1e-9:
            continue
        F = np.fft.rfft(a, 4096)
        ac = np.fft.irfft(F * np.conj(F))[:len(a)]
        if ac[0] <= 0:
            continue
        ac = ac / ac[0]
        hi = min(45, len(ac) - 1)
        if hi <= 5:
            continue
        seg = ac[5:hi]
        m = float(seg.max())
        scores.append(m)
        lags.append(5 + int(np.argmax(seg)))
    if not scores:
        return 0.0, 0.0, 0
    per = max(scores)
    lag = lags[int(np.argmax(scores))]
    return per, per, lag


def accent_hue(px):
    """Returns (has_accent, accent_hex, pixel_fraction, hue_concentration)."""
    r, g, b = px[:, 0], px[:, 1], px[:, 2]
    mx = px.max(1)
    mn = px.min(1)
    v = mx
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0.0)
    sel = (s >= 0.45) & (v >= 0.35)
    frac = float(sel.sum()) / len(px)
    if sel.sum() < 50:
        return False, "", frac, 0.0
    rr, gg, bb = r[sel], g[sel], b[sel]
    mx2, mn2 = mx[sel], mn[sel]
    d = np.maximum(mx2 - mn2, 1e-6)
    hue = np.zeros_like(rr)
    i = (mx2 == rr)
    hue[i] = ((gg[i] - bb[i]) / d[i]) % 6
    i = (mx2 == gg) & (mx2 != rr)
    hue[i] = (bb[i] - rr[i]) / d[i] + 2
    i = (mx2 == bb) & (mx2 != rr) & (mx2 != gg)
    hue[i] = (rr[i] - gg[i]) / d[i] + 4
    hue = (hue * 60.0) % 360.0
    hist, edges = np.histogram(hue, bins=24, range=(0, 360))
    k = int(np.argmax(hist))
    lo, hi = edges[k], edges[k + 1]
    # widen: include the two neighbouring sectors for a "family"
    fam = ((hue >= lo - 15) & (hue <= hi + 15)) | ((hue >= lo - 15 + 360) & (hue <= hi + 15 + 360))
    conc = float(hist[max(0, k - 1):k + 2].sum()) / float(len(hue))
    m = fam & (hue < 360)
    if m.sum() < 30:
        m = (hue >= lo) & (hue <= hi)
    if m.sum() < 1:
        return False, "", frac, conc
    acc_rgb = px[sel][m].mean(0)
    has = (frac >= 0.0025) and (conc >= 0.45)
    return bool(has), hex_of(acc_rgb), frac, conc


def _largest_component(mask, block=8):
    """Coarse connected-component pass (8x8 blocks) -> refined pixel bbox + count."""
    h, w = mask.shape
    bh, bw = h // block, w // block
    if bh < 2 or bw < 2:
        return None
    grid = np.zeros((bh, bw), dtype=bool)
    for i in range(bh):
        for j in range(bw):
            grid[i, j] = mask[i * block:(i + 1) * block, j * block:(j + 1) * block].mean() > 0.5
    seen = np.zeros_like(grid)
    best = None
    for i0 in range(bh):
        for j0 in range(bw):
            if not grid[i0, j0] or seen[i0, j0]:
                continue
            stack = [(i0, j0)]
            seen[i0, j0] = True
            comp = []
            while stack:
                i, j = stack.pop()
                comp.append((i, j))
                for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    a, b = i + di, j + dj
                    if 0 <= a < bh and 0 <= b < bw and grid[a, b] and not seen[a, b]:
                        seen[a, b] = True
                        stack.append((a, b))
            if best is None or len(comp) > len(best):
                best = comp
    if not best:
        return None
    ys = [c[0] for c in best]
    xs = [c[1] for c in best]
    y0, y1 = min(ys) * block, (max(ys) + 1) * block - 1
    x0, x1 = min(xs) * block, (max(xs) + 1) * block - 1
    y1 = min(y1, h - 1)
    x1 = min(x1, w - 1)
    sub = mask[y0:y1 + 1, x0:x1 + 1]
    return y0, y1, x0, x1, int(sub.sum()), sub


def panel_radius(full, bg_rgb):
    """Largest smooth non-background blob -> bbox -> corner-radius estimate (px @1920x1080).

    Rounded cards/pills leave background colour at their bbox corners; walking the bbox
    diagonals until the blob is reached gives the corner radius in pixels.
    """
    arr = full[::2, ::2]                                  # 960x540 working copy
    h, w = arr.shape[:2]
    d_bg = np.linalg.norm(arr - bg_rgb.reshape(1, 1, 3), axis=2)
    nonbg = d_bg > 0.10
    lum = lum709(arr)
    k = 5
    pad = np.pad(lum, k // 2, mode="edge")
    acc = np.zeros_like(lum)
    for dy in range(k):
        for dx in range(k):
            acc += pad[dy:dy + h, dx:dx + w]
    dev = np.abs(lum - acc / (k * k))
    pad2 = np.pad(dev, k // 2, mode="edge")
    acc2 = np.zeros_like(dev)
    for dy in range(k):
        for dx in range(k):
            acc2 += pad2[dy:dy + h, dx:dx + w]
    smooth = (acc2 / (k * k)) < 0.012
    panel = nonbg & smooth
    if panel.sum() < 0.004 * h * w:
        return 0, "", 0.0
    comp = _largest_component(panel, 8)
    if comp is None:
        return 0, "", 0.0
    y0, y1, x0, x1, npx, sub = comp
    bh, bw = y1 - y0 + 1, x1 - x0 + 1
    if npx < 0.003 * h * w or bh < 0.05 * h or bw < 0.05 * w:
        return 0, "", 0.0
    lim = int(min(50, bh // 2, bw // 2))
    if lim < 3:
        return 0, "", 0.0
    rads = []
    for (cy, cx, dy, dx) in ((0, 0, 1, 1), (0, bw - 1, 1, -1),
                             (bh - 1, 0, -1, 1), (bh - 1, bw - 1, -1, -1)):
        hit = lim
        for s in range(lim):
            if sub[cy + dy * s, cx + dx * s]:
                hit = s
                break
        rads.append(hit)
    rads.sort()
    if rads[3] > lim - 1:
        return 0, "", 0.0                                 # no corner cut: not a rounded rect
    r_est = float(np.median(rads)) * 2.0                  # back to 1920x1080 pixels
    panel_rgb = arr[y0:y1 + 1, x0:x1 + 1][sub].mean(0)
    return int(round(r_est)), hex_of(panel_rgb), float(np.mean(rads) / max(1, min(bh, bw)))


def glow(gray, ink, bg_lum):
    h, w = gray.shape
    thr = np.percentile(gray, 99.5)
    br = gray >= thr
    if br.sum() < 8:
        return False, 0.0, 0.0
    ys, xs = np.nonzero(br)
    cy, cx = ys.mean(), xs.mean()
    R = max(3.0, math.sqrt(br.sum() / math.pi))
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((yy - cy) ** 2 + (xx - cx) ** 2)
    def ring(a, b):
        m = (d >= a * R) & (d < b * R)
        return m
    m1, m2 = ring(1.3, 1.9), ring(2.6, 3.6)
    if m1.sum() < 20 or m2.sum() < 20:
        return False, 0.0, 0.0
    r1 = float(gray[m1].mean())
    r2 = float(gray[m2].mean())
    # smoothness of the halo: local high-pass energy inside ring1
    k = 5
    pad = np.pad(gray, k // 2, mode="edge")
    acc = np.zeros_like(gray)
    for dy in range(k):
        for dx in range(k):
            acc += pad[dy:dy + h, dx:dx + w]
    hp = gray - acc / (k * k)
    hp_std = float(hp[m1].std())
    if r1 <= bg_lum + 0.05:
        return False, 0.0, hp_std
    ratio = (r2 - bg_lum) / max(1e-6, (r1 - bg_lum))
    smooth = hp_std <= 0.09
    has = bool(r1 >= bg_lum + 0.06 and ratio >= 0.30 and smooth)
    return has, float(ratio), hp_std


def borders(gray, thr=0.05, cover=0.60):
    """Long straight rules: a horizontal line lights up the *vertical* gradient across
    the whole row, and vice versa. Returns (#line rows, #line cols, flag, inset frac)."""
    gx = np.abs(np.diff(gray, axis=1))          # horizontal gradient (W-1 columns)
    gy = np.abs(np.diff(gray, axis=0))          # vertical gradient   (H-1 rows)
    hline = (gy > thr).mean(1)                  # per row index: coverage of a horiz. edge
    vline = (gx > thr).mean(0)                  # per col index: coverage of a vert. edge
    ridx = np.flatnonzero(hline > cover)
    cidx = np.flatnonzero(vline > cover)
    inset = 0.0
    if len(ridx) and len(cidx):
        inset = float(round(((ridx.mean() / gray.shape[0]) + (cidx.mean() / gray.shape[1])) / 2, 3))
    return int(len(ridx)), int(len(cidx)), bool(len(ridx) >= 2 and len(cidx) >= 2), inset

# -------------------------------------------------------------------- measure

def measure(item):
    im = Image.open(item["path"]).convert("RGB")
    W, H = im.size
    full = np.asarray(im).astype(np.float32) / 255.0
    small = np.asarray(im.resize((240, 135), Image.BILINEAR)).astype(np.float32) / 255.0
    px_small = small.reshape(-1, 3)

    lum_full = lum709(full)
    mean_lum = float(lum_full.mean())
    std_lum = float(lum_full.std())
    p10, p50, p90 = (float(np.percentile(lum_full, q)) for q in (10, 50, 90))
    iqr = float(np.percentile(lum_full, 75) - np.percentile(lum_full, 25))

    pal = median_cut(px_small, 5)
    hexes = [hex_of(c) for c, n in pal]
    while len(hexes) < 5:
        hexes.append("")

    bg_rgb, bg_frac = dominant_colour(px_small)
    bg_lum = float(lum709(bg_rgb))
    d = np.linalg.norm(full - bg_rgb.reshape(1, 1, 3), axis=2)
    ink_full = d > 0.28
    ink_small = np.linalg.norm(px_small - bg_rgb.reshape(1, 3), axis=1) > 0.28
    bg_mask_small = (~ink_small).reshape(135, 240)

    # foreground colour = mode of ink pixels
    if ink_full.sum() > 50:
        iq = np.clip((full[ink_full] * 24).astype(np.int32), 0, 23)
        k = iq[:, 0] * 576 + iq[:, 1] * 24 + iq[:, 2]
        vals, counts = np.unique(k, return_counts=True)
        fg_rgb = full[ink_full][k == vals[np.argmax(counts)]].mean(0)
    else:
        fg_rgb = bg_rgb
    fg_lum = float(lum709(fg_rgb))
    contrast = float(contrast_ratio(bg_lum, fg_lum))

    band_h, lines, y0, y1, cov, pitch = type_block(ink_full)
    ratio = band_h / float(H)
    line_h = pitch if pitch > 0 else (band_h / float(lines) if lines else 0.0)
    est_px = line_h / H * 1080.0

    gray_small = lum709(small)
    tex, texv, texlag = texture_periodicity(gray_small, bg_mask_small)
    has_acc, acc_hex, acc_frac, acc_conc = accent_hue(px_small)
    rad_px, panel_hex, rad_rel = panel_radius(full, bg_rgb)
    has_glow, glow_ratio, glow_hpstd = glow(lum_full, ink_full, bg_lum)
    nrows, ncols, has_border, border_inset = borders(lum_full)

    return dict(
        path=os.path.relpath(item["path"], REPO).replace("\\", "/"),
        kind=item["kind"], category=item["category"], technique=item["technique"],
        title_fa=item["title_fa"], model_id=item["model_id"], line1=item["line1"],
        frame_w=W, frame_h=H,
        palette=hexes, palette_n=[int(n) for c, n in pal],
        mean_lum=round(mean_lum, 4), std_lum=round(std_lum, 4),
        p10=round(p10, 4), p50=round(p50, 4), p90=round(p90, 4), iqr=round(iqr, 4),
        bg_hex=hex_of(bg_rgb), bg_lum=round(bg_lum, 4), bg_frac=round(bg_frac, 4),
        fg_hex=hex_of(fg_rgb), fg_lum=round(fg_lum, 4), contrast=round(contrast, 3),
        type_block_h=int(band_h), type_h_ratio=round(ratio, 4), line_count=int(lines),
        line_pitch_px=round(float(pitch), 1),
        est_font_px_1080=round(est_px, 1), type_cov=round(cov, 4),
        type_y0=int(y0), type_y1=int(y1),
        dotgrid_score=round(tex, 3), has_dotgrid=bool(tex >= 0.30),
        texture_lag_px=texlag,
        has_accent=has_acc, accent_hex=acc_hex,
        accent_frac=round(acc_frac, 5), accent_conc=round(acc_conc, 3),
        radius_px=int(rad_px), has_radius=bool(rad_px >= 4), panel_hex=panel_hex,
        has_glow=has_glow, glow_ratio=round(glow_ratio, 3), glow_hp_std=round(glow_hpstd, 4),
        border_rows=nrows, border_cols=ncols, has_border=has_border, border_inset=border_inset,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(REPO, "work", "persian", "tools", "cards", "out"))
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    items = discover()
    if args.limit:
        items = items[:args.limit]
    print("posters:", len(items))
    rows, t0 = [], time.time()
    for i, it in enumerate(items, 1):
        try:
            r = measure(it)
        except Exception as e:
            import traceback
            print("FAIL", it["path"], repr(e))
            if os.environ.get("VERBOSE"):
                traceback.print_exc()
            continue
        rows.append(r)
        if i % 25 == 0:
            print("  %d/%d  %.1fs" % (i, len(items), time.time() - t0), flush=True)
    out = os.path.join(args.out, "posters.json")
    json.dump(rows, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("wrote", out, len(rows), "rows in %.1fs" % (time.time() - t0))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
