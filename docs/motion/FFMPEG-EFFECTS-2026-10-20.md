# FFMPEG-EFFECTS-2026-10-20 — راستی‌آزمایی افکت‌های ffmpeg برای پایپ‌لاین HTML+Canvas → PNG → mp4

تاریخ اجرا: 2026-10-20 · ماشین: Windows / pwsh · خروجی: 1080x1920 @ 30fps
بیلد: `ffmpeg version 7.1-essentials_build-www.gyan.dev` (static, gpl, MSYS2/gcc 14.2.0)

روش تست: فریم‌های واقعی PNG در `%TEMP%\ffx` ساخته شد و همه‌ی دستورها **واقعاً اجرا** شدند؛
خروجی‌ها mp4 با `libx264 -pix_fmt yuv420p -r 30` روی 270x480 و ۶۰ فریم (مگر ذکر شود) هستند.
اندازه‌ها «بایت فایل خروجی» هستند. هر چیزی که اجرا نشده با برچسب **UNVERIFIED** مشخص شده.

---

## ۱) فیلترهای موجود روی این بیلد

### موجود (تأییدشده با `ffmpeg -filters`)

| گروه | فیلترها |
|---|---|
| ترنزیشن | `xfade` (۵۸ ترنزیشن) |
| بافت/نویز | `noise`، `atadenoise`، `hqdn3d`، `nlmeans`، `bm3d`، `vaguedenoiser`، `dctdnoiz`، `chromanr`، `owdenoise`, `gradfun`, `deband` |
| رنگ/گرید | `curves`، `colorbalance`، `colorlevels`، `eq`، `hue`، `huesaturation`، `colorchannelmixer`، `lut3d`، `lutrgb`، `lutyuv`، `haldclut`، `tonemap`، `colorspace`، `zscale` |
| نوری | `vignette`، `gblur`، `boxblur`، `avgblur`، `unsharp`، `chromashift`، `lenscorrection`، `perspective` |
| ترکیب/بلر | `blend`، `tblend`، `tmix`، `displace` |
| ابزار | `geq`، `rotate`، `crop`، `scale`، `zoompan`، `drawtext` (libfreetype + libfribidi) |
| سنجش | `libvmaf`، `xpsnr`، `signalstats`‑family |
| منابع | `perlin`، `haldclutsrc`، `testsrc2`، `smptebars`، `mandelbrot` |

### غایب (مهم)

| فیلتر | وضعیت | اثر روی پایپ‌لاین |
|---|---|---|
| `frei0r` | **غایب** — نه در `-filters`، نه در `configuration` (فقط `--enable-libgpl`/`--enable-gpl`، بدون `--enable-libfrei0r`) | افکت‌های قدیمی‌نگار (oldfilm, glow, etc.) در دسترس نیست |
| `vulkan` | **غایب** — هیچ فیلتر/دیوایس Vulkan در `-filters` نیست | هیچ مسیر GPU با Vulkan؛ فقط CUDA/NVENC/VAAPI/D3D11VA/QSV/AMF |
| `chromaber` | **غایب** — با وجود اینکه upstream در 7.1 اضافه شده، در این بیلد `essentials` نیست | CA را با `rgbashift` یا `chromashift` بسازید (هر دو تست شدند) |
| `bgblur` | **غایب** | از `gblur` استفاده کنید (تست‌شده) |
| `scanlines` | **غایب** (هیچ فیلتر اسکن‌لاین آماده‌ای وجود ندارد) | نگاه CRT را با `geq` یا در مرورگر بسازید |
| `frei0r`/`sdl` GPU | فقط `--enable-sdl2` هست، GPU-accelerated frei0r نه | — |

**نکتهٔ مهم:** `ffmpeg -filters` خروجی صوتی هم دارد؛ `Select-String 'noise'` علاوه بر `noise` ویدئویی، چندین فیلتر صوتی (e.g. `afftdn`, `arnndn`) را هم برمی‌گرداند — همه «موجود» محسوب نمی‌شوند.

