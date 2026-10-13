# Generic sound builder: the "pencil method" (owner's favourite film) working from the tracked sound kit.
#
# METHOD (preserved from build_html_v2.py / build_v51.py):
#  1. EVENTS (name, type, contact time t in s [or frame], intensity, role, optional variant/dur_s) come from the film.
#  2. RULE TABLE (rules.json) maps each event type to LAYERED cues:
#       anticipation (riser / tick-rise, before the hit)  ->  hit (sub boom + transient/stamp at the contact frame, +0 ms)
#       ->  ring (bell / ding / chime, +60..+150 ms)  ->  tail.
#     Clip choice is by kit id (or category + seeded pick). Gain = fixed dB or a PEAK TARGET (target_db, optional cap_db).
#     Each cue is trimmed to dur, faded out, delayed to its time. Transitions get a whoosh at cut-5 frames (wipe start).
#  3. DUCKING: bed -3 dB for 150 ms under every cue flagged duck (hit/stinger/ding/impact categories by default).
#  4. LIMITS: audible simultaneous cues <= 3 (clip span, 10 ms bins, audible = within 30 dB of the clip peak),
#     no clip used more than 3 times (reported; first variant wins, no silent substitution).
#  5. MUSIC BED: kit music excerpt, loudnorm -18 LUFS (2-pass), fade-in 0.4 s. A bar DOWNBEAT is aligned to the settle
#     event (offset chosen by searching downbeats). Cuts stay beat-locked via the two-copy trick: copy A (beat-locked)
#     up to the quietest 0.2 s before the settle, an 80 ms crossfade, then copy B advanced so its downbeat = settle.
#     If there is no settle event or no cut list, a plain beat-locked offset is used. Cut-to-beat error is reported.
#  6. ENDING: exp fade of the bed from the settle (0.6 s); master tail: exp fade of the sum, tail length chosen from
#     (0.35, 0.6, 1.0 s) until the last 0.25 s peak < -50 dBFS.
#  7. MASTER: sum -> loudnorm -14 LUFS (2-pass, TP -1.5) -> limiter; AAC 192k, video stream copy, audio = video length.
#
# Pure standard library + ffmpeg/ffprobe on PATH. Run: sound/.venv/Scripts/python.exe -I sound/tools/mixer/build_sound.py ...
import argparse, array, hashlib, json, math, os, random, re, subprocess, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
SR = 48000
LOG = []


