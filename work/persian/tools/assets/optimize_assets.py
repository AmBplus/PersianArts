#!/usr/bin/env python3
"""PersianArts asset compressor: raster -> WebP, SVG/audio/fonts optional, videos TV-safe.
See README.md. Usage: python optimize_assets.py <dir|file>... [--dry-run] [--report out.json] ..."""
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile, time
from pathlib import Path

VERSION = "1.0"
HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
IMG_EXT = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".gif"}
VID_EXT = {".mp4", ".mov", ".mkv", ".webm", ".m4v"}
AUD_EXT = {".wav", ".flac", ".mp3"}
FONT_EXT = {".ttf", ".otf"}
REF_EXT = {".html", ".htm", ".css", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".json", ".md"}
SKIP_DIRS = {"_orig", "node_modules", ".git", ".venv", "__pycache__"}
PROTECTED = ["media/briefs-local/conference-event", "sound/library/kit", "sound/tools/mixer"]
AUDIO_MIN = 600 * 1024
MAX_SIDE = 4096


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def sha1(p):
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def rel_repo(p):
    try:
        return Path(p).resolve().relative_to(REPO).as_posix()
    except ValueError:
        return Path(p).as_posix()


def is_protected(p, explicit):
    r = rel_repo(p)
    return any(r == q or r.startswith(q + "/") for q in PROTECTED) and p not in explicit


def git_tracked(p):
    return run(["git", "-C", str(REPO), "ls-files", "--error-unmatch", str(p)]).returncode == 0


def git_ignored(p):
    return run(["git", "-C", str(REPO), "check-ignore", "-q", str(p)]).returncode == 0


# ---------------------------------------------------------------- SSIM (numpy, uniform 7x7)
def ssim_gray(a, b):
    import numpy as np
    a = a.astype("float64"); b = b.astype("float64")
    k = 7
    def box(x):
        c = np.cumsum(np.cumsum(np.pad(x, ((1, 0), (1, 0))), 0), 1)
        return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)
    if min(a.shape) < k:
        return 1.0 if (a == b).all() else float(1 - np.abs(a - b).mean() / 255)
    ma, mb = box(a), box(b)
    va, vb = box(a * a) - ma * ma, box(b * b) - mb * mb
    cov = box(a * b) - ma * mb
    c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    s = ((2 * ma * mb + c1) * (2 * cov + c2)) / ((ma * ma + mb * mb + c1) * (va + vb + c2))
    return float(s.mean())


def ssim_img(a, b):
    """SSIM over luminance + per-channel mean, premultiplied vs mid-gray for alpha. a,b PIL images same size."""
    import numpy as np
    from PIL import Image
    def prep(im):
        im = im.convert("RGBA")
        arr = np.asarray(im).astype("float64")
        al = arr[..., 3:4] / 255.0
        return arr[..., :3] * al + 128 * (1 - al), arr[..., 3]
    ra, aa = prep(a); rb, ab = prep(b)
    vals = [ssim_gray(ra[..., c], rb[..., c]) for c in range(3)]
    s = min(vals)
    if (aa != ab).any():
        s = min(s, ssim_gray(aa, ab))
    err = np.abs(ra - rb)
    return s, float(err.mean()), float(np.percentile(err, 99.9))


