#!/usr/bin/env python3
"""make_sound.py -- CLI of docs/PERSIAN-SOUND-SPEC.md (sections 1-3).

analyze picture -> synthesize music+sfx (mix.py) -> two-pass ffmpeg loudnorm
to -14 LUFS / TP -1.5 with alimiter -> mux under the original video stream
(copy) with AAC 96k.  Writes <out>.mp4 plus, under --debug-dir, a
sound/<Stem>.json cue list and sound/<Stem>.wav.

Only Python 3 + numpy + ffmpeg/ffprobe on PATH.
"""
import argparse
import json
import os
import re
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import analysis      # noqa: E402
import io_utils      # noqa: E402
import mix           # noqa: E402
import synth         # noqa: E402

LOUDNORM = "loudnorm=I=-14:TP=-1.5:LRA=7"

# auto profile mapping (spec section 2 table); order matters
PROFILE_RULES = [
    ("persian-shur", ["calligraph", "ink", "brush", "poem", "poetry",
                      "ruqaa", "amiri", "nastaliq", "elegant", "persian"]),
    ("playful", ["friendly", "casual", "pill", "chip", "playful"]),
    ("cinematic", ["opening", "outro", "camera", "cinematic"]),
    ("punchy", ["glitch", "flash", "slam", "rhythm", "punchy"]),
    ("editorial", ["typography", "editorial"]),
    ("transition", ["transition"]),
    ("clean-tech", ["ui-entrance", "interaction", "data", "tech"]),
]


def pick_profile(category, tags, forced):
    if forced:
        return forced
    text = " ".join([category or ""] + list(tags or [])).lower()
    for name, kws in PROFILE_RULES:
        if any(k in text for k in kws):
            return name
    return "clean-tech"


def probe(path):
    p = io_utils.run(["ffprobe", "-v", "error", "-print_format", "json",
                      "-show_entries", "format=duration",
                      "-show_entries", "stream=r_frame_rate,codec_type",
                      "-select_streams", "v:0", str(path)])
    info = json.loads(p.stdout)
    dur = float(info["format"]["duration"])
    num, den = info["streams"][0]["r_frame_rate"].split("/")
    fps = float(num) / float(den)
    return dur, fps


def measure_loudness(args):
    """Two-pass loudnorm pass 1: return measured dict for the input."""
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}",
                  measure_loudness_raw(args[0]), re.S)
    if not m:
        raise RuntimeError("loudnorm measure failed")
    return json.loads(m.group(0))


def pass2_filter(meas, dur):
    """Two-pass loudnorm apply + limiter + exact-length audio."""
    ln = (LOUDNORM
          + ":measured_I=%(I)s:measured_TP=%(TP)s:measured_LRA=%(LRA)s"
            ":measured_thresh=%(th)s:offset=%(off)s:linear=true" %
          dict(I=meas["input_i"], TP=meas["input_tp"],
               LRA=meas["input_lra"], th=meas["input_thresh"],
               off=meas["target_offset"]))
    # level=0: alimiter auto-level re-normalizes to 0 dB by default, which
    # would defeat the 0.89 ceiling; disable it.
    return (ln + ",aresample=44100,alimiter=limit=0.89:level=0,"
            "apad,atrim=0:%.3f" % dur)


def measured_tp(path):
    m = re.search(r'"input_tp"\s*:\s*"(-?[0-9.]+)"',
                  measure_loudness_raw(path))
    return float(m.group(1))


def measure_loudness_raw(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-i", str(path),
                        "-af", LOUDNORM + ":print_format=json",
                        "-f", "null", "-"],
                       capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    return p.stderr


def mux(video, audio_wav, out_path, filt, dur):
    """Mux with video stream copy; then verify true peak of the AAC output
    and re-mux with a small trim until TP <= -1.2 dBTP (AAC overshoots the
    PCM ceiling). Max 3 deterministic iterations."""
    trim = 0.0
    for _ in range(3):
        f = filt if trim == 0.0 else filt.replace(
            "alimiter=", "volume=%.4fdB,alimiter=" % trim, 1)
        io_utils.run(["ffmpeg", "-hide_banner", "-v", "error", "-y",
                      "-i", str(video), "-i", str(audio_wav),
                      "-filter_complex", "[1:a]" + f + "[aout]",
                      "-map", "0:v:0", "-map", "[aout]",
                      "-c:v", "copy", "-c:a", "aac", "-b:a", "96k",
                      "-movflags", "+faststart", "-shortest", str(out_path)])
        tp = measured_tp(out_path)
        if tp <= -1.2:
            return tp
        trim += -1.3 - tp
    return tp


def main(argv=None):
    ap = argparse.ArgumentParser(description="Persian sound renderer")
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", dest="out", required=True)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--category", default="")
    ap.add_argument("--tags", default="")
    ap.add_argument("--profile", default=None)
    ap.add_argument("--debug-dir", dest="debug_dir", default=None)
    a = ap.parse_args(argv)

    tags = [t for t in a.tags.split(",") if t]
    profile_name = pick_profile(a.category, tags, a.profile)
    profiles = synth.load_profiles()
    profile = profiles.get(profile_name, profiles["clean-tech"])

    stem = os.path.splitext(os.path.basename(a.inp))[0]
    dur, fps = probe(a.inp)
    cues = analysis.analyze(a.inp, fps=round(fps))
    audio, cues_out, info = mix.build_mix(cues, profile, dur, a.slug, stem)
    print("profile=%s bpm=%.2f offset=%.3fs anchor=%.3fs cues=%d"
          % (profile_name, info["bpm"], info["offset"], info["anchor"],
             len(cues_out)))

    if a.debug_dir:
        snd = os.path.join(a.debug_dir, "sound")
        os.makedirs(snd, exist_ok=True)
        wav_path = os.path.join(snd, stem + ".wav")
        json_path = os.path.join(snd, stem + ".json")
        synth.write_wav(wav_path, audio)
        with open(json_path, "w", encoding="utf-8") as fh:
            json.dump(dict(slug=a.slug, stem=stem, profile=profile_name,
                           bpm=info["bpm"], grid_offset=info["offset"],
                           duration=round(dur, 3), cues=cues_out),
                      fh, ensure_ascii=False, indent=1)
    else:
        wav_path = io_utils.TMP_PREFIX + "mix-%d.wav" % os.getpid()
        synth.write_wav(wav_path, audio)

    meas = measure_loudness([wav_path])
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    mux(a.inp, wav_path, a.out, pass2_filter(meas, dur), dur)
    print("wrote %s (video stream copied, AAC 96k, %s loudnorm)"
          % (a.out, LOUDNORM))
    return 0


if __name__ == "__main__":
    sys.exit(main())
