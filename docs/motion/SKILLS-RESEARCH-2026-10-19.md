# گزارش: اسکیل‌های موشن‌گرافیک در گیت‌هاب — چطور نوشته شده‌اند و چه چیزی باید یاد بگیریم

تاریخ: 2026-10-19 · روش: GitHub API (۱۵ ریپو) + `raw.githubusercontent` برای ۶۸ فایل `SKILL.md`
هدف: فهمیدن اینکه skillهای موشن چطور نوشته می‌شوند و چرا خروجی آن‌ها «فیلم» است نه «اسلاید» — و تبدیلش به اقدام برای `persian-arts`.

---

## ۰. خلاصه اجرایی

۱۰ الگوی تکرارشونده بین ریپوهای موفق پیدا شد. سه‌تای اول تفاوت واقعی را می‌سازند و هر سه در skill ما غایب‌اند:

1. **Gate عددی با اسکریپت**، نه فهرست صفت. قوی‌ترین نمونه: `motionmaxxing` با ۶ گیت G0–G5 و اسکریپت‌های `look.py` / `lint.mjs` که `exit 1` می‌دهند.
2. **حلقه نقد اجباری**: مدل باید فریم‌های خودش را ببیند و ۱–۱۰ امتیاز بدهد تا هر امتیاز ۸+ شود (`howseen`, `Mort1d`).
3. **حافظهٔ ردها**: هر skill یک بخش «چه چیزی را با سختی یاد گرفتم» / «Never ship» دارد؛ ردها به قانون تبدیل شده‌اند، نه به prose.

---

## ۱. ریپوهای بررسی‌شده (ستاره و آخرین پوش، 2026-10-19)

