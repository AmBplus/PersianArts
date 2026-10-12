# Derive the v5.1 cue sheet from v5 (new file only; v5 cues untouched).
# Usage: python -I make_cues_v51.py
import json
from pathlib import Path

REPO = Path("D:/P/project/persianArts")
VER = REPO / "media/film-versions/pencil-social"
SRC = VER / "v5-cues/cues-9x16.json"
DST = VER / "v51-cues/cues-9x16-v51.json"
HIT_REL = "media/film-versions/pencil-social/v51-cues/assets/hit-stamp-sub.wav"
RATTLE = "sound/library/sfx/kenney/impact/impactMetal_light_000.ogg"
SINGLE = "sound/library/sfx/owner-pack/ding-chime/"

d = json.load(open(SRC, encoding="utf-8"))
out = []
for c in d["cues"]:
    n = c["n"]
    if n == 4:  # sub boom merged into the 'hit' layer (n3)
        continue
    if n in (33, 35, 37, 39, 41, 43):  # Daily check clicks: weakest layer, dropped to keep <= 3 audible at once
        continue
    if 26 <= n <= 32:  # Daily pen strokes: 0.2 s so strokes do not stack
        c["dur"] = {"s": 0.2}
    if n == 1:  # scribble ends at the stamp contact (frame 17), not at ref 40
        c["dur"] = {"until": {"cut": 0, "ref": 15}}
        c["event"] = "HOOK scribble draws in, ends at stamp contact (H=15)"
    if n == 3:  # pre-combined hit: stamp (-6 dB) + sub (-10 dB) in one layer
        c.update(file=HIT_REL, event="HOOK hit = stamp+sub premix (H=15)", dur={"s": 0.6},
                 fade_ms=60, gain_db=0, duck=True)
        c.pop("target_db", None)
    if n in (34, 36, 40, 42, 44):  # rows 1,2,4,5,6: replace short clips (0.34-0.67 s) with >= 1 s bell clips
        rows = {34: "single-note-01.wav", 36: "single-note-02.wav", 40: "single-note-03.wav",
                42: "single-note-04.wav", 44: "single-note-05.wav"}
        c.update(file=SINGLE + rows[n], target_db=-22, duck=True, dur={"s": 0.6}, fade_ms=250)
        c["event"] = c["event"].replace("soft ring ding", "ring ding (catalog bell)")
    if n == 38:  # row 3 ring ding is already long (1.9 s): keep clip, level to -22 dBFS
        c.update(target_db=-22, duck=True, dur={"s": 0.6}, fade_ms=250)
        c.pop("gain_db", None)
    if n == 14:  # time-up ring ends ~84 ms past the wipe cut (cut 2 at 4.40 s), not 1.2 s
        c["dur"] = {"s": 0.52}
    if n == 15:  # time-up transient tap, short
        c["dur"] = {"s": 0.3}
    if n == 56:  # CTA ring-out 3 dropped: weakest layer at the settle (limit 3 audible)
        continue
    if n == 32:  # Daily row 7 pen stroke dropped: day 7 is the quiet accent; limit 3 audible at dogo 11.99 s
        continue
    if n == 45:  # day-7 accent, louder, distinct clip
        c.update(file=SINGLE + "end-bell-solo.wav", target_db=-12, duck=True)
        c.pop("cap_db", None)
        c.pop("gain_db", None)
    out.append(c)

out.append({
    "n": 57,
    "event": "COUNT crown rattle at shake start (H=48), metal clink",
    "file": RATTLE,
    "at": {"cut": 1, "ref": 48},
    "dur": {"s": 0.3},
    "fade_ms": 30,
    "target_db": -14,
})

d["cues"] = out
d["version"] = "v51-cues"
d["date"] = "2026-10-13"
d["note"] = ("v5.1 fix round from v5-cues: Hook hit layer premixed (stamp+sub), scribble ends at contact; "
             "Daily rings rows 1,2,4,5,6 use owner-pack/ding-chime single notes (>= 1 s), all six ring dings -22 dBFS "
             "target, day-7 accent -12 dBFS target (end-bell-solo); crown rattle n57 at Count H=48. "
             "Timing rules as v5 (cut + ref on 120 BPM grid).")
DST.parent.mkdir(parents=True, exist_ok=True)
json.dump(d, open(DST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("cues:", len(out), "->", DST)
