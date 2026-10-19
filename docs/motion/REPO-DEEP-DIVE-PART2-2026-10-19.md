# بررسی عمیق — بخش دوم: ۵ ریپو با دادهٔ دقیق (اندازه‌گیری‌شده)

تاریخ: 2026-10-19 · روش: دانلود کامل `SKILL.md`ها از GitHub API/raw و شمارش کلمه/بایت روی فایل‌های محلی.
بخش یک: [REPO-DEEP-DIVE-2026-10-19.md](REPO-DEEP-DIVE-2026-10-19.md)

---

## ۱. remotion-dev/skills — ۱۲ اسکیل، ۵۲۷۴ واژه، الگوی «روتر نازک»

| skill | بایت | واژه | نقش |
|---|---|---|---|
| remotion-best-practices | 4,215 | 595 | **روتر** (۱۷ سرفصل، فقط مسیر می‌دهد) |
| remotion-interactivity | 13,703 | 1,593 | تعامل در ویدیو |
| remotion-markup | 12,874 | 1,464 | ساخت صحنه با JSX |
| remotion-create | 2,711 | 409 | اسکلت پروژهٔ تازه |
| remotion-upgrade | 1,930 | 239 | مهاجرت نسخه |
| remotion-studio | 1,611 | 228 | پیش‌نمایش |
| remotion-saas | 1,053 | 155 | محصول‌سازی |
| remotion-docs | 1,340 | 143 | جست‌وجوی مستندات |
| remotion-captions | 1,137 | 140 | زیرنویس |
| remotion-maps | 1,030 | 139 | نقشه |
| remotion-multimedia | 705 | 87 | صوت/ویدیو |
| remotion-render | 711 | 82 | رندر |

**الگو:** ۶ روترِ زیر ۲۵۰ واژه (۸۲–۲۳۹) فقط می‌گویند «کدام پوشه را باز کن»، و ۲ مهارتِ سنگین (۱٬۵۹۳ و ۱٬۴۶۴ واژه) محتوای واقعی را در `REFERENCE.md`های موضوعی نگه می‌دارند. یعنی **۷۰٪ حجم متن در ۲ مهارت** است، بقیه مسیریابی‌اند.

سرفصل‌های روتر (کل ساختار): Preserve user changes → Creating a video → New project setup → React Markup Best Practices → Maps → Multimedia → Improving Interactivity → Open the preview (سه شاخهٔ Cursor / agent client with in-app browser / no in-app browser) → Render the video → Captions → Creating a SaaS, automation or application → Looking up Remotion APIs and documentation → Upgrading.

اسکریپت‌ها: `scripts/sync-agent-skills.ts` · `sync-embedded-skills.ts` · `sync-readme.ts` · `validate-links.ts`.
**درس:** روتر باید شاخهٔ «چطور پیش‌نمایش بگیرم» را برای هر کلاینت جدا داشته باشد — همان چیزی که ما در `AGENTS.md` با «فقط Claude» اضافه کردیم، اینجا به‌صورت ساختار پوشه حل شده.

---

## ۲. nateherkai/herk-edit-kit — ۱۵ اسکیل × ۲ آینه، ۲۰٬۹۴۰ واژه

| skill | بایت | واژه |
|---|---|---|
| video-storytelling | 19,450 | 3,192 |
| short-form-edit | 21,737 | 3,172 |
| short-form-video | 20,275 | 2,903 |
| hyperframes | 20,239 | 2,676 |
| make-a-video | 12,630 | 1,859 |
| motion-showreel | 11,097 | 1,706 |
| hyperframes-video-beats | 8,409 | 1,332 |
| gsap | 6,392 | 840 |
| cut-silences | 4,836 | 719 |
| website-to-hyperframes | 6,116 | 649 |
| hyperframes-cli | 4,920 | 596 |
| cut-mistakes | 4,245 | 575 |
| hyperframes-registry | 4,278 | 518 |
| edit-video | 2,690 | 351 |
| style-library | 1,603 | 225 |

**آینه‌ها:** هر ۱۵ فایل در `.claude/skills/` و `.agents/skills/` **بایت‌به‌بایت یکسان** هستند (اندازه‌ها دقیقاً برابر) + پوشهٔ `.codex/`. یعنی یک منبع، دو (سه) مصرف‌کننده.

