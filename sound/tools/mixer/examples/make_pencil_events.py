# One-off provenance: typed events for pencil html v2 = events.json (frames) + beat-locked extras from the v51 cue sheet.
import json
from pathlib import Path
R = Path(__file__).resolve().parents[4]
src = json.load(open(R / "media/film-versions/pencil-html/v2/events.json", encoding="utf-8"))
T0, BEAT = src["t0_s"], 60.0 / src["bpm"]
by = lambda n: next(e for e in src["events"] if e["name"] == n)
def ev(name, typ, variant=None, role=None, dur=None, t=None, frame=None):
    d = {"name": name, "type": typ}
    if frame is not None: d["frame"] = frame
    else: d["t_s"] = round(t, 4)
    if variant: d["variant"] = variant
    if role: d["role"] = role
    if dur: d["dur_s"] = dur
    return d
F = lambda n: by(n)["frame"]
out = [
 ev("hook scribble starts", "typing", "scribble", dur=0.5667, frame=0),
 ev("hook stomp dast-khat contact", "stamp", "light", frame=F("hook stomp dast-khat contact")),
 ev("hook stomp zashte contact (ink block)", "stamp", frame=F("hook stomp zashte contact (ink block)")),
 ev("hook cross-out contact", "typing", "strike", frame=F("hook cross-out contact")),
 ev("count digit roll tick", "count-tick", t=T0 + 4.0667 * BEAT),
 ev("count word pop", "pop", frame=F("count word pop")),
 ev("count tick 1", "count-tick", frame=F("count tick 1")),
 ev("count tick 2", "count-tick", frame=F("count tick 2")),
 ev("count time-up ring full + crown shake", "ring", "timeup", role="accent", frame=F("count time-up ring full + crown shake")),
 ev("pen title badge pop", "pop", frame=F("pen title badge pop")),
 ev("pen blunt marker stroke", "typing", "marker", dur=round(0.9333 * BEAT, 4), t=T0 + 8.4 * BEAT),
 ev("pen morph hit blunt to nib", "reveal", frame=F("pen morph hit blunt to nib")),
 ev("pen fine-nib stroke", "typing", "fine", dur=round(2.2667 * BEAT, 4), t=T0 + 11.3333 * BEAT),
 ev("slow title paper slide", "slide", t=T0 + 14.1333 * BEAT),
 ev("slow calm long stroke", "typing", "calm", dur=round(4.8 * BEAT, 4), t=T0 + 14.4 * BEAT),
 ev("slow stroke end", "ring", "soft", frame=F("slow stroke end")),
]
for i in range(1, 7):
    out.append(ev("daily row %d tick" % i, "tick", frame=F("daily row %d tick" % i)))
out += [
 ev("daily day 7 check + double ring (bigger tick)", "ring", "accent", role="accent", frame=F("daily day 7 check + double ring (bigger tick)")),
 ev("cta riser into the pill pop", "riser", dur=round(2.0 * BEAT, 4), t=T0 + 26.6 * BEAT),
 ev("cta loop flourish stroke", "typing", "flourish", dur=round(2.2667 * BEAT, 4), t=T0 + 27.1333 * BEAT),
 ev("cta pill pop", "stamp", "pill", frame=F("cta pill pop")),
 ev("cta downlifter falls away", "riser", "down", dur=round(2.4 * BEAT, 4), t=T0 + 29.4 * BEAT),
 ev("cta bow settle (final hit)", "settle", role="final", frame=F("cta bow settle (final hit)")),
 ev("cta ring-out 2", "ring", "tail", frame=F("cta ring-out 2")),
]
doc = {"schema": "persianarts.events/1", "film": "pencil-html-v2", "fps": src["fps"], "bpm": src["bpm"], "t0_s": src["t0_s"],
       "cut_frames": src["cut_frames"], "duration_frames": src["duration_frames"], "events": out}
(Path(__file__).with_name("pencil-v2.events.json")).write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(out), "events")
