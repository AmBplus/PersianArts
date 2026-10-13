# PORTABILITY (git-first rule, 2026-10-14)

خلاصه فارسی: همه چیز باید در git باشد و به این دستگاه وابسته نباشد. روی هر دستگاه: `git clone`، سپس `pa bootstrap`، سپس `pa sync`. مواد محرمانه مشتری فقط به صورت رمزنگاری‌شده در `vault/` می‌رود (رمز در متغیر `PA_VAULT_PASS`، هرگز در فایل یا git). ابزار `qh` اختیاری است. چکِ سلامت: `pa doctor`.

Rule: everything we do is in git or restorable by one command; nothing depends on this machine; client material only encrypted. Machine entry: `pwsh -File work/persian/tools/pa.ps1 bootstrap`, then `pa sync` (see START.md).

## Audit (counts measured 2026-10-13)
- 4639 tracked files; `.git` is 1.2 GB (about 860 MB is local unreachable objects: `git gc --prune=now` waits for owner approval, TODO T006).
- Absolute machine paths in tracked text: 64 matches in 40 files, 4 live scripts fixed (fetch_pixabay_track.py, 3 owner-tools); the rest are history (reports, order logs, handoffs) and harmless.
- Tools outside the repo: `qh` (external, optional), ffmpeg/ffprobe, python 3.12, node 20, git, openssl (optional).

| Item | Lives in | Status | Risk | Fix |
|---|---|---|---|---|
| qh CLI (quota hub, 816 MB with data/node_modules, licence/ownership undecided) | outside repo, `PA_QH` | external, not vendored | scripts that call qh fail elsewhere | optional; use the Agent/studio flow when absent; `pa doctor` shows WARN only |
| sound/.venv, tools/assets/.venv | local | ignored by design | rebuild needed | `pa bootstrap` from `requirements-pa.txt` |
| node_modules, Remotion chrome-headless-shell | local | ignored by design | rebuild needed | `pa bootstrap` (npm ci, `remotion browser ensure`) |
| ffmpeg, ffprobe | system | not in git | films cannot render | install; doctor prints the command |
| Fonts used by films | work/persian/assets/fonts (5 tracked), more in media/dana history | PARTLY in git | a film may fall back to a wrong font | doctor lists referenced-but-missing fonts; add small woff2 to assets/fonts before a film uses them |
| SFX/music kit | sound/library/kit (304 sfx, 15 music maps) | in git | none | `restore_library.ps1` verifies |
| Full SFX library, media/music-staging, media/music-pixabay | local | ignored by design (large, licences) | extra tracks missing | pick what a film needs into the kit (<= 2 MB each) |
| .freesound.env, .jamendo.env (keys) | work/persian | ignored, secrets | cannot be in git | `.example` files provided; own keys per machine |
| work/viditor-reference assets (38 mp4/m4a/jpg) | local | ignored by design | pacing re-measure needs them | derived data is in docs/motion/knowledge (tracked) |
| media/film-versions/** (all version builds) | local | ignored by design | history of builds lost | finals: see policy below; sources are in work/persian/htmlfilm |
| media/briefs-local/** (client briefs, film sources, copy-maps, assets) | local | ignored, CONFIDENTIAL | lost with the machine | encrypted vault (steps below) |
| output/ finals | local | ignored | lost with the machine | own films: `deliver/`; client films: vault |
| contracts/confidential-terms.local.txt, workbench public uni-local/conf-local | local | ignored, CONFIDENTIAL | scan needs the terms | vault pack (add the file to a label folder) or recreate |

Confidential (client): media/briefs-local/**, their output finals, uni-local, conf-local, confidential-terms. Ours (can be plaintext): kit, tools, skills, docs, pencil and story-lab films, derived pacing data.

## Finals policy
Own films' compressed LATEST finals (pencil-html, pencil-social, story-lab) may be tracked under `deliver/` (each <= 12 MB, total <= 60 MB): `pa deliver track` copies them (config docs/motion/portable.json) and the checkpoint stages `deliver/`. Client finals go to the vault only.

## Vault (client material through git, encrypted)
`pa vault pack|unpack|list`: AES-256-CBC, PBKDF2-SHA256 10000 (openssl-compatible: `openssl enc -d -aes-256-cbc -pbkdf2 -in vault/<label>.tar.enc`). One archive per folder under media/briefs-local plus output/<label>; over 50 MB the videos are skipped. Passphrase only from `PA_VAULT_PASS` or a prompt. Tested with a fake client folder (pack, wrong-passphrase fail, unpack, openssl decrypt: all OK). Real folders are NOT packed yet.
Owner steps: 1. choose a passphrase and keep it in your password manager. 2. set it in the shell (PowerShell: `$env:PA_VAULT_PASS = '...'`). 3. `pwsh -File work/persian/tools/pa.ps1 vault pack`. 4. checkpoint commit `vault/*.tar.enc`. 5. On another machine: set the same variable, `pa vault unpack`. 6. Optional: also pack contracts/confidential-terms.local.txt by copying it into a label folder first.

## Tools added
`pa doctor | bootstrap | sync | vault | todo | meter | metrics` (work/persian/tools/portable/pa-portable.mjs); `requirements-pa.txt`; `.env.example` files; `docs/motion/TODO.md` + `todo.jsonl`; `docs/motion/ledger/tasks.jsonl` (273 historic lines seeded).

## Still open
Fonts beyond the 5 tracked; qh vendoring decision (owner); gc approval; vault passphrase; chrome-headless-shell is downloaded by bootstrap (needs internet).
