"""Crop-level SSIM + edge/banding proxies for frame-format comparisons (run with -I).
Usage: python -I crop_ssim.py <ref.png> <test.png> ...
Crops: top / middle / bottom third of the 1080-wide frame (full width). Banding proxy: fraction of
pixels in a smooth-gradient zone (low local gradient) whose value differs from neighbours by exactly 1 level.
"""
import sys
import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity as ssim
from skimage.filters import sobel

def load(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.uint8)

ref_p, *tests = sys.argv[1:]
ref = load(ref_p)
H = ref.shape[0]
bands = {"top": slice(0, H // 3), "mid": slice(H // 3, 2 * H // 3), "bot": slice(2 * H // 3, H)}
for t in tests:
    im = load(t)
    row = []
    for name, sl in bands.items():
        a, b = ref[sl], im[sl]
        s = ssim(a, b, channel_axis=2, data_range=255)
        edge = sobel(a.mean(axis=2) / 255.0)
        row.append(f"{name} ssim={s:.6f} edgeMAE={np.abs(edge - sobel(b.mean(axis=2)/255.0)).mean()*1000:.3f}")
    print(t.split('/')[-1], " | ".join(row))
