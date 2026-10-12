#!/usr/bin/env python3
"""Fetch CC BY / CC BY-SA instrumental tracks from the official Jamendo API v3 into a staging dir.

Usage (resumable; re-running skips tracks already saved):
  python -I work/persian/jamendo_fetch.py --limit 100 --out media/music-staging/jamendo

Reads JAMENDO_CLIENT_ID from work/persian/.jamendo.env (gitignored). Stdlib only.
Writes <slug>.mp3 + <slug>.source.json per track. Rejects and run state go to work/persian/jamendo-state.json.
Politeness: one request per second, HTTP 429 -> back off (30/60/120 s), then stop.
"""
import argparse
import datetime
import hashlib
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(HERE, ".jamendo.env")
STATE_FILE = os.path.join(HERE, "jamendo-state.json")
API = "https://api.jamendo.com/v3.0/tracks/"
MAX_FILE = 15 * 1024 * 1024
MAX_TOTAL = 600 * 1024 * 1024
TAGS = ["electronic", "house", "funk", "hiphop", "lofi", "cinematic", "upbeat", "playful", "corporate"]
PAGES_PER_TAG = 3
PAGE = 100
UA = "PersianArts-staging-fetch/1.0"

_last = [0.0]
_client_id = [""]


def log(msg):
    s = str(msg)
    if _client_id[0]:
        s = s.replace(_client_id[0], "***")
    print(s, flush=True)


