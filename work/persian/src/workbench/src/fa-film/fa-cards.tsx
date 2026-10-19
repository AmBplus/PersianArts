// fa-film/fa-cards.tsx — Persian typography cards for the «میزکار» film, v2.
//
// v2 changes (fix round against qc-mizkar-beauty-verdict.md, 48/100):
//  · TYPE SCALE — hero raised to the format: headline 238 (ink ≈0.24 of frame height, BTY-COMP-002 floor
//    0.22), stat value 330, outro wordmark 320. The library POSTER median (0.0917 of frame height) is a
//    poster bar; a film hero must exceed it — this film exceeds it by ~2.4x.
//  · FIELD — one plate for the whole film: #0D1D2C navy (89.7% of the library's typography posters) with a
//    56 px grid drawn 3.5% above the field, a 28 px inset keyline, a three-plane composition (plate →
//    ghost watermark → type rail → lit panel) and real drop + contact shadows on every rounded panel.
//  · CHROME — the film-level constant v1 had none of: Latin face name top-left, Persian technique name
//    top-right, footer bottom-left, inside a reserved band nothing may enter (showcase §1.2, mistake M1).
//  · MOTION — a vocabulary instead of one bezier: expo-out line reveals, a damped spring for panel/CTA
//    landings, a 3-8 px anticipation dip on the fast moves, an outBack overshoot on the outro stack, a
//    4-frame stagger per text level, and a slow ambient drift so no hold is pixel-identical.
//  · ONE ACCENT — #CE924A (library gold, desaturated). Detail layer only; area stays a small signal.
//  · NEW CARDS — FaLightPlay (replaces demo:OrbFlylineRelay: a visible lamp, a beam, a lit destination
//    panel with Persian labels, contact shadow; no sourceless arc, no placeholder bars), FaValueMarquee
//    (the marquee rebuilt in one hue at three value steps; the demo's blue/magenta cannot be recoloured
//    without editing demosrc/), FaPanelStage (presents a library card as an inset rounded panel instead of
//    a full-bleed pasted field).
//
// 16:9 ONLY. The v1 vertical cut was a mechanical 0.5625 scale that letterboxed every library beat into a
// 1080x608 band; it is deliberately held back (see manifest-film-v2-report.md), not shipped fake.
//
// Persian rules held: no letter-spacing, no uppercase, no per-letter transforms, whole-line motion only,
// every family loaded, Persian digits, RTL anchor at the reading start.
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FaFonts, FaRoot, faText, fs, FA_LH } from "@demos/_fa";

export type Tone = "dark" | "cream";

/** The one accent of the film — the library's desaturated gold, not a saturated orange. */
export const ACCENT = "#CE924A";
/** Three VALUE STEPS of that single accent (FaValueMarquee only). */
export const ACCENT_STEPS = ["#8A4E18", "#A86E28", "#CE924A"] as const;

const PALETTE = {
  dark: {
    plate: "#0D1D2C", // library navy plate
    ink: "#F4F4F3", // library neutral cream, used as ink on navy
    muted: "#93A6B6",
    line: "rgba(244,244,243,0.13)",
    grid: "rgba(244,244,243,0.035)", // 3.5% above the field (BTY-DEPTH-009)
    panel: "rgba(244,244,243,0.045)",
  },
  cream: {
    plate: "#F4F4F3", // the library's second plate: neutral cream, never a muddy mid-tone
    ink: "#141A21",
    muted: "#5D6672",
    line: "rgba(20,26,33,0.16)",
    grid: "rgba(20,26,33,0.05)",
    panel: "rgba(255,255,255,0.72)",
  },
} as const;

// ── easing vocabulary ────────────────────────────────────────────────────────────────
const EXPO = Easing.bezier(0.16, 1, 0.3, 1); // line reveals, 0.5-0.9 s
const BACK = Easing.bezier(0.34, 1.56, 0.64, 1); // overshoot / settle

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** expo-out reveal progress. */
const reveal = (frame: number, delay: number, dur = 18, easing = EXPO) =>
  interpolate(frame, [delay, delay + dur], [0, 1], { ...clamp, easing });

