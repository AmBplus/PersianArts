// document-typewriter-reveal — Persian / RTL localization.
//
// WHAT CHANGED (analysis, element by element)
// TEXT: the original page was a baked screenshot (textures/live/wbr-full.png) full of Chinese/English UI text.
//   A screenshot cannot be translated, so it is REPLACED by a real DOM page (Page.tsx) with natural Persian
//   product wording: brand/nav, weeks sidebar ("گزارش‌های هفتگی", search, current week), doc header (Jalali date
//   ۱۹ تیر for 7月10日), toolbar, comments rail, and the 20 document blocks (headline, digest heading, member
//   headings, 15 bullets). Mock person names are transliterated (جکی، لین، مارکو، یوکی، پریا); technical tokens
//   (cascade, drift, ASR, WER, CI, LR schedule, run-47, v2, W26) stay Latin inside <bdi> isolates; digits Persian.
//   Bullet line counts keep the original geometry (blocks 2 and 5 wrap to two lines, the rest are one line).
// SHAPING: no letterSpacing / uppercase anywhere (the mono uppercase tracked kicker became a plain Persian
//   label); typing is NOT per-letter: the original reveal is a paper-coloured wipe mask over finished text,
//   which is shaping-safe, so the mechanism is kept as is. Line-height is pinned to each block's 27.19px row.
// DIRECTION (mirrored unless noted):
//   - page: weeks sidebar left->right (x=1920-x-w), comments rail right->left, brand/nav to the right, toolbar
//     order and undo/redo arrows mirrored, collapse chevrons swapped, avatar + minimap dots to the left.
//   - text column mirrored around the page centre (x' = W - x - w), text right-aligned, bullets on the right.
//   - writing wipe: mask now anchored LEFT and shrinks right->left, the amber caret rides the front moving right
//     to left (reading direction). li masks over-cover the bullet side (right) by 28px as originally on the left.
//   - @-mention wash grows from the right (start) edge of the name.
//   - rail entrance: patch shrinks downward (vertical = kept); inner amber line moves to the inner edge of each
//     mirrored rail (weeks rail: its left edge, comments rail: its right edge). Cues 46/54 keep: weeks rail first.
//   - past weeks still drop from above (gravity, kept) into the mirrored (right) rail; date sits at the left of row.
//   - camera: cx mirrored (1920-cx) so the title close-up and the settle frame keep the same relation; zoom kept.
//   - KEPT: all timing, cues (6 + 3.5*g), wipe 8f, easings, caret/wash timing, drop spring, 110f.
// FONT: Vazirmatn (neutral product/document UI, variable weights 500-800, full Persian digits/ZWNJ).
// RASTER: wbr-full.png no longer used (baked foreign text); rebuilt as DOM, avatar "V" kept as a Latin initial.
import React from 'react';
import { interpolate, useCurrentFrame, Easing } from 'remotion';
import { FaRoot, faText, faDigits } from '../../_fa';
import { Cam, CamKey } from './Cam';
import { Chrome, WeeksRail, CommentsRail, Bidi, PAPER, AMBER, AMBER_WASH, INK } from './Page';
import layout from '../../_textures/live-layout.json';

export const DOCUMENT_TYPEWRITER_REVEAL_DURATION = 110;

type Block = { x: number; y: number; w: number; h: number; tag: string };
const blocks = layout.wbr.blocks as Block[];
const leftRail = layout.wbr.leftRail;
const rightRail = layout.wbr.rightRail;
const PAGE_H = layout.wbr.pageH;
const W = 1920;
// mirrored rails (weeks sidebar was left, comments rail was right)
const WEEKS = { x: W - leftRail.x - leftRail.w, y: leftRail.y, w: leftRail.w, h: leftRail.h };
const COMMENTS = { x: W - rightRail.x - rightRail.w, y: rightRail.y, w: rightRail.w, h: rightRail.h };

