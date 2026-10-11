// ============================================================================================================
// S2 «کلاس‌های تعاملی» (v2) — 17.5–27.5 s (local 0–10, 300 frames), night.
// ONE living class window: hero word → window frame from the thread → status pill cycles
// «کلاس زنده / در حال ضبط / آرشیو و بازپخش» → professor + 3×4 student grid → 10 attendance ticks
// → REC (blue, per palette discipline) → archive clip card → student replay. Exit: bottom edge → S3 baseline.
// ============================================================================================================
import React from "react";
import {AbsoluteFill} from "remotion";
import {sceneBySceneId} from "../timing";
import {E, FaText, clamp, faDigits, faStyle, palette, pulse, seg, useT} from "../kit";
import {NightBase} from "../kit/motion/Stage";
import {HeroWord} from "../kit/motion/HeroWord";
import {PillCycle} from "../kit/motion/PillCycle";

const spec = sceneBySceneId("s2");
export const S2_FRAMES: number = spec.frames;

const WIN = {cx: 960, cy: 570, w: 1080, h: 640};               // 420..1500 × 250..890
const GRID = {cx: 790, cy: 585, cols: 3, rows: 4, tw: 108, th: 92, gap: 14};
const TICKED = [0, 1, 2, 3, 4, 6, 7, 8, 10, 11];               // 10 present tiles (5 and 9 absent)
const ABSENT = [5, 9];

const Avatar: React.FC<{r: number; dim?: boolean; tint?: number}> = ({r, dim, tint = 0}) => (
  <div style={{width: r * 2, height: r * 2, borderRadius: "50%", position: "relative", background: `linear-gradient(160deg, rgba(11,31,92,${0.9 - tint * 0.3}), rgba(47,123,255,${0.35 - tint * 0.2}))`, border: `2px solid rgba(111,167,255,${dim ? 0.15 : 0.4})`, opacity: dim ? 0.45 : 1}}>
    <div style={{position: "absolute", left: "50%", top: "26%", width: r * 0.72, height: r * 0.72, marginLeft: -r * 0.36, borderRadius: "50%", background: "rgba(234,242,255,0.22)"}} />
    <div style={{position: "absolute", left: "50%", bottom: "12%", width: r * 1.15, height: r * 0.5, marginLeft: -r * 0.575, borderRadius: `${r}px ${r}px 6px 6px`, background: "rgba(234,242,255,0.16)"}} />
  </div>
);

const ChipIn: React.FC<{p: number; text: string}> = ({p, text}) => {
  if (p <= 0) return null;
  return (
    <div style={{opacity: p, transform: `translateY(${(1 - p) * 14}px)`, padding: "8px 24px", borderRadius: 999, background: "rgba(47,123,255,0.16)", border: "1px solid rgba(111,167,255,0.35)", whiteSpace: "nowrap", ...faStyle(32, {fontWeight: 500, color: palette.ice})}}>{text}</div>
  );
};

