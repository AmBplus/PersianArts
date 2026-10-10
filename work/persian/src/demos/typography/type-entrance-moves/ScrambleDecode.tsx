// PERSIAN (RTL) localization of shotcraft "type-entrance-moves / scramble-decode" — lock beats, 2f flash, 2f scramble tick, seeds untouched.
// TEXT: "DECODE SPEED" -> «کدگشایی سریع» (12 code points incl. the space, exactly like the original's 12): lock frame of index i is
//   still 20 + i*6, the space (index 7, was 6) is never locked-by-timer, the last letter locks on frame 86 as before. Noise charset
//   keeps the hacker feel but is NOT Persian letters (they would look like real answers - the brief's "no look-alike glyph" pitfall):
//   Persian digits 1-9 (no zero: it renders as a diamond dot) + Latin A-F + narrow / + = (wide # $ % & dropped: they overflowed the cell) (digits via faDigits-style literals; they are noise, not data).
// SHAPING: the original used fixed 1ch cells per character. Persian letters join, so locked characters are NOT put in separate
//   cells: the locked part of each word is ONE text run (prefix slice, like typeOn) and therefore always correctly shaped; only
//   the still-scrambling letters are fixed-width noise cells. The just-locked letter is an inline span with the inverted
//   background for 2f (Chrome shapes across spans that differ only in colour/background, so the joined form is preserved).
//   letterSpacing 2 removed (breaks joining), no uppercase.
// DIRECTION: row is rtl: the first letter is the right-most, decoding sweeps right -> left (MIRRORED, reading order). The progress
//   bar fills from the right edge (MIRRORED: track is rtl, the fill is start-anchored). The row is start-aligned inside a
//   ghost-sized box (a hidden copy of the fully decoded title sets the width), so the locked part never jitters while the
//   noise tail shrinks, and the final title is centred like the original.
// NOISE CELLS: 0.6*FONT wide, noise glyph set at 0.8*FONT, Vazirmatn 700 (Kufi has no Latin; 700 reads closest to the Kufi 800 locked text), so glyphs never overlap
//   and the live row (<= ghost width) never exceeds the final title.
// FONT: Noto Kufi Arabic (geometric, techno, variable 100-900 so weight 800 stays heavy like Menlo/ui-monospace 800). Latin noise
//   glyphs come from the Vazirmatn fallback inside FaRoot.
// No raster assets; no digits in the title.
// 乱码解码字（scramble-decode）——终端黑客感文字入场。
// 标题 "DECODE SPEED" 每字符先高速跳随机字母/数字（每 2f 换一个，seed hash 取字符），
// 从左到右逐个锁定：第 i 个字符在帧 20+i*6 锁定为真字符，锁定瞬间该字符反色闪
// （G.ink 色块白字 2f）随即恢复。跳动期字符 G.mid，锁定后 G.ink。
// 关键帧：0–20f 全员乱跳 → 20–86f 从左到右逐个锁定 → 87–130f 完全静止收尾。
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs } from '../../_fa';

const TEXT = 'کدگشایی سریع';
const CHARSET = ['A', 'B', 'C', 'D', 'E', 'F', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '/', '+', '='];
const LOCK_START = 20; // 第 0 个字符锁定帧
const LOCK_STEP = 6; // 相邻字符锁定间隔
const FLASH_LEN = 2; // 锁定反色闪持续帧数
const FONT = fs(120);
const CELL_W = Math.round(FONT * 0.6); // fixed noise-cell width (the noise is monospaced; locked text is not)
const GAP_W = Math.round(FONT * 0.3); // word gap

// 帧确定伪随机
const h = (n: number) => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

export const ScrambleDecode: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = [...TEXT];
  const lockedCount = chars.filter((c, i) => c === ' ' || frame >= LOCK_START + i * LOCK_STEP).length;
  const allLocked = lockedCount === chars.length;
  // 跳动期：每 2 帧换一个伪随机字符
  const tick = Math.floor(frame / 2);

  // Build the row from the START (right). `live` = animated; otherwise a fully decoded ghost used only to size the box.
  const renderRow = (live: boolean) => {
    const nodes: React.ReactNode[] = [];
    let run = ''; // consecutive locked letters, kept in ONE text node so Persian joining is preserved
    const flushRun = (key: string) => {
      if (run) { nodes.push(<span key={key}>{run}</span>); run = ''; }
    };
    chars.forEach((ch, i) => {
      if (ch === ' ') {
        flushRun(`r${i}`);
        nodes.push(<span key={i} style={{ display: 'inline-block', width: GAP_W }} />);
        return;
      }
      const lockFrame = LOCK_START + i * LOCK_STEP;
      const locked = !live || frame >= lockFrame;
      const flashing = live && locked && frame < lockFrame + FLASH_LEN;
      if (locked && !flashing) { run += ch; return; }
      flushRun(`r${i}`);
      if (flashing) {
        nodes.push(<span key={i} style={{ color: G.card, background: G.ink }}>{ch}</span>);
      } else {
        const noise = CHARSET[Math.floor(h(i * 101 + tick * 7 + 13) * CHARSET.length)];
        nodes.push(
          <span key={i} style={{ display: 'inline-block', width: CELL_W, textAlign: 'center', color: G.mid, direction: 'ltr', fontWeight: 700, fontSize: Math.round(FONT * 0.8), lineHeight: `${Math.round(FONT * 1.5)}px` }}>{noise}</span>,
        );
      }
    });
    flushRun('rEnd');
    return nodes;
  };

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg }}>
      <FaRoot
        family="Noto Kufi Arabic"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 48 }}
      >
        <div
          style={{
            position: 'relative',
            fontWeight: 800,
            fontSize: FONT,
            lineHeight: 1.5,
            letterSpacing: 0,
            whiteSpace: 'nowrap',
            color: G.ink,
          }}
        >
          {/* hidden fully decoded copy: gives the box its final width/height so the locked part never moves */}
          <div style={{ visibility: 'hidden' }}>{renderRow(false)}</div>
          <div style={{ position: 'absolute', top: 0, insetInlineStart: 0 }}>{renderRow(true)}</div>
        </div>
        {/* 底部进度提示条：已锁定字符数比例；RTL 下从右端起填充（与解码方向一致） */}
        <div style={{ width: 900, height: 10, background: G.line, borderRadius: 5, overflow: 'hidden' }}>
          <div
            style={{
              width: `${(lockedCount / chars.length) * 100}%`,
              height: '100%',
              background: allLocked ? G.ink : G.mid,
              borderRadius: 5,
            }}
          />
        </div>
      </FaRoot>
    </div>
  );
};
