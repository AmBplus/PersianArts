# بررسی عمیق ریپوهای موشن-اسکیل — داده‌های دقیق

تاریخ: 2026-10-19 · روش: GitHub API + `raw.githubusercontent`؛ هر عدد از پاسخ واقعی API یا محاسبهٔ محلی روی فایل‌های دانلودشده.
پیش‌درآمد: گزارش سطح‌بالا در [SKILLS-RESEARCH-2026-10-19.md](SKILLS-RESEARCH-2026-10-19.md) است؛ این سند دادهٔ خام و دقیق هر ریپو را می‌دهد.

---

## ۱. Mort1d/motion-graphics-skills — کامل‌ترین موتور

**هویت:** ★۵۸ · MIT · آخرین پوش 2026-09-30 · ۱۰۴ فایل · یک skill (`skills/motion-graphics/`)

**آناتومی فایل (اندازه‌ها بایت):**

| بخش | اندازه | توضیح |
|---|---|---|
| `SKILL.md` | 35,302 | 447 خط، 5,934 واژه |
| `references/*.md` (۱۰ فایل) | 27,880 مجموع | pipeline 22.9k، scene-cookbook 22k، sound-design 25.7k، story-and-motion 17.6k، footage 16.4k، genre-cards 16.6k، direction 14.7k، synth-api 10.8k، look-cards 9.8k، wow-library 6.6k |
| `assets/template/tools/*.mjs` (۱۱ ابزار) | ~126,000 | capture 27.5k، sound-print 34k، qa 16k، footage 17.8k، plan-check 11.2k، audio-check 11.9k، render 10.9k، … |
| `assets/template/audio/synth/*.mjs` (۹ فایل) | ~104,000 | سینتی‌سایزر کامل: tonal 26.6k، mix 21.8k، fx 17.9k، drums 12.4k، core 13.1k، theory 7.4k |
| `assets/template/js/*` | ~80,000 | engine.js 13.4k، screen.js 19.4k، kit.js 10.1k، main.js 11.4k، timeline/captions/footage/scenes |
| `scripts/*` (۶ اسکریپت پروژه‌ساز) | ~120,000 | site-kit 57.3k، ref-sheet 23.7k، trace-logo 10.8k، ui-shot 10.9k، palette 6.4k، new-project 5.8k |
| `evals/evals.json` | 4,252 | سناریوهای ارزیابی |
| فونت‌های همراه | 1MB+ | Montserrat Bold/Black/BlackItalic، JetBrainsMono |

جمع: ~۵۰۰KB متن + کد، همه در یک skill با مرجع‌های بیرونی.

**قرارداد فریم (چیزی که ما نداریم) — نقل مستقیم:**

> «a frame depends only on `t`: no CSS animations or transitions, no `Date`, `Math.random` or timers, no `<video>`; text that changes … is computed from the frame's own time, `frame / FPS`»

و ابزار سنجشش:

```bash
node tools/capture.mjs verify    # renders the same frames forward, backward and shuffled
                                 # and fails anything that is not a function of t
```

این تنها نمونهٔ دیده‌شدهٔ «تست determinism» به‌شکل اجرایی است.

**قواعد عددی در بخش Quality bar:**

- حرکت در ≥۷۵٪ فریم‌ها؛ ۵۵–۹۰ «ضربهٔ بصری» در دقیقه (کتابخانهٔ مرجعش: ۶۷–۱۰۰٪ فریم متحرک، ۴۵–۹۱ ضربه در دقیقه در `wow-library.md` §1)
- متن ≥۲۶px در 1080p؛ وایپ ≥۰٫۳s؛ end card ≥۲٫۵s
- خروجی: 1920×1080 یا فرمت انتخابی، **60fps**، H.264+AAC، **−14 LUFS**، true peak ≤ −1 dBTP
- صدا: `unique` < 0.75 در برابر دمو و پروژه‌های قبلی همان پوشه؛ FAIL روی دمو، WARN در ≥۰٫۷۵
- هر فیلم باید «سه کاندید مفهوم» داشته باشد و یکی انتخاب شود

**حلقهٔ نقد (مرحلهٔ ۷):**

