# htmlfilm: spec (fast lane, one HTML file per film)

Purpose: author a motion film as ONE self-documenting HTML file and render it to mp4 in minutes.
Status: H1 (pencil, 9:16, silent) built and rendered. Sound is the next order.

## Layout of a film folder
- `<film>/film.html`: the whole film. Inline CSS, JS and SVG. Documentation block at the top.
- `<film>/fonts/`: local font files referenced by relative @font-face (no CDN).
- `htmlfilm/capture.mjs`: renderer. Headless chrome-headless-shell over CDP, steps `film.seek(n/30)`, PNG frames to ffmpeg (yuv420p, crf 16).

## Contract used by the film
- `window.film = {duration, fps:30, bpm, t0, frame, ready, seek(t)}`.
- Every frame is a pure function of the global frame n. No wall-clock, no CSS animation.
- Scene-local clock = (n - cutFrame) * BPM/120 (120-BPM reference grid, like the Remotion film).
- `?capture=1` hides the player UI. `?ratio=9x16` is the default and only ratio for now.
- Player (human): play/pause and scrub, fit-to-window scale.

## Motion helpers (ports of motion.ts)
- ease: outExpo, inExpo, outBack, inBack, inOutSine, outCubic, inCubic.
- shake(f, at, amp, len), stomp, stampIn (lift, squash, overshoot).
- Draw-on: SVG path with pathLength=1 and stroke-dasharray/dashoffset.

## Capture
- `node work/persian/htmlfilm/capture.mjs` renders the full film to `media/film-versions/<label>/vN/silent-9x16.mp4`.
- Options: `--frames a-b`, `--still t1,t2` (PNG to `_stills`), `--out path`.
- Needs: chrome-headless-shell (in `work/persian/.remotion`), ffmpeg on PATH, Node 22+ (global WebSocket).

## Adding a new film
1. Copy `pencil/` to `<film>/`. Replace the copy, scene table, EVENTS comment and palette.
2. Keep the helper block; change only scene functions and the CUT_BEATS array.
3. Run capture with `--still` at each payoff time and look at the stills before a full render.
