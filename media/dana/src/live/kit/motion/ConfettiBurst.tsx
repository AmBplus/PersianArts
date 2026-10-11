// T2 primitive — ConfettiBurst. Small re-implementation of the "counter-confetti"
// technique (source card was todo; only the motion idea is ported, per spec B table).
// Motion: ~18 6px particles burst from `origin` in an upward cone, half to the upper-left
// and half to the upper-right; ballistic gravity, per-particle rotation, 0.5s life
// (15 frames @30fps), rise capped at ~220px; colors only blue-sky / blue-mid.
// Determinism: every per-particle value (side, angle, speed, spin, stagger) is derived
// from its index through the seeded `rnd()` hash — precomputed once per render, no
// Math.random anywhere, so every frame is reproducible.
import React from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {rnd, clamp} from "../easing";
import {palette} from "../tokens";

const G = 1500; // px/s^2 gravity
const LIFE_S = 0.5; // 0.5s life @30fps
const MAX_RISE = 220; // px

interface Particle {
  vx: number;
  vy: number;
  rot0: number;
  spin: number;
  delay: number;
  color: string;
}

const buildParticles = (count: number, colors: [string, string]): Particle[] =>
  Array.from({length: count}, (_, i) => {
    const r1 = rnd(i * 3 + 1);
    const r2 = rnd(i * 3 + 2);
    const r3 = rnd(i * 3 + 3);
    const side = i % 2 === 0 ? -1 : 1; // alternate upper-left / upper-right
    const angleFromVertical = (20 + r1 * 55) * (Math.PI / 180); // 20..75 deg off vertical
    const speed = 380 + r2 * 320; // px/s
    let vy = speed * Math.cos(angleFromVertical);
    const vx = side * speed * Math.sin(angleFromVertical);
    // cap the rise so no particle exceeds ~220px above the origin
    const vyMax = Math.sqrt(2 * G * MAX_RISE) * 0.97;
    const vScale = vy > vyMax ? vyMax / vy : 1;
    vy *= vScale;
    return {
      vx: vx * vScale,
      vy,
      rot0: r1 * 360,
      spin: (r2 * 2 - 1) * 720, // deg/s
      delay: Math.floor(r3 * 5), // 0..4 frame stagger
      color: colors[i % 2],
    };
  });

export const ConfettiBurst: React.FC<{
  origin: {x: number; y: number};
  /** local frame at which the burst fires */
  t0: number;
  count?: number;
  colors?: [string, string];
  dir?: "up";
  lifeFrames?: number;
}> = ({origin, t0, count = 18, colors = [palette.blueSky, palette.blueMid], dir = "up", lifeFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const life = (lifeFrames ?? LIFE_S * fps) / fps;
  const particles = buildParticles(count, colors);

  if (dir !== "up") return null; // only the film's upward cone is specified

  return (
    <>
      {particles.map((p, i) => {
        const t = (frame - t0 - p.delay) / fps;
        if (t < 0 || t > life) return null;
        const px = origin.x + p.vx * t;
        const py = origin.y + p.vy * t + 0.5 * G * t * t;
        const rot = p.rot0 + p.spin * t;
        const fade = 1 - clamp((t - life * 0.7) / (life * 0.3)); // hold, then fade in the last 30%
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px - 3,
              top: py - 3,
              width: 6,
              height: 6,
              borderRadius: 1.5,
              background: p.color,
              transform: `rotate(${rot}deg) scale(${0.4 + 0.6 * fade})`,
              opacity: fade,
              boxShadow: `0 0 6px ${p.color}66`,
            }}
          />
        );
      })}
    </>
  );
};
