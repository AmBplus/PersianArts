# Decision brief: bulk music and SFX sources for Persian 9:16 motion shorts

Date: 2026-10-12. Research only, nothing downloaded. Verify licence pages before any download.

## Question
Which sources should we bulk-collect instrumental music (110-128 BPM, best 120-124) and SFX (whooshes, pops, clicks, paper/pencil, UI ticks, impacts, risers, stingers, boings, dings, ambience) from, with a commercial-safe licence, no attribution if possible, and automatable without CAPTCHA bypass?

## 1. Sources

| Source | Licence (one line) | Login? | Scriptable curl? | Bulk/pack? | Evidence |
|---|---|---|---|---|---|
| Kenney (kenney.nl/assets, audio packs) | CC0, no attribution, any use | No | Yes, direct pack zips on the asset page (not yet verified per URL) | Yes: per-pack zips plus "All-in-1" bundle | https://kenney.nl/assets/ui-audio , https://kenney.nl/assets/impact-sounds , https://kenney.nl/assets/sci-fi-sounds |
| Freesound (freesound.org) | Per-sound: CC0 (no attribution) or CC-BY (attribution). Filter by CC0 only | Yes: free account and API key; download needs OAuth for the full file | API v2 supports search with licence filter and download, but returns per-sound calls and rate limits | No official pack; API loop only | https://freesound.org/help/faq/ , https://freesound.org/forum/legal-help-and-attribution-questions/39864/ |
| Sonniss GDC bundle (sonniss.com/gameaudiogdc) | Royalty-free, commercial, no attribution, media production only; no AI training | Free account probably needed (not verified) | Multi-GB zips (2026 bundle ~7.5 GB, 347 WAV); scriptable once the URL is known | Yes, annual bundle, 2015-2024 in archive; no 2025 bundle; 2026 bundle version 2.0 dated 27 Aug 2026 | https://sonniss.com/gameaudiogdc/ , https://sonniss.com/gdc-bundle-license/ |
| Mixkit (mixkit.co/free-sound-effects) | Free for commercial and personal use, no attribution; no registering/reselling as standalone (secondary reviews, verify on mixkit.co/license) | No (not verified) | Probably direct links, but no official API; scraping is a terms risk | No pack; per-file download | https://mixkit.co/free-sound-effects/ , https://mixkit.co/llm-info/ |
| Pixabay (pixabay.com/music) | Content License: commercial use, attribution not required; no resale or standalone redistribution; Content ID claims possible | Account not required for the manual download (not verified) | No. Terms prohibit robots, scraping and bulk extraction; API has no music endpoint; the existing helper must stay manual | No | https://pixabay.com/service/terms/ , https://pixabay.com/service/faq/ |

Notes: Zapsplat (free tier requires credit; paid tier removes it) and Uppbeat (free plan requires per-video credit codes, limited downloads, no SFX) are weaker fits. Uppbeat is useful only as a manual tracks pick, not for automation.

## 2. Trending style tags and search terms (short-form, 2026)
- Phonk / drift (Pixabay "tiktok trending", "instrumental viral tiktok"): search "phonk instrumental", "dark phonk 120bpm".
- Upbeat future bass / pop instrumental (Pixabay "trending music", filter Instrumental): "future bass instrumental", "upbeat pop instrumental".
- Cinematic / documentary build (Kenney music jingles, Sonniss ambience): "cinematic build", "epic trailer buildup".
- Lofi / calm piano for Persian poetry pieces (Pixabay "trending" and "lofi"): "lofi instrumental", "persian instrumental".
- SFX: "whoosh", "swoosh transition", "paper", "pencil writing", "UI click", "pop", "impact", "riser", "stinger", "boing cartoon", "success ding", "fail", "ambience".
Caveat: Pixabay shows track counts but not what is currently rising; a human must listen. Trend signals come from Instagram/TikTok sound libraries, not from these sites.

## 3. Recommended plan
- Music: 30-40 instrumental tracks at 110-128 BPM, mostly from Pixabay, collected manually through the owner's browser with the existing helper (no automation). Target ~10 per style family.
- SFX: Kenney CC0 packs first (UI audio, impact sounds, sci-fi sounds, digital audio, music jingles): all of them, roughly 500 files. Then Freesound CC0-only (search per category, ~20 files per category, via API with key). Then Sonniss 2026 bundle only if a larger pool is needed (7.5 GB; media-only licence is fine for us).
- Folder layout (all outside git, under media/):
  - media/music-pixabay/<track-slug>.mp3 (existing)
  - media/sfx/kenney/<pack>/<file>.ogg
  - media/sfx/freesound/<category>/<id>-<slug>.wav
  - media/sfx/sonniss-2026/<category>/<file>.wav
  - media/sfx/mixkit/<category>/<file>.mp3 (optional)
- Sidecar per file: <file>.source.json with fields: source, source_page_url, download_date, licence (name and URL), author, attribution_required (true/false), licence_version, notes. Stored next to the file, inside media/, so git ignores it with the rest of media/.

## 4. Risks and recommendation
- Licence traps: Pixabay Content ID claims on tracks that are licensed; Freesound CC-BY sounds need credit; Sonniss bundle is media-only and forbids AI training; Mixkit terms only seen secondhand. Keep sidecars so every file's licence can be proven later.
- Login walls: Freesound download needs an account and API key; Sonniss may require an account.
- CAPTCHA and scraping: Pixabay forbids robots and bulk extraction. Do not automate Pixabay downloads. Mixkit and Zapsplat scraping are also off-limits without checking terms.
- Recommendation: automate first with Kenney (CC0, no login, direct zips, no attribution). Second, Freesound CC0-only via API with a key, which is documented and scriptable. Pixabay stays manual.
- Unverified: Kenney zip URLs, Mixkit login status, Sonniss account requirement, Freesound rate limits. Check these before writing the download script.

Sources: https://pixabay.com/service/terms/ ; https://pixabay.com/service/faq/ ; https://pixabay.com/api/docs/ ; https://kenney.nl/assets/ui-audio ; https://kenney.nl/assets/impact-sounds ; https://freesound.org/help/faq/ ; https://sonniss.com/gameaudiogdc/ ; https://sonniss.com/gdc-bundle-license/ ; https://mixkit.co/free-sound-effects/ ; https://www.zapsplat.com/faq/ ; https://uppbeat.io/music