```bash
node tools/capture.mjs review   # out/review/: یک فریم per beat، نمای موبایل 360px، strip روی حرکت‌های سریع
node tools/render.mjs --draft   # نیم‌اندازه، بدون motion blur، با صدا
```
نمره ۱–۱۰ روی: هوک ۲ ثانیهٔ اول · خوانایی در اندازهٔ موبایل · موشن (spring، بدون فریم مرده) · تنوع (چیز نو هر ۲–۴ ثانیه) · ترکیب‌بندی (یک قهرمان، پر بودن کادر) · دقت برند/داده · سینک صدا → «write a one-line verdict, the scores and the three worst problems with their times and evidence in `REVIEW.md` … until every score is 8 or more».

**فهرست «Traps (each one cost a real project time)»** — از جمله: هر چیز غیرتابعی از `t` (CSS transition، `Date.now()`، تایمر، `Math.random()`، `<video>`) باعث می‌شود chunkها به هم نچسبند و motion blur لکه شود؛ و «پیش‌فرض صدا»: house ۱۲۰–۱۲۸ با کیک روی هر ضرب در A minor — «Left alone, every model writes it for every brief».

**جدول مرجع‌ها (الگوی routing با ستون Skip):** ۱۰ فایل، هر کدام «کِی بخوان / کِی رد کن».

**درس برای ما:** این ریپو «موشن واقعی» می‌سازد چون (الف) قرارداد فریم دارد، (ب) سه metric کمی دارد که خودش می‌سنجد (حرکت در فریم، ضربه در دقیقه، یکتایی صدا)، (ج) در هر مرحله artifact می‌سازد (`sheet.png`, `stills/`, `out/qa/*.png`, `REVIEW.md`)، (د) صدا را کد می‌کند تا روی همان grid بیت بنشیند.

---

## ۲. bangtutorial/bang-motion — دقیق‌ترین «تست ضد-PPT»

**هویت:** ★۶۵۷ · MIT · آخرین پوش 2026-09-15 · ۵۳ فایل · زبان SKILL.md: اندونزیایی

**آناتومی:** `SKILL.md` 39,343 بایت / 551 خط · `references/techniques.md` 44,953 · `references/opener-konsep.md` 58,022 · `references/explainer.md` 34,066 · `references/anti-ppt.md` 11,453 · `references/architecture.md` 7,663 · ۷ استارتر HTML (17–34KB، مثلاً `starter-opener.html` 30.6KB) · گالری ۱۲ تصویر سبک (۰۱–۱۲) · اسکریپت‌ها: `snap.mjs` 3,086 (puppeteer contact sheet)، `export-frames.mjs` 2,677، `vo-pauses.html` 4,793 (جایگزین ffmpeg silencedetect در مرورگر)، `serve.py`، و bridge افترافکت (`aset-svg.py`, `rig-tokoh.py`, `svg2png.cjs`).

**بخش طلایی: «Larangan struktural — uji PPT yang bisa diperiksa mekanis»** (۸ تست، با دستور و آستانه):

1. `grep -c "class=\"scene\"\|<section" index.html` — اگر ≥۳ صحنه `<section>` که با `autoAlpha`/`opacity` روشن-خاموش می‌شوند → slide deck. صحنه باید به‌خاطر حرکت **دنیا/دوربین** عوض شود، نه fade سکشن. استثنای مجاز: کارتون صحنه‌ای با cut/جابه‌جایی ۹۶px.
2. باید رشتهٔ بصری پیوسته باشد (یک سوژه یا یک دنیای کلاژ که دوربین traverses می‌کند). «عکس full-bleed که پشت‌سرهم عوض شود + یک جمله در هر صحنه → همچنان slideshow، حتی اگر دوربین حرکت کند». هر صحنه ۳–۵ عنصر که مرحله‌به‌مرحله وارد شوند.
3. شمارش سطوح متن در هر صحنه: eyebrow + تیتر + بدنه = ۳ سطح → PPT. حداکثر دو سطح.
4. Ken Burns (scale 1.0→1.05) به‌عنوان تنها حرکت → PPT. حرکت هر ثانیه باید از «زبان حرکت پس‌زمینه» بیاید (۱۰+ گزینه در `techniques.md` §7c). و: نوار/خط/استریک افقی در دو پروژهٔ پشت‌سرهم ممنوع.
5. اگر همهٔ transition‌ها fade + scale bump + light leak باشند → قالب PPT.
6. explainer باید از استارتر همان سبک شروع شود، نه از صفر و نه از استارتر opener.
7. **زوم < ۱٫۰۸ → PPT** («خانه به اندازهٔ شست، نیم صفحه زمین خالی»).
8. اسکلت قالب: تیتر بزرگ که به چپ خارج می‌شود، سه tile هم‌ردیف، input که تایپ می‌شود، ترتیب hook→feature→feature→promise→logo→CTA — دو مورد یا بیشتر = قالب، «walau kulitnya baru».

