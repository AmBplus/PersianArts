// text-column-converge — Persian / RTL localization (original: raycast-teams 28-36s, monospace "NEW <feature>" card).
//
// TEXT (idiomatic UI voice, not word-for-word):
//   NEW -> «جدید»; LAUNCHER DESIGN -> «طراحی لانچر»; COMPACT MODE -> «حالت فشرده»; HOTKEY RECORDER -> «ضبط میان‌بر»;
//   HOTKEY TYPES -> «انواع میان‌بر»; VOICE FEATURES -> «قابلیت‌های صوتی»; SETTINGS DESIGN -> «طراحی تنظیمات»;
//   AI CHAT -> «چت هوش مصنوعی»; FILE SEARCH -> «جستجوی فایل»; RAYCAST -> "Raycast" (brand name stays Latin, isolated with <bdi>);
//   COMING 2026 -> «به‌زودی ۲۰۲۶» (faDigits). All-caps and letterSpacing:3 removed (they break Persian joining).
//
// DIRECTION DECISIONS
//   - MIRRORED: the pinned pair. "جدید" (reading start) is pinned to the RIGHT margin (right edge x=1302); the rotating feature
//     word is pinned by its LEFT edge at x=618 and grows toward the middle, exactly as the Latin word grew leftwards from its
//     right edge. Margins stay equal (618 each side): that equality is the identity of the card.
//   - MIRRORED: the single converge slide. "جدید" slides from right edge 1302 to the centred phrase's right edge, the word slides
//     from left edge 618 to the phrase's left edge; the merged phrase reads right-to-left «جدید Raycast», centred on x=960.
//   - MIRRORED: the closing sub-line aligns to the phrase START edge (right), as the original aligned to the left start.
//   - KEPT: all timing (STEPS durations, START, CONVERGE_DELAY=10, CONVERGE_DUR=36, SUB_DELAY=18, 4f fade), the cubic
//     ease-in-out, colours, hard-cut rotation and zero shrink during the rotation.
//   - ADAPTED: the monospace advance formula (0.6em+spacing per char) cannot be used with a proportional Persian font; the
//     merge endpoint is MEASURED from the real font (hidden probe spans; frame blocked via delayRender until the font is ready)
//     so the two words lock together by exactly one real space: no overlap, no gap.
//   - ADAPTED: italic "COMING 2026" -> Persian has no italic; the sub-line is distinguished by its dimmer colour only.
//
// FONT: Vazirmatn (variable, weight 500 like the original). The original's monospace only mattered for the merge arithmetic;
//   Persian monospace (Vazir Code) looks stretched, so a neutral product-UI face suits this spec-sheet card. Its Latin glyphs
//   cover "Raycast". Size fs(42)=46 (Persian x-height is smaller); line-height 1.5 box re-centred on the original row
//   (top offset -0.25*FS) so the vertical position is unchanged.
// RASTER: none (pure text on a flat background).
import React from 'react';
import {AbsoluteFill, Easing, continueRender, delayRender, interpolate, useCurrentFrame} from 'remotion';
import {FA_LH, FaRoot, fs, faDigits} from '../../../persian/src/demos/_fa';

const FAMILY = 'Vazirmatn';

// word rotation table: uneven dwell in frames (machine rhythm), hard cuts, pinned at the left edge
const STEPS: {word: string; dur: number}[] = [
  {word: 'ثبت حضور', dur: 16},
  {word: 'غیبت‌ها', dur: 12},
  {word: 'گزارش‌ها', dur: 9},
  {word: 'هشدارها', dur: 8},
  {word: 'لیست کلاس', dur: 7},
  {word: 'کارت دانشجو', dur: 8},
  {word: 'آمار زنده', dur: 10},
  {word: 'صندوق ورودی', dur: 12},
  {word: 'دانا', dur: 999}, // last word: once settled triggers the only converge
];
const NEW_TEXT = 'جدید';
const BRAND = 'دانا';
const SUB_TEXT = 'همین امروز در دانا';

const START = 8;
const MARGIN = 618; // equal screen margins (412*1.5), kept
const NEW_RIGHT_EDGE = 1920 - MARGIN; // 1302: "جدید" right edge (mirror of the old NEW left edge 618)
const WORD_LEFT_EDGE = MARGIN; // 618: feature word left edge (mirror of the old right edge 1302)

