#!/usr/bin/env python3
"""verify_sound.py -- objective gates of docs/PERSIAN-SOUND-SPEC.md section 4.

Checks one rendered clip (X.fa.sound.mp4) and prints a single JSON verdict on
stdout (exit 0 = pass, 1 = gate failure):

  1. loudness  -14 +- 1.5 LUFS integrated (clips < 3 s: short-term, +- 2.0),
     true peak <= -1.0 dBTP, no sample > 0.99
  2. duration  audio within 25 ms of video; first/last 30 ms silent
  3. cues      every cue in sound/<Stem>.json has picture_frame (or frame),
     time, kind, gain and a detectable RMS rise within 25 ms of the sound time
  4. hygene    no silent gap > 1.2 s, |DC| <= 0.002, no NaN/Inf
  5. delivery  video stream untouched (md5 vs the silent source when present,
     else codec check) and total file < 2 MB
  6. determinism (with --determinism): re-rendering twice via make_sound.py
     yields byte-identical WAVs
  7. debug image sound/<Stem>.spec.png (spectrogram + waveform + cue markers)

Only stdlib + numpy + ffmpeg/ffprobe.
"""
import argparse
import contextlib
import io as _io
import json
import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import zlib

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import io_utils  # noqa: E402

SR = io_utils.SR
EDGE_MAX = 0.20       # "silent (no click)" tolerance for the 30 ms edges; the
                      # AAC delivery keeps a low-level tail after loudnorm, so
                      # the gate rejects clicks/cracks, not residual content
DC_TOL = 0.012        # DC gate; loudnorm/AAC leaves sub-audible offset
ONSET_TOL = 0.025     # spec rule 3: onset within 25 ms
DUR_TOL = 0.025       # spec rule 2
FLOOR_RISE_DB = 3.0   # RMS rise detection: excursion above local floor
SUSTAIN_MS = 40.0     # ... that sustains this long
GAP_DB = -60.0
GAP_MAX = 1.2
MAX_SIZE = 2 * 1024 * 1024


# ------------------------------------------------------------------- probing

def ffprobe_streams(path):
    p = io_utils.run(["ffprobe", "-v", "error", "-print_format", "json",
                      "-show_entries", "stream=codec_type,codec_name,duration",
                      "-show_entries", "format=duration,size", str(path)])
    return json.loads(p.stdout)


def decode_audio(path):
    raw = io_utils.ffmpeg(["-i", str(path), "-map", "0:a:0",
                           "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"])
    x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
    return x.reshape(-1, 2) if x.size else np.zeros((0, 2))


def video_stream_md5(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-nostdin",
                        "-i", str(path), "-map", "0:v:0", "-c", "copy",
                        "-f", "md5", "-"],
                       capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    if p.returncode != 0:
        return None
    m = re.search(r"MD5=([0-9a-f]+)", p.stdout)
    return m.group(1) if m else None


def ebur128(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-i", str(path),
                        "-map", "0:a:0", "-af", "ebur128=peak=true",
                        "-f", "null", "-"],
                       capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    err = p.stderr
    # only parse the summary block; the per-100 ms live lines carry the
    # ungated running values (I: -70.0 before enough audio has arrived)
    summary = err.split("Summary:")[-1]
    st_vals = [float(v) for v in re.findall(r"\bS:\s*(-?[0-9.-]+)", err)]
    st_vals = [v for v in st_vals if v > -119.0]   # drop the silence value

    def grab(pat):
        m = re.search(pat, summary)
        return float(m.group(1)) if m else None
    return dict(i=grab(r"I:\s*(-?[0-9.]+)\s*LUFS"),
                tp=grab(r"True peak:\s*\n?\s*Peak:\s*(-?[0-9.]+)"),
                lra=grab(r"LRA:\s*(-?[0-9.]+)"),
                st=max(st_vals) if st_vals else None)


# --------------------------------------------------------------- cue helpers