«Gagal satu poin saja → rombak sebelum ditunjukkan ke user.»

**قانون ۲ — Determinisme:** «Tidak ada satu baris pun yang membaca jam sistem»؛ همه چیز تابع `tl.time()`؛ لرزش دوربین با سینوس فرکانس بالا نه `Math.random()`.

**قانون ۳ — سبک از موضوع می‌آید، نه از استارتر:** style brief شش‌خطی قبل از کد، شامل سه کاندید مفهوم، پالت با hex **و منبع هر رنگ**، فونت display غیر از Poppins/Inter/Roboto/Montserrat/Arial.

**چک‌لیست پیش از تحویل: ۸۸ مورد** (خطوط ۳۹۱–۵۰۳) — از جمله: «حداقل سه مورد از پالت/فونت/زبان پس‌زمینه/امضای حرکت باید با opener قبلی متفاوت باشد»؛ «روشنایی پس‌زمینه زیر متن ≤۲۵٪ یا ≥۸۰٪، تست grayscale»؛ «صفر استفاده از `Date.now()`/`Math.random()` در مسیر رندر»؛ «متن ≥۳۰px در 1080 (بدنه ≥۴۴، برچسب ≥۳۴)»؛ «تابع اعداد متغیر: `font-variant-numeric: tabular-nums` + `min-width`»؛ «`index.html` با دوبار کلیک و `file://` باز شود».

**راهکار محیط بدون ابزار:** جدول «با ffmpeg / بدون ffmpeg» — بدون ffmpeg هم صدای VO را با `vo-pauses.html` (Web Audio) سگمنت می‌کند؛ و «Jangan pernah membuat deliverable yang butuh `npm install` untuk DITONTON».

**درس برای ما:** تست‌ها با **دستور shell** نوشته شده‌اند (`grep -c`)، نه با صفت. این بالاترین نسبت «قابل اجرا / کلمه» در همهٔ ریپوهاست.

---

## ۳. Tejashmakwana/motionmaxxing — مهندسی‌شده‌ترین گیت‌ها

**هویت:** ★۹۰۰ · Apache-2.0 · آخرین پوش 2026-10-06 · ۱۳۵ فایل

**آناتومی:** `SKILL.md` 3,199 واژه · `references/` ۱۴ فایل ≈ ۴۵۰KB: `slop.md` 60.7k، `ui-demo.md` 49.2k، `motion.md` 45.1k، `transitions.md` 40.7k، `director.md` 40.8k، `type.md` 40.3k، `layout.md` 33.8k، `brand.md` 30.2k، `sound-sync.md` 30k، `close.md` 28.1k، `judgment.md` 18.5k، `idea.md` 13.8k، `world.md` 12.1k، `tools.md` 9.1k · `scripts/` ۱۳ اسکریپت شامل `look.py` 30.8k، `lint.mjs` 31.8k، `brand.mjs` 78.2k، `voice.py` 40.7k، `blind_review.py` 19.9k، `mix.py` 16.1k، `render.mjs` 18.5k · `runtime/` (hero3d/vendor/three.core.js 1.4MB، fonts، native-ui) · `examples/` (3d-hero، demo، phone، selftest) · `docs/media/` مقایسه‌های GIF/MP4 (spotify، cluely، wispr).

**گیت‌ها با جزئیات دقیق:**

| Gate | شرط | ابزار |
|---|---|---|
| G0 | decode می‌شود، سیاه نیست، تصویر حرکت دارد، طول = پلن (`--expect S`)، صدا هست و سایلنت نیست (`--expect-audio`) | `look.py` → `look/gates.json` |
| G1 | متن UI ≥ 0.04H؛ fragment ≥ 0.55W یا توسط لبهٔ کادر بریده؛ روشن، در یک دنیا؛ دوربین زوم کرده | چشمی روی `look/sheet.jpg` |
| G2 | بیش از ۳ فریم تخت پشت‌سرهم نباشد (افت ≤۳ فریم داخل یک شیرجه نادیده) | `look.py` |
| G3 | هولد پایانی ≤۱٫۴s (هولد حل‌شده ۰٫۶–۱٫۴s؛ <۰٫۶ = یادداشت)؛ شات آخر ≤۲۵٪ فیلم | `look.py --hold-warn 1.4` |
| G4 | یک قهرمان در هر فریم (دو پنل فقط اگر یکی ≥۲× دیگری باشد) | چشمی |
| G5 | بدون page chrome: C1..C4، C6، C7، D1، P1، T1، V1–V5 | `lint.mjs` → `GATE G5: FAIL` = exit 1 |

