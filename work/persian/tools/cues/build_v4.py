#!/usr/bin/env python
# Build one v4 social film from a silent Remotion render + music bed + v4 cue sheet (ffmpeg only).
# Usage: python -I build_v4.py --slug dogo-jump-1267515 --bpm 119.595 --t0 0.174 --track <mp3> --tj <music.json>
# Cue time: t = T0 + beat*60/BPM, or abs_s when present. Durations: dur_beats*60/BPM, or dur_s.
import argparse, json, os, re, subprocess, sys
from pathlib import Path

REPO = Path("D:/P/project/persianArts")
VER_ROOT = REPO / "media/film-versions/pencil-social"
CUES = VER_ROOT / "v4-cues/cues-9x16.json"
DUCK_RE = re.compile(r"[\\/](impact|stamp-thud|stinger|ding|ding-chime|success)[\\/]")
LOG = []


def run(args, capture=False):
    LOG.append("ffmpeg " + " ".join(args))
    r = subprocess.run(["ffmpeg", "-hide_banner"] + args, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise SystemExit("ffmpeg failed: " + " ".join(args) + "\n" + r.stderr[-3000:])
    return r.stderr


def probe_dur(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                       capture_output=True, text=True)
    return float(r.stdout.strip())


def loudnorm_json(stderr):
    m = re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", stderr)
    if not m:
        raise SystemExit("no loudnorm stats")
    return json.loads(m[-1])


def f(x):
    return ("%.6f" % x).rstrip("0").rstrip(".")


def resolve(cues, bpm, t0):
    out = []
    for c in cues:
        t = float(c["abs_s"]) if "abs_s" in c else t0 + float(c["beat"]) * 60.0 / bpm
        dur = float(c["dur_beats"]) * 60.0 / bpm if "dur_beats" in c else float(c["dur_s"])
        src = REPO / c["file"]
        if not src.is_file():
            raise SystemExit("missing cue file " + c["file"])
        fd = probe_dur(src)
        trim = float(c.get("trim_start_s", 0))
        short = fd < trim + dur - 0.01
        out.append({
            "n": c["n"], "event": c["event"], "beat": c.get("beat"), "abs_s": c.get("abs_s"),
            "t_s": round(t, 4), "duration_s": round(dur, 4), "trim_start_s": trim,
            "file": c["file"], "src_dur_s": round(fd, 3), "source_too_short": short,
            "gain_db": c["gain_db"], "fade_ms": c.get("fade_ms", 10), "duck": bool(DUCK_RE.search(c["file"])),
            "source_frames": c.get("source_frames", ""),
        })
    return out


def max_overlap(res):
    ev = []
    for r in res:
        ev.append((r["t_s"], 1))
        ev.append((r["t_s"] + r["duration_s"], -1))
    cur = best = 0
    for _, d in sorted(ev, key=lambda x: (x[0], x[1])):
        cur += d
        best = max(best, cur)
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--bpm", type=float, required=True)
    ap.add_argument("--t0", type=float, required=True)
    ap.add_argument("--track", required=True)
    ap.add_argument("--tj", required=True)
    ap.add_argument("--outdir", required=True)
    ap.add_argument("--version", required=True)
    a = ap.parse_args()

    outdir = Path(a.outdir)
    tmp = outdir / "tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    silent = outdir / "silent.mp4"
    if not silent.is_file():
        sys.exit("silent render missing: " + str(silent))

    D = probe_dur(silent)
    track = REPO / a.track
    t0_track = float(json.load(open(REPO / a.tj, encoding="utf-8"))["t0"])
    offset = t0_track - a.t0

    cues = json.load(open(CUES, encoding="utf-8"))
    res = resolve(cues, a.bpm, a.t0)
    (outdir / "cues-resolved.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    overlap = max_overlap(res)

    # 1. Bed: pass 1 measure, pass 2 normalise to -18 LUFS, 0.4 s fade-in, 1.6 s qsin fade-out
    pre = ["-ss", f(offset)] if offset >= 0 else []
    lead = "" if offset >= 0 else "adelay=%d|%d," % (round(-offset * 1000), round(-offset * 1000))
    p1 = run(["-nostats"] + pre + ["-i", str(track), "-t", f(D), "-af",
             lead + "afade=t=in:st=0:d=0.4,loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    j1 = loudnorm_json(p1)
    bed = tmp / "bed.wav"
    run(["-y", "-loglevel", "error"] + pre + ["-i", str(track), "-t", f(D), "-af",
        lead + "afade=t=in:st=0:d=0.4,loudnorm=I=-18:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:"
        "measured_thresh=%s:offset=%s:linear=false,afade=t=out:st=%s:d=1.6:curve=qsin"
        % (j1["input_i"], j1["input_tp"], j1["input_lra"], j1["input_thresh"], j1["target_offset"], f(D - 1.6)),
        "-ar", "48000", "-ac", "2", "-c:a", "pcm_f32le", str(bed)])

    # 2. Cue graph: bed with -3 dB dips under duck cues, each cue delayed/faded, summed in chunks of 12.
    inputs = ["-i", str(bed)]
    fc = []
    labels = []
    dips = []
    for k, r in enumerate(res):
        idx = k + 1
        inputs += ["-i", str(REPO / r["file"])]
        ms = int(round(r["t_s"] * 1000))
        d = r["duration_s"]
        fd = r["fade_ms"] / 1000.0
        chain = ("[%d:a]atrim=start=%s:duration=%s,asetpts=PTS-STARTPTS,"
                 "aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=%sdB,afade=t=in:st=0:d=0.003"
                 % (idx, f(r["trim_start_s"]), f(d), f(r["gain_db"])))
        if fd > 0:
            chain += ",afade=t=out:st=%s:d=%s" % (f(max(0.0, d - fd)), f(fd))
        chain += ",adelay=%d|%d[c%d]" % (ms, ms, idx)
        fc.append(chain)
        labels.append("[c%d]" % idx)
        if r["duck"]:
            dips.append("between(t\\,%s\\,%s)" % (f(r["t_s"]), f(r["t_s"] + 0.15)))
    bedf = "[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,atrim=duration=%s" % f(D)
    if dips:
        bedf += ",volume=enable='%s':volume=0.708" % "+".join(dips)
    fc.insert(0, bedf + "[bed]")
    chunks = []
    for g in range(0, len(labels), 12):
        grp = labels[g:g + 12]
        fc.append("".join(grp) + "amix=inputs=%d:normalize=0:duration=longest:dropout_transition=0[m%d]" % (len(grp), len(chunks)))
        chunks.append("[m%d]" % len(chunks))
    fc.append("[bed]" + "".join(chunks) + "amix=inputs=%d:normalize=0:duration=first:dropout_transition=0[aout]" % (len(chunks) + 1))
    script = tmp / "graph.txt"
    script.write_text(";\n".join(fc), encoding="utf-8")
    summ = tmp / "sum.wav"
    run(["-y", "-loglevel", "error"] + inputs + ["-filter_complex_script", str(script), "-map", "[aout]",
        "-t", f(D), "-c:a", "pcm_f32le", "-ar", "48000", "-ac", "2", str(summ)])

    # 3. Master: loudnorm -14 LUFS, TP -1.5, then exp tail; extend tail until last 0.25 s peak < -50 dBFS
    p2 = run(["-nostats", "-i", str(summ), "-t", f(D), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
             "-f", "null", "-"])
    j2 = loudnorm_json(p2)
    final = tmp / "final.wav"
    tail_used = None
    for tail in (0.35, 0.6, 1.0):
        run(["-y", "-loglevel", "error", "-i", str(summ), "-t", f(D), "-af",
            "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:"
            "offset=%s:linear=false,afade=t=out:st=%s:d=%s:curve=exp,alimiter=limit=0.75:attack=3:release=60:level=disabled"
            % (j2["input_i"], j2["input_tp"], j2["input_lra"], j2["input_thresh"], j2["target_offset"],
               f(D - tail), f(tail)), "-ar", "48000", "-ac", "2", "-c:a", "pcm_s24le", str(final)])
        tp = run(["-nostats", "-sseof", "-0.25", "-i", str(final), "-af", "astats=measure_overall=Peak_level",
                  "-f", "null", "-"])
        pk = re.findall(r"Peak level dB: (-?[\d.]+|-inf)", tp)
        tail_peak = float(pk[-1]) if pk and pk[-1] != "-inf" else -999.0
        tail_used = tail
        if tail_peak < -50.0:
            break

    # 4. Encode video (yuv420p tv) + audio
    outmp4 = outdir / ("social-9x16-v4-%s.mp4" % a.slug)
    run(["-y", "-loglevel", "error", "-i", str(silent), "-i", str(final), "-map", "0:v:0", "-map", "1:a:0",
        "-vf", "scale=out_range=tv:out_color_matrix=bt709,format=yuv420p", "-c:v", "libx264", "-preset", "slow",
        "-crf", "16", "-color_range", "tv", "-colorspace", "bt709", "-c:a", "aac", "-b:a", "192k", "-t", f(D),
        "-movflags", "+faststart", str(outmp4)])

    # 5. Verify
    ebu = run(["-nostats", "-i", str(outmp4), "-af", "ebur128=peak=true", "-f", "null", "-"])
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", ebu)
    TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", ebu)
    tl = run(["-nostats", "-sseof", "-0.25", "-i", str(outmp4), "-af", "astats=measure_overall=Peak_level+RMS_level",
              "-f", "null", "-"])
    tail_pk = re.findall(r"Peak level dB: (-?[\d.]+|-inf)", tl)
    tail_rms = re.findall(r"RMS level dB: (-?[\d.]+|-inf)", tl)
    vdur = probe_dur(outmp4)
    vpf = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=pix_fmt,color_range",
                          "-of", "csv=p=0", str(outmp4)], capture_output=True, text=True).stdout.strip()
    verify = {
        "file": outmp4.name, "video_dur_s": round(probe_dur(silent), 3), "file_dur_s": round(vdur, 3),
        "integrated_lufs": I[-1] if I else None, "true_peak_dbtp": TP[-1] if TP else None,
        "last_0_25s_peak_db": tail_pk[-1] if tail_pk else None,
        "last_0_25s_rms_db": tail_rms[-1] if tail_rms else None,
        "exp_tail_s_used": tail_used, "video_pix_fmt_range": vpf,
        "cues_total": len(res), "cues_source_too_short": sum(1 for r in res if r["source_too_short"]),
        "ducked_cues": sum(1 for r in res if r["duck"]), "max_simultaneous_cues": overlap,
        "bed_pass1": {"I": j1["input_i"], "TP": j1["input_tp"]}, "final_pass1": {"I": j2["input_i"], "TP": j2["input_tp"]},
        "film_dur_s": round(D, 3), "track_offset_s": round(offset, 5),
        "beat_to_film_end_s": round(a.t0 + 34 * 60.0 / a.bpm, 3),
    }
    (outdir / "verify.json").write_text(json.dumps(verify, ensure_ascii=False, indent=1), encoding="utf-8")
    version = {
        "film": "pencil-social", "version": a.version, "date": "2026-10-13", "cues_file": "media/film-versions/pencil-social/v4-cues/cues-9x16.json",
        "BPM": a.bpm, "T0_S": a.t0, "track": a.track, "track_t0_s": t0_track, "silent_render": "silent.mp4",
        "renderer": "remotion Social9x16 --props BPM/T0_S (silent)", "file": outmp4.name,
        "notes": "Personal test only. Cue sheet v4 (abs_s for hook, beat grid elsewhere). Bed -18 LUFS, -3 dB 150 ms dips under impact/stamp/stinger/ding/success, final -14 LUFS TP -1.5 with exp tail.",
    }
    (outdir / "VERSION.json").write_text(json.dumps(version, ensure_ascii=False, indent=1), encoding="utf-8")
    (outdir / "render.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
    print(json.dumps(verify, ensure_ascii=False))


if __name__ == "__main__":
    main()
