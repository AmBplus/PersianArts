// Project-owned deterministic cues for the three Shotcraft studies.
// No stock recording is bundled: each cue is synthesized from the picture timing.
import type { FilmAudio } from "./film";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const hash = (n: number) => { let x = n | 0; x = Math.imul(x ^ (x >>> 16), 0x7feb352d); x = Math.imul(x ^ (x >>> 15), 0x846ca68b); return ((x ^ (x >>> 16)) >>> 0) / 2147483648 - 1; };
const bell = (t: number, at: number, width: number) => Math.exp(-Math.pow((t - at) / width, 2) * 5);

export const shotcraftAudio = (modelId: string, frames: number, fps: number): FilmAudio => (sampleRate: number) => {
  const size = Math.round(frames * sampleRate / fps), L = new Float32Array(size), R = new Float32Array(size), duration = frames / fps;
  const cues = modelId.endsWith("ai-stream-response") ? [0.28, 0.72, 1.06, 1.40, 1.74, 2.08, 2.43, 3.08] : modelId.endsWith("assemble-then-type-flyin") ? [0.08, 0.16, 0.25, 0.35, 0.46, 0.58, 0.72, 0.88, 1.05, 1.22, 1.42, 1.65, 1.90, 2.25, 2.65] : [0.55, 1.25, 2.05, 2.85, 3.28, 3.56, 4.05];
  for (let i = 0; i < size; i++) {
    const t = i / sampleRate, noise = hash(i + 991), fade = Math.min(1, t / 0.08, (duration - t) / 0.18);
    let sample = Math.sin(2 * Math.PI * 98 * t) * 0.004 + Math.sin(2 * Math.PI * 147 * t) * 0.0025;
    if (modelId.endsWith("aurora-bloom-bg-flip")) sample += Math.sin(2 * Math.PI * (130 + 18 * Math.sin(t * 0.7)) * t) * 0.006;
    for (const at of cues) {
      const p = bell(t, at, modelId.endsWith("ai-stream-response") ? 0.014 : 0.018);
      sample += Math.sin(2 * Math.PI * (modelId.endsWith("aurora-bloom-bg-flip") ? 220 : 330) * t) * p * (modelId.endsWith("assemble-then-type-flyin") ? 0.018 : 0.013);
      sample += noise * p * 0.012;
    }
    if (modelId.endsWith("ai-stream-response")) { const whoosh = clamp((t - 0.04) / 0.22) * clamp((0.46 - t) / 0.18); sample += noise * whoosh * 0.016; }
    if (modelId.endsWith("assemble-then-type-flyin")) { const whoosh = clamp((t - 0.02) / 2.6) * clamp((2.8 - t) / 0.5); sample += noise * whoosh * 0.012; }
    if (modelId.endsWith("aurora-bloom-bg-flip")) { const swell = clamp((t - 2.65) / 0.62) * clamp((3.55 - t) / 0.35); sample += (Math.sin(2 * Math.PI * 174 * t) + Math.sin(2 * Math.PI * 261 * t)) * swell * 0.012; }
    const out = sample * clamp(fade); L[i] = out; R[i] = out * (0.94 + 0.04 * Math.sin(t * 0.8));
  }
  return [L, R];
};
