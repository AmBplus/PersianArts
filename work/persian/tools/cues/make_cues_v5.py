# Writes v5-cues/cues-9x16.json. Payoffs are symbolic: {"cut": scene_index, "ref": reference frame (120 BPM grid)}
# and "real_frames" (real-frame offset from the cut, used for wipe starts). build_v5.py resolves them per version to abs_s.
# Beat-locked elements use {"beat": b} (beats from T0). Gains: "gain_db" (v4 values) or "target_db" (peak target).
import json
from pathlib import Path

S = []


def add(event, file, at, dur, fade_ms=30, **kw):
    d = {"event": event, "file": file, "at": at, "dur": dur, "fade_ms": fade_ms}
    d.update(kw)
    S.append(d)


HOOK, COUNT, PEN, SLOW, DAILY, CTA = 0, 1, 2, 3, 4, 5
SF = "sound/library/sfx/"
add("HOOK scribble draws in (prop 0-40 ref)", SF + "freesound/paper-pencil/809915-pencil-aggressive-inwards.mp3", {"cut": HOOK, "ref": 0}, {"ref": 40}, 60, gain_db=-10.3)
add("HOOK stomp dastkhat contact (H=3)", SF + "freesound/impact/342535-medium-thud-1.mp3", {"cut": HOOK, "ref": 3}, {"s": 0.3}, 60, gain_db=-8)
add("HOOK stamp slam zashte contact (H=15)", SF + "freesound/stamp-thud/470710-traditional-stamp-wav.mp3", {"cut": HOOK, "ref": 15}, {"s": 0.6}, 60, gain_db=-6)
add("HOOK sub boom on zashte contact (H=15)", SF + "freesound/boom-sub/339437-super-low-bass-hit-kick-drum-wav.mp3", {"cut": HOOK, "ref": 15}, {"s": 0.36}, 20, gain_db=-10)
add("HOOK ink wet splat +60 ms after zashte", SF + "owner-pack/impact/wet-splat-01.wav", {"cut": HOOK, "ref": 15}, {"s": 0.9}, 300, target_db=-14, delay_ms=60)
add("HOOK strike-through cross-out (H=40); gain fixed from +11 dB", SF + "freesound/paper-pencil/761655-pencil-scribble-18.mp3", {"cut": HOOK, "ref": 40}, {"s": 0.4}, 30, target_db=-12, cap_db=6)
add("CUT 1->2 swoosh (wipe start, cut-5 frames)", SF + "freesound/swoosh-transition/234538-swoosh-1.mp3", {"cut": COUNT, "real_frames": -5}, {"s": 0.9}, 150, gain_db=-10)
add("COUNT digit roll tick", SF + "freesound/tick-clock/361781-wall-clock-snippet-03.mp3", {"beat": 4.0667}, {"s": 0.216}, 10, gain_db=-8)
add("COUNT word pop (ref 12)", SF + "freesound/pop/245645-cartoon-pop-clean.mp3", {"beat": 4.8}, {"s": 0.216}, 10, gain_db=-13.6)
add("COUNT tick 1 (ref 15)", SF + "freesound/tick-clock/361782-wall-clock-snippet-02.mp3", {"beat": 5}, {"s": 0.264}, 10, gain_db=-8)
add("COUNT tick 2 (ref 30)", SF + "freesound/tick-clock/361783-wall-clock-snippet-01.mp3", {"beat": 6}, {"s": 0.216}, 10, gain_db=-9)
add("COUNT subtitle bubble (ref 30)", SF + "freesound/bubble/253956-bubble-pop.mp3", {"beat": 6}, {"s": 0.264}, 10, gain_db=-12)
add("COUNT build riser ref 30 to time-up hit 48", SF + "freesound/riser/811715-riser.mp3", {"cut": COUNT, "ref": 30}, {"until": {"cut": COUNT, "ref": 48}}, 20, gain_db=-12)
add("COUNT time-up bell ding (H=48), ring-out 1.2 s", SF + "freesound/ding/611112-bell-ding-2-wav.mp3", {"cut": COUNT, "ref": 48}, {"s": 1.2}, 400, target_db=-12, cap_db=6)
add("COUNT time-up transient tap (H=48)", SF + "freesound/tick-clock/349453-ticking-clock-60-sec-hit-mark.mp3", {"cut": COUNT, "ref": 48}, {"s": 0.6}, 40, target_db=-10)
add("PEN swoosh slide at cut-5 frames", SF + "owner-pack/slide/slide-02.wav", {"cut": PEN, "real_frames": -5}, {"s": 0.9}, 150, gain_db=-10)
add("PEN title badge pop (ref 3)", SF + "freesound/bubble/411462-bubble-pop.mp3", {"beat": 8.2}, {"s": 0.3}, 10, gain_db=-12)
add("PEN blunt marker stroke (ref 6-20)", SF + "freesound/paper-pencil/809915-pencil-aggressive-inwards.mp3", {"beat": 8.4}, {"beats": 0.9333}, 30, gain_db=-6)
add("PEN morph spark burst (H=34)", SF + "freesound/sparkle-magic/545238-item-sparkle.mp3", {"cut": PEN, "ref": 34}, {"s": 0.3}, 5, gain_db=-15)
add("PEN fine-nib stroke (ref 50-84)", SF + "freesound/paper-pencil/335513-writing-long-sketch-05.mp3", {"beat": 11.3333}, {"beats": 2.2667}, 80, gain_db=1)
add("SLOW swoosh at cut-5 frames", SF + "freesound/swoosh-transition/234541-swoosh-2.mp3", {"cut": SLOW, "real_frames": -5}, {"s": 0.9}, 150, gain_db=-10)
add("SLOW title paper slide (ref 2)", SF + "freesound/slide/464302-paperslide-wav.mp3", {"beat": 14.1333}, {"s": 0.5}, 60, gain_db=-12)
add("SLOW calm long stroke (ref 6-78)", SF + "freesound/paper-pencil/335509-writing-long-sketch-01.mp3", {"beat": 14.4}, {"beats": 4.8}, 150, gain_db=-5.8)
add("SLOW stroke end soft ping (H=78, optional)", SF + "freesound/ding/23152-ding-wav.mp3", {"cut": SLOW, "ref": 78}, {"s": 0.5}, 60, target_db=-18)
add("DAILY whoosh at cut-5 frames", SF + "owner-pack/whoosh/woosh-08.mp3", {"cut": DAILY, "real_frames": -5}, {"s": 0.4}, 30, gain_db=-8)
ROWS_STROKE = [("335514-writing-short-5", -6), ("335515-writing-short-4", -6), ("335511-writing-short-2-wav", -6), ("335512-writing-long-sketch-06", -6.5), ("335507-writing-long-sketch-03", -7), ("335513-writing-long-sketch-05", -7.5), ("335509-writing-long-sketch-01", -8)]
for i, (nm, g) in enumerate(ROWS_STROKE):
    add("DAILY row %d pen stroke" % (i + 1), SF + "freesound/paper-pencil/%s.mp3" % nm, {"beat": 20 + (11 + 7 * i) / 15}, {"beats": 0.7333}, 60, gain_db=g)