export const S2: React.FC = () => {
  const {t} = useT();
  // phases
  const winIn = seg(t, 1.5, 2.3, E.outExpo);
  const profIn = seg(t, 2.3, 3.3, E.outExpo);
  const recOn = t >= 6.25;
  const tlFill = seg(t, 6.25, 7.5, E.inOutQuad);
  const arch = seg(t, 7.5, 8.4, E.outExpo);                    // window → clip card
  const winFade = 1 - arch;
  const cardIn = seg(t, 7.6, 8.4, E.outBack(1.3));
  const replay = seg(t, 8.4, 9.5);
  const playWin = seg(t, 8.9, 9.4, E.outBack(1.4));
  const exit = seg(t, 9.5, 10.0, E.inOutCubic);
  const beat = Math.min(1, pulse(t, 0.0, 0.25) + pulse(t, 6.25, 0.2) * 0.7 + pulse(t, 8.9, 0.25) * 0.6);
  const presentCount = clamp(Math.floor((t - 3.75) / 0.25) + 1, 0, 10);

  const gridW = GRID.cols * GRID.tw + (GRID.cols - 1) * GRID.gap;
  const gridH = GRID.rows * GRID.th + (GRID.rows - 1) * GRID.gap;
  const gLeft = GRID.cx - gridW / 2, gTop = GRID.cy - gridH / 2;

  // cursor path → student tile → click
  const curP = seg(t, 8.4, 8.85, E.inOutCubic);
  const curX = 1500 + (1330 - 1500) * curP;
  const curY = 300 + (700 - 300) * curP;
  const click = pulse(t, 8.9, 0.25);

  return (
    <AbsoluteFill>
      <NightBase t={t} dur={10} origin={{x: 960, y: 570}}>
        <HeroWord
          text="کلاس‌های تعاملی"
          from={{x: 960, y: 640, scale: 1.25}}
          to={{x: 960, y: 470, scale: 1}}
          landFrame={12}
          holdFrames={12}
          demoteDurFrames={15}
          size={108}
          demoteTo={{x: 1620, y: 170, scale: 0.42}}
        />

        <div style={{position: "absolute", inset: 0, opacity: 1 - exit}}>
          {/* ---- the class window ---- */}
          <div style={{position: "absolute", inset: 0, opacity: winFade, transform: `scale(${0.94 + 0.06 * winIn})`, transformOrigin: "960px 570px"}}>
            {winIn > 0.01 && (
              <>
                <div style={{position: "absolute", left: WIN.cx - WIN.w / 2, top: WIN.cy - WIN.h / 2, width: WIN.w, height: WIN.h, borderRadius: 24, background: "rgba(6,16,48,0.55)", border: "2px solid rgba(47,123,255,0.65)", boxShadow: `0 0 ${26 + 10 * beat}px rgba(47,123,255,0.28)`}} />
                {/* status pill (header, reading-start side) */}
                <div style={{position: "absolute", right: 460, top: 272}}>
                  <PillCycle values={["کلاس زنده", "در حال ضبط", "آرشیو و بازپخش"]} valueAtFrame={[45, 188, 225]} size={30} />
                </div>
                {/* live dot next to the pill while the class is live */}
                {!recOn && t > 2.3 && (
                  <div style={{position: "absolute", right: 700, top: 296, width: 14, height: 14, borderRadius: "50%", background: palette.blueSky, boxShadow: `0 0 ${10 + 6 * Math.abs(Math.sin(t * 3))}px ${palette.blueSky}`}} />
                )}
              </>
            )}

            {/* professor tile (reading-start side) */}
            {profIn > 0.01 && (
              <div style={{position: "absolute", left: 1160, top: 340, width: 300, height: 460, borderRadius: 18, background: "rgba(10,31,74,0.6)", border: "1px solid rgba(111,167,255,0.28)", opacity: profIn, transform: `translateX(${(1 - profIn) * 40}px)`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 22, gap: 14}}>
                <Avatar r={44} />
                <div style={faStyle(32, {fontWeight: 600, color: palette.ice})}>استاد</div>
                {/* whiteboard with drawing lines */}
                <div style={{width: 244, height: 250, borderRadius: 12, background: "rgba(234,242,255,0.07)", border: "1px solid rgba(111,167,255,0.2)", marginTop: 4, padding: 20}}>
                  {[0, 1, 2].map((i) => {
                    const lp = seg(t, 1.8 + i * 0.45, 2.7 + i * 0.45, E.outQuart);
                    return (
                      <div key={i} style={{marginBottom: 34, height: 5, borderRadius: 3, width: `${(i === 1 ? 60 : 88) * lp}%`, background: i === 2 ? palette.blueSky : "rgba(234,242,255,0.55)", marginLeft: i === 1 ? "12%" : 0}} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* students 3×4 (stagger, reading order right-top → left-bottom) */}
            {Array.from({length: GRID.cols * GRID.rows}).map((_, idx) => {
              const col = idx % GRID.cols, row = Math.floor(idx / GRID.cols);
              // RTL reading order: rightmost column first
              const order = row * GRID.cols + (GRID.cols - 1 - col);
              const st = 2.5 + order * 0.09;
              const sp = seg(t, st, st + 0.5, E.outExpo);
              if (sp <= 0) return null;
              const x = gLeft + col * (GRID.tw + GRID.gap);
              const y = gTop + row * (GRID.th + GRID.gap);
              const absent = ABSENT.includes(idx);
              const tickAt = TICKED.indexOf(idx);
              const tick = tickAt >= 0 ? seg(t, 3.75 + tickAt * 0.25, 4.15 + tickAt * 0.25, E.outBack(1.4)) : 0;
              return (
                <div key={idx} style={{position: "absolute", left: x, top: y, width: GRID.tw, height: GRID.th, borderRadius: 14, background: absent ? "rgba(10,31,74,0.35)" : "rgba(10,31,74,0.6)", border: "1px solid rgba(111,167,255,0.22)", opacity: sp * (absent ? 0.55 : 1), transform: `translateY(${(1 - sp) * 18}px)`, display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <Avatar r={26} dim={absent} tint={order % 3 * 0.3} />
                  {tick > 0.01 && (
                    <svg width={40} height={40} viewBox="0 0 40 40" style={{position: "absolute", right: 2, top: 2, transform: `scale(${tick})`, transformOrigin: "100% 0%"}}>
                      <path d="M8 22 L17 30 L33 10" fill="none" stroke={palette.blueSky} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" style={{filter: `drop-shadow(0 0 6px ${palette.blueSky})`}} />
                    </svg>
                  )}
                </div>
              );
            })}

            {/* attendance counter above the grid */}
            <FaText x={GRID.cx} y={318} w={560} size={40} text={`${faDigits(presentCount)} از ${faDigits(12)} حاضر`} weight={700} color={palette.ice} family="numerals" opacity={seg(t, 3.75, 4.1)} />

            {/* REC (blue discipline) + timeline */}
            {recOn && (
              <>
                <div style={{position: "absolute", left: 470, top: 276, display: "flex", alignItems: "center", gap: 12, direction: "rtl", opacity: seg(t, 6.25, 6.55)}}>
                  <div style={{width: 20, height: 20, borderRadius: "50%", background: palette.blueMid, boxShadow: `0 0 ${12 + 8 * Math.abs(Math.sin(t * 4))}px ${palette.blueMid}`}} />
                  <div style={faStyle(30, {fontWeight: 600, color: palette.ice})}>ضبط</div>
                </div>
                <div style={{position: "absolute", left: 460, top: 856, width: 1000, height: 6, borderRadius: 3, background: "rgba(47,123,255,0.25)"}}>
                  <div style={{width: `${tlFill * 100}%`, height: 6, borderRadius: 3, background: palette.blueSky, boxShadow: `0 0 10px ${palette.blueMid}`}} />
                </div>
              </>
            )}
          </div>

          {/* ---- archive clip card ---- */}
          {cardIn > 0.01 && (
            <div style={{position: "absolute", left: 700 - 240, top: 585 - 135, width: 480, height: 270, borderRadius: 18, background: "rgba(10,31,74,0.85)", border: "1px solid rgba(111,167,255,0.35)", opacity: clamp(cardIn), transform: `scale(${0.6 + 0.4 * cardIn})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14}}>
              <div style={{width: 84, height: 84, borderRadius: "50%", background: "rgba(47,123,255,0.25)", border: `3px solid ${palette.blueMid}`, display: "flex", alignItems: "center", justifyContent: "center"}}>
                <svg width={34} height={38} viewBox="0 0 34 38"><path d="M2 2 L31 19 L2 36 Z" fill={palette.ice} /></svg>
              </div>
              <div style={faStyle(30, {fontWeight: 500, color: palette.ice})}>آرشیو</div>
            </div>
          )}

          {/* ---- replay: cursor → student → small playback window ---- */}
          {replay > 0.01 && (
            <svg width={46} height={46} viewBox="0 0 46 46" style={{position: "absolute", left: curX, top: curY, opacity: 1 - seg(t, 9.3, 9.5), filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))"}}>
              <path d="M4 4 L4 36 L13 28 L20 42 L27 38 L20 24 L33 22 Z" fill={palette.ice} stroke={palette.navy1} strokeWidth={1.5} />
            </svg>
          )}
          {click > 0.01 && (
            <div style={{position: "absolute", left: 1330 - 60 * click, top: 700 - 60 * click, width: 120 * click, height: 120 * click, borderRadius: "50%", border: `2px solid ${palette.blueSky}`, opacity: 1 - click}} />
          )}
          {playWin > 0.01 && (
            <div style={{position: "absolute", left: 1080 - 210, top: 585 - 118, width: 420, height: 236, borderRadius: 14, background: "rgba(6,16,48,0.85)", border: "1px solid rgba(111,167,255,0.35)", opacity: clamp(playWin), transform: `scale(${0.7 + 0.3 * playWin})`, overflow: "hidden"}}>
              <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center"}}>
                <svg width={30} height={34} viewBox="0 0 34 38"><path d="M2 2 L31 19 L2 36 Z" fill={palette.blueSky} /></svg>
              </div>
              <div style={{position: "absolute", left: 24, right: 24, bottom: 18, height: 5, borderRadius: 3, background: "rgba(47,123,255,0.25)"}}>
                <div style={{width: `${seg(t, 9.0, 9.5) * 100}%`, height: 5, borderRadius: 3, background: palette.blueSky}} />
              </div>
              <div style={{position: "absolute", right: 16, top: 12, ...faStyle(28, {fontWeight: 500, color: palette.ice})}}>بازپخش</div>
            </div>
          )}

          {/* capability chips */}
          <div style={{position: "absolute", left: 0, top: 938, width: 1920, display: "flex", justifyContent: "center", gap: 22, direction: "rtl"}}>
            <ChipIn p={seg(t, 2.5, 3.0, E.outCubic)} text="برگزاری کلاس‌های آنلاین" />
            <ChipIn p={seg(t, 3.75, 4.25, E.outCubic)} text="حضور و غیاب توسط استاد" />
            <ChipIn p={seg(t, 6.25, 6.75, E.outCubic)} text="ضبط کلاس توسط استاد" />
            <ChipIn p={seg(t, 8.4, 8.9, E.outCubic)} text="مشاهدهٔ کلاس‌های ضبط‌شده" />
          </div>
        </div>

        {/* exit: the window's bottom edge straightens into S3's exam baseline */}
        {exit > 0 && (
          <div style={{position: "absolute", inset: 0, opacity: exit}}>
            <div style={{position: "absolute", left: 420 + (1600 - 420) * 0 * exit, top: 890 + (760 - 890) * exit, width: 1080 + (1280 - 1080) * exit, height: 3, borderRadius: 2, background: palette.blueSky, boxShadow: `0 0 16px ${palette.blueMid}`}} />
          </div>
        )}
      </NightBase>
    </AbsoluteFill>
  );
};
