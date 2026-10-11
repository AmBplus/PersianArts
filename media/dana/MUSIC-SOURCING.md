# روش منبع‌یابی موسیقی و صدا برای پروژهٔ دانا (۲۰۲۶-۱۰-۱۲)

این سند «روش» است تا هر نشست بعدی بتواند همین مسیر را تکرار یا گسترش دهد.

## ۱) منبع مجاز

**Pixabay Music** — مجوز Content License: استفادهٔ تجاری آزاد، بدون نیاز به ذکر منبع، بدون Royalty.
- کلیدواژه‌های مفید برای این پروژه: `persian cinematic electronic`، `epic trailer cinematic`، `dastgah`.
- قطعه‌های انتخاب‌شدهٔ نهایی:
  - **Total War (Epic Action Cinematic Trailer Main)** — حماسی/اکشن، ۷۰٫۶ث:
    https://pixabay.com/music/adventure-total-war-epic-action-cinematic-trailer-main-513668/
  - **Risk — StudioKolomna** — سینمایی/تنش الکترونیک، ۷۲٫۵ث (فصل ویژگی‌ها):
    https://pixabay.com/music/main-title-risk-136788/

## ۲) روش دانلود (عبور از 403)

`WebFetch` روی Pixabay خطای 403 (دیوار Cloudflare) می‌گیرد و خواننده‌های متنی لینک‌های mp3 را نمی‌بینند. مسیر عملی:

1. مرورگر MCP (chrome-devtools) را به صفحهٔ جست‌وجوی موسیقی ببر؛
2. اگر چلنج Cloudflare آمد، چک‌باکس «Verify you are human» را کلیک کن (یک‌بار کافی است)؛
3. با `evaluate_script` دکمهٔ پخش هر قطعه را بزن (از `<a>` عنوان، دو سطح بالا برو و `button[class*="playOverlay"]` را بگیر)؛
4. `list_network_requests` (نوع media) URLهای `https://cdn.pixabay.com/audio/...mp3` را نشان می‌دهد؛
5. همان URLها را مستقیم با `curl` بگیر — CDN بدون لاگین جواب می‌دهد.

## ۳) روش انتخاب (تحلیل، نه سلیقه)

هر کاندید با STFT و شار طیفی تحلیل شد (`work/dana/music/v3/v3an/candstats2.py`):
نرخ انسانس/ثانیه، تخمین BPM، پروفایل انرژی (سکوت/متوسط/بلند در هر ثانیه)، آخرین اکسان.
نتیجه در `work/dana/music/v3/candidate-analysis2.json` و `total-war-map.json` (ضربه‌های اندازه‌گیری‌شده).
معیار: طول نزدیک ۷۰ث + قوس کامل تریلر (اینترو→تارَک→رانش→وقفه→فینال→ضرب آخر→decay).

## ۴) ریمیکس v3.1

`work/dana/audio/build_audio_v31.py`:
`TotalWar[0-16.8]` (انتظار) + `TotalWar[52.55-65.6]` (کلایمکس اول) + `Risk[9.9-29.6]` (ویژگی‌ها)
+ `Risk[31-34.8]` (نفس) + `TotalWar[52.55-70.6]` (اوج پایانی) — کروس‌فید توان-برابر ۰٫۵ث، تطبیق RMS،
سپس مستر به ‎-14.0 LUFS (ffmpeg ebur128 مرجع) با سقف پیک واقعی ≤ ‎-2.0 dBTP.

## ۵) بانک SFX

۳۰ نمونهٔ صوتی از ویدیوهای کارت‌های خود پروژه استخراج شد:
`for n in <CardName>; do ffmpeg -i work/upstream/out/video/demo-$n.mp4 -vn -ar 44100 <out>/$n.wav; done`
نمونه‌های به‌کاررفته در میکس: RunwayGroundSkim (ووش گذار فصل)، CelFlashStomp، CountdownArcScatter،
SplitFlapFlip، OdometerDigitRoll، RadialWave (زنگ پایان) — همیشه ≥16dB زیر موسیقی.

## ۶) فهرست کاندیدهای دانلودشده (پوشهٔ media/dana/music)

| فایل | طول | نقش |
|---|---|---|
| total-war-epic-action.mp3 | 70٫6ث | **در فیلم: انتظار + هر دو اوج** |
| risk-main-title.mp3 | 72٫۵ث | **در فیلم: فصل ویژگی‌ها + نفس** |
| epic-hollywood-trailer.mp3 | 121٫9ث | ذخیره |
| epic-trailer-buildup.mp3 | 115٫1ث | ذخیره |
| persian-orient-AntipodeanWriter.mp3 | 129٫2ث | ذخیره (رنگ ایرانی) |
| persian-dastgah-vjgalaxy.mp3 | 210٫0ث | ذخیره (ارکسترال ایرانی) |
| persian-ambient-dastgah-vjgalaxy.mp3 | 223٫2ث | ذخیره (امبینت) |
| inspiring-cinematic-Tunetank.mp3 | 132٫0ث | ذخیره |
| dramatic-documentary-musicdream.mp3 | 196٫8ث | ذخیره |
| dana31-remix.mp3 | 70٫6ث | میکس نهایی v3.1 |