CLICKS = ["click-01", "click-02", "click-03", "click-04", "click-01", "click-02"]
DINGS = ["freesound/ding/13934-6-wav.mp3", "freesound/ding/13951-23-wav.mp3", "freesound/ding/333694-thin-bell-ding-3.mp3", "freesound/ding/66876-glass-ding-mp3.mp3", "freesound/ding/88243-ding-s-dong-wav.mp3", "freesound/ding/759839-singleding.mp3"]
for i in range(6):
    T = 22 + 7 * i
    add("DAILY row %d check tick (H=%d)" % (i + 1, T), SF + "owner-pack/typing/%s.wav" % CLICKS[i], {"beat": 20 + T / 15}, {"s": 0.2}, 10, gain_db=-10)
    add("DAILY row %d ring-pulse soft ding" % (i + 1), SF + DINGS[i], {"beat": 20 + T / 15}, {"s": 0.8}, 80, target_db=-18)
add("DAILY day 7 bell accent (H=64, bigger final tick)", SF + "freesound/ding/611113-bell-ding-1-wav.mp3", {"cut": DAILY, "ref": 64}, {"s": 1.2}, 400, target_db=-8)
add("DAILY day 7 shimmer +100 ms", SF + "freesound/sparkle-magic/462095-sparkling-star-01-wav.mp3", {"cut": DAILY, "ref": 64}, {"s": 1.0}, 300, target_db=-14, delay_ms=100)
add("CTA swoosh at cut-5 frames", SF + "freesound/swoosh-transition/234549-swoosh-3.mp3", {"cut": CTA, "real_frames": -5}, {"s": 0.9}, 150, gain_db=-10)
add("CTA riser into the pill pop", SF + "freesound/riser/811715-riser.mp3", {"beat": 26.6}, {"beats": 2.0}, 80, gain_db=-8)
add("CTA loop flourish stroke (ref 2-36)", SF + "freesound/paper-pencil/173080-cursive-writing-wav.mp3", {"beat": 27.1333}, {"beats": 2.2667}, 80, gain_db=-6)
add("CTA pill pop stamp-thud (ref 24)", SF + "freesound/stamp-thud/470710-traditional-stamp-wav.mp3", {"beat": 28.6}, {"s": 0.4}, 30, gain_db=-6)
add("CTA sparkle after pop", SF + "freesound/sparkle-magic/462092-sparkling-star-04-wav.mp3", {"beat": 29.0}, {"s": 0.6}, 60, gain_db=-12)
add("CTA downlifter falls away (ref 36-72)", SF + "freesound/downlifter/123220-klick-verbs-43-wav.mp3", {"beat": 29.4}, {"beats": 2.4}, 150, gain_db=-10)
add("CTA final knot stinger (H=98 settle)", SF + "freesound/stinger/441342-stinger-3-wav.mp3", {"cut": CTA, "ref": 98}, {"s": 1.0}, 500, target_db=-6)
add("CTA final shimmer +150 ms", SF + "freesound/sparkle-magic/462092-sparkling-star-04-wav.mp3", {"cut": CTA, "ref": 98}, {"s": 0.8}, 300, target_db=-14, delay_ms=150)
add("CTA ring-out 2 (ref 101)", SF + "freesound/ding/499775-ding-wav.mp3", {"cut": CTA, "ref": 101}, {"s": 0.8}, 300, target_db=-16)
add("CTA ring-out 3 (ref 104)", SF + "freesound/ding/376807-ding-wav.mp3", {"cut": CTA, "ref": 104}, {"s": 0.8}, 300, target_db=-18)

doc = {
    "film": "pencil-social", "version": "v5-cues", "date": "2026-10-13",
    "note": "Payoff cues are symbolic (cut scene index + reference frame on the 120 BPM grid, real_frames offset for wipes). build_v5.py resolves them per version to abs_s = (cut_frame + ceil(ref*120/BPM))/30. Beat cues use beat from T0. Gains: gain_db (v4 value) or target_db (peak target: gain = target - measured peak, cap_db optional).",
    "cuts": {"HOOK": 0, "COUNT": 1, "PEN": 2, "SLOW": 3, "DAILY": 4, "CTA": 5},
    "cues": [dict(n=i + 1, **c) for i, c in enumerate(S)],
}
Path(__file__).resolve().parent.parent.joinpath("cues-9x16.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(S), "cues written")
