# FETCH-PIXABAY — save a few chosen Pixabay Music tracks

Status: live download path UNTESTED (written in a container that cannot reach pixabay.com). Unit tests cover only
slug, URL validation, the 5-URL limit and the git-tree refusal. Try one track first.

Opens your own Chrome (visible window, persistent profile), shows each track page you give it, clicks the page's
own Download control and saves the file the browser downloads. Max 5 URLs per run, you pick them.

One-time setup (Windows PowerShell, run from the repo root):

    pip install -r sound/requirements-fetch.txt
    python sound/tools/fetch_pixabay_track.py --check

Run (default output `D:\P\project\persianArts\media\music-pixabay`, created if missing):

    python sound/tools/fetch_pixabay_track.py --out D:\P\project\persianArts\media\music-pixabay "https://pixabay.com/music/<category>-<name>-<id>/"

Per track you get `<slug>.mp3` and `<slug>.txt` (page URL, title, artist, timestamp, license note). Size and, if
`ffprobe` is on PATH, duration are printed.

Solve-by-hand: if Pixabay shows a verification, CAPTCHA or login page, do it yourself in the Chrome window. The script
only polls until the track page appears (default wait 600 s, `--timeout`). If no Download control is found it asks you
to click Download yourself and saves that download.

It will not: crawl, search or list the catalogue, bypass or automate verification/login, run headless, spoof the
browser, or fetch hidden CDN URLs. It refuses URLs other than `https://pixabay.com/music/...`.

Git: tracks stay out of git. The script refuses an `--out` inside any git working tree unless `--allow-in-repo`.
Check the Pixabay license before publishing any track.
