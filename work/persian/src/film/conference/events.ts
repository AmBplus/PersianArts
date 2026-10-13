// SINGLE source of picture events for the conference film (900 frames, 30 fps). events.json is generated from EVENTS by write-events.mjs.
export type EvType = "text" | "art" | "wipe" | "number" | "cta";
export interface Ev {frame: number; type: EvType; label: string}
export const FPS = 30, DURATION = 900, TW = 30;
export const SCENE_STARTS = [0, 120, 270, 450, 645, 750] as const;
export const EVENTS = {
  net: {frame: 30, type: "art", label: "scan line finishes revealing the network"},
  ping: {frame: 60, type: "art", label: "one node turns amber, ring spreads"},
  threat: {frame: 75, type: "text", label: "threat line lands"},
  wipe2: {frame: 120, type: "wipe", label: "scan line sweeps to the title field"},
  title: {frame: 135, type: "text", label: "title words land"},
  wipe3: {frame: 270, type: "wipe", label: "scan line sweeps to the gate photo scene"},
  aim: {frame: 285, type: "text", label: "aim line lands"},
  wipe4: {frame: 450, type: "wipe", label: "scan line sweeps to the server photo scene"},
  l1: {frame: 495, type: "text", label: "aim one lit"},
  l2: {frame: 540, type: "text", label: "aim two lit"},
  l3: {frame: 585, type: "text", label: "aim three lit"},
  wipe5: {frame: 645, type: "wipe", label: "scan line sweeps to the organisers field"},
  lg1: {frame: 660, type: "art", label: "first logo lands"},
  lg2: {frame: 675, type: "art", label: "second logo lands"},
  lg3: {frame: 690, type: "art", label: "third logo lands"},
  wipe6: {frame: 750, type: "wipe", label: "scan line sweeps to the date card"},
  date: {frame: 795, type: "number", label: "day number locks on its value"},
  ring: {frame: 825, type: "art", label: "perimeter ring closes around the date"},
  venue: {frame: 840, type: "text", label: "venue lines land"},
} as const satisfies Record<string, Ev>;
