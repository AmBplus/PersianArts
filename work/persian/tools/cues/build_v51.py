# Build one v5.1 social film (new file; v5 build untouched).
# Resolves cues-9x16-v51.json for (BPM, T0), splits the music bed for the CTA settle, mixes (ffmpeg only), verifies.
# Usage: python -I build_v51.py --slug lnplus-597024 --bpm 110 --t0 0.02722 --track <mp3> --tj <music.json> [--sheet]
import argparse, array, json, math, os, re, shutil, subprocess
from pathlib import Path

REPO = Path(os.environ["PA_REPO"]) if os.environ.get("PA_REPO") else Path(__file__).resolve().parents[4]
VER = REPO / "media/film-versions/pencil-social"
CUES = VER / "v51-cues/cues-9x16-v51.json"
CUES_V5 = VER / "v5-cues/cues-9x16.json"
CUT_BEATS = [0, 4, 8, 14, 20, 27, 36]
FPS = 30
SR = 48000
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

    def contact_frame(self, cut, ref):
        return self.cut_frame(cut) + math.ceil(ref / self.tempo - 1e-9)


def peak_db(path):
    e = run(["-nostats", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"])
    m = re.findall(r"max_volume: (-?[\d.]+) dB", e)
    return float(m[-1]) if m else -99.0


def loudnorm_json(stderr):
    m = re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", stderr)
    return json.loads(m[-1])


def resolve(cues, g):
    out, peaks = [], {}
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
        else:
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
        duck = bool(c.get("duck", DUCK_RE.search(c["file"]) is not None))
        out.append({
            "n": c["n"], "event": c["event"], "kind": kind, "file": c["file"],
            "t_s": round(t, 4), "duration_s": round(d, 4),
            "contact_frame": contact, "contact_s": round(contact / FPS, 4) if contact is not None else None,
            "gain_db": round(gain, 2), "src_peak_db": round(pk, 2), "capped": capped,
            "fade_ms": c.get("fade_ms", 10), "duck": duck,
            "source_too_short": fd < d - 0.01, "src_dur_s": round(fd, 3),
            "delay_ms": c.get("delay_ms", 0),
        })
    return out


def max_overlap_requested(res):
    """Legacy count: cues by requested duration (what v5 reported)."""
    ev = []
    for r in res:
        ev.append((r["t_s"], 1))
        ev.append((r["t_s"] + r["duration_s"], -1))
    cur = best = 0
    for _, dd in sorted(ev, key=lambda x: (x[0], x[1])):
        cur += dd
        best = max(best, cur)
    return best


def audible_bins(res):
    """Clip audibility: real clip span (min of file duration and requested duration), 10 ms windows,
    audible when window peak >= clip peak - 30 dB. Returns (max simultaneous, bins dict of count>3 examples)."""
    counts = {}
    per_cue = []
    for r in res:
        span = min(r["src_dur_s"], r["duration_s"])
        r8 = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(REPO / r["file"]), "-t", fl(span),
                             "-ac", "1", "-ar", "8000", "-f", "f32le", "pipe:1"], capture_output=True)
        a = array.array("f")
        a.frombytes(r8.stdout)
        if not len(a):
            per_cue.append(set())
            continue
        pk = max(abs(x) for x in a)
        thr = pk * 10 ** (-30 / 20.0)
        bins = set()
        for w in range(0, len(a), 80):
            if max(abs(x) for x in a[w:w + 80]) >= thr:
                bins.add(int(round((r["t_s"] + w / 8000.0) * 100)))
        per_cue.append(bins)
    for bs in per_cue:
        for b in bs:
            counts[b] = counts.get(b, 0) + 1
    best = max(counts.values()) if counts else 0
    hot = sorted(b for b, c in counts.items() if c == best)
    who = {}
    for b in hot:
        who[round(b / 100.0, 2)] = [res[i]["n"] for i, bs in enumerate(per_cue) if b in bs]
    return best, {"window_s": [round(hot[0] / 100.0, 2), round(hot[-1] / 100.0, 2)] if hot else None,
                  "cues_at_first_hot": list(who.values())[0] if who else None}


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
    return best


