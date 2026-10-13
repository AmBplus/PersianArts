# Progress: uni P0 (setup, no visuals)

## Plan
1. Read briefs + social engine (motion/theme/layout/fonts/entry pattern). [done]
2. Create work/persian/src/film/uni/: theme.ts (navy #24344d / cream #f1e7cd), motion.ts (BPM/T0_S/CUT_BEATS 48 beats = 24 s, 8 cuts), layout.ts (4 ratios, 1:1 stacked column <=0.8 W), copy.ts (token -> string, strings only in gitignored media/briefs-local/university-admissions/copy-map.json), fonts.tsx (throws on missing font), scenes.tsx (title card + 7 token skeletons, no motion design), UniFilm.tsx, entry.tsx (Uni9x16/Uni1x1/Uni4x5/Uni16x9).
3. tsc check.
4. Stills: 6 frames Uni9x16 + 1 mid frame per other ratio -> media/film-versions/uni-admissions/_stills-P0/.
5. Report work/persian/report-uni-P0.md.

## Log
- Read prompt-design-brief (P0-P6), payoff-brief, social engine sources, copy map.
- Created film/uni: theme.ts (navy/cream), motion.ts (CUT_BEATS 0,4,10,16,22,28,34,40,48 = 720 f = 24 s), layout.ts (4 ratios; 1:1 stacked column 846 px < 0.8 W), copy.ts (imports gitignored copy-map.json; tracked code has tokens only), fonts.tsx (cancelRender on missing font), scenes.tsx (title card + 7 token skeletons), UniFilm.tsx, entry.tsx (Uni9x16/Uni1x1/Uni4x5/Uni16x9).
- Fixed during acceptance: sub-line collision -> disjoint hero/rule/sub bands; fixed h1 overflow -> fit() auto-size; rule touching descenders -> rule y computed from estimated content height.
- tsc: uni files strict = clean; workbench -p . = clean. remotion compositions: 4 comps, 720 f, 24.00 s each.
- 9/9 stills in media/film-versions/uni-admissions/_stills-P0/: Uni9x16 f30/105/195/285/465/660 + f285 for Uni1x1/Uni4x5/Uni16x9. Persian renders in Vazirmatn, no overflow, safe zones respected, navy-on-cream only.