const CAM_KEYS: CamKey[] = [
  { frame: 0, cx: W - 920, cy: 280, zoom: 1.25 },
  { frame: 22, cx: W - 920, cy: 310, zoom: 1.21 },
  { frame: 64, cx: 960, cy: 540, zoom: 0.997 },
  { frame: 78, cx: 960, cy: 540, zoom: 1.003 },
  { frame: 102, cx: 960, cy: 540, zoom: 0.995 },
];

const REVEAL_EASE = Easing.bezier(0.4, 0, 0.6, 1);
const cueFor = (i: number) => 6 + Math.floor(i / 2) * 3.5;
const WIPE = 8;

// Persian content per block index (same order/tags as the layout)
const TEXT: string[] = [
  'هفتهٔ ۲۸ ۲۰۲۶ · گزارش هفتگی آزمایشگاه بنیان',
  'خلاصهٔ جکی',
  'این هفته هر سه خط اصلی به نقطه‌ای رسید که می‌شود تصمیم گرفت: نرخ پذیرش cascade، پیش‌دستی drift و گسترش داده‌ی ASR؛ بازبینی جمعه یکی‌یکی انجام می‌شود.',
  'یادآوری: الگوی جدید یادداشت آزمایش (نسخهٔ ۲) فعال شد؛ آزمایش‌های تازه را با سرصفحهٔ جدید بایگانی کنید.',
  'لین',
  'هشدار زودهنگام drift حسگر: حذف patch-length روی داده‌های تولیدی held-out همگرا شد و transformer کوچک با ۳٫۱× پیش‌دستی از خط پایهٔ rolling-stats جلو افتاد.',
  'آستانه‌ها با تیم ops هماهنگ شد؛ هفتهٔ بعد حلقهٔ بازخورد وصل می‌شود.',
  'ریسک: دستهٔ تیرماه در داده‌های برچسب‌خورده کمبود دارد؛ درخواست جمع‌آوری مکمل ثبت شد.',
  'مارکو',
  'agent loop در nano-lab اجرای run-47 را تمام کرد: LR schedule پیشنهادی خودکار ۱٫۸ امتیاز از خط پایهٔ دستی بهتر بود.',
  'Follow-up RQ شکسته شد: تعمیم‌پذیری schedule در ۲ اندازهٔ داده.',
  'هفتهٔ بعد: علت‌یابی شکست‌های proposer را در یادداشت آزمایش می‌نویسیم.',
  'یوکی',
  'cascade مبتنی بر اطمینان: پس از واسنجی آستانهٔ مسیریابی، نرخ پذیرش مدل کوچک ۶۲٪ ← ۷۱٪ شد و کیفیت سرتاسری ثابت ماند.',
  'Self-healing CI triage: مسیریابی failure-aware در آزمایش مرحله‌ای، خطای ارجاع را ۴۰٪ کاهش داد.',
  'نیازمند بحث: آیا واسنجی اطمینان cascade ارزش یک پروژهٔ جداگانه را دارد؟',
  'پریا',
  'ASR مقاوم به گویش: پس از افزایش داده‌ی ترکیبی، WER گویش‌های کم‌منبع ۱۲٪ بهبود یافت؛ نسبت augmentation در حال تنظیم است.',
  'رادار مقاله‌ها: ۳ مقاله دربارهٔ drift/attention دنبال شد که یکی مستقیم برای پروژهٔ sensor قابل استفاده است.',
  'هفتهٔ بعد: مجموعهٔ ارزیابی v2 را مرتب می‌کنیم و کارت نتیجهٔ ۱۳ آزمایش را بایگانی می‌کنیم.',
];
const HL: Record<number, string> = { 5: '۳٫۱× پیش‌دستی', 13: '۶۲٪ ← ۷۱٪' };
// widths of the Persian heading texts (headings are shorter/longer than the Latin originals)
const HEAD_W: Record<number, number> = { 0: 560, 1: 170, 4: 44, 8: 78, 12: 66, 16: 62 };
const widthOf = (p: Block, i: number) => (p.tag === 'li' ? p.w : HEAD_W[i] ?? p.w);
const rowH = (p: Block) => (p.h > 40 ? p.h / 2 : p.h);

