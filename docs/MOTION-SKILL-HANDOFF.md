# Handoff — PersianArts motion skill (2026-10-12)

## Where the code is
- Repo main at b2a16cb or later. Skill: plugins/persianarts-motion (v0.1). Sound tools: sound/tools (music_map.py, grid_accept.py, test_music_map.py). Docs: docs/MOTION-SKILL-PLAN.md, docs/PERSIAN-SOUND-SPEC.md, docs/research/SHOTCRAFT-AUDIO-STUDY.md, docs/PERSIAN-LOCALIZATION-LESSONS.md.
- Spine: video-shotcraft pinned at e1d15d9 (upstream, Apache-2.0). Clone: git clone https://github.com/Vincentwei1021/video-shotcraft && git checkout e1d15d9.

## Not in git — copy manually
- C:\Work\motion-library\ (shotcraft-samples, music candidates, INVENTORY, _scratch audio-data.tsv, tags.txt).
- C:\Work\ws\OpenMontage (with .venv). API keys must be added to .env by the owner; never write keys into git.
- Owner's source folder "New folder (4)" (33 music tracks, 3 scores, ~202 SFX in songpack). Read-only; never modify. Licence documents for these are not yet confirmed.
- Scratch test outputs under the session scratchpad (sfx-pilot, audio-pilot, music-map click previews). They are not durable; copy them if they are needed.

## Environment
- Python 3.14 venv; pip with `pip install -r sound/requirements.txt`. On the PC, files.pythonhosted.org is unreachable; use the mirror package-mirror.liara.ir (venv-only pip config).
- ffmpeg 8 on PATH (Windows).

## Open decisions (owner)
1. Project folder location for films.
2. Music library folder location.
3. Default mode: co-create or autonomous.
4. Command name (`pa`).
5. Follow upstream 124 cards / 150 shots for the Persian set, or keep the current 82 localized cards (18 retired upstream, 59 redesigned). Recommended: A/B test one card first.
6. Licence check before publishing (owner's tracks; shotcraft audio is Mixkit free licence; Pixabay: commercial use, no attribution).

## Audio status
- Beat-grid results: bgm-tech-house PASS (124 BPM, 98.7 %); house-vibez PASS (122 BPM, 98.2 %, owner ear: clicks on beat); cat-walk FAIL (130 BPM, 93.5 %; owner ear: slightly off after bar 16–17); tonight-hiphop FAIL (105 BPM, 97.9 %); g-eazy-nba-type FAIL (86.67 BPM, 95.9 %, first beat not on attack).
- Not run yet: beat-grid test of the 33 tracks in "New folder (4)".
- Pending: type-and-filter SFX listening test; main test = 20–30 s Persian sequence (4–5 cards) on one PASS track with real SFX.
- Remaining sound tools to build: cut_check, backtest_render, mix_sfx, A/B listening page.

## Rules that stay
- No synthesized audio. Recorded SFX and music only.
- Never mention the client name Dana in the skill, plan or outputs.
- Do not invent unsourced music.
- Do not commit samples, audio or renders.

## Next step on the other system
Open docs/MOTION-SKILL-PLAN.md §7 (quality ladder) and §8 (open decisions), then start step پ۱ (one ingredient × 3 themes) or the main sound test if the owner has chosen a PASS track.

## Owner decisions (2026-10-12)
- حالت پیش‌فرض skill: خودکار (autonomous). Every stage still writes its artifacts; decisions go to decisions.jsonl; the brief gets the assumption "copy not reviewed by a native reader" and the delivery report says the same.
- مجموعه کارت‌های فارسی: A/B یک کارت اول. Compare old Persian vs new English vs new Persian on one card before any bulk re-port. Do not re-port 59 redesigned cards or remove 15 retired cards yet.
- نام دستور (command): /amb-persianArts (update the name in the plugin only when the owner asks; record it here now).
- پاس صفر (مرجع): pending. The owner will send 3–5 motion-graphics references (links or files) that he judges good. Until then, do not start the scorecard calibration.
- محل پوشه‌ها: inside the project repo. Anything meant to be in git (project files, films, scenes, sound sidecars) lives inside the repo and must be committable. Only items that must stay out of git (raw audio, renders, samples, licensed tracks) stay outside the repo, with a pointer in this file. The owner stressed this is important.

## Owner requirement: vertical and social formats (2026-10-12)
- نمونه‌های مالک در پوشه‌ی C:\Users\Amir\Desktop\motions_sample هستن (فقط مرجع؛ داخل git نیستن).
- این نمونه‌ها مخصوص شبکه‌های اجتماعی، YouTube Shorts و استوری اینستاگرام طراحی شدن. طراحی باید این حالت را از اول در نظر بگیرد.
- اندازه‌های مختلف: 9:16 (Shorts/Reels/Stories)، 1:1، 4:5، و 16:9. هر ingredient و theme باید برای چند نسبت تصویر کار کند؛ layout را نسبت‌به ابعاد ثابت ننویس.
- نمونه‌ها برای بررسی خوب‌اند، ولی الگوی کور نیستند؛ قوانین کیفیت (anti-slideshow، typography) همچنان اجرا می‌شوند.
