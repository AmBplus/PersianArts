#!/usr/bin/env python3
"""Self-test for the three deliver/pa fixes (D1, D2, D3) in this repo.

Run:  python work/persian/tools/test_deliver_fixes.py

Every check asserts the REAL tool behaviour (subprocess calls to pa.ps1 / node / python) where possible.
The two checks that cannot re-run the deleted code are marked "legacy" and execute the old EXPRESSION in
PowerShell or recompute the old token comparison, so a regression to the old behaviour makes them fail.
"""
import json
import os
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
PA = ROOT / "work/persian/tools/pa.ps1"
ASSETS = ROOT / "work/persian/tools/assets"
COMPRESS = ROOT / "work/persian/tools/deliver/compress.mjs"
DELIVER = ROOT / "work/persian/tools/deliver/deliver.mjs"
FAILING = ROOT / "media/film-versions/_smoke/smoke-9x16.mp4"
PROBE_DIR = ROOT / "media/briefs-local/storylab-batch2/_probe"
PASSING = PROBE_DIR / "probe-9x16.mp4"
FAIL_KEYS = ["range_tv", "bt709_tags", "audio_aac_lc_stereo_48k"]

results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + name + (("  :: " + detail) if detail and not ok else ""))


def run(cmd, **kw):
    p = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def node_json(js_body):
    """Run js_body as an ES module in the repo root; it must print one JSON line. None if node fails."""
    h = subprocess.run(["node", "--input-type=module", "-e", js_body], cwd=str(ROOT), capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    if h.returncode != 0:
        print("      node probe failed: " + ((h.stderr or h.stdout or "").strip().splitlines() or ["?"])[-1])
        return None
    lines = [l for l in h.stdout.splitlines() if l.strip().startswith("{")]
    return json.loads(lines[-1]) if lines else None


def build_passing_probe():
    """Copy the known-failing smoke file and let optimize_assets.py fix it, then prove it passes."""
    PROBE_DIR.mkdir(parents=True, exist_ok=True)
    if not FAILING.exists():
        return False
    if not PASSING.exists():
        shutil.copyfile(FAILING, PASSING)
    if run(["python", str(ASSETS / "optimize_assets.py"), str(PASSING)])[0] != 0:
        # already-fixed file: optimize_assets may report nothing to do; the tv_check below is the real gate
        pass
    code, out = run(["python", str(ASSETS / "tv_check.py"), str(PASSING)])
    return code == 0 and out.strip().startswith("PASS")


# ---------------------------------------------------------------- D1
def test_d1():
    if not FAILING.exists():
        check("D1 one-path", False, "missing fixture " + str(FAILING))
        return
    rel = FAILING.relative_to(ROOT).as_posix()

    code, out = run(["pwsh", "-File", str(PA), "assets", "tv-check", rel])
    check("D1 one path: python receives the path, not its characters",
          code == 1 and "FAIL " + rel in out and "No such file or directory: 'm'" not in out,
          f"exit={code} out={out.strip()[:300]}")
    check("D1 one path: real TV fail keys reported",
          all(k in out for k in FAIL_KEYS), out.strip()[:300])

    code2, out2 = run(["pwsh", "-File", str(PA), "assets", "tv-check", rel, rel])
    check("D1 two paths: both paths reach python",
          code2 == 1 and out2.count("FAIL " + rel) >= 2, f"exit={code2} out={out2.strip()[:300]}")

    # legacy: the OLD expression (no outer @()) evaluated by real PowerShell, not by this test's opinion
    ps = ("$Id='" + rel + "'; $Arg3=$null; $More=@(); "
          "$old = @($Id, $Arg3) + @($More) | Where-Object { $_ }; $new = @(@($Id, $Arg3) + @($More) | Where-Object { $_ }); "
          "Write-Output ('old=' + $old.GetType().Name + ' new=' + $new.GetType().Name + ' oldlen=' + $old.Length)")
    code3, out3 = run(["pwsh", "-Command", ps])
    check("D1 legacy expression (no outer @()) still unwraps to a scalar String",
          code3 == 0 and "old=String" in out3 and "new=Object[]" in out3, out3.strip())
    check("D1 legacy scalar would splat character by character (length == len(path))",
          f"oldlen={len(rel)}" in out3, out3.strip())


# ---------------------------------------------------------------- D2
def test_d2():
    src = COMPRESS.read_text(encoding="utf-8")
    check("D2 compress.mjs no longer compares against the lowercase 'fail' token", "v === 'fail'" not in src)
    if not PASSING.exists() and not build_passing_probe():
        check("D2 passing fixture", False, "could not build a TV-passing probe file")
        return
    check("D2 passing fixture really passes the standalone checker", build_passing_probe())

    js = """
const { execFileSync } = await import('node:child_process');
const path = await import('node:path');
const ASSETS = """ + json.dumps(str(ASSETS).replace("\\", "/")) + """;
const mod = await import(""" + json.dumps(COMPRESS.as_uri()) + """);
function raw(f) {
  const code = `import sys,json;sys.path.insert(0, r"${ASSETS}");import optimize_assets as o,pathlib;r=o.tv_check(pathlib.Path(sys.argv[1]));print(json.dumps(r['checks']))`;
  return JSON.parse(execFileSync('python', ['-c', code, f], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }));
}
function oldTvCheck(f) {  // the OLD body, kept here to prove the old behaviour was wrong
  const c = raw(f);
  const bad = Object.entries(c).filter(([, v]) => v === 'fail').map(([k]) => k);
  return bad.length ? 'FAIL:' + bad.join(',') : 'pass';
}
const failing = """ + json.dumps(str(FAILING)) + """;
const passing = """ + json.dumps(str(PASSING)) + """;
console.log(JSON.stringify({
  old_failing: oldTvCheck(failing),
  new_failing: mod.tvCheckResult(failing),
  old_passing: oldTvCheck(passing),
  new_passing: mod.tvCheckResult(passing),
  new_missing: mod.tvCheckResult(path.join(path.dirname(passing), 'nope-does-not-exist.mp4')),
}));
"""
    r = node_json(js)
    if r is None:
        check("D2 new tvCheckResult is exported and callable", False, "node probe failed (see above)")
        return
    check("D2 legacy 'v === \\'fail\\'' reports the failing file as pass (the old bug)",
          r["old_failing"] == "pass", json.dumps(r["old_failing"]))
    check("D2 new tvCheckResult fails the failing file with the real keys",
          r["new_failing"]["ok"] is False and r["new_failing"]["checked"] is True and
          set(r["new_failing"]["detail"].replace("FAIL:", "").split(",")) == set(FAIL_KEYS), json.dumps(r["new_failing"]))
    check("D2 both old and new accept the passing file",
          r["old_passing"] == "pass" and r["new_passing"]["ok"] is True and r["new_passing"]["detail"] == "pass",
          json.dumps([r["old_passing"], r["new_passing"]]))
    check("D2 a python error is a failure-shaped value, not an exception and not a pass",
          r["new_missing"]["ok"] is False and r["new_missing"]["checked"] is False and
          "checker-error(" in r["new_missing"]["detail"], json.dumps(r["new_missing"]))
    check("D2 compress bails out instead of renaming when the checker cannot run",
          "if (!tvr.checked)" in src and "tv check could not run" in src)


# ---------------------------------------------------------------- D3
def test_d3():
    src = DELIVER.read_text(encoding="utf-8")
    check("D3 deliver.mjs re-checks instead of printing vj.verify.tv_check",
          "tvSafeVerdict(" in src and "vj.verify?.tv_check ? 'بله" not in src)
    check("D3 deliver.mjs forwards VERSION.json scenery:true as --scenery (run-gates key honoured)",
          "const scenery = vj.scenery === true;" in src and "...(scenery ? ['--scenery'] : [])" in src)

    js = """
const mod = await import(""" + json.dumps(COMPRESS.as_uri()) + """);
const v = (c, files) => mod.tvSafeVerdict(c, files);
console.log(JSON.stringify({
  claimed_only: v('pass', []),
  claimed_failing: v('pass', [""" + json.dumps(str(FAILING)) + """]),
  claimed_passing: v('pass', [""" + json.dumps(str(PASSING)) + """]),
  checker_cannot_run: v('pass', [""" + json.dumps(str(PROBE_DIR / "missing.mp4")) + """]),
}));
"""
    r = node_json(js)
    if r is None:
        check("D3 tvSafeVerdict is exported and callable", False, "node probe failed (see above)")
        return
    check("D3 a claim with nothing checked says 'claimed, not verified'",
          "claimed, not verified" in r["claimed_only"] and "بله" not in r["claimed_only"], r["claimed_only"])
    check("D3 a claimed pass on a failing file is reported as a verified NO, not as yes",
          r["claimed_failing"].startswith("خیر") and "بازبینی شد" in r["claimed_failing"] and
          all(k in r["claimed_failing"] for k in FAIL_KEYS), r["claimed_failing"])
    check("D3 a claimed pass on a passing file is reported as a verified YES",
          r["claimed_passing"].startswith("بله") and "بازبینی شد" in r["claimed_passing"], r["claimed_passing"])
    check("D3 a checker that cannot run is labelled claimed, not verified (with the reason)",
          "claimed, not verified" in r["checker_cannot_run"] and "checker-error(" in r["checker_cannot_run"],
          r["checker_cannot_run"])


if __name__ == "__main__":
    print("test_deliver_fixes: " + str(ROOT))
    test_d1()
    test_d2()
    test_d3()
    bad = [n for n, ok, _ in results if not ok]
    print(f"\n{len(results) - len(bad)}/{len(results)} checks passed")
    if bad:
        print("FAILED: " + "; ".join(bad))
        sys.exit(1)
    print("all checks passed")