**ساختار `make-a-video` (۱٬۸۵۹ واژه) — هشت گیت واقعی:**

| گیت | عنوان | خروجی |
|---|---|---|
| Gate 1 | Intent & format | قالب/نسبت |
| Gate 2 | Script & voice | متن + صدا |
| Gate 3 | Style intake | ورودی سبک |
| Gate 4 | **Brief synthesis (HARD-GATE before building)** | بریف نهایی |
| Gate 5 | Scaffold & storyboard | اسکلت + استوری‌بورد (با «Handoff check first») |
| Gate 6 | Build compositions | کامپوزیشن‌ها + قواعد determinism |
| Gate 7 | **Lint → Studio preview (PREVIEW GATE 1 — MANDATORY)** | پیش‌نمایش |
| Gate 8 | **Draft render → visual verification → MP4 preview → final (PREVIEW GATE 2 — MANDATORY)** | خروجی نهایی |

و بخش `## Non-negotiables (load-bearing — do not soften)`.

**درس:** دو «پیش‌نمایش اجباری» قبل از رندر نهایی — دقیقاً همان چیزی که ما نداریم: قبل از رندر سنگین، یک پیش‌نمایش دیده می‌شود.

---

## ۳. howseen-ai/claude-motion-design — ۵٬۰۶۸ واژه، «کارگرد سخت‌گیر»

`SKILL.md` = 33,895 بایت / 5,068 واژه. همراه: `examples/howseen-launch/film.html` (۲۸KB) + `preview.gif` + `scripts/remake/core.js` + `scripts/render_template.py`.

بخش‌های اصلی: §8 Critique loop · §6 Gotchas · §9 spring presets · بخش کپچر/رندر. حلقهٔ نقد با سه دستور ffmpeg (contact / strip / phone) و نمرهٔ ۱–۱۰ روی ۷ محور؛ قاعده: «Repeat until every score is 8+. Be a harsh motion director, not a proud author.»

**presetهای عددی:** UI سریع 320/30 · کانتینر و دوربین 170/26 · تایپ/لوگوی سنگین 120/24 · مسکات 180/12.

**Gotchas واقعی:** bisection easing که ~1e-9 برمی‌گرداند و گارد `if (e > 0)` زود شلیک می‌کند؛ لوگو با squash عمودی `scaleY 0.014 → 1`؛ اندازه‌های پلتفرم (LinkedIn 1080×1350، X 1:1 و 16:9).

---

## ۴. lemomo-ai/lemo-opuscar — یک اسکیل، دو حالت تحویل

| نسخه | بایت | واژه |
|---|---|---|
| `plugin/skills/lemo-opuscar/SKILL.md` | 2,872 | 435 |
| `tools/directory/SKILL.md` | 3,562 | 547 |

یعنی همان قابلیت، دو بار: یک‌بار با کتابخانهٔ محلی (`styles/` با ۲٬۱۷۳ ورودی، `core/` با ۵۸ فایل: render/three/post/tts/audio/fonts/assets) و یک‌بار با «fetch از بیرون». هر سبک = پوشهٔ مستقل با `demo/stills/styleframe.jpg` + `demo/data/model.json`.

**درس:** سبک یک **دارایی** است (styleframe + مدل + دمو)، نه یک پاراگراف توصیفی. ما هم باید برای هر سبک، یک styleframe مرجع داشته باشیم.

---

## ۵. charlie947/motion-graphics-skills — ۱۵ اسکیل کوچک، ۱۲٬۲۷۸ واژه

| skill | واژه | skill | واژه |
|---|---|---|---|
| motion-effects | 1,548 | milestone-reveal | 690 |
| vox-explainer | 1,050 | loop-cover | 661 |
| brand-intake | 863 | model-showdown | 651 |
| motion-prompt-writer | 855 | title-sequence-3d | 652 |
| motion-brief-writer | 790 | reference-to-motion | 627 |
| launch-video | 789 | reel-export | 534 |
| apple-launch-film | 740 | animated-chart | 511 |
| | | newsletter-promo | 440 |