/** 3-8 px anticipation dip, then an outBack settle to 0. */
const anticipate = (frame: number, delay: number, dip = 7, dur = 18) => {
  if (frame <= delay + 4) return interpolate(frame, [delay, delay + 4], [0, -dip], { ...clamp, easing: EXPO });
  return interpolate(frame, [delay + 4, delay + 4 + dur], [-dip, 0], { ...clamp, easing: BACK });
};

/** slow ambient drift — keeps a "hold" from ever being pixel-identical */
const drift = (frame: number, period = 96) => Math.sin((frame / period) * Math.PI * 2);

// ── field devices ────────────────────────────────────────────────────────────────────
/** plate + 56 px grid + corner light pool + vignette (the depth layer under every beat) */
const Field: React.FC<{ tone: Tone; glowX?: string; glowY?: string; pool?: number }> = ({
  tone,
  glowX = "76%",
  glowY = "18%",
  pool = 0.13,
}) => {
  const p = PALETTE[tone];
  const alpha = Math.round(pool * 255)
    .toString(16)
    .padStart(2, "0");
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: p.plate }} />
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${p.grid} 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(1200px 820px at ${glowX} ${glowY}, ${ACCENT}${alpha}, transparent 64%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(125% 95% at 50% 50%, transparent 42%, ${
            tone === "cream" ? "rgba(60,50,30,0.18)" : "rgba(0,0,0,0.60)"
          } 100%)`,
        }}
      />
    </>
  );
};

/** 28 px inset keyline — the library's frame device (89.7% of typography posters) */
const Keyline: React.FC<{ tone: Tone }> = ({ tone }) => (
  <AbsoluteFill
    style={{
      margin: 28,
      border: `1px solid ${PALETTE[tone].line}`,
      borderRadius: 4,
      pointerEvents: "none",
    }}
  />
);

/** the film-level chrome: identical in all 8 beats, in a reserved band nothing may enter (M1) */
const Chrome: React.FC<{ tone: Tone; face: string; technique: string }> = ({ tone, face, technique }) => {
  const p = PALETTE[tone];
  const latin: React.CSSProperties = {
    fontFamily: '"Vazirmatn", sans-serif',
    fontSize: 19,
    letterSpacing: 0,
    color: p.muted,
    fontWeight: 500,
    direction: "ltr",
  };
  return (
    <>
      <div style={{ position: "absolute", top: 46, left: 58, ...latin }}>{face}</div>
      <div
        style={{
          position: "absolute",
          top: 44,
          right: 58,
          ...faText(19, { fontFamily: '"Vazirmatn", sans-serif', color: p.muted, fontWeight: 600 }),
        }}
      >
        {technique}
      </div>
      <div style={{ position: "absolute", bottom: 44, left: 58, ...latin }}>
        PersianDoodle · native motion typography
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 46,
          right: 58,
          ...faText(19, { fontFamily: '"Vazirmatn", sans-serif', color: p.muted, fontWeight: 500 }),
        }}
      >
        میزکار · نسخهٔ ۲٫۰
      </div>
      <div style={{ position: "absolute", bottom: 84, left: 58, right: 58, height: 1, background: p.line }} />
    </>
  );
};

/** large translucent watermark — the middle plane, gives the field a scale */
const Ghost: React.FC<{ text: string; tone: Tone; size: number; x: number; y: number; opacity?: number }> = ({
  text,
  tone,
  size,
  x,
  y,
  opacity = 0.07,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      opacity,
      whiteSpace: "nowrap",
      fontFamily: '"Vazirmatn", sans-serif',
      fontSize: fs(size),
      fontWeight: 800,
      lineHeight: 1,
      color: PALETTE[tone].ink,
      pointerEvents: "none",
    }}
  >
    {text}
  </div>
);

/** Panels are NAVY on BOTH plates: on the cream plate a cream-on-cream panel sits ~4% L* from its
 *  page, under the BTY-COLOR-002 floor of 12%. Navy gives the panel 80%+ separation and keeps the
 *  film's one plate family (the v1 cream panel was held together by its shadow alone). */
const panelInk = (tone: Tone) =>
  tone === "dark"
    ? { bg: "#26394C", ink: "#F4F4F3", muted: "#A9BCCB", line: "rgba(244,244,243,0.22)" }
    : { bg: "#0D1D2C", ink: "#F4F4F3", muted: "#B9C6D2", line: "rgba(244,244,243,0.18)" };

/** a rounded panel with a hairline border, a real drop shadow and a contact shadow */
const panelStyle = (tone: Tone, lit = 0): React.CSSProperties => {
  const pi = panelInk(tone);
  return {
    borderRadius: 34,
    border: `1px solid ${lit > 0.5 ? ACCENT : pi.line}`,
    background: pi.bg,
    boxShadow: `0 34px 96px rgba(0,0,0,0.5), 0 3px 0 rgba(0,0,0,0.35), 0 0 0 1px ${ACCENT}1f${
      lit > 0 ? `, 0 0 ${Math.round(70 * lit)}px ${ACCENT}66` : ""
    }`,
  };
};

/** a small visible lamp: every light pool in the film has a source (verdict §2, depth/light) */
const Lamp: React.FC<{ x: number; y: number; w?: number; power?: number }> = ({ x, y, w = 190, power = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: 8,
      borderRadius: 8,
      background: ACCENT,
      opacity: 0.55 + 0.45 * power,
      boxShadow: `0 0 ${Math.round(28 + 60 * power)}px ${ACCENT}, 0 0 ${Math.round(90 + 150 * power)}px ${ACCENT}77`,
      transform: `scaleX(${0.6 + 0.4 * power})`,
      transformOrigin: "left center",
    }}
  />
);

const SafeArea: React.FC<{ children?: React.ReactNode; pad?: number }> = ({ children, pad = 104 }) => (
  <AbsoluteFill style={{ padding: `${pad}px ${pad}px` }}>{children}</AbsoluteFill>
);

// ── 1 · hero ─────────────────────────────────────────────────────────────────────────
type TitleProps = {
  eyebrow?: string;
  headline?: string;
  deck?: string;
  ghost?: string;
  technique?: string;
  face?: string;
  tone?: Tone;
  fontSize?: number;
  duration?: number;
};

/** Hero card: eyebrow → accent rule → BIG headline on the RTL rail, plus a lit deck panel in the
 *  opposite corner, a watermark plane and the film chrome. Three planes, not one centred stack. */
export const FaTitle: React.FC<TitleProps> = ({
  eyebrow = "",
  headline = "",
  deck = "",
  ghost = "",
  technique = "تیتر",
  face = "Vazirmatn",
  tone = "dark",
  fontSize = 238,
  duration = 90,
}) => {
  const frame = useCurrentFrame();
  const p = PALETTE[tone];

  // frame 0 is never blank: eyebrow starts at 60%, the rule is already 55% drawn
  const e = interpolate(frame, [0, 8], [0.6, 1], { ...clamp, easing: EXPO });
  const rule = interpolate(frame, [0, 12], [0.55, 1], { ...clamp, easing: EXPO });
  const h = reveal(frame, -4, 24);
  const hy = anticipate(frame, 4, 8, 20);
  const dp = reveal(frame, -2, 24);
  const dpy = anticipate(frame, 14, 6, 22);
  const g = reveal(frame, -6, 26);
  const amb = drift(frame);
  const out = interpolate(frame, [duration - 8, duration], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Field tone={tone} glowX={`${74 + amb * 2}%`} glowY={`${16 + amb * 1.5}%`} pool={tone === "dark" ? 0.15 : 0.09} />
      {ghost ? <Ghost text={ghost} tone={tone} size={300} x={90} y={340} opacity={0.09 * g} /> : null}
      <SafeArea>
        {/* right rail = the RTL reading start */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: 104,
            transform: "translateY(-52%)",
            width: 1180,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 18,
            textAlign: "right",
          }}
        >
          <span
            style={faText(26, {
              fontFamily: '"Vazirmatn", sans-serif',
              color: p.muted,
              fontWeight: 600,
              opacity: e,
              transform: `translateY(${(1 - e) * 10}px)`,
            })}
          >
            {eyebrow}
          </span>
          <span
            style={{
              height: 4,
              width: 140,
              background: ACCENT,
              borderRadius: 4,
              boxShadow: `0 0 26px ${ACCENT}cc`,
              transform: `scaleX(${rule})`,
              transformOrigin: "right center",
              opacity: rule,
            }}
          />
          <h1
            style={faText(fontSize, {
              fontFamily: '"Vazirmatn", sans-serif',
              color: p.ink,
              fontWeight: 800,
              lineHeight: 1.3,
              margin: 0,
              maxWidth: 1180,
              textShadow: tone === "dark" ? `0 0 54px ${ACCENT}2e` : "none",
              opacity: h,
              transform: `translateY(${hy}px)`,
            })}
          >
            {headline}
          </h1>
        </div>
        {/* opposite corner = the deck panel (a real container with a real shadow) */}
        <div
          style={{
            position: "absolute",
            left: 104,
            bottom: 150,
            width: 470,
            padding: "30px 38px",
            ...panelStyle(tone),
            opacity: dp,
            transform: `translateY(${dpy}px)`,
          }}
        >
          <span
            style={faText(30, {
              fontFamily: '"Vazirmatn", sans-serif',
              color: panelInk(tone).ink,
              fontWeight: 500,
              lineHeight: FA_LH,
              direction: "rtl",
              textAlign: "right",
              display: "block",
            })}
          >
            {deck}
          </span>
        </div>
      </SafeArea>
      <Keyline tone={tone} />
      <Chrome tone={tone} face={face} technique={technique} />
    </AbsoluteFill>
  );
};

// ── 2 · stat ─────────────────────────────────────────────────────────────────────────
type StatProps = {
  eyebrow?: string;
  value?: string;
  label?: string;
  ghost?: string;
  technique?: string;
  face?: string;
  tone?: Tone;
  fontSize?: number;
  duration?: number;
};

/** Stat card: one huge Persian numeral in a lit panel that lands on a damped spring, with a visible
 *  lamp, a contact shadow under the panel and a slow ambient drift through the hold. */
export const FaStat: React.FC<StatProps> = ({
  eyebrow = "",
  value = "",
  label = "",
  ghost = "",
  technique = "عدد",
  face = "Vazirmatn",
  tone = "dark",
  fontSize = 330,
  duration = 90,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = PALETTE[tone];

  const land = spring({
    frame: frame - 2,
    fps,
    config: { damping: 11, stiffness: 130, mass: 0.9 },
    durationInFrames: 46,
  });
  const numP = interpolate(frame, [8, 34], [0, 1], { ...clamp, easing: BACK });
  const labelP = reveal(frame, 22, 20);
  const lampP = reveal(frame, 4, 16);
  const amb = drift(frame, 110);
  const out = interpolate(frame, [duration - 8, duration], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Field tone={tone} glowX={`${56 + amb * 6}%`} glowY={`${62 + amb * 4}%`} pool={0.16} />
      {ghost ? <Ghost text={ghost} tone={tone} size={300} x={1150} y={230} opacity={0.06} /> : null}
      <SafeArea>
        <Lamp x={104} y={170} w={230} power={lampP} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) scale(${0.94 + 0.06 * land})`,
            opacity: Math.min(1, land * 1.4),
            minWidth: 1240,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            padding: "54px 92px",
            ...panelStyle(tone, lampP),
          }}
        >
          <span style={faText(26, { fontFamily: '"Vazirmatn", sans-serif', color: panelInk(tone).muted, fontWeight: 600 })}>
            {eyebrow}
          </span>
          <span
            style={faText(fontSize, {
              fontFamily: '"Vazirmatn", sans-serif',
              color: panelInk(tone).ink,
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: 0,
              whiteSpace: "nowrap",
              textShadow: `0 0 70px ${ACCENT}4d`,
              opacity: numP,
              transform: `scale(${1 + (1 - numP) * 0.09})`,
            })}
          >
            {value}
          </span>
          <span
            style={faText(34, {
              fontFamily: '"Vazirmatn", sans-serif',
              color: panelInk(tone).muted,
              fontWeight: 500,
              textAlign: "center",
              maxWidth: 940,
              opacity: labelP,
            })}
          >
            {label}
          </span>
        </div>
      </SafeArea>
      <Keyline tone={tone} />
      <Chrome tone={tone} face={face} technique={technique} />
    </AbsoluteFill>
  );
};

