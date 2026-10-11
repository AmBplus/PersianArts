import React from "react";
import {Composition} from "remotion";
import {FPS, HEIGHT, SCENES, TOTAL_FRAMES, WIDTH} from "./timing";
import {Dana, SCENE_COMPONENTS} from "./Dana";
import {DanaFonts} from "./kit/fonts";
import {S0_FRAMES} from "./scenes/S0";
import {S1_FRAMES} from "./scenes/S1";
import {S2_FRAMES} from "./scenes/S2";
import {S3_FRAMES} from "./scenes/S3";
import {S4_FRAMES} from "./scenes/S4";
import {S5_FRAMES} from "./scenes/S5";
import {S6_FRAMES} from "./scenes/S6";
import {S7_FRAMES} from "./scenes/S7";
import {KitV2ShowcaseB} from "./kit/motion/KitV2ShowcaseB";
import {KitV2ShowcaseA} from "./kit/motion/KitV2ShowcaseA";
import {DanaV3} from "./DanaV3";
import {DanaV31} from "./DanaV31";

const FRAMES_BY_SCENE: Record<string, number> = {
  s0: S0_FRAMES, s1: S1_FRAMES, s2: S2_FRAMES, s3: S3_FRAMES, s4: S4_FRAMES,
  s5: S5_FRAMES, s6: S6_FRAMES, s7: S7_FRAMES,
};

// Each scene composition renders its own local frames 0..n-1, wrapped with the font gate.
const sceneWrapped = (id: string): React.FC => {
  const C = SCENE_COMPONENTS[id];
  return () => (
    <DanaFonts>
      <C />
    </DanaFonts>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Dana" component={Dana} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="DanaV3" component={DanaV3} durationInFrames={2118} fps={30} width={1920} height={1080} />
    <Composition id="DanaV31" component={DanaV31} durationInFrames={2118} fps={30} width={1920} height={1080} />
    <Composition id="KitV2Showcase-B" component={KitV2ShowcaseB} durationInFrames={300} fps={30} width={1920} height={1080} />
    <Composition
      id="KitV2Showcase-A"
      component={() => (
        <DanaFonts>
          <KitV2ShowcaseA />
        </DanaFonts>
      )}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
    {SCENES.map((s) => (
      <Composition
        key={s.compId}
        id={s.compId}
        component={sceneWrapped(s.id)}
        durationInFrames={FRAMES_BY_SCENE[s.id]}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    ))}
  </>
);
