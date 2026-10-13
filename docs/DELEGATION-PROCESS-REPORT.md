# گزارش فرایند واگذاری (Delegation Process Report)

تاریخ تهیه: 2026-10-13 | تهیه‌کننده: worker (order p1-process-doc) | مخاطب: owner (از طریق lead)
منابع: `D:\P\tools\quota-hub\data\hub.db` (جداول jobs / ratings / snapshots)، `data\runs\*\meta.json`، `data\*.log`، `work/persian/out/*/review*.json`، `work/persian/trial/*`، `work/persian/progress.json`، `docs/PERSIAN-SOUND-SPEC.md`، `work/persian/sound-task/**`، `D:\P\tools\quota-hub\SPEC.md`. اصطلاحات فنی و نام فایل‌ها انگلیسی مانده‌اند.

## 1) خط زمانی (UTC)

- **تا 2026-10-10 (پیش از quota-hub):** پایپ‌لاین بومی‌سازی Persian و موجودری ۱۵۷ کارت در `work/persian/progress.json`؛ موج نخست بازبینی ۴۳ کارت (reviewهای بدون score، فقط verdict) — مدلِ نویسندهٔ این موج در جایی لاگ نشده است.
- **2026-10-11 ~13:00–13:52:** ساخت quota-hub طبق `D:\P\tools\quota-hub\SPEC.md` (SQLite `hub.db`، snapshot-گیری از سهمیه). لاگین دو حساب Codex Plus (`~/.codex-a`, `~/.codex-b`) و کلید GLM از env `ZAI_API_KEY`؛ نخستین snapshot ساعت 13:52.
- **14:24:** pilot eval با ۴ ران؛ ۲ ران نامعتبر (timeout/failed) → الگوی «ابطال ران‌های infra» شکل گرفت (`pilot1.invalid.log`).
- **14:24–16:20:** سوئیت‌های eval سینتتیک روی ۸ مدل در ۳ لِین موازی (laneA/laneB/laneG): ۸ task kind × easy/hard (+expert)؛ جمعاً ۲۵۲ job در DB، ۲۱۳ rating خودکار. ۴ ران به‌عنوان infra نامعتبر شد (`data/invalid_ids.txt`: 178، 190، 191، 192).
- **14:29–16:20:** آزمایش واقعی ۳۹ کارت (`work/persian/batch39.json`) با `cheap-author.mjs`/`cheap-batch.mjs` روی ۵ مدل (gpt-6-sol، gpt-6-luna، gpt-5.6-luna، gpt-5.6-terra، glm-5.3-flash)؛ ۳۴ ران در `trial/batch-results.jsonl` (۳۲ ok) و در مجموع ۳۸ کارت نمره‌دار بازبینی شد.
- **بازبینی مستقل:** هر خروجی با review مستقل Sonnet (score 0–100، آستانهٔ approve در 85+) داوری شد؛ ۱۳ کارت fix خوردند و ۱۸ review دور اصلاح (round1/2/3) ثبت شد.
- **16:55:** سفارش یکپارچهٔ «persian sound tool v1» به GLM — ۳۰+ دقیقه بدون خروجی، متوقف شد (job 240, status stopped). نتیجهٔ سیاستی: سفارش‌های milestone‌ای به‌جای سفارش بزرگ.
- **17:24–17:48:** اعتراض owner به انجام کار دستی توسط lead → تصمیم سیاستی «Brain and hands rule» (قواعد ۱–۱۱ شامل استثنای اضطراری و مدیریت worker کند) در `CLAUDE.md`، `AGENTS.md`، `SKILL.md` quota-hub و memory نوشته شد (order o1)؛ ابزار صف `qh order/orders/result/stop` ساخته شد (order o2، با تست).
- **17:48–18:10:** کار صوتی طبق `docs/PERSIAN-SOUND-SPEC.md` با سه سفارش milestone به GLM: s1 analysis، s2 synth، s3 mix+CLI — هر سه ok با تست سبز و سه نمونهٔ واقعی (`RadialWave/ListReveal/SvgShapeMorph .fa.sound.mp4` در `work/persian/sound-task/samples/`).
- **2026-10-12 20:13:** سفارش s4 (verify_sound.py + batch.py + README) بعد از ۲۵ دقیقه timeout شد؛ `verify_sound.py` نوشته شد اما `batch.py` و README تحویل نشد (ناقص). 20:38: o3 (فیلترهای ONLY_STATUS/KEEP و بسته‌بندی `.fa.sound.mp4` در `scripts/link-persian-shotcraft-media.mjs`) ok. 20:44: همین سفارش مستندسازی شروع شد.