و `blind_review.py` (۱۹٫۹KB) برای داوری کور.

**فلسفه (نقل):** «judgment decides WHAT; the craft laws decide HOW» + پوشهٔ `taste/verdicts.md` و `taste/edits.md` = ردها و اصلاح‌های همان کاربر.

«Never ship» با ۱۲ مورد و مثال شکست واقعی («A 15 s black render was once certified VERIFIED / CLEAN»).

**درس برای ما:** تفکیک «قانون» (عددی/اسکریپتی) از «سلیقه» (چشمی، ولی ثبت‌شده) + ممنوعیت self-certification.

---

## ۴. Vincentwei1021/video-shotcraft — کارت‌های رسپی و routing

**هویت:** ★۱۲٬۵۱۷ · Apache-2.0 · آخرین پوش 2026-10-17 · ۱٬۶۵۱ فایل · ۲۷۹ فایل `.md`

**کارت‌ها:** `references/shots/<category>/<name>.md` — **۱۲۵ کارت**:

| دسته | تعداد |
|---|---|
| typography | 22 |
| ui-entrance | 21 |
| effects | 15 |
| transition | 15 |
| interaction | 11 |
| opening | 11 |
| camera | 10 |
| rhythm | 8 |
| outro | 6 |
| data | 5 |

هر کارت ۳–۶KB. **ساختار کارت (نمونهٔ واقعی `ui-entrance/card-stack.md`):**

```yaml
---
name: card-stack
一句话: 一组模板卡（demo 9 张）从屏幕下方逐张 spring 弹入、越落越快叠成一摞 …
适用: 需要交代"我们有一组东西"的产品段落；卡片墙/模板库/方案列表的建立镜头
时长: 约 5.0s（150f@30fps）
能量: 中高（入场是连续小爆发，展开段收成一次平滑的整体动作）
---
```
سپس: `## 意图` (چرا این ترتیب) → `## 动效核心` (فریم‌به‌فریم: `springAt(f, start, {damping:13, stiffness:150})`، `y 820→0`، `transform-origin: 50% 130%`، `k*6.5°`, `k*138px`, `zIndex=i`) → `## 参数表` (جدول «پارامتر | مقدار معمول | حس تنظیم»: «>11 کارت باید زاویه را به 4–5° کم کنی وگرنه کارت‌های انتهایی از کادر بیرون می‌زنند»، «damping >26 بدون overshoot خوانده می‌شود مکانیکی») → `## 已知坑` (پیتفال‌های عددی) → `## 参考实现` (مسیر دمو: `demos/ui-entrance/card-stack/`).

**routing:** جدول `## 何时读哪个文件` با ۱۳ ردیف «时机 | کدام فایل» (شروع پروژه، خلق آزاد، هم‌ساخت، BGM داده‌شده، تمپلیت، استوری‌بورد، پیاده‌سازی شات، صدا، **پذیرش با subagent مستقل**، …).

**درس برای ما:** واحد دانش = کارت با «جدول پارامتر + حس تنظیم». این چیزی است که مدل را از حدس‌زدن نجات می‌دهد.

---

## ۵. Vincentwei1021/video-talkcraft — ۱۰۸ کارت + ضد-PPT هفت‌لایه

**هویت:** ★۱٬۶۵۹ · آخرین پوش 2026-10-12 · ۱٬۰۷۶ فایل

- `demos/` = **۲۶۳ پوشهٔ دمو** (هر کارت یک دموی قابل پخش + `tsx` خودبسنده؛ مثلاً `chart-grow`, `caret-wipe-transition`, `chapter-progress-list`, `black-slam-transition`, `behind-text-title`)
- `gallery/index.html` 2.87MB + ۱۰۹ thumbnail → گالری همهٔ کارت‌ها
- `demos/_lib/sfx-samples.js` 1.76MB (نمونه‌های صدا در کد)
- جریان: «口播稿 → 配音 → 字级时间戳 (CPU) → SHOTBOOK 层矩阵分镜 → 自动静止检测 → independent subagent 评估循环»
- SKILL.md سه بخش دارد: «动效配方卡 108 张 + demo + tsx»، «镜头: 七层模型反 PPT 系统»، «视觉语言: Apple 范式默认版»

