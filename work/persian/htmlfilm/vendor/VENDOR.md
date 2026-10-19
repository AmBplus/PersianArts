# VENDOR — browser-side libraries for our films

Installed with npm into this folder (no bundler needed: the film HTML uses an import map or a plain
`<script type="module">` with a relative path). `node_modules/` is git-ignored; the lock file is tracked.
Re-install any time with:

```bash
npm --prefix work/persian/htmlfilm/vendor install
# or, from the skill:
node .claude/skills/persian-arts/scripts/bootstrap.mjs
```

| lib | version | path to import | license | what it is for |
|---|---|---|---|---|
| three | 0.186.1 | `node_modules/three/build/three.module.js` (+ `three.core.js` in the same folder — the module imports it) · addons at `node_modules/three/examples/jsm/` | MIT | 3D scenes, cameras, lights — used by `lib/pa-world.js` |
| postprocessing | 6.39.5 | `node_modules/postprocessing/build/postprocessing.min.js` | Zlib | effect composer for three (bloom, DOF, SMAA, glitch, chromatic aberration) |
| pixi.js | 8.22.0 | `node_modules/pixi.js/dist/pixi.min.mjs` | MIT | WebGL 2D runtime: sprites, filters, masks — the fast path for particle/displacement work |

Rules:
- A vendored file is never edited; upgrade = `npm install` again, then re-render and re-measure.
- Determinism: these libs must be driven by the frame index (no `Clock`, no rAF, no `Math.random`); our render
  path is `seek(t)` only.
- Node-side tools live in `work/persian/tools/assets` (sharp, pixelmatch, svg-path-properties,
  web-audio-beat-detector, gl-transitions, svgo) and are installed from npm as well.
- The canvas-2D effect kit (`lib/pa-effects.js`) and the GLSL shader kit (`lib/shaders/`) need no npm at all.
