"""Cross-source duplicate check by sha1 and a keyword scan for filenames that look misfiled (report only)."""
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path

REPO = Path(r"D:\P\project\persianArts")
SFX = REPO / "sound" / "library" / "sfx"
cat = json.loads((SFX / "CATALOG.json").read_text(encoding="utf-8"))

def sha1(p):
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(1 << 20), b""):
            h.update(c)
    return h.hexdigest()

groups = defaultdict(list)
for e in cat["entries"]:
    groups[sha1(REPO / e["path"])].append(e["id"])
dups = [v for v in groups.values() if len(v) > 1]

# keyword -> category it belongs to (filename match)
KW = {
    "click": "click", "tick": "tick-clock", "typ": "typing", "slide": "slide", "whoosh": "whoosh", "swoosh": "whoosh",
    "pop": "pop", "bubble": "bubble", "pencil": "paper-pencil", "paper": "paper-pencil", "page": "paper-pencil",
    "stamp": "impact", "thud": "impact", "riser": "riser", "downlift": "downlifter", "ding": "ding-chime",
    "chime": "ding-chime", "bell": "ding-chime", "success": "success", "fail": "fail", "boing": "boing-cartoon",
    "glitch": "glitch", "camera": "camera-shutter", "shutter": "camera-shutter", "sparkle": "sparkle-magic",
    "magic": "sparkle-magic", "ambience": "ambience", "stinger": "stinger",
}
doubts = []
for e in cat["entries"]:
    if e["source"] not in ("kenney", "freesound"):
        continue
    name = Path(e["path"]).name.lower()
    hits = {v for k, v in KW.items() if k in name}
    hits.discard(e["category"])
    if hits:
        doubts.append({"id": e["id"], "category": e["category"], "name_suggests": sorted(hits)})

out = {"cross_source_duplicate_groups": dups, "name_vs_category_doubts": doubts[:200],
       "name_vs_category_doubt_total": len(doubts)}
(REPO / "media" / "sfx" / "_import" / "dupes_misfile.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
print("dup groups", len(dups), "doubts", len(doubts))
for d in doubts[:12]:
    print(d)
