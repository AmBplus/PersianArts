# Prompt design brief: refined creative brief for the motion engine (university-admissions teaser)

Author: Haiku worker, 2026-10-13. Status: decision brief plus first filled draft. Nothing rendered, nothing auditioned, no git commit.
Privacy: the client's institution and the full source copy are kept only in `media/briefs-local/university-admissions/` (gitignored). This file refers to client copy by token (`[copy:B2a]`) and the exact strings live in `copy-map.md` in that folder. Client name: "the university" throughout.

## 0. Inputs read

- Client poster (`media/briefs-local/university-admissions/poster.webp`, 592x822 px, low resolution): deep blue ground, cream and gold logo and title, brown pill, QR and URL, campus gateway with tiled arches at the bottom.
- Palette sampled with PIL (median cut on the full poster, approximate): navy `#24344d`, blues `#295a99`, `#2f6aae`, `#3e7cbd`, cream `#f1e7cd`, sand/gold `#dcc9a8`, warm grey `#bdbcb3`, taupe `#ab9e84` (pill, approximate).
- Engine: `work/persian/src/film/social/` has six hand-coded scenes (Hook, Count, Pen, Slow, Daily, CTA), one theme object (`theme.ts`, "ink-and-paper"), a four-ratio layout table (`layout.ts`: 9:16, 4:5, 1:1, 16:9) and Vazirmatn (headline) plus Estedad (body) fonts (present in `work/persian/src/workbench/public/fonts/`; the social project must resolve `staticFile("fonts/...")` to them, to be verified).
- Rules: `work/persian/payoff-brief.md` (anticipation, hit, tail; sound on the contact frame; one accent per scene, bigger on the last; 120 BPM = 0.5 s beat grid), `evals/rubric-v2.md` (nine criteria: hierarchy, theme, anti-slideshow, rhythm, story, sound alone, sound with sync, Persian typography, multi-ratio safe area), `docs/MOTION-SKILL-PLAN.md` section 7, `sound/library/sfx/CATALOG.md` (1564 entries; nothing auditioned).

## 1. Reading of the source

**Audience.** School-leavers (about 17-19) and their parents in the host city and eastern Khorasan. Decision moment: choosing a university and an intake route (admission by academic record). Tone must feel credible and warm, not a sales trailer.

**Goal.** Make the university feel large, research-active and affordable, then send viewers to the admissions portal ([portal-domain], QR). Measure: clicks to the portal (not in our hands).