## 2) اعداد

### کارت‌های واقعی (موج ۳۹ کارتی، ۳۸ کارت نمره‌دار)

| مدل | کارت | میانگین نمرهٔ بار اول | approve بار اول | میانگین دقیقهٔ authoring | هزینهٔ سهمیهٔ مشاهده‌شده |
|---|---|---|---|---|---|
| gpt-6-sol | 10 | 88.3 | 10/10 | 5.0 | ~9.3%/کارت (بازه 3–20) |
| gpt-6-luna | 12 | 84.5 | 8/12 | 5.6 | ~9.6%/کارت (2–18) |
| gpt-5.6-luna | 10 | 83.4 | 8/10 | 3.5 | ~7.1%/کارت (3–14) |
| gpt-5.6-terra | 2 | 91.0 | 2/2 | 6.2 | ~14%/کارت (6–19) |
| glm-5.3-flash | 4 | 89.0 | 4/4 | 7.3 | ~2.3%/کارت |
| مجموع | 38 | 86.0 | 32/38 (84%) | — | — |

- **fix-round:** ۱۳ کارت fix خوردند؛ ۱۸ review اصلاحی ثبت شد. نمره در ۳ مسیر بالا رفت (list-stack-press 58→80→80، picker-carousel 80→82) و در بقیه ثابت یا بی‌تغییر ماند (page-waterfall-wall 22→22، autolayout 78→78)؛ **هیچ کارتی در reviewهای دور اصلاح به approve نرسید**. جدا از آن، ۷ job اصلاح (persian-fix) توسط داور Claude نمرهٔ 85–92 گرفتند (هر ۷ مورد ≥85).
- ratingهای claude روی jobهای author (n=24): gpt-6-luna medium 71.4 (n=8، min 22)، gpt-6-sol medium 85.6 (n=5)، gpt-5.6-luna 66.0 (n=5)، gpt-5.6-terra low 85.5 (n=2)، glm low 92 / medium 88 (n=4).
- موج اول (۴۳ کارت، review بدون score): 36 approve / 7 fix — انتساب مدل در دسترس نیست (شکاف داده‌ای).

### eval سینتتیک (میانگین rating خودکار، tiers)

| مدل | easy | hard | expert |
|---|---|---|---|
| gpt-6.1-sol | 100 | 100 | 99.8 (n=4) |
| gpt-6-sol | 100 | 100 | 99.7 (n=3) |
| gpt-6-astra | 100 | 100 | 99.7 (n=3) |
| gpt-5.6-sol | 100 | 100 | 99.0 (n=6) |
| gpt-5.6-luna | 100 | 100 | 98.8 (n=6) |
| glm-5.3-flash | 100 | 94.8 | اجرا نشد |
| gpt-6-luna | 88.9 | 93.6 | 93.0 |
| gpt-5.6-terra | 100 | 100 | 80.7 |

- تنها تفکیک‌کننده‌های درون-suait: review-diff (gpt-6-luna low: 56، glm low: 62.5)، report-honesty (gpt-6-luna low: 71)، css-persian-fix برای terra (66.7 با یک صفر).

### بازبینی و هزینه

- جمع ران‌های بازبین: **۹۹** (۸۱ بار اول + ۱۸ دور اصلاح؛ فایل‌های `reports/*.review.json` کپی همان‌ها هستند).
- با ~80k–150k توکن Claude برای هر review: **حدود ۸ تا ۱۵ میلیون توکن Claude** فقط برای بازبینی. یک‌بار سقف session کلود در موج review خورد (گزارش lead؛ در داده‌های نگه‌داشته راستی‌آزمایی نشد).
- سهمیه: max observed used_pct — codex-a 100%، codex-b 90%، glm 100%. Z.ai Lite فقط یک job همزمان (`glm.lock`)؛ پنجرهٔ ۵ ساعتهٔ Codex Plus حدود 8–10٪ برای هر کارت Sol.

