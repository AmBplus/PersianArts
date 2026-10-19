"""Import the owner's songpack SFX into sound/library/sfx/owner-pack/<category>/.

Read-only on the source. Copies (never moves). Writes manifest.json and summary.json.
Run with: python -I import_owner.py
"""
import concurrent.futures as cf
import hashlib
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

SRC = Path(r"C:\Users\Amir\Desktop\New folder (4)")
REPO = Path(r"D:\P\project\persianArts")
DEST = REPO / "sound" / "library" / "sfx" / "owner-pack"
WORK = REPO / "media" / "sfx" / "_import"
AUDIO = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aiff", ".aif"}

# (songpack folder, filename regex, taxonomy category, doubt)
RULES = [
    ("abstract", r"^bell-reverse", "riser", False),
    ("abstract", r"^(crash-with-glass|glass-|window-crack)", "impact", False),
    ("abstract", r"^(dark-scary-drone|freeze-|ice-crackling|rain-|tv-noise|radio-snow)", "ambience", False),
    ("abstract", r"^(tv-off|radio-station-search|record-scratch|record-mix|tone-cross|weird-noise|heartbeat|liquid|water-|guitar-amp|hot-sizzle|sizzle)", "misc", True),
    ("abstract", r"^distortion-squiggly", "glitch", True),
    ("abstract", r"^guitar-hit", "impact", True),
    ("abstract", r"^magic-zing", "sparkle-magic", False),
    ("abstract", r"^paper-(crumble|rip|tear|turn)", "paper-pencil", False),
    ("abstract", r"^paper-shifting", "slide", False),
    ("abstract", r"^(reverse-|rocky-build-up)", "riser", True),
    ("abstract", r"^slice", "whoosh", False),
    ("abstract", r"^(smashed|wet-splat)", "impact", False),
    ("calligraphy", r"^(calligraphy-stroke|writing-|nib-bite)", "paper-pencil", False),
    ("camera", r".*", "camera-shutter", False),
    ("cinematic", r".*", "stinger", True),
    ("digital", r".*", "misc", True),
    ("door", r".*", "impact", True),
    ("heartbeat", r".*", "misc", False),
    ("single-note", r".*", "ding-chime", True),
    ("slide", r".*", "slide", False),
    ("type", r".*", "typing", False),
    ("typewriter-antique", r"^bell", "ding-chime", False),
    ("typewriter-antique", r"^click", "typing", False),
    ("typewriter-antique", r"^paper-", "paper-pencil", False),
    ("typewriter-antique", r"^switch", "click", True),
    ("typewriter-antique", r"^type-with-return", "typing", False),
    ("typewriter-antique", r"^typewriter-drop", "impact", False),
    ("typewriter", r"^(backspace|click|random-click|random-.*sentence|return|shift|spacebar|type-with-return)", "typing", False),
    ("typewriter", r"^end-bell-(solo|tab)", "ding-chime", False),
    ("typewriter", r"^end-bell-clicks", "typing", False),
    ("typewriter", r"^page-", "paper-pencil", False),
    ("woosh", r".*", "whoosh", False),
]


def sha1(p: Path) -> str:
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def probe_duration(p: Path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(p)], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=120)
    try:
        return round(float(r.stdout.strip().splitlines()[0]), 3)
    except (ValueError, IndexError):
        return None


def probe_peak(p: Path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(p), "-af", "volumedetect",
                        "-f", "null", "-"], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=300)
    m = re.search(r"max_volume: (-?[\d.]+) dB", r.stderr)
    return float(m.group(1)) if m else None


def classify(folder: str, name: str):
    for f, rx, cat, doubt in RULES:
        if f == folder and re.search(rx, name, re.I):
            return cat, doubt
    return "misc", True


