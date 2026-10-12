#!/usr/bin/env python3
"""Top up pencil/paper strokes and payoff sounds from Freesound (CC0 only).

Reuses freesound_fetch.py functions (search, accept, fetch_preview, save_manifest, slugify, pacing,
429 back-off). Unlike freesound_fetch.main(), the per-category 'need' check is replaced by a
per-query quota: up to PER_QUERY new clips for each query, whatever the category already holds.

Usage (repo root):  python -I work/persian/freesound_payoff_fill.py [--minutes 18]
"""
import argparse
import importlib.util
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("freesound_fetch", HERE / "freesound_fetch.py")
fetch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fetch)

PER_QUERY = 15

# (category folder, max duration s, queries)
PLAN = [
    # pass 2: alternative wording for the queries that returned 0 in pass 1
    ("paper-pencil", 6.0, ["pencil writing", "pen writing paper", "graphite sketch"]),
    ("alarm-timer", 6.0, ["alarm clock", "alarm bell", "kitchen timer"]),
    ("stamp-thud", 6.0, ["stamp", "rubber stamp"]),
    ("success", 6.0, ["checkmark", "correct answer ding"]),
    ("ding", 6.0, ["bell ding"]),
    ("stinger", 8.0, ["final chord", "orchestral hit", "cinematic stinger"]),
    ("boom-sub", 6.0, ["bass drop", "sub bass hit", "cinematic boom"]),
    ("misc", 6.0, ["water drop", "ripple"]),
    ("riser", 6.0, ["shimmer", "swell"]),
]

LOG = HERE / "freesound-payoff-fill.log"


def log(msg):
    line = f"{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} {msg}"
    print(line, flush=True)
    with LOG.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--minutes", type=float, default=18.0)
    args = ap.parse_args()

    env = fetch.load_env()
    key = env.get("FREESOUND_API_KEY", "")
    if not key:
        sys.exit("FREESOUND_API_KEY is empty in work/persian/.freesound.env")
    headers = {"Authorization": f"Token {key}", "User-Agent": fetch.UA, "Accept": "application/json"}

    manifest = fetch.load_manifest()
    deadline = time.time() + args.minutes * 60
    new_per_query = Counter()
    rejects = Counter()
    log(f"payoff run start: per_query={PER_QUERY} minutes={args.minutes}")
    try:
        for cat, max_dur, queries in PLAN:
            (fetch.OUT / cat).mkdir(parents=True, exist_ok=True)
            for query in queries:
                got = 0
                for page in range(1, fetch.MAX_PAGES_PER_QUERY + 1):
                    if got >= PER_QUERY or time.time() > deadline:
                        break
                    result = fetch.search(query, page, headers)
                    if not result:
                        break
                    for sound in result.get("results", []):
                        if got >= PER_QUERY or time.time() > deadline:
                            break
                        sid = str(sound.get("id"))
                        ok, reason = fetch.accept(sound, max_dur)
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
                        data, err = fetch.fetch_preview(preview)
                        if err:
                            rejects[err] += 1
                            log(f"[{cat}] reject id={sid}: {err}")
                            continue
                        rel = f"{cat}/{sid}-{fetch.slugify(sound.get('name'))}.mp3"
                        (fetch.OUT / rel).write_bytes(data)
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
                        fetch.save_manifest(manifest)
                        got += 1
                        log(f"[{cat}] saved {rel} ({len(data)} bytes) q='{query}'")
                    if not result.get("next"):
                        break
                new_per_query[query] = got
                log(f"query '{query}' -> {got} new")
    except fetch.Stop as exc:
        log(f"STOP: {exc}")
    finally:
        fetch.save_manifest(manifest)
        log("SUMMARY new_per_query=" + str(dict(new_per_query)))
        log("SUMMARY rejects=" + str(dict(rejects)) + f" rate_limit_events={fetch.rate_limit_events[0]}")


if __name__ == "__main__":
    main()