# ---------------------------------------------------------------- images
def convert_image(src, out_tmp):
    from PIL import Image
    import numpy as np
    im = Image.open(src)
    if getattr(im, "is_animated", False) and getattr(im, "n_frames", 1) > 1:
        return None, "animated"
    im.load()
    has_alpha = im.mode in ("RGBA", "LA", "PA") or "transparency" in im.info
    if im.mode in ("I;16", "I", "F"):
        im = im.point(lambda v: v / 256).convert("L") if im.mode == "I;16" else im.convert("L")
    im = im.convert("RGBA" if has_alpha else "RGB")
    scaled = False
    if max(im.size) > MAX_SIDE:
        r = MAX_SIDE / max(im.size)
        im = im.resize((max(1, round(im.width * r)), max(1, round(im.height * r))), Image.LANCZOS)
        scaled = True
    arr = np.asarray(im)
    sample = arr.reshape(-1, arr.shape[-1])
    if len(sample) > 400000:
        sample = sample[:: len(sample) // 400000]
    uniq = len(np.unique(sample.view([("", sample.dtype)] * sample.shape[1])))
    soft_alpha = has_alpha and float(((arr[..., 3] > 0) & (arr[..., 3] < 255)).mean()) > 0.0005
    graphic = uniq <= 4096 or soft_alpha
    if graphic:
        im.save(out_tmp, "WEBP", lossless=True, quality=100, method=6, exact=True)
        return {"mode": "lossless", "ssim": 1.0, "scaled": scaled, "colors": uniq}, None
    best = None
    for q in (95, 90, 85, 80):
        im.save(out_tmp, "WEBP", quality=q, method=6)
        s, mae, p999 = ssim_img(im, Image.open(out_tmp))
        if s >= 0.985 and mae <= 2.5 and p999 <= 40:
            best = (q, s); break
    lossy_size = os.path.getsize(out_tmp) if best else None
    if best is None or lossy_size > 0.6 * os.path.getsize(src):
        t2 = out_tmp + ".ll"
        im.save(t2, "WEBP", lossless=True, quality=100, method=4)
        if best is None or os.path.getsize(t2) < lossy_size:
            os.replace(t2, out_tmp)
            return {"mode": "lossless", "ssim": 1.0, "scaled": scaled, "colors": uniq}, None
        os.remove(t2)
    return {"mode": f"lossy q{best[0]}", "ssim": round(best[1], 4), "scaled": scaled, "colors": uniq}, None


# ---------------------------------------------------------------- svg
def svg_ids(t):
    return sorted(re.findall(r'\bid="([^"]+)"', t)), len(re.findall(r"pathLength=", t))


def optimize_svg(src, out_tmp):
    cfg = HERE / "svgo.config.cjs"
    npx = shutil.which("npx.cmd") or shutil.which("npx")
    r = run([npx, "--prefix", str(HERE), "svgo", "--multipass", "--config", str(cfg), "-i", str(src), "-o", out_tmp], cwd=str(HERE))
    if r.returncode != 0 or not os.path.exists(out_tmp):
        return None, "svgo failed: " + (r.stderr or r.stdout)[-120:]
    a, b = Path(src).read_text(encoding="utf-8", errors="ignore"), Path(out_tmp).read_text(encoding="utf-8", errors="ignore")
    if svg_ids(a) != svg_ids(b):
        return None, "ids/pathLength changed"
    info = {"mode": "svgo", "ssim": None, "check": "ids+pathLength equal"}
    try:
        import resvg_py, io
        from PIL import Image
        def ras(p):
            return Image.open(io.BytesIO(bytes(resvg_py.svg_to_bytes(svg_path=str(p), width=800)))).convert("RGBA")
        s = ssim_img(ras(src), ras(out_tmp))[0]
        info["ssim"] = round(s, 5)
        if s < 0.999:
            return None, f"raster ssim {s:.4f} < 0.999"
    except Exception as e:  # rasteriser unavailable
        info["check"] += f"; raster check skipped ({type(e).__name__})"
    return info, None


# ---------------------------------------------------------------- fonts
def optimize_font(src, out_tmp):
    from fontTools.ttLib import TTFont
    f = TTFont(src); before = dict(f.getBestCmap())
    axes = [a.axisTag for a in f["fvar"].axes] if "fvar" in f else []
    f.flavor = "woff2"; f.save(out_tmp)
    g = TTFont(out_tmp)
    if dict(g.getBestCmap()) != before:
        return None, "cmap differs"
    if axes != ([a.axisTag for a in g["fvar"].axes] if "fvar" in g else []):
        return None, "axes differ"
    return {"mode": "woff2", "ssim": None, "check": f"cmap equal ({len(before)} glyph codes), axes {axes}"}, None


# ---------------------------------------------------------------- audio
def probe(path):
    r = run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)])
    return json.loads(r.stdout or "{}")


def loudness(path):
    r = run(["ffmpeg", "-nostats", "-i", str(path), "-af", "ebur128", "-f", "null", "-"])
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    return float(m[-1]) if m else None