def run(args, binary="ffmpeg"):
    LOG.append(binary + " " + " ".join(str(a) for a in args))
    r = subprocess.run([binary, "-hide_banner"] + [str(a) for a in args], capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise SystemExit("ffmpeg failed: " + " ".join(str(a) for a in args) + "\n" + r.stderr[-1500:])
    return r.stderr


def probe(p, entries="format=duration"):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", entries, "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return r.stdout.strip()


def fl(x):
    return ("%.6f" % x).rstrip("0").rstrip(".") or "0"


def loudnorm_json(stderr):
    return json.loads(re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", stderr)[-1])


def peak_db(path):
    e = run(["-nostats", "-i", path, "-af", "volumedetect", "-f", "null", "-"])
    m = re.findall(r"max_volume: (-?[\d.]+) dB", e)
    return float(m[-1]) if m else -99.0


class Kit:
    def __init__(self):
        kit = REPO / "sound/library/kit"
        self.cat = {e["id"]: e for e in json.load(open(kit / "catalog.json", encoding="utf-8"))["entries"]}
        self.by_category = {}
        for e in self.cat.values():
            self.by_category.setdefault(e["category"], []).append(e["id"])
        self.peaks = {}

    def path(self, cid):
        if cid not in self.cat:
            raise SystemExit("kit id not in catalog: " + cid)
        p = REPO / self.cat[cid]["path"]
        if not p.is_file():
            raise SystemExit("kit file missing: " + str(p))
        return p

    def peak(self, cid):
        if cid not in self.peaks:
            self.peaks[cid] = peak_db(self.path(cid))
        return self.peaks[cid]


def resolve_rule(rules, ev, counters):
    """Return the layer list for an event (variant / alias / cycle handled)."""
    typ = ev["type"]
    rt = rules["types"].get(typ)
    if rt is None:
        return None
    seen = 0
    while "alias" in rt and seen < 5:
        typ = rt["alias"]; rt = rules["types"][typ]; seen += 1
    var = ev.get("variant")
    if var and var in rt.get("variants", {}):
        return rt["variants"][var]["layers"]
    if "cycle" in rt:
        i = counters.get(typ, 0); counters[typ] = i + 1
        return rt["cycle"][i % len(rt["cycle"])]["layers"]
    return rt["layers"]


def expand(events_doc, rules, kit, seed, fps):
    evs = []
    for e in events_doc["events"]:
        e = dict(e)
        e["contact_s"] = e["t_s"] if "t_s" in e else e["frame"] / float(fps)
        evs.append(e)
    # auto transitions at cut - lead frames (wipe start) unless explicit transition events exist
    cuts = events_doc.get("cut_frames") or []
    dur_f = events_doc.get("duration_frames") or 10 ** 9
    lead = rules.get("auto", {}).get("transition_lead_frames", 5)
    if not any(e["type"] in ("transition", "whoosh") for e in evs):
        for i, cf in enumerate(cuts):
            if 0 < cf < dur_f:
                evs.append({"name": "auto transition cut %d" % i, "type": "transition", "contact_s": (cf - lead) / float(fps), "auto": True})
    evs.sort(key=lambda x: x["contact_s"])
    rng = random.Random(seed)
    counters, cues, skipped = {}, [], []
    for e in evs:
        layers = resolve_rule(rules, e, counters)
        if layers is None:
            skipped.append({"event": e["name"], "type": e["type"], "reason": "no rule"})
            continue
        for L in layers:
            cid = L.get("clip")
            if cid is None:
                pool = sorted(kit.by_category.get(L["category"], []))
                if not pool:
                    skipped.append({"event": e["name"], "type": e["type"], "reason": "empty category " + L["category"]}); continue
                cid = rng.choice(pool)
            src = kit.path(cid)
            pk = kit.peak(cid)
            if "target_db" in L:
                gain = float(L["target_db"]) - pk
                capped = False
                if "cap_db" in L and gain > float(L["cap_db"]):
                    gain, capped = float(L["cap_db"]), True
            else:
                gain, capped = float(L.get("gain_db", 0)), False
            if e.get("intensity") is not None and L.get("role") in ("hit", "ring"):
                gain += (float(e["intensity"]) - 0.5) * 6.0  # intensity 0..1 -> +-3 dB around the rule gain
            fd = float(probe(src))
            if L.get("span"):
                d = float(e.get("dur_s", fd))
            else:
                d = float(L.get("dur_s", fd))
            t = e["contact_s"] + L.get("offset_ms", 0) / 1000.0
            cat = kit.cat[cid]["category"]
            duck = L["duck"] if "duck" in L else (cat in rules.get("duck_categories", []))
            cues.append({"event": e["name"], "type": e["type"], "role": L.get("role", "hit"), "clip": cid, "file": kit.cat[cid]["path"],
                         "t_s": round(t, 4), "duration_s": round(d, 4), "contact_s": round(e["contact_s"], 4),
                         "offset_ms": L.get("offset_ms", 0), "gain_db": round(gain, 2), "src_peak_db": round(pk, 2), "capped": capped,
                         "fade_ms": L.get("fade_ms", 10), "duck": bool(duck), "source_too_short": fd < d - 0.01, "src_dur_s": round(fd, 3)})
    for i, c in enumerate(cues):
        c["n"] = i + 1
    return cues, skipped


def audible_max(cues, kit):
    counts, per = {}, []
    for c in cues:
        span = min(c["src_dur_s"], c["duration_s"])
        r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(REPO / c["file"]), "-t", fl(span), "-ac", "1", "-ar", "8000", "-f", "f32le", "pipe:1"], capture_output=True)
        a = array.array("f"); a.frombytes(r.stdout)
        if not len(a):
            per.append(set()); continue
        thr = max(abs(x) for x in a) * 10 ** (-30 / 20.0)
        bins = set()
        for w in range(0, len(a), 80):
            if max(abs(x) for x in a[w:w + 80]) >= thr:
                bins.add(int(round((c["t_s"] + w / 8000.0) * 100)))
        per.append(bins)
    for bs in per:
        for b in bs:
            counts[b] = counts.get(b, 0) + 1
    best = max(counts.values()) if counts else 0
    hot = sorted(b for b, n in counts.items() if n == best)
    return best, (round(hot[0] / 100.0, 2) if hot else None)


