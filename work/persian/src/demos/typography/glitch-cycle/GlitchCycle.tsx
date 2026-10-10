// PERSIAN (RTL) localization of "glitch-cycle" -- motion, timing, seeds, KF curves untouched; text, direction, font adapted.
// TEXT: the four status phrases become natural Persian product/build status lines of similar length:
//   INITIALIZING -> «در حال راه‌اندازی», LOADING ASSETS -> «بارگذاری منابع», COMPILING SHADERS -> «کامپایل شیدرها», READY TO SHIP -> «آماده انتشار».
// GLITCH UNIT: the original rolls one dice per Latin character slot. Persian letters join, so a per-letter swap would tear the
//   word into isolated forms and the "slot" idea fails. The unit is the JOINED GROUP (joinedGroups). A group's hit probability is
//   1-(1-g)^len so the expected corrupted-letter density equals the original's per-character g. A hit group shows noise glyphs
//   (symbols, Persian digits and the non-joining letters ا د ر ز و, each its own span so nothing joins) in the same cell:
//   the cell is sized by the true group (invisible clone), the noise is centred over it, so the line never reflows (= fixed slots).
// LAYOUT: all phrases are stacked in one grid cell (hidden ones visibility:hidden) so the row width = widest phrase, as MAXCH did;
//   phrase is start-aligned (RIGHT in RTL), so shorter phrases leave empty space on the left (mirror of original's left-aligned pad).
// DIRECTION: row is direction:rtl (first word right-most); RGB split mirrored (red fringe on the right/start side, cyan on the left);
//   progress bar fills from the right edge (reading direction) via insetInlineStart/right anchor. KEPT: random jitter jx/jy (symmetric noise,
//   no direction meaning), centred composition, bar position (centre), colours, the dark scene.
// SHAPING: letterSpacing 0 (original 3px would break joining), no uppercase. FONT: Vazir Code (monospace-flavoured Persian, matches the
//   machine/terminal voice of the original SF Mono); single weight, no fake bold. Size fs(26)=29 (x1.1). Line-height FA_LH.
// RASTER: none. BEATS: 4 x 42f per phrase unchanged; shorter/longer strings do not change any beat.
// (original notes) glitch probability keyframes [1,0,0,0.1,0,0,1]; last phrase ends at 0 so t=1 is clean; design coords 480x270.
import React from 'react';
import { DesignStage, lerp, rand, useT } from '../../_fixtures/Motion';
import { FaRoot, fs, FA_LH, joinedGroups, faText } from '../../_fa';

export const GLITCH_CYCLE_DURATION = 168; // 5600ms @30fps

const PHRASES = ['در حال راه‌اندازی', 'بارگذاری منابع', 'کامپایل شیدرها', 'آماده انتشار'];
// noise glyphs: symbols + Persian digits + non-joining letters (each rendered as its own span -> never joins)
const POOL = Array.from('#$%&<>/\\۰۱۲۳۴۵۶۷۸۹ادرزوژ');
const KF = [1, 0, 0, 0.1, 0, 0, 1];
const KF_LAST = [1, 0, 0, 0.1, 0, 0, 0];

const glitchAt = (kf: number[], p: number) => {
  const segs = kf.length - 1;
  const x = Math.min(segs - 1e-6, Math.max(0, p * segs));
  const i = Math.floor(x);
  return lerp(x - i, kf[i], kf[i + 1]);
};

const GROUPS = PHRASES.map((p) => {
  // group list with word gaps kept; ZWNJ-split groups are re-joined visually by rendering ZWNJ between them
  const out: { g: string; zw: boolean }[] = [];
  let rest = p;
  for (const g of joinedGroups(p)) {
    const idx = rest.indexOf(g);
    const skipped = rest.slice(0, idx);
    rest = rest.slice(idx + g.length);
    out.push({ g, zw: skipped.includes('‌') });
  }
  return out;
});

export const GlitchCycle: React.FC = () => {
  const t = useT();
  const N = PHRASES.length;
  const slot = Math.min(N - 1, Math.floor(t * N));
  const p = t * N - slot;
  const g = glitchAt(slot === N - 1 ? KF_LAST : KF, p);
  const frame = Math.floor(t * 168);
  const bucket = Math.floor(frame / 2);
  const jx = (rand(bucket * 5 + slot) - 0.5) * g * 10;
  const jy = (rand(bucket * 9 + slot + 40) - 0.5) * g * 4;

  const renderPhrase = (pi: number) => {
    const units = GROUPS[pi];
    return units.map((u, i) => {
      if (u.g === ' ') return <span key={i}>{' '}</span>;
      const len = [...u.g].length;
      const hitP = 1 - Math.pow(1 - g, len);
      const hit = pi === slot && rand(i * 31 + bucket * 17 + slot * 97) < hitP;
      const base = (
        <span style={{ visibility: hit ? 'hidden' : 'inherit', color: '#dfe6f5' }}>{u.g}</span>
      );
      return (
        <React.Fragment key={i}>
          {u.zw ? '‌' : null}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            {base}
            {hit && (
              <span
                dir="ltr"
                style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  direction: 'ltr', unicodeBidi: 'isolate', whiteSpace: 'nowrap',
                  color: rand(i + bucket) > 0.5 ? '#6c8cff' : '#4a5270',
                }}
              >
                {Array.from({ length: Math.max(1, len - 1) }, (_, k) => (
                  <span key={k} style={{ minWidth: '0.5em', textAlign: 'center' }}>
                    {POOL[Math.floor(rand(i * 131 + k * 17 + bucket * 7 + slot * 13) * POOL.length)]}
                  </span>
                ))}
              </span>
            )}
          </span>
        </React.Fragment>
      );
    });
  };

  return (
    <DesignStage bg="#0a0b10">
      <FaRoot family="Vazir Code">
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0b10' }}>
          <div
            style={{
              display: 'grid',
              justifyItems: 'start', // start = right edge in RTL
              ...faText(26, { unicodeBidi: 'isolate' }),
              lineHeight: FA_LH,
              whiteSpace: 'nowrap',
              color: '#dfe6f5',
              transform: `translate(${jx}px,${jy}px)`,
              // RGB split mirrored: red fringe on the start (right) side, cyan on the left
              textShadow:
                g > 0.04
                  ? `${-g * 3}px 0 rgba(255,60,90,${g * 0.8}), ${g * 3}px 0 rgba(60,220,255,${g * 0.8})`
                  : 'none',
            }}
          >
            {PHRASES.map((_, pi) => (
              <div key={pi} style={{ gridArea: '1 / 1', visibility: pi === slot ? 'visible' : 'hidden' }}>
                {renderPhrase(pi)}
              </div>
            ))}
          </div>
        </div>
        {/* bottom thin progress bar: fills from the right (reading direction) */}
        <div
          style={{
            position: 'absolute', left: '50%', top: '63%', width: 120, height: 2, marginLeft: -60,
            background: '#232840', borderRadius: 1, overflow: 'hidden', direction: 'rtl',
          }}
        >
          <div style={{ height: '100%', width: `${t * 100}%`, background: '#6c8cff', marginInlineStart: 0 }} />
        </div>
      </FaRoot>
    </DesignStage>
  );
};
