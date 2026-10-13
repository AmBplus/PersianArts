# ASSETS-IN-GIT (what the skill and tools need, and where it comes from)
Verified by `pwsh -File work/persian/tools/pa.ps1 assets-check` (part of `pa doctor`); exit code non-zero on a missing or changed tracked asset.

| Asset | Where in git | Size | Verified | Restore |
|---|---|---|---|---|
| Fonts used by films (Vazirmatn variable ttf + woff2, Estedad, Lalezar, Aref Ruqaa, OFL notices) | work/persian/assets/fonts (+ copies next to films: htmlfilm/<film>/fonts) | 1.1 MB | sha256 per file in fonts/manifest.json | `git checkout -- work/persian/assets/fonts`; install copies them to src/workbench/public/fonts |
| SFX kit (304 clips) and music kit (excerpts + .music.json beat maps) | sound/library/kit | 27 MB | catalog count, all files present, each <= 2 MB, every map has audio | `git checkout -- sound/library/kit`; `pwsh -File sound/tools/restore_library.ps1` |
| Full SFX library, extra music | NOT in git (large, licences) | - | optional | `restore_library.ps1 -Full` plan; own API keys in the .env files (optional) |
| Pacing profiles, arcs menu, music maps | docs/motion/knowledge, docs/motion/recipes | 0.2 MB | file present | git |
| Viditor reference media (38 mp4/m4a/jpg) | NOT in git (ignored); derived data IS tracked | 42 MB | OPTIONAL: tools skip it when absent | only a pacing re-measure needs the originals |
| Film helper libs, capture/mix/compress/deliver/pacing/audio-check tools | work/persian/htmlfilm, sound/tools, work/persian/tools | small | tracked files listed in assets-check | git |
| Requirement lists | requirements-pa.txt, sound/requirements.txt, package-lock.json (workbench, assets tools) | small | present | `pa bootstrap` installs from them |
| Remotion / chrome-headless-shell | NOT in git (downloaded) | ~250 MB | doctor | `pa bootstrap` (npx remotion browser ensure); capture.mjs finds it on any OS or via PA_CHROME |
| Logos / brand assets of OUR own films | none exist (S06, pencil have no brand asset) | - | - | - |
| Client logos, briefs, film sources, finals | NOT in git in plain text | - | - | encrypted vault: `pa vault pack|unpack` |
| API keys / vault passphrase | never in git | - | doctor shows names only | .env.example templates, PA_VAULT_PASS |
