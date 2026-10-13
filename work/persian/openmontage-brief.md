# DECISION BRIEF: OpenMontage audio tooling (music and SFX)

Question: does OpenMontage give us tools to find, download, license-track, beat-detect and mix music and SFX, and what can we reuse?

## 1) Repo, licence, maturity
- Repo: https://github.com/calesthio/OpenMontage (canonical; forks djy89/openmontage, kaeltrn/openmontage and a SourceForge mirror are third-party).
- Licence: GNU AGPL-3.0. Copyleft: reusing its code in our project would bring AGPL obligations.
- Maturity: about 67.5k stars, about 478 commits, Python. Last commit date not verified. Several audio tools have open bugs (issue #736 generic licence string; PR #740 open, not merged; PR #739 open retry fix for pixabay_music 403).

## 2) Audio-related files (tools/audio/, from the GitHub listing)
- Music: `music_library.py` (local scan, read-only), `pixabay_music.py`, `freesound_music.py`, `music_gen.py`, `suno_music.py`, `google_music.py`, `fal_elevenlabs_music.py`, `comfyui_music.py`
- Mixing and enhancement: `audio_mixer.py`, `audio_enhance.py`
- TTS (not relevant here): 15 provider files plus `tts_selector.py`
- SFX: no dedicated SFX tool file. SFX only via ElevenLabs (docs/PROVIDERS.md).
- Beat detection: none found (`music_library.py` has no BPM code).
- Licence sidecars: none. Licence is returned as a string in tool results only.

## 3) Stock sources and keys
- Pixabay music (`pixabay_music.py`): no API key. Scrapes pixabay.com/music/search HTML and JSON with browser-like headers and a cookie jar, then GETs the cdn.pixabay.com MP3. No 403/429 handling. Licence returned as "Pixabay Content License (free, no attribution required)".
- Freesound (`freesound_music.py`): needs `FREESOUND_API_KEY`, passed as a URL query parameter (`token=`). Downloads preview MP3 only (HQ, falling back to LQ). Licence fix pending in PR #740.
- Jamendo and Epidemic: not present.
- Paid generators: ElevenLabs (`ELEVENLABS_API_KEY`), Suno (`SUNO_API_KEY`, needs account), Google Lyria (`GOOGLE_API_KEY`, paid only).
- Pixabay stock images/video use `PIXABAY_API_KEY` after login. That is the official API, not the music scraper.

## 4) CAPTCHA and login walls
- OpenMontage has no CAPTCHA or login handling. `pixabay_music.py` fails on errors. It does not solve challenges.
- Note: the scraper's browser-like headers and HTML parsing are a grey area under Pixabay's terms. We should not copy that approach.
- Our `sound/tools/fetch_pixabay_track.py` differs: a visible Chrome window, the user solves any verification by hand, and it only takes user-chosen URLs.

## 5) Reuse vs what we have
Already in repo: `sound/tools/music_map.py` (676 lines: onset/transient detection, beat grid, tempo prior, bar and downbeat detection, click-track output, all local); `sound/tools/fetch_pixabay_track.py` (user-chosen URLs, max 5, licence sidecar `.txt`, refuses in-repo output).

Reusable ideas (ideas only, do not copy AGPL code without a licence decision):
- Local library scan pattern from `music_library.py` (extension list, ffprobe duration, `MUSIC_LIBRARY_DIR` env var) for an SFX library kept outside git.
- Freesound search via API with per-sound `license` and `author` fields (once PR #740 lands; until then check licence per file ourselves).
- Our music_map.py already covers beat detection at 120-124 BPM; OpenMontage adds nothing there.
- Our existing licence sidecar (`<slug>.txt`) is stronger than anything OpenMontage writes.

## 6) Recommendation
- Do not install or vendor OpenMontage for audio. It is AGPL, its audio tools are thin (no beat detection, no licence sidecars, no SFX tool), and its Pixabay path is scraping.
- Keep our own pipeline: music_map.py for beats, fetch_pixabay_track.py for hand-picked tracks, recorded audio only.
- If we need SFX search, add a small Freesound client (API key in local env, not in git), write `<slug>.txt` licence sidecars with the licence and author fields, and store files outside git (e.g. `media/sfx-library/`, git-ignored).
- Risks: Freesound API key in a query string (log leakage); Freesound licences vary (CC BY needs credit, NC blocks commercial use); Pixabay licence wording may change; PR #740 and #739 unmerged, so do not rely on them.

Time box: about 12 minutes. Research only: no installs, no audio downloads, no git.