const PAST_WEEKS = [
  { week: 'هفتهٔ ۲۷ ۲۰۲۶', date: '۱۲ تیر' },
  { week: 'هفتهٔ ۲۶ ۲۰۲۶', date: '۵ تیر' },
  { week: 'هفتهٔ ۲۵ ۲۰۲۶', date: '۲۹ خرداد' },
  { week: 'هفتهٔ ۲۴ ۲۰۲۶', date: '۲۲ خرداد' },
  { week: 'هفتهٔ ۲۳ ۲۰۲۶', date: '۱۵ خرداد' },
  { week: 'هفتهٔ ۲۲ ۲۰۲۶', date: '۸ خرداد' },
];
const WEEK_Y0 = 228;
const WEEK_H = 56;
const WEEK_CUE = (i: number) => 58 + i * 5;
const WEEK_DROP = Easing.bezier(0.2, 1.15, 0.3, 1);

// member-name headings (tag=h2) get the @-mention amber wash; the pinned digest heading (first h2) does not.
const memberH2 = new Set<number>();
{
  let seenH2 = 0;
  blocks.forEach((b, i) => {
    if (b.tag === 'h2' && seenH2++ > 0) memberH2.add(i);
  });
}

const textStyle = (p: Block): React.CSSProperties =>
  p.tag === 'h1' ? faText(25, { fontWeight: 800, color: INK, lineHeight: 1.0 })
  : p.tag === 'h2' ? faText(18, { fontWeight: 700, color: INK, lineHeight: 1.0 })
  : faText(17, { color: '#1f2937', lineHeight: `${rowH(p)}px`, fontWeight: 400 });