def safe(name: str) -> str:
    return re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name)


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    all_files = [p for p in SRC.rglob("*") if p.is_file()]
    sfx_files, excluded = [], []
    for p in all_files:
        rel = p.relative_to(SRC)
        if rel.parts[0] != "songpack" or p.suffix.lower() not in AUDIO:
            excluded.append({"path": str(rel), "bytes": p.stat().st_size,
                             "reason": "outside songpack (music/BGM, not SFX)" if p.suffix.lower() in AUDIO else "not audio"})
        else:
            sfx_files.append(rel)

    with cf.ThreadPoolExecutor(8) as ex:
        hashes = dict(zip(sfx_files, ex.map(lambda r: sha1(SRC / r), sfx_files)))

    plan, planned_by_hash, dup_pairs = [], {}, []
    used = set()
    for rel in sorted(sfx_files):
        folder = rel.parts[1]
        cat, doubt = classify(folder, rel.name)
        name = safe(rel.name)
        h = hashes[rel]
        if h in planned_by_hash:
            dup_pairs.append({"path": str(rel), "duplicate_of": planned_by_hash[h]})
            continue
        key = f"{cat}/{name}"
        if key in used:
            name = safe(f"{folder}_{rel.name}")
            key = f"{cat}/{name}"
        used.add(key)
        planned_by_hash[h] = key
        plan.append({"rel": rel, "cat": cat, "doubt": doubt, "name": name, "key": key, "sha1": h})

    def work(item):
        src = SRC / item["rel"]
        dst_dir = DEST / item["cat"]
        dst_dir.mkdir(parents=True, exist_ok=True)
        dst = dst_dir / item["name"]
        shutil.copy2(src, dst)
        dur = probe_duration(dst)
        pk = probe_peak(dst)
        flags = []
        if dur is not None and dur > 15:
            flags.append("over_15s")
        if item["doubt"]:
            flags.append("category_doubt")
        return {
            "key": item["key"], "category": item["cat"], "file": item["name"],
            "original_relpath": str(item["rel"]).replace("\\", "/"), "sha1": item["sha1"],
            "bytes": src.stat().st_size, "duration_s": dur, "peak_dbfs": pk, "flags": flags,
        }

    with cf.ThreadPoolExecutor(8) as ex:
        results = list(ex.map(work, plan))

    files = {r["key"]: {k: v for k, v in r.items() if k != "key"} for r in sorted(results, key=lambda r: r["key"])}
    counts = {}
    for r in results:
        counts[r["category"]] = counts.get(r["category"], 0) + 1
    manifest = {
        "schema": "persianarts.sfx_manifest/1",
        "source": "owner-pack",
        "source_folder": "owner's local folder 'New folder (4)' (read-only, copied not moved)",
        "generatedOn": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "note": "key = category/filename under sound/library/sfx/owner-pack/. Non-SFX root music tracks are listed in excluded_non_sfx and were not imported.",
        "count": len(files),
        "total_bytes": sum(r["bytes"] for r in results),
        "category_counts": dict(sorted(counts.items())),
        "duplicates_within_source": dup_pairs,
        "excluded_non_sfx": excluded,
        "files": files,
    }
    (DEST / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    summary = {
        "source_total_files": len(all_files),
        "source_total_bytes": sum(p.stat().st_size for p in all_files),
        "source_formats": {},
        "sfx_imported": len(files),
        "excluded": len(excluded),
        "excluded_bytes": sum(e["bytes"] for e in excluded),
        "duplicates": dup_pairs,
        "over_15s": [k for k, v in files.items() if "over_15s" in v["flags"]],
        "doubts": [k for k, v in files.items() if "category_doubt" in v["flags"]],
        "category_counts": manifest["category_counts"],
    }
    for p in all_files:
        ext = p.suffix.lower()
        summary["source_formats"][ext] = summary["source_formats"].get(ext, 0) + 1
    (WORK / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({k: v for k, v in summary.items() if k not in ("doubts",)}, ensure_ascii=False)[:3000])
    print("doubt count", len(summary["doubts"]))


if __name__ == "__main__":
    main()