---

## ۲) لیست کامل xfade

خروجی واقعی `ffmpeg -h filter=xfade` — **۵۸ ترنزیشن** (۰ تا ۵۷). ★ = ۱۲ مورد جذاب برای موشن‌دیزاین مدرن.

| # | نام | # | نام | # | نام |
|---|---|---|---|---|---|
| 0 | ★ fade | 20 | circleclose | 40 | wipebr |
| 1 | wipeleft | 21 | vertopen | 41 | squeezeh |
| 2 | wiperight | 22 | vertclose | 42 | squeezev |
| 3 | wipeup | 23 | horzopen | 43 | ★ zoomin |
| 4 | wipedown | 24 | horzclose | 44 | fadefast |
| 5 | slideleft | 25 | ★ dissolve | 45 | fadeslow |
| 6 | slideright | 26 | ★ pixelize | 46 | hlwind |
| 7 | slideup | 27 | ★ diagtl | 47 | hrwind |
| 8 | slidedown | 28 | diagtr | 48 | vuwind |
| 9 | circlecrop | 29 | diagbl | 49 | vdwind |
| 10 | rectcrop | 30 | diagbr | 50 | coverleft |
| 11 | distance | 31 | hlslice | 51 | coverright |
| 12 | fadeblack | 32 | hrslice | 52 | coverup |
| 13 | ★ fadewhite | 33 | vuslice | 53 | coverdown |
| 14 | ★ radial | 34 | vdslice | 54 | revealleft |
| 15 | ★ smoothleft | 35 | hblur | 55 | revealright |
| 16 | ★ smoothright | 36 | ★ fadegrays | 56 | revealup |
| 17 | smoothup | 37 | wipetl | 57 | revealdown |
| 18 | smoothdown | 38 | wipetr | — | — |
| 19 | ★ circleopen | 39 | wipebl | — | — |

★ ۱۲ تای جذاب: `fade`, `fadewhite`, `fadegrays`, `dissolve`, `pixelize`, `radial`, `smoothleft`, `smoothright`, `circleopen`, `circleclose`, `diagtl`, `zoomin`.
(انتخاب عملی: `dissolve` + `pixelize` برای ریتم تکه‌ای/گلیچ، `circleopen`/`circleclose` برای اپن/کلوز نرم، `fadewhite`/`fadegrays` برای فلاش، `smoothleft` برای پردهٔ نرم.)

**۱۸ ترنزیشن اجرا شد، همه exit=0** (see §3, R12).

---

## ۳) دستورهای آماده (همه واقعاً اجرا شده‌اند)

پایه: `ffmpeg -y -framerate 30 -i %TEMP%\ffx\t%02d.png -frames:v 60 -vf "<CHAIN>" -c:v libx264 -pix_fmt yuv420p -r 30 out.mp4`

### R1 — فیلم‌گرین (نویز متحرک)
```
-vf "noise=alls=12:allf=t+u,format=yuv420p"
```
`exit=0` · `131,144 B` · ۶۰ فریم
نویز رنگی + تمپورال روی کل فریم.
**هشدار متن فارسی:** نویز روی گلیف‌های نازک (نقطه‌های «ب»، «ی»، «ن»، کشیده‌ها) خوانایی را نابود می‌کند. `alls` را ≤۱۲ نگه دارید و ترجیحاً گرین را روی لایهٔ پس‌زمینه بزنید نه روی لایهٔ متن. اگر متن داخل PNG رندر شده، گرین را *قبل* از compositing متن بگذارید یا در مرورگر انجام دهید.

