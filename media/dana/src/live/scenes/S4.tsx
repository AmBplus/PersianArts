// ============================================================================================================
// S4 «مدیریت و پشتیبانی هوشمند» (v2) — 37.5–45.0 s (local 0–7.5), night.
// Hero word → BentoLightUp 2×2 dashboard (tiles light on the beat grid 1.5/2.125/2.75/3.375) with a
// runway camera skim over it, then support bubbles ping in from both side gutters and resolve.
// Exit: everything collapses into the glowing point (960,540) — S5's canopy arcs grow from it.
// ============================================================================================================
import React from "react";
import {AbsoluteFill} from "remotion";
import {sceneBySceneId} from "../timing";
import {E, Logo, NodeDot, Thread, clamp, faDigits, faStyle, palette, pulse, seg, smoothPath, useT} from "../kit";
import {NightBase} from "../kit/motion/Stage";
import {HeroWord} from "../kit/motion/HeroWord";
import {BentoLightUp} from "../kit/motion/BentoLightUp";
import {ListRevealRows} from "../kit/motion/ListRevealRows";

const spec = sceneBySceneId("s4");
export const S4_FRAMES: number = spec.frames;

const GUTTER_R = {x: 1745, y: 600};   // right gutter bubble anchor
const GUTTER_L = {x: 175, y: 600};    // left gutter bubble anchor
const RESOLVE = {x: 175, y: 465};     // «حل شد» mini-bubble above the left bubble

const chip = (p: number, dy = 0): React.CSSProperties => ({
  opacity: p, transform: `translateY(${(1 - p) * 14 + dy}px)`,
  padding: "8px 24px", borderRadius: 999, background: "rgba(47,123,255,0.16)",
  border: "1px solid rgba(111,167,255,0.35)", whiteSpace: "nowrap",
});

