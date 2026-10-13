# INTAKE: how /persian-arts asks (spec, 2026-10-13)

Goal: one round of questions at most, one conditional follow-up at most, zero questions when the message already answers or the user delegates. Output: `media/briefs-local/<label>/brief.json` (git-ignored; schema `docs/motion/brief.schema.json`, example `brief.example.json`). Ask in the user's language (Persian wording below).

## 1. Parse first (never re-ask)
Before asking anything, extract from the user's message, GOAL FIRST (objective, audience, desiredAction + CTA text, successSignal, tone, mustSay, mustNotSay; cues like «هدف»، «می‌خواهم ... ثبت‌نام کنند»، «برای جذب»، «معرفی»), then: label/topic, duration, ratios ("عمودی/استوری"=9x16, "مربع"=1x1, "پست"=4x5, "افقی/یوتیوب"=16x9), genre words, character/mascot mention, logo/image mentions or attached paths, idea request ("ایده بده"), copy text (quoted or pasted lines), music mood, language, deadline. Every field found is filled and removed from the questions. Delegation phrases ("خودت تصمیم بگیر", "هر طور صلاحه", "you decide", "دیگه سوال نپرس") anywhere = DECIDE-FOR-ME (section 6).

## 2. Question catalogue
| id | Persian wording | options (multi?) | default |
|---|---|---|---|
| Q0 goal (FIRST; asked whenever goal.objective or goal.desiredAction is missing) | «هدف این موشن چیست؟ بعد از دیدنش بیننده چه کاری بکند؟» | goal presets of the genre (section 6a): جذب/اقدام (تبلیغاتی) · آموزش یک ایده (آموزشی) · برانگیختن حس و بعد نام برند (داستانی) · یک چیز را بدیهی کردن (اکسپلینر) · اطلاع از تاریخ/مکان/اقدام (رویداد) · قلاب در ۲ ثانیه (شبکه اجتماعی); built-in Other = free text (objective + desired action + CTA) | preset of the genre (section 7) |
| Q1 ratios | «چه قاب‌هایی لازم داری؟» | عمودی ۹:۱۶ (استوری/ریلز) · مربع ۱:۱ · پست ۴:۵ · افقی ۱۶:۹ (multi) | all four, 9x16 master |
| Q2 genre | «موشن از چه جنسی باشد؟» | تبلیغاتی · آموزشی · داستانی/روایی · معرفی محصول/اکسپلینر · (Other: رویداد/اطلاع‌رسانی، شبکه اجتماعی کوتاه) | from topic words, else تبلیغاتی |
| Q3 character (NOT asked any more; inferred from the genre preset, section 6; the user ticks «شخصیت داشته باشد» inside Q4 or says so in free text to override) | n/a | n/a | genre preset |
| Q4 assets | «چه چیزهایی داری یا می‌خواهی؟» | لوگو دارم · تصویر/اسکرین‌شات دارم · متن آماده دارم · شخصیت داشته باشد (multi; ideas are always wanted, no option needed) | none ticked = no logo, no images, ideas wanted, character per preset |
| Q5 display (batch 2) | «تصویرها چطور نمایش داده شوند؟» | 4 styles from section 5 that suit the genre, first = recommended | genre preset |
| Q6 files (batch 2, free text) | «فایل لوگو/تصویرها را در پوشه‌ی inbox بگذار یا مسیرش را بفرست؛ متن آماده را همین‌جا بچسبان.» | n/a | proceed without; placeholders |
Duration is not asked: default 30 s (+12 s short cut first), unless stated. Music is not asked: genre mood (section 4). Music/sound is not asked or started unless the owner asks.