// ── 3 · light play (replaces demo:OrbFlylineRelay) ────────────────────────────────────
type LightPlayProps = {
  eyebrow?: string;
  headline?: string;
  deck?: string;
  technique?: string;
  face?: string;
  tone?: Tone;
  fontSize?: number;
  duration?: number;
};

/** A real light beat: a visible lamp, a beam that sweeps to a lit destination panel, a contact
 *  shadow and Persian labels on both ends. No sourceless arc, no placeholder bars. */
export const FaLightPlay: React.FC<LightPlayProps> = ({
  eyebrow = "",
  headline = "",
  deck = "",
  technique = "نور",
  face = "Vazirmatn",
  tone = "dark",
  fontSize = 238,
  duration = 100,
}) => {
  const frame = useCurrentFrame();
  const p = PALETTE[tone];

  const lampP = reveal(frame, 0, 14);
  const beam = interpolate(frame, [-6, 30], [0, 1], { ...clamp, easing: EXPO });
  const h = reveal(frame, -8, 26);
  const hy = anticipate(frame, -8, 8, 26);
  const panelIn = interpolate(frame, [10, 40], [0, 1], { ...clamp, easing: BACK });
  const lit = interpolate(frame, [16, 44], [0, 1], { ...clamp, easing: EXPO });
  const amb = drift(frame, 104);
  const out = interpolate(frame, [duration - 8, duration], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Field tone={tone} glowX={`${30 + amb * 4}%`} glowY={`${70 + amb * 3}%`} pool={0.18} />
      <div
        style={{
          position: "absolute",
          left: 300,
          top: -120,
          width: 1900,
          height: 620,
          transform: `rotate(26deg) translateY(${(1 - beam) * -260}px)`,
          transformOrigin: "left center",
          opacity: 0.5 * beam,
          background: `linear-gradient(90deg, ${ACCENT}00 0%, ${ACCENT}2e 42%, ${ACCENT}00 88%)`,
          filter: "blur(6px)",
        }}
      />
      <Lamp x={1460} y={196} w={250} power={lampP} />
      <div
        style={{
          position: "absolute",
          top: 150,
          right: 58,
          ...faText(22, { fontFamily: '"Vazirmatn", sans-serif', color: p.muted, fontWeight: 600, opacity: lampP }),
        }}
      >
        منبعِ نور
      </div>
      <SafeArea>
        <div
          style={{
            position: "absolute",
            right: 104,
            top: 210,
            width: 1180,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 18,
            textAlign: "right",
          }}
        >
          <span
            style={faText(26, {
              fontFamily: '"Vazirmatn", sans-serif',
              color: p.muted,
              fontWeight: 600,
              opacity: reveal(frame, -4, 16),
            })}
          >
            {eyebrow}
          </span>
          <h1
            style={faText(fontSize, {
              fontFamily: '"Vazirmatn", sans-serif',
              color: p.ink,
              fontWeight: 800,
              lineHeight: 1.3,
              margin: 0,
              maxWidth: 1180,
              opacity: h,
              transform: `translateY(${hy}px)`,
            })}
          >
            {headline}
          </h1>
        </div>
        {/* the destination panel: lit when the beam arrives; contact shadow underneath */}
        <div
          style={{
            position: "absolute",
            left: 104,
            bottom: 158,
            width: 720,
            padding: "30px 40px",
            ...panelStyle(tone, lit),
            opacity: panelIn,
            transform: `translateY(${(1 - panelIn) * 22}px)`,
          }}
        >
          <span
            style={faText(19, {
              fontFamily: '"Vazirmatn", sans-serif',
              color: lit > 0.6 ? ACCENT : p.muted,
              fontWeight: 600,
              display: "block",
              marginBottom: 10,
            })}
          >
            مقصد · پیش‌نمایش
          </span>
          <span
            style={{
              fontFamily: '"Vazirmatn", sans-serif',
              fontSize: fs(30),
              lineHeight: FA_LH,
              color: panelInk(tone).ink,
              fontWeight: 500,
              direction: "rtl",
              textAlign: "right",
              display: "block",
            }}
          >
            {deck}
          </span>
        </div>
      </SafeArea>
      <Keyline tone={tone} />
      <Chrome tone={tone} face={face} technique={technique} />
    </AbsoluteFill>
  );
};