| ریپو | ★ | فایل | SKILL.md | لایسنس | نقش |
|---|---|---|---|---|---|
| [Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | 12517 | 1651 | 1 | Apache-2.0 | ۱۲۴ کارت رسپی شات + تمپلیت (ریشهٔ نام «shotcraft» در همین ریپو) |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | 5385 | 430 | 12 | — | skill رسمی Remotion؛ آناتومی مرجع router + زیرموضوع |
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | 3720 | 2506 | 2 | MIT | ۵۱ سبک فیلم، کتابخانهٔ سبک به‌جای دستور |
| [Vincentwei1021/anything2explainer](https://github.com/Vincentwei1021/anything2explainer) | 2619 | 242 | 1 | — | explainer با یک نمونهٔ ملاک کیفیت |
| [nateherkai/herk-edit-kit](https://github.com/nateherkai/herk-edit-kit) | 1852 | 1231 | 30 | — | ۱۵ skill + ۴۰۶ کارت موشن‌گرافیک، خط لولهٔ چند-عاملی |
| [Vincentwei1021/video-talkcraft](https://github.com/Vincentwei1021/video-talkcraft) | 1659 | 1076 | 1 | — | ۱۰۸ کارت موشن + «ضد-PPT هفت‌لایه» |
| [iart-ai/motion-skills](https://github.com/iart-ai/motion-skills) | 903 | 11 | 0 | MIT | ۵۰ skill (ساختار مینیمال، محتوا در tools) |
| [Tejashmakwana/motionmaxxing](https://github.com/Tejashmakwana/motionmaxxing) | 900 | 135 | 1 | Apache-2.0 | گیت‌های عددی + ۵۳ بازسازی حرفه‌ای |
| [bangtutorial/bang-motion](https://github.com/bangtutorial/bang-motion) | 657 | 53 | 1 | MIT | «حرکت مثل ویدیو، نه اسلاید»، ممنوعیت‌های مکانیکی |
| [howseen-ai/claude-motion-design](https://github.com/howseen-ai/claude-motion-design) | 592 | 31 | 1 | MIT | خط لولهٔ HTML+Playwright+ffmpeg با لیست «Gotchas» واقعی |
| [charlie947/motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills) | 346 | 56 | 15 | MIT | ۱۵ skill جدا؛ بهترین الگوی «brief → build → check → export» |
| [Kianzzz/xilo-opus-video](https://github.com/Kianzzz/xilo-opus-video) | 206 | 20 | 1 | MIT | سه پلن + پریویو قبل از ساخت |
| [atmirrr/persian-motion-director](https://github.com/atmirrr/persian-motion-director) | 146 | 74 | 1 | — | فارسی/RTL (فقط مرجع؛ policy ما اجازهٔ استفاده نمی‌دهد) |
| [Mort1d/motion-graphics-skills](https://github.com/Mort1d/motion-graphics-skills) | 58 | 104 | 1 | — | showreel + موسیقی اصیل، ۸ مرحله با still در هر مرحله |

ایندکس بالادستی: [zhuyansen/awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills) — ۳۱۸ ریپو دسته‌بندی‌شده + ۱۶ skill که end-to-end تست شده‌اند.

---

## ۲. آناتومی: شش نوع skill که دیدیم

| نوع | نمونه | نقش فایل |
|---|---|---|
| **Router** | `remotion-dev/skills/skills/remotion-best-practices/SKILL.md` (۵۹۶ واژه، `description: Router for all Remotion skills`) | فقط مسیر‌دهی؛ هر موضوع پوشهٔ خودش با `REFERENCE.md` |
| **Creative pipeline** | `motionmaxxing/SKILL.md`، `Mort1d/.../motion-graphics/SKILL.md` | مرحله‌به‌مرحله با artifact در هر مرحله |
| **Pack چند-skill** | `charlie947` (۱۵ فایل)، `herk-edit-kit` (۳۰ فایل در دو mirror) | یک کار = یک skill، هر کدام <۹۰۰ واژه |
| **Craft reference** | `herk/gsap`، `remotion-markup` | API و syntax، بدون روایت |
| **Pipeline agent** | `herk/cut-silences` (Agent 1)، `cut-mistakes` (Agent 2) | ورودی/خروجی صریح + «این کار را نمی‌کند، آن مال agent دیگر است» |
| **Library wrapper** | `lemo-opuscar` | skill فقط کتابخانه را واکشی و تحویل می‌دهد (دو نسخه: plugin با `library/` محلی، tools با fetch) |

نکتهٔ ساختاری: هیچ ریپوی موفقی یک فایل ۱۳۱ خطی چنده‌موضوعی ندارد. میانگین `SKILL.md` در packهای موفق ۴۰۰–۹۰۰ واژه است.

---

## ۳. پانزده ویژگی مثبتی که واقعاً کار می‌کنند (با شاهد)

### ۳.۱ Gate عددی + اسکریپت، به‌جای صفت
`motionmaxxing/SKILL.md`:

> `## Gates (computed on the render; a fail is fixed, never argued)`
> «Scripts print the numbers; you quote them in `NOTE.md`. … never estimate a number.»

| Gate | شرط قبولی | محاسبه‌گر |
|---|---|---|
| G0 render exists | decode می‌شود، سیاه نیست، تصویر حرکت دارد، طول مطابق پلن | `look.py` |
| G2 no empty frame | بیش از ۳ فریم تخت پشت‌سرهم نباشد | `look.py` |
| G3 end card short | هولد پایانی ≤۱٫۴s؛ شات آخر ≤۲۵٪ فیلم | `look.py` |
| G5 no page chrome | بدون برچسب گوشه، شمارنده، timecode، progress bar، تیتر چپ‌چین ثابت | `lint.mjs` (`GATE G5: FAIL` = exit 1) |
| G1 / G4 | با چشم روی `look/sheet.jpg` — و صریح گفته می‌شود که عدد اسکریپتی ندارد | — |

درس: بعضی gateها عددی‌اند، بعضی چشمی؛ ولی **صریح نوشته شده کدام کدام است** و «عدد نجوش نکن».

### ۳.۲ فهرست «Never ship» — ممنوعیت مشخص، نه توصیه
همان فایل، ۱۲ مورد، با این تیتر: `## Never ship (delete the element; do not justify it)` — از جمله:

> ۱۱. **Self-certification:** no `NOTE.md`, gates claimed without script numbers, "justified" fails.
> ۱۲. **A film you did not look at.** A 15 s black render was once certified "VERIFIED / CLEAN".

درس: شکست واقعی ثبت شده + جملهٔ ضد-خودسانسور. این دقیقاً همان چیزی است که skillهای ما ندارند.

### ۳.۳ حلقهٔ نقد: مدل باید فریم‌های خودش را ببیند
`howseen/…/motion-design/SKILL.md`:

> `## 8. Critique loop (make the model watch its own frames)`
> `ffmpeg -i out/final.mp4 -vf "fps=2,scale=270:-1,tile=6x5" -frames:v 1 out/contact.png`
> «Open them and **score 1-10**: hook in the first 2 s · readability at 360 px · motion quality (springs, no dead frames) · variety (something new every 2-4 s) · composition · brand/data accuracy · sound sync. Write the 3 worst problems with timestamps … **Repeat until every score is 8+.** Be a harsh motion director, not a proud author.»

`Mort1d/.../motion-graphics/SKILL.md` همین را در چک‌لیست دارد: `- [ ] 7. Critique until every score is 8+, then render + QA`.

درس: نمرهٔ ۸+ روی contact sheet + الزام «سه ایراد بدترین با timestamp».

### ۳.۴ Preset عددی برای فیزیک حرکت
`howseen`:

> `Spring presets (stiffness k, damping d): snappy UI 320/30, default containers/camera 170/26, heavy type/logos 120/24, playful mascots 180/12.`

درس: جای «حرکت طبیعی باشد» یک جدول عدد می‌گذارد. قابل کپی و قابل تست.

### ۳.۵ کارت رسپی به‌جای متن
- `video-shotcraft`: ۱۲۴ کارت شات + demo source + پریویو متحرک.
- `video-talkcraft`: ۱۰۸ کارت موشن با demo قابل پخش + `tsx` خودبسنده.
- `herk-edit-kit`: ۴۰۶ کارت + `style-library/registry.json` و `GUIDE.md` برای انتخاب.

درس: واحد دانش = کارت (چه هست، از کجا شروع، کجا تمام، چه چیزی داخلش حرکت می‌کند، جزئیات premium). نه پاراگراف.

### ۳.۶ جدول routing: کِی کدام فایل خوانده شود
`video-shotcraft/SKILL.md`:

> `## 何时读哪个文件` — جدول «时机 | 读»: شروع پروژه / خلق آزاد / هم‌ساخت / BGM داده شده / مسیر تمپلیت / استوری‌بورد / پیاده‌سازی شات‌به‌شات / صدا / پذیرش / تحویل.

درس: این تنها روش جلوگیری از load شدن کل context در هر بار است.

### ۳.۷ «Ask for N things, then wait»
`charlie947`، تیتر تکرارشونده در تقریباً همهٔ ۱۵ skill:

> `## Step 1: Ask for five things, then wait`

درس: نقطهٔ توقف صریح. مدل حق ندارد قبل از پاسخ کاربر بسازد.

### ۳.۸ حافظهٔ ردها داخل skill
`charlie947/launch-video`:

> `## What "premium" means here (learned the hard way)` — «Three first drafts were rejected as "not premium" … What fixed it: … Build the first 10 seconds in two or three styles first. Pick one. Only then build the rest.»

و در `vox-explainer` و `title-sequence-3d`: `## Review rules (from the rounds that got rejected)`.

درس: هر دور رد شدن → یک قانون جدید در فایل. (همان الگوی `PERSIAN-LOCALIZATION-LESSONS.md` ما، ولی داخل خود skill.)

### ۳.۹ Brand intake: skill که فایل ورودی می‌سازد
`charlie947/brand-intake/SKILL.md`:

> «A short interview plus 3 to 5 reference frames becomes two files in your project, `brand.md` … and `MOTION.md` (your colours, type, timing and motion rules), **plus a rule in `CLAUDE.md` so Claude reads them before it animates anything**.»

درس: وابستگی hard بین skill و فایل‌های brand — بعد از intake، بقیهٔ skillها همان فایل‌ها را می‌خوانند. ما `tokens` داریم ولی اجبار خواندن نداریم.

### ۳.۱۰ Determinism
`howseen`:

> «**Determinism**: never `Math.random`; use a seeded PRNG (mulberry32). Rendering the same second twice must give identical frames.»

درس: پیش‌نیاز هر gate عددی — بدون تکرارپذیری، اندازه‌گیری بی‌معنی است.

### ۳.۱۱ ممنوعیت ساختاری قابل بررسی مکانیکی
`bang-motion/SKILL.md`: `## Larangan struktural — uji PPT yang bisa diperiksa mekanis` («ممنوعیت ساختاری — تست PPT که می‌توان مکانیکی بررسی کرد») + `## Hukum #1 — Ini video, bukan slide` و `Hukum #2 — Deterministik atau mati` («قانون ۲: قطعی باش یا بمیر»).

درس: تفکیک «قانون قابل بررسی با اسکریپت» از «قانون سلیقه‌ای».

### ۳.۱۲ پریویو قبل از ساخت
`xilo-opus-video/SKILL.md` (چینی): `第 2 步：给三个方案` → `第 3 步：给每个方案做预览` → `第 4 步：写 brief.md` → `第 5 步：制作` → `第 6 步：渲染和验收`.

درس: سه پلن متمایز + still/چند ثانیه پریویو برای هرکدام، **بعد** رندر کامل.

### ۳.۱۳ Gate انسانی در خط لولهٔ خودکار
`herk-edit-kit/.agents/skills/cut-mistakes/SKILL.md`:

> «Works review-gated: it proposes every cut with context and a reason for approval, then renders only the approved cuts via ffmpeg.»

و `make-a-video`: «Two phases, eight sequential gates. Every gate produces a concrete artifact the next gate consumes. Don't skip gates.»

درس: هر مرحله یک artifact ملموس؛ لوپ بازبینی قبل از عمل مخرب (اینجا: برش).

### ۳.۱۴ چند-هارنس از روز اول
- `remotion-dev/skills`: برای هر موضوع `agents/openai.yaml` کنار `REFERENCE.md` + اسکریپت‌های `scripts/sync-agent-skills.ts`، `validate-links.ts`، `sync-readme.ts`.
- `herk-edit-kit`: همان ۱۵ skill در `.claude/skills/` و `.agents/skills/` (mirror دوگانه، دقیقاً الگوی ما در `scripts/sync-persian-arts-skill.mjs`).
- فیلد `version` در frontmatter: `version: 4.0.537` (همراه نسخهٔ محصول).

### ۳.۱۵ Gotchas واقعی، با راه‌حل و مسیر فایل
`howseen` `## 6. Gotchas (all hit for real)`:

> «An easing solved by bisection returns ~1e-9 at x=0: `if (e > 0)` guards fire early (a whole dive disc appeared 2 s early). Return exact 0/1 at the ends.»
> «Logo reveal from a line: squash the real mark vertically (scaleY 0.014 → 1 …); never crossfade a drawn lens into the PNG (grey ghost).»

درس: symptom → cause → fix → مسیر فایل مرجع. همان چیزی که `docs/PERSIAN-LOCALIZATION-LESSONS.md` ما دارد، ولی skillها به آن ارجاع نمی‌دهند.

---

## ۴. نکات ریز ولی مؤثر

| نکته | شاهد | چرا مهم است |
|---|---|---|
| مرز مسئولیت بین skillها نوشته می‌شود | `cut-silences`: «Does NOT cut mistakes, repeats, or false starts — that is the cut-mistakes agent» | جلوگیری از دوباره‌کاری و تصمیم متناقض |
| «محتوا را بساز، آمار نساز» | `motionmaxxing` Never-ship #5؛ `charlie947/motion-brief-writer`: «keeps real results apart from sample data, and never invents a figure» | جلوی دادهٔ جعلی روی صفحه |
| فقط محصول واقعی | `howseen`: «**Real product only**: capture the real UI (Playwright screenshots)… never invent screens.» | جلوی UI تخیلی |
| مجوز صریح برای «نگرفتن» | `charlie947/vox-explainer`: `## What this skill will not do` | کاهش انتظار غلط |
| نمونهٔ ملاک کیفیت | `anything2explainer`: «先看 `examples/rag/frames/overview_*.jpg` 建立标尺» + ۴ نقطهٔ تأیید اجباری | مدل کیفیت هدف را می‌بیند، نه توصیفش |
| عدد در گزارش نهایی | `motionmaxxing`: «you quote them in `NOTE.md`» | ادعا قابل بازبینی می‌شود |
| «سلیقهٔ کاربر» جدا از «قانون» | `motionmaxxing/philosophy`: «judgment decides WHAT; the craft laws decide HOW» + `taste/verdicts.md`, `taste/edits.md` | سلیقه انباشته و قابل استناد می‌شود |
| سبک = انتخاب از کتابخانه | `lemo-opuscar`: انتخاب سبک (Impasto، Ukiyo-e، Exploded Teardown…) + «改风格、做自己的风格» | تنوع کنترل‌شده به‌جای پیش‌فرض تکراری |
| verse/زمان‌بندی دقیق | `talkcraft`: «CPU 字级时间戳 → SHOTBOOK 层矩阵分镜» + «自动静止检测 + independent subagent 评估循环» | تشخیص خودکار قاب مرده |
| شفافیت دربارهٔ چیزی که اجرا نشده | `Mort1d`: «say plainly that it has not been rendered or checked yet» | ضد ادعای بی‌پشتوانه |

---

## ۵. ضدالگوها (چیزهایی که در ریپوهای ضعیف‌تر دیدیم)

1. **فایل چنده‌موضوعی بزرگ** (مثل `references/motion.md` ما، ۱۳۱ خط/۶ موضوع) — route نمی‌شود، فقط سنگین است.
2. **صفت بدون آستانه**: «premium»، «natural»، «cinematic» بدون عدد یا شرط.
3. **gate بدون اسکریپت**: «quality criteria score 1–10» بدون شمارندهٔ مستقل — همان چیزی که باعث self-certification می‌شود.
4. **gate روی playability**: تست خود `awesome-claude-video-skills` نشان داد ۱۶ skill و حتی Claude بدون skill، هر چهار معیار پایه (فایل پخش شود، طول درست، متن خوانا، تصویر تکان بخورد) را پاس کردند. یعنی معیار پایه هیچ‌چیز را از هم جدا نمی‌کند.
5. **نبود نمونهٔ ملاک**: بدون یک فیلم مرجع «قبول‌شده»، مدل به پیش‌فرض خودش برمی‌گردد.
6. **تصمیم‌گیری دربارهٔ سلیقه بدون ثبت ردها** — هر بار از صفر.

---

## ۶. مقایسه با skill ما (`persian-arts`)

| ویژگی | ما | بهترین نمونهٔ بررسی‌شده |
|---|---|---|
| Routing جدول «کِی چه بخوان» | ندارد (یک SKILL.md ۱۱۳ خط) | `video-shotcraft`، `remotion-best-practices` |
| کارت رسپی | **۲۳۰ کارت ساختاریافته** در `work/persian/tools/cards/cards.json` (id/category/beats/overlap/poster) — ولی **بدون جدول پارامتر «حس تنظیم» و بدون دموی پخش‌شدنی** | ۱۲۴ / ۱۰۸ / ۴۰۶ کارت |
| Gate عددی با اسکریپت | **۲۵ gate موجود** (craft-common، dead-frames، scene-variety، light-model، material-flatness، hud-anchor، text-envelope، …) — ولی **آستانهٔ motion ندارد**: نه «درصد فریم متحرک»، نه «ضربه در دقیقه»، نه «بیشترین run ساکن» | `motionmaxxing` G0–G5 |
| حلقه نقد با contact sheet و نمره | ندارد به این شکل | `howseen` §8، `Mort1d` مرحلهٔ ۷ |
| Preset عددی حرکت | ندارد | spring presets در `howseen` |
| «Never ship» | دارد ولی کوتاه و کلی | ۱۲ مورد مشخص با مثال شکست |
| ملاک کیفیت (نمونهٔ طلایی) | `beauty/` دارد ولی فیلم مرجع ضمیمه نیست | `anything2explainer/examples/rag` |
| Determinism | نامشخص/مستند نشده | `howseen` (mulberry32) |
| حافظهٔ درس‌ها | `docs/PERSIAN-LOCALIZATION-LESSONS.md` + ledger (خوب) | ولی skill به آن ارجاع نمی‌دهد؛ آن‌ها داخل skill دارند |
| چند-هارنس | mirror دارد (`scripts/sync-persian-arts-skill.mjs`) ✅ | `remotion-dev` + `herk` |

---

## ۷. دوازده اقدام مشخص برای ما

| # | اقدام | فایل مقصد |
|---|---|---|
| ۱ | شکستن `references/motion.md` به سه فایل تک‌موضوعی | `references/motion-primitives.md`, `motion-timing.md`, `motion-anti.md` |
| ۲ | افزودن جدول routing به SKILL.md | `.claude/skills/persian-arts/SKILL.md` |
| ۳ | `motion-spec.json` کنار هر `film.html` + gate اعتبارسنجی | `work/persian/tools/gates/motion-spec.mjs` |
| ۴ | gate قاب مرده: نسبت فریم‌های تخت، طولانی‌ترین run | `work/persian/tools/gates/dead-frame.mjs` |
| ۵ | gate پایان: هولد پایانی ≤۱٫۴s، شات آخر ≤۲۵٪ | توسعهٔ `empty-band.mjs` |
| ۶ | اسکریپت contact sheet + strip + phone-width | `work/persian/tools/qc/contact.mjs` |
| ۷ | بخش «Never ship» عددی‌شده با مثال شکست‌های خودمان | `references/motion-anti.md` |
| ۸ | presets عددی (spring/easing/duration per element class) | `work/persian/htmlfilm/lib/pa-film.js` + مستند در `motion-primitives.md` |
| ۹ | ۳ فیلم مرجع تأییدشده + contact sheet ضمیمه | `beauty/references/craft/motion-and-easing.md` |
| ۱۰ | گام اجباری «۳ پلن + پریویو، سپس تأیید» در جریان کار | `SKILL.md` (Workflow) |
| ۱۱ | Nمرحله ۸+ اجباری روی contact sheet پیش از تحویل | `beauty/checklists/pre-delivery.md` |
| ۱۲ | ثبت هر رد در ledger + ارجاع از skill به آن | `docs/motion/LESSONS-LEDGER.jsonl` + ارجاع در `motion-anti.md` |

---

## ۸. پیوست: روش و مسیر دادهٔ خام

- اسکریپت‌ها با `pwsh` روی Windows اجرا شدند؛ `Invoke-RestMethod` برای API و `Invoke-WebRequest` برای `raw.githubusercontent.com` (بدون مصرف سهمیهٔ API).
- فایل‌های خام: `%TEMP%\skillres\repos.json` و `%TEMP%\skillres\files\*` (۶۸ فایل `SKILL.md`، نام‌گذاری `owner__repo__path`).
- درخت ریپوها: `%TEMP%\skillres\owner__repo.tree.json`.
- دادهٔ عددی (ستاره/تاریخ) از API در 2026-10-19 خوانده شده؛ تغییر می‌کند.
- هیچ کدی از این ریپوها کپی نشد؛ فقط الگو و ساختار بررسی شد. سازگاری لایسنس‌ها در جدول §۱ آمده (چند مورد `NOASSERTION` — استفادهٔ مستقیم نیاز به بررسی جدا دارد).
