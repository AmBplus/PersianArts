#!/usr/bin/env python3
"""fetch_pixabay_track.py - save a few hand-picked Pixabay Music tracks, run by the owner on their own PC.

    python fetch_pixabay_track.py --out media/music-pixabay URL [URL ...]

Opens a visible Chrome window (persistent profile). Verification/login pages are solved by the owner by hand;
the script only waits. The audio is saved via the page's own Download control (Playwright download event).
"""
import argparse
import datetime
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

MAX_URLS = 5
DEFAULT_OUT = str(__import__("pathlib").Path(__import__("os").environ.get("PA_ROOT") or __import__("pathlib").Path(__file__).resolve().parents[2]) / "media" / "music-pixabay")  # repo-relative; PA_ROOT overrides
LICENSE_NOTE = ("Pixabay Content License: see https://pixabay.com/service/license-summary/ "
                "(owner to confirm before publishing)")


def valid_url(url):
    p = urlparse(url.strip())
    return p.scheme == "https" and p.netloc in ("pixabay.com", "www.pixabay.com") and p.path.startswith("/music/") \
        and len([s for s in p.path.split("/") if s]) >= 2


def slug_from_url(url):
    parts = [s for s in urlparse(url.strip()).path.split("/") if s]
    last = parts[-1] if parts else "track"
    slug = re.sub(r"[^a-z0-9]+", "-", last.lower()).strip("-")
    return slug or "track"


def in_git_tree(path):
    p = Path(path).expanduser().resolve()
    return any((d / ".git").exists() for d in [p, *p.parents])


def validate_args(urls, out, allow_in_repo):
    if not urls:
        return "give 1 to %d Pixabay track page URLs" % MAX_URLS
    if len(urls) > MAX_URLS:
        return "at most %d URLs per run (got %d)" % (MAX_URLS, len(urls))
    bad = [u for u in urls if not valid_url(u)]
    if bad:
        return "only https://pixabay.com/music/... track pages are accepted: " + ", ".join(bad)
    if in_git_tree(out) and not allow_in_repo:
        return "--out is inside a git working tree; audio must stay out of git (use --allow-in-repo to override)"
    return None


def check():
    ok = True
    print("Python %s" % sys.version.split()[0])
    if sys.version_info < (3, 8):
        print("FAIL: Python 3.8+ needed")
        return 1
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("FAIL: playwright not importable. Run: pip install playwright")
        return 1
    print("playwright import: ok")
    try:
        import tempfile
        with tempfile.TemporaryDirectory() as tmp, sync_playwright() as pw:
            ctx = pw.chromium.launch_persistent_context(tmp, channel="chrome", headless=False)
            ctx.close()
        print("Chrome launch: ok")
    except Exception as e:
        print("FAIL: cannot launch Chrome (is Google Chrome installed?): %s" % e)
        ok = False
    return 0 if ok else 1


def read_meta(page):
    title, artist = "unknown", "unknown"
    try:
        h1 = page.locator("h1").first
        if h1.count():
            title = h1.inner_text(timeout=2000).strip() or title
        else:
            og = page.locator('meta[property="og:title"]').first
            if og.count():
                title = og.get_attribute("content") or title
        a = page.locator('a[href^="/users/"]').first
        if a.count():
            artist = a.inner_text(timeout=2000).strip() or artist
    except Exception:
        pass
    return title, artist


def track_page_ready(page):
    try:
        u = urlparse(page.url)
        return u.netloc.endswith("pixabay.com") and u.path.startswith("/music/") \
            and page.locator("h1").count() > 0 and "just a moment" not in page.title().lower()
    except Exception:
        return False


def wait_for_page(page, timeout_s):
    print("  If a verification or login page appears, solve it by hand in the browser window. "
          "(اگر صفحه تأیید یا ورود آمد، خودتان در پنجره مرورگر انجام دهید.)")
    end = time.time() + timeout_s
    shown = False
    while time.time() < end:
        if track_page_ready(page):
            return True
        if not shown and time.time() > end - timeout_s + 8:
            print("  Waiting for you to finish in the browser... (منتظر شما هستم)")
            shown = True
        time.sleep(2)
    return False


