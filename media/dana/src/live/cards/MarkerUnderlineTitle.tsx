// marker-underline-title (Persian / RTL) -- original: white-background headline, then a marker underline is drawn under the
// italic keyword "new". Motion (22f ease-out entrance, 32..42f draw, ease 2.2, seed 77, stroke geometry) is unchanged.
// TEXT: "Meet the new / Notion AI" -> line 1 «با «جدید» آشنا شوید» (keyword «جدید» = new), line 2 "Notion AI" kept Latin
//   (brand mark, isolated with <bdi> so it stays one LTR run in the RTL block). No Persian digits needed (no numbers).
// FONT: Vazirmatn 800 (variable, real weights): neutral product-headline voice like the original SF/Helvetica bold; size fs(118).
// SHAPING: letterSpacing 0 (original -0.02em would break joining), no italic (Persian has no italics; faux-slanting breaks the
//   script) -> the emphasis comes from the marker stroke only; line-height 1.5 (FA_LH) for Persian dots/descenders.
// DIRECTION: the draw is a reading-direction reveal -> mirrored: the clip window grows from the RIGHT (start of the word) to the
//   left, so the pen follows the way Persian is written. The stroke polygon itself is mirrored (scaleX(-1)), which flips the
//   gentle slope too: low at the start (right), rising towards the end (left), as the pen would follow a Persian baseline that
//   rises at the word end; seed/wobble/width profile identical. Title entrance (translateY, gravity) and centring: kept
//   (vertical, symmetric). Underline: LEN 252->276 and offset (right:-6, bottom:-12) re-measured on the Persian glyph box (word «جدید» is wider and its dots sit lower than Latin "new").
// RASTER: none.
import React, { useId } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { FaRoot, FA_LH, fs, faText } from '../../../persian/src/demos/_fa';

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 马克笔笔画：中轴微歪的路径 + 变宽轮廓，一次生成多边形
const buildStroke = (len: number, seed: number) => {
  const rand = mulberry32(seed);
  const N = 40;
  const top: string[] = [];
  const bot: string[] = [];
  // 预生成微歪偏移（低频）与毛糙（高频）
  const wob = Array.from({ length: N + 1 }, () => rand() - 0.5);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = t * len;
    // 中轴：跟随斜体微上斜（左低右高，对照截图）+ 缓波
    const mid = 19 - t * 9 + Math.sin(t * Math.PI * 1.6 + 0.4) * 2.6 + wob[i] * 1.6;
    // 宽度：起笔略细→中段饱满→收笔收尖，加高频毛糙
    const wBase = 14 + Math.sin(t * Math.PI) * 6 - Math.max(0, t - 0.86) * 46;
    const w = Math.max(2.2, wBase + wob[i] * 3);
    top.push(`${x.toFixed(1)},${(mid - w / 2).toFixed(1)}`);
    bot.push(`${x.toFixed(1)},${(mid + w / 2).toFixed(1)}`);
  }
  return `M${top.join('L')}L${bot.reverse().join('L')}Z`;
};

export const MarkerUnderlineTitle: React.FC = () => {
  const frame = useCurrentFrame();
  // clipPath ID 按实例生成，多实例同场不串引（useId 的 «:» 在 url() 里非法，需清洗）
  const revealId = `reveal-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const LEN = 276; // stroke length, tuned to the width of «جدید» at fs(118)

  // 标题落定：整块从下方 30px 弹入（ease-out），24 帧内完成
  const enter = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const eo = 1 - Math.pow(1 - enter, 3);
  const titleY = (1 - eo) * 36;
  const titleOp = Math.min(1, enter * 1.6);

  // 下划线：标题落定停一拍后描画，10 帧从左到右（提速一档），ease-out
  const draw = interpolate(frame, [32, 42], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const drawE = 1 - Math.pow(1 - draw, 2.2);
  const path = buildStroke(LEN, 77);

  return (
    <AbsoluteFill style={{ background: '#f4f4f2' }}>
      <FaRoot family="Vazirmatn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          opacity: titleOp, transform: `translateY(${titleY}px)`,
          ...faText(118, { fontWeight: 800, color: '#191919', textAlign: 'center', lineHeight: FA_LH, unicodeBidi: 'isolate' }),
          fontSize: fs(118),
        }}>
          <div>
            با{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              دانا
              {/* marker underline: clip grows right -> left (reading direction), stroke mirrored */}
              <svg
                width={LEN} height={44} viewBox={`0 0 ${LEN} 44`}
                style={{ position: 'absolute', right: -6, bottom: -12, overflow: 'visible' }}
              >
                <defs>
                  <clipPath id={revealId}>
                    <rect x={0} y={-20} width={drawE * (LEN + 6)} height={60} transform={`translate(${LEN} 0) scale(-1 1)`} />
                  </clipPath>
                </defs>
                {draw > 0 && (
                  <g clipPath={`url(#${revealId})`}>
                    <path d={path} fill="#111111" transform={`translate(${LEN} 0) scale(-1 1)`} />
                  </g>
                )}
              </svg>
            </span>{' '}
            آشنا شوید
          </div>
          <div>همهٔ دانشگاه، یک‌جا</div>
        </div>
      </FaRoot>
    </AbsoluteFill>
  );
};
