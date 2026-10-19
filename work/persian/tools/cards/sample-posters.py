#!/usr/bin/env python
"""Step 3a (v2): sample every library poster still and classify its visualStyle,
then join it to a card slug via an exact-slug map built from card sources.

Rule (documented in the report):
  - mean luminance of the whole frame + the 4 corner patches.
  - corner luminance spread > 0.18 -> "gradient"  (frame is not one flat tone)
  - mean luminance <= 0.30         -> "dark"
  - mean luminance >= 0.70         -> "light"
  - otherwise                      -> "neutral"
"""
import json, os, re, sys
from PIL import Image

REPO = r"D:\P\project\persianArts"
OUT = os.path.join(REPO, "work", "persian", "tools", "cards", "poster-samples.json")

def lum(rgb):
    r, g, b = rgb[:3]
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255.0

def classify(mean, corners):
    spread = max(corners) - min(corners)
    if spread > 0.18:
        return "gradient"
    if mean <= 0.30:
        return "dark"
    if mean >= 0.70:
        return "light"
    return "neutral"

# --- slug map -----------------------------------------------------------------
cards = json.load(open(os.path.join(REPO, "work", "persian", "tools", "cards", "cards.extract.json"), encoding="utf-8"))
slug_by_norm = {}
for c in cards:
    stem = c["id"][5:] if c["id"].startswith("demo-") else c["id"]
    norm = re.sub(r"[^a-z0-9]", "", stem.lower())
    src = c.get("source", "")
    slug_by_norm.setdefault(norm, []).append({"id": c["id"], "slug": stem.lower(), "source": src})

# --- posters ------------------------------------------------------------------
def posters():
    for base, dirs, files in os.walk(os.path.join(REPO, "library", "media")):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        if "poster.webp" in files:
            yield os.path.join(base, "poster.webp")

out = {}
matched = 0
unmatched = []
for p in sorted(posters()):
    try:
        im = Image.open(p).convert("RGB")
    except Exception as e:
        print("skip", p, e, file=sys.stderr)
        continue
    im.thumbnail((64, 64))
    px = list(im.getdata())
    mean = sum(lum(c) for c in px) / len(px)
    w, h = im.size
    k = max(1, min(w, h) // 6)
    def patch(x0, y0):
        vals = [lum(im.getpixel((x, y))) for y in range(y0, min(y0 + k, h)) for x in range(x0, min(x0 + k, w))]
        return sum(vals) / len(vals)
    corners = [patch(0, 0), patch(w - k, 0), patch(0, h - k), patch(w - k, h - k)]
    style = classify(mean, corners)
    rel = os.path.relpath(p, REPO).replace("\\", "/")
    poster_slug = os.path.basename(os.path.dirname(p)).lower()
    norm = re.sub(r"[^a-z0-9]", "", poster_slug)
    entry = {"style": style, "meanLum": round(mean, 4), "cornerLum": [round(c, 4) for c in corners], "file": rel, "posterSlug": poster_slug}
    if norm in slug_by_norm:
        entry["cardIds"] = [x["id"] for x in slug_by_norm[norm]]
        matched += 1
    else:
        unmatched.append(poster_slug)
    out[rel] = entry

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print(f"sampled {len(out)} posters, exact-slug matched to a card: {matched}")
print("styles:", {s: sum(1 for v in out.values() if v['style'] == s) for s in ('dark','light','gradient','neutral')})
print("first 12 unmatched poster slugs:", unmatched[:12])