**درس برای ما:** دموی قابل پخش برای هر کارت + گالری زنده = راه اینکه مدل «ببیند» چه چیزی ممکن است.

---

## ۶. howseen-ai/claude-motion-design — بهترین «Gotchas»

**هویت:** ★۵۹۲ · MIT · آخرین پوش 2026-10-04 · ۳۱ فایل · `SKILL.md` 33,895 بایت (5,069 واژه)

- `examples/howseen-launch/` : `film.html` 28.4KB + `preview.gif` 4.2MB + `render.py` — **نمونهٔ کامل همراه skill**
- `skill/motion-design/scripts/remake/core.js` 9.4KB، `render_template.py` 8.1KB

**بخش ۸ (Critique loop) با دستورهای واقعی:**

```bash
ffmpeg -i out/final.mp4 -vf "fps=2,scale=270:-1,tile=6x5" -frames:v 1 out/contact.png
ffmpeg -ss <t-0.1> -i out/final.mp4 -vf "scale=320:-1,tile=12x1" -frames:v 1 out/strip.png
ffmpeg -i out/final.mp4 -vf "fps=1,scale=360:-1,tile=5x3" -frames:v 1 out/phone.png
ffmpeg -stream_loop 1 -i out/final.mp4 -c copy out/loop_check.mp4
```
نمره ۱–۱۰ روی ۷ محور، ثبت سه ایراد با timestamp، «Repeat until every score is 8+. Be a harsh motion director, not a proud author.»

**Presetهای عددی:** spring `(k,d)`: UI سریع 320/30 · کانتینر/دوربین 170/26 · تایپ و لوگوی سنگین 120/24 · مسکات 180/12 — و «Leading and trailing edges of a stretching indicator on different springs».

**بخش ۶ Gotchas (همه واقعی):** خطای bisection در easing که ~1e-9 برمی‌گرداند و گارد `if (e > 0)` زود شلیک می‌کند («a whole dive disc appeared 2 s early»)؛ logo reveal با squash عمودی `scaleY 0.014 → 1`؛ ممنوعیت crossfade لنز رسم‌شده با PNG؛ اندازه‌های پلتفرم (LinkedIn 4:5 1080×1350، X 16:9/1:1 ≤2:20).

**درس برای ما:** هر باگ واقعی → یک خط Gotcha با راه‌حل. و presetهای عددی جای صفت‌ها.

---

## ۷. nateherkai/herk-edit-kit — معماری چند-عاملی

**هویت:** ★۱٬۸۵۲ · آخرین پوش 2026-10-14 · ۱٬۲۳۱ فایل · **۱۵ skill × ۲ mirror** (`.claude/skills/` و `.agents/skills/`) = ۳۰ `SKILL.md` · `.codex/` هم دارد

**اسکیل‌ها:** `cut-mistakes`، `cut-silences`، `edit-video`، `gsap`، `hyperframes`، `hyperframes-cli`، `hyperframes-registry`، `hyperframes-video-beats`، `make-a-video`، `motion-showreel`، `short-form-edit`، `short-form-video`، `style-library`، `video-storytelling`، `website-to-hyperframes`.

**ویژگی‌ها:**
- هر agent یک artifact می‌دهد؛ `cut-mistakes` با `scripts/find-cut-candidates.mjs` (8.3KB) کاندیدها را می‌سازد و `apply-cuts.mjs` (8.8KB) فقط برش‌های تأییدشده را اعمال می‌کند: «review-gated … renders only the approved cuts».
- مرز مسئولیت نوشته شده: `cut-silences` «does NOT cut mistakes, repeats, or false starts — that is the cut-mistakes agent».
- `make-a-video`: «Two phases, eight sequential gates. Every gate produces a concrete artifact the next gate consumes. Don't skip gates.»
- `style-library`: `registry.json` + `GUIDE.md` برای انتخاب سبک؛ `hyperframes-registry`: `references/install-locations.md`, `wiring-blocks.md`, `wiring-components.md`
- `gsap/scripts/extract-audio-data.py` (6.5KB) + `references/effects.md` (8.8KB)

**درس برای ما:** «هر gate یک artifact ملموس» + «هر agent یک مسئولیت و صراحتاً نه-مسئولیت».