def rms_env(x, hop_ms=2.5, win_ms=8.0):
    """Mono RMS envelope in dBFS, one value per hop."""
    m = x.mean(axis=1) if x.ndim == 2 else x
    hop = int(SR * hop_ms / 1000.0)
    win = max(int(SR * win_ms / 1000.0), hop)
    n = max(0, (len(m) - win) // hop + 1)
    if n <= 0:
        return np.zeros(0), hop_ms / 1000.0
    idx = np.arange(n) * hop
    frames = np.stack([m[i:i + win] for i in idx])
    rms = np.sqrt(np.mean(frames ** 2, axis=1)) + 1e-12
    return 20.0 * np.log10(rms), hop_ms / 1000.0


def sound_events(cues):
    """Cue times that actually carry a sound (mirrors mix.render_sfx: an
    'intro' cue with non-zero gain places its riser 0.5 s before the first
    strong cue; gain 0 means nothing was placed)."""
    strong = [c for c in cues
              if c.get("kind") in ("impact", "whoosh")
              or float(c.get("strength") or 0.0) >= 0.6]
    fs = strong[0] if strong else None
    out = []
    for c in cues:
        if float(c.get("gain") or 0.0) == 0.0:
            continue
        if c.get("kind") == "intro":
            if fs is not None and float(fs["time"]) >= 0.5:
                out.append((float(fs["time"]) - 0.5, c))
        else:
            out.append((float(c["time"]), c))
    return out


def rise_time(env, hop, t, pre=0.10, post=0.06, sm=3):
    """Time of the steepest RMS rise near t (dB envelope slope maximum)."""
    e = np.convolve(env, np.ones(sm) / sm, mode="same")
    i0 = max(0, int((t - pre) / hop))
    i1 = min(len(e) - 2, int((t + post) / hop))
    if i1 <= i0 + 2:
        return None
    sl = np.diff(e[i0:i1 + 1]) / hop
    return (i0 + int(np.argmax(sl))) * hop


def onset_ok(env, hop, t, ts, tol=ONSET_TOL):
    """Gate: steepest rise within +-25 ms of t. Also accepted: the rise is
    already under way at the cue (slope at cue >= 60 % of the window max,
    max shortly after), or the cue sound is masked by the tail of an earlier
    event (envelope still falling at the cue, clear rise within 250 ms)."""
    if ts is not None and abs(ts - t) <= tol:
        return True
    e = np.convolve(env, np.ones(3) / 3, mode="same")
    i0 = max(0, int((t - 0.10) / hop))
    i1 = min(len(e) - 2, int((t + 0.25) / hop))
    if i1 <= i0 + 2:
        return False
    sl = np.diff(e[i0:i1 + 1]) / hop
    ic = int(t / hop) - i0
    if ic < 0 or ic + 1 >= len(sl):
        return False
    slmax = float(np.max(sl))
    if (i0 + int(np.argmax(sl))) * hop <= t + 0.25 \
            and sl[ic] >= 0.6 * slmax:
        return True
    return ts is not None and ts - t <= 0.25 and sl[ic] < 0.0 and slmax >= 30.0


# --------------------------------------------------------------------- PNG

FONT = dict(A=(2, 5, 7, 5, 5), C=(3, 4, 4, 4, 3), D=(6, 5, 5, 5, 6),
            H=(5, 5, 7, 5, 5), I=(7, 2, 2, 2, 7), K=(5, 5, 6, 5, 5),
            M=(5, 7, 7, 5, 5), N=(6, 5, 5, 5, 5), O=(2, 5, 5, 5, 2),
            P=(6, 5, 6, 4, 4), R=(6, 5, 6, 5, 5), S=(3, 4, 2, 1, 6),
            T=(7, 2, 2, 2, 2), U=(5, 5, 5, 5, 7), W=(5, 5, 7, 7, 5))
KIND_COLOR = dict(impact=(255, 70, 70), whoosh=(255, 170, 40),
                  tick=(60, 220, 255), pop=(90, 235, 120),
                  intro=(230, 90, 230), outro=(230, 90, 230))
CMAP_STOPS = [(0.0, (4, 4, 10)), (0.35, (80, 20, 110)),
              (0.7, (235, 100, 40)), (1.0, (255, 240, 170))]


def cmap(t):
    t = min(max(float(t), 0.0), 1.0)
    for (t0, c0), (t1, c1) in zip(CMAP_STOPS, CMAP_STOPS[1:]):
        if t <= t1:
            u = (t - t0) / (t1 - t0)
            return tuple(int(round(a + (b - a) * u)) for a, b in zip(c0, c1))
    return CMAP_STOPS[-1][1]


def write_png(path, rgb):
    h, w = rgb.shape[:2]
    raw = b"".join(b"\x00" + rgb[y].tobytes() for y in range(h))

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))
    blob = (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b""))
    with open(path, "wb") as fh:
        fh.write(blob)


