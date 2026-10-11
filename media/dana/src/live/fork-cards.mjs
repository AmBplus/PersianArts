// Fork the approved Persian shotcraft cards into work/dana/src/cards for the Dana v3 film.
// Byte-identical copy except the import paths to the shared _fa/_fixtures kits are rewritten
// to reach the sibling work/persian project. Literal-text swaps are applied afterwards with
// edits (logged in fork-log.md), per the Persian render contract (motion fidelity, text only).
import {readFile, writeFile, mkdir} from "node:fs/promises";
import {resolve, join} from "node:path";

const root = resolve(import.meta.dirname);
const cue = JSON.parse(await readFile(join(root, "script/v3/cue-sheet-v31.json"), "utf8"));
const outDir = join(root, "src/cards");
await mkdir(outDir, {recursive: true});

const REWRITES = [
  [/'\.\.\/\.\.\/_fa'/g, "'../../../persian/src/demos/_fa'"],
  [/'\.\.\/\.\.\/_fixtures\//g, "'../../../persian/src/demos/_fixtures/"],
];

// Literal on-screen text swaps (render contract: text only, motion untouched).
// Each entry: [search, replacement, expectedCount]. The script fails loudly if a
// search is missing, so a card edit can never silently drop the Dana copy.
const SWAPS = {
  BrandInkOpen: [
    ["const WORDMARK = 'آزمایشگاه هوش مصنوعی';", "const WORDMARK = 'دانا';", 1],
    ["const KICKER = 'کنسول پژوهشی تیم';", "const KICKER = 'سامانهٔ جامع آموزش';", 1],
  ],
  PaperTitleCard: [
    ["  { text: 'تمام' },", "  { text: 'دانشگاه' },", 1],
    ["  { text: 'پژوهش‌های' },", "  { text: 'آزاد' },", 1],
    ["  { text: 'تیم' },", "  { text: 'اسلامی' },", 1],
    ["  { text: 'شما،' },", "  { text: 'واحد' },", 1],
    ["  { text: 'همه' },", "  { text: 'مشهد', accent: true },", 1],
    ["  { text: 'در' },\n", "", 1],
    ["  { text: 'یک', accent: true },\n", "", 1],
    ["  { text: 'جا.' },\n", "", 1],
    ["const SUB = 'از ۳۱ مورد امروز دریافت شد';", "const SUB = 'سال حضور در کنار دانشجو';", 1],
    ["const SUB_DIGITS = '۵';", "const SUB_DIGITS = '۷';", 1],
  ],
  MarkerUnderlineTitle: [
    ["\n              جدید\n", "\n              دانا\n", 1],
    ["<div><bdi>Notion AI</bdi></div>", "<div>همهٔ دانشگاه، یک‌جا</div>", 1],
  ],
  MarkerUnderlineTitle2: [
    ["با{' '}", "به همه‌چیز{' '}", 1],
    ["\n              جدید\n", "\n              متصل\n", 1],
    ["آشنا شوید", "شوید", 2],
    ["<div><bdi>Notion AI</bdi></div>", "<div>سامانه دانا</div>", 1],
  ],
  BlurSlide: [
    ["const H1_WORDS = 'تیتر شما اینجا می‌نشیند'.split(' ');", "const H1_WORDS = 'آموزشِ امروز، دانشگاهِ فردا'.split(' ');", 1],
    ["const H2_WORDS = 'زیرعنوان کوتاه برای متن نمونه'.split(' ');", "const H2_WORDS = 'سامانهٔ جامع آموزش دانشگاه آزاد اسلامی واحد مشهد'.split(' ');", 1],
  ],
  LeadWordZoomAssemble: [
    ["const TEXT = 'معرفی لومن دک';", "const TEXT = 'به فردا خوش آمدید';", 1],
    ["const HIGHLIGHT_WORD = 'لومن';", "const HIGHLIGHT_WORD = 'فردا';", 1],
    ["const SUBLINE = 'یک کارت نما، یک دستور حرکت — کپی، جای‌گذاری، رندر.';", "const SUBLINE = 'هر کلاس، یک قدم به آینده';", 1],
  ],
  SegmentedThumbHero: [
    ["<span>پرسش</span>", "<span>حضوری</span>", 1],
    [">رایانه</span>", ">مجازی</span>", 1],
  ],
  ListReveal: [
    ["const LABELS = ['پیش‌خوان', 'پروژه‌ها', 'تحلیل‌ها', 'پیام‌ها', 'تنظیمات', 'خروج از حساب'];", "const LABELS = ['کلاس زنده', 'ضبط و بازپخش', 'حضور و غیاب', 'آزمون', 'کارنامه', 'داشبورد'];", 1],
  ],
  OdometerDigitRoll: [
    ["const DIGITS = [9, 9, 9, 8];", "const DIGITS = [1, 8, 0, 0];", 1],
    ['<StaticGlyph ch="٪" color={inkNow} />', '<<StaticGlyph ch="از ۲۰" color={inkNow} w={210} scale={0.26} />'.replace("<<", "<"), 1],
  ],
  SplitFlapFlip: [
    ["const TEXT = 'زودتر ارسال کن';", "const TEXT = '۱۴۰۵';", 1],
    // ارقام فارسی چپ‌به‌راست نوشته می‌شوند؛ ردیفِ راست‌چینِ کارت آن‌ها را برعکس می‌چیند.
    // برای متنِ فقط-رقم، ترتیب خانه‌ها معکوس می‌شود تا ترتیب دیداری درست باشد (حرکت دست‌نخورده).
    ["const GROUPS = joinedGroups(TEXT);", "const GROUPS = /^[\\u06F0-\\u06F9\\s]+$/.test(TEXT) ? joinedGroups(TEXT).slice().reverse() : joinedGroups(TEXT);", 1],
  ],
  FlyingWords: [
    ["const WORDS = ['حرکت', 'چیدمان', 'دوربین', 'آبشاری', 'روانی', 'ضرب', 'کلیدفریم', 'محو',\n  'مقیاس', 'تبدیل', 'چرخش', 'پارالاکس', 'شفافیت', 'عمق', 'میان‌یابی', 'حلقه',\n  'فنر', 'تأخیر', 'ظهور', 'ترکیب', 'شبکه', 'محور'];", "const WORDS = ['کلاس', 'زنده', 'ضبط', 'بازپخش', 'حضور', 'غیاب', 'آزمون', 'کارنامه',\n  'گزارش', 'داشبورد', 'اتصال', 'آرشیو', 'دانشجو', 'استاد', 'درس', 'ترم',\n  'نمره', 'ساعت', 'صبر', 'دقت', 'دانا', 'آینده'];", 1],
  ],
  SpectrumMorphUi: [
    ["هفتهٔ عرضه", "یک سامانه، همهٔ دانشگاه", 2],
  ],
  CelFlashStomp: [
    ["{ text: 'منتشر کن', start: 0, end: 30,", "{ text: 'سامانهٔ دانا', start: 0, end: 30,", 1],
    ["{ text: 'سریع‌تر', start: 30, end: 60,", "{ text: 'هم‌زمان', start: 30, end: 60,", 1],
    ["{ text: 'امروز', start: 60, end: 9999,", "{ text: 'آنلاین', start: 60, end: 9999,", 1],
  ],
  GradientWordSweep: [
    ["فوق‌شارژ", "بازپخش", 9],
    ["<span>در عملکرد</span>", "<span>هر زمان</span>", 1],
    ["با اطمینانی استوار", "کلاس زنده، بی‌وقفه", 3],
  ],
  TextColumnConverge: [
    ["  {word: 'طراحی لانچر', dur: 16},", "  {word: 'ثبت حضور', dur: 16},", 1],
    ["  {word: 'حالت فشرده', dur: 12},", "  {word: 'غیبت‌ها', dur: 12},", 1],
    ["  {word: 'ضبط میان‌بر', dur: 9},", "  {word: 'گزارش‌ها', dur: 9},", 1],
    ["  {word: 'انواع میان‌بر', dur: 8},", "  {word: 'هشدارها', dur: 8},", 1],
    ["  {word: 'قابلیت‌های صوتی', dur: 7},", "  {word: 'لیست کلاس', dur: 7},", 1],
    ["  {word: 'طراحی تنظیمات', dur: 8},", "  {word: 'کارت دانشجو', dur: 8},", 1],
    ["  {word: 'چت هوش مصنوعی', dur: 10},", "  {word: 'آمار زنده', dur: 10},", 1],
    ["  {word: 'جستجوی فایل', dur: 12},", "  {word: 'صندوق ورودی', dur: 12},", 1],
    ["  {word: 'Raycast', dur: 999},", "  {word: 'دانا', dur: 999},", 1],
    ["const BRAND = 'Raycast';", "const BRAND = 'دانا';", 1],
    ["const SUB_TEXT = `به‌زودی ${faDigits(2026)}`;", "const SUB_TEXT = 'همین امروز در دانا';", 1],
  ],
  CountdownArcScatter: [
    ["{ text: 'دقیقه', mr: 11, win: [0.54, 0.68] },", "{ text: 'ثانیه', mr: 11, win: [0.54, 0.68] },", 1],
    ["{ text: 'نصب', mr: 0, win: [0.7, 0.9] },", "{ text: 'آزمون', mr: 0, win: [0.7, 0.9] },", 1],
  ],
  OutlineWordFill: [
    ["سریع‌تر", "دانا", 5],
  ],
  IntegrationHubMap: [
    ["  { icon: '#4a9fd8', title: 'معامله سازمانی فصل سوم', sub: 'درآمد · پایپ‌لاین · سهمیه فصل سوم' },", "  { icon: '#4a9fd8', title: 'معاونت آموزشی', sub: 'درخواست · تأیید · گزارش' },", 1],
    ["  { icon: '#4a9fd8', title: 'حساب سازمانی بزرگ – بریتانیا', sub: 'درآمد · MQL · بین‌الملل' },", "  { icon: '#4a9fd8', title: 'ادارهٔ امتحانات', sub: 'برگزاری · تصحیح · کارنامه' },", 1],
    ["  { icon: '#34a853', title: 'ارائه فروش سازمانی', sub: 'باز کردن در GDrive' },", "  { icon: '#34a853', title: 'سامانهٔ مالی', sub: 'شهریه · پرداخت · تسویه' },", 1],
    ["  { icon: '#a259ff', title: 'طراحی فرم سرنخ MQL', sub: 'فایل Figma · آخرین ویرایش' },", "  { icon: '#a259ff', title: 'کتابخانهٔ دیجیتال', sub: 'منبع · جستجو · امانت' },", 1],
    ["  { icon: '#f2c744', title: 'فروش سازمانی', sub: 'فضای ClickUp' },", "  { icon: '#f2c744', title: 'ادارهٔ دانشجویی', sub: 'پرونده · درخواست · پیگیری' },", 1],
    ["  { icon: '#9a9a98', title: 'بایگانی بسته‌شده سازمانی', sub: 'بایگانی‌شده · در فروش سازمانی' },", "  { icon: '#9a9a98', title: 'آرشیو آزمون‌ها', sub: 'آرشیو · جستجو · بازنشر' },", 1],
    ["  { icon: '#c8c8c6', title: 'سرنخ سازمانی باز – پیگیری', sub: 'در حال انجام · در فروش سازمانی · دیروز' },", "  { icon: '#c8c8c6', title: 'گزارش‌های مدیریتی', sub: 'در حال تولید · داشبورد · دیروز' },", 1],
    ["['همه', 'کارها', 'اسناد', 'وایت‌بردها', 'داشبوردها', 'فایل‌ها', 'گفتگو', 'افراد']", "['همه', 'کلاس‌ها', 'آزمون‌ها', 'کارنامه‌ها', 'داشبوردها', 'فایل‌ها', 'گفتگو', 'افراد']", 1],
    ["['واگذارشده به من', 'ساخته‌شده توسط من']", "['در حال برگزاری', 'برنامه‌ریزی‌شده']", 1],
    ["['باز', 'بسته', 'بایگانی‌شده']", "['فعال', 'پایان‌یافته', 'آرشیو']", 1],
    ["['درآمد', 'پایپ‌لاین', 'سهمیه فصل سوم']", "['دانشجو', 'آزمون', 'گزارش']", 1],
  ],
  ValueStaggerGradient: [
    ["? 'ورود: تأخیر پلکانی + گرادیان در مقادیر'", "? '۱۱۵٬۹۳۱ آزمون برگزارشده در سال'", 1],
    [": 'نبض: پلکانی از مرکز، بیشینهٔ دامنه در میانه'", ": 'در ۱۴٬۶۴۱ کد آزمونی — واحد مشهد'", 1],
  ],
};

const done = [];
const log = [];
for (const stop of cue.stops) {
  if (stop.src.startsWith("NEW")) continue;
  const srcPath = resolve(root, "../persian/src/demos", stop.src);
  let code = await readFile(srcPath, "utf8");
  for (const [re, to] of REWRITES) code = code.replace(re, to);
  code = code.replace(/\r\n/g, "\n"); // source cards mix CRLF/LF; swaps match on LF
  const swaps = SWAPS[stop.card] ?? [];
  for (const [from, to, want] of swaps) {
    const parts = code.split(from);
    const got = parts.length - 1;
    if (got !== want) throw new Error(`${stop.card}: expected ${want} hits for ${JSON.stringify(from).slice(0, 60)}, got ${got}`);
    code = parts.join(to);
    log.push(`- ${stop.card}: ${from.length > 70 ? from.slice(0, 70) + "…" : from} → ${to.length > 70 ? to.slice(0, 70) + "…" : to} (${want}×)`);
  }
  const outFile = join(outDir, stop.card + ".tsx");
  await writeFile(outFile, code, "utf8");
  done.push({id: stop.id, card: stop.card, swaps: swaps.length});
}
await writeFile(join(root, "script/v3/fork-log.md"), `# فرک‌های کارت‌های فارسی برای دانا v3\n\nکپی بایت‌به‌بایت + فقط تعویض متن literal (قرارداد رندر) + اصلاح مسیر ایمپورت _fa/_fixtures.\n\n${log.join("\n")}\n`, "utf8");
console.log(JSON.stringify({forked: done.length, swaps: done.reduce((a, d) => a + d.swaps, 0)}, null, 1));