def rms_window(a, s0, s1):
    return sum(a[i] * a[i] for i in range(2 * s0, 2 * s1))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--film", required=True, help="silent video mp4")
    ap.add_argument("--events", required=True)
    ap.add_argument("--track", required=True, help="kit music id, e.g. tr-lnplus-597024 (or lnplus-597024)")
    ap.add_argument("--rules", default=str(Path(__file__).with_name("rules.default.json")))
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--bpm", type=float)
    ap.add_argument("--t0", type=float)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--loop", action="store_true", help="loop mode (also events.json loop:true): no bed fade-in/out, circular 2-beat crossfade, cues ringing over the end wrap to the start, no exp tail")
    a = ap.parse_args()

    out = Path(a.out_dir); tmp = out / "tmp"; tmp.mkdir(parents=True, exist_ok=True)
    film = Path(a.film)
    film_dur = float(probe(film))
    wh = probe(film, "stream=width,height").split("\n")[0].split(",")
    w_, h_ = int(wh[0]), int(wh[1]); gg = math.gcd(w_, h_)
    ratio = "%dx%d" % (w_ // gg, h_ // gg)
    evdoc = json.load(open(a.events, encoding="utf-8"))
    rules = json.load(open(a.rules, encoding="utf-8"))
    fps = float(evdoc.get("fps", 30))
    loop = bool(a.loop or evdoc.get("loop"))
    kit = Kit()

    # music map
    mid = re.sub(r"^tr-", "", a.track)
    mdir = REPO / "sound/library/kit/music"
    track = mdir / (mid + ".ogg")
    tj = json.load(open(mdir / (mid + ".music.json"), encoding="utf-8"))
    bpm = a.bpm or evdoc.get("bpm") or tj["bpm"]
    t0f = a.t0 if a.t0 is not None else evdoc.get("t0_s", tj["t0"])  # film time of a beat (cut grid)
    beat_s = 60.0 / bpm
    track_t0, bar_s = float(tj["t0"]), float(tj["bar_s"]) * (tj["bpm"] / bpm)

    cues, skipped = expand(evdoc, rules, kit, a.seed, fps)
    (out / "cues-resolved.json").write_text(json.dumps(cues, ensure_ascii=False, indent=1), encoding="utf-8")
    sim, sim_at = audible_max(cues, kit)
    uses = {}
    for c in cues:
        uses[c["clip"]] = uses.get(c["clip"], 0) + 1
    over = {k: v for k, v in uses.items() if v > 3}

    # settle
    # L-a: ONLY role == "final" or ends_film: true ends the bed; a plain type "settle" event never does
    settle_ev = [e for e in evdoc["events"] if e.get("role") == "final" or e.get("ends_film") is True]
    settle_s = None
    if settle_ev:
        e = settle_ev[-1]; settle_s = e["t_s"] if "t_s" in e else e["frame"] / fps
    if loop:
        settle_s = None  # a loop has no final settle: nothing ends the bed
    cut_s = [cf / fps for cf in (evdoc.get("cut_frames") or []) if 0 < cf / fps < film_dur - 0.2]

    # music offset / alignment
    m = k = 0; D = delta = None
    if settle_s is not None:
        best = None
        for mm in range(-3, 4):
            base = t0f + mm * beat_s
            kk = round((settle_s - base) / bar_s)
            DD = base + kk * bar_s
            if DD < 0 or DD > film_dur - 0.8:
                continue
            cand = (round(abs(DD - settle_s), 3), abs(mm), mm, kk, DD)  # 1 ms tie window: prefer smaller |m|, then earlier
            if best is None or cand < best:
                best = cand
        if best:
            _, _, m, k, D = best; delta = D - settle_s
    off = track_t0 - (t0f + m * beat_s)

    def pre(x):
        return ["-ss", fl(x)] if x >= 0 else []

    fadein = "" if loop else "afade=t=in:st=0:d=0.4,"
    chain = fadein + "loudnorm=I=-18:TP=-1.5:LRA=11"
    j1 = loudnorm_json(run(["-nostats"] + pre(off) + ["-i", track, "-t", fl(film_dur), "-af", chain + ":print_format=json", "-f", "null", "-"]))
    lchain = (fadein + "loudnorm=I=-18:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s:linear=false"
              % (j1["input_i"], j1["input_tp"], j1["input_lra"], j1["input_thresh"], j1["target_offset"]))
    two_copy = settle_s is not None and delta is not None and abs(delta) > 0.001 and bool(cut_s)
    Tc = None
    spl = tmp / "bed_spliced.raw"
    bedA = tmp / "bedA.raw"
    XF = 2 * beat_s
    run(["-y", "-loglevel", "error"] + pre(off) + ["-i", track, "-t", fl(film_dur + (XF if loop else 0)), "-af", lchain, "-ar", SR, "-ac", 2, "-f", "f32le", bedA])
    if loop:  # circular crossfade: the music continuing past the end is blended into the head, so the last beat flows into the first
        Af = array.array("f"); Af.frombytes(open(bedA, "rb").read())
        nL = int(film_dur * SR); nX = int(XF * SR)
        if len(Af) >= 2 * (nL + nX):
            for i in range(nX):
                wgt = i / float(nX)
                for ch_ in (0, 1):
                    Af[2 * i + ch_] = Af[2 * i + ch_] * wgt + Af[2 * (nL + i) + ch_] * (1 - wgt)
            Af = Af[: 2 * nL]
            open(bedA, "wb").write(Af.tobytes())
    if two_copy:
        bedB = tmp / "bedB.raw"
        run(["-y", "-loglevel", "error"] + pre(off + delta) + ["-i", track, "-t", fl(film_dur), "-af", lchain, "-ar", SR, "-ac", 2, "-f", "f32le", bedB])
        A = array.array("f"); A.frombytes(open(bedA, "rb").read())
        B = array.array("f"); B.frombytes(open(bedB, "rb").read())
        nS = min(len(A), len(B)) // 2
        prev_cut = max([c for c in cut_s if c < settle_s] or [0.0])
        lo, hi = prev_cut + 0.25, settle_s - 0.25
        if hi <= lo:
            lo, hi = max(0.3, settle_s - 1.0), settle_s - 0.2
        best_t = best_r = None
        t = lo
        while t <= hi:
            c = int(t * SR); r = rms_window(A, c - int(0.1 * SR), c + int(0.1 * SR))
            if best_r is None or r < best_r:
                best_t, best_r = t, r
            t += 0.01
        Tc = best_t; XF = 0.08
        s0, s1 = int((Tc - XF / 2) * SR), int((Tc + XF / 2) * SR)
        sp = array.array("f", A[: 2 * s0]); L = s1 - s0
        for i in range(L):
            wgt = i / float(L); j = 2 * (s0 + i)
            sp.append(A[j] * (1 - wgt) + B[j] * wgt); sp.append(A[j + 1] * (1 - wgt) + B[j + 1] * wgt)
        sp.extend(B[2 * s1: 2 * nS])
        spl.write_bytes(sp.tobytes())
    else:
        spl = bedA
    bed = tmp / "bed.wav"
    fade_from = settle_s if settle_s is not None else max(0.0, film_dur - 0.6)
    run(["-y", "-loglevel", "error", "-f", "f32le", "-ar", SR, "-ac", 2, "-i", spl, "-t", fl(film_dur), "-af",
         "anull" if loop else "afade=t=out:st=%s:d=0.6:curve=exp" % fl(fade_from), "-ar", SR, "-ac", 2, "-c:a", "pcm_f32le", bed])

    # L-a self-check: the bed must not be silent (< -40 dB RMS) for > 1.5 s before the film end
    bedraw = tmp / "bed_check.raw"
    run(["-y", "-loglevel", "error", "-i", bed, "-ar", "8000", "-ac", "1", "-f", "f32le", bedraw])
    _b = array.array("f"); _b.frombytes(open(bedraw, "rb").read())
    _w = 4000; _run = 0.0; _worst = 0.0
    for _i in range(0, len(_b) - _w + 1, _w):
        _r = math.sqrt(sum(x * x for x in _b[_i:_i + _w]) / _w)
        if _r < 0.01:  # -40 dBFS
            _run += 0.5; _worst = max(_worst, _run)
        else:
            _run = 0.0
    if _worst > 1.5:
        sys.exit("BED SILENT %.1f s (< -40 dB RMS) before film end: a non-final event probably ended the bed. Only role=final or ends_film=true may end it (see contracts/schemas/events.schema.json)." % _worst)

    # cue graph (chunks of 12 -> amix)
    inputs = ["-i", bed]; fc = []; labels = []; dips = []
    for i, c in enumerate(cues, 1):
        inputs += ["-i", REPO / c["file"]]
        ms = max(0, int(round(c["t_s"] * 1000))); d = c["duration_s"]; fd = c["fade_ms"] / 1000.0
        ch = ("[%d:a]atrim=start=0:duration=%s,asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=%sdB,afade=t=in:st=0:d=0.003"
              % (i, fl(d), fl(c["gain_db"])))
        if fd > 0:
            ch += ",afade=t=out:st=%s:d=%s" % (fl(max(0.0, d - fd)), fl(min(fd, d)))
        fc.append(ch + ",adelay=%d|%d[c%d]" % (ms, ms, i)); labels.append("[c%d]" % i)
        if c["duck"]:
            dips.append("between(t\\,%s\\,%s)" % (fl(c["t_s"]), fl(c["t_s"] + 0.15)))
    if loop:  # cues that ring over the end are wrapped to the start
        base = len(cues)
        for j, c in enumerate([c for c in cues if c["t_s"] + c["duration_s"] > film_dur + 0.02], 1):
            i = base + j; skip = film_dur - c["t_s"]; d2 = c["duration_s"] - skip
            inputs += ["-i", REPO / c["file"]]
            fc.append("[%d:a]atrim=start=%s:duration=%s,asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=%sdB,afade=t=out:st=%s:d=%s,adelay=0|0[c%d]"
                      % (i, fl(skip), fl(d2), fl(c["gain_db"]), fl(max(0.0, d2 - 0.1)), fl(min(0.1, d2)), i)); labels.append("[c%d]" % i)
    bedf = "[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,atrim=duration=%s" % fl(film_dur)
    if dips:
        bedf += (",volume=enable='%s':volume=" % "+".join(dips)) + os.environ.get("PA_DUCK", "0.708")
    fc.insert(0, bedf + "[bed]")
    chunks = []
    for gi in range(0, len(labels), 12):
        grp = labels[gi:gi + 12]
        fc.append("".join(grp) + "amix=inputs=%d:normalize=0:duration=longest:dropout_transition=0[m%d]" % (len(grp), len(chunks)))
        chunks.append("[m%d]" % len(chunks))
    fc.append("[bed]" + "".join(chunks) + "amix=inputs=%d:normalize=0:duration=first:dropout_transition=0[aout]" % (len(chunks) + 1))
    (tmp / "graph.txt").write_text(";\n".join(fc), encoding="utf-8")
    summ = tmp / "sum.wav"
    run(["-y", "-loglevel", "error"] + inputs + ["-filter_complex_script", tmp / "graph.txt", "-map", "[aout]", "-t", fl(film_dur), "-c:a", "pcm_f32le", "-ar", SR, "-ac", 2, summ])

    j2 = loudnorm_json(run(["-nostats", "-i", summ, "-t", fl(film_dur), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"]))
    final = tmp / "final.wav"; tail_used = None
    for tail in ((0.0,) if loop else (0.35, 0.6, 1.0)):
        run(["-y", "-loglevel", "error", "-i", summ, "-t", fl(film_dur), "-af",
             "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s:linear=false,%salimiter=limit=0.75:attack=3:release=60:level=disabled"
             % (j2["input_i"], j2["input_tp"], j2["input_lra"], j2["input_thresh"], j2["target_offset"], "" if loop else "afade=t=out:st=%s:d=%s:curve=exp," % (fl(film_dur - tail), fl(tail))),
             "-ar", SR, "-ac", 2, "-c:a", "pcm_s24le", final])
        tl = run(["-nostats", "-sseof", "-0.25", "-i", final, "-af", "astats=measure_overall=Peak_level", "-f", "null", "-"])
        pk = re.findall(r"Peak level dB: (-?[\d.]+|-inf)", tl); tail_used = tail
        if loop or (pk and (pk[-1] == "-inf" or float(pk[-1]) < -50.0)):
            break
    outmp4 = out / ("social-%s-final.mp4" % ratio)
    run(["-y", "-loglevel", "error", "-i", film, "-i", final, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", fl(film_dur), "-movflags", "+faststart", outmp4])

    ebu = run(["-nostats", "-i", outmp4, "-af", "ebur128=peak=true", "-f", "null", "-"])
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", ebu); TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", ebu)
    tl = run(["-nostats", "-sseof", "-0.25", "-i", outmp4, "-af", "astats=measure_overall=Peak_level", "-f", "null", "-"])
    tail_pk = re.findall(r"Peak level dB: (-?[\d.]+|-inf)", tl)
    ad = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=duration", "-of", "csv=p=0", str(outmp4)], capture_output=True, text=True).stdout.strip()
    cut_err = []
    for i, ct in enumerate(cut_s, 1):
        nb = min((t0f + n * beat_s for n in range(0, 400)), key=lambda x: abs(x - ct))
        cut_err.append({"cut": i, "cut_s": round(ct, 4), "nearest_beat_s": round(nb, 4), "err_ms": round((ct - nb) * 1000, 1),
                        "copy": "plain" if Tc is None else ("A" if ct < Tc else "B")})
    verify = {
        "file": outmp4.name, "film_dur_s": round(film_dur, 3), "audio_dur_s": float(ad) if ad else None,
        "integrated_lufs": float(I[-1]) if I else None, "true_peak_dbtp": float(TP[-1]) if TP else None,
        "last_0_25s_peak_db": tail_pk[-1] if tail_pk else None, "exp_tail_s_used": tail_used,
        "cues_total": len(cues), "cues_source_too_short": sum(1 for c in cues if c["source_too_short"]),
        "max_simultaneous_audible": sim, "max_simultaneous_at_s": sim_at, "clips_used_more_than_3": over,
        "events_without_rule": skipped,
        "offset_table": [{"n": c["n"], "event": c["event"], "role": c["role"], "clip": c["clip"], "cue_s": c["t_s"], "contact_s": c["contact_s"],
                          "delta_ms": round((c["t_s"] - c["contact_s"]) * 1000, 1)} for c in cues],
        "music": {"track": mid, "bpm": bpm, "t0_s": t0f, "two_copy": bool(Tc is not None), "beat_shift_m": m, "bar_k": k,
                  "downbeat_film_s": None if D is None else round(D, 4), "settle_s": None if settle_s is None else round(settle_s, 4),
                  "downbeat_minus_settle_ms_before_fix": None if delta is None else round(delta * 1000, 1),
                  "downbeat_minus_settle_ms_after_fix": 0.0 if (Tc is not None) else (None if delta is None else round(delta * 1000, 1)),
                  "crossfade_centre_s": None if Tc is None else round(Tc, 3), "bed_pass1_I": j1["input_i"], "master_pass1_I": j2["input_i"]},
        "cut_to_beat": cut_err,
    }
    (out / "verify.json").write_text(json.dumps(verify, ensure_ascii=False, indent=1), encoding="utf-8")
    (out / "render.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
    print(json.dumps({k_: verify[k_] for k_ in ("file", "integrated_lufs", "true_peak_dbtp", "last_0_25s_peak_db", "max_simultaneous_audible", "cues_total", "audio_dur_s", "film_dur_s")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
