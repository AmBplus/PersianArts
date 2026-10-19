# Persian/RTL Text-Effect Kit — Spec (2026-10-20)

هدف: مشخص‌کردن **کتابخانه‌های shaping**، **font featureها** و **قواعد انیمیشن متن فارسی** برای فیلم‌های motion که با HTML + Canvas 2D (و بعداً WebGL) در headless Chromium رندر frame-by-frame می‌شوند.
فونت‌های موجود: Vazirmatn، Estedad، Amiri، Lalezar.

مبنای این سند: `docs/PERSIAN-LOCALIZATION-LESSONS.md` (خوانده شد) + clone عمقی `github.com/atmirrr/persian-motion-director` + API واقعی npm registry و GitHub API.
هر عددی که از پاسخ واقعی API آمده با تاریخ/منبع مشخص شده؛ هر چیز تأییدنشده با `UNVERIFIED` علامت خورده است.

> واحدها: سایز npm از `dist.unpackedSize` (KB، گرد‌شده). ستاره/لایسنس/آخرین push از GitHub API (تاریخ‌ها به UTC). تاریخ واکشی داده‌ها: 2026-10-20.

---

## ۱. جدول کتابخانه‌های shaping در مرورگر

| کتابخانه | npm version | license | stars | last push (UTC) | size (unpacked) | per-glyph position/advance؟ | shaping فارسی | مناسب browser؟ | منبع |
|---|---|---|---|---|---|---|---|---|---|
| **harfbuzzjs** | 1.6.3 | MIT | 293 | 2026-10-16T13:25:04Z | 1267.7 KB / 9 فایل | **بله**: `buffer.getGlyphInfos()` + `buffer.getGlyphPositions()` → `xAdvance, yAdvance, xOffset, yOffset`؛ `font.glyphToPath(gid)` مسیر SVG | **بله، کامل** (خودِ HarfBuzz) | بله — WASM/asm.js، در مرورگر اجرا می‌شود | npm `harfbuzzjs` + `api.github.com/repos/harfbuzz/harfbuzzjs` + raw README |
| **fontkit** | 2.0.4 | MIT (npm) / `license.spdx_id` در GitHub API خالی است | 1677 | 2026-10-18T18:22:19Z | 5479.1 KB / 131 فایل | **بله**: `font.layout(string, features)` → GlyphRun با `GlyphPosition {xAdvance,yAdvance,xOffset,yOffset}` | **بله** (GSUB/GPOS طبق README؛ جدول feature دقیق `UNVERIFIED`) | بله — Node + browser | npm `fontkit` + `repos/foliojs/fontkit` + raw README |
| **opentype.js** | 2.0.0 | MIT | 5034 | 2026-08-08T03:59:23Z | 3556.8 KB / 10 فایل | **بله** (glyph metrics/kerning) | **خیر — shaping ندارد** (پایین توضیح داده شده) | بله، ولی برای فارسی غیرقابل‌استفاده | npm `opentype.js` + `repos/opentypejs/opentype.js` + raw README |
| **bidi-js** | 1.1.0 | MIT | 54 | 2026-09-06T19:53:07Z | 167.2 KB / 18 فایل | خیر (تشخیص/مرتب‌سازی run ها، نه گلیف) | در ترتیب‌دهی RTL + mirror نقش دارد، shaping نمی‌کند | بله، سبک | npm `bidi-js` + `repos/lojjic/bidi-js` |
| **unicode-bidirectional** (BBC) | 2.0.5 | MIT | 50 | 2019-04-03T04:38:19Z | `dist.unpackedSize` در registry موجود نبود → **UNVERIFIED** | خیر | فقط UBA نسخهٔ Unicode 9.0 | بله ولی قدیمی (۲۰۱۹) — به‌جای آن bidi-js | npm `unicode-bidirectional` + `repos/bbc/unicode-bidirectional` |
| **canvaskit-wasm** | 0.42.0 | BSD-3-Clause | (repo: `google/skia` = 10993) | skia: 2026-10-19T08:33:47Z | 25442.9 KB / 25 فایل | **بله** (TextBlob، position per glyph) | **بله** (متن Skia روی HarfBuzz ساخته شده) | WebGL (نه Canvas2D)؛ حجم ۲۵ مگابایت — برای رندر headless قابل‌قبول | npm `canvaskit-wasm` + `repos/google/skia` |
| **troika-three-text** | 0.52.5 | MIT | (monorepo `protectwise/troika` = 1981) | 2026-07-24T03:24:39Z | 823.2 KB / 49 فایل | بله (SDF atlas + per-glyph) | **UNVERIFIED** برای Arabic joining (README دربارهٔ shaping عربی چیزی نمی‌گوید) | فقط WebGL/Three.js | npm `troika-three-text` + `repos/protectwise/troika` |

