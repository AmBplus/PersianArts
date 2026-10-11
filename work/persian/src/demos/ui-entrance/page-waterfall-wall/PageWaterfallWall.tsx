// PERSIAN (RTL) localization of the page-waterfall-wall card.
//
// TEXT: the composition has no live JSX copy. Its page slices are raster screenshots
// containing baked English/Chinese UI text, so the assets remain the same visual
// material but are strongly blurred (16px) below to prevent foreign copy from being
// legible in the Persian reconstruction.
// DIRECTION: the wall is a visual, vertical catalog rather than a horizontal reading
// sequence. FaRoot establishes RTL for any future page chrome, while the three columns
// stay centered in their original order: changing their order would alter the intended
// differential-parallax composition. Vertical motion is physical/content flow and is
// kept exactly: columns 1 and 3 move up, the middle column moves down.
// MOTION: loop durations, direction signs, 20deg tilt, perspective, scale, gap, seeds,
// and the outer 1.0->1.06 camera push are unchanged. No text font is rendered here;
// Vazirmatn is loaded by FaRoot as the neutral Persian UI default for the card.
// RASTER HANDLING: use the checked-in texture set under textures/live and blur each
// screenshot before display; no source image is mirrored because its layout is not a
// directional cue once text is intentionally de-emphasized.
import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { VerticalTicker, TickerColumn } from './VerticalTicker';
import { FaRoot } from '../../_fa';

const BG = '#101014';

const shot = (file: string) => (
  <div
    style={{
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
      background: '#fff',
    }}
  >
    <Img
      src={staticFile(`textures/live/${file}`)}
      style={{ width: '100%', display: 'block', filter: 'blur(16px)', transform: 'scale(1.04)' }}
    />
  </div>
);

// 3 列差速反向（配方卡参数：loop 12/9/14s，中列反向）
export const buildColumns = (loops: [number, number, number]): TickerColumn[] => [
  {
    items: ['card1.png', 'card2.png', 'card3.png', 'card10.png'].map(shot),
    durationInSeconds: loops[0],
    direction: -1,
  },
  {
    items: ['card4.png', 'card5.png', 'card6.png', 'projects-empty.png'].map(shot),
    durationInSeconds: loops[1],
    direction: 1,
  },
  {
    items: ['card7.png', 'card8.png', 'card9.png', 'float-search.png'].map(shot),
    durationInSeconds: loops[2],
    direction: -1,
  },
];

export const PageWaterfallWall: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // 镜头缓推寄生在外层，墙自身循环、镜头单向
  const push = interpolate(frame, [0, durationInFrames], [1, 1.06]);

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <FaRoot family="Vazirmatn">
        <AbsoluteFill style={{ transform: `scale(${push})` }}>
          <VerticalTicker
            columns={buildColumns([12, 9, 14])}
            backgroundColor={BG}
            columnWidth={560}
            gap={30}
          />
        </AbsoluteFill>
      </FaRoot>
    </AbsoluteFill>
  );
};

// 接缝自检用：短 loop（3s=90f）、无镜头推，f0 与 f90 应逐像素一致
export const SeamTest: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <FaRoot family="Vazirmatn">
      <VerticalTicker
        columns={buildColumns([3, 3, 3])}
        backgroundColor={BG}
        columnWidth={560}
        gap={30}
      />
    </FaRoot>
  </AbsoluteFill>
);