---

## ۸. remotion-dev/skills — آناتومی رسمی

**هویت:** ★۵٬۳۸۵ · آخرین پوش 2026-10-19 · ۴۳۰ فایل · **۱۲ skill**

الگو: هر skill = پوشه با `SKILL.md` + زیرپوشه‌های موضوعی که هرکدام `REFERENCE.md` و `agents/openai.yaml` دارند:

```
skills/remotion-best-practices/SKILL.md          (596 واژه، description: «Router for all Remotion skills»)
skills/remotion-best-practices/remotion-captions/REFERENCE.md
skills/remotion-best-practices/remotion-captions/display-captions.md
skills/remotion-best-practices/remotion-captions/import-srt-captions.md
skills/remotion-best-practices/remotion-captions/transcribe-captions.md
skills/remotion-best-practices/remotion-create/REFERENCE.md + tailwind.md + video-layout.md
skills/remotion-maps/techniques/maplibre/TECHNIQUE.md   (13.8KB)
scripts/sync-agent-skills.ts · sync-embedded-skills.ts · sync-readme.ts · validate-links.ts
```
`version: 4.0.537` در frontmatter (همگام با نسخهٔ محصول) و `NOTICE.txt` برای اسکیل‌های وام‌گرفته‌شده.

**درس برای ما:** router نازک + موضوع‌های جدا + اسکریپت validation لینک‌ها + هم‌نسخه‌سازی خودکار با چند هارنس.

---

## ۹. charlie947/motion-graphics-skills — بهترین «brief → build → check → export»

**هویت:** ★۳۴۶ · MIT · آخرین پوش 2026-10-11 · ۵۶ فایل · **۱۵ skill مستقل**

اندازه‌ها: `motion-effects/SKILL.md` 1,549 واژه + `references/effects.md` 17.2KB؛ `vox-explainer` 1,051؛ `brand-intake` 864؛ `motion-prompt-writer` 856؛ `launch-video` 790؛ `apple-launch-film` 741؛ بقیه ۴۴۰–۷۰۰ واژه. میانگین ≈۷۲۰ واژه.

**الگوهای تکرارشونده در همهٔ ۱۵ فایل:**
- `## Step 1: Ask for five things, then wait` (نقطهٔ توقف اجباری)
- `## What I learned the hard way` / `## What "premium" means here (learned the hard way)` / `## Review rules (from the rounds that got rejected)`
- `## What this skill will not do`
- `brand-intake` دو فایل می‌سازد: `brand.md` و `MOTION.md` **و یک قاعده در `CLAUDE.md`** تا بقیهٔ skillها قبل از انیمیت کردن آن‌ها را بخوانند.
- `loop-cover`: «the seam is measured, not eyeballed» — 896×640، 180 فریم 20fps.
- `motion-brief-writer`: «keeps real results apart from sample data, and never invents a figure».

**درس برای ما:** ۱۵ کار کوچک بهتر از یک کار بزرگ؛ و «اول ۱۰ ثانیه را در دو-سه سبک بساز، یکی را انتخاب کن، بعد بقیه را بساز».

---

## ۱۰. lemomo-ai/lemo-opuscar — کتابخانهٔ سبک

**هویت:** ★۳٬۷۲۰ · MIT · آخرین پوش 2026-10-19 · ۲٬۵۰۶ فایل · دو `SKILL.md` (نسخهٔ plugin با `library/` محلی و نسخهٔ tools با fetch)

- `core/` ۵۸ فایل: `assets/polyhaven/*` (بافت‌های واقعی)، `audio`, `fonts`, `post`, `render`, `three`, `tts`
- `styles/` — هر سبک یک پوشه با `demo/stills/styleframe.jpg` و `demo/data/model.json` (مثلاً `styles/risograph/poster.jpg`، `styles/woodcut/demo/stills/modelsheet_v1.jpg`)
- `docs/frames/` فریم‌های مرجع

**درس برای ما:** سبک = دارایی قابل انتخاب (استایل‌فریم + مدل + دمو)، نه توصیف متنی.

---

## ۱۱. Kianzzz/xilo-opus-video — کم‌حجم‌ترین جریان درست

**هویت:** ★۲۰۶ · MIT · ۲۰ فایل · `SKILL.md` 10,171 بایت