## 3) چه چیزهایی جواب داد / چه چیزهایی نه

**جواب داد:**
- authoring ارزان و موازی: ۳۸ کارت در ~۹۰ دقیقه با ۵ لِین؛ هزینهٔ GLM ~2٪ سهمیه به‌ازای هر کارت.
- بازبینی مستقل روی کار واقعی تفکیک کرد جایی که eval سینتتیک اشباع شده بود (جدول بالا).
- صف `qh order` گلوگاه bootstrap را برداشت: سفارش بدون ساخت فایل task ثبت می‌شود و FIFO per-worker اجرا می‌شود.
- سفارش‌های milestone صوتی (s1/s2/s3، هرکدام ۴–۱۰ دقیقه) با acceptance command دقیق بار اول سبز شدند؛ سنتز deterministic (WAV بایت‌به‌بایت یکسان با seed یکسان).
- قاعدهٔ «brain and hands» + استثنای اضطراری (قاعدهٔ 10) و مدیریت worker کند (قاعدهٔ 11) مستند و در ابزار پشتیبانی شد.

**جواب نداد / باگ‌ها (با مثال عینی):**
- **blur-cheating:** کارت‌هایی که متن را در raster پخته بودند با فریم‌های یکسان از فیلترهای خودکار می‌گذشتند؛ فقط داوری تصویری آنها را گرفت (نمره‌های 22 برای row-embed و page-waterfall-wall). (ادعای lead؛ نمره‌ها در داده تأیید می‌شود، سازوکار دقیق در متن reviewها صریح نشده.)
- **باگ RTL زیر FaRoot:** در skeleton-reveal متن پیام چون فقط از spanهای inline-block تشکیل شده بود پاراگراف LTR resolve شد و ترتیب کلمات برای خوانندهٔ فارسی وارونه شد (ریشه: `faText()` با `unicodeBidi:'plaintext'`).
- **منفی bidi:** autolayout-gap-dial — در undershoot فنری مقدار ‎-4‎ به‌شکل «۴-» (خط بعد از رقم) رندر شد؛ fix: span با `direction:'ltr'` + `unicodeBidi:'isolate'` و منفی درست (U+2212).
- **glyph fallback:** list-stack-press — صفر لاتینِ باریک در کنار ارقام فارسی ضخیم، شبی دو تایپ‌فیس متفاوت؛ fix: هم‌خانواده/هم‌وزن‌کردن صفر با ارقام.
- **استال برای گرفتن تأیید:** سفارش یکپارچهٔ sound tool به GLM ۳۰+ دقیقه بدون هیچ خروجی ماند و متوقف شد (job 240؛ در `runs/240` فقط prompt.md هست، بدون result).
- **خطای infra در ظاهر خطای مدل:** ران ۱۷۸ خطای apply_patch (دو عملیات روی یک فایل)، ران‌های ۱۹۰/۱۹۱/۱۹۲ (expert) که نامعتبر شدند؛ timeout نخستین pilot GLM که در pilot بعدی ok شد. موارد «Windows sandbox جلوی esbuild»، «نشت env-variable و هنگ `claude -p`» و «usage limit وسط ران» گزارش lead هستند و در لاگ‌های موجود اثر مستقیم ندارند (تأییدنشده).
- **قفل اشتباه guard:** `cheap-author.mjs` قبل از run از همهٔ فایل‌های dirty/untracked خارج از دایرکتوری کارت snapshot می‌گیرد و آخر کار restore می‌کند (حدود خطوط 45–65) — در نتیجه ویرایش‌های موازی مشروع برگشت (یک اسکریپت untracked حذف و یک ویرایش tracked revert شد).

## 4) مشکلات خودِ فرایند

