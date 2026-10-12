# Decision brief: Pixabay API for music and SFX

Date: 2026-10-12. Research only, no downloads or installs.

## Question
Does Pixabay offer an official API or SDK that can search and download music and sound effects, and what are the alternatives for about 100+ instrumental tracks at 110-128 BPM plus SFX packs?

## Findings

**1. Pixabay official API** (https://pixabay.com/api/docs/)
- Covers images and videos only. The docs describe no audio, music or SFX endpoint, although the website has Music and Sound Effects sections.
- Auth: required `key` query parameter, obtained after login.
- Rate limit: 100 requests per 60 s per key by default; HTTP 429 when exceeded.
- Caching: responses must be cached 24 h; `webformatURL` expires after 24 h.
- Terms: "Systematic mass downloads are not allowed"; "real human requests" only.
- Hotlinking: images may be shown temporarily in search results, not hotlinked permanently; videos may be embedded.

**1b. Pixabay Content License** (https://pixabay.com/service/terms/)
- Audio is covered. Commercial use allowed, attribution optional.
- Prohibited: bulk downloading without permission, scraping (including for ML), standalone redistribution of the files.

**2. Community tools for Pixabay audio**
- None found. Searches return only image/video wrappers: pixabay-python on PyPI (https://pypi.org/project/pixabay-python/), qodzero/pixabay-py (https://github.com/qodzero/pixabay-py), Lukas0025/python-pixabay (https://github.com/Lukas0025/python-pixabay). None expose music.
- Any scraper for Pixabay audio would violate the Content License (scraping and bulk copying are banned). Do not build one.

**3. Alternatives with official or documented APIs**

| Source | Key | Licence filter | Direct download | BPM/tag filter | Notes |
|---|---|---|---|---|---|
| Freesound API (https://freesound.org/docs/api/resources_apiv2.html) | Token for search; OAuth2 needed for `/sounds/<id>/download/` | Yes, `license:"Creative Commons 0"` | Yes via OAuth2 bearer, original quality | `bpm:[110 TO 128]` (content analysis, not all sounds analysed); `tag:`, `duration:[a TO b]` | Best fit for SFX and some music. Needs an OAuth2 app. Rate limits per user, numbers not stated on docs page. |
| Jamendo API (https://developer.jamendo.com/v3.0/tracks) | client_id (our test call returned "Your credential is not authorized" with a dummy id) | `ccsa`, `ccnd`, `ccnc`, `include=licenses` | `audiodownload` URL; check `audiodownload_allowed` first | `speed` (verylow..veryhigh) and `vocalinstrumental`; no numeric BPM | Large music catalogue, instrumental filter works. Avoid `ccnc` if commercial use is needed. |
| Internet Archive advancedsearch (https://archive.org/advancedsearch.php) | None | `licenseurl:*publicdomain*` style query; CC0 URL query not verified | Direct file URLs under archive.org/download/ | No BPM field found | Free and open. BPM would need local analysis. |
| ccMixter Query API 2.0 (https://ccmixter.org/query-api) | None | Not confirmed | Via query results | Tag filters | Beta, dated docs. |
| Openverse audio API (https://api.openverse.org/v1/audio/) | Anonymous: 20/min, 200/day | `license` and `license_type` fields exist, filter params not confirmed | Result URL field | No BPM | Aggregator; anonymous limits are small. Redoc reference page was not retrievable. |
| Free Music Archive | n/a | n/a | n/a | n/a | API shut down (https://freemusicarchive.org/app-developers). Do not use. |

**4. Pixabay music library itself** (https://pixabay.com/music/): about 290,000 tracks, filtered by genre and mood tags. No BPM filter. No public API for audio.

## Options
- A. Freesound API (SFX packs and tempo-filtered loops/music, CC0 filter). Evidence: docs above. Risk: OAuth2 setup, uneven BPM analysis coverage.
- B. Jamendo API (instrumental music, speed filter, per-track download allowed flag). Evidence: docs above. Risk: needs a valid client_id; BPM only approximate via `speed`.
- C. Internet Archive advancedsearch (public-domain/CC0 music, no keys). Evidence: archive docs. Risk: no BPM metadata, quality varies, more manual curation.
- D. Pixabay manually: owner picks tracks in the browser and saves them (existing helper commit f8bf69c). Evidence: terms above. Risk: bulk automation is prohibited; scale is limited by hand.

## Recommendation
1. Use Freesound API (filter `license:"Creative Commons 0"`, `bpm:[110 TO 128]`, `tag:instrumental` or similar) for SFX packs and BPM-matched loops. Requires the owner to create a Freesound API key and OAuth2 app; the worker then downloads with the bearer token.
2. Use Jamendo API as the main music source for 100+ instrumental tracks, filtering `vocalinstrumental=instrumental`, `speed` in medium/high, and `ccsa`/`ccnd`/`ccnc` set so that commercial use is allowed (no NC). Download only where `audiodownload_allowed` is true. Requires the owner's client_id.
3. Use Internet Archive as a licence-safe supplement. Measure BPM locally (worker runs an analysis tool) for tracks that lack BPM metadata.
4. Pixabay: keep manual curation only. No API, no scraping, no bulk download, and never bypass CAPTCHA.

Blocking inputs needed from the owner: Freesound OAuth2 credentials and Jamendo client_id. No purchase or account creation was performed.