// ── 4 · outro ────────────────────────────────────────────────────────────────────────
type OutroProps = {
  name?: string;
  tagline?: string;
  cta?: string;
  technique?: string;
  face?: string;
  tone?: Tone;
  fontSize?: number;
  duration?: number;
};

/** Closing card: Lalezar wordmark with a visible light source above it, a quiet tagline and one
 *  accent pill that lands on a spring (outBack overshoot + settle) with a contact shadow. */
export const FaOutro: React.FC<OutroProps> = ({
  name = "",
  tagline = "",
  cta = "",
  technique = "امضا",
  face = "Lalezar",
  tone = "dark",
  fontSize = 320,
  duration = 110,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = PALETTE[tone];

  const nameP = interpolate(frame, [0, 10], [0.5, 1], { ...clamp, easing: EXPO });
  const nameY = anticipate(frame, 0, 8, 20);
  const tagP = reveal(frame, 12, 20);
  const ctaLand = spring({
    frame: frame - 24,
    fps,
    config: { damping: 9, stiffness: 140, mass: 0.8 },
    durationInFrames: 44,
  });
  const glow = interpolate(frame, [8, 46, duration], [0.35, 1, 0.72], clamp);
  const amb = drift(frame, 88);
  const out = interpolate(frame, [duration - 10, duration], [1, 0], clamp);

  return (
    <FaFonts families={["Vazirmatn", "Lalezar"]}>
      <FaRoot family="Vazirmatn">
        <AbsoluteFill style={{ opacity: out }}>
          <Field tone={tone} glowX={`${50 + amb * 2}%`} glowY={`${44 + amb * 2}%`} pool={0.2} />
          <SafeArea>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "46%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 24,
                textAlign: "center",
              }}
            >
              {/* the source of the halo, visible (v1's pool had no source) */}
              <div
                style={{
                  position: "absolute",
                  top: -46,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 300,
                  height: 8,
                  borderRadius: 8,
                  background: ACCENT,
                  opacity: 0.5 + 0.5 * glow,
                  boxShadow: `0 0 ${Math.round(40 + 90 * glow)}px ${ACCENT}, 0 0 220px ${ACCENT}55`,
                }}
              />
              <span
                style={{
                  fontFamily: '"Lalezar", "Vazirmatn", sans-serif',
                  fontSize: fs(fontSize),
                  lineHeight: 1.22,
                  color: p.ink,
                  textShadow: `0 0 ${Math.round(78 * (0.3 + glow))}px ${ACCENT}aa, 0 10px 40px rgba(0,0,0,0.5)`,
                  opacity: nameP,
                  transform: `translateY(${nameY}px)`,
                }}
              >
                {name}
              </span>
              <span
                style={faText(38, {
                  fontFamily: '"Vazirmatn", sans-serif',
                  color: p.muted,
                  fontWeight: 500,
                  opacity: tagP,
                  transform: `translateY(${(1 - tagP) * 14}px)`,
                })}
              >
                {tagline}
              </span>
              <span
                style={faText(30, {
                  fontFamily: '"Vazirmatn", sans-serif',
                  fontWeight: 700,
                  color: tone === "dark" ? "#0A1017" : "#20170C",
                  background: ACCENT,
                  padding: `${Math.round(fs(16))}px ${Math.round(fs(40))}px`,
                  borderRadius: 999,
                  marginTop: 14,
                  boxShadow: `0 0 60px ${ACCENT}88, 0 22px 46px rgba(0,0,0,0.5)`,
                  opacity: Math.min(1, ctaLand * 1.5),
                  transform: `translateY(${(1 - ctaLand) * 20}px) scale(${0.94 + 0.06 * ctaLand})`,
                })}
              >
                {cta}
              </span>
            </div>
          </SafeArea>
          <Keyline tone={tone} />
          <Chrome tone={tone} face={face} technique={technique} />
        </AbsoluteFill>
      </FaRoot>
    </FaFonts>
  );
};