### R2 — گرین استاتیک (بدون فlicker)
```
-vf "noise=alls=12:allf=u,format=yuv420p"
```
`exit=0` · `161,717 B`
**رفع یک اشتباه رایج:** در فیلتر `noise` پرچم `t` یعنی *temporal* (هر فریم عوض می‌شود → فlicker) و `u` یعنی *uniform* (الگوی ثابت). پس «گرین پایدار زمانی» = `allf=u` است، نه `allf=t`.
برای مقایسه: `noise=alls=8:allf=t` → `exit=0` · `186,537 B` (بیشترین آنتروپی، بدترین فlicker).
گزینهٔ `all_seed` موجود است (`all_seed <int>`, default -1) → دانه‌دار کردن؛ یکسان‌بودن خروجی بین دو اجرا **UNVERIFIED**.

### R3 — نشت نور / glow ارزان (tblend)
```
-vf "tblend=all_mode=screen:all_opacity=0.18,format=yuv420p"
```
`exit=0` · `108,166 B` · **۵۹ فریم** (tblend یک فریم اول را مصرف می‌کند!)
ترکیب هر فریم با فریم قبلی به‌صورت screen → هاله/دنبالهٔ نوری جهت‌دار.
**هشدار:** روی متن فارسی هاله می‌سازد (ضخامت ظاهری حروف را می‌خورد). برای متن اصلی اصلاً استفاده نشود؛ فقط روی پس‌زمینه.

### R4 — نشت نور واقعی (blend با منبع رنگی)
```
-filter_complex "[0:v][1:v]blend=all_mode=screen:all_opacity=0.18,format=yuv420p[v]" -map "[v]"
(ورودی دوم: -f lavfi -i "color=c=orange:s=270x480:r=30")
```
`exit=0` · `106,923 B`
نشت نورِ ثابت رنگی — بهتر از R3 برای حس فیلم آنالوگ. برای نشت متحر، رنگ/موقعیت را با بک‌گراند متحرک بدهید.

### R5 — ابراهام رنگی (chromatic aberration)
```
-vf "rgbashift=rh=6:bh=-4,format=yuv420p"
```
`exit=0` · `119,328 B`
روی ورودی PNG (rgb24) بدون تبدیل صریح کار می‌کند؛ نسخهٔ صریح `format=rgba,rgbashift=rh=6:bh=-4,format=yuv420p` دقیقاً همان `119,328 B` را داد (عملاً یکسان).
**هشدار متن فارسی:** شیفت ۶ پیکسلی در ۱۰۸۰x۱۹۲۰ خطوط نازک را دو شاخه می‌کند (به‌ویژه «ی» و «کشیده»). `rh/bh` را ≤۳ نگه دارید و فقط روی تصویر پس‌زمینه. جایگزین بدون CA واقعی: `chromashift=cbh=4:crh=-4:cbv=0:crv=0` → `exit=0` · `140,025 B`.

### R6 — وینیت
```
-vf "vignette=PI/5,format=yuv420p"
```
`exit=0` · `108,090 B`
روشن‌تر: `vignette=PI/5:mode=forward` → همان `108,090 B`.
**هشدار:** وینیت گوشه‌ها را می‌کشد؛ متن در گوشه/لبه‌ها خوانایی‌اش را از دست می‌دهد.

### R7 — گرید فیلمی
```
-vf "colorbalance=rs=0.05:gs=0.02:bs=-0.04,eq=contrast=1.08:saturation=0.95,format=yuv420p"
```
`exit=0` · `117,025 B`
گرم‌کردن سایه‌ها + کنتراست/اشباع ملایم.
جایگزین curves: `-vf "curves=preset=increase_contrast:master='0 0 0.12 0.9',format=yuv420p"` → `exit=0` · `60,018 B` (کنتراست تندتر؛ مراقب له‌شدن میانهٔ طیف رنگ).
**هشدار:** اشباع کم (saturation<1) روی متن فارسی کنتراستِ حروف را می‌خورد؛ برای تیتر فارسی saturation را دست‌نخورده بگذارید.

