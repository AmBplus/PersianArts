import sys, numpy as np
sys.stdout.reconfigure(encoding="utf-8")
from PIL import Image
import importlib.util
spec = importlib.util.spec_from_file_location("ap", r"D:\P\project\persianArts\work\persian\tools\cards\analyze-posters.py")
ap = importlib.util.module_from_spec(spec); spec.loader.exec_module(ap)
for name in ["assembly", "countdown", "counter"]:
    p = r"D:\P\project\persianArts\library\media\typography\%s\poster.webp" % name
    im = Image.open(p).convert("RGB")
    lu = ap.lum709(np.asarray(im).astype(np.float32) / 255.0)
    gx = np.abs(np.diff(lu, axis=1)); gy = np.abs(np.diff(lu, axis=0))
    cf = (gx > 0.004).mean(1); rf = (gy > 0.004).mean(0)
    print(name, "lum col0-3:", np.round(lu[:4, 500], 4), "row57-60:", np.round(lu[55:62, 900], 4))
    print("   cf>0.5 rows:", int((cf > 0.5).sum()), "top cf:", np.round(np.sort(cf)[-6:], 3),
          "rf>0.5 cols:", int((rf > 0.5).sum()), "top rf:", np.round(np.sort(rf)[-6:], 3))
    for t in (0.004, 0.008, 0.012):
        print("      thr %.3f rows>0.4:%d cols>0.4:%d rows>0.6:%d cols>0.6:%d" % (
            t, int(((gx > t).mean(1) > 0.4).sum()), int(((gy > t).mean(0) > 0.4).sum()),
            int(((gx > t).mean(1) > 0.6).sum()), int(((gy > t).mean(0) > 0.6).sum())))