## 3. Claude Code mapping (AskUserQuestion; hard cap 2 calls)
- Batch 1 = ONE call with the missing ones among Q0, Q1, Q2, Q4 (1-4 questions, 2-4 options each; Q1 and Q4 `multiSelect: true`). Q0 goal is ALWAYS first in the call when goal.objective or goal.desiredAction is missing, and it displaces character (Q3 is inferred). The cap stays 4 questions, 2 rounds. Q0 is single select: 3 presets of the parsed (or likely) genre-neutral set plus built-in Other for free text; if the genre is already parsed, offer that genre's preset first. Every question's FIRST option is «خودت تصمیم بگیر (پیش‌فرض)», except Q1/Q4 which are multiSelect: there the built-in "Other" free text accepts «خودت تصمیم بگیر». Q2 lists 3 genres + delegate; the other two genres via "Other". Q4 options: لوگو دارم · تصویر دارم · متن آماده دارم · شخصیت داشته باشد (+ delegate in Other).
- Batch 2 = at most ONE more call, ONLY if Q4 ticked logo or images: Q5 (single select, 3 styles + delegate). In the same message as the call, print Q6 as one plain line (inbox path). Files may arrive later; never block on them, use placeholders.
- If the batch-1 answers delegate everything, skip batch 2.

## 4. Codex mapping (no structured tool): send ONE markdown form, answered inline, once
```
فرم کوتاه (هر جا نمی‌دانی خالی بگذار یا بنویس «خودت تصمیم بگیر»):
0. هدف (اول از همه): یک جمله هدف + بعد از دیدن چه کاری بکنند (متن دکمه/CTA) + مخاطب. مثال: [ ] جذب/ثبت‌نام [ ] آموزش یک ایده [ ] حس و بعد برند [ ] اکسپلینر [ ] اطلاع رویداد [ ] قلاب شبکه اجتماعی ...
1. قاب‌ها: [ ] ۹:۱۶  [ ] ۱:۱  [ ] ۴:۵  [ ] ۱۶:۹
2. جنس: [ ] تبلیغاتی [ ] آموزشی [ ] داستانی [ ] اکسپلینر [ ] رویداد [ ] شبکه اجتماعی کوتاه
3. دارم/می‌خواهم: [ ] لوگو [ ] تصویر [ ] متن آماده [ ] شخصیت (شخصیت پیش‌فرض از جنس موشن است)
4. اگر تصویر داری، نمایش: [ ] موکاپ مرورگر [ ] موکاپ موبایل [ ] پارالاکس [ ] کارت‌های کلاژ [ ] تمام‌قاب با زوم آرام [ ] خودت
5. فایل‌ها: در media/briefs-local/<label>/inbox/ بگذار یا مسیر بده. متن آماده: ...
```
Only the missing rows are included. One reply = done; no second form.

## 5. Assets inbox and display styles
Files go to `media/briefs-local/<label>/inbox/` (git-ignored) or the user gives paths; copy them into the inbox. Logo: SVG = use as is (status `svg`); PNG/JPG = status `raster`, then ask ONE yes/no permission to vectorize into a layered SVG (as done for the emblem); until then use the raster on a transparent plate, never on white. Images: never baked text over them; Persian copy is drawn live.
| display | description | suits |
|---|---|---|
| browser-mockup | website pages scrolling inside a browser frame | اکسپلینر، تبلیغاتی |
| phone-mockup | app/site screens inside a phone, tilt and swipe | اکسپلینر، شبکه اجتماعی |
| parallax | photo cut into 2-3 depth layers, slow camera drift | داستانی، رویداد |
| collage-cards | photos as cards that stack, fan and flip on beat | تبلیغاتی، شبکه اجتماعی |
| full-bleed-push | full-frame photo with slow push-in, text over a scrim | داستانی، رویداد |
| device-frames | laptop + tablet + phone set, same content | معرفی محصول |
| split-reveal | photo revealed through masks/stripes on hits | تبلیغاتی |
| polaroid-timeline | framed photos along a moving timeline | آموزشی، داستانی |

