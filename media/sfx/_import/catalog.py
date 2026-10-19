"""Build sound/library/sfx/CATALOG.json and CATALOG.md over kenney, freesound, anidoodle, owner-pack.

Read-only on audio. Peak via ffmpeg volumedetect, duration via ffprobe. LUFS not computed (not cheap enough for the time box).
Run with: python -I catalog.py
"""
import concurrent.futures as cf
import json
import re
import subprocess
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(r"D:\P\project\persianArts")
SFX = REPO / "sound" / "library" / "sfx"
AUDIO = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aiff", ".aif"}

# raw folder name -> taxonomy category (kenney & freesound use these folder names)
FOLDER_MAP = {"ding": "ding-chime", "boing": "boing-cartoon"}
SOURCES = ["kenney", "freesound", "anidoodle", "owner-pack"]

KEY_CATS = {
    "slide": ["slide"],
    "typing": ["typing"],
    "paper-pencil": ["paper-pencil"],
    "whoosh": ["whoosh"],
    "pop": ["pop"],
    "click": ["click"],
    "ding-chime": ["ding-chime"],
    "stamp-thud": ["stamp-thud", "impact"],
    "riser": ["riser"],
}


def probe_duration(p: Path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
    try:
        return round(float(r.stdout.strip().splitlines()[0]), 3)
    except (ValueError, IndexError):
        return None


def probe_peak(p: Path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(p), "-af", "volumedetect", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=300)
    m = re.search(r"max_volume: (-?[\d.]+) dB", r.stderr or "")
    return float(m.group(1)) if m else None


def collect():
    items = []
    for src in SOURCES:
        base = SFX / src
        for p in base.rglob("*"):
            if not p.is_file() or p.suffix.lower() not in AUDIO:
                continue
            rel = p.relative_to(base)
            if len(rel.parts) < 2:
                continue
            folder = rel.parts[0]
            cat = FOLDER_MAP.get(folder, folder)
            items.append({"source": src, "path_abs": p, "rel": str(rel).replace("\\", "/"), "category": cat,
                          "raw_folder": folder})
    return items


def measure(it):
    p = it["path_abs"]
    it["duration_s"] = probe_duration(p)
    it["peak_dbfs"] = probe_peak(p)
    return it


def usable(it):
    d, pk = it.get("duration_s"), it.get("peak_dbfs")
    return d is not None and 0.2 <= d <= 8 and pk is not None and pk >= -12


def main():
    items = collect()
    with cf.ThreadPoolExecutor(8) as ex:
        items = list(ex.map(measure, items))

    catalog = []
    for it in sorted(items, key=lambda x: (x["source"], x["category"], x["rel"])):
        rel = it["rel"]
        entry = {
            "id": f"{it['source']}:{rel}",
            "path": f"sound/library/sfx/{it['source']}/{rel}",
            "source": it["source"],
            "category": it["category"],
            "raw_folder": it["raw_folder"],
            "duration_s": it["duration_s"],
            "peak_dbfs": it["peak_dbfs"],
            "usable": usable(it),
        }
        if it["source"] == "anidoodle":
            entry["preview_only"] = True
        if it["source"] == "owner-pack":
            entry["flags"] = []
        catalog.append(entry)

    # owner-pack flags from its manifest
    man = json.loads((SFX / "owner-pack" / "manifest.json").read_text(encoding="utf-8"))
    for e in catalog:
        if e["source"] == "owner-pack":
            key = e["path"].split("owner-pack/", 1)[1]
            meta = man["files"].get(key, {})
            e["flags"] = meta.get("flags", [])
            e["original_relpath"] = meta.get("original_relpath")

    counts = defaultdict(lambda: defaultdict(int))
    usable_counts = defaultdict(lambda: defaultdict(int))
    for e in catalog:
        counts[e["category"]][e["source"]] += 1
        if e["usable"]:
            usable_counts[e["category"]][e["source"]] += 1

    cats = sorted(counts)
    total_by_cat = {c: sum(counts[c].values()) for c in cats}
    usable_by_cat = {c: sum(usable_counts[c].values()) for c in cats}

    # candidates per key category: usable, sorted by peak (loud, not clipped) then shorter duration
    candidates = {}
    for key, cat_list in KEY_CATS.items():
        pool = [e for e in catalog if e["category"] in cat_list and e["usable"]]
        pool.sort(key=lambda e: (-(e["peak_dbfs"] or -99), e["duration_s"] or 99))
        candidates[key] = pool[:20]

    out = {
        "schema": "persianarts.sfx_catalog/1",
        "generatedOn": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "note": "usable = duration 0.2-8 s and peak >= -12 dBFS. LUFS not computed. preview_only true for anidoodle synthesised clips. taxonomy_category = category field.",
        "count": len(catalog),
        "entries": catalog,
    }
    (SFX / "CATALOG.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

    stats = {
        "total": len(catalog),
        "per_source": {s: sum(1 for e in catalog if e["source"] == s) for s in SOURCES},
        "per_category_total": total_by_cat,
        "per_category_usable": usable_by_cat,
        "counts": {c: dict(counts[c]) for c in cats},
        "usable_counts": {c: dict(usable_counts[c]) for c in cats},
        "owner_over_15s": [e["path"] for e in catalog if "over_15s" in e.get("flags", [])],
    }
    (REPO / "media" / "sfx" / "_import" / "catalog_stats.json").write_text(json.dumps(stats, indent=2, ensure_ascii=False), encoding="utf-8")

    # Markdown
    md = []
    md.append("# sound/library/sfx catalog")
    md.append("")
    md.append(f"Generated {out['generatedOn']}. Machine-readable: `CATALOG.json` ({len(catalog)} entries). Taxonomy: `TAXONOMY.md`.")
    md.append("")
    md.append("usable = duration 0.2-8 s and peak >= -12 dBFS. LUFS not computed. Candidates are picked by level and length only; nothing has been listened to.")
    md.append("")
    md.append("## Counts per category per source (total / usable)")
    md.append("")
    srcs = SOURCES
    md.append("| category | " + " | ".join(srcs) + " | total | usable |")
    md.append("|---|" + "---:|" * (len(srcs) + 2))
    for c in cats:
        row = [str(counts[c].get(s, 0)) for s in srcs]
        md.append(f"| {c} | " + " | ".join(row) + f" | {total_by_cat[c]} | {usable_by_cat[c]} |")
    md.append(f"| **all** | " + " | ".join(str(sum(counts[c].get(s, 0) for c in cats)) for s in srcs) + f" | **{len(catalog)}** | **{sum(usable_by_cat.values())}** |")
    md.append("")
    md.append("## 20 best candidates per key category")
    md.append("")
    md.append("Ranked by peak (highest first, not above -12 dBFS floor) then shorter duration. Within the usable filter.")
    for key, lst in candidates.items():
        md.append("")
        md.append(f"### {key} ({len(lst)} shown)")
        md.append("")
        md.append("| # | id | path | dur s | peak dBFS |")
        md.append("|---:|---|---|---:|---:|")
        for i, e in enumerate(lst, 1):
            md.append(f"| {i} | {e['id']} | `{e['path']}` | {e['duration_s']} | {e['peak_dbfs']} |")
    (SFX / "CATALOG.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"total": len(catalog), "per_source": stats["per_source"], "usable_total": sum(usable_by_cat.values())}))
    for c in cats:
        print(c, dict(counts[c]), "usable", usable_by_cat[c])


if __name__ == "__main__":
    main()
