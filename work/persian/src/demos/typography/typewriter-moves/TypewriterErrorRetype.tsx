// PERSIAN (RTL) localization of "typewriter-error-retype" -- three speeds (type 2f / delete 1.5f / retype 1.5f),
// pause 16f with the cursor blinking twice, cursor states, and the 150f length are all unchanged.
// Text (idiomatic, not literal):  "just a dashboard" -> "فقط یک داشبورد"  ->  "فقط مرکز فرماندهی شما".
//   The original keeps "just " and replaces "a dashboard" with "your command center" (result: "just your command center");
//   the Persian keeps "فقط " and replaces "یک داشبورد" with "مرکز فرماندهی شما" -- same structure, same dramatic turn.
//   Counts changed (16/11/19 chars -> 14/10/17), so the beat grid was preserved by moving the start frame:
//   T1 2 -> 6 gives the same pause start (f32), delete start (f48), retype start (f68); delete ends f63 (orig 64.5);
//   retype ends f92 (orig 95); blink cycles identical (5f halves) and the cursor goes out at f112 (orig 115). Static tail 38f.
// Direction decisions:
//  - Text is anchored at the START edge (right), growing leftwards; backspace eats from the left end: the typing
//    direction follows reading direction. The row is centred via an invisible full-width sizer (the final sentence), so
//    the finished line is centred exactly like the original and nothing shifts while typing (the original's "no reflow" rule).
//  - The cursor stands at the typing edge = left of the last letter (inline after the text, marginInlineStart).
//  - Original used one fixed-width span per char (58px). Persian letters join, so per-glyph boxes would break shaping:
//    instead the text is a single prefix slice (typeOn semantic) and the start edge is pinned, which gives the same "no jitter" guarantee.
//  - Font: Vazirmatn 700 (variable, real bold). Vazir Code was tried first (typewriter mood) but its monospaced Persian joins
//    show stretched kashida-like gaps and a thin single weight (no fake bold); Vazirmatn Bold matches the original's Courier Bold
//    weight, and the typewriter feel is carried by the cadence and cursor. Size 112*1.1 so the line fills ~the same width as the original.
//    No letterSpacing/uppercase.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, FA_LH } from '../../_fa';

const TEXT1 = 'فقط یک داشبورد'; // 14 chars
const KEEP = 4; // "فقط " stays
const DEL = [...TEXT1].length - KEEP; // 10 chars deleted
const TEXT2 = 'مرکز فرماندهی شما'; // 17 chars
const FINAL = TEXT1.slice(0, KEEP) + TEXT2;

const T1 = 6; // first typing start, 2f/char
const PAUSE_START = T1 + ([...TEXT1].length - 1) * 2; // f32
const DS = PAUSE_START + 16; // f48 delete start, 1.5f/char
const RS = 68; // retype start, 1.5f/char
const TYPE2_END = RS + ([...TEXT2].length - 1) * 1.5; // f92
const CURSOR_OFF = TYPE2_END + 20; // two 10f blink periods

const cursorOn = (f: number): boolean => {
  if (f >= CURSOR_OFF) return false;
  if (f >= TYPE2_END) return Math.floor((f - TYPE2_END) / 5) % 2 === 0; // blink twice, then gone
  if (f >= DS) return true; // delete + retype: steady (decisive)
  if (f >= PAUSE_START) return Math.floor((f - PAUSE_START) / 4) % 2 === 0; // hesitation: 4f halves
  return true;
};

const TEXT_STYLE: React.CSSProperties = {
  fontSize: fs(112), fontWeight: 700, lineHeight: FA_LH, color: G.ink, whiteSpace: 'pre',
  letterSpacing: 0, textTransform: 'none', direction: 'rtl', unicodeBidi: 'isolate',
};

export const TypewriterErrorRetype: React.FC = () => {
  const f = useCurrentFrame();
  const c1 = [...TEXT1];
  const c2 = [...TEXT2];

  const n1 = f < T1 ? 0 : Math.min(c1.length, Math.floor((f - T1) / 2) + 1);
  const removed = f < DS ? 0 : Math.min(DEL, Math.floor((f - DS) / 1.5) + 1);
  const n2 = f < RS ? 0 : Math.min(c2.length, Math.floor((f - RS) / 1.5) + 1);

  const shown = c1.slice(0, Math.max(KEEP, n1 - removed)).slice(0, n1).join('') + c2.slice(0, n2).join('');

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative' }}>
      <FaRoot family="Vazirmatn">
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}>
            {/* invisible sizer: final line fixes the box width and the start edge */}
            <div style={{ ...TEXT_STYLE, visibility: 'hidden' }}>{FINAL}</div>
            <div style={{ ...TEXT_STYLE, position: 'absolute', top: 0, insetInlineStart: 0 }}>
              {shown}
              {cursorOn(f) && (
                <span style={{ display: 'inline-block', width: 7, height: fs(116), marginInlineStart: 4, verticalAlign: 'middle', background: G.ink }} />
              )}
            </div>
          </div>
        </div>
      </FaRoot>
    </div>
  );
};