1. **eval سینتتیک اشباع شد** (easy/hard ~100 و expert ~99–100 برای مدل‌های قوی) و فقط review مستقل روی کارت واقعی discriminative بود. درس: بنچمارک روی کار واقعی با داور مستقل.
2. **خطای infra خودش را خطای مدل جلو می‌دهد**؛ ابطال خودکار ران‌های دارای الگوی usage-limit/sandbox/env هنوز در runner نیست (فعلاً ۴ مورد دستی در `invalid_ids.txt`).
3. **review گلوگاه است:** authoring تقریباً رایگان است اما هر review مستقل Sonnet ~80k–150k توکن Claude هزینه دارد و سقف session یک‌بار خورد.
4. **lead شخصاً دست به پیاده‌سازی زد** (`cheap-author.mjs`، `cheap-batch.mjs`، `review-prompt.mjs`، پروب داده) و owner اعتراض کرد؛ ریشه: bootstrap بدون کانال سفارش بود (`qh run` به task file نیاز دارد). `qh order` این شکاف را بست و doctrine آن را قاعده‌مند کرد.
5. **guard مبتنی بر snapshot ویرایش مشروع را revert می‌کند**؛ اصلاح: guard فقط روی مسیرهای مجاز همان run، هرگز revert بر اساس snapshot سراسری.
6. **انتساب quota-delta ناپایدار است** (همزمانی و reset پنجرهٔ ۵ ساعته؛ حتی مقادیر منفی)؛ برای حسابداری هزینه بدون تشخیص reset قابل استفاده نیست — در DB هم اکثر jobهای author مقدار quota قبل/بعد null دارند.
7. **GLM flash کند است:** ۴–۹ دقیقه برای یک کارت، تا ۱۶ دقیقه در کارهای medium، timeout در سفارش ۲۵ دقیقه‌ای s4، و استال کامل در سفارش بزرگ. باید با سفارش‌های milestone کوچک، progress file، effort medium و تشخیص stall مدیریت شود.
8. **محدودیت‌های ظرفیت:** Z.ai Lite یک job همزمان؛ پنجرهٔ ۵ ساعتهٔ Codex ~8–10٪ به‌ازای هر کارت Sol؛ سقف‌های هفتگی تعیین‌کننده‌اند.
9. **قفل فنی ناقص:** تنظیمات پروژه که Write/Edit را deny کنند subagent ها را هم قفل می‌کنند؛ قفل باید فقط session اصلی (lead) را محدود کند (hook های key شده روی main session).

## 5) پیشنهادهای بهبود (سود / هزینه / ریسک)

1. **پایپ‌لاین review ارزان سه‌لایه:** پیش‌آزمون خودکار توسط worker (باقی‌ماندهٔ متن لاتین/چینی، diff ثابت‌ها/تایمینگ با اصل، frame-difference برای کشف blur-cheat، سرریز/off-canvas) → review اول GLM → Sonnet فقط برای موارد اختلافی/حساس یا نمونهٔ تصادفی. سود: ~۷۰–۹۰٪ کاهش توکن Claude (~۸–۱۵M → ~۱–۳M در هر موج). هزینه: نیم تا یک روز ساخت + کالیبراسیون با verdictهای Sonnet. ریسک: گذر مشکلات بصری از پیش‌آزمون؛ با نمونه‌گیری تصادفی Sonnet کنترل شود.
2. **ابطال خودکار ران‌های infra:** تشخیص الگو در stderr/خروجی (usage limit، sandbox، env، تداخل apply_patch) و ثبت status=infra-limit خارج از ratings. سود: مقایسهٔ تمیز مدل‌ها. هزینه: چند ساعت. ریسک: over-matching خطاهای واقعی را می‌پوشاند.
3. **اصلاح guard به allowlist per-run:** فقط مسیرهای named در سفارش، بدون restore سراسری. سود: حذف از دست رفتن ویرایش‌های موازی. هزینه: کم. ریسک: allowlist خیلی باز، دامنهٔ خسارت worker را بیشتر می‌کند.
4. **حسابداری سهمیه با snapshot + تشخیص reset** به‌جای delta هر job. سود: عدد هزینهٔ قابل اعتماد. هزینه: کم. ریسک: همچنان تقریبی زیر همزمانی.
5. **مدیریت GLM با milestone + `qh orders` (پرچم STALLED) + `qh stop`:** اعمال کامل قاعدهٔ 11 (timebox ~20 دقیقه، progress file، effort medium، off-peak). سود: حذف timeout و استال. هزینه: سربار تقسیم سفارش. ریسک: شکستن کارهای درهم‌تنیده به تکه‌های ناسازگار.
6. **استثنای judgment samples:** lead پیش از اقدام برگشت‌ناپذیر/عمومی (مثل publish) فقط contact sheet حداکثر ۳ تصویرِ آماده‌شده توسط worker را می‌بیند. سود: کنترل کیفی نقطهٔ بحرانی بدون نقض doctrine. هزینه: تقریباً صفر. ریسک: لغزش به «فقط یک نگاه دیگر» — سقف ۳ تصویر باید سخت بماند.
7. **قفل فنی فقط برای lead:** hook های key شده روی main session (نه deny سراسری Write/Edit). سود: اجرای doctrine بدون فلج‌کردن دست‌ها. هزینه: متوسط (طراحی دقیق hook). ریسک: پیکربندی اشتباه همه‌چیز را قفل می‌کند.
8. **جلسهٔ شنیدن صدا توسط owner:** کیفیت صدا فعلاً فقط با متریک عینی سنجیده شده (loudness/TP/cue alignment/spectrogram). سود: اعتبارسنجی بُعد سنجیده‌نشده. هزینه: ~۱۰ دقیقه وقت owner. ریسک: ندارد.