## 6. Genre presets (defaults; 30 s)
| genre id | BPM | scenes /30 s | character | music mood | palette | typography | hook (first 2 s) |
|---|---|---|---|---|---|---|---|
| ad تبلیغاتی | 110-128 | 7-9 | no | upbeat, punchy | brand + one accent, high contrast | heavy display, big numbers | bold claim or price/number slam |
| edu آموزشی | 90-105 | 5-6 | yes (guide object) | calm, curious | light ground, 2 soft hues | clear medium weights, labels | a question |
| story داستانی/روایی | 80-100 | 4-6 | yes | warm, building | narrative, mood-led | restrained, titles only | character in a situation |
| explainer معرفی/اکسپلینر | 100-115 | 6-7 | optional (object) | light tech pulse | brand + neutrals | medium, UI-like | the problem in one line |
| event رویداد/اطلاع‌رسانی | 105-120 | 5-7 | no | festive or formal | event colors, date accent | date/time numbers dominant (LTR runs) | the date + place |
| social شبکه اجتماعی کوتاه (15 s) | 120-135 | 6-8 per 15 s | no | trendy, loop | saturated | very large, few words | motion in frame 0, no logo first |
Anti-slideshow and storytelling rules hold in every genre.

## 6a. Goal presets (objective / desiredAction / successSignal / tone defaults per genre)
| genre | goal preset (objective) | desiredAction | successSignal | tone |
|---|---|---|---|---|
| ad | drive action | do the one thing in the CTA (register, call, buy) | clicks / calls to the CTA target | bold, energetic, direct |
| edu | teach one idea | try or remember the idea | viewer can restate the idea | calm, curious, clear |
| story | evoke one emotion, then name the brand | remember and feel the brand | recall of the emotion + brand name | warm, human, building |
| explainer | make one thing obvious | try or visit the product | viewer can state what it does | clear, light, confident |
| event | inform date, place, action | attend or register | RSVPs / QR scans | festive or formal, precise, inviting |
| social | hook in 2 s | watch to end, share, follow | completion rate, shares | trendy, punchy, loop-friendly |
Presets are only starting points: always fill objective, audience, desiredAction (with CTA text) in one concrete sentence each from the topic; mustSay (<= 5) comes from the user's copy or the topic.

## 7. Decide-for-me path
Fill GOAL FIRST from the genre preset (section 6a) and the topic words, then: ratios all four (9x16 master), duration 30 s (+12 s short cut), genre from topic keywords else `ad`, character per preset, logo `none` (placeholder wordmark from the label), images none, ideas wanted = true (we propose 2 concepts in the plan, choose the first unless told otherwise), copy drafted by us and marked "not reviewed by a native reader", music per preset mood, language fa. Ask NOTHING more; start the pipeline at once, then print:
```
فرض‌ها (برای تغییر، فقط همین را بگو):
- قاب‌ها: ... - مدت: ... - جنس: ... - شخصیت: ... - لوگو/تصویر: ... - متن: ... - موسیقی: ...
```
The assumptions block ALWAYS starts with the goal line («هدف: ... | اقدام مطلوب: ... | مخاطب: ...») before every other assumption. Same block is printed after any intake that used at least one default.

## 8. Brief output
Write `brief.json` (schema fields: label, goal{objective,desiredAction required; audience,successSignal,tone,mustSay,mustNotSay}, language, duration_s, ratios, genre, character, logo{path,status}, images[{path,display}], ideas{wanted,notes}, copy{text,status}, music{mood,track}, deadline, source{mode,rounds}, assumptions[]). The plan log (TEMPLATE.md "Request") and the events contract read it; never paste client material into tracked files.

## 9. Rules
Goal is first-class: brief.json without goal.objective and goal.desiredAction is invalid; every plan, scene and review traces back to them. Label only in tracked files (never the client's real name); never ask permission for routine steps; max 2 interaction rounds total (logo vectorize yes/no counts inside round 2); ask in the user's language; never re-ask a parsed field; files missing = placeholders, not a blocker.

After the brief: initialise the goal memory (docs/motion/GOAL-MEMORY.md, template goal-memory.template.md) and the TODO (todo.template.json) before any craft step.
