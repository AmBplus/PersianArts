import json
from pathlib import Path
O = Path(__import__("os").environ.get("PA_ROOT") or Path(__file__).resolve().parents[3]) / "media" / "music-staging" / "owner"
D = json.loads((O.parent / "owner-descriptors.tmp.json").read_text(encoding="utf-8"))
rows = []
for sc in sorted(O.glob("*.music.json")):
    j = json.loads(sc.read_text(encoding="utf-8"))
    src = sc.name[:-len(".music.json")]
    g = j["grid"]
    d = D[src]
    rows.append(dict(src=src, bpm=j["bpm"], verdict=g["verdict"], match=g["match"], mean=g["mean_abs_ms"], drift=g["drift_ms"],
                     firstok=g["first_beat_on_attack"], reasons="; ".join(g["reasons"]), grid=g["winner"], beats=g["beats_total"],
                     bass=d["bass_ratio"], cent=d["centroid_hz"], dur=d["dur_s"], rms=d["rms_db"]))
json.dump(rows, open(O.parent / "owner-summary.tmp.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(rows), "PASS:", sum(r["verdict"] == "PASS" for r in rows))
for r in rows:
    print(f'{r["src"][:44]:44} {r["bpm"]:7.2f} {r["verdict"]} m={r["match"]} ma={r["mean"]} dr={r["drift"]} fb={r["firstok"]} b={r["bass"]} c={r["cent"]} d={r["dur"]} g={r["grid"]} | {r["reasons"][:90]}')
