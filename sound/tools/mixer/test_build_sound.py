#!/usr/bin/env python3
"""Regression test for build_sound.py (L-a settle role). Usage: python sound/tools/mixer/test_build_sound.py
1) rebuilds pencil v2 and compares cues-resolved with media/film-versions/pencil-html/v2-rebuild (must be identical)
2) adds a NON-final type=settle event mid-film: settle_s must stay the role=final one and the bed must not be silent."""
import json, subprocess, sys, tempfile, copy
from pathlib import Path
R = Path(__file__).resolve().parents[3]
FILM = R / "media/film-versions/pencil-html/v2/silent-9x16.mp4"
EV = R / "sound/tools/mixer/examples/pencil-v2.events.json"
BASE = R / "media/film-versions/pencil-html/v2-rebuild/cues-resolved.json"

def build(ev, out):
    p = subprocess.run([sys.executable, str(R / "sound/tools/mixer/build_sound.py"), "--film", str(FILM), "--events", str(ev),
                        "--track", "tr-lnplus-597024", "--out-dir", str(out)], capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr

def main():
    tmp = Path(tempfile.mkdtemp(prefix="bs-test-"))
    rc, o = build(EV, tmp / "a")
    assert rc == 0, o[-800:]
    a = json.load(open(tmp / "a/cues-resolved.json", encoding="utf-8"))
    b = json.load(open(BASE, encoding="utf-8"))
    assert a == b, "cues-resolved differs from baseline v2-rebuild"
    doc = json.load(open(EV, encoding="utf-8"))
    mid = copy.deepcopy([e for e in doc["events"] if e["type"] != "settle"][3]); mid.update(name="mid settle (non-final)", type="settle"); mid.pop("role", None)
    mid["frame"] = 120; doc["events"].append(mid)
    json.dump(doc, open(tmp / "b.json", "w", encoding="utf-8"))
    rc, o = build(tmp / "b.json", tmp / "b")
    assert rc == 0, "mid-film non-final settle broke the build:\n" + o[-800:]
    s = [x for x in (tmp / "b/VERSION.json", tmp / "b/verify.json") if x.exists()]
    print("PASS build_sound regression (cues identical; non-final settle does not end the bed)", tmp)

main()