جریان اجباری: سه پلن → پریویوی هر پلن (`examples/plan-a-ui.png`, `plan-b-pixel-crt.png`, `plan-c-one-line-sheet.png`) → `brief.md` → ساخت → رندر/پذیرش. `references/craft-rules.md` 7.5KB + `references/code-stack.md` 4.5KB + `scripts/audio_tools.py` 8.9KB.

**درس برای ما:** تأیید تصویری قبل از کد؛ سه گزینهٔ متمایز به‌جای یک پیش‌فرض.

---

## ۱۲. atmirrr/persian-motion-director — تنها مرجع فارسی (فقط مطالعه؛ policy ما اجازهٔ استفاده نمی‌دهد)

**هویت:** ★۱۴۶ · ۷۴ فایل · `SKILL.md` 1,498 واژه

بخش‌ها: `## The director's loop` · `## What separates pro motion from a slideshow` · `## Persian non-negotiables` · `## Technique library` · `## Tools in this skill`.
دارایی‌ها: `assets/remotion/public/music/shur-pulse.mp3` (2.6MB)، `whooshes.mp3`، `assets/sketches/`، `references/techniques/`، ۶ GIF دمو (`01-oner`, `02-match`, `03-ui`, `04-beat`, `05-boil`, `06-cutout`).
تشخیص مشکل در دیباچه: «Most generated motion fails in two predictable ways: it plays like a slideshow (scenes that fade into each other, one ease-in-out on everything, everything arriving at once), and its Persian is broken (letters split apart, dots clipped, Arabic letters and digits, missing half-spaces, left-to-right reveals)». روشش را از توصیف موشن‌دیزاینرها در X و قواعد فارسی را از W3C Arabic & Persian Layout Requirements گرفته.

**درس برای ما:** همان جملهٔ «one ease-in-out on everything, everything arriving at once» دقیقاً توصیف خروجی فعلی ماست.

---

## ۱۳. iart-ai/motion-skills — tiered verify toolkit

**هویت:** ★۹۰۳ · MIT · ۱۱ فایل (محتوا در ۱۸ pack جدا) · ادعا: ۵۵ skill

**سه اسکریپت verify (کوچک، دقیق):**

| اسکریپت | tier | کار |
|---|---|---|
| `tools/verify/seek-shot.sh` | Light (HTML مستقل) | از هارنس `?t=N` صفحه استفاده می‌کند: `tl.pause(); tl.seek(t)` → اسکرین‌شات در زمان‌های داده‌شده |
| `tools/verify/contact-sheet.sh` | هر tier | کاشی‌کردن فریم‌ها (start \| mid \| end) در یک تصویر |
| `tools/verify/probe-mp4.sh` | Heavy (Remotion/Manim) | خواندن و **assert** مشخصات واقعی MP4: resolution، codec، fps با تلورانس ۰٫۵، duration؛ «Renders lie; the file doesn't» |

**درس برای ما:** حداقل ابزار، با tier مشخص (Light/Heavy) و assert واقعی روی فایل تحویلی.

---

## ۱۴. Vincentwei1021/anything2explainer و calesthio/OpenMontage

- **anything2explainer** ★۲٬۶۱۹ · ۲۴۲ فایل: `template/` کامل با فونت‌ها (`NotoSansSC.ttf` 17.8MB)، `examples/rag/frames/overview_*.jpg` (فریم‌های مرجع) + `examples/contrast/contrast_sheet.jpg`؛ SKILL.md می‌گوید اول فریم‌های مرجع را ببین و «ملاک» بساز، بعد ۴ نقطهٔ تأیید.
- **OpenMontage** ★۶۹٬۸۷۶ · AGPLv3 · README 42.9KB با ادعای «first open-source, agentic video production system»، ۱۲ خط پروداکشن، ۱۰۰+ tool، ۷۰۰+ skill، سایت openmontage.video، mascot، GitHub Trending #1. لایسنس AGPL → استفادهٔ مستقیم برای ما پرهیز.

---

## ۱۵. جمع‌بندی کمی مقایسه‌ای