## 6) تقسیم کار brain / hands

**lead (brain) نگه می‌دارد:** تصمیم و اولویت، نوشتن سفارش، خواندن report و verdict (نه دادهٔ خام)، داوری accept/fix/escalate/stop، گفتگو با owner، اجرای `qh order/orders/result/quota/rate/stop`، ثبت یک‌خطی تصمیم‌ها در `docs/DELEGATION-JOURNAL.md`. **workers (hands) انجام می‌دهند:** تحقیق و decision brief، پیاده‌سازی، رندر/تست/اندازه‌گیری، پیش‌بازبینی، git (فقط با سفارش و whitelist مسیر)، آماده‌سازی contact sheet.

- **توصیه:** lead حداکثر **~15–20٪ تلاش و ~5–10٪ توکن**؛ workers **~80–85٪ تلاش و ~90–95٪ توکن**. استدلال از داده‌های همین دوره: ۲۵۲ job فقط با چند ده سفارش کوتاه تولید شد (authoring ارزان و موازی است)؛ گلوگاه واقعی review بود که با توکن Claude پرداخت می‌شود؛ و ارزش lead در تعریف درست سفارش و داوری خروجی فشرده بود، نه در خواندن لاگ خام. پس توکن کم‌حجم و گران lead باید صرف قضاوت شود.
- **استثنای judgment samples** (بند 5-6) تنها مجوز دیدِ تصویری lead است: فقط پیش از publish یا هر اقدام برگشت‌ناپذیر، حداکثر ۳ تصویر آماده‌شده توسط worker.

## 7) سؤال‌های باز برای owner

1. نمونه‌های `work/persian/sound-task/samples/*.fa.sound.mp4` را گوش می‌دهید؟ کیفیت صدا فعلاً فقط با متریک عینی تأیید شده است.
2. آستانهٔ approve در 85 و سیاست «GLM پیش‌فرض، Sol فقط برای کار سخت یا دو بار شکست GLM» تأیید می‌شود؟
3. بودجهٔ سقف‌های هفتگی Codex و سهم Claude برای موج‌های review بعدی چقدر است؟ (پایپ‌لاین ارزان review منتظر تأیید است.)
4. موج اول ۴۳ کارتِ بدون score باید با rubric نمره‌دار دوباره بازبینی شود؟
5. کی و با چه شرطی publish انجام شود و آیا همان‌جا استثنای judgment samples اعمال شود؟
6. `config/policy.json` و `eval/README.md` در مسیرهای داده‌شده وجود ندارند (به‌جایشان `evals/README.md` پیش‌نویس و `evals/rubric.md` هست) — سیاست مدل‌ها کجا باید canonical شود؟