def find_download_control(page):
    import re as _re
    for role in ("button", "link"):
        loc = page.get_by_role(role, name=_re.compile(r"^\s*download", _re.I))
        if loc.count():
            return loc.first
    return None


def get_download(page, timeout_s):
    from playwright.sync_api import TimeoutError as PWTimeout
    ctl = find_download_control(page)
    if ctl is not None:
        try:
            with page.expect_download(timeout=30000) as info:
                ctl.click()
            return info.value
        except PWTimeout:
            print("  Download did not start by itself; a dialog may need a click.")
    print("  Please click Download in the browser window yourself; I will save the file. "
          "(لطفاً خودتان دکمه Download را بزنید.)")
    try:
        with page.expect_download(timeout=timeout_s * 1000) as info:
            pass
        return info.value
    except PWTimeout:
        return None


def probe_duration(path):
    if not shutil.which("ffprobe"):
        return None
    try:
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True, timeout=30)
        return float(r.stdout.strip())
    except Exception:
        return None


def save_one(page, url, out, timeout_s):
    slug = slug_from_url(url)
    print("\n== %s" % url)
    page.goto(url, wait_until="domcontentloaded")
    if not wait_for_page(page, timeout_s):
        print("  Timed out waiting for the track page; skipped.")
        return False
    title, artist = read_meta(page)
    dl = get_download(page, timeout_s)
    if dl is None:
        print("  No download captured; skipped.")
        return False
    mp3 = out / (slug + ".mp3")
    dl.save_as(str(mp3))
    stamp = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    (out / (slug + ".txt")).write_text(
        "page: %s\ntitle: %s\nartist: %s\ndownloaded: %s\n%s\n" % (url, title, artist, stamp, LICENSE_NOTE),
        encoding="utf-8")
    print("  Saved: %s (%.2f MB)" % (mp3, mp3.stat().st_size / 1e6))
    dur = probe_duration(mp3)
    if dur is not None:
        print("  Duration: %.1f s" % dur)
    return True


def main(argv=None):
    ap = argparse.ArgumentParser(description="Save up to %d hand-picked Pixabay Music tracks via your own Chrome." % MAX_URLS)
    ap.add_argument("urls", nargs="*", help="Pixabay track page URLs (https://pixabay.com/music/...)")
    ap.add_argument("--out", default=DEFAULT_OUT, help="output folder (default: %(default)s)")
    ap.add_argument("--profile", default=str(Path.home() / ".pixabay-fetch-profile"), help="persistent Chrome profile folder")
    ap.add_argument("--timeout", type=int, default=600, help="seconds to wait for you per track (default 600)")
    ap.add_argument("--allow-in-repo", action="store_true", help="allow --out inside a git working tree")
    ap.add_argument("--check", action="store_true", help="verify Python, playwright and Chrome; visits no site")
    args = ap.parse_args(argv)
    if args.check:
        return check()
    err = validate_args(args.urls, args.out, args.allow_in_repo)
    if err:
        print("Error: " + err, file=sys.stderr)
        return 2
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Error: pip install playwright", file=sys.stderr)
        return 1
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    done = 0
    with sync_playwright() as pw:
        ctx = pw.chromium.launch_persistent_context(args.profile, channel="chrome", headless=False,
                                                    accept_downloads=True)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        for url in args.urls:
            try:
                done += save_one(page, url, out, args.timeout)
            except Exception as e:
                print("  Failed: %s" % e)
        ctx.close()
    print("\nDone: %d of %d saved to %s" % (done, len(args.urls), out))
    return 0 if done == len(args.urls) else 1


if __name__ == "__main__":
    sys.exit(main())
