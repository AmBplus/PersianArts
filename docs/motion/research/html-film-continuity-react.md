# html-film lane: continuous scenes and React-in-the-file (decision brief)

Date 2026-10-13. Worker: Sonnet (research + pilot). Read: work/persian/htmlfilm/SPEC.md, pencil/film.v2.html (header, render(), sceneHook, 8-frame wipe).
Status: Q2 numbers are measured (this machine, capture.mjs, 240 frames). Q1 patterns are designed, NOT yet built or measured.

## Q1. How scenes flow into each other

Today (film.v2.html): `render(n)` picks ONE scene function by cut frame, builds its HTML string, sets `stage.innerHTML`. The only continuity is an 8-frame clip-path wipe (outgoing and incoming both rendered). The pen is re-created per scene, so nothing travels. For flow, replace "a scene function owns everything" with a `world`: persistent actors + a camera; scenes = time ranges that decide what exists.

Shape (still one pure function of t):
```js
const world = t => {
  const cam  = camTrack(t);      // {x,y,zoom,rot}: keyframes + easing, pure
  const pen  = penTrack(t);      // {x,y,angle,squash,mood}: keyframes, pose at end of scene k = pose at start of k+1
  const live = SCENES.filter(s => t >= s.t0 - s.pre && t < s.t1 + s.post);   // overlap window
  return {cam, pen, scenes: live.map(s => ({s, f: s.clock(t)}))};
};
render = t => { const w = world(t);
  stage.innerHTML = svg(`<g transform="${camTransform(w.cam)}">${w.scenes.map(drawPlace)}</g>${drawPen(w.pen)}`); };
```

Pattern A: persistent actor with a hand-off track (the pen walks from scene to scene)
- Actor = keyframe track `[t, x, y, angle, squash, mood, ease]`. Between scenes the pen travels (hop/walk arc) from the last pose of scene k to the first pose of k+1. Scenes read `pen` instead of computing their own, so the stroke tip = pen position and ribbon progress and pen cannot disagree.
- Ink trail is derived, not stored: sample `penTrack(u)` for u in [t0, t] (60-140 points) and feed the existing ribbon(pts, p).
- Cost: 1 extra group, 0 filters, 140 trail points (what the hook already does). Risk: low. Authoring risk: tracks must be edited together with cut times; keep one `TRACKS` table next to `CUT_BEATS`.

Pattern B: one big stage + camera (scenes are places)
- Each scene gets a place {x,y} on a large canvas; camera keyframes pan/zoom between places; the pen walks on the same canvas and the camera can follow it (cam = pen + offset, eased). Background colour change = a place-sized rect travelling with the pan, not the stage background.
- Cost: render only places intersecting the view (cull by t range): DOM stays at one scene plus the neighbour during a pan; no filters; one `transform` on the world group. Risk: medium. (1) Zoom of rasterised text can look soft: do zoom in SVG/font-size math or cap zoom at about 1.0-1.3. (2) Safe-zone HUD must sit outside the camera group. (3) Persian text boxes: never transform per character.

Pattern C: shared-element morph (FLIP as a pure function)
- An element has a rect in scene A and one in scene B (both from `slot()`). During the overlap `rect = lerp(rectA, rectB, ease(k))`, rendered once; interpolate font-size (not scale: no blur, no aspect distortion); content crossfades inside the same box (counter digit becomes the stopwatch centre; stamp word block becomes the title badge).
- Cost: one node instead of two; no filters. Risk: low-medium when text length differs (fit width, letter-spacing stays 0). Matching cut = same idea with a 0-length overlap: scene B starts with the shared element on the exact pose scene A ended on.

Pattern D: overlap cuts and story-owned transitions (stroke wipe, paper turn, time remap)
- Overlap (J/L style): scene window `[t0 - pre, t1 + post]`; both render during the overlap, incoming revealed by a mask. A sound lead is only a shift of cue times in EVENTS; the picture cut stays on the beat.
- Wipe from the stroke: reveal mask = the pen's own trail (incoming scene inside a `<clipPath>` made from the trail ribbon thickened to full height, or a sweep polygon whose leading edge is the pen). Paper turn: clip-path polygon for the incoming page + one linear-gradient shadow strip at the fold; no filter.
- Time remap: scene clock `f = remap(t - t0)` with an ease-in-out speed ramp (slow, hold, whoosh); `remap` must be monotonic and pure.
- Cost: DOM doubles during the overlap only (0.3-0.5 s); clip-path/mask is cheap in headless chrome; avoid SVG `filter` and huge masks during capture. Risk: medium (clip edges antialias differently in player vs capture: verify by stills).

Recommendation Q1: build A first (smallest change, biggest "alive" effect), then D's stroke-wipe (reuses A's trail); B only if the story needs travel through places; C is per-scene decoration.

## Q2. React in the single file: measured micro-pilot

Pilot: lab/react/film.jsx = HOOK scene (two stamp-ins, ink splats, scribble ribbon, bad-mood pen) as components Ribbon, Pen, Stamp, Splat, Svg, Txt; `<Film n/>` is a pure tree; `seek(t)` runs `flushSync(root.render(...))`. build.mjs (esbuild JS API, minify, IIFE) writes ONE html: header comment (first block comment of film.jsx) + CSS + base64 font + bundled JS. esbuild was not in htmlfilm (only in library-app), so it was installed into lab/react (20 s one-off). Capture: `node capture.mjs --html <file> --frames 0-239`.