// ── 5 · value marquee (rebuilt: ONE hue, three value steps) ───────────────────────────
const MarqueeRow: React.FC<{
  word: string;
  widthEm: number;
  color: string;
  dir: 1 | -1;
  speed: number;
  frame: number;
  y: number;
  fontSize: number;
  brightness: number;
}> = ({ word, widthEm, color, dir, speed, frame, y, fontSize, brightness }) => {
  const est = widthEm * fontSize;
  const unitW = est + fontSize * 1.3;
  const copies = Math.ceil(1920 / unitW) + 3;
  const offsetRaw = (frame * speed) % unitW;
  const offset = -(dir === 1 ? -unitW * 1.5 + offsetRaw : -unitW * 0.5 - offsetRaw);
  const strokeW = 4 + brightness * 2.5;
  const r = strokeW / 2;
  const fid = `fa-marquee-outline-${word.length}-${Math.round(y)}`;

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        right: 0,
        width: "100%",
        height: fontSize * 1.1,
        overflow: "visible",
        transform: `translateX(${offset}px)`,
        fontFamily: '"Lalezar", "Vazirmatn", sans-serif',
        fontSize,
        letterSpacing: 0,
        direction: "rtl",
        lineHeight: 1,
        color,
        opacity: 0.45 + brightness * 0.55,
        filter: `url(#${fid}) drop-shadow(0 0 ${6 + brightness * 16}px ${color})`,
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter
          id={fid}
          filterUnits="userSpaceOnUse"
          x={-3000}
          y={-300}
          width={8000}
          height={fontSize * 2}
          colorInterpolationFilters="sRGB"
        >
          <feMorphology in="SourceAlpha" operator="dilate" radius={r} result="d" />
          <feMorphology in="SourceAlpha" operator="erode" radius={r} result="e" />
          <feComposite in="d" in2="e" operator="out" result="ring" />
          <feFlood floodColor={color} />
          <feComposite in2="ring" operator="in" />
        </filter>
      </svg>
      {Array.from({ length: copies }).map((_, i) => (
        <span key={i} style={{ position: "absolute", right: i * unitW, top: 0, whiteSpace: "nowrap" }}>
          {word}
          <span style={{ display: "inline-block", transform: `translateX(${-fontSize * 0.4}px)` }}>•</span>
        </span>
      ))}
    </div>
  );
};