def rms_window(a, s0, s1):
    acc = 0.0
    for i in range(2 * s0, 2 * s1):
        acc += a[i] * a[i]
    return acc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--bpm", type=float, required=True)
    ap.add_argument("--t0", type=float, required=True)
    ap.add_argument("--track", required=True)
    ap.add_argument("--tj", required=True)
    ap.add_argument("--sheet", action="store_true")
    a = ap.parse_args()

    v5 = VER / ("v5-%s" % a.slug)
    outdir = VER / ("v51-%s" % a.slug)
    tmp = outdir / "tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    silent = outdir / "silent.mp4"
    shutil.copy(v5 / "silent.mp4", silent)  # reuse v5 silent render (no re-render)
    film_dur = float(probe(v5 / "silent_raw.mp4"))

    g = Grid(a.bpm, a.t0)
    cues = json.load(open(CUES, encoding="utf-8"))
    res = resolve(cues, g)
    res_v5 = resolve(json.load(open(CUES_V5, encoding="utf-8")), g)
    before_req = max_overlap_requested(res_v5)
    before_aud, before_hot = audible_bins(res_v5)
    after_req = max_overlap_requested(res)
    after_aud, after_hot = audible_bins(res)

    settle_f = g.contact_frame(5, 98)
    settle_s = settle_f / FPS
    tj = json.load(open(REPO / a.tj, encoding="utf-8"))
    track = REPO / a.track
    bar_s, track_t0 = float(tj["bar_s"]), float(tj["t0"])
    dist, _, m, k, D = pick_music(g, film_dur, settle_s, track_t0, bar_s)
    off = track_t0 - (g.t0 + m * g.beat_s)  # track time at film t=0 is off
    delta = D - settle_s  # music downbeat minus settle; copy B is advanced by delta
    (outdir / "cues-resolved.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")

    def pre(x):
        return ["-ss", fl(x)] if x >= 0 else []

    # 1. Bed copies. Copy A = beat-locked (cuts). Copy B = same track advanced by delta (downbeat on settle).
    chain = "afade=t=in:st=0:d=0.4,loudnorm=I=-18:TP=-1.5:LRA=11"
    p1 = run(["-nostats"] + pre(off) + ["-i", str(track), "-t", fl(film_dur), "-af", chain + ":print_format=json", "-f", "null", "-"])
    j1 = loudnorm_json(p1)
    lchain = ("afade=t=in:st=0:d=0.4,loudnorm=I=-18:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:"
              "measured_thresh=%s:offset=%s:linear=false" % (j1["input_i"], j1["input_tp"], j1["input_lra"],
                                                            j1["input_thresh"], j1["target_offset"]))
    bedA, bedB = tmp / "bedA.raw", tmp / "bedB.raw"
    for path, start in ((bedA, off), (bedB, off + delta)):
        run(["-y", "-loglevel", "error"] + pre(start) + ["-i", str(track), "-t", fl(film_dur), "-af", lchain,
             "-ar", str(SR), "-ac", "2", "-f", "f32le", str(path)])
    A = array.array("f"); A.frombytes(open(bedA, "rb").read())
    B = array.array("f"); B.frombytes(open(bedB, "rb").read())
    nS = min(len(A), len(B)) // 2

    # choose the quietest 0.2 s centre between cut 5 (+0.2 s) and the settle (-0.2 s) for the A->B crossfade
    cut5 = g.cut_frame(5) / FPS
    lo, hi = cut5 + 0.25, settle_s - 0.25
    best_t, best_r = None, None
    t = lo
    while t <= hi:
        c = int(t * SR)
        r = rms_window(A, c - int(0.1 * SR), c + int(0.1 * SR))
        if best_r is None or r < best_r:
            best_t, best_r = t, r
        t += 0.01
    Tc = best_t
    XF = 0.08
    s0, s1 = int((Tc - XF / 2) * SR), int((Tc + XF / 2) * SR)
    spliced = array.array("f", A[: 2 * s0])
    L = s1 - s0
    for i in range(L):
        w = i / float(L)
        j = 2 * (s0 + i)
        spliced.append(A[j] * (1 - w) + B[j] * w)
        spliced.append(A[j + 1] * (1 - w) + B[j + 1] * w)
    spliced.extend(B[2 * s1: 2 * nS])
    spl_raw = tmp / "bed_spliced.raw"
    spl_raw.write_bytes(spliced.tobytes())
    bed = tmp / "bed.wav"
    # exp tail from the settle (= copy B downbeat), 0.6 s
    run(["-y", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", str(spl_raw), "-t", fl(film_dur),
         "-af", "afade=t=out:st=%s:d=0.6:curve=exp" % fl(settle_s), "-ar", str(SR), "-ac", "2", "-c:a", "pcm_f32le", str(bed)])

    # 2. Cue graph
    inputs = ["-i", str(bed)]
    fc, labels, dips = [], [], []
    for idx0, r in enumerate(res):
        idx = idx0 + 1
        inputs += ["-i", str(REPO / r["file"])]
        ms = int(round(r["t_s"] * 1000))
        d = r["duration_s"]
        fd = r["fade_ms"] / 1000.0
        ch = ("[%d:a]atrim=start=0:duration=%s,asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,"
              "volume=%sdB,afade=t=in:st=0:d=0.003" % (idx, fl(d), fl(r["gain_db"])))
        if fd > 0:
            ch += ",afade=t=out:st=%s:d=%s" % (fl(max(0.0, d - fd)), fl(min(fd, d)))
        ch += ",adelay=%d|%d[c%d]" % (ms, ms, idx)
        fc.append(ch)
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
         "-c:a", "pcm_f32le", "-ar", str(SR), "-ac", "2", str(summ)])

    # 3. Master: -14 LUFS, TP -1.5; exp tail chosen so the last 0.25 s peak is below -50 dBFS
    p2 = run(["-nostats", "-i", str(summ), "-t", fl(film_dur), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    j2 = loudnorm_json(p2)
    final = tmp / "final.wav"
    tail_used = None
    for tail in (0.35, 0.6, 1.0):
        run(["-y", "-loglevel", "error", "-i", str(summ), "-t", fl(film_dur), "-af",
             "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:"
             "offset=%s:linear=false,afade=t=out:st=%s:d=%s:curve=exp,alimiter=limit=0.75:attack=3:release=60:level=disabled"
             % (j2["input_i"], j2["input_tp"], j2["input_lra"], j2["input_thresh"], j2["target_offset"], fl(film_dur - tail), fl(tail)),
             "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s24le", str(final)])
        tl = run(["-nostats", "-sseof", "-0.25", "-i", str(final), "-af", "astats=measure_overall=Peak_level", "-f", "null", "-"])
        pk = re.findall(r"Peak level dB: (-?[\d.]+|-inf)", tl)
        tail_used = tail
        if pk and (pk[-1] == "-inf" or float(pk[-1]) < -50.0):
            break

    # 4. Encode
    outmp4 = outdir / ("social-9x16-v51-%s.mp4" % a.slug)
    run(["-y", "-loglevel", "error", "-i", str(silent), "-i", str(final), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
         "-color_range", "tv", "-colorspace", "bt709", "-c:a", "aac", "-b:a", "192k", "-t", fl(film_dur), "-movflags", "+faststart", str(outmp4)])

    # 5. Verify
    ebu = run(["-nostats", "-i", str(outmp4), "-af", "ebur128=peak=true", "-f", "null", "-"])
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", ebu)
    TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", ebu)
    tl = run(["-nostats", "-sseof", "-0.25", "-i", str(outmp4), "-af", "astats=measure_overall=Peak_level+RMS_level", "-f", "null", "-"])
    tail_pk = re.findall(r"Peak level dB: (-?[\d.]+|-inf)", tl)
    vpf = probe(outmp4, "stream=pix_fmt,color_range")
    cut_err = []
    for i in range(1, 6):
        ct = g.cut_frame(i) / FPS
        nb = min((g.t0 + n * g.beat_s for n in range(0, 80)), key=lambda x: abs(x - ct))
        cut_err.append({"cut": i, "cut_s": round(ct, 4), "beat_s": round(nb, 4), "err_ms": round((ct - nb) * 1000, 1),
                        "copy": "A" if ct < Tc else "B"})
    payoff_rows = [{"event": r["event"], "cue_s": r["t_s"], "contact_s": r["contact_s"],
                    "delta_ms": round((r["t_s"] - r["contact_s"]) * 1000, 1)} for r in res if r["kind"] == "payoff"]
    verify = {
        "file": outmp4.name, "film_dur_s": round(film_dur, 3), "file_dur_s": round(float(probe(outmp4)), 3),
        "integrated_lufs": I[-1] if I else None, "true_peak_dbtp": TP[-1] if TP else None,
        "last_0_25s_peak_db": tail_pk[-1] if tail_pk else None, "exp_tail_s_used": tail_used,
        "video_pix_fmt_range": vpf, "cues_total": len(res), "cues_source_too_short": sum(1 for r in res if r["source_too_short"]),
        "max_simultaneous": {"v5_requested_dur": before_req, "v5_audible_30dB": before_aud,
                              "v51_requested_dur": after_req, "v51_audible_30dB": after_aud, "v51_audible_window_s": after_hot},
        "music": {"m_beats_shift": m, "bar_index_k": k, "downbeat_copyA_film_s": round(D, 4), "settle_film_s": round(settle_s, 4),
                  "downbeat_minus_settle_ms_v5": round(delta * 1000, 1), "copyB_advance_s": round(delta, 5),
                  "copyB_downbeat_minus_settle_ms": 0.0, "crossfade_centre_s": round(Tc, 3), "crossfade_ms": int(XF * 1000),
                  "bed_pass1_I": j1["input_i"], "master_pass1_I": j2["input_i"]},
        "cut_to_beat": cut_err,
        "payoffs": payoff_rows,
    }
    (outdir / "verify.json").write_text(json.dumps(verify, ensure_ascii=False, indent=1), encoding="utf-8")
    version = {
        "film": "pencil-social", "version": "v51-%s" % a.slug, "date": "2026-10-13",
        "cues_file": "media/film-versions/pencil-social/v51-cues/cues-9x16-v51.json",
        "BPM": a.bpm, "T0_S": a.t0, "track": a.track, "track_t0_s": track_t0, "silent_render": "silent.mp4 (copied from v5, not re-rendered)",
        "file": outmp4.name,
        "notes": "Personal test only. v5.1 fix round. Bed -18 LUFS, ducking -3 dB 150 ms, final -14 LUFS TP -1.5, exp tails. CTA: copy B advanced %.3f s so downbeat = settle; crossfade 80 ms at %.3f s." % (delta, Tc),
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
