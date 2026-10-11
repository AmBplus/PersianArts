// diagram-cascade-build (Persian / RTL) —— miro-promo 104–116s
// LOCALIZATION NOTES
// Text: only one real string exists: the prompt. "Generate an entity-relationship diagram" ->
//   «یک نمودار موجودیت و رابطه بساز» (imperative, natural AI-prompt voice). The typewriter keeps the ORIGINAL beats:
//   progress p = chars*1.1/39 over the original 39-char length, so typing still starts at f6 and ends at f≈41
//   (prompt border turns dark at the same frame) even though the Persian string is shorter. typeOn() prefix slicing
//   keeps correct contextual shaping on every frame (one letter per step, no per-word degradation).
// Direction decisions:
//  - Prompt bar: symmetric (460..1460) -> position kept; icon dot uses marginInlineEnd so it sits at the RIGHT (start) of the bar; text right-anchored.
//  - Tree: sibling order = reading order, so every node x -> 1920-x (first child / first grandchild = right-most); node ids,
//    levels, stagger indices (6f), LEVEL_GAP and spring are untouched, so the cascade now flows right-to-left on each level.
//  - Elbow connectors: derived from the mirrored coordinates, geometry/dash timing identical (lines still lead nodes by 8f).
//  - Breathing transform-origin (960,620): lies on the vertical axis of symmetry, so mirroring keeps it as the visual centroid.
//  - Skeleton bars inside nodes: direction:rtl so the bars hang from the right edge (reading start) as real RTL cards would.
//  - Caret '|' stays (neutral char; it trails the prefix, appearing at the left = typing front in RTL).
// Font: Vazirmatn (neutral product UI, variable so weight 600 exists, matching the Helvetica 600 original).
// Raster: none.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, faText, typeOn } from '../../_fa';

const PROMPT = 'یک نمودار موجودیت و رابطه بساز';
const ORIG_PROMPT_LEN = 'Generate an entity-relationship diagram'.length; // 39: keeps the original typing beats
const TYPE_START = 6;
const TYPE_CPS = 1.1; // 字符/帧

// 树布局（画布坐标，节点中心）
const NODE_W = 300;
const NODE_H = 110;
const NODES = [
  // level 0
  { id: 0, x: 960, y: 330, level: 0, parent: -1 },
  // level 1 (mirrored: first child right-most)
  { id: 1, x: 1300, y: 570, level: 1, parent: 0 },
  { id: 2, x: 620, y: 570, level: 1, parent: 0 },
  // level 2 (mirrored)
  { id: 3, x: 1520, y: 820, level: 2, parent: 1 },
  { id: 4, x: 1110, y: 820, level: 2, parent: 1 },
  { id: 5, x: 810, y: 820, level: 2, parent: 2 },
  { id: 6, x: 400, y: 820, level: 2, parent: 2 },
];

const CASCADE_START = 52; // 根节点弹出时刻
const LEVEL_GAP = 20; // 层间隔
const SIBLING_STAGGER = 6;

const nodeStart = (n: (typeof NODES)[number]) => {
  if (n.level === 0) return CASCADE_START;
  const siblingIdx = NODES.filter((m) => m.level === n.level && m.id < n.id).length;
  return CASCADE_START + n.level * LEVEL_GAP + siblingIdx * SIBLING_STAGGER;
};

// 折角连线 path：父底边中点 → 垂直下探 → 水平 → 垂直进子顶边
const edgePath = (p: (typeof NODES)[number], c: (typeof NODES)[number]) => {
  const x1 = p.x;
  const y1 = p.y + NODE_H / 2;
  const x2 = c.x;
  const y2 = c.y - NODE_H / 2;
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} L ${x1} ${my} L ${x2} ${my} L ${x2} ${y2}`;
};

const edgeLen = (p: (typeof NODES)[number], c: (typeof NODES)[number]) => {
  const y1 = p.y + NODE_H / 2;
  const y2 = c.y - NODE_H / 2;
  return Math.abs(y2 - y1) + Math.abs(c.x - p.x);
};

export const DiagramCascadeBuild: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const typedOrig = Math.min(ORIG_PROMPT_LEN, Math.max(0, Math.floor((frame - TYPE_START) * TYPE_CPS)));
  const typedP = typedOrig / ORIG_PROMPT_LEN;
  const caretOn = Math.floor(frame / 8) % 2 === 0;
  const promptDone = typedOrig >= ORIG_PROMPT_LEN;

  // 成树后整体呼吸一拍
  const lastStart = nodeStart(NODES[NODES.length - 1]);
  const breathe = interpolate(frame, [lastStart + 22, lastStart + 34, lastStart + 50], [1, 1.035, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
     <FaRoot family="Vazirmatn">
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${G.line} 3px, transparent 3px)`,
          backgroundSize: '52px 52px',
        }}
      />

      {/* prompt 条 */}
      <div
        style={{
          position: 'absolute',
          left: 460,
          top: 88,
          width: 1000,
          height: 84,
          background: G.card,
          border: `3px solid ${promptDone ? G.ink : G.border}`,
          borderRadius: 42,
          display: 'flex',
          alignItems: 'center',
          padding: '0 36px',
          boxSizing: 'border-box',
          boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
          ...faText(30, { fontWeight: 600, lineHeight: 1.5 }),
          color: G.ink,
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 15, background: G.mid, marginInlineEnd: 20, flexShrink: 0 }} />
        <span>
          {typeOn(PROMPT, typedP)}
          <span style={{ opacity: caretOn ? 1 : 0, fontWeight: 400, unicodeBidi: 'isolate' }}>|</span>
        </span>
      </div>

      {/* 树（呼吸缩放以树心为原点） */}
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${breathe})`, transformOrigin: '960px 620px' }}>
        {/* 连线层 */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          {NODES.filter((n) => n.parent >= 0).map((n) => {
            const p = NODES[n.parent];
            const start = nodeStart(n) - 8; // 线比子节点先长
            const len = edgeLen(p, n);
            const grow = interpolate(frame, [start, start + 16], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            });
            if (grow <= 0) return null;
            return (
              <path
                key={n.id}
                d={edgePath(p, n)}
                stroke={G.mid}
                strokeWidth={5}
                fill="none"
                strokeLinejoin="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - grow)}
              />
            );
          })}
        </svg>

        {/* 节点层 */}
        {NODES.map((n) => {
          const start = nodeStart(n);
          const pop = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 170 } });
          if (frame < start) return null;
          return (
            <div
              key={n.id}
              style={{
                position: 'absolute',
                left: n.x - NODE_W / 2,
                top: n.y - NODE_H / 2,
                width: NODE_W,
                height: NODE_H,
                background: n.level === 0 ? G.side : G.card,
                border: `3px solid ${n.level === 0 ? G.side : G.border}`,
                borderRadius: 16,
                boxSizing: 'border-box',
                boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
                transform: `scale(${pop})`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 10,
                padding: '0 24px',
                direction: 'rtl',
              }}
            >
              <div style={{ height: 16, width: `${44 + (n.id * 17) % 34}%`, background: n.level === 0 ? '#9a9a98' : G.bar, borderRadius: 8 }} />
              <div style={{ height: 10, width: `${70 - (n.id * 13) % 26}%`, background: n.level === 0 ? G.sideBar : G.line, borderRadius: 5 }} />
            </div>
          );
        })}
      </div>
     </FaRoot>
    </AbsoluteFill>
  );
};
