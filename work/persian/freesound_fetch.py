#!/usr/bin/env python3
"""Fetch CC0 recorded SFX previews (HQ MP3) from the Freesound API v2 into library staging.

Usage (from repo root):
  python work/persian/freesound_fetch.py [--per-category 25] [--categories paper-pencil,whoosh] [--minutes 18]

Resumable: ids already present in sound/library/sfx/freesound/manifest.json are skipped and
never downloaded twice. Credentials come from work/persian/.freesound.env (gitignored) and are
sent only as the 'Authorization: Token <key>' header to freesound.org. They are never printed,
logged, or put in a URL. Preview CDN downloads are sent without the token.
Only MP3 payloads are saved; nothing is executed.
"""
import argparse
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
ENV_FILE = HERE / ".freesound.env"
OUT = ROOT / "sound" / "library" / "sfx" / "freesound"
MANIFEST = OUT / "manifest.json"
LOG = HERE / "freesound-fetch.log"

SEARCH_URL = "https://freesound.org/apiv2/search/text/"
FIELDS = "id,name,username,license,url,duration,previews,tags"
LICENSE_FILTER = 'license:"Creative Commons 0"'
MIN_INTERVAL = 1.1          # seconds between any two HTTP requests (free limit ~60/min)
MAX_BYTES = 8 * 1024 * 1024
UA = "persianarts-sfx-fetch/1.0 (local library staging)"
MAX_PAGES_PER_QUERY = 2

# category -> (max duration seconds, example queries)
CATEGORIES = {
    "paper-pencil": (6.0, ["pencil writing", "pencil scribble", "pen on paper", "marker drawing",
                           "sketch pencil", "paper rustle", "page turn"]),
    "whoosh": (6.0, ["whoosh", "swoosh", "transition whoosh"]),
    "pop": (6.0, ["pop", "bubble pop", "cartoon pop"]),
    "click": (6.0, ["click", "ui click", "mouse click"]),
    "ding": (6.0, ["ding", "success chime", "bell"]),
    "impact": (6.0, ["thud", "hit", "stamp"]),
    "riser": (6.0, ["riser", "build up"]),
    "stinger": (6.0, ["stinger", "logo sting"]),
    "ambience": (15.0, ["room tone", "paper room", "paper crumple", "page flip", "paper ambience"]),
    "boing": (6.0, ["boing", "cartoon boing"]),
}
SYNTH_TAGS = {"synth", "synthesizer", "synthesised", "synthesized", "chiptune", "8bit", "8-bit",
              "midi", "bitcrusher", "sine"}
CC0_MARKERS = ("publicdomain/zero", "creative commons 0", "cc0")


class Stop(Exception):
    """Raised for conditions that must end the run (auth failure, time box)."""


_last_request = [0.0]
rate_limit_events = [0]
rejects = Counter()


def log(msg):
    line = f"{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} {msg}"
    print(line, flush=True)
    with LOG.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def load_env():
    env = {}
    if not ENV_FILE.exists():
        sys.exit(f"missing {ENV_FILE.name} in work/persian (create it with FREESOUND_API_KEY=...)")
    for raw in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def pace():
    wait = MIN_INTERVAL - (time.time() - _last_request[0])
    if wait > 0:
        time.sleep(wait)
    _last_request[0] = time.time()


def http_get(url, headers, max_bytes=None, retries=3):
    """Return (data, content_type, error). Retries on 429 honouring Retry-After."""
    short = url.split("?")[0]
    for _attempt in range(retries + 1):
        pace()
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                ctype = resp.headers.get("Content-Type", "") or ""
                clen = resp.headers.get("Content-Length")
                if max_bytes and clen and clen.isdigit() and int(clen) > max_bytes:
                    return None, ctype, "too-large"
                data = resp.read((max_bytes + 1) if max_bytes else -1)
                if max_bytes and len(data) > max_bytes:
                    return None, ctype, "too-large"
                return data, ctype, None
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                rate_limit_events[0] += 1
                wait = int(exc.headers.get("Retry-After") or 60)
                log(f"429 rate limit on {short}; sleeping {wait}s")
                if wait > 600:
                    raise Stop("daily/long rate limit reached (429 with Retry-After > 600s)")
                time.sleep(wait)
                continue
            if exc.code in (401, 403):
                raise Stop(f"HTTP {exc.code} from {short}: credentials rejected or access denied")
            return None, "", f"HTTP {exc.code}"
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            log(f"network error on {short}: {type(exc).__name__}; retrying")
            time.sleep(5)
    return None, "", "retries-exhausted"


