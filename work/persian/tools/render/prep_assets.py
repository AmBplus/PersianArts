"""Convert raster assets to WebP variants + manifest with SSIM against the source.

Usage (run with -I from repo root):
  python -I work/persian/tools/render/prep_assets.py --out <dir> [--max-w N --max-h N] <img> [<img> ...]

Writes <dir>/<stem>-q{85,90,95}.webp and <dir>/<stem>-lossless.webp, plus <dir>/manifest.json.
Never upscales. Metadata is stripped (Pillow saves no EXIF/ICC unless passed). Alpha is kept.
SSIM is computed on the decoded WebP vs the decoded source, RGBA composited on the same grey background.
"""
import argparse, io, json, os, time
from PIL import Image
import numpy as np
from skimage.metrics import structural_similarity as ssim


def composite(img):
    img = img.convert("RGBA")
    bg = Image.new("RGBA", img.size, (128, 128, 128, 255))
    return np.asarray(Image.alpha_composite(bg, img).convert("RGB"), dtype=np.uint8)


def variants(src_img, args):
    W, H = src_img.size
    scale = 1.0
    if args.max_w or args.max_h:
        sw = (args.max_w / W) if args.max_w else 1.0
        sh = (args.max_h / H) if args.max_h else 1.0
        scale = min(1.0, sw, sh)  # never upscale
    nw, nh = max(1, round(W * scale)), max(1, round(H * scale))
    img = src_img.convert("RGBA") if src_img.mode in ("RGBA", "LA", "P") else src_img.convert("RGB")
    if (nw, nh) != (W, H):
        img = img.resize((nw, nh), Image.LANCZOS)
    out = [("q85", {"quality": 85}), ("q90", {"quality": 90}), ("q95", {"quality": 95}), ("lossless", {"lossless": True})]
    return img, out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--max-w", type=int, default=0)
    ap.add_argument("--max-h", type=int, default=0)
    ap.add_argument("inputs", nargs="+")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    manifest = []
    for path in a.inputs:
        src = Image.open(path)
        src.load()
        stem = os.path.splitext(os.path.basename(path))[0]
        src_bytes = os.path.getsize(path)
        ref = composite(src)
        base, variants_spec = variants(src, a)
        for name, kw in variants_spec:
            t0 = time.perf_counter()
            buf = io.BytesIO()
            base.save(buf, format="WEBP", method=6, **kw)  # no exif/icc passed => metadata stripped
            enc_s = time.perf_counter() - t0
            data = buf.getvalue()
            outp = os.path.join(a.out, f"{stem}-{name}.webp")
            with open(outp, "wb") as f:
                f.write(data)
            dec = Image.open(io.BytesIO(data))
            dec.load()
            t1 = time.perf_counter()
            for _ in range(5):
                Image.open(io.BytesIO(data)).load()
            dec_ms = (time.perf_counter() - t1) / 5 * 1000
            test = composite(dec)
            if test.shape != ref.shape:
                test = np.asarray(Image.fromarray(test).resize((ref.shape[1], ref.shape[0])))
            s = ssim(ref, test, channel_axis=2, data_range=255)
            manifest.append({
                "source": path, "variant": f"{stem}-{name}.webp", "srcSizeBytes": src_bytes,
                "webpSizeBytes": len(data), "ratio": round(len(data) / src_bytes, 4),
                "srcSize": [src.size[0], src.size[1]], "outSize": list(base.size),
                "mode": src.mode, "encodeSeconds": round(enc_s, 3), "pilDecodeMsAvg5": round(dec_ms, 2),
                "ssimVsSource": round(float(s), 6),
            })
            print(manifest[-1])
    with open(os.path.join(a.out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)


if __name__ == "__main__":
    main()
