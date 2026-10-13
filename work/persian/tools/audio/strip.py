#!/usr/bin/env python3
"""pa strip <mp4> <t0> <t1> [--every 3] [--out strip.jpg] [--cols 8] [--height 270]
Transition strip (L-c): extracts a frame every N frames between t0 and t1 seconds of the FINAL mp4 (not the silent
preview, not before the last render) and tiles them into one contact sheet with frame numbers. Run it for every scene
transition, in BOTH ratios, and LOOK at the sheet. Needs ffmpeg + Pillow."""
import argparse, subprocess, tempfile, sys
from pathlib import Path
from PIL import Image, ImageDraw

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("mp4"); ap.add_argument("t0", type=float); ap.add_argument("t1", type=float)
    ap.add_argument("--every", type=int, default=3); ap.add_argument("--out"); ap.add_argument("--cols", type=int, default=8); ap.add_argument("--height", type=int, default=270)
    a = ap.parse_args()
    out = Path(a.out or (Path(a.mp4).with_suffix("").name + "-strip-%g-%g.jpg" % (a.t0, a.t1)))
    d = Path(tempfile.mkdtemp(prefix="strip-"))
    fps = float(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", a.mp4], capture_output=True, text=True).stdout.strip().split("/")[0] or 30) if False else None
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", a.mp4], capture_output=True, text=True).stdout.strip()
    n, dn = (r.split("/") + ["1"])[:2]; fps = float(n) / float(dn)
    subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a.t0), "-to", str(a.t1), "-i", a.mp4, "-vf", "select='not(mod(n,%d))',scale=-2:%d" % (a.every, a.height), "-vsync", "0", "-q:v", "3", str(d / "f%04d.jpg")], check=True)
    fr = sorted(d.glob("f*.jpg"))
    if not fr: sys.exit("no frames extracted")
    ims = [Image.open(f) for f in fr]; w, h = ims[0].size
    rows = (len(ims) + a.cols - 1) // a.cols
    sheet = Image.new("RGB", (w * a.cols, h * rows), (20, 20, 20))
    for i, im in enumerate(ims):
        x, y = (i % a.cols) * w, (i // a.cols) * h
        sheet.paste(im, (x, y)); dr = ImageDraw.Draw(sheet)
        dr.rectangle([x, y, x + 92, y + 14], fill=(0, 0, 0)); dr.text((x + 3, y + 1), "%.2fs f%d" % (a.t0 + i * a.every / fps, round((a.t0 + i * a.every / fps) * fps)), fill=(255, 255, 0))
    sheet.save(out, quality=82, optimize=True, progressive=True)
    print("strip: %d frames -> %s (%dx%d)" % (len(ims), out, sheet.width, sheet.height))

main()