نکتهٔ حجم: `harfbuzzjs` ۱٫۳ مگابایت unpacked (۹ فایل) — کمترین راه رسیدن به shaping واقعی. `canvaskit-wasm` ۲۵٫۴ مگابایت — گران؛ فقط اگر WebGL لازم شد.

---

## ۲. کدام کتابخانه‌ها shaping فارسی را می‌شکنند

**opentype.js هیچ shaping engine ندارد.** متن README رسمی: «Currently only ligature features `liga` and `rlig` are supported». یعنی featureهای `init`/`medi`/`fina`/`rlig`(به‌معنای joining)/`calt` اعمال نمی‌شوند؛ نتیجه: حروف فارسی **همیشه فرم isolated** می‌گیرند («بیشتر» به‌جای «بیشتر»)، پس اتصال‌ها می‌شکند و هر افکت per-glyph روی آن بی‌معنی است. README همچنین می‌گوید «Support arabic text rendering (See issue #364 & PR #359 #361)» — این به معنی *نمایش* فارسی است، نه shaping. **برای motion فارسی opentype.js را نصب نکنید** (مگر برای خواندن metadata فونت/GSUB inspection، آن هم با احتیاط).

بقیه:
- **harfbuzzjs / fontkit / canvaskit-wasm**: shaping درست (HarfBuzz یا موتور مبتنی بر آن).
- **bidi-js / unicode-bidirectional**: shaping نمی‌کنند (فقط bidi) — خطرشان شکستن join نیست، خطرشان جابه‌جایی نادرست runهاست اگر به‌جای `ctx.direction` استفاده شوند.
- **troika-three-text**: `UNVERIFIED` — برای WebGL است، نه Canvas 2D.

---

## ۳. Font featureهایی که برای Persian motion مهم‌اند و هر کتابخانه چگونه آن‌ها را می‌دهد

| feature / کاراکتر | کد | چرا در motion مهم است | harfbuzzjs | fontkit | opentype.js | Canvas2D بومی (مرورگر) |
|---|---|---|---|---|---|---|
| **Kashida / tatweel** | U+0640 «ـ» | معادل بومی letter-spacing؛ تأکید کششی بدون شکستن join | با shaping عادی glyph می‌سازد؛ کشش نرم = scaleX نوار join بین دو glyph شکل‌یافته | با `layout()`؛ عرض tatweel از GlyphPosition | ❌ (بدون shaping) | ❌؛ فقط با pre-shaped outline یا font variable |
| **Kashida به‌صورت variable axis** | — | کشش پیوسته و بدون پرش | با `font.setVariations({...})` | با `font.variationAxes` / `namedVariations` | ❌ | فقط اگر فونتِ variable داشته باشد (Vazirmatn/Estedad variable در `wght`) |
| **ZWNJ (نیم‌فاصله)** | U+200C | «می‌شود» یک کلمه بماند ولی وصل نشود؛ در typewriter با prefix باید بین visible/invisible برود | همان متن ورودی؛ HarfBuzz ZWNJ را می‌شناسد | همان | بدون اثر (چون shaping ندارد) | در متن DOM بومی؛ در Canvas2D خودِ `fillText` بومی است |
| **ZWJ (برای per-letter)** | U+200D | روش سبک per-letter: هر حرف با ZWJ به همسایه چسبیده بماند | ورودی متن | ورودی متن | ❌ | DOM/Canvas fillText بومی |
| **faDigits** | U+06F0–U+06F9 | شمارنده و زمان فارسی؛ **نه** Arabic-Indic ٠–٩ (که «dot-matrix»/چیدمان متفاوت دارند) | فقط متن | فقط متن | فقط متن | `Intl.NumberFormat('fa-IR')` یا تبدیل دستی |
| **Persian Yeh / Kaf** | U+06CC «ی» / U+06A9 «ک» | فونت عربی این دو را عربی می‌کشد؛ ی/ک عربی ممنوع | متن ورودی | متن ورودی | متن ورودی | متن ورودی |
| **GSUB ligature forms** | `init`/`medi`/`fina` + `rlig`/`liga`/`calt` | شکل‌های ابتدایی/میانی/پایانی = خودِ «اتصال» | ✅ کامل (HarfBuzz) | ✅ طبق README (GSUB/GPOS) | ❌ فقط `liga` و `rlig` | بومی در مرورگر |
| **لا (lam-alef)** | U+0644+U+0627 | ligature اجباری؛ شکستن آن = خرابی | ✅ | ✅ | ❌ | بومی |
| **Dot count / nuqta** | بی‌کد (نقطه‌ها جزء contour حرف‌اند) | برای «نقطه‌ها آخر بیایند» باید contourها جدا شوند | با outline extraction (glyph path) | `glyph.path` | `glyph.getPath` (بی‌اتصال) | باید از outline بیاید، نه از `fillText` |

نکتهٔ کلیدی: `fillText` در Canvas2D هیچ API برای «موقعیت هر گلیف» نمی‌دهد. برای انیمیشن per-glyph امن، دو راه داریم:
1. **outline route** (دقیق): HarfBuzz شکل می‌دهد → path هر گلیف + مختصات/advance → در Canvas2D خودمان `Path2D` را `fill` می‌کنیم (دقیقاً مثل `assets/remotion/src/intro/TitleOutline.tsx` در مرجع زیر).
2. **DOM/SVG route**: متن واقعی را در DOM/SVG نگه داریم و فقط در سطح word/line انیمیت کنیم.

---

## ۴. پیاده‌سازی‌های مرجع

### ۴.۱ `github.com/atmirrr/persian-motion-director` (مرجع اصلی)

آمار (GitHub API، 2026-10-20): stars **146**، license `NOASSERTION` (فایل LICENSE موجود؛ SPDX نامشخص → **UNVERIFIED** کدام لایسنس)، last push **2026-10-06T21:27:09Z**، size **7692 KB**.
محتوای کلیدی (مسیر دقیق فایل‌ها از clone واقعی):

- `SKILL.md` — متد director، non-negotiables فارسی، جدول ۸ تکنیک.
- `references/persian-typography.md` — ۸ فصل: joining/boxes/seams، per-letter و per-dot بدون شکستن join، mask/line-height، جهت bidi، کاراکترها (ی/ک، رقم، ZWNJ)، kashida به‌جای letter-spacing، فونت‌ها، چک‌لیست.
- `references/anti-slideshow.md`، `references/persian-copy.md`، `references/workflow.md`، `references/sources.md`.
- `references/techniques/01-one-camera.md` … `08-kashida.md` — هشت تکنیک (جدول زیر).
- `scripts/shape_persian.py` — shaping با **uharfbuzz** + fontTools؛ خروجی هر گلیف: `[x, y, advance, cluster, bodyPath, [dotPaths], [dotBounds], group]`؛ گلیف‌ها در ترتیب **visual (index 0 = چپ‌ترین)**؛ `groups_of()` گروه‌های حروف وصل را می‌سازد.
- `scripts/split_fa.js` — `splitFa(word)` / `splitWords(line)`: با ZWJ هر حرف فرم joined خود را نگه می‌دارد؛ لا را با هم نگه می‌دارد؛ mark و ZWNJ به حرف خودش می‌چسبد.
- `scripts/lint_persian.py` — لینتر: رقم عربی، U+200B به‌جای ZWNJ، kashida در جای غیرمجاز، letter-spacing در فایل دارای فارسی.
- `assets/sketches/sketches.js` — ۸ sketch با id: `oner, match, ui, beat, boil, cutout, nuqta, kashida`؛ `assets/sketches/glyphs.js` دادهٔ شکل‌یافته؛ `assets/sketches/engine.js` موتور؛ `assets/sketches/gallery.html` گالری.
- `assets/remotion/src/intro/TitleOutline.tsx` — تیتر فارسی از outlineهای HarfBuzz؛ kashida را با `shift(gi)` و rect نوار join می‌سازد.
- `assets/remotion/src/intro/kit.tsx` (`whip()` easing)، `Intro.tsx`، `glyphs-intro.js`، `assets/remotion/src/fonts.ts` (`FontFace` + `delayRender`)، `assets/remotion/src/SketchPlayer.tsx`.

| # | تکنیک | فایل مرجع | توضیح یک‌خطی | Canvas 2D؟ |
|---|---|---|---|---|
| 01 | One camera, no cuts | `references/techniques/01-one-camera.md` | همهٔ صحنه‌ها روی یک نوار چیده‌شده RTL؛ دوربین سفر می‌کند (whip + motion blur + parallax)، نه fade بین صحنه‌ها | **بله** (tween دستی؛ blur با `ctx.filter='blur(Npx)'` — پشتیبانی Chromium `UNVERIFIED` در این ریپو) |
| 02 | One shape carries the story | `references/techniques/02-one-shape.md` | نقطهٔ «.» (چپ‌ترین گلیف خط RTL) به حباب چت و بعد به نقطهٔ خط بعدی تبدیل می‌شود؛ continuity به‌جای transition | **بله** (morph مسیر = lerp نقاط Path2D؛ کارِ دستی) |
| 03 | The real UI, directed | `references/techniques/03-real-ui.md` | رابط واقعی به‌صورت vector/DOM در 3D، دوربین dolly، cursor روی قوس، focus pull | **خیر** (CSS 3D perspective/DOM؛ در Canvas2D فقط fake با skew/scale) |
| 04 | Cut on the beat | `references/techniques/04-beat-cut.md` | هر beat یک cut سخت؛ punch-in 1.06→1.00؛ تأکید روی «and» | **بله** (فقط زمان‌بندی) |
| 05 | On twos, with line boil | `references/techniques/05-line-boil.md` | pose هر ۲ فریم، wobble خط با `feTurbulence`+`feDisplacementMap` و ۳ seed؛ دوربین هر فریم نرم | **نسبی** (SVG filter در Canvas2D نیست → باید با jitter دوباره‌shape کرد) |
| 06 | Paper cut-out letters | `references/techniques/06-paper-cutout.md` | هر **گروه حروف وصل** یک تکهٔ کاغذی صُلب، pinned روی baseline، سایهٔ واحد | **بله** (Path2D + `ctx.shadowBlur`) |
| 07 | Dots last | `references/techniques/07-nuqta-dots.md` | بدنهٔ حروف زودتر (wipe هر word از راست)، بعد نقطه‌ها یکی‌یکی می‌افتند با squash | **بله** (دقیقاً: body path + dot path جدا) |
| 08 | Kashida, not letter-spacing | `references/techniques/08-kashida.md` | کشش نوار join بین م و س در «هرمس» با معیار نقطه‌های لوزی، سپس release با spring | **بله** (rect نوار + جابه‌جایی گلیف‌های سمت راست) |

### ۴.۲ سایر repoهای پیدا‌شده با GitHub Search API

جستجوهای انجام‌شده: `persian motion graphics`، `rtl+animation+typography`، `opentype.js arabic shaping font`، `persian typography animation canvas`.

- `persian motion graphics` → total=**1**: `thepoo7an/thepoo7an.github.io` (stars **1**، MIT، push 2026-10-19T18:33:13Z) — پورتفولیوی lyric-typography با topics: `persian, motion-graphics, lyric-video`؛ مرجع تکنیک نیست.
- `rtl+animation+typography` → total=**7**، همه تقریباً بی‌استفاده: `AhmedHegazy121/TodoList` (0)، `Dima-AH/miladAhmadi-portfolio` (0)، `Uzair0123/project_webpages` (0)، `momenahmed450-bit/reef-quarterly` (0)، `samuadda/rtl-skill` (0، MIT — skill RTL برای UI، نه motion)، `shayanostovar/Fal-e-HafezGenerator-YaldaNight` (0)، `thepoo7an/thepoo7an.github.io` (1).
- جستجوی forkهای shaping برای opentype.js: نتیجهٔ قابل‌استفاده‌ای در API برنگشت (`UNVERIFIED`)؛ جمع‌بندی عملی: به‌جای fork کردن، **harfbuzzjs** نصب کنید.

**نتیجهٔ بخش ۴**: تنها مرجع جدی و قابل‌اتکا `atmirrr/persian-motion-director` است؛ بقیهٔ نتایج Search عملاً بی‌ربط‌اند.

---

## ۵. قواعد تکنیک (شماره‌دار) — منبع هر قاعده

هر قاعده به فایل/تکنیک منبع اشاره دارد. «منبع» یعنی: `pmd` = `atmirrr/persian-motion-director`، `lessons` = `docs/PERSIAN-LOCALIZATION-LESSONS.md`.

1. **هرگز letter-spacing روی فارسی** — `letterSpacing` روی متن فارسی اتصال را می‌شکند (Chrome از نسخهٔ ۱۳۷ آن را داخل کلمه نادیده می‌گیرد؛ ابزارهای دیگر join را می‌شکنند). جایگزین: kashida. منبع: `lessons` §1 + `pmd` `references/persian-typography.md` §6 + `references/techniques/08-kashida.md`.
2. **Reveal در سطح word/line، نه letter** — per-letter fade/box اتصال را می‌شکند (حروف joined روی هم overlap دارند → seam). منبع: `lessons` §1 + `pmd` `references/persian-typography.md` §1.
3. **per-letter فقط با دو راه امن**: (a) outlineهای HarfBuzz (body/dot/group) — `pmd` `scripts/shape_persian.py`؛ (b) ZWJ-split (`splitFa`) — `pmd` `scripts/split_fa.js`. هر روش دیگری join را می‌شکند. منبع: همان دو + `lessons` §1c.
4. **کاشیده فقط بعد از حرفی که به جلو وصل می‌شود**: ب پ ت ث ج چ ح خ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن ه ی — هرگز بعد از ا آ د ذ ر ز ژ و ۀ، هرگز داخل لا، هرگز کنار ZWNJ، حداکثر یک‌بار در هر کلمه. منبع: `pmd` `references/techniques/08-kashida.md` §Rules + `persian-typography.md` §6 + `scripts/lint_persian.py` (`kashida_issues`).
5. **کشش کاشیده بین دو گلیف شکل‌یافته** (نه افزودن tatweel به‌صورت متن در هر فریم): یک‌بار با tatweel شکل بگیر، عرض نوار را بردار، گلیف‌های سمت راست را به‌اندازهٔ L جابه‌جا کن، کلمه را با L/2 دوباره وسط‌چین کن. منبع: `pmd` `references/techniques/08-kashida.md` Recipe + `assets/remotion/src/intro/TitleOutline.tsx` (`shift`, `adv`).
6. **نقطه‌ها (nuqta) جدا از بدنهٔ حرف** — چون در خط فارسی تفاوت ب/پ/ت/ث فقط با نقطه است؛ بدنه‌ها یک‌بار wipe می‌شوند (per-word RTL wipe با clip rect که به چپ رشد می‌کند، `cubic-bezier(.16,1,.3,1)` ≈ 0.75s، فاصلهٔ ~0.24s بین wordها) و نقطه‌ها بعد از آن مرتب از راست به چپ با ~55ms فاصله (±15ms jitter) می‌افتند؛ نقطهٔ بالای خط از بالا، پایین خط از پایین، با squash-on-land. منبع: `pmd` `references/techniques/07-nuqta-dots.md`.
7. **جهت همه‌چیز راست‌به‌چپ**: reveal و stagger از راست شروع می‌شوند؛ «ورود از ابتدای خط» = `translateX(+x → 0)`؛ پیشرفت (progress) راست‌به‌چپ پر می‌شود؛ دوربین به چپ سفر می‌کند (صحنهٔ بعدی سمت چپ است، پس محتوا به راست حرکت می‌کند). منبع: `pmd` `references/persian-typography.md` §4 + `references/techniques/01-one-camera.md` («next scene is to the left»).
8. **Wipe در RTL از راست باز می‌شود**: `clip-path: inset(-0.6em 0 -0.6em calc((1 - p) * 100%))` (لبهٔ چپ متغیر)؛ آینهٔ آن در SVG clip: `inset(0 X% 0 0)` → `inset(0 0 0 X%)`. منبع: `pmd` `references/persian-typography.md` §3 + `lessons` §3 (SVG clip reveals).
9. **خط‌به‌خط (line-by-line) به ترتیب خواندن**: خط اول (راست‌ترین) زودتر؛ offset بین خطوط روی beat grid؛ در یک beat ۱ تا ۴ کلمه، نه بیشتر. منبع: `pmd` `references/techniques/04-beat-cut.md` («One to four words per beat») + `references/techniques/01-one-camera.md` (labels راست‌به‌چپ بعد از settle دوربین).
10. **تأکید baseline**: وزن/اندازه را روی **کلمه** عوض کن نه حرف؛ overshoot < ۲٪ (برای متن اصلاً spring با overshoot نه)؛ متن نباید بیش از ~۲۰ فریم «آرام» بخواند و نگه داشته شود. منبع: `pmd` `SKILL.md` (جدول anti-slideshow: entrances `bezier(.16,1,.3,1)` ~۲۰ فریم، exits `bezier(.7,0,.84,0)` ~۸ فریم و فقط ۷۰٪ مسافت؛ spring stiffness 100/damping 16 ≈ ۱٫۵٪ overshoot، روی متن صفر).
11. **Weight pump فقط با فونت variable** (Vazirmatn/Estedad) — وزن ۶۰۰/۸۰۰ روی Lalezar/Amiri/Estedad بی‌اثر یا fake-bold است. منبع: `lessons` §2.
12. **Drawer/underline با lineDashOffset**: خط زیر متن RTL است → مسیر از راست به چپ؛ `setLineDash([len])` + `lineDashOffset = len * (1 - t)`؛ خط را در `y = baseline + descender + pad` بگذار نه عدد ثابت لاتین. منبع: `lessons` §3 (زیرخط با رشد line-height جابه‌جا می‌شود) + `pmd` `references/techniques/05-line-boil.md` («an underline that draws in») + `assets/sketches/sketches.js` (travelling dotted trail با `stroke-dasharray: 3 22`).
13. **Count-up با faDigits**: فقط U+06F0–U+06F9؛ `Intl.NumberFormat('fa-IR')` (جداکنندهٔ ٬ و ٫ فارسی)؛ در RTL اعداد LTR بمانند (mirror نکن)؛ برای شمارندهٔ beat/progress که RTL است، خودِ نوار پیشرفت راست‌به‌چپ پر شود ولی عدد در یک جزیرهٔ `dir="ltr"` بماند. منبع: `pmd` `references/persian-typography.md` §5 + `references/techniques/04-beat-cut.md` («A beat counter or progress for RTL runs right to left») + `lessons` §3 (عدد = فیزیکی، mirror نشود).
14. **Glitch/jitter خوانا بماند**: بخش «قفل‌شده» (prefix) یک run متنِ یکپارچه بماند تا shaping سالم بماند؛ نویزِ جهنده در سلول‌های `inline-block` با عرض ثابت رندر شود (تا نویز نتواند کلمهٔ جعلیِ وصل‌دار بسازد)؛ یک ghost copy نامرئی از کلمهٔ نهایی برای عرض پایدار؛ در noise از رقم صفر فارسی «۰» استفاده نکن (نقطه/لوزی می‌شود)؛ hit-probability برای هر گروه = `1-(1-g)^len`. منبع: `lessons` §1c (Scramble/decode/glitch) + §1b (pen باید روی stroke واقعی، body قبل از dots).
15. **Jitter هرگز join را نشکند**: فیلتر boil/نویز **بعد از shaping** اعمال شود (متن زنده یا outline)، نه قبل. منبع: `pmd` `references/techniques/05-line-boil.md` («The boil filter runs after shaping, so live Persian text can boil without breaking joins»).
16. **Pen/brush اگر هست، راست‌به‌چپ روی stroke واقعی فونت** و body قبل از نقطه‌ها. منبع: `lessons` §1b.
17. **تعداد واحدهای stagger را با تعداد گروه‌های وصل بسنج، نه تعداد code point**: برای حفظ همان ریتم، delay را با `(span)/(units-1)` مقیاس کن. منبع: `lessons` §1c.
18. **Mask قدی کافی**: padding حدود 0.5em بالا/پایین، `line-height ≥ 1.6` (≥ 2.4 نستعلیق)؛ Vazirmatn در ۱۰۰px: ascent 103px، descent 54px، «گ» حدود 80px بالای baseline می‌رود. منبع: `pmd` `references/persian-typography.md` §3 + `lessons` §1c (mask-and-rise: کادر به ارتفاع line box با lineHeight ~1.5).
19. **فونت را قبل از اولین فریم لود کن** و بعد از لود اندازه‌گیری کن (نه قبل)؛ وگرنه fallback سیستمی و اندازهٔ اشتباه. منبع: `pmd` `assets/remotion/src/fonts.ts` + `references/persian-typography.md` §7 + `lessons` §2 (measure after `document.fonts.load`).
20. **بی‌گسستگی مسیر حرکت**: یک دوربین/یک شیء بین صحنه‌ها؛ هرگز `fade()` بین صحنه‌ها؛ cut روی beat یا ۲ فریم قبل از آن. منبع: `pmd` `SKILL.md` + `references/techniques/01-one-camera.md` + `references/techniques/04-beat-cut.md`.
21. **کاراکترها**: ی (U+06CC)، ک (U+06A9)، ارقام ۰–۹ (U+06F0–06F9)، نیم‌فاصله U+200C (نه U+200B)، نقطه‌گذاری «، ؛ ؟ « »». منبع: `pmd` `references/persian-typography.md` §5 + `scripts/lint_persian.py` + `lessons` §1b.
22. **بی‌دی / ایزوله‌کردن Latin**: هر کلمهٔ لاتین یا عدد داخل فارسی با `<bdi>` یا FSI/PDI ایزوله شود، وگرنه «از C++ و Hermes!» به «++C» و «!Hermes» تبدیل می‌شود. منبع: `pmd` `references/persian-typography.md` §4 + `references/techniques/03-real-ui.md` + `lessons` §1 (mixed runs).
23. **بازبینی قبل از رندر**: lint متن + نگاه به فریم‌های میانی reveal (هر پله یک حرف، شکل درست) + چک‌لیست ۸‌گانهٔ `persian-typography.md` §8. منبع: `pmd` `scripts/lint_persian.py` + `references/persian-typography.md` §8 + `lessons` §1c.

---

## ۶. مشخصات kit (تابع‌هایی که باید به PF اضافه شوند)

امضای کامل‌ها در ستون «signature». همه توابع **frame/time-based** هستند (`t` = زمان بر حسب ثانیه) و خروجی‌شان یک draw-call روی Canvas2D است؛ هیچ‌کدام نباید متن را به کدپوینت تکه‌تکه کنند مگر طبق قاعدهٔ ۳ (outline/ZWJ).

| تابع | signature | پارامترها | قانونی که پیاده می‌کند | منبع |
|---|---|---|---|---|
| `PF.shapeFa` | `PF.shapeFa(text, {font, dir='rtl', script='Arab', lang='fa', features=[], size, wght})` → `{glyphs:[{gid,x,y,advance,path,dots,group}], width, upem}` | متن، فونت، direction/script/lang، featureها، وزن | shaping واقعی با HarfBuzz (harfbuzzjs)؛ خروجی body/dot/group جدا — پایهٔ همهٔ افکت‌های per-glyph | `pmd` `scripts/shape_persian.py` + `references/techniques/07` |
| `PF.textWords` | `PF.textWords(lines, {gap=0.24, mode='word'})` → `[{text, x, y, w, lineIndex}]` | آرایهٔ خطوط، فاصلهٔ بین کلمه‌ها، mode | جداکردن در سطح word با `Intl.Segmenter('fa',{granularity:'word'})`؛ «می‌شود» یک کلمه بماند؛ هرگز per-character | `pmd` `scripts/split_fa.js` (`splitWords`) + قاعدهٔ ۲ + ۲۱ |
| `PF.textRevealWord` | `PF.textRevealWord(t, line, {mode='rtl-wipe', dur=0.75, delay=0, ease=easeOutExpo})` → `void` (draw) | زمان، یک کلمه/خط، مدل، مدت، تأخیر | wipe راست‌به‌چپ: clip rect از راست باز می‌شود (`inset(-0.6em 0 -0.6em (1-p)*100%)`)، بدنه و نقطه‌ها با هم، متن زیر mask با ~20px سُر خوردن | قاعدهٔ ۶، ۸ + `pmd` `references/techniques/07-nuqta-dots.md` |
| `PF.textRevealPhrase` | `PF.textRevealPhrase(t, lines, {perLine=0.12, order='rtl'})` | زمان، خطوط، فاصلهٔ بین خطوط | reveal خط‌به‌خط به ترتیب خواندن (خط اول = راست‌ترین)؛ beat-grid | قاعدهٔ ۹ + `pmd` `references/techniques/04-beat-cut.md` |
| `PF.textDots` | `PF.textDots(t, line, {start=0.5, gap=0.055, jitter=0.015, fall=0.26})` | زمان، خط، تأخیر شروع، فاصلهٔ نقطه‌ها، jitter، زمان سقوط | نقطه‌ها از راست به چپ، بالا از بالا/پایین از پایین، `y=H(1-p²)`، squash `sy=1-0.34·e^(-16u)cos(34u)`، rebound | قاعدهٔ ۶ + `pmd` `references/techniques/07-nuqta-dots.md` |
| `PF.textDrawOn` | `PF.textDrawOn(t, {text, x, y, len, dir='rtl', dur=0.6, dash=null, offset=0})` | زمان، متن/مسیر، مختصات، طول، جهت، مدت، dash | underline/خط زیر متن با `setLineDash([len])` + `lineDashOffset = len*(1-t)`؛ خط زیر baseline+descender+pad (نه عدد ثابت)؛ جهت RTL | قاعدهٔ ۱۲ + `lessons` §3 |
| `PF.textKashida` | `PF.textKashida(t, {text, joint, amount=0, pull=1.5, release=0.35})` | زمان، متن، محل join، طول کشش (واحد فونت)، زمان pull/release | کشیده‌کردن نوار join بین دو گلیف شکل‌یافته: عرض tatweel = `adv`، جابه‌جایی گلیف‌های راست = `L-adv`، re-center = `L/2`؛ pull با `cubic-bezier(.65,0,.12,1)`، release با spring | قاعدهٔ ۴، ۵ + `pmd` `references/techniques/08-kashida.md` + `TitleOutline.tsx` |
| `PF.textKashidaCheck` | `PF.textKashidaCheck(text)` → `{ok, reasons[]}` | متن | قوانین مجازی kاشیده: بعد از حرفِ joining-forward، نه داخل لا، نه کنار ZWNJ، حداکثر یکی در هر کلمه | `pmd` `scripts/lint_persian.py` (`kashida_issues`) + قاعدهٔ ۴ |
| `PF.textBaselineEmph` | `PF.textBaselineEmph(t, line, {word, prop='wght', from=400, to=800, dur=0.4})` | زمان، خط، کلمه، property، از/تا، مدت | تأکید baseline روی کلمه (نه حرف)؛ فقط با فونت variable؛ overshoot صفر | قاعدهٔ ۱۰، ۱۱ + `lessons` §2 |
| `PF.textCountUp` | `PF.textCountUp(t, {from, to, dur, faDigits=true, decimals=0, sep='fa'})` → `{str}` | زمان، از/تا، مدت، faDigits، اعشار، جداکننده | شمارش با ارقام فارسی U+06F0–06F9؛ `Intl.NumberFormat('fa-IR')`؛ عدد LTR و بدون mirror | قاعدهٔ ۱۳ + `pmd` `references/persian-typography.md` §5 |
| `PF.textGlitch` | `PF.textGlitch(t, {text, prefixLock=true, density=0.3, seed=0})` | زمان، متن، قفل prefix، چگالی، seed | prefix سالم (شکل یکپارچه) + نویز در سلول‌های fixed-width؛ hit-prob `1-(1-g)^len`؛ بدون «۰»؛ بدون شکستن join | قاعدهٔ ۱۴، ۱۵ + `lessons` §1c |
| `PF.textRtlWipeMask` | `PF.textRtlWipeMask(w, h, p, {pad=0.6})` → `Path2D`/clip rect | عرض/ارتفاع، پیشرفت، padding | clip rect راست‌به‌چپ + padding عمودی 0.5em (بالا/پایین) | قاعدهٔ ۸، ۱۸ + `pmd` `references/persian-typography.md` §3 |
| `PF.textLines` | `PF.textLines(lines, {size, lineHeight=1.6, align='right', dir='rtl', maxWidth})` → `{items:[{text,x,y,w}], height}` | خطوط، اندازه، line-height، تراز، جهت، عرض | چیدمان چندخطی RTL با line-height ≥ 1.6 (≥2.4 نستعلیق)؛ اندازه‌گیری بعد از لود فونت | قاعدهٔ ۱۸، ۱۹ + `pmd` `references/persian-typography.md` §3، §7 |
| `PF.textMeasure` | `PF.textMeasure(text, {font, size})` → `{width, ascent, descent, upem}`` | متن، فونت، اندازه | اندازه‌گیری واقعی (نه fallback)، برای اینکه underline/decorate از glyph box بیرون بیاید | `lessons` §2 + قاعدهٔ ۱۹ |
| `PF.textIsolateLatin` | `PF.textIsolateLatin(text)` → `string` | متن | پیچیدن هر توکن لاتین/عدد با FSI…PDI برای جلوگیری از پرش نقطه‌گذاری | قاعدهٔ ۲۲ + `pmd` `references/persian-typography.md` §4 |
| `PF.textLint` | `PF.textLint(text)` → `[{type,index,msg}]` | متن | ی/ک عربی، ارقام عربی، U+200B، کاشیدهٔ بدجا، نیم‌فاصله | قاعدهٔ ۲۱ + `pmd` `scripts/lint_persian.py` |
| `PF.textDraw` | `PF.textDraw(ctx, item, {font, size, fill, stroke, strokeWidth=0})` | ctx، آیتم، فونت، اندازه، رنگ، stroke | رسم متن سالم (بدون شکستن join) در یک run؛ `stroke` فقط با fill هم‌رنگ (outline روی فونت فارسی seam می‌دهد) | `lessons` §1d + قاعدهٔ ۲ |

قرارداد کلی: هیچ تابعی نباید `ctx.letterSpacing` یا `ctx.font` با weight غیرمجاز روی فونت single-weight (Lalezar/Amiri) ست کند؛ هیچ تابعی نباید متن را با `Array.from(text)` تکه کند مگر از مسیر outline/ZWJ.

---

## ۷. سه کتابخانه‌ای که ارزش نصب‌کردن دارند

1. **harfbuzzjs 1.6.3** (MIT، ۲۹۳ ستاره، ۱٫۳ MB unpacked) — انتخاب اول. خودِ HarfBuzz است: shaping واقعی فارسی (`init/medi/fina`)، per-glyph `xAdvance/xOffset` و `glyphToPath` می‌دهد، پس هم per-letter امن (outline) و هم per-dot و هم kashida ممکن می‌شود؛ در مرورگر اجرا می‌شود و برای رندر headlessِ frame-by-frame قطعی است (بدون fallback سیستمی). دقیقاً همان چیزی است که مرجع `pmd` با `uharfbuzz` انجام می‌دهد، فقط به‌جای Python در مرورگر.
2. **fontkit 2.0.4** (MIT، ۱۶۷۷ ستاره، ۵٫۵ MB) — جایگزین/مکمل سطح‌بالا: `font.layout()` با GSUB/GPOS و variable axes (`wght`) برای weight pump روی Vazirmatn/Estedad؛ برای وقتی که outline لازم نیست و می‌خواهیم فقط positionها را بگیریم. (جدول featureهای عربی: `UNVERIFIED` — قبل از استفاده یک تست join بگیرید.)
3. **bidi-js 1.1.0** (MIT، ۵۴ ستاره، ۱۶۷ KB) — سبک و دقیق برای UBA: وقتی متن را به‌صورت دستی در Canvas2D می‌چینیم (نه DOM)، ترتیب runها و mirror حروف لازم است؛ `unicode-bidirectional` BBC قدیمی (Unicode 9.0، آخرین push 2019) است و جایگزین ضعیف‌تری.

نادیده‌گرفتنی: `opentype.js` (بدون shaping → فارسی را می‌شکند)، `canvaskit-wasm` (۲۵ MB، فقط اگر به WebGL رفتیم)، `troika-three-text` (فقط Three.js، shaping عربی `UNVERIFIED`).

---

## ۸. فهرست `UNVERIFIED`

- لایسنس دقیق `atmirrr/persian-motion-director` (API: `NOASSERTION`).
- ستاره/تاریخ `troika-three-text` به‌عنوان repo مستقل (پکیج در monorepo `protectwise/troika` است).
- `dist.unpackedSize` برای `unicode-bidirectional`.
- اینکه fontkit دقیقاً کدام featureهای عربی (`init/medi/fina`) را اعمال می‌کند.
- اینکه troika-three-text Arabic joining را shape می‌کند یا نه.
- پشتیبانی `ctx.filter='blur()'` و معادل Canvas2D برای `feTurbulence/feDisplacementMap` (تکنیک 05) در همین پروژه — باید تست شود.
- نتایج جستجوی forkهای shaping برای opentype.js (چیزی برنگشت).
- «۲۰ فریم / ۸ فریم / ۷۰٪ مسافت / ۱٫۵٪ overshoot» و اعداد مشابه: از `SKILL.md` مرجع نقل شده‌اند، نه اندازه‌گیری در این پروژه.