const Bubble: React.FC<{x: number; y: number; t: number; start: number; text?: string; check?: boolean; side: "l" | "r"}> = ({x, y, t, start, text, check, side}) => {
  const p = seg(t, start, start + 0.45, E.outBack(1.6));
  if (p <= 0) return null;
  const ping = pulse(t, start, 0.35);
  return (
    <div style={{position: "absolute", left: x - 160, top: y - 46, width: 320, height: 92, opacity: clamp(p * 2), transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: side === "r" ? "100% 50%" : "0% 50%"}}>
      <div style={{position: "absolute", inset: 0, borderRadius: 18, background: "rgba(10,31,74,0.92)", border: "1px solid rgba(111,167,255,0.4)", boxShadow: `0 0 ${18 * ping}px rgba(47,123,255,${0.35 + ping * 0.3})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, direction: "rtl"}}>
        {check && (
          <svg width={34} height={34} viewBox="0 0 34 34"><path d="M7 18 L14 25 L27 9" fill="none" stroke={palette.blueMid} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
        {text && <div style={faStyle(32, {fontWeight: 600, color: palette.ice})}>{text}</div>}
      </div>
      <div style={{position: "absolute", top: 34, [side === "r" ? "right" : "left"]: 34, width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", [side === "r" ? "borderLeft" : "borderRight"]: `14px solid rgba(111,167,255,0.4)`}} />
    </div>
  );
};

export const S4: React.FC = () => {
  const {t} = useT();
  const compress = seg(t, 6.5, 7.3, E.outQuint);
  const fadeAll = 1 - seg(t, 6.9, 7.3);
  const logoIn = seg(t, 6.9, 7.2);
  const stub = seg(t, 7.15, 7.5, E.outQuart);
  const skim = seg(t, 1.5, 4.5, E.inOutSine);
  const beat = Math.min(1, pulse(t, 1.5, 0.2) + pulse(t, 2.125, 0.2) + pulse(t, 2.75, 0.2) + pulse(t, 3.375, 0.2));

  const bars = [190, 120, 150, 90, 170];                              // RTL: first bar rightmost (the S3 blade)
  const ringP = seg(t, 2.4, 3.6, E.outCubic);
  const TREND: Array<[number, number]> = [[80, 250], [190, 208], [300, 228], [410, 158], [520, 190], [620, 118]];
  const trendDraw = seg(t, 3.6, 4.8, E.inOutCubic);

  const tiles = [
    {
      id: "chart", lightFrame: 45,
      content: (
        <div style={{position: "absolute", inset: 0, direction: "rtl"}}>
          <div style={{position: "absolute", left: 40, right: 40, bottom: 56, height: 2, background: "rgba(111,167,255,0.3)"}} />
          {bars.map((h, i) => {
            const grow = i === 0 ? seg(t, 1.5, 1.9, E.outExpo) : seg(t, 1.9 + i * 0.12, 2.7 + i * 0.12, E.outExpo);
            return (
              <div key={i} style={{position: "absolute", right: 60 + i * 118, bottom: 58, width: 56, height: h * grow, borderRadius: "8px 8px 0 0", background: `linear-gradient(to top, ${palette.blueDeep}, ${palette.blueSky})`, boxShadow: `0 0 ${14 * pulse(t, 1.9 + i * 0.12, 0.3)}px rgba(47,123,255,0.5)`}} />
            );
          })}
        </div>
      ),
    },
    {
      id: "ring", lightFrame: 64,
      content: (
        <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center"}}>
          <svg width={330} height={330} viewBox="0 0 330 330">
            <circle cx={165} cy={165} r={95} fill="none" stroke="rgba(47,123,255,0.25)" strokeWidth={16} />
            <circle cx={165} cy={165} r={95} fill="none" stroke={palette.blueSky} strokeWidth={16} strokeLinecap="round" strokeDasharray={2 * Math.PI * 95} strokeDashoffset={2 * Math.PI * 95 * (1 - 0.78 * ringP)} transform="rotate(-90 165 165)" style={{filter: `drop-shadow(0 0 10px ${palette.blueMid})`}} />
            <text x={165} y={158} textAnchor="middle" fill={palette.ice} fontFamily='"Estedad", sans-serif' fontSize={44} fontWeight={700}>{faDigits(78)}٪</text>
            <text x={165} y={196} textAnchor="middle" fill="rgba(234,242,255,0.6)" fontFamily='"Estedad", sans-serif' fontSize={26}>پایداری</text>
          </svg>
        </div>
      ),
    },
    {id: "table", lightFrame: 82, content: null},                    // rows rendered separately (self-clocking primitive)
    {
      id: "trend", lightFrame: 101,
      content: (
        <div style={{position: "absolute", inset: 0}}>
          <svg width={690} height={330} viewBox="0 0 690 330">
            <path d={smoothPath(TREND)} fill="none" stroke={palette.blueSky} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - trendDraw} style={{filter: `drop-shadow(0 0 8px ${palette.blueMid})`}} />
            {TREND.map(([x, y], i) => {
              const dp = seg(t, 3.6 + i * 0.18, 3.78 + i * 0.18);
              return dp > 0 ? <circle key={i} cx={x} cy={y} r={7 * E.outBack(1.5)(dp)} fill={palette.ice} opacity={clamp(dp * 2)} /> : null;
            })}
          </svg>
        </div>
      ),
    },
  ];

  return (
    <AbsoluteFill>
      <NightBase t={t} dur={7.5} origin={{x: 960, y: 530}}>
        {/* S3's baseline fades away as the scene opens */}
        <Thread d="M1600 760 L320 760" from={0} to={1} width={4} opacity={0.5 * (1 - seg(t, 0.0, 0.4))} />

        {/* hero word, fast demote (shorter scene) */}
        <HeroWord
          text="مدیریت هوشمند"
          from={{x: 960, y: 640, scale: 1.25}}
          to={{x: 960, y: 470, scale: 1}}
          landFrame={12}
          holdFrames={12}
          demoteDurFrames={13}
          size={108}
          demoteTo={{x: 1620, y: 170, scale: 0.42}}
        />

        <div style={{position: "absolute", inset: 0, opacity: fadeAll, transform: `scale(${1 - 0.95 * compress})`, transformOrigin: "960px 540px"}}>
          {/* S3's blade bar arrives and merges into tile 1 (first bar) */}
          {t < 1.55 && (
            <div style={{position: "absolute", left: 1275, top: 330, width: 90, height: 190 * seg(t, 0.0, 0.5, E.outExpo), borderRadius: "8px 8px 0 0", background: `linear-gradient(to top, ${palette.blueDeep}, ${palette.blueSky})`, filter: "drop-shadow(0 0 16px rgba(47,123,255,0.7))", opacity: 1 - seg(t, 1.35, 1.5)}} />
          )}

          {/* runway camera skim over the bento (translate + settle) */}
          <div style={{position: "absolute", inset: 0, transform: `translateX(${-140 * (1 - skim)}px) scale(${1.06 - 0.06 * skim})`, transformOrigin: "960px 540px"}}>
            <BentoLightUp tiles={tiles} x={960} y={530} w={690} h={330} gap={24} cols={2} />
            <ListRevealRows rows={["گزارش آزمون‌ها", "گزارش حضور", "گزارش عملکرد", "گزارش واحدها"]} x={1317} y={717} w={560} rowH={52} size={30} startFrame={86} perRowFrames={3} />
          </div>

          {/* support bubbles in the side gutters + resolve check */}
          <Bubble x={GUTTER_R.x} y={GUTTER_R.y} t={t} start={3.75} text="سؤال دارم" side="r" />
          <Bubble x={GUTTER_L.x} y={GUTTER_L.y} t={t} start={4.375} text="در خدمتم" side="l" />
          <Bubble x={RESOLVE.x} y={RESOLVE.y} t={t} start={5.0} text="حل شد" check side="l" />
          <Thread d={`M1662 470 C 1700 500, 1712 540, ${GUTTER_R.x - 160} ${GUTTER_R.y}`} from={0} to={seg(t, 3.75, 4.05, E.outQuart)} width={3} opacity={0.7} pulse={beat} />
          <Thread d={`M258 470 C 220 500, 208 540, ${GUTTER_L.x + 160} ${GUTTER_L.y}`} from={0} to={seg(t, 4.375, 4.675, E.outQuart)} width={3} opacity={0.7} pulse={beat} />
          <Thread d={`M ${GUTTER_L.x} ${GUTTER_L.y - 46} L ${RESOLVE.x} ${RESOLVE.y + 46}`} from={0} to={seg(t, 5.0, 5.25, E.outQuart)} width={3} opacity={0.6} />

          {/* capability chips row */}
          <div style={{position: "absolute", left: 0, top: 930, width: 1920, display: "flex", justifyContent: "center", gap: 22, direction: "rtl", ...faStyle(32, {fontWeight: 500, color: palette.ice})}}>
            <div style={chip(seg(t, 2.5, 3.0, E.outCubic))}>داشبوردهای مدیریتی</div>
            <div style={chip(seg(t, 3.125, 3.625, E.outCubic))}>گزارش‌های مدیریتی و آماری</div>
            <div style={chip(seg(t, 4.375, 4.875, E.outCubic))}>پشتیبانی آنلاین استاد و دانشجو</div>
            <div style={chip(seg(t, 5.0, 5.5, E.outCubic))}>پشتیبانی آنلاین کلاس‌ها و آزمون‌ها</div>
          </div>
        </div>

        {/* exit: the glowing point S5 opens from */}
        {t >= 6.5 && (
          <>
            <Logo cx={960} cy={540} height={120} kind="mark" variant="white" opacity={logoIn} glow={26 + 18 * pulse(t, 7.0, 0.4)} />
            <NodeDot x={960} y={540} p={seg(t, 6.5, 6.9)} r={12} opacity={1 - seg(t, 7.3, 7.5)} ringT={t - 6.9} />
            {stub > 0 && (
              <>
                <Thread d="M960 540 C 760 420, 560 380, 420 440" from={0} to={stub} width={5} head={stub < 0.99} />
                <Thread d="M960 540 C 1160 420, 1360 380, 1500 440" from={0} to={stub} width={5} head={stub < 0.99} />
              </>
            )}
          </>
        )}
      </NightBase>
    </AbsoluteFill>
  );
};