| ریپو | ★ | SKILL.md (واژه) | referenceها | کارت/دمو | اسکریپت | گیت اجرایی | حلقهٔ دیدن فریم |
|---|---|---|---|---|---|---|---|
| Mort1d | 58 | 5,934 | ۱۰ (۲۸KB متنی فشرده + ۲۲.۹k pipeline) | cookbook | ۲۶ فایل/~۲۵۰KB | ✅ (plan-check, qa, audio-check, verify) | ✅ review + sheet |
| bang-motion | 657 | 5,556 | ۷ (۱۹۴KB) | ۷ استارتر + ۱۲ گالری | ۹ | ✅ (۸ تست greppable) | ✅ snap.mjs |
| motionmaxxing | 900 | 3,199 | ۱۴ (~۴۵۰KB) | ۵۳ بازسازی | ۱۳ | ✅ G0–G5 | ✅ look/sheet + blind_review |
| shotcraft | 12,517 | 887 | ۱۲۵ کارت | ۱۲۵ | ✅ | ✅ final-review با subagent | ✅ |
| talkcraft | 1,659 | 3,424 | کارت‌ها | ۲۶۳ دمو + گالری | ✅ | ✅ auto static detect | ✅ subagent eval |
| howseen | 592 | 5,069 | ۱ skill | ۱ نمونهٔ کامل | ۲ | بخشی | ✅ contact/strip/phone |
| herk | 1,852 | ۱۵ skill (~۸۰۰ میانگین) | ۴۰۶ کارت | ۱۵ mirror | ۳۰+ | ✅ ۸ gate در ۲ فاز | ✅ |
| remotion-dev | 5,385 | ۱۲ skill (۸۸–۱,۵۹۴) | TECHNIQUE.md | — | ۴ sync/validate | بخشی | ✅ remotion still |
| charlie947 | 346 | ۱۵ skill (~۷۲۰) | effects.md | دمو GIF | کم | ✅ review rules | ✅ |
| **persian-arts (ما)** | — | ۱۳۵ خط (۱ skill + ۹ craft child) | motion.md ۱۳۱ خط | **۲۳۰ کارت ساختاریافته** (`work/persian/tools/cards/cards.json`: id/category/beats/transitionOverlapFrames/poster) — ولی **بدون جدول پارامتر و بدون دموی پخش‌شدنی** | **۲۵ gate** (craft-common، dead-frames، black-bands، scene-variety، light-model، material-flatness، hud-anchor، overlay-hud، text-envelope، text-collision، token-check، kit-usage، …) | **بدون آستانهٔ motion (نه درصد فریم متحرک، نه ضربه/دقیقه)** | **❌** |

**سه شکاف اصلی ما:** (۱) نمونه/استارتر/دموی همراه skill — هیچ ریپوی موفقی ندارد «صفر نمونه»؛ (۲) کارت رسپی با جدول پارامتر؛ (۳) حلقهٔ دیدن فریم — contact sheet + نمره‌دهی، که در ۹ ریپو از ۱۰ وجود دارد.

---

## ۱۶. ده اقدام با اولویت

| # | اقدام | مقصد | الگوی منبع |
|---|---|---|---|
| ۱ | contact-sheet + strip + phone-width + نمره‌دهی ۸+ | `work/persian/tools/qc/contact.mjs` | howseen §8، Mort1d مرحلهٔ ۷ |
| ۲ | gate «فریم متحرک»: ≥۷۵٪ فریم و ۵۵–۹۰ ضربه/دقیقه | `tools/gates/ref-sheet.mjs` | Mort1d `ref-sheet.mjs` |
| ۳ | تست determinism (فریم رو به جلو/عقب/شِفل) | `tools/gates/verify-frames.mjs` | Mort1d `capture.mjs verify`، bang قانون ۲ |
| ۴ | ۸ تست ضد-PPT با دستور و آستانه | `references/motion-anti.md` | bang-motion بخش «Larangan struktural» |
| ۵ | کارت رسپی: frontmatter + جدول پارامتر + پیتفال + مسیر دمو | `references/cards/*.md` | shotcraft ۱۲۵ کارت |
| ۶ | استارتر HTML برای هر سبک (۳–۵ فایل) | `work/persian/htmlfilm/starters/` | bang-motion ۷ استارتر |
| ۷ | `probe-mp4.sh` با assert res/fps/codec/duration | `tools/verify/probe-mp4.sh` | iart-ai |
| ۸ | «Never ship» با مثال شکست خودمان | `references/motion-anti.md` | motionmaxxing |
| ۹ | spring presets عددی + جدول «حس تنظیم» | `work/persian/htmlfilm/lib/pa-film.js` | howseen §9، shotcraft کارت‌ها |
| ۱۰ | گام «۳ کاندید + پریویو + تأیید» پیش از کد | `SKILL.md` | charlie947، bang قانون ۳، xilo |