/** The close: three Persian words in a counter-flow marquee, all three in VALUE STEPS of the one accent
 *  (the v1 demo carried blue + magenta + amber, which a one-accent film cannot ship), sized so a whole
 *  word reads inside the frame, with the three rows separated by value rather than by hue (M7). */
export const FaValueMarquee: React.FC<{ technique?: string; face?: string; duration?: number }> = ({
  technique = "شعار",
  face = "Lalezar",
  duration = 130,
}) => {
  const f = useCurrentFrame();
  const pulse = (idx: number) => {
    const period = 45;
    const phase = (((f - idx * (period / 3)) % period) + period) % period;
    const t = phase / period;
    if (t < 1 / 3) return 0.5 - 0.5 * Math.cos(t * 3 * Math.PI * 2);
    return 0;
  };
  const groupOpacity = interpolate(f, [0, 14, duration - 20, duration - 6], [0, 1, 1, 0], clamp);
  const rows: { word: string; widthEm: number; color: string; dir: 1 | -1; speed: number }[] = [
    { word: "بهتر", widthEm: 1.4, color: ACCENT_STEPS[0], dir: 1, speed: 11 },
    { word: "سریع‌تر", widthEm: 2.6, color: ACCENT_STEPS[1], dir: -1, speed: 13 },
    { word: "قوی‌تر", widthEm: 2.15, color: ACCENT_STEPS[2], dir: 1, speed: 11 },
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Field tone="dark" glowX="50%" glowY="34%" pool={0.1} />
      <div style={{ opacity: groupOpacity, position: "absolute", inset: 0 }}>
        {rows.map((r, i) => (
          <MarqueeRow
            key={r.word}
            word={r.word}
            widthEm={r.widthEm}
            color={r.color}
            dir={r.dir}
            speed={r.speed}
            frame={f}
            y={130 + i * 285}
            fontSize={250}
            brightness={pulse(i)}
          />
        ))}
      </div>
      <Keyline tone="dark" />
      <Chrome tone="dark" face={face} technique={technique} />
    </AbsoluteFill>
  );
};

