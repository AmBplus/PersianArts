// Nodes (pins): glowing dots the actors attach to; Sparkle (4-point glint); Chip (small label pill); Glass (frosted card).
import React from "react";
import {palette} from "./tokens";
import {E, clamp} from "./easing";
import {faStyle} from "./fa";

export const NodeDot: React.FC<{x: number; y: number; p: number; ringT?: number; r?: number; color?: string; opacity?: number}> = ({x, y, p, ringT = -1, r = 11, color = palette.blueSky, opacity = 1}) => {
  const pop = E.outBack(1.8)(clamp(p));
  const ring = ringT >= 0 ? clamp(ringT / 0.9) : -1;
  return (
    <div style={{position: "absolute", left: x, top: y, width: 0, height: 0, opacity: opacity * clamp(p * 4)}}>
      <div style={{position: "absolute", left: -r * 3.2 * pop, top: -r * 3.2 * pop, width: r * 6.4 * pop, height: r * 6.4 * pop, borderRadius: "50%", background: color, opacity: 0.28, filter: "blur(9px)"}} />
      <div style={{position: "absolute", left: -r * pop, top: -r * pop, width: r * 2 * pop, height: r * 2 * pop, borderRadius: "50%", background: "#fff", boxShadow: `0 0 ${r * 1.6}px ${color}`}} />
      {ring >= 0 && ring < 1 && (
        <div style={{position: "absolute", left: -r * (1 + ring * 4.2), top: -r * (1 + ring * 4.2), width: r * 2 * (1 + ring * 4.2), height: r * 2 * (1 + ring * 4.2), borderRadius: "50%", border: `2px solid ${color}`, opacity: (1 - ring) * 0.8}} />
      )}
    </div>
  );
};

export const Sparkle: React.FC<{x: number; y: number; p: number; size?: number; color?: string}> = ({x, y, p, size = 90, color = "#FFFFFF"}) => {
  const k = Math.sin(Math.PI * clamp(p));          // grows then fades
  if (k <= 0.002) return null;
  const s = size * (0.35 + 0.65 * k);
  return (
    <svg width={s * 2} height={s * 2} viewBox="-100 -100 200 200" style={{position: "absolute", left: x - s, top: y - s, opacity: k, overflow: "visible", transform: `rotate(${p * 40}deg)`, filter: `drop-shadow(0 0 ${size * 0.18}px ${color})`}}>
      <path d="M0 -100 C6 -22 22 -6 100 0 C22 6 6 22 0 100 C-6 22 -22 6 -100 0 C-22 -6 -6 -22 0 -100Z" fill={color} />
    </svg>
  );
};

export const Chip: React.FC<{x: number; y: number; label: string; p: number; size?: number; dot?: string; tone?: "night" | "light"}> = ({x, y, label, p, size = 34, dot = palette.blueSky, tone = "night"}) => {
  const e = E.outCubic(clamp(p));
  const night = tone === "night";
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) translateY(${(1 - e) * 22}px) scale(${0.94 + 0.06 * e})`, opacity: e, display: "flex", alignItems: "center", gap: 14, padding: "12px 26px", borderRadius: 999, background: night ? "rgba(234,242,255,0.09)" : "rgba(11,58,168,0.08)", border: `1px solid ${night ? "rgba(234,242,255,0.22)" : "rgba(11,58,168,0.22)"}`, backdropFilter: "blur(14px)", whiteSpace: "nowrap", ...faStyle(size, {fontWeight: 600, color: night ? palette.ice : palette.ink})}}>
      <span style={{width: 12, height: 12, borderRadius: "50%", background: dot, boxShadow: `0 0 12px ${dot}`}} />
      <span>{label}</span>
    </div>
  );
};

export const Glass: React.FC<{x: number; y: number; w: number; h: number; p?: number; radius?: number; tone?: "night" | "light"; children?: React.ReactNode; style?: React.CSSProperties}> = ({x, y, w, h, p = 1, radius = 28, tone = "night", children, style}) => {
  const e = E.outCubic(clamp(p));
  const night = tone === "night";
  return (
    <div style={{position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: radius, opacity: e, transform: `translateY(${(1 - e) * 30}px) scale(${0.96 + 0.04 * e})`, background: night ? "linear-gradient(160deg, rgba(234,242,255,0.14), rgba(234,242,255,0.05))" : "linear-gradient(160deg, rgba(255,255,255,0.9), rgba(234,242,255,0.7))", border: `1px solid ${night ? "rgba(234,242,255,0.24)" : "rgba(11,58,168,0.16)"}`, boxShadow: night ? "0 30px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)" : "0 24px 60px rgba(11,58,168,0.14)", backdropFilter: "blur(18px)", overflow: "hidden", ...style}}>
      {children}
    </div>
  );
};