export const DocumentTypewriterReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const kick = interpolate(frame, [8, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  let caretIdx = -1;
  blocks.forEach((_, i) => {
    if (frame >= cueFor(i) && frame <= cueFor(i) + WIPE + 2) caretIdx = i;
  });

  return (
    <FaRoot family="Vazirmatn" style={{ background: PAPER }}>
      <Cam pageH={PAGE_H} keys={CAM_KEYS} bg={PAPER}>
        <Chrome />
        <WeeksRail {...WEEKS} />
        <CommentsRail {...COMMENTS} />

        {/* the finished document text, mirrored: right edge of block = W - original left */}
        {blocks.map((p, i) => {
          const w = widthOf(p, i);
          const right = W - p.x;
          return (
            <div key={`t${i}`} style={{ position: 'absolute', left: right - w, top: p.y, width: w, height: p.h, display: 'flex', alignItems: p.tag === 'li' ? 'flex-start' : 'center' }}>
              {p.tag === 'li' ? <span style={{ position: 'absolute', insetInlineStart: -22, top: 0, lineHeight: `${rowH(p)}px`, fontSize: 17, color: '#1f2937' }}>•</span> : null}
              <div style={{ ...textStyle(p), width: '100%', textAlign: 'start' }}><Bidi text={TEXT[i]} hl={HL[i]} /></div>
            </div>
          );
        })}

        {blocks.map((p, i) => {
          const cue = cueFor(i);
          const coverT = interpolate(frame, [cue, cue + WIPE], [1, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: REVEAL_EASE,
          });
          const w = widthOf(p, i);
          const startPad = p.tag === 'li' ? 28 : 4; // over-cover on the start (right) side: bullet / glyph overhang
          const bw = w + (p.tag === 'li' ? 34 : 10);
          const bx = W - p.x + startPad - bw; // mirrored box left
          const by = p.y - 3;
          const bh = p.h + 6;
          const caretX = bx + bw * coverT;
          const caretH = Math.min(20, p.h - 2);
          const nameCue = cue + WIPE + 4;
          const nameGrow = memberH2.has(i)
            ? interpolate(frame, [nameCue, nameCue + 8], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
              })
            : 0;
          const washW = (w + 8) * nameGrow;

          return (
            <div key={i}>
              {nameGrow > 0 ? (
                <div
                  style={{
                    position: 'absolute', left: W - (p.x - 3) - washW, top: p.y - 1,
                    width: washW, height: p.h + 2,
                    background: AMBER_WASH, opacity: 0.7, borderRadius: 3, pointerEvents: 'none',
                  }}
                />
              ) : null}

              {coverT > 0 ? (
                <div style={{ position: 'absolute', left: bx, top: by, width: bw, height: bh, overflow: 'hidden', pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${coverT * 100}%`, background: PAPER }} />
                </div>
              ) : null}

              {i === caretIdx ? (
                <div
                  style={{
                    position: 'absolute', left: caretX - 2, top: p.y + (p.h - caretH) / 2,
                    width: 2, height: caretH, background: AMBER,
                    opacity: coverT > 0 ? 1 : interpolate(frame, [cue + WIPE, cue + WIPE + 2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                    pointerEvents: 'none',
                  }}
                />
              ) : null}
            </div>
          );
        })}

        {/* side-rail entrances: paper patch shrinks downward = rail revealed (vertical, kept) */}
        {[
          { rail: WEEKS, cue: 46, inner: 'left' as const },
          { rail: COMMENTS, cue: 54, inner: 'right' as const },
        ].map(({ rail, cue, inner }, i) => {
          const t = interpolate(frame, [cue, cue + 10], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
          });
          const lineFade = interpolate(frame, [cue + 10, cue + 24], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={`rail${i}`}>
              {t < 1 ? (
                <div style={{ position: 'absolute', left: rail.x, top: rail.y + rail.h * t, width: rail.w, height: rail.h * (1 - t), background: PAPER, pointerEvents: 'none' }} />
              ) : null}
              {frame >= cue && lineFade > 0 ? (
                <div
                  style={{
                    position: 'absolute',
                    left: inner === 'left' ? rail.x : rail.x + rail.w - 1.5,
                    top: rail.y, width: 1.5, height: rail.h * t,
                    background: AMBER, opacity: lineFade, pointerEvents: 'none',
                  }}
                />
              ) : null}
            </div>
          );
        })}

        {/* past weeks drop into the (right) weeks rail from above, stacking in order */}
        {PAST_WEEKS.map((w, i) => {
          const cue = WEEK_CUE(i);
          if (frame < cue) return null;
          const t = interpolate(frame, [cue, cue + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: WEEK_DROP });
          const appear = interpolate(frame, [cue, cue + 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const air = Math.max(0, 1 - t);
          const no = 27 - i;
          return (
            <div
              key={w.week}
              style={{
                position: 'absolute', left: WEEKS.x + 4, top: WEEK_Y0 + i * WEEK_H,
                width: WEEKS.w - 8, height: WEEK_H,
                transform: `translateY(${-44 * air}px)`, opacity: appear,
                boxShadow: air > 0.02 ? `0 ${10 * air}px ${20 * air}px rgba(30,25,18,${0.16 * air})` : 'none',
                background: PAPER, borderBottom: '1px solid rgba(31,41,55,0.07)',
                padding: '8px 10px 0', boxSizing: 'border-box', pointerEvents: 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={faText(12, { fontWeight: 500, color: '#1f2937' })}>{w.week}</span>
                <span style={faText(9, { color: '#9ca3af' })}>{w.date}</span>
              </div>
              <div style={faText(10, { marginTop: 2, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })}>
                {`هفتهٔ ${faDigits(no)} · گزارش هفتگی آزمایشگاه`}
              </div>
            </div>
          );
        })}
      </Cam>

      {/* screen-space kicker: moved from top-right to top-left (page header now starts at the right) */}
      <div
        style={{
          position: 'absolute', top: 14, left: 96, textAlign: 'start',
          ...faText(20, { fontWeight: 500, color: 'oklch(50% 0.006 82)' }),
          opacity: kick, pointerEvents: 'none',
        }}
      >
        خلاصهٔ هفتگی · هفتهٔ {faDigits(28)}
      </div>
    </FaRoot>
  );
};
