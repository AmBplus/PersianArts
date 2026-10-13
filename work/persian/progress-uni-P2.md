# Progress: uni-admissions P2 (scenes) — started 2026-10-13

Plan:
1. Assets: append uni-local/ public dir to .gitignore, verify with git check-ignore, copy emblem-layers.svg + layers.json there (no logo data in tracked code).
2. uni/Logo.tsx: emblem React component fetching the SVG from public/uni-local at render (delayRender), animating wings/shield/pen from layers.json origins.
3. Rewrite uni/scenes.tsx: 8 scenes on the CUT_BEATS grid - hook (pencil write-on of Q), 6 proof beats (breadth stamp, scale counter + tick rings, research nodes + stamp, excellence seal shake-ring + roll, support tile ticks, place arrow travel), gate (arch draw, emblem hero, ring-pulse + final-bow settle, calm hold). Payoff frame table in header comment.
4. Acceptance: tsc, 4 comps, 13 stills into media/film-versions/uni-admissions/_stills-P2/, Persian/overflow/safe check; report-uni-P2.md.