def search(query, page, headers):
    params = {"query": query, "filter": LICENSE_FILTER, "fields": FIELDS,
              "page_size": 60, "page": page}
    data, ctype, err = http_get(SEARCH_URL + "?" + urllib.parse.urlencode(params), headers)
    if err:
        log(f"search '{query}' page {page} failed: {err}")
        return None
    if "json" not in ctype.lower():
        log(f"search '{query}' returned non-JSON ({ctype}); possible login/bot check; skipping query")
        return None
    try:
        return json.loads(data.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        log(f"search '{query}' returned unparsable body; skipping query")
        return None


def is_mp3(data):
    if data[:3] == b"ID3":
        return True
    return len(data) > 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0


def slugify(text):
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()[:60].strip("-")
    return text or "sound"


def accept(sound, max_dur):
    lic = (sound.get("license") or "").lower()
    if not any(marker in lic for marker in CC0_MARKERS):
        return False, "not-cc0"
    try:
        dur = float(sound.get("duration") or 0)
    except (TypeError, ValueError):
        return False, "bad-duration"
    if not (0.1 <= dur <= max_dur):
        return False, "duration"
    tags = {str(t).lower() for t in (sound.get("tags") or [])}
    if tags & SYNTH_TAGS or "synth" in (sound.get("name") or "").lower():
        return False, "synth-tagged"
    return True, ""


def fetch_preview(url):
    """Download the HQ MP3 preview. The token is NOT sent to the CDN."""
    data, ctype, err = http_get(url, {"User-Agent": UA}, max_bytes=MAX_BYTES, retries=2)
    if err:
        return None, err
    if "html" in ctype.lower():
        return None, "html-response (login/captcha?)"
    if not data or not is_mp3(data):
        return None, "not-mp3-payload"
    return data, None


def load_manifest():
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {}


def save_manifest(manifest):
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = MANIFEST.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    os.replace(tmp, MANIFEST)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--per-category", type=int, default=25)
    ap.add_argument("--categories", default="", help="comma-separated subset")
    ap.add_argument("--minutes", type=float, default=18.0, help="time box for this run")
    args = ap.parse_args()

    env = load_env()
    key = env.get("FREESOUND_API_KEY", "")
    if not key:
        sys.exit("FREESOUND_API_KEY is empty in work/persian/.freesound.env")
    headers = {"Authorization": f"Token {key}", "User-Agent": UA, "Accept": "application/json"}

    selected = CATEGORIES
    if args.categories:
        wanted = [c.strip() for c in args.categories.split(",") if c.strip()]
        unknown = [c for c in wanted if c not in CATEGORIES]
        if unknown:
            sys.exit(f"unknown categories: {unknown}")
        selected = {c: CATEGORIES[c] for c in wanted}

    OUT.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest()
    deadline = time.time() + args.minutes * 60
    log(f"run start: per_category={args.per_category} categories={list(selected)} minutes={args.minutes}")

    try:
        for cat, (max_dur, queries) in selected.items():
            have = sum(1 for v in manifest.values() if v.get("category") == cat)
            need = args.per_category - have
            if need <= 0:
                log(f"[{cat}] already has {have}; skipping")
                continue
            (OUT / cat).mkdir(parents=True, exist_ok=True)
            log(f"[{cat}] have={have} need={need}")
            for query in queries:
                if need <= 0 or time.time() > deadline:
                    break
                for page in range(1, MAX_PAGES_PER_QUERY + 1):
                    if need <= 0 or time.time() > deadline:
                        break
                    result = search(query, page, headers)
                    if not result:
                        break
                    for sound in result.get("results", []):
                        if need <= 0 or time.time() > deadline:
                            break
                        sid = str(sound.get("id"))
                        ok, reason = accept(sound, max_dur)
                        if not ok:
                            rejects[reason] += 1
                            continue
                        if sid in manifest:
                            rejects["duplicate"] += 1
                            continue
                        preview = (sound.get("previews") or {}).get("preview-hq-mp3")
                        if not preview:
                            rejects["no-hq-preview"] += 1
                            continue
                        data, err = fetch_preview(preview)
                        if err:
                            rejects[err] += 1
                            log(f"[{cat}] reject id={sid}: {err}")
                            continue
                        slug = slugify(sound.get("name"))
                        rel = f"{cat}/{sid}-{slug}.mp3"
                        dest = OUT / rel
                        dest.write_bytes(data)
                        manifest[sid] = {
                            "name": sound.get("name"),
                            "username": sound.get("username"),
                            "licence": "CC0",
                            "url": sound.get("url"),
                            "duration": sound.get("duration"),
                            "category": cat,
                            "query": query,
                            "preview_type": "hq-mp3",
                            "file": rel,
                            "bytes": len(data),
                            "retrieved_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                        }
                        save_manifest(manifest)
                        need -= 1
                        log(f"[{cat}] saved {rel} ({len(data)} bytes)")
                    if not result.get("next"):
                        break
            total_cat = sum(1 for v in manifest.values() if v.get("category") == cat)
            log(f"[{cat}] done: {total_cat} files (target {args.per_category})")
    except Stop as exc:
        log(f"STOP: {exc}")
    finally:
        save_manifest(manifest)
        counts = Counter(v.get("category") for v in manifest.values())
        size = sum(v.get("bytes", 0) for v in manifest.values())
        log("SUMMARY counts=" + json.dumps(dict(sorted(counts.items())))
            + f" total={len(manifest)} bytes={size}")
        log("SUMMARY rejects=" + json.dumps(dict(rejects)) + f" rate_limit_events={rate_limit_events[0]}")


if __name__ == "__main__":
    main()