### R8 — پوستریزه / اینک
```
-vf "lutyuv=y='if(gt(val,170),255,if(gt(val,85),128,0))':u='128':v='128',format=yuv420p"
```
`exit=0` · `41,700 B`
پوستریزهٔ ۳-سطحی واقعی.
**هشدار مهم:** `lutyuv=y=1:u=1:v=1` هم exit=0 می‌دهد ولی **پوستریزه نیست** — یک تصویر تخت (۳٬۴۱۵ بایت) تولید می‌کند. برای پوستریزه باید بازه بنویسید.
**هشدار متن:** پوستریزهٔ YUV لبهٔ anti-aliasing حروف فارسی را کاملاً نابود می‌کند (شکل «ش» و «ی» دندانه‌دار می‌شود). فقط روی لایهٔ گرافیک.

### R9 — هالتون (تقریب دیتر)
```
-vf "format=gray,lutrgb=r='val*0.35+128':g='val*0.2+128':b='val*0.1+128',format=yuv420p"
```
`exit=0` · `23,987 B`
خاکستری + کانال‌های رنگی جدا (نمای حرارتی). برای نمای نقطه‌ای بهتر:
```
-vf "format=gbrp,geq=r='r(X,Y)*0.35+128':g='g(X,Y)*0.2+128':b='b(X,Y)*0.1+128',format=yuv420p"
```
`exit=0` · `36,063 B`
و دیتر مرتب ۲x۲ واقعی:
```
-vf "geq=lum='if(lt(mod(X,2)+mod(Y,2),1),235,lum(X,Y)*0.3+100)':cb='128':cr='128',format=yuv420p"
```
`exit=0` · `41,208 B`
**هشدار:** تبدیل به gray یعنی حذف کامل رنگ متن فارسی — برای متن تیتر اصلاً مناسب نیست؛ فقط برای پس‌زمینه/بافت.

### R10 — اسکن‌لاین / CRT
**فیلتر اختصاصی اسکن‌لاین روی این بیلد وجود ندارد** (نه `scanlines`، نه چیز مشابه).
جایگزین‌های تست‌شده:
```
-vf "noise=alls=6:allf=t+u,vignette=PI/6,format=yuv420p"    → exit=0 · 111,675 B
-vf "geq=lum='lum(X,Y)-25*mod(Y,4)':cb='cb(X,Y)':cr='cr(X,Y)',format=yuv420p"  → exit=0 · 127,504 B
```
دومی اسکن‌لاین واقعی می‌سازد ولی `geq` **به‌شدت کند** است (تعبیر عبارت به ازای هر پیکسل) — برای ۱۰۸۰x۱۹۲۰ گران است. در مرورگر (CSS repeating-linear-gradient یا shader) خیلی ارزان‌تر است.

### R11 — نرمی/درخشش
```
-vf "gblur=sigma=1.2,unsharp=5:5:0.6:5:5:0.0,format=yuv420p"
```
`exit=0` · `49,770 B`
بلور گاوسی + شارپ مجدد (soft glow). خروجی کوچک‌تر از ورودی بدون فیلتر است چون جزئیات می‌ریزد.
**هشدار:** `unsharp` لبهٔ حروف را حلقه‌ای (halo) می‌کند؛ روی متن فارسی با ضخامت کم دیده می‌شود.

### R12 — ترنزیشن xfade (بین دو کلیپ هم‌اندازه/هم‌فریم‌ریت)
```
-filter_complex "[0:v][1:v]xfade=transition=dissolve:duration=0.5:offset=1.5[v]" -map "[v]"
```
`exit=0` · `465,115 B` (۱۸ ترنزیشن دیگر هم exit=0 — جدول §2 و پایین).
اندازهٔ همهٔ ۱۸ ترنزیشن اجراشده:
`fade 116,914 · fadewhite 97,906 · fadegrays 111,157 · dissolve 465,115 · wipeleft 103,327 · circleopen 116,285 · circleclose 119,586 · rectcrop 100,447 · radial 112,899 · smoothleft 113,794 · diagtl 118,607 · hlslice 108,552 · hlwind 136,791 · coverleft 103,550 · zoomin 104,672 · distance 103,045 · pixelize 127,623 · squeezeh 120,464` (بایت)
شرط‌ها: هر دو ورودی هم‌اندازه، هم‌SAR، هم‌فریم‌ریت؛ `offset` باید داخل طول کلیپ باشد؛ خروجی = lenA + lenB − duration.