**Tone options.**
1. Institutional and calm (ink, paper, numbers, slow reveals). Low risk, fits a credible university.
2. Energetic "your next step" (fast cuts, bold hero numbers). Higher retention, higher slideshow and fake-stat risk.
3. Warm and personal (a student's hand, a pencil, a path). Best fit with our pencil-film skill, lowest asset need.

**The 18 claim lines** (the brief said 20; the source has 17 bullets plus the header line; "top-2%" appears twice and is merged). Grouped into six proof clusters:

| Cluster | Claims (token) | Wording risk |
|---|---|---|
| Breadth | intake by academic record in 120+ majors (B2); most majors in the province (L4) | "most" needs owner wording |
| Scale | 48,000 students, 400+ faculty, 148,000 alumni (B3); most students in the east (B7b); 400+ books (L7) | "most" needs owner wording |
| Research and innovation | top-3 among the IA system in research and technology (B4); 150+ tech cores (B4c); level-1 incubator and six level-1 research centres (L3); third in scientometrics (L5); ten journals (L6) | "top-3", "level 1", "third" are rankings: verbatim, scope qualifiers kept |
| Excellence | top rank grade "++++۱" (B5a); top-2% scientists (B5b); 25 elite professors (B5c) | **B5a string looks malformed ("++++۱"); owner must confirm the rank before public use** |
| Support | research funding (B6a); equipped labs for theses (B6b); varied financial facilities (B6c) | low |
| Place | eastern-region hub (B7a) | "hub" is a superlative-like claim: verbatim |

Superlatives and rankings that need exact wording and owner verification (the render contract says nothing is public until verified): B5a, B7b, L4, L5, B4 ("top-3"), B7a ("hub").

Possible inconsistencies to check, not to fix: the poster's season line "۱۴۰۶-۱۴۰۵" reads reversed; the first-semester label (token P3) must be confirmed for the current intake (the date today is in autumn 1405).

## 2. Three concept options

**(a) The gate opens.** Theme: the campus gateway (poster photo) as a doorway. Story: the arches open one by one into six rooms, one per proof cluster. Key visual: tiled arch in layers. Hook (0-2 s): gate door swings open with the question token Q. Payoffs: each arch opening with a stamp hit and a count-in number inside the room. Ending: six arches close into the [portal-domain] seal. Duration: 24 s social, 45 s long. Ratios: the arch becomes a vertical door in 9:16, a centred arch in 1:1 and 4:5, a side arch in 16:9. Assets: hi-res campus photo and a cutout (we have 592x822 only; at 1080 px wide it is upscaled 1.8x, at 1920 px wide 3.2x: soft). Logo vector: missing. QR: must be decoded and re-checked. Engine gaps: no image layer, no cutout, no parallax. Risk: high asset and engine cost; the poster photo is the client's own and may not be licensed for motion use (check). Verdict: strong brand image, not buildable now.

**(b) Counting up.** Theme: academic notebook, graph paper, big Persian digits as the hero. Story: one hero number per beat rolls up and lands with a stamp (120, 48,000, 150+, 25, 2%). Hook: the question token Q, then the first number. Payoffs: each roll ends on a stamp; the last number gets a bell and the big accent. Duration: 24 s social, 45 s long. Ratios: works in all four with the stacked layout. Assets: none beyond logo and URL; the engine's Count scene already does a ring count-up. Risks: slideshow of numbers (rubric criterion 3), fake-stat feel if any number is read without its qualifier, Persian digit roll direction must be checked. Verdict: cheapest, good as fallback, but it is the most likely to read as a slideshow.

**(c) A pencil and a checklist (recommended).** Theme: the pencil film's ink-and-paper, re-coloured to the poster's navy and cream (see section 3). Story: a student's pencil writes a question on a paper page, then ticks six checks (the six proof clusters); each tick is a ring-pulse with a hit; the last check draws the arch of the campus gateway and closes into the portal seal and the URL. Hook (0-2 s): pencil draws a line that curls into the question mark (token Q). Payoffs: every tick is a hit with a sound on the frame; the last tick is the accent (bigger, bell). Ending: the arch closes, the URL and QR appear, a stamp on the logo, ring-out tail. Duration: 24 s social, 45 s long (extra claims in the long cut, section 4). Ratios: 9:16 stacked (number above, text below, bottom 400 px safe); 4:5 same with bottom 150 px; 1:1 centred column (text width at most 80% of W, needs new layout slots, the current 1:1 hook slot is only 8% wide); 16:9 text left, art right. Assets: logo vector (or clean PNG with alpha) - missing; QR - decode and verify; the gateway photo is needed only for the final still (upscaled, or better a hi-res photo). Engine: reuses the pencil character (Pen), the Daily ring-pulse and the stamp payoff of the pencil film; needs a new SVG arch and a seal component, and a path-draw (stroke dash) helper. Risks: the pencil may read as a children's style for a university (mitigate with the navy palette and the clean sans-serif-style Vazirmatn 850). Verdict: best fit with our skills and the rubric (story, anti-slideshow), lowest asset risk.

**Recommendation: (c), with (a)'s arch as the final still** (only if a hi-res photo arrives). Fallback: (b) for a 1:1 cut if the pencil cannot be finished in time.

**Timing.** The 24 s version is 48 beats at 120 BPM (0.5 s each): hook 2 s (4 beats), six proof beats of 3 s each (18 s, 36 beats), gate and CTA 4 s (8 beats): total 24 s. Long cut 45 s adds the extra claims (L-tokens) and two more beats per proof cluster.

## 3. Prompt template (the structured brief for the engine)

Fields (YAML-like; every field is required, "n/a" is allowed):

```
role: motion designer and sound designer for a university admissions teaser (client: "the university")
goal: drive viewers to the admissions portal ([portal-domain] + QR); feel credible, warm, research-active
audience: school-leavers 17-19 and parents, host city and eastern Khorasan
deliverables:
  - social 9:16 1080x1920, 24 s (primary)
  - social 4:5 1080x1350, 24 s
  - square 1:1 1080x1080, 24 s
  - landscape 16:9 1920x1080, 24 s (and 45 s long cut for 16:9 and 1:1)
  - stills: one per beat at hit frame H and H+8, per ratio
brand:
  palette: navy #24344d (ink), blue #295a99 (accent), cream #f1e7cd (paper), sand #dcc9a8 (gold accent), warm grey #bdbcb3 (secondary)
  contrast: navy on cream 10.2:1 (text); cream on #295a99 5.65:1; cream on #3e7cbd 3.54:1 (NOT for small text)
  fonts: headline Vazirmatn variable weight 850-900; body Estedad variable 500-600; Persian digits only (۰-۹)
  letter-spacing: 0 on all Persian text
  logo: vector only; min clear space = height of the 'ا' of the logo; never recoloured, never on blue below 4.5:1 contrast
story:
  logline: a student's pencil checks six reasons to apply, then the gate closes onto the portal
  beats: see the scene table
scene table: (time, beat, visual, motion, on-screen copy token, sound layers)
sound design:
  music: 118-124 BPM (grid 120), warm, bright, modern-academic, light percussion; no epic trailer build; licence checked before use
  sfx palette: sound/library/sfx/CATALOG.md categories: paper-pencil (scribble), tick-clock (tick), ding (soft 515643, accent 611113), stamp-thud (470710), stinger (441342), swoosh-transition (234538), sparkle-magic (462092), success (511484), kenney lowFrequency_explosion_001 (sub boom); all unauditioned: audition before mix
anti-patterns:
  - slideshow: no two beats share the same motion type in a row
  - letter-spacing on Persian; Latin digits; "2%" (write "دو درصد" in verbatim copy)
  - fake stats: no number, rank or superlative beyond the copy map; every number keeps its qualifier
  - trimming a qualifier (e.g. dropping the IA scope from a top-3 claim)
  - text in the bottom 400 px (9:16) or top 250 px
per-ratio safe zones: layout.ts: 9:16 top 250 / bottom 400 / side 90; 4:5 top 110 / bottom 150; 1:1 top 90 / bottom 110 / side 90; 16:9 side 160
acceptance: rubric-v2 criteria 1-9 (section 6)
```

### Filled draft (recommended concept c, 24 s social, 9:16; tokens resolve in `media/briefs-local/university-admissions/copy-map.md`)

| Time (s) | Beat | Visual and motion | Copy token | Sound (anticipation / hit / tail) |
|---|---|---|---|---|
| 0.0-2.0 | Hook | Blank paper; pencil draws a line that curls into a question mark (write-on reveal of the text 0.5-2.0) | Q | Scribble 0.0-1.5 (anticipation); soft ding on the dot at 2.0 (hit), -18 dB |
| 2.0-5.0 | Breadth | Notebook list; a pencil ticks a column of major-lines; hero digits roll to 120 with a squash and stamp-in at 4.5 | B2a, B2b | Stamp-thud 4.5 (hit), sub boom 4.5, tail 1.2 s |
| 5.0-8.0 | Scale | Hero counter rolls 0 to 48,000 (5.0-6.5); two sub-rows check at 6.5 and 7.0 with ring-pulses; the last check gets the bell accent at 7.0 | B3a, B3b, B3c | Tick per check (-10 dB); bell 7.0 (accent, +6 dB over ticks) |
| 8.0-11.0 | Research | Three cores drawn as nodes; each pulses in turn; hero 150+ lands at 9.5 with stamp | B4a, B4b, B4c | Scribble 8.0-9.0; stamp 9.5; tail 1.2 s |
| 11.0-14.0 | Excellence | A seal is drawn and stamped at 12.0 with a bell shake-ring; "۲۵" rolls under it; the "two percent" line follows at 13.0 | B5a (HOLD), B5b, B5c | Bell 12.0 (hit), ring-out 1.2 s; soft ding 13.0 |
| 14.0-17.0 | Support | Three pencil ticks draw three tiles (funding, labs, facilities); the last tile is the accent at 16.0 | B6a, B6b, B6c | Tick 14.5, 15.0; accent 16.0 (bell, -8 dB) |
| 17.0-20.0 | Place | Pencil draws an arrow to the east edge of the page; a dot pulses; the hero line lands at 18.5 | B7a, B7b | Swoosh 17.0 (cut-5), stinger 18.5 (hit), sparkle +150 ms |
| 20.0-24.0 | Gate and CTA | Pencil draws the campus arch; the arch closes into the portal seal at 22.0; URL and QR (if verified) appear at 22.5; logo stamp at 23.5; fade 23.5-24.0 | B8, optional CREDIT | Stinger and chime 22.0 (hit); sparkle +150 ms; final stamp 23.5; tail to 24.5 (fade under picture) |

Long cut (45 s): same six proof beats with extra claims: research adds L3 (with the level-1 centres) and L5/L6; breadth adds L4 (after the owner confirms the superlative); scale adds L7; closing adds L8 as the last line. Each proof beat lengthens by about 3 s.

## 4. Copy condensing rules (also for the refiner, section 5)

- Max six on-screen proof beats (here: breadth, scale, research, excellence, support, place). The rest go to the long cut or the caption.
- On-screen text is a verbatim substring of the copy, never a paraphrase. Qualifiers (scope, level, "in the IA system", "two percent of the world's top scientists") stay.
- Numbers stay numbers in Persian digits; the count-up animates them so the viewer reads the noun, not a long sentence.
- Reading speed (design budget, not a standard; to be validated on a sample viewer): 8-10 Persian characters per second; hold = max(1.5 s, characters / 9 + 1 s). Example: token B4b (about 22 characters) needs about 3.4 s.
- Hashtags are not on screen; they go to the caption. The issuer credit is optional on screen (owner decides).

## 5. Prompt-refiner recipe (turns any raw client text and image into the template)

1. Ingest: save the raw text verbatim to `media/briefs-local/<slug>/source.md` and the image to `poster.webp` (both gitignored). Use the slug or label only in tracked files.
2. Segment the copy: one claim per bullet, IDs C01..Cnn. Tag each: number, rank, superlative, place, offer, credit, hashtag, CTA.
3. Risk tag: rank, superlative and "most/top/first" claims need owner verification; numbers stay as written; hashtags go to captions.
4. Cluster into at most six proof clusters; keep the best three numbers per cluster; move the rest to the long cut or caption.
5. Condense only by verbatim substring; never drop a scope or level qualifier.
6. Choose the concept with a matrix: brand fit with the palette, assets available, engine gaps, slideshow risk, rubric risk. Default to the pencil concept unless a hi-res photo arrives.
7. Fill the template: palette from the poster (sample with PIL, label as approximate), fonts (Vazirmatn/Estedad), safe zones from layout.ts, copy tokens into the local copy map.
8. Build the scene table on the beat grid (120 BPM, 0.5 s). Every beat has anticipation, hit, tail.
9. Asset check: logo vector, hi-res photo, QR decode and re-check of the URL, music licence, SFX audition.
10. Ask the owner ONLY if blocking: (a) confirm the rank string and each superlative/ranking wording (B5a, B7b, L4, L5, B4, B7a); (b) hi-res campus photo and logo vector; (c) whether the issuer credit appears on screen; (d) whether the film may go public (render contract: nothing public before source-fidelity evidence); (e) the poster season line order. Palette, pacing and concept choice are ours to decide; the owner may change them later.

## 6. Acceptance checks (rubric-v2, and what to verify)

- Criterion 1 (one hero per frame): stills at H and H+8 of each beat; one number or one line is the hero.
- Criterion 2 (theme): palette matches section 3; no coral/mint from the old ink-and-paper theme.
- Criterion 3 (scene differentiation, anti-slideshow): no two consecutive beats share the same motion type (draw, roll, ring, seal, travel, close).
- Criterion 4 (rhythm): energy curve low (hook), high (breadth, scale), dip (support), high (place, gate).
- Criterion 5 (story): pencil as the character, six ticks, gate closes; the object changes state (blank to checked to closed).
- Criterion 6 (sound alone): mute test is not enough; judged by a listener with the picture muted and with the sound only (audio check).
- Criterion 7 (sound with sync): every hit on its contact frame (within 1 frame, 33 ms); no speech, so 7 applies to SFX sync only.
- Criterion 8 (Persian typography): joins intact, no letter-spacing, Persian digits, no clipping of marks.
- Criterion 9 (readability, four ratios): every text inside the safe box (layout.ts) for all four ratios; stills checked at H.
- Numbers: each number on screen appears in the copy map; no extra numbers.

## 7. Production plan

Orders (GLM flash by default, one milestone per order, each about 20 minutes, medium effort):

- P0 setup (no visuals): a new theme object for this client (same shape as `theme.ts`), the copy map loaded from a local JSON, and a layout slot row for 1:1 with a stacked text column. Acceptance: `tsc` passes, stills of the title card on four ratios.
- P1 assets: logo vector (trace or redraw from the poster, reviewed by the owner), QR decode from the poster and comparison with the portal URL, music shortlist with licence notes. Acceptance: files exist, QR decodes to the same URL.
- P2 scenes, milestone A (Hook, Breadth, Scale): pencil write-on, stamp-in, count-roll, tick ring-pulse. Stills at the listed frames.
- P3 scenes, milestone B (Research, Excellence, Support, Place): seal, bell shake-ring, tile ticks, arrow travel. Stills.
- P4 scenes, milestone C (Gate and CTA): arch SVG, closing seal, URL and QR card, logo stamp, flash and fade.
- P5 cue sheet (from the scene table, not from v4 numbers) and mix to -14 LUFS, true peak -1 dBTP; each hit within 33 ms of the picture.
- P6 long cut (45 s) after the owner confirms the superlatives.

What blocks it in the current engine: (1) no image or cutout layer and no parallax (blocks concept a); (2) no logo component (needs P1); (3) no arch or seal SVG and no stroke-draw helper (needed for c, a new component, small); (4) the layout table has no narrow 1:1 text slot; (5) the theme is one object, which is fine for a new client theme; (6) fonts must resolve from the social project's `staticFile` (verify in P0).

**Go / no-go.**
- Concept (c): GO for P0 and P2 now (no client asset needed for the first milestone).
- Concept (a): NO-GO until a hi-res photo and a cutout exist.
- Concept (b): GO as a fallback for a square cut only.
- Publication: NO-GO until the owner confirms the rank string and the superlatives (render contract). Until then the film is a personal test, as the v4 pencil film was.

## Files written

- `work/persian/prompt-design-brief.md` (this file)
- `media/briefs-local/university-admissions/source.md` (client copy, verbatim, local only)
- `media/briefs-local/university-admissions/copy-map.md` (token to exact on-screen text, local only)
- `media/briefs-local/university-admissions/poster.webp` (copy of the client poster, local only)
- `.gitignore` (appended `media/briefs-local/**`; verified with `git check-ignore`)
