# راهنمای صدا (references/audio.md)

منابع: `sound/tools/mixer/build_sound.py` (سازنده‌ی صدا)، `sound/library/kit/` (۱۵ موسیقی + ۳۰۴ افکت)، `docs/PERSIAN-SOUND-SPEC.md`، `beauty/references/craft/effects-and-craft-kit.md`.

## ساختار صدا (سه لایه)
1. **Voice (گویندگی):** در صورت وجود — همیشه جلوتر از موسیقی، نرمال‌سازی −۱۴ LUFS یک‌جا.
2. **Music bed:** از `sound/library/kit/music/` با `pa music-pick --mood <m> --bpm <bpm> --duration <s>`. downbeat روی رویداد `role: final` (نه type settle!). fade-in ۰٫۴s، fade-out نمایی از settle.
3. **Cues (افکت رویدادها):** از `events.json` + `rules.default.json` — لایه‌بندی: anticipation (قبل از hit) → hit (offset 0) → ring (+۶۰..۱۵۰ms) → tail.

## قواعد الزامی
- **events.json قرارداد است:** هر رویداد بصری مهم (ضرب، رونمایی، ورود، انتقال) یک رویداد صوتی دارد. فقط `role: final` یا `ends_film: true` موسیقی را تمام می‌کند.
- **ضربه‌ها روی beat:** `cut_frames` و رویدادها روی گرید موسیقی (bpm از INDEX.json)؛ خطا ≤ ۵ms (`pa audio-check --events`).
- **ducking:** bed زیر هر cue دسته‌ی impact/stinger/ding تا −۳dB برای ۱۵۰ms — گوینده هرگز زیر موسیقی گم نمی‌شود.
- **حداکثر ۳ cue شنیدنی هم‌زمان**؛ هیچ clip بیش از ۳ بار استفاده نشود.
- **پایان:** tail نمایی؛ ۰٫۲۵s آخر < −۵۰ dBFS؛ true peak ≤ −۱٫۰ dBTP؛ خروجی نهایی −۱۴..−۱۵ LUFS.

## چرخه‌ی کار صدا
```
1. events.json را از keyframeهای همان render بنویس (نه حدسی) — کد لازم نیست، فقط تایم‌کدها.
2. python sound/tools/mixer/build_sound.py --film <silent.mp4> --events events.json \
     --track <kit id> --out-dir <dir>            # ساخت صدا + ترکیب با ویدیو
3. pwsh -File work/persian/tools/pa.ps1 audio-check <final.mp4> --transitions t1,t2
   # RMS jump ≤ 3dB در cutها، بدون gap > 0.5s زیر −40dB، tail < −50dBFS، −14..−15 LUFS
```

## انتخاب موسیقی
| حس فیلم | track پیشنهادی | bpm |
|---|---|---|
| شاد/پویا | `tr-dogo-jump-1267515` | ۱۲۰ |
| گرم/خانگی | `tr-house-vibez` | ۱۲۲ |
| حماسی/دراماتیک | `tr-the-mountain-epic-610137` | ~۱۰۰ |
| مرموز/تیزر | `tr-vd-5546-mystery-teaser` | ~۹۵ |
| فناورانه | `tr-bgm-tech-house` | ۱۲۴ |

## ضدالگوهای صدا
- موسیقی بلندتر از گوینده؛ افکت تزئینی بدون رویداد متناظر؛ سکوت ناگهانی (gap) در وسط؛
- شروع موسیقی با fade نداشته باشد؛ استفاده‌ی بیش از حد یک clip (تکرار محسوس)؛
- whoosh روی حرکت دوربین (camera move ≠ cut — L-089).

## انواع مجاز رویداد (از C1-08)
فقط این‌ها rule دارند: `stamp, hit, thud, ring, tick, bell, count-tick, whoosh, transition,
settle, riser, reveal, pop, slide, typing, success, fail, glitch`.
`ambient` rule ندارد و بی‌صدا حذف می‌شود — بستر محیطی از موسیقی می‌آید، نه از cue.

## تراکم cue
حداکثر ۳ cue هم‌زمان شنیدنی؛ بین دو cue مهم حداقل ۰٫۲۵s فاصله تا شنیده شوند.
هر برش/رونمایی = یک cue؛ حرکت دوربین = بدون whoosh (L-089).

## ترتیب انتخاب (از C2-03)
اول **ترک** را انتخاب کن، بعد فیلم را با BPM همان ترک ببر. تطبیق تمپوی فیلم با ترکِ بد‌مزاج
(مثلاً corporate زیر باران) یک ایراد شنیدنی است؛ BPM فیلم نتیجه‌ی موسیقی است، نه برعکس.

## هدروم مستر (از C2-04)
بعد از میکس، true peak را دوباره اندازه بگیر؛ اگر بالای −۱٫۶ dBTP بود، مستر را ۰٫۵ dB پایین بیاور.
−۱٫۳ «مجاز» است ولی هدرومی برای پلتفرم‌های نرمالایزکننده باقی نمی‌گذارد.
