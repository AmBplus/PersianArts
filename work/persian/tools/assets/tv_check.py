#!/usr/bin/env python3
"""tv_check.py <files...>  : TV-playability check only; exit 1 on any fail."""
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from optimize_assets import tv_check

bad = 0
for f in sys.argv[1:]:
    r = tv_check(f); r.pop("_v"); r.pop("_fps")
    fails = [k for k, x in r["checks"].items() if x != "pass"]
    print(("PASS " if r["pass"] else "FAIL ") + f"{r['file']} {r['profile']} L{r['level']} {r['pix_fmt']} {r['range']} {r['fps']}fps gop={r['gop_s']}s {r['size']} {r['audio']}" + ("  fails: " + ",".join(fails) if fails else ""))
    bad += not r["pass"]
sys.exit(1 if bad else 0)
