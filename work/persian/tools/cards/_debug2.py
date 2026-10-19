import sys, numpy as np
sys.stdout.reconfigure(encoding="utf-8")
from PIL import Image
sys.path.insert(0, r"D:\P\project\persianArts\work\persian\tools\cards")
import importlib.util
spec = importlib.util.spec_from_file_location("ap", r"D:\P\project\persianArts\work\persian\tools\cards\analyze-posters.py")
ap = importlib.util.module_from_spec(spec); spec.loader.exec_module(ap)

for name in ["chipcycle", "counter", "assembly"]:
    p = r"D:\P\project\persianArts\library\media\typography\%s\poster.webp" % name
    im = Image.open(p).convert("RGB")
    full = np.asarray(im).astype(np.float32) / 255.0
    small = np.asarray(im.resize((240, 135), Image.BILINEAR)).astype(np.float32) / 255.0
    bg, bf = ap.dominant_colour(small.reshape(-1, 3))
    arr = full[::2, ::2]
    h, w = arr.shape[:2]
    d_bg = np.linalg.norm(arr - bg.reshape(1, 1, 3), axis=2)
    nonbg = d_bg > 0.12
    lum = ap.lum709(arr)
    k = 5
    pad = np.pad(lum, 2, mode="edge")
    acc = np.zeros_like(lum)
    for dy in range(k):
        for dx in range(k):
            acc += pad[dy:dy + h, dx:dx + w]
    dev = np.abs(lum - acc / 25.0)
    pad2 = np.pad(dev, 2, mode="edge")
    acc2 = np.zeros_like(dev)
    for dy in range(k):
        for dx in range(k):
            acc2 += pad2[dy:dy + h, dx:dx + w]
    sm = acc2 / 25.0
    for t in (0.01, 0.02, 0.04):
        panel = nonbg & (sm < t)
        rows = panel.mean(1)
        print("%-10s smooth<%.2f  panel_frac=%.3f  maxrow=%.2f rows>0.3=%d maxcol=%.2f" % (
            name, t, panel.mean(), rows.max(), int((rows > 0.30).sum()), panel.mean(0).max()))
    print("   nonbg frac %.3f  lumdev p50 %.4f p90 %.4f" % (nonbg.mean(), np.percentile(dev, 50), np.percentile(dev, 90)))