// ── 6 · panel stage (library cards, presented not pasted) ─────────────────────────────
/** Presents a 1920x1080 library card as an INSET rounded panel on the film's navy plate: keyline,
 *  grid, chrome and a real drop shadow around it, so the card reads as a page panel instead of a
 *  full-bleed field that hard-cuts the film's arc. `desaturate` neutralises a card-native accent we
 *  are not allowed to edit inside demosrc/ (verdict fix 4: UnitDotSwarmRegroupV2's #b45309). */
export const FaPanelStage: React.FC<{
  children?: React.ReactNode;
  technique?: string;
  face?: string;
  insetX?: number;
  insetY?: number;
  desaturate?: number;
}> = ({ children, technique = "کارت کتابخانه", face = "Vazirmatn", insetX = 96, insetY = 96, desaturate = 0 }) => {
  // the WHOLE 1920x1080 card is presented: never cropped, never stretched into a letterbox band
  const s = Math.min((1920 - insetX * 2) / 1920, (1080 - insetY * 2) / 1080);
  return (
    <AbsoluteFill>
      <Field tone="dark" glowX="50%" glowY="18%" pool={0.12} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: Math.round(1920 * s),
            height: Math.round(1080 * s),
            position: "relative",
            borderRadius: 34,
            overflow: "hidden",
            border: "1px solid rgba(244,244,243,0.16)",
            boxShadow: "0 44px 130px rgba(0,0,0,0.66)",
            filter: desaturate > 0 ? `saturate(${desaturate})` : undefined,
          }}
        >
          <div
            style={{
              width: 1920,
              height: 1080,
              transform: `scale(${s})`,
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        </div>
      </AbsoluteFill>
      <Keyline tone="dark" />
      <Chrome tone="dark" face={face} technique={technique} />
    </AbsoluteFill>
  );
};

export const faCardComponents = { FaTitle, FaStat, FaOutro, FaLightPlay, FaValueMarquee };