def optimize_audio(src, out_tmp):
    d0, l0 = float(probe(src)["format"]["duration"]), loudness(src)
    why = "n/a"
    for q in (5, 6, 7, 8):
        r = run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-vn", "-c:a", "libvorbis", "-q:a", str(q), "-f", "ogg", out_tmp])
        if r.returncode != 0:
            return None, "ffmpeg: " + r.stderr[-120:]
        d1, l1 = float(probe(out_tmp)["format"]["duration"]), loudness(out_tmp)
        if abs(d0 - d1) > 0.02:
            why = f"duration drift {abs(d0 - d1) * 1000:.0f} ms"; continue
        if l0 is not None and l1 is not None and abs(l0 - l1) > 0.3:
            why = f"loudness drift {abs(l0 - l1):.2f} LU"; continue
        return {"mode": f"ogg q{q}", "ssim": None, "check": f"dur {d0:.3f}->{d1:.3f}s, LUFS {l0}->{l1}"}, None
    return None, why


# ---------------------------------------------------------------- TV video
STD_FPS = {25: "25", 30: "30", 50: "50", 60: "60"}


def frac(s):
    try:
        a, b = s.split("/"); return float(a) / float(b) if float(b) else 0.0
    except Exception:
        return 0.0


def moov_first(path):
    with open(path, "rb") as f:
        pos, size = 0, os.path.getsize(path)
        while pos < size:
            f.seek(pos); h = f.read(8)
            if len(h) < 8: break
            n, t = int.from_bytes(h[:4], "big"), h[4:8]
            if t == b"moov": return True
            if t == b"mdat": return False
            if n == 1: n = int.from_bytes(f.read(8), "big")
            if n < 8: break
            pos += n
    return False


def keyint_max(path):
    r = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts_time,flags", "-of", "csv=p=0", str(path)])
    ks = []
    for ln in r.stdout.splitlines():
        p = ln.split(",")
        if len(p) >= 2 and "K" in p[1]:
            try: ks.append(float(p[0]))
            except ValueError: pass
    return max((b - a for a, b in zip(ks, ks[1:])), default=0.0), len(ks)


def tv_check(path):
    pr = probe(path); st = pr.get("streams", [])
    v = next((s for s in st if s["codec_type"] == "video"), {})
    a = [s for s in st if s["codec_type"] == "audio"]
    fps = frac(v.get("avg_frame_rate", "0/1")); rfps = frac(v.get("r_frame_rate", "0/1"))
    w, h = v.get("width", 0), v.get("height", 0)
    gop_s, nk = keyint_max(path)
    lvl = v.get("level", 0)
    chk = {
        "container_mp4": "mp4" in pr.get("format", {}).get("format_name", ""),
        "faststart": moov_first(path),
        "codec_h264": v.get("codec_name") == "h264",
        "profile_high": v.get("profile") == "High",
        "level_le_4.1": 0 < lvl <= 41,
        "pix_fmt_yuv420p": v.get("pix_fmt") == "yuv420p",
        "range_tv": v.get("color_range") == "tv",
        "bt709_tags": (v.get("color_primaries"), v.get("color_transfer"), v.get("color_space")) == ("bt709",) * 3,
        "size_ok": (w <= 1920 and h <= 1080 or w <= 1080 and h <= 1920) and w % 2 == 0 and h % 2 == 0,
        "cfr_std_fps": abs(fps - rfps) < 0.01 and any(abs(fps - k) < 0.01 for k in STD_FPS),
        "gop_le_2s": 0 < gop_s <= 2.001 or (nk <= 1 and float(pr["format"].get("duration", 0)) <= 2.001),
        "bframes_le_2": v.get("has_b_frames", 0) <= 2,
        "audio_aac_lc_stereo_48k": len(a) == 1 and a[0].get("codec_name") == "aac" and a[0].get("profile") == "LC" and a[0].get("channels") == 2 and int(a[0].get("sample_rate", 0)) == 48000,
        "no_extra_streams": len(st) == 1 + len(a) and all(s["codec_type"] in ("video", "audio") for s in st),
        "no_title": not pr.get("format", {}).get("tags", {}).get("title"),
    }
    info = {"file": rel_repo(path), "profile": v.get("profile"), "level": lvl, "pix_fmt": v.get("pix_fmt"), "range": v.get("color_range"),
            "fps": round(fps, 3), "gop_s": round(gop_s, 3), "size": f"{w}x{h}",
            "audio": [f'{s.get("codec_name")}/{s.get("profile")}/{s.get("channels")}ch/{s.get("sample_rate")}' for s in a],
            "bytes": os.path.getsize(path), "bitrate": int(pr.get("format", {}).get("bit_rate", 0) or 0),
            "checks": {k: ("pass" if x else "FAIL") for k, x in chk.items()}, "closed_gop": "set on encode (not verifiable by ffprobe)"}
    info["pass"] = all(chk.values())
    info["_v"] = v; info["_fps"] = fps
    return info