def load_client_id():
    with open(ENV_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("JAMENDO_CLIENT_ID="):
                return line.split("=", 1)[1].strip()
    raise SystemExit("JAMENDO_CLIENT_ID missing from " + ENV_FILE)


def throttle():
    wait = 1.0 - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    _last[0] = time.time()


class Stop(Exception):
    pass


def http(url, want_binary=False, max_bytes=None):
    """GET with throttle and 429 backoff. Returns (headers, body bytes or None)."""
    backoffs = [30, 60, 120]
    attempt = 0
    while True:
        throttle()
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                ctype = (r.headers.get("Content-Type") or "").lower()
                clen = r.headers.get("Content-Length")
                if max_bytes and clen and int(clen) > max_bytes:
                    return {"ctype": ctype, "len": int(clen)}, None
                if not want_binary:
                    return {"ctype": ctype}, r.read()
                data = b""
                while True:
                    chunk = r.read(256 * 1024)
                    if not chunk:
                        break
                    data += chunk
                    if max_bytes and len(data) > max_bytes:
                        return {"ctype": ctype, "len": len(data), "too_big": True}, None
                return {"ctype": ctype, "len": len(data)}, data
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < len(backoffs):
                log(f"HTTP 429, backing off {backoffs[attempt]}s")
                time.sleep(backoffs[attempt])
                attempt += 1
                continue
            if e.code in (401, 403) or e.code == 429:
                raise Stop(f"HTTP {e.code} (not bypassed)")
            raise
        except urllib.error.URLError as e:
            if attempt < 1:
                attempt += 1
                time.sleep(5)
                continue
            raise


def api_tracks(tag, offset):
    params = {
        "client_id": _client_id[0],
        "format": "json",
        "limit": PAGE,
        "offset": offset,
        "include": "musicinfo+licenses",
        "vocalinstrumental": "instrumental",
        "audiodownload_allowed": "true",
        "speed": "medium+high+veryhigh",
        "tags": tag,
        "order": "popularity_total",
        "license": "cc-by+cc-by-sa",
    }
    qs = urllib.parse.urlencode(params, safe="+")
    _, body = http(API + "?" + qs)
    data = json.loads(body.decode("utf-8"))
    if data.get("headers", {}).get("status") != "success":
        raise Stop("API status not success: " + str(data.get("headers", {}).get("error_message", ""))[:200])
    return data.get("results", [])


def licence_of(t):
    """Return (code, version, reason). Accept only by / by-sa."""
    url = (t.get("license_ccurl") or "").strip()
    m = re.search(r"creativecommons\.org/licenses/([a-z\-]+)/([\d.]+)", url.lower())
    if not m:
        return None, None, "unknown_licence"
    code, version = m.group(1), m.group(2)
    parts = code.split("-")
    if "nc" in parts:
        return None, None, "nc"
    if "nd" in parts:
        return None, None, "nd"
    if parts[0] != "by" or any(p not in ("by", "sa") for p in parts):
        return None, None, "other_licence"
    return code, version, None


def slugify(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()[:50]
    return s or "track"


def mp3_ok(data):
    if data[:3] == b"ID3":
        return True
    return len(data) > 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0


def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {"rejects": {}, "failures": {}}


def save_state(st):
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(st, f, ensure_ascii=False, indent=1)
    os.replace(tmp, STATE_FILE)


def existing(out):
    done = {}
    for name in os.listdir(out):
        if name.endswith(".source.json"):
            with open(os.path.join(out, name), encoding="utf-8") as f:
                j = json.load(f)
            mp3 = os.path.join(out, j["file"])
            if os.path.exists(mp3):
                done[str(j["track_id"])] = j
    return done


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=100)
    ap.add_argument("--out", default=os.path.join(HERE, "..", "..", "media", "music-staging", "jamendo"))
    args = ap.parse_args()
    out = os.path.abspath(args.out)
    os.makedirs(out, exist_ok=True)
    _client_id[0] = load_client_id()
    st = load_state()
    done = existing(out)
    total_bytes = sum(j["bytes"] for j in done.values())
    log(f"resume: {len(done)} already saved, {total_bytes} bytes")

    # 1. collect candidates from the API (sequential, throttled)
    candidates, seen = [], set()
    try:
        for tag in TAGS:
            for page in range(PAGES_PER_TAG):
                for t in api_tracks(tag, page * PAGE):
                    tid = str(t.get("id"))
                    if tid in seen:
                        continue
                    seen.add(tid)
                    candidates.append(t)
                if len(candidates) >= args.limit * 4:
                    break
            log(f"tag {tag}: candidates so far {len(candidates)}")
            if len(candidates) >= args.limit * 4:
                break
    except Stop as e:
        log("STOP while listing: " + str(e))
    except Exception as e:  # network/parse problems: keep what we have
        log("listing error: " + type(e).__name__)

    # 2. filter and download
    for t in candidates:
        if len(done) >= args.limit:
            break
        tid = str(t.get("id"))
        if tid in done:
            continue
        name, artist = t.get("name") or "", t.get("artist_name") or ""
        code, version, reason = licence_of(t)
        mi = t.get("musicinfo") or {}
        if reason is None and mi.get("vocalinstrumental") not in (None, "instrumental"):
            reason = "not_instrumental"
        if reason is None and not t.get("audiodownload_allowed"):
            reason = "no_download_allowed"
        if reason is None and not (t.get("audiodownload") or "").startswith("https://"):
            reason = "no_download_url"
        if reason:
            st["rejects"][tid] = reason
            continue
        slug = f"{slugify(artist)}-{slugify(name)}-{tid}"
        mp3_path = os.path.join(out, slug + ".mp3")
        try:
            hdr, data = http(t["audiodownload"], want_binary=True, max_bytes=MAX_FILE)
        except Stop as e:
            log("STOP on download: " + str(e))
            break
        except Exception as e:
            st["failures"][tid] = "download_error:" + type(e).__name__
            log(f"fail {tid}: download_error")
            continue
        if data is None:
            st["failures"][tid] = "too_big" if hdr.get("too_big") or hdr.get("len") else "no_body"
            log(f"fail {tid}: {st['failures'][tid]}")
            continue
        # Jamendo serves real mp3 bytes with a text/html Content-Type, so judge by magic bytes only.
        if not mp3_ok(data):
            st["failures"][tid] = "not_mp3_or_login_page"
            log(f"skip {tid}: response is not an mp3 (login/captcha/other)")
            continue
        if total_bytes + len(data) > MAX_TOTAL:
            log("total size cap reached, stopping")
            break
        tmp = mp3_path + ".part"
        with open(tmp, "wb") as f:
            f.write(data)
        os.replace(tmp, mp3_path)
        lic_label = f"CC {code.upper()} {version}"
        page_url = t.get("shareurl") or f"https://www.jamendo.com/track/{tid}"
        tags = {}
        for k in ("genres", "instruments", "vartags"):
            tags[k] = (mi.get("tags") or {}).get(k) or []
        meta = {
            "track_id": int(tid),
            "name": name,
            "artist": artist,
            "file": slug + ".mp3",
            "page_url": page_url,
            "licence_url": t.get("license_ccurl"),
            "licence": lic_label,
            "licence_code": code,
            "attribution_required": code.startswith("by"),
            "credit_line": f'"{name}" by {artist} (Jamendo), {lic_label}, {page_url}',
            "jamendo_speed": mi.get("speed"),
            "jamendo_tags": tags,
            "vocalinstrumental": mi.get("vocalinstrumental"),
            "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
            "downloaded_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            "source": "https://api.jamendo.com/v3.0/tracks (official API, client_id, no scraping)",
            "terms_note": "Jamendo API terms: API free for non-commercial use; commercial use needs licensing@jamendo.com",
            "bpm": None,
        }
        with open(os.path.join(out, slug + ".source.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=1)
        done[tid] = meta
        total_bytes += len(data)
        st["failures"].pop(tid, None)
        log(f"saved {len(done)}/{args.limit} {slug} ({len(data)} bytes)")
        save_state(st)

    save_state(st)
    reasons = {}
    for r in st["rejects"].values():
        reasons[r] = reasons.get(r, 0) + 1
    log(f"DONE saved={len(done)} bytes={total_bytes} rejects={reasons} failures={len(st['failures'])}")


if __name__ == "__main__":
    sys.exit(main())