const FS = fs(42);
const BOX_LH = FA_LH;
const TOP = 519 - Math.round((FS * (BOX_LH - 1)) / 2); // keep the original row centre (lineHeight 1 -> 1.5)
const CONVERGE_DUR = 36;
const CONVERGE_DELAY = 10;
const SUB_DELAY = 18;

const textStyle: React.CSSProperties = {
  fontSize: FS,
  fontWeight: 500,
  letterSpacing: 0,
  textTransform: 'none',
  color: '#f2f2f4',
  whiteSpace: 'nowrap',
  lineHeight: BOX_LH,
  direction: 'rtl',
};

const Word: React.FC<{text: string}> = ({text}) =>
  text === BRAND ? <bdi style={{unicodeBidi: 'isolate'}}>{text}</bdi> : <>{text}</>;

/** Measures the real rendered widths of the final phrase (font dependent); blocks the frame until the font is ready. */
const useWidths = () => {
  const [handle] = React.useState(() => delayRender('tcc-measure'));
  const [phrase, setPhrase] = React.useState<number | null>(null);
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    document.fonts
      .load(`500 ${FS}px "${FAMILY}"`, NEW_TEXT + BRAND + SUB_TEXT)
      .then(() => document.fonts.ready)
      .then(() => {
        setPhrase(ref.current!.getBoundingClientRect().width);
        continueRender(handle);
      });
  }, [handle]);
  const probe = (
    <span ref={ref} style={{...textStyle, position: 'absolute', top: 0, left: 0, visibility: 'hidden'}}>
      {NEW_TEXT} <bdi>{BRAND}</bdi>
    </span>
  );
  return {phrase, probe};
};

export const TextColumnConverge: React.FC = () => {
  const f = useCurrentFrame();
  const t = f - START;
  const {phrase, probe} = useWidths();

  let acc = 0;
  let idx = 0;
  let stepStart = 0;
  for (let i = 0; i < STEPS.length; i++) {
    if (t >= acc) { idx = i; stepStart = acc; }
    acc += STEPS[i].dur;
  }
  const cur = STEPS[idx];
  const isLast = idx === STEPS.length - 1;
  const local = t - stepStart;

  // the only converge: ease-in-out cubic slide, 10f after the last word settles
  const cvT = isLast ? local - CONVERGE_DELAY : -1;
  const cv = interpolate(cvT, [0, CONVERGE_DUR], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const phraseW = phrase ?? 0;
  const mergedRight = 960 + phraseW / 2; // "جدید" right edge once merged
  const mergedLeft = 960 - phraseW / 2; // Raycast left edge once merged
  const newRight = interpolate(cv, [0, 1], [NEW_RIGHT_EDGE, mergedRight]);
  const wordLeft = interpolate(cv, [0, 1], [WORD_LEFT_EDGE, mergedLeft]);

  const converged = cv >= 1;
  const subT = converged ? cvT - CONVERGE_DUR - SUB_DELAY : -1;
  const subOp = interpolate(subT, [0, 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#050506', overflow: 'hidden'}}>
      <FaRoot family={FAMILY}>
        {probe}
        {t >= 0 && phrase !== null && (
          <div style={{position: 'absolute', inset: 0}}>
            {/* "جدید": pinned by its right (start) edge during the rotation */}
            <div style={{...textStyle, position: 'absolute', right: 1920 - newRight, top: TOP}}>{NEW_TEXT}</div>
            {/* feature word: pinned by its left edge, grows toward the middle */}
            <div style={{...textStyle, position: 'absolute', left: wordLeft, top: TOP}}>
              <Word text={cur.word} />
            </div>
            {/* sub-line: aligned to the phrase start (right) edge; no italic in Persian */}
            <div style={{
              ...textStyle, color: '#d8d8dc', position: 'absolute',
              right: 1920 - mergedRight, top: TOP + FS + 14, opacity: subOp,
            }}>
              {SUB_TEXT}
            </div>
          </div>
        )}
      </FaRoot>
    </AbsoluteFill>
  );
};