### R13 — ترنسفورم قطعی فریم‌به‌فریم
```
-vf "rotate=0.02*sin(PI*t/3):fillcolor=black,scale=iw*1.1:ih*1.1,crop=trunc(iw/1.1):trunc(ih/1.1),format=yuv420p"
```
`exit=0` · `97,865 B`
چرخش سینوسی + زوم ۱۱٪ + کراپ = حرکت دوربینیِ کاملاً قطعی (قابل بازتولید در مرورگر).
**دو اشتباه در نسخهٔ اولیهٔ دستور (هر دو exit=-22):**
1. `T` (بزرگ) تعریف‌نشده است → `Undefined constant or missing '(' in 'T/3)'` — فیلتر `rotate` فقط `t` (کوچک) دارد.
2. `crop=iw/1.1:ih/1.1` کسری است → خطا؛ باید `trunc(...)` شود.

### (R14) — sanity در رزولوشن نهایی
```
-vf "scale=1080:1920,noise=alls=12:allf=t+u,format=yuv420p"
```
`exit=0` · `427,502 B` (۳۰ فریم) — زنجیره در ۱۰۸۰x۱۹۲۰ هم سالم است.

---

## ۴) چه چیزی را باید در PF kit بنویسیم (معادل سمت مرورگر)

قاعده: هر افکتی که *پیکسل‌به‌پیکسل* کل فریم را عوض می‌کند (گرین، هالتون، CA، پوستریزه) در ffmpeg یعنی یک پاس کامل روی ۱۰۸۰x۱۹۲۰ در هر فریم؛ در مرورگر یعنی یک لایهٔ overlay روی همان اسکرین‌شات. ارزان‌تر و قابل‌کنترل‌تر.

| افکت | روش سمت مرورگر (یک خط) |
|---|---|
| **گرین** | یک تایل ۲۵۶x۲۵۶ با `ImageData` و PRNG با seed ثابت بساز، در هر فریم با `ctx.globalCompositeOperation='overlay'` و `globalAlpha=0.06–0.12` و offset جابه‌جا (نه تصادفی هر فریم) بکش — لایهٔ متن را بیرون از آن نگه دار. |
| **نشت نور** | یک sprite گرادیان شعاعی (`createRadialGradient` نارنجی→transparent) با `globalCompositeOperation='screen'` و alpha 0.1–0.2 بکش و per-frame جابه‌جا کن — به‌جای `tblend`/`blend` در ffmpeg. |
| **ابراهام رنگی** | لایهٔ تصویر را ۳ بار به‌صورت offscreen با offset ±۱..۳px و `filter: url(#rOff)`/`feColorMatrix` جدا رندر کن و با `lighter` ترکیب کن — یا WebGL: نمونه‌برداری R و B با offset در fragment shader. |
| **هالتون** | WebGL fragment shader با شبکهٔ نقطه‌ای چرخیده (`step(sin, cos)`) روی luminance — دیتر مرتبِ واقعی؛ `lutrgb`/`geq` در ffmpeg هر پیکسل را با عبارت حساب می‌کند و کند است. |
| **پوستریزه** | کوانتیزه کردن کانال‌ها *در زمان کشیدن* (`r = round(r/64)*64`) — یعنی در همان draw اصلی، بدون پاس اضافه؛ در ffmpeg مجبور به پاس دوم هستیم. |
| **درخشش (glow)** | `ctx.shadowColor` + `ctx.shadowBlur` روی همان draw (کامپوزیتور GPU) یا دو بار draw با `lighter` روی نسخهٔ بلورشده — ارزان‌تر از `gblur`+`unsharp`. |

