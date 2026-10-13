import json, sys
sys.stdout.reconfigure(encoding="utf-8")
BANDS = [(70, 90), (90, 110), (110, 124), (124, 140)]
IDX = "sound/library/kit/music/INDEX.json"
def band(b):
    for lo, hi in BANDS:
        if lo <= b < hi: return f"{lo}-{hi}"
    return "other"
tracks = json.load(open(IDX, encoding="utf-8"))["tracks"]
rows = {}
for t in tracks:
    b = band(t["bpm"])
    for tag in t["mood_tags"] or ["untagged"]:
        rows.setdefault(tag, {}); rows[tag][b] = rows[tag].get(b, 0) + 1
cols = [f"{lo}-{hi}" for lo, hi in BANDS] + ["other"]
print("mood".ljust(14) + "".join(c.ljust(10) for c in cols))
for m in sorted(rows):
    print(m.ljust(14) + "".join(str(rows[m].get(c, 0)).ljust(10) for c in cols))
print("total tracks:", len(tracks))
