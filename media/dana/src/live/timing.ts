// Timing source of truth (v2): script/v2/cue-sheet-v2.json (seconds -> frames at the sheet's fps).
// v2 film: 8 scenes, 34 bars @96bpm, 85s = 2550 frames.
import cue from "../script/v2/cue-sheet-v2.json";

export const FPS: number = cue.fps;
export const WIDTH: number = cue.width;
export const HEIGHT: number = cue.height;
export const TOTAL_FRAMES: number = cue.durationFrames;

export type Theme = "light" | "dark";

export interface SceneSpec {
  id: string; // "s0".."s7"
  compId: string; // "S0".."S7"
  name: string; // Persian scene title from the cue sheet
  theme: Theme;
  from: number; // absolute start frame
  frames: number; // duration in frames
}

const themeOf = (state: string): Theme => (state === "paper" ? "light" : "dark");

export const SCENES: SceneSpec[] = cue.scenes.map((s, i) => {
  const from = Math.round(s.start * FPS);
  const end = Math.round(s.end * FPS);
  return {
    id: `s${i}`,
    compId: `S${i}`,
    name: s.title,
    theme: themeOf(s.state),
    from,
    frames: end - from,
  };
});

export const sceneBySceneId = (id: string): SceneSpec => {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown scene ${id}`);
  return s;
};