قاعدهٔ کلی برای PF kit: **افکت‌های «زمینه»** (گرین، نشت نور، وینیت، هالتون) را سمت مرورگر بگذارید و متن/لوگو را **بعد** از آن‌ها رویه کنید؛ آن‌وقت لبه‌های فارسی تمیز می‌مانند و ffmpeg فقط encoding + xfade انجام می‌دهد.

---

## ۵) خطاها / ناموفقیت‌های API و راستی‌آزمایی

| # | مورد | نتیجهٔ واقعی |
|---|---|---|
| 1 | `rotate=0.02*sin(PI*T/3)` | **exit=-22** → `Undefined constant or missing '(' in 'T/3)'`. فیلتر rotate فقط `t` دارد. درست: `t` |
| 2 | `crop=iw/1.1:ih/1.1` | **exit=-22** (مقدار کسری) — نیاز به `trunc()` |
| 3 | `lutrgb` با `X`/`Y` | **exit=-22** → `Undefined constant ... 'Y,2),1),255,val*0.35+128)'`. lutrgb فقط `val` دارد ⇒ دیتر مرتب با lutrgb **غیرممکن** |
| 4 | `geq` با `val` | **exit=-22** → `Undefined constant ... 'val*0.3+100)'`. در geq از `lum(X,Y)`/`r(X,Y)` استفاده کنید، نه `val` |
| 5 | `geq` روی `rgb24` | **exit=-22** → `Error initializing filters`. geq فقط فرمت‌های planar (gbrp/yuv*) را می‌پذیرد؛ `format=gbrp` لازم است |
| 6 | `lutyuv=y=1:u=1:v=1` به‌عنوان پوستریزه | exit=0 ولی **اشتباه مفهومی**: خروجی تخت ۳٬۴۱۵ بایتی، نه پوستریزه |
| 7 | `rgbashift` روی PNG (rgb24) | برخلاف انتظار **بدون format=rgba هم کار کرد** (exit=0، خروجی برابر با نسخهٔ rgba) |
| 8 | `displace` با زنجیرهٔ دوم | تست harness نتوانست `-filter_complex` را درست پاس بدهد (خطای Option not found) → **UNVERIFIED**؛ خودِ فیلتر در `-filters` موجود است |
| 9 | `chromaber` | روی این بیلد **غایب** (با وجود وجودش در upstream 7.1) → CA با `rgbashift`/`chromashift` |
| 10 | `frei0r` / `vulkan` / `bgblur` / اسکن‌لاین | همگی **غایب** روی این بیلد |
| 11 | `noise` پرچم‌ها | فقط `t` (temporal/flicker) و `u` (uniform/static) — برچسب «temporal-stable» در دستور اولیه **برعکس** بود |
| 12 | `tblend` | یک فریم مصرف می‌کند (۵۹ فریم خروجی از ۶۰) — در مونتاژ ۳۰fps زمان‌بندی را جابه‌جا می‌کند |
| 13 | هزینهٔ `geq` | هر پیکسل با عبارت حساب می‌شود؛ برای ۱۰۸۰x۱۹۲۰ گران — فقط برای بازبینی، نه خط تولید |

### پیشنهاد برای PF kit
خط تولید ffmpeg را به این سه چیز محدود کنید: `scale=1080:1920` → (اختیاری) `vignette`/`eq` سبک → `xfade` → `libx264 -pix_fmt yuv420p -r 30`.
بافت‌ها (گرین/نویز/هالتون/CA/پوستریزه) را سمت مرورگر بسازید تا متن فارسی لبه‌اش سالم بماند و زمان رندر کم شود.
