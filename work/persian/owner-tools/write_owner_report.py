import json, collections
from pathlib import Path
O = Path(__import__("os").environ.get("PA_ROOT") or Path(__file__).resolve().parents[3]) / "media" / "music-staging" / "owner"
rows = json.loads((O.parent / "owner-summary.tmp.json").read_text(encoding="utf-8"))
src = {p.name[:-len(".source.json")]: json.loads(p.read_text(encoding="utf-8")) for p in O.glob("*.source.json")}
sha = collections.defaultdict(list)
for k, v in src.items(): sha[v["sha1"]].append(k)
dups = {k: v for k, v in sha.items() if len(v) > 1}
def mood(n):
    rules = [("px-", "unnamed ID-only file, mood unknown"), ("piano", "gentle solo piano bed"), ("uplifting", "bright, uplifting"),
             ("technology", "tech/corporate underscore"), ("presentation", "corporate presentation bed"),
             ("commercial", "commercial/ad underscore"), ("advertising", "ad/promo underscore"), ("promotion", "promo underscore"),
             ("award", "award-show, celebratory"), ("trailer", "trailer build, big"), ("cinematic", "cinematic, large"),
             ("epic", "epic, large"), ("adventure", "adventure, cinematic"), ("background", "generic background bed"),
             ("score", "score cue (orchestral-style name)"), ("hip-hop", "dramatic hip-hop instrumental"), ("dope", "epic power, hip-hop-ish")]
    for key, m in rules:
        if key in n: return m
    return "mood unknown"
def stab(r):
    if r["drift"] is None: return "drift n/a"
    if r["drift"] < 5: return f"stable grid (drift {r['drift']:.1f} ms, mean err {r['mean']:.1f} ms)"
    return f"period drift {r['drift']:.1f} ms (mean err {r['mean']:.1f} ms): tempo not constant"
best = {"lnplusmusic-background-background-music-597024.mp3": "warm, low bass, very stable",
        "miromaxmusic-music-promotion-513944.mp3": "clean grid, mid bass, very stable",
        "the-mountain-epic-610137.mp3": "low bass, mid-bright, stable (epic name, light sound)",
        "px-99s-d.mp3": "brightest in set (2.6 kHz centroid), 118 BPM, grid good",
        "nastelbom-background-music-602518.mp3": "PASS but bass heavy (0.82): thump risk; byte-identical to px-109s-a",
        "nastelbom-background-music-606712.mp3": "PASS but bass heavy (0.76); byte-identical to px-123s-g",
        "paulyudin-background-background-music-574010.mp3": "near miss: match 97.5% vs 98%, drift 0.2 ms, low bass; ear-check",
        "shahvarpromotion-music.mp3": "near miss: drift 5.9 ms vs 5 ms; 120 BPM, mid bass"}
L = []
L.append("# Owner tracks: BPM / beat report\n")
L.append("Source: the Desktop folder New folder (4), root (39 files, read-only). Staged copies in this folder, unmodified (no transcoding). Sidecars: `<file>.music.json` (sound/tools/music_map.py), `<file>.source.json` (origin, size, duration, sha1), descriptors from librosa (bass = share of power below 150 Hz; centroid = median spectral centroid).\n")
n_pass = sum(r["verdict"] == "PASS" for r in rows)
L.append(f"Tracks: {len(rows)}; PASS {n_pass}; FAIL {len(rows)-n_pass}. Byte-identical pairs: " + ("; ".join(" = ".join(v) for v in dups.values()) if dups else "none") + ".\n")
L.append("## Top 8 fits (light, playful 100-128 BPM, no club thump)\n")
L.append("| slug | BPM | verdict | why |\n|---|---|---|---|")
for k, why in best.items():
    r = next(x for x in rows if x["src"] == k)
    L.append(f"| {k} | {r['bpm']:.2f} | {r['verdict']} | {why} |")
L.append("\nNote: 6 of the 8 are PASS by the gates; 2 are near misses (FAIL by a small margin) and need an ear check before use.\n")
L.append("## All 39 tracks\n")
L.append("| slug | duration s | BPM | verdict | stable grid | bass ratio | centroid Hz | mood guess (filename) | first failure reason |\n|---|---|---|---|---|---|---|---|---|")
for r in rows:
    fail = r["reasons"].split(";")[0] if r["reasons"] else ""
    L.append(f"| {r['src']} | {r['dur']:.1f} | {r['bpm']:.2f} | {r['verdict']} | {stab(r)} | {r['bass']:.2f} | {r['cent']:.0f} | {mood(r['src'])} | {fail} |")
L.append("\n## Notes\n- `white-records-...-176720` reads 90.01 BPM on a 0.5x grid (49 s hip-hop): PASS but out of the 100-128 range.\n- `nastelbom-uplifting-606716` PASS at 174 BPM (fast; half-time 87 BPM would be out of range): not in the picks.\n- `px-*` names carry no mood information; mood guesses are only from numbers.\n- No file was transcoded. Mood guesses come from filenames only, not listening.\n")
(O / "BPM-REPORT.md").write_text("\n".join(L) + "\n", encoding="utf-8")
print("written", len(rows), "dups", dups)
