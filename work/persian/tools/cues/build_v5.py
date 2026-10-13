# Build one v5 social film: resolve the symbolic cue sheet for (BPM, T0), mix (ffmpeg only), verify.
# Usage: python -I build_v5.py --slug lnplus-597024 --bpm 110 --t0 0.02722 --track <mp3> --tj <music.json> --version v5-lnplus-597024 [--sheet]
import argparse, json, math, os, re, subprocess
from pathlib import Path

REPO = Path(os.environ["PA_REPO"]) if os.environ.get("PA_REPO") else Path(__file__).resolve().parents[4]
VER = REPO / "media/film-versions/pencil-social"
CUES = VER / "v5-cues/cues-9x16.json"
CUT_BEATS = [0, 4, 8, 14, 20, 27, 36]
FPS = 30
DUCK_RE = re.compile(r"[\\/](impact|stamp-thud|stinger|ding|ding-chime|success)[\\/]")
LOG = []


def run(args):
    LOG.append("ffmpeg " + " ".join(args))
    r = subprocess.run(["ffmpeg", "-hide_banner"] + args, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise SystemExit("ffmpeg failed: " + " ".join(args) + "\n" + r.stderr[-2000:])
    return r.stderr


def probe(p, entries="format=duration"):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", entries, "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return r.stdout.strip()


def fl(x):
    return ("%.6f" % x).rstrip("0").rstrip(".")


def rnd(x):  # JS Math.round semantics
    return math.floor(x + 0.5)


class Grid:
    def __init__(self, bpm, t0):
        self.bpm, self.t0 = bpm, t0
        self.beat_s = 60.0 / bpm
        self.tempo = bpm / 120.0

    def cut_frame(self, i):
        if i == 0:
            return 0
        return rnd((self.t0 + CUT_BEATS[i] * self.beat_s) * FPS)

    def contact_frame(self, cut, ref):  # first real frame where local ref clock reaches ref
        return self.cut_frame(cut) + math.ceil(ref / self.tempo - 1e-9)


def peak_db(path):
    e = run(["-nostats", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"])
    m = re.findall(r"max_volume: (-?[\d.]+) dB", e)
    return float(m[-1]) if m else -99.0


def loudnorm_json(stderr):
    m = re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", stderr)
    return json.loads(m[-1])


def resolve(cues, g, film_dur_s):
    out = []
    peaks = {}
    for c in cues["cues"]:
        at, dur = c["at"], c["dur"]
        if "beat" in at:
            t = g.t0 + float(at["beat"]) * g.beat_s
            kind, contact = "beat", None
        elif "real_frames" in at:
            t = (g.cut_frame(at["cut"]) + at["real_frames"]) / FPS
            kind, contact = "wipe", None
        else:
            cf = g.contact_frame(at["cut"], at["ref"])
            t = cf / FPS
            kind, contact = "payoff", cf
        t += c.get("delay_ms", 0) / 1000.0
        if "s" in dur:
            d = float(dur["s"])
        elif "beats" in dur:
            d = float(dur["beats"]) * g.beat_s
        elif "ref" in dur:
            d = float(dur["ref"]) / g.tempo / FPS
        else:  # until
            u = dur["until"]
            d = g.contact_frame(u["cut"], u["ref"]) / FPS - t
        src = REPO / c["file"]
        if not src.is_file():
            raise SystemExit("missing " + c["file"])
        if c["file"] not in peaks:
            peaks[c["file"]] = peak_db(src)
        pk = peaks[c["file"]]
        capped = False
        if "target_db" in c:
            gain = float(c["target_db"]) - pk
            if "cap_db" in c and gain > float(c["cap_db"]):
                gain, capped = float(c["cap_db"]), True
        else:
            gain = float(c["gain_db"])
        fd = float(probe(src))
        out.append({
            "n": c["n"], "event": c["event"], "kind": kind, "file": c["file"],
            "t_s": round(t, 4), "abs_s": round(t, 4), "duration_s": round(d, 4),
            "contact_frame": contact, "contact_s": round(contact / FPS, 4) if contact is not None else None,
            "gain_db": round(gain, 2), "src_peak_db": round(pk, 2), "capped": capped,
            "fade_ms": c.get("fade_ms", 10), "trim_start_s": 0, "duck": bool(DUCK_RE.search(c["file"])),
            "source_too_short": fd < d - 0.01, "src_dur_s": round(fd, 3),
            "beat": at.get("beat"), "cut": at.get("cut"), "ref": at.get("ref"), "delay_ms": c.get("delay_ms", 0),
        })
    return out


def max_overlap(res):
    ev = []
    for r in res:
        ev.append((r["t_s"], 1))
        ev.append((r["t_s"] + r["duration_s"], -1))
    cur = best = 0
    for _, dd in sorted(ev, key=lambda x: (x[0], x[1])):
        cur += dd
        best = max(best, cur)
    return best


def pick_music(g, film_dur_s, settle_s, track_t0, bar_s):
    best = None
    for m in range(-3, 4):
        base = g.t0 + m * g.beat_s
        k = round((settle_s - base) / bar_s)
        D = base + k * bar_s
        if D < 0 or D > film_dur_s - 0.8:
            continue
        cand = (abs(D - settle_s), abs(m), m, k, D)
        if best is None or cand < best:
            best = cand
    return best  # (dist, |m|, m, k, D)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--bpm", type=float, required=True)
    ap.add_argument("--t0", type=float, required=True)
    ap.add_argument("--track", required=True)
    ap.add_argument("--tj", required=True)
    ap.add_argument("--version", required=True)
    ap.add_argument("--sheet", action="store_true")
    a = ap.parse_args()

    outdir = VER / a.version
    tmp = outdir / "tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    raw = outdir / "silent_raw.mp4"
    silent = outdir / "silent.mp4"
    film_dur = float(probe(raw))
    run(["-y", "-loglevel", "error", "-i", str(raw), "-an", "-vf", "scale=out_range=tv:out_color_matrix=bt709,format=yuv420p",
         "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-color_range", "tv", "-colorspace", "bt709", str(silent)])

    g = Grid(a.bpm, a.t0)
    cues = json.load(open(CUES, encoding="utf-8"))
    res = resolve(cues, g, film_dur)
    cut_end = g.cut_frame(6)
    settle_f = g.contact_frame(5, 98)
    tj = json.load(open(REPO / a.tj, encoding="utf-8"))
    track = REPO / a.track
    bar_s, track_t0 = float(tj["bar_s"]), float(tj["t0"])
    dist, _, m, k, D = pick_music(g, film_dur, settle_f / FPS, track_t0, bar_s)
    off = track_t0 - (g.t0 + m * g.beat_s)
    pre = ["-ss", fl(off)] if off >= 0 else []
    lead = "" if off >= 0 else "adelay=%d|%d," % (round(-off * 1000), round(-off * 1000))
    tail_fade_d = 0.6
    (outdir / "cues-resolved.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")

    # 1. Bed: pass 1 measure; pass 2 -18 LUFS, 0.4 s fade in, exp fade from the resolving downbeat D
    p1 = run(["-nostats"] + pre + ["-i", str(track), "-t", fl(film_dur), "-af",
             lead + "afade=t=in:st=0:d=0.4,loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    j1 = loudnorm_json(p1)
    bed = tmp / "bed.wav"
    run(["-y", "-loglevel", "error"] + pre + ["-i", str(track), "-t", fl(film_dur), "-af",
        lead + "afade=t=in:st=0:d=0.4,loudnorm=I=-18:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:"
        "measured_thresh=%s:offset=%s:linear=false,afade=t=out:st=%s:d=%s:curve=exp"
        % (j1["input_i"], j1["input_tp"], j1["input_lra"], j1["input_thresh"], j1["target_offset"], fl(D), fl(tail_fade_d)),
        "-ar", "48000", "-ac", "2", "-c:a", "pcm_f32le", str(bed)])

    # 2. Cue graph: bed with -3 dB dips (150 ms) under duck cues; cues gained, faded, delayed; summed in chunks of 12
    inputs = ["-i", str(bed)]
    fc, labels, dips = [], [], []
    for idx0, r in enumerate(res):
        idx = idx0 + 1
        inputs += ["-i", str(REPO / r["file"])]
        ms = int(round(r["t_s"] * 1000))
        d = r["duration_s"]
        fd = r["fade_ms"] / 1000.0
        chain = ("[%d:a]atrim=start=0:duration=%s,asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,"
                 "volume=%sdB,afade=t=in:st=0:d=0.003" % (idx, fl(d), fl(r["gain_db"])))
        if fd > 0:
            chain += ",afade=t=out:st=%s:d=%s" % (fl(max(0.0, d - fd)), fl(min(fd, d)))
        chain += ",adelay=%d|%d[c%d]" % (ms, ms, idx)
        fc.append(chain)
        labels.append("[c%d]" % idx)
        if r["duck"]:
            dips.append("between(t\\,%s\\,%s)" % (fl(r["t_s"]), fl(r["t_s"] + 0.15)))
    bedf = "[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,atrim=duration=%s" % fl(film_dur)
    if dips:
        bedf += ",volume=enable='%s':volume=0.708" % "+".join(dips)
    fc.insert(0, bedf + "[bed]")
    chunks = []
    for gi in range(0, len(labels), 12):
        grp = labels[gi:gi + 12]
        fc.append("".join(grp) + "amix=inputs=%d:normalize=0:duration=longest:dropout_transition=0[m%d]" % (len(grp), len(chunks)))
        chunks.append("[m%d]" % len(chunks))
    fc.append("[bed]" + "".join(chunks) + "amix=inputs=%d:normalize=0:duration=first:dropout_transition=0[aout]" % (len(chunks) + 1))
    script = tmp / "graph.txt"
    script.write_text(";\n".join(fc), encoding="utf-8")
    summ = tmp / "sum.wav"
    run(["-y", "-loglevel", "error"] + inputs + ["-filter_complex_script", str(script), "-map", "[aout]", "-t", fl(film_dur),
        "-c:a", "pcm_f32le", "-ar", "48000", "-ac", "2", str(summ)])

    # 3. Master: loudnorm -14 LUFS, TP -1.5; exp tail chosen so the last 0.25 s peak is below -50 dBFS
    p2 = run(["-nostats", "-i", str(summ), "-t", fl(film_dur), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    j2 = loudnorm_json(p2)
    final = tmp / "final.wav"
    tail_used = None
    for tail in (0.35, 0.6, 1.0):
        run(["-y", "-loglevel", "error", "-i", str(summ), "-t", fl(film_dur), "-af",
            "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:"
            "offset=%s:linear=false,afade=t=out:st=%s:d=%s:curve=exp,alimiter=limit=0.75:attack=3:release=60:level=disabled"
            % (j2["input_i"], j2["input_tp"], j2["input_lra"], j2["input_thresh"], j2["target_offset"], fl(film_dur - tail), fl(tail)),
            "-ar", "48000", "-ac", "2", "-c:a", "pcm_s24le", str(final)])
        tl = run(["-nostats", "-sseof", "-0.25", "-i", str(final), "-af", "astats=measure_overall=Peak_level", "-f", "null", "-"])
        pk = re.findall(r"Peak level dB: (-?[\d.]+|-inf)", tl)
        tail_used = tail
        if pk and (pk[-1] == "-inf" or float(pk[-1]) < -50.0):
            break

    # 4. Encode
    outmp4 = outdir / ("social-9x16-v5-%s.mp4" % a.slug)
    run(["-y", "-loglevel", "error", "-i", str(silent), "-i", str(final), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
        "-color_range", "tv", "-colorspace", "bt709", "-c:a", "aac", "-b:a", "192k", "-t", fl(film_dur), "-movflags", "+faststart", str(outmp4)])

    # 5. Verify
    ebu = run(["-nostats", "-i", str(outmp4), "-af", "ebur128=peak=true", "-f", "null", "-"])
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", ebu)
    TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", ebu)
    tl = run(["-nostats", "-sseof", "-0.25", "-i", str(outmp4), "-af", "astats=measure_overall=Peak_level+RMS_level", "-f", "null", "-"])
    tail_pk = re.findall(r"Peak level dB: (-?[\d.]+|-inf)", tl)
    vpf = probe(outmp4, "stream=pix_fmt,color_range")
    payoff_rows = [{"event": r["event"], "cue_s": r["t_s"], "contact_frame": r["contact_frame"], "contact_s": r["contact_s"],
                    "delta_ms": round((r["t_s"] - r["contact_s"]) * 1000, 1)} for r in res if r["kind"] == "payoff"]
    verify = {
        "file": outmp4.name, "film_dur_s": round(film_dur, 3), "file_dur_s": round(float(probe(outmp4)), 3),
        "film_end_frame": round(film_dur * FPS), "cut_frames": [g.cut_frame(i) for i in range(7)],
        "integrated_lufs": I[-1] if I else None, "true_peak_dbtp": TP[-1] if TP else None,
        "last_0_25s_peak_db": tail_pk[-1] if tail_pk else None, "exp_tail_s_used": tail_used,
        "video_pix_fmt_range": vpf, "cues_total": len(res), "cues_source_too_short": sum(1 for r in res if r["source_too_short"]),
        "cues_capped": [r["event"] for r in res if r["capped"]],
        "max_simultaneous_cues": max_overlap(res), "ducked_cues": sum(1 for r in res if r["duck"]),
        "music": {"m_beats_shift": m, "bar_index_k": k, "downbeat_film_s": round(D, 4), "settle_film_s": round(settle_f / FPS, 4),
                  "downbeat_minus_settle_ms": round((D - settle_f / FPS) * 1000, 1), "track_offset_s": round(off, 5),
                  "bed_pass1_I": j1["input_i"], "master_pass1_I": j2["input_i"]},
        "payoffs": payoff_rows,
    }
    (outdir / "verify.json").write_text(json.dumps(verify, ensure_ascii=False, indent=1), encoding="utf-8")
    version = {
        "film": "pencil-social", "version": a.version, "date": "2026-10-13", "cues_file": "media/film-versions/pencil-social/v5-cues/cues-9x16.json",
        "BPM": a.bpm, "T0_S": a.t0, "track": a.track, "track_t0_s": track_t0, "silent_render": "silent.mp4",
        "renderer": "remotion Social9x16 --props BPM/T0_S (silent_raw.mp4 -> silent.mp4 yuv420p tv)", "file": outmp4.name,
        "notes": "Personal test only. v5 payoff cue sheet, music shifted %d beats (downbeat at settle). Bed -18 LUFS, duck -3 dB 150 ms under impact/stamp/stinger/ding, final -14 LUFS TP -1.5, exp tails." % m,
    }
    (outdir / "VERSION.json").write_text(json.dumps(version, ensure_ascii=False, indent=1), encoding="utf-8")
    (outdir / "render.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
    if a.sheet:
        cf = [r["contact_frame"] for r in res if r["kind"] == "payoff"]
        picks = sorted(set([0] + cf + [round(film_dur * FPS) - 1]))[:12]
        sel = "+".join("eq(n\\,%d)" % p for p in picks)
        run(["-y", "-loglevel", "error", "-i", str(silent), "-vf", "select='%s',scale=270:-2,tile=6x2" % sel,
            "-frames:v", "1", "-q:v", "3", str(outdir / "sheet.jpg")])
    print(json.dumps(verify, ensure_ascii=False))


if __name__ == "__main__":
    main()
