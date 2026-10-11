// PERSIAN (RTL) localization of cloner-depth-echo.
//
// Text: “CLONER DEPTH ECHO” -> «پژواکِ عمقِ کلون‌ها», an idiomatic technical
// title that keeps “clone” as a familiar product token. The placeholder cards
// contain no text or raster lettering, so there is nothing else to translate.
// Direction decisions: the title is centered and remains centered. The clone
// line's diagonal offset, rotateY perspective, z-depth, and top-left spread are
// physical staging for a depth echo, not reading-order UI, so they stay exactly
// as authored. Clone render order, stagger, merge, easing, spring, seed, fps,
// dimensions, and all frame constants are unchanged.
// Font: Vazirmatn, a neutral variable Persian UI/display sans with reliable
// Persian glyph coverage and a strong 800 weight for the original bold heading.
// Letter spacing is explicitly zero; the shared fixture TitleBlock is not used
// because it hard-codes Helvetica and Latin tracking.
import React from 'react';
import { useCurrentFrame, interpolate, spring, Easing } from 'remotion';
import { G, Card } from '../../_fixtures/Fixtures';
import { FaRoot, faText } from '../../_fa';

const FPS = 30;
const N = 7; // 克隆数
const GAP_Z = 120;

const SPREAD_START = 18; // 排开起始帧
const HOLD_END = 18 + 12 + 25; // f55：停留结束
const MERGE_DUR = 10; // 吸回时长

export const ClonerDepthEcho: React.FC = () => {
  const frame = useCurrentFrame();

  // 吸回进度（全体同步，ease-in 加速）
  const merge = interpolate(frame, [HOLD_END, HOLD_END + MERGE_DUR], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 合体瞬间本体弹一下
  const popS = spring({
    frame: frame - (HOLD_END + MERGE_DUR),
    fps: FPS,
    config: { damping: 11, stiffness: 200, mass: 0.7 },
    durationInFrames: 18,
  });
  const heroScale = frame >= HOLD_END + MERGE_DUR ? 1 + 0.08 * Math.sin(popS * Math.PI) : 1;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
      <FaRoot family="Vazirmatn">
        <div style={{ position: 'absolute', top: 100, width: '100%', textAlign: 'center' }}>
          <div style={{ ...faText(72), fontWeight: 800, color: G.ink, lineHeight: 1.15 }}>
            پژواکِ عمقِ کلون‌ها
          </div>
        </div>

        <div style={{ position: 'absolute', inset: 0, perspective: 1600, perspectiveOrigin: '58% 46%' }}>
          <div
            style={{
              position: 'absolute',
              left: 960 - 260,
              top: 540 - 170 + 40,
              transformStyle: 'preserve-3d',
              transform: 'rotateY(16deg)',
            }}
          >
            {/* Clone queue: render from back to front to preserve occlusion. */}
            {Array.from({ length: N }, (_, k) => N - k).map((idx) => {
              // idx 1..N, with larger idx farther back.
              const spread = spring({
                frame: frame - SPREAD_START - (idx - 1) * 1.6,
                fps: FPS,
                config: { damping: 14, stiffness: 160, mass: 0.8 },
                durationInFrames: 16,
              });
              const p = spread * (1 - merge);
              const z = -GAP_Z * idx * p;
              // Physical diagonal offset makes the depth queue visible head-on.
              const dx = 64 * idx * p;
              const dy = -34 * idx * p;
              const op = (1 - (idx / N) * 0.8) * spread * (1 - merge);
              if (op <= 0.005) return null;
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    transform: `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, ${z.toFixed(2)}px)`,
                    opacity: op,
                  }}
                >
                  <Card w={520} h={340} seed={3} />
                </div>
              );
            })}
            {/* Hero card. */}
            <div style={{ position: 'absolute', transform: `translateZ(0px) scale(${heroScale.toFixed(4)})` }}>
              <Card w={520} h={340} seed={3} style={{ boxShadow: '0 10px 36px rgba(31,28,23,0.22)' }} />
            </div>
          </div>
        </div>
      </FaRoot>
    </div>
  );
};
