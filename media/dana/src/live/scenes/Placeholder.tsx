import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {palette, fonts} from "../kit/tokens";
import type {Theme} from "../timing";

// Placeholder scene body shared by S0..S8 until the real scenes replace it.
// Shows the Persian scene name and a local frame / time counter. Local frame 0 is the first frame of the scene.
export const PlaceholderScene: React.FC<{name: string; theme: Theme; frames: number; fps: number}> = ({
  name,
  theme,
  frames,
  fps,
}) => {
  const f = useCurrentFrame();
  const dark = theme === "dark";
  const light = theme === "light";
  const bg = dark
    ? `radial-gradient(circle at 50% 40%, ${palette.navy2} 0%, ${palette.navy0} 75%)`
    : palette.paper;
  const ink = light ? palette.ink : palette.ice;
  return (
    <AbsoluteFill style={{background: bg, color: ink, direction: "rtl", fontFamily: `"${fonts.headline}", sans-serif`}}>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
        <div
          style={{
            fontFamily: `"${fonts.display}", serif`,
            fontSize: 150,
            lineHeight: 2.5,
            textAlign: "center",
            padding: "0 80px",
          }}
        >
          {name}
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 40,
          bottom: 32,
          fontSize: 28,
          opacity: 0.7,
          direction: "ltr",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        frame {f} / {frames - 1} · {(f / fps).toFixed(2)}s · {theme}
      </div>
    </AbsoluteFill>
  );
};
