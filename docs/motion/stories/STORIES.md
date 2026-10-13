# آزمایشگاه داستان (Story Lab)

هدف: ده داستان کوتاه و تازه (ساخت بعدی در مسیر html-film، ۱۰ تا ۲۰ دقیقه برای هر کدام) تا عمق طراحی ما سنجیده شود و مهارت persian-arts بهتر شود. هر داستان دو فایل دارد: `Sxx.json` (بریف معتبر با brief.schema) و `Sxx.lab.json` (داستان کامل: قهرمان، پرده‌ها، لحظه‌های پاداش با صدا، متن فارسی، بلوک lab).

## جدول داستان‌ها

| شناسه | عنوان | ژانر | نسبت | دقیقه | چه چیزی را می‌سنجد | کمبود مورد انتظار | ارزش یادگیری (۱-۵) |
|---|---|---|---|---|---|---|---|
| S01 | استکان چای | still-life | 9x16 | 12 | state change driven by one variable (temperature); clip-path liquid level | no spring/keys helper in lib | 3 |
| S02 | فانوس دریایی و کشتی | journey | 9x16+16x9 | 20 | continuous camera on one big stage; light sweep as a driving clock | no camera helper (pan/zoom with parallax) | 5 |
| S03 | کلید و هزارتو | chase | 9x16 | 18 | persistent actor across cuts and camera; seeded generative maze (pure in t) | no camera helper | 5 |
| S04 | سه رود، یک دریا | collaboration | 16x9+9x16 | 18 | multi-party collaboration (three equal peers); 16:9 re-design as a map composition | no equal-peers layout check | 4 |
| S05 | شهری روی صفحه دفتر | transformation | 9x16 | 20 | continuous zoom over one scene (no cuts); 100+ small shapes within the DOM budget | no camera/zoom helper | 5 |
| S06 | ساعتی که به صفر نمی‌رسد | typography | 9x16+1x1 | 12 | typography-led kinetic text; digit change without per-char split cuts | no Persian digit morph/tick helper | 4 |
| S07 | بادبادک و باد | music-led | 9x16 | 18 | emotional music-led pacing with a drop; follow-through (secondary motion with delay) | no follow-through/chain helper | 5 |
| S08 | جشن فانوس‌های عددی | infographic counting | 9x16+1x1 | 18 | data/infographic counting at real scale; Persian digits with correct shaping | no counter/odometer in lib (only inline in pencil) | 4 |
| S09 | نامه‌ای که پرنده شد | typography-led | 9x16+16x9 | 20 | typography-led joined-glyph reveal; path morph with same point count | no path-morph helper | 5 |
| S10 | میز کارگاه، قبل و بعد | split-screen contrast | 16x9+9x16 | 16 | split-screen contrast; three equal peers with individual timing | no spring helper (overshoot) | 4 |

## پوشش اجباری
- فقط ۹:۱۶: S01، S03، S05، S07. بازطراحی ۱۶:۹: S02، S04، S10 (و S09).
- شخصیت SVG ساده: S02 (کشتی)، S03 (کلید)، S07 (بادبادک)، S10 (ابزارها).
- تایپوگرافی‌محور: S06، S08، S09. پایان حلقه‌ای: S01، S06.

## ترتیب پیشنهادی ساخت
۱. S03 کلید و هزارتو: بیشترین شکاف (دوربین، مسیر، بازیگر پایدار، squash) در ۱۸ دقیقه؛ هر پاسخ به داستان‌های بعدی کمک می‌کند.
۲. S06 ساعت بی‌پایان: ارزان (۱۲ دقیقه)؛ تایپوگرافی فارسی + حلقه + همگام‌سازی تیک؛ ابزار حلقه و شمارنده را می‌سازد.
۳. S07 بادبادک: همگام‌سازی صدا با «دراپ» موسیقی و حرکت ثانویه؛ عمق موسیقی‌محور و شخصیت دوم.
بعد: S05 (زوم پیوسته و بودجه DOM)، S02 (دوربین + بازطراحی ۱۶:۹)، سپس بقیه.

## قواعد اجرا
- هر ساخت با `pa time start` شروع شود؛ بودجه از فیلد budget_minutes، سقف ۲۰ دقیقه.
- بعد از هر ساخت بلوک آن را در LEARNINGS.md پر کنید و راه‌حل را در منبع (skill، tool، lib) بگذارید، نه فقط در فیلم.
- هیچ نام واقعی سازمان، برند یا شخص در این داستان‌ها نیست.