میانگین ۸۱۹ واژه، میانه ۶۶۱. ساختار مشترک (از سرفصل‌های واقعی `brand-intake`): `Start straight away` → `Step 1: The interview, in two batches` → `Step 2: Write brand.md` → `Step 3: Write MOTION.md from the frames` → `Step 4: Add the read-first rule to CLAUDE.md` → `What I learned the hard way` → `Step 5: Prove it (optional, two minutes)` → `Hand off`.

**نکتهٔ کلیدی:** `brand-intake` سه artifact می‌نویسد — `brand.md`، `MOTION.md`، و **یک قاعدهٔ «اول این را بخوان» داخل `CLAUDE.md`** تا بقیهٔ مهارت‌ها قبل از انیمیت‌کردن آن را ببینند. این همان چیزی است که در ریپوی ما (`docs/motion/`, `DECISIONS.jsonl`) وجود دارد ولی به خودِ اسکیل وصل نیست.

---

## ۶. جدول مقایسهٔ این ۵ ریپو

| ریپو | روتر در SKILL.md | کارت رسپی | گیت اجرایی با آستانه | حلقهٔ دیدن فریم | نمونه/دمو همراه | آینهٔ چند-هارنس | حجم متن |
|---|---|---|---|---|---|---|---|
| remotion-dev/skills | ✅ ۱۷ سرفصل، ۶ روتر زیر ۲۵۰ واژه | ❌ (REFERENCE.md موضوعی) | ❌ | ❌ | ❌ | ✅ (agents/openai.yaml + sync scripts) | ۵٬۲۷۴ واژه |
| herk-edit-kit | ❌ (۱۵ اسکیل جدا) | ❌ | ✅ ۸ گیت + ۲ پیش‌نمایش اجباری | ✅ visual verification اجباری | ✅ | ✅ ۳ آینهٔ بایت‌به‌بایت | ۲۰٬۹۴۰ واژه |
| howseen | ✅ ۸+ بخش | ❌ | بخشی | ✅ contact/strip/phone + ۸+ | ✅ نمونهٔ کامل با GIF | ❌ | ۵٬۰۶۸ واژه |
| lemo-opuscar | ❌ | ❌ (سبک=دارایی) | ❌ | ❌ | ✅ ۲٬۱۷۳ ورودی سبک | ✅ دو حالت تحویل | ۴۳۵–۵۴۷ واژه |
| charlie947 | ❌ | ❌ | ✅ «review rules» | ✅ (هر skill جدا) | ✅ GIF | ❌ | ۱۲٬۲۷۸ واژه |

---

## ۷. چیزی که از این پنج ریپو کپی می‌کنیم

1. **روتر نازک + پوشهٔ موضوعی** (remotion-dev): اسکیل ما ۱۳۵ خط است؛ بخش‌های «حرکت»، «تایپوگرافی»، «صدا»، «گیت» باید به `references/` بروند و SKILL.md فقط مسیر بدهد.
2. **دو پیش‌نمایش اجباری قبل از رندر نهایی** (herk Gate 7 و 8): «Lint → preview» و «draft render → visual verification».
3. **artifact + قاعدهٔ خواندن** (charlie947): `MOTION.md` + یک خط در `AGENTS.md` که می‌گوید پیش از انیمیت‌کردن، `references/motion-anti.md` و برگهٔ تماس را ببین.
4. **سبک به‌صورت دارایی** (lemo): برای هر سبک، یک styleframe PNG + یک دموی قابل پخش.
5. **عدد به‌جای صفت، با کالیبراسیون** (howseen + یافتهٔ خودمان): presetهای spring عددی، ولی آستانه‌ها فقط بعد از اندازه‌گیری روی کورپوس خودمان.

## ۸. چیزی که از این پنج ریپو کپی **نمی‌کنیم**

- `AGPL` (OpenMontage) و لیسانس‌های غیر OSI (GSAP) — برای محصول تجاری، هزینهٔ حقوقی.
- `theatre.js`/`popmotion`/`rebound`/`eases`/`timecut`/`flubber` — بی‌نگهداری (جدول لایسنس در [JS-LIBRARY-SURVEY-2026-10-19.md](JS-LIBRARY-SURVEY-2026-10-19.md)).
- ادعاهای بدون سند (مثلاً «۱۰۰+ ابزار، ۷۰۰+ اسکیل» در README OpenMontage) — ما عدد را از فایل‌های واقعی می‌شماریم، نه از ادعا.