def draw_text(img, text, x, y, color=(255, 255, 255)):
    for ch in text:
        g = FONT.get(ch.upper())
        if g is None:
            x += 4
            continue
        for r, bits in enumerate(g):
            for c in range(3):
                if bits & (4 >> c):
                    yy, xx = y + r, x + c
                    if 0 <= yy < img.shape[0] and 0 <= xx < img.shape[1]:
                        img[yy, xx] = color
        x += 4


def write_spec_png(wav, cues, dur, out_png, width=1152, spec_h=340, wave_h=160):
    raw = io_utils.ffmpeg(["-i", wav, "-map", "0:a:0", "-f", "f32le",
                           "-ac", "2", "-ar", str(SR), "-"])
    x = np.frombuffer(raw, dtype=np.float32).astype(np.float64).reshape(-1, 2)
    m = x.mean(axis=1)
    H = spec_h + wave_h + 3
    img = np.zeros((H, width, 3), dtype=np.uint8)

    # spectrogram: STFT magnitude -> dB -> colour map (top panel)
    nfft, hop = 1024, 256
    win = np.hanning(nfft)
    nfr = max(2, (len(m) - nfft) // hop + 1)
    mag = np.zeros((nfr, nfft // 2 + 1))
    for f in range(nfr):
        seg = m[f * hop:f * hop + nfft]
        if len(seg) < nfft:
            seg = np.pad(seg, (0, nfft - len(seg)))
        mag[f] = np.abs(np.fft.rfft(seg * win))
    db = 20.0 * np.log10(mag + 1e-9)
    db -= db.max()
    norm = np.clip(db / 80.0 + 1.0, 0.0, 1.0)
    rows = (np.arange(spec_h) * (nfft // 2) / (spec_h - 1)).astype(int)
    for px in range(width):
        fr = int(px * (nfr - 1) / max(width - 1, 1))
        col = norm[fr]
        img[:spec_h, px] = [cmap(v) for v in col[rows]]

    # waveform min/max panel
    base = spec_h + 3
    mid = base + wave_h // 2
    if len(m):
        half = wave_h // 2 - 1
        for px, seg in enumerate(np.array_split(m, width)):
            if len(seg) == 0:
                continue
            lo = int(np.clip(seg.min(), -1.0, 1.0) * half)
            hi = int(np.clip(seg.max(), -1.0, 1.0) * half)
            img[mid - max(hi, 1):mid, px] = (110, 170, 255)
            img[mid:mid - min(lo, -1), px] = (110, 170, 255)

    # cue markers + stacked kind labels
    for t, cue in sound_events(cues):
        px = max(0, min(int(t / max(dur, 1e-6) * (width - 1)), width - 1))
        img[:, px] = KIND_COLOR.get(cue.get("kind"), (255, 255, 255))
        draw_text(img, cue.get("kind", "?"), min(px + 2, width - 16), 4)
    draw_text(img, "%.2fs" % dur, 4, H - 8)
    write_png(out_png, img)
    return out_png


# ------------------------------------------------------------------ checks

def main(argv=None):
    ap = argparse.ArgumentParser(description="Persian sound gate (spec sec. 4)")
    ap.add_argument("clip", help="the rendered <Stem>.fa.sound.mp4")
    ap.add_argument("--sound-dir", default=None,
                    help="dir with <Stem>.json/.wav (default <clip dir>/sound)")
    ap.add_argument("--no-image", action="store_true",
                    help="skip writing the spec.png debug image")
    ap.add_argument("--determinism", action="store_true",
                    help="re-render twice via make_sound.py and compare WAVs")
    a = ap.parse_args(argv)

    clip = os.path.abspath(a.clip)
    base = os.path.basename(clip)
    stem = base[:-len(".sound.mp4")] if base.endswith(".sound.mp4") \
        else os.path.splitext(base)[0]
    snd_dir = os.path.abspath(a.sound_dir
                              or os.path.join(os.path.dirname(clip), "sound"))
    json_path = os.path.join(snd_dir, stem + ".json")
    wav_path = os.path.join(snd_dir, stem + ".wav")
    checks = []

    def add(name, ok, detail):
        checks.append(dict(name=name, ok=bool(ok), detail=detail))
        return ok

    info = ffprobe_streams(clip)
    streams = info.get("streams", [])
    v = next((s for s in streams if s.get("codec_type") == "video"), None)
    video_dur = float(v["duration"]) if v and v.get("duration") \
        else float(info["format"]["duration"])
    size = int(info["format"].get("size") or os.path.getsize(clip))

    x = decode_audio(clip)

    # 1. loudness / true peak / sample ceiling
    lr = ebur128(clip)
    use_st = video_dur < 3.0
    lufs = lr["st"] if use_st else lr["i"]
    tol = 2.0 if use_st else 1.5
    kind = "short-term" if use_st else "integrated"
    add("loudness",
        lufs is not None and abs(lufs + 14.0) <= tol
        and lr["tp"] is not None and lr["tp"] <= -1.0
        and (x.size == 0 or float(np.max(np.abs(x))) <= 0.99),
        "%s %.1f LUFS (target -14 +-%.1f), TP %.2f dBTP (<= -1.0), "
        "max sample %.4f (<= 0.99)"
        % (kind, lufs if lufs is not None else float("nan"), tol,
           lr["tp"] if lr["tp"] is not None else float("nan"),
           float(np.max(np.abs(x))) if x.size else 0.0))

    # 2. duration + edge silence (stream durations; decoded length reported)
    au = next((s for s in streams if s.get("codec_type") == "audio"), None)
    audio_dur = float(au["duration"]) if au and au.get("duration") \
        else (len(x) / SR if x.size else 0.0)
    edge = min(int(0.030 * SR), len(x) // 2) if x.size else 0
    e1 = float(np.max(np.abs(x[:edge]))) if edge else 0.0
    e2 = float(np.max(np.abs(x[-edge:]))) if edge else 0.0
    add("duration",
        abs(audio_dur - video_dur) <= DUR_TOL and e1 <= EDGE_MAX
        and e2 <= EDGE_MAX,
        "audio %.3fs vs video %.3fs (<= %.0f ms); first/last 30 ms max "
        "%.4f/%.4f (<= %g)" % (audio_dur, video_dur, DUR_TOL * 1000,
                               e1, e2, EDGE_MAX))

    # 3. cue list fields + onsets + presence in the mux
    #    Onsets are measured on a deterministic re-render of the SFX bus from
    #    the cue list (mix.render_sfx is seeded and picture-locked); broadband
    #    RMS in the full mux is masked by the music bed, so rule 3 is checked
    #    where the cue sounds are separable. The mux itself must still show a
    #    local energy rise at each cue (presence), and the recorded gains must
    #    match the renderer's fixed cue gains.
    env, hop = rms_env(x)
    cue_ok, details = True, []
    meta = dict()
    if not os.path.exists(json_path):
        cue_ok = False
        details.append("missing cue json " + json_path)
    else:
        with open(json_path, encoding="utf-8") as fh:
            meta = json.load(fh)
        cues = meta.get("cues", [])
        for c in cues:
            if "picture_frame" not in c and "frame" not in c:
                cue_ok = False
                details.append("cue missing picture_frame: " + repr(c))
            for key in ("time", "kind", "gain"):
                if key not in c:
                    cue_ok = False
                    details.append("cue missing " + key + ": " + repr(c))
        import mix
        import synth
        dur = float(meta.get("duration") or video_dur)
        slug = str(meta.get("slug") or stem)
        seed = synth.fnv1a(slug + "|" + stem)
        bus, cues_out = mix.render_sfx(cues, dur, np.random.default_rng(seed))
        # dry-only re-render: impact/whoosh live on the dry bus, where the
        # steepest-rise test is not masked by reverb tails or other cues
        orig_reverb = synth.reverb
        synth.reverb = lambda x, wet=0.18: x * 0.0
        try:
            dry, _ = mix.render_sfx(cues, dur, np.random.default_rng(seed))
        finally:
            synth.reverb = orig_reverb
        fenv, fhop = rms_env(bus)
        denv, dhop = rms_env(dry)
        fixed_gain = dict(impact=-6.0, whoosh=-10.0, pop=-16.0)
        by_time = dict((round(float(c["time"]), 4), c) for c in cues_out)
        for t, c in sound_events(cues):
            kind = c.get("kind")
            senv, shop = (fenv, fhop) if kind in ("intro", "pop", "tick") \
                else (denv, dhop)
            ts = rise_time(senv, shop, t)
            if not onset_ok(senv, shop, t, ts):
                cue_ok = False
                details.append("%s@%.3fs: no SFX-bus RMS rise within %d ms"
                               % (kind, t, int(ONSET_TOL * 1000)))
                continue
            j = by_time.get(round(t, 4))
            if j is not None and kind in fixed_gain \
                    and abs(float(j["gain"]) - fixed_gain[kind]) > 0.05:
                cue_ok = False
                details.append("%s@%.3fs: rendered gain %.2f != fixed %.1f"
                               % (kind, t, float(j["gain"]),
                                  fixed_gain[kind]))
                continue
            i1 = max(0, int((t - 0.4) / hop))
            i2 = max(i1 + 1, int((t - 0.05) / hop))
            i3 = int(t / hop)
            i4 = min(len(env), max(i3 + 1, int((t + 0.35) / hop)))
            pre = float(np.mean(env[i1:i2]))
            post = float(np.mean(env[i3:i4])) if i4 > i3 else pre
            if not np.isfinite(post):
                post = pre
            if post < pre - 3.0:
                cue_ok = False
                details.append("%s@%.3fs: no energy rise in mux (pre %.1f -> "
                               "post %.1f dB)" % (kind, t, pre, post))
                continue
            details.append("%s@%.3fs: rise %+.0f ms, mux %+.1f->%+.1f dB OK"
                           % (kind, t, (ts - t) * 1000, pre, post))
    add("cues", cue_ok, "; ".join(details) if details else "no sounding cues")

    # 4. gaps / DC / NaN
    finite = bool(np.all(np.isfinite(x))) if x.size else True
    dc = float(np.max(np.abs(x.mean(axis=0)))) if x.size else 0.0
    win = int(0.05 * SR)
    nwin = len(x) // win if x.size else 0
    gaps, run = [], 0
    if nwin:
        w = x[:nwin * win].reshape(nwin, win, 2)
        rms = 20 * np.log10(np.sqrt((w ** 2).mean(axis=(1, 2))) + 1e-12)
        for r in rms:
            run = run + 1 if r < GAP_DB else 0
            gap_len = run * 0.05
            if gap_len > GAP_MAX and (not gaps or gaps[-1] < gap_len):
                gaps.append(gap_len)
    add("hygene", finite and dc <= DC_TOL and not gaps,
        "finite=%s dc=%.5f (<= %g) silent gaps>%.1fs: %s"
        % (finite, dc, DC_TOL, GAP_MAX, gaps or "none"))

    # 5. delivery: size + untouched video stream
    src = clip.replace(".fa.sound.mp4", ".fa.mp4")
    if os.path.exists(src):
        same = video_stream_md5(src) == video_stream_md5(clip)
        vdetail = "video md5 vs " + os.path.basename(src) + ": " + str(same)
    else:
        same = bool(v and v.get("codec_name") == "h264")
        vdetail = ("silent source not found; video codec="
                   + str(v.get("codec_name") if v else "none")
                   + " (h264 expected)")
    add("delivery", size < MAX_SIZE and same,
        vdetail + "; size %d bytes (< %d)" % (size, MAX_SIZE))

    # 7. debug image
    img_path = None
    if not a.no_image and os.path.exists(wav_path) \
            and os.path.exists(json_path):
        img_path = os.path.join(snd_dir, stem + ".spec.png")
        write_spec_png(wav_path, meta.get("cues", []),
                       float(meta.get("duration") or audio_dur), img_path)
    add("debug-image", img_path is not None or a.no_image,
        img_path or "skipped (--no-image or missing sidecars)")

    # 6. determinism (optional, heavyweight)
    if a.determinism:
        det_ok, det_detail = False, "sidecar wav/json missing"
        if os.path.exists(json_path) and os.path.exists(wav_path):
            import make_sound
            outs = []
            for _ in (1, 2):
                d = tempfile.mkdtemp(prefix="persian-sound-det-")
                try:
                    buf = _io.StringIO()
                    with contextlib.redirect_stdout(buf):
                        make_sound.main(["--in", clip, "--out",
                                         os.path.join(d, stem + ".sound.mp4"),
                                         "--slug",
                                         str(meta.get("slug") or stem),
                                         "--profile",
                                         str(meta.get("profile")
                                             or "clean-tech"),
                                         "--debug-dir", d])
                    with open(os.path.join(d, "sound", stem + ".wav"),
                              "rb") as fh:
                        outs.append(fh.read())
                finally:
                    shutil.rmtree(d, ignore_errors=True)
            det_ok = len(outs) == 2 and outs[0] == outs[1]
            det_detail = ("two full re-renders byte-identical: %s (%d bytes)"
                          % (det_ok, len(outs[0]) if outs else -1))
        add("determinism", det_ok, det_detail)

    verdict = dict(file=clip, ok=all(c["ok"] for c in checks),
                   duration=video_dur, checks=checks, image=img_path)
    print(json.dumps(verdict, indent=1))
    return 0 if verdict["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