def tv_fix(src, out_tmp, silent=True):
    info = tv_check(src); c = info["checks"]; v = info.pop("_v"); fps = info.pop("_fps")
    video_ok = all(c[k] == "pass" for k in ("codec_h264", "profile_high", "level_le_4.1", "pix_fmt_yuv420p", "range_tv", "size_ok", "cfr_std_fps", "gop_le_2s", "bframes_le_2"))
    tags_only = video_ok and c["bt709_tags"] == "FAIL"
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(src)]
    has_a = any(s for s in probe(src)["streams"] if s["codec_type"] == "audio")
    if not has_a and silent:
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
    cmd += ["-map", "0:v:0"]
    if has_a: cmd += ["-map", "0:a:0"]
    elif silent: cmd += ["-map", "1:a:0", "-shortest"]
    if video_ok and (c["bt709_tags"] == "pass" or tags_only):
        mode = "copy" if not tags_only else "copy+tagfix"
        cmd += ["-c:v", "copy"]
        if tags_only: cmd += ["-bsf:v", "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0"]
    else:
        mode = "re-encode"
        o = round(fps) if any(abs(fps - k) < 0.01 for k in STD_FPS) else 30
        if abs(fps - frac(v.get("r_frame_rate", "0/1"))) >= 0.01 or not any(abs(fps - k) < 0.01 for k in STD_FPS):
            o = min(STD_FPS, key=lambda k: abs(k - fps)) if fps > 0 and min(abs(k - fps) for k in STD_FPS) < fps * 0.01 else 30
        sw, sh = v.get("width", 0), v.get("height", 0)
        vf = []
        if not (sw <= 1920 and sh <= 1080 or sw <= 1080 and sh <= 1920):
            vf.append("scale='if(gt(a,1),min(1920,iw),min(1080,iw))':-2:flags=lanczos,scale='min(1080,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease" if sw >= sh else
                      "scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos")
        if sw >= sh and (sw > 1920 or sh > 1080): vf = ["scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos"]
        vf.append("scale=trunc(iw/2)*2:trunc(ih/2)*2")
        full = v.get("color_range") == "pc" or str(v.get("pix_fmt", "")).startswith("yuvj")
        mx = v.get("color_space") if v.get("color_space") in ("bt470bg", "smpte170m") else "bt709"
        mxn = "bt601" if mx != "bt709" else "bt709"
        vf.append(f"scale=in_range={'full' if full else 'limited'}:out_range=limited:in_color_matrix={mxn}:out_color_matrix=bt709:out_range=limited,format=yuv420p")
        cmd += ["-vf", ",".join(vf), "-r", str(o), "-fps_mode", "cfr", "-c:v", "libx264", "-profile:v", "high", "-level:v", "4.1",
                "-pix_fmt", "yuv420p", "-crf", "18", "-maxrate", "12M", "-bufsize", "24M", "-g", str(2 * o), "-keyint_min", str(o),
                "-bf", "2", "-x264-params", "open-gop=0:b-pyramid=none:colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv", "-preset", "medium",
                "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]
    cmd += ["-c:a", "aac", "-profile:a", "aac_low", "-b:a", "192k", "-ar", "48000", "-ac", "2"] if (has_a or silent) else ["-an"]
    cmd += ["-map_metadata", "-1", "-map_chapters", "-1", "-metadata", "title=", "-movflags", "+faststart", "-f", "mp4", out_tmp]
    r = run(cmd)
    if r.returncode != 0:
        return None, "ffmpeg: " + r.stderr[-200:]
    after = tv_check(out_tmp); after.pop("_v"); after.pop("_fps")
    if not after["pass"]:
        return None, "post-check failed: " + ",".join(k for k, x in after["checks"].items() if x != "pass")
    return {"mode": mode, "ssim": None, "tv_after": after, "tv_before": {k: x for k, x in info["checks"].items() if x != "pass"}}, None


# ---------------------------------------------------------------- driver
def collect(paths, explicit):
    out = []
    for p in paths:
        p = Path(p).resolve()
        if p.is_file():
            out.append((p, p.parent)); continue
        for dp, dn, fn in os.walk(p):
            dn[:] = [d for d in dn if d not in SKIP_DIRS]
            for f in sorted(fn):
                out.append((Path(dp) / f, p))
    return [(f, r) for f, r in out if not is_protected(f, explicit)]


def rewrite_refs(root, mapping, backup_ok, log):
    if not mapping: return
    pats = [(re.compile(r"(?<![\w.-])" + re.escape(o) + r"(?![\w-])"), n) for o, n in mapping.items()]
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in SKIP_DIRS]
        for f in fn:
            fp = Path(dp) / f
            if fp.suffix.lower() not in REF_EXT or f in ("assets.map.json", "assets.lock.json", "tv-report.json"): continue
            try: t = fp.read_text(encoding="utf-8")
            except Exception: continue
            n, cnt = t, 0
            for pat, new in pats:
                n, c = pat.subn(new, n); cnt += c
            n = re.sub(r"(url\([^)]*\.woff2[^)]*\)\s*format\()(['\"])(?:truetype|opentype)\2", r"\1\2woff2\2", n)
            if cnt and n != t:
                if not git_ignored(fp): shutil.copy2(fp, str(fp) + ".bak")
                fp.write_text(n, encoding="utf-8")
                log.append({"file": rel_repo(fp), "replacements": cnt})


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--dry-run", action="store_true"); ap.add_argument("--report")
    ap.add_argument("--rewrite-refs", action="store_true"); ap.add_argument("--keep-originals", action="store_true")
    ap.add_argument("--delete-originals", action="store_true")
    ap.add_argument("--tv", action="store_true"); ap.add_argument("--no-tv", action="store_true")
    ap.add_argument("--tv-silent-track", dest="silent", action="store_true", default=True)
    ap.add_argument("--no-tv-silent-track", dest="silent", action="store_false")
    ap.add_argument("--audio", action="store_true"); ap.add_argument("--svg", action="store_true"); ap.add_argument("--fonts", action="store_true")
    ap.add_argument("--no-images", action="store_true")
    a = ap.parse_args(argv)
    explicit = {Path(p).resolve() for p in a.paths if Path(p).is_file()}
    settings = {"v": VERSION, "audio": a.audio, "svg": a.svg, "fonts": a.fonts, "tv": not a.no_tv, "silent": a.silent}
    items = collect(a.paths, explicit)
    report, mapping_by_root, t_start = [], {}, time.time()
    locks = {}
    for f, root in items:
        ext = f.suffix.lower()
        kind = ("img" if ext in IMG_EXT and not a.no_images else "vid" if ext in VID_EXT and not a.no_tv else
                "svg" if ext == ".svg" and a.svg else "font" if ext in FONT_EXT and a.fonts else
                "aud" if ext in AUD_EXT and a.audio and f.stat().st_size > AUDIO_MIN else None)
        if kind is None: continue
        lp = root / "assets.lock.json"
        lock = locks.setdefault(root, json.loads(lp.read_text()) if lp.exists() else {})
        key = f.relative_to(root).as_posix(); st = f.stat()
        ent = lock.get(key)
        if ent and ent["size"] == st.st_size and ent["mtime"] == st.st_mtime_ns and ent["settings"] == settings:
            report.append({"file": key, "status": "cached-skip"}); continue
        t0 = time.time(); rec = {"file": key, "kind": kind, "before": st.st_size}
        tmp = tempfile.mktemp(suffix=".tmp", dir=str(f.parent)) if not a.dry_run else tempfile.mktemp(suffix=".tmp")
        try:
            if kind == "img": info, err = convert_image(f, tmp); newext = ".webp"
            elif kind == "svg": info, err = optimize_svg(f, tmp); newext = ".svg"
            elif kind == "font": info, err = optimize_font(f, tmp); newext = ".woff2"
            elif kind == "aud": info, err = optimize_audio(f, tmp); newext = ".ogg"
            else:
                pre = tv_check(f); pre.pop("_v"); pre.pop("_fps"); rec["tv_before"] = pre
                if pre["pass"]:
                    info, err, newext = {"mode": "compliant-untouched"}, None, None
                elif a.dry_run:
                    info, err, newext = {"mode": "NON-COMPLIANT", "failed": [k for k, x in pre["checks"].items() if x != "pass"]}, None, None
                else:
                    info, err = tv_fix(f, tmp, a.silent); newext = ".mp4"
        except Exception as e:
            info, err, newext = None, f"{type(e).__name__}: {e}", None
        rec["seconds"] = round(time.time() - t0, 2)
        if err or info is None:
            rec.update(status="skipped", reason=err or "n/a")
        elif newext is None:
            rec.update(status="ok", **info)
        else:
            after = os.path.getsize(tmp)
            keep = a.keep_originals or (not git_tracked(f) and not a.delete_originals)
            if kind in ("img", "svg", "font", "aud") and not (after < 0.9 * rec["before"]) and not (kind == "img" and info.get("scaled")):
                rec.update(status="kept-source", reason="result not <90% of source", after=after, **info)
            elif a.dry_run:
                rec.update(status="would-convert", after=after, new=f.with_suffix(newext).name, **info)
            else:
                dst = f.with_suffix(newext)
                if kind == "vid" and dst == f and not keep and not a.delete_originals:
                    dst = f.with_name(f.stem + ".tv.mp4")
                if keep and dst != f or (kind == "vid" and dst == f and keep):
                    od = root / "_orig" / Path(key).parent; od.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(f), str(od / f.name))
                elif a.delete_originals and dst != f:
                    f.unlink()
                os.replace(tmp, dst)
                rec.update(status="converted", after=after, new=dst.name, **info)
                if dst.name != f.name:
                    mapping_by_root.setdefault(root, {})[f.name] = dst.name
        if os.path.exists(tmp): os.remove(tmp)
        for k in ("tv_after", "tv_before"):
            pass
        report.append(rec)
        if not a.dry_run:
            fin = (f.with_name(rec["new"]) if rec.get("status") == "converted" and rec["new"] != f.name else f)
            if fin.exists():
                fs = fin.stat()
                lock[fin.relative_to(root).as_posix()] = {"size": fs.st_size, "mtime": fs.st_mtime_ns, "settings": settings, "sha1": sha1(fin)}
    refs = []
    if not a.dry_run:
        for root, lock in locks.items():
            (root / "assets.lock.json").write_text(json.dumps(lock, indent=1), encoding="utf-8")
            m = mapping_by_root.get(root, {})
            if m:
                mp = root / "assets.map.json"
                old = json.loads(mp.read_text()) if mp.exists() else {}
                recs = {r["file"]: r for r in report if r.get("status") == "converted"}
                for r in recs.values():
                    old[r["file"]] = {"new": r["new"], "bytes_before": r["before"], "bytes_after": r["after"], "mode": r["mode"], "ssim": r.get("ssim")}
                mp.write_text(json.dumps(old, indent=1, ensure_ascii=False), encoding="utf-8")
            vids = [r for r in report if r.get("kind") == "vid" and r.get("tv_before")]
            if vids:
                (root / "tv-report.json").write_text(json.dumps([{k: r.get(k) for k in ("file", "status", "mode", "tv_before", "tv_after")} for r in vids], indent=1), encoding="utf-8")
            if a.rewrite_refs and m:
                rewrite_refs(root, m, True, refs)
    tot = {"files": len(report), "converted": sum(r.get("status") == "converted" for r in report),
           "before": sum(r.get("before", 0) for r in report if r.get("status") in ("converted", "would-convert")),
           "after": sum(r.get("after", 0) for r in report if r.get("status") in ("converted", "would-convert")),
           "seconds": round(time.time() - t_start, 2), "dry_run": a.dry_run}
    out = {"tool": "optimize_assets " + VERSION, "totals": tot, "results": report, "rewrites": refs}
    if a.report:
        Path(a.report).parent.mkdir(parents=True, exist_ok=True)
        Path(a.report).write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    for r in report:
        if r.get("status") not in ("cached-skip",):
            print(f'{r.get("status"):14} {r["file"]}  {r.get("before","")}->{r.get("after","")}  {r.get("mode","")}  {r.get("reason","")}')
    for r in refs: print("rewrite", r["file"], r["replacements"])
    print(json.dumps(tot))
    return 0


if __name__ == "__main__":
    sys.exit(main())