| measure | vanilla film.v2 (frames 0-239) | React 19 | Preact 10 + compat |
|---|---|---|---|
| build time | none | 0.06 s | 0.11 s |
| film file size | 32.7 KB (+ 2 font files outside) | 544 KB (font 320 KB base64 + react-dom 230 KB js) | 340 KB (font 320 KB + 22 KB js) |
| capture 240 frames | 18.4 s = 13.0 fps | 14.4 s = 16.6 fps | 14.4 s = 16.7 fps |
| determinism | n/a | two captures: identical mp4 md5 and identical per-frame md5 | frames identical to React |
| SSIM vs vanilla, hook frames 0-65 | 1 | 0.99996 (per-frame 1.0 down to 0.9999) | 1.000000 vs React |

Caveats: vanilla frames 66-239 are four heavier scenes, React/Preact hold the hook, so the fps are NOT a fair speed claim. The safe reading: render cost is invisible next to screenshot+encode (about 60 ms/frame). A first SSIM reading of 0.934 came from a wrong comparison command; with identical trims it is 0.99996.

Findings that cost time (adoption risks):
1. Preact core without compat renders camelCase SVG props wrongly (`strokeWidth` became an unknown attribute: thin strokes, broken text layout). Fix: `import "preact/compat"` once; then pixel-identical to React. An agent must know this.
2. esbuild `alias` rejects relative names like "./rt.js"; use a bare name.
3. Inlined font is +33% size (base64): Estedad + Vazirmatn would be about 700 KB. Fine, but the generated film.html makes huge git diffs: do not commit the build output.
4. This shell's heredocs broke on quotes; write files with the editor tool.

Does React help an LLM agent author? Honest view.
- Helps: named components (Pen, Ribbon, Stamp, Counter, Wipe, Splat) are shorter and safer than string templates (no escaping or manual `.toFixed` string bugs); JSX reads as the scene graph; `<Scene from to>` wrappers fit the world/actor model of Q1; small diffs per fix.
- Does not help: motion math (easing, tracks) is the same plain JS; no runtime benefit (every frame is re-rendered anyway, reconciliation is pure overhead, invisible here); adds a build step, node_modules and a source/generated split: "one self-documenting file" becomes one SOURCE (film.jsx) plus a generated film.html which must never be hand-edited.
- Cost of the step in this test: 0.06-0.11 s; the real cost is process discipline.

Options:
- (a) vanilla template strings: no dependency, direct edit; weak on escaping and components.
- (b) React + esbuild: works, deterministic, 544 KB; 230 KB runtime for one render() call. Overkill.
- (c) in-browser Babel/CDN: rejected (offline, slow).
- (d) Preact + compat + esbuild: same JSX authoring, 22 KB runtime, identical frames. Best build-step option. vite-plugin-singlefile is unnecessary: esbuild + a 30-line build.mjs already inlines everything.
- (e) Not tested: vanilla plus a 20-line hyperscript `h()` helper emitting strings, giving components with no build step. Worth a try if the owner rejects any build.

## Recommendation
- Q1: Pattern A (persistent pen track + trail), then stroke-driven wipe (D); B and C when a film needs them.
- Q2: components + one source file wanted: Preact + compat + esbuild (film.jsx -> build.mjs -> film.html), not full React. If "open the file and edit it" matters more: stay vanilla, add the `h()` helper. Plain React: no.
- Layout: `<film>/film.jsx` (source of truth; documentation header = first block comment, copied into the html by build.mjs; scene table, EVENTS, palette as consts); `htmlfilm/build.mjs --film <dir>` (shared); `<film>/fonts/*.ttf` (inlined as base64 @font-face, fixed family names); output `<film>/film.html` (generated, git-ignored or marked generated; capture.mjs unchanged since seek(t) is the same contract); node_modules once in htmlfilm/ (git-ignored).

## First 3 steps (small orders)
1. Builder (GLM flash, 20 min): move lab/react/build.mjs to htmlfilm/build.mjs with `--film <dir>`; inline all fonts in `<dir>/fonts`; fail if the header comment is missing or output contains "http". Acceptance: build of lab/react works; capture frames 0-65 SSIM >= 0.9999 vs current stills; two builds byte-identical.
2. Port one scene (GLM flash, 20 min each): scene 2 (counter + ring) to JSX; extract Pen/Ribbon/Stamp to `htmlfilm/kit.jsx`. Acceptance: SSIM >= 0.999 vs film.v2 frames of that scene; report source line count vs vanilla.
3. Continuity pilot (Sol or GLM, 20 min): Pattern A in the React pilot: penTrack hand-off hook -> counter (no re-spawn) plus stroke-driven wipe. Acceptance: stills at cut-4, cut, cut+4 show the pen continuing at the same pose; two captures of 0-240 have identical frame-md5 lists; fps compared with the 8-frame-wipe baseline.

Files: work/persian/htmlfilm/lab/react/{film.jsx, build.mjs, rt.react.js, rt.preact.js, package.json, .gitignore}; generated (ignored) film.react.html, film.preact.html, out/*.mp4, out/s30_*.png. Progress: work/persian/progress-html-continuity-react.md.
