# Report: Pixabay music download queue, milestone 1 (2026-10-13)

Done
- media/music-pixabay/queue.txt: 31 candidate track-page URLs (>= 25 required), found via ordinary
  web search only (DuckDuckGo Lite through the r.jina.ai reader; direct engine hits were bot-blocked
  from this host). 19 style-scoped `site:pixabay.com/music ...` queries; no Pixabay page was opened
  or crawled. Mix: phonk 5, upbeat future bass 4, upbeat pop 3, lofi 4, cinematic build 5,
  tech/deep house 5, playful/quirky 5. All instrumental-style candidates per the brief.
- work/persian/pixabay-queue.ps1: reads queue.txt, calls sound/tools/fetch_pixabay_track.py one URL
  at a time with `--out media\music-pixabay --allow-in-repo`, waits synchronously (owner solves any
  CAPTCHA in the opened Chrome), then writes `<slug>.source.json` (page URL, licence
  "Pixabay Content License", author from the helper's `<slug>.txt` sidecar, date, style, claimed BPM),
  skips slugs whose .mp3 exists, logs to work/persian/pixabay-queue.log, `-Limit N` supported.
  Verified: pwsh 7.6.6 Parser::ParseFile reports 0 errors; smoke-tested skip/log paths without
  touching pixabay.com.
- No downloads were run; no git operations; no packages installed.

Unverified (owner must confirm on the track page while listening)
- Every queue line is marked "(unverified)": URLs were only seen in search results, never opened.
- BPM: no search result showed a BPM; column reads "bpm: not shown in search results". Target
  110-128 (120-124 best) must be checked on each Pixabay page before/while fetching.
- Titles/authors come from search snippets; the helper re-reads title/artist from the live page.

Note on the acceptance one-liner: on pwsh 7.6.6 `[ref]$null` errors before parsing ("[ref] cannot
be applied to a variable that does not exist") for ANY file; with `$t=$null; $e=$null;` first, the
same ParseFile check on this script exits 0 (0 parse errors).

Exact command for the owner (from repo root, try 2 tracks first):

    pwsh -NoProfile -File work/persian/pixabay-queue.ps1 -Limit 2

then, for the rest (it skips anything already downloaded):

    pwsh -NoProfile -File work/persian/pixabay-queue.ps1

