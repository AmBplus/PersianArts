import sys, os, numpy as np
sys.path.insert(0, r"D:\P\project\persianArts\work\persian\tools\cards")
sys.stdout.reconfigure(encoding="utf-8")
from PIL import Image
import importlib.util
spec = importlib.util.spec_from_file_location("ap", r"D:\P\project\persianArts\work\persian\tools\cards\analyze-posters.py")
ap = importlib.util.module_from_spec(spec); spec.loader.exec_module(ap)

targets = sys.argv[1:] or ["assembly", "chipcycle"]
for name in targets:
    p = r"D:\P\project\persianArts\library\media\typography\%s\poster.webp" % name
    im = Image.open(p).convert("RGB")
    W, H = im.size
    full = np.asarray(im).astype(np.float32) / 255.0
    small = np.asarray(im.resize((240, 135), Image.BILINEAR)).astype(np.float32) / 255.0
    pxs = small.reshape(-1, 3)
    bg, bf = ap.dominant_colour(pxs)
    print("==", name, W, H, "bg", ap.hex_of(bg), "frac %.2f" % bf)
    d = np.linalg.norm(full - bg.reshape(1, 1, 3), axis=2)
    ink = d > 0.28
    rows = ink.mean(1)
    sm = ap.box_profile(rows, 13)
    thr = max(0.06, 0.30 * sm.max())
    print("   ink rows: max %.3f thr %.3f  ink frac total %.3f" % (sm.max(), thr, ink.mean()))
    idx = np.flatnonzero(sm >= thr)
    runs, s, prev = [], idx[0], idx[0]
    for i in idx[1:]:
        if i - prev <= 54:
            prev = i
        else:
            runs.append((s, prev)); s = prev = i
    runs.append((s, prev))
    for a, b in runs:
        print("     run y %4d-%4d  h=%4d  peak=%.3f" % (a, b, b - a + 1, sm[a:b + 1].max()))
    bh, ln, y0, y1, cov, pitch = ap.type_block(ink)
    print("   type_block h=%d lines=%d pitch=%.1f y=%d-%d" % (bh, ln, pitch, y0, y1))
    # grid periodicity on background high-pass (small)
    gray = ap.lum709(small)
    k = 5
    pad = np.pad(gray, 2, mode="edge")
    acc = np.zeros_like(gray)
    for dy in range(k):
        for dx in range(k):
            acc += pad[dy:dy + 135, dx:dx + 240]
    hp = gray - acc / 25.0
    bgmask = (~(np.linalg.norm(pxs - bg.reshape(1, 3), axis=1) > 0.28)).reshape(135, 240)
    hpm = hp * bgmask
    # autocorr along x and y
    for axis, lab in ((1, "x"), (0, "y")):
        prof = hpm.mean(axis=axis)
        a = prof - prof.mean()
        if np.abs(a).sum() < 1e-9:
            continue
        F = np.fft.rfft(a, 4096); ac = np.fft.irfft(F * np.conj(F))[:len(a)]
        ac = ac / ac[0]
        print("   autocorr %s: peak(3..60)=%.3f at lag %d ; ac[5..20]=%s" % (
            lab, ac[3:60].max(), 3 + int(np.argmax(ac[3:60])),
            np.round(ac[5:21:3], 3)))
    # edge rows / cols
    lu = ap.lum709(full)
    for thr_e in (0.02, 0.04, 0.08):
        gx = np.abs(np.diff(lu, axis=1)); gy = np.abs(np.diff(lu, axis=0))
        cf = (gx > thr_e).mean(1); rf = (gy > thr_e).mean(0)
        print("   edge thr %.2f  rows>0.5:%d cols>0.5:%d  maxrow %.2f @%d  maxcol %.2f @%d" % (
            thr_e, int((cf > 0.5).sum()), int((rf > 0.5).sum()),
            cf.max(), int(np.argmax(cf)), rf.max(), int(np.argmax(rf))))
