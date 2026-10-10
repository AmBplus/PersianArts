// PERSIAN (RTL) localization of shotcraft "karaoke-fill-sync" — word timetable (20-38, 42-75, 85-103, 107-130), linear fill,
// hold/rest frames all unchanged.
//  - Text: "SHIP FASTER / BREAK NOTHING" -> «عرضه سریع‌تر / بدون خرابی» (slogan voice, 2 words per line like the original; the
//    second word of each line is the longer, slower-read one, as in the source: سریع‌تر ~ FASTER, خرابی ~ NOTHING).
//  - Font: Estedad 800 (variable, heavy poster sans; same family as font-weight-pump). Loaded through FaRoot.
//  - letterSpacing 2 -> 0 (breaks joining); lineHeight 1.45 -> FA_LH; fontSize 130 -> fs(130).
//  - MIRROR: fill direction left->right becomes right->left (reading direction): clipPath inset(0 X% 0 0) -> inset(0 0 0 X%),
//    i.e. the dark layer is revealed from the right edge, which is where a Persian word starts.
//  - MIRROR: the reading-finger underline is anchored at the right edge (left:0 -> right:0) so it grows with the fill edge.
//  - MIRROR: block is pinned to the reading-start side: paddingLeft 240 -> paddingInlineStart 240 (right), rows are flex in
//    rtl so the first word sits right-most; rows and words keep the 48 px gap. Lines stay aligned at the start (right) edge.
//  - Underline offset: bottom -14 -> -6 because the taller Persian line box (FA_LH) already leaves room below the glyph baseline.
//  - Raster: none. Digits: none.
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, FA_LH } from '../../_fa';

type Word = { text: string; start: number; end: number };

const LINES: Word[][] = [
  [
    { text: 'عرضه', start: 20, end: 38 },
    { text: 'سریع‌تر', start: 42, end: 75 },
  ],
  [
    { text: 'بدون', start: 85, end: 103 },
    { text: 'خرابی', start: 107, end: 130 },
  ],
];

const KaraokeWord: React.FC<{ word: Word; frame: number }> = ({ word, frame }) => {
  // linear in-word fill progress, clamped so a read word stays lit
  const p = interpolate(frame, [word.start, word.end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const active = frame >= word.start && frame < word.end;
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ color: G.line }}>{word.text}</span>
      {/* dark layer revealed from the right (reading start) edge */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          color: G.ink,
          clipPath: `inset(0 0 0 ${(1 - p) * 100}%)`,
        }}
      >
        {word.text}
      </span>
      {/* reading finger: underline anchored right, follows the fill edge */}
      {active && (
        <span
          style={{
            position: 'absolute',
            right: 0,
            bottom: -6,
            width: `${p * 100}%`,
            height: 8,
            background: G.ink,
          }}
        />
      )}
    </span>
  );
};

export const KaraokeFillSync: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <FaRoot
      family="Estedad"
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingInlineStart: 240,
        boxSizing: 'border-box',
        fontSize: fs(130),
        fontWeight: 800,
        letterSpacing: 0,
        lineHeight: FA_LH,
      }}
    >
      {LINES.map((words, li) => (
        <div key={li} style={{ display: 'flex', gap: 48 }}>
          {words.map((w) => (
            <KaraokeWord key={w.text} word={w} frame={frame} />
          ))}
        </div>
      ))}
    </FaRoot>
  );
};
