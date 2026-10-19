# showcase notes — what makes the card library work

Evidence: the library's own posters, read at full resolution with `read_image`.
`library/media/typography/<technique>/poster.webp` (39 techniques, 1920×1080) and
`library/media/reference/shotcraft/<category>/<technique>/poster.webp` (156 categories, 212 sub-techniques,
960×540). Folder names below are exact and were listed from disk, not remembered.

**What was actually looked at (per poster, not via contact sheets):**

- All **39 of 39** typography posters at full resolution. No typography claim below is `(unverified)`.
- **20 of 212** shotcraft posters at full resolution, one per category, chosen to hit every family this file
  previously claimed: `fracture/fracture`, `particle-celebrate-hits/confetti-crossfire`,
  `particle-sand-fill/particle-sand-fill`, `counter-confetti/counter-confetti`,
  `aurora-bloom-bg-flip/aurora-bloom-bg-flip`, `glow-flyline-moves/flyline-arc`,
  `fui-hud-moves/line-unfold-panel`, `scan-bracket-sweep/scan-bracket-sweep`,
  `split-flap-title/split-flap-title`, `scramble/scramble`, `outline-word-fill/outline-word-fill`,
  `draw-svg-trace/draw-svg-trace`, `stroke-segment-build/stroke-segment-build`, `grain-dissolve/grain-dissolve`,
  `print-texture-transitions/ink-bleed-reveal`, `paper-craft-moves/masking-tape-slap`,
  `glass-pill-dictation-typing/glass-pill-dictation-typing`, `cycle-glass-node-morph/cycle-glass-node-morph`,
  `riso-print-hits/beat-pump`, `hatch-depth/hatch-depth`.
- **Not** viewed individually: the other 192 shotcraft posters (folder-name evidence only, marked below).
  The two contact sheets were used for orientation only and are not the evidence for anything here.
- Raw rows for all 59 posters: `media/briefs-local/storylab-beauty/poster-observations.csv`.
- Pass report (skipped list, device counts): `media/briefs-local/storylab-beauty/poster-pass-report.md`.

**Correction to the previous version of this file:** its headline claim that every poster shares one chrome is
false. Four typography folders are chrome-less light or warm variants — `countdown` (#f2f0ec), `markerline`
(#f0eeea), `outlinefill` (#f2f0ee), `papercard` (#f5efe6). The dark navy grid with the inset keyline, Latin font
label, Persian technique label and footer is the *house* frame, not a universal one (35 of 39).

**Second correction:** the shotcraft library is **English-language** (`REASSEMBLE`, `SHIP FASTER`, `ON THE BEAT`,
`Speak or type`). It is a craft/mechanism reference, not a Persian-typography reference. Only the typography
library carries Persian. Do not cite a shotcraft poster as evidence for Persian type behaviour.

## 1. The recurring devices (with the folders that prove them)

### 1.1 Dot-grid field, and it is the house texture

A fine ~24px grid drawn at very low contrast over the dark field appears in **32 of the 39** typography posters.
Absent only in the four light variants (`countdown`, `markerline`, `outlinefill`, `papercard`) and in `codeblock`,
`filmstrip`, `demote` where cards/panels replace it. Evidence: `typography/assembly`, `typography/blurslide`,
`typography/brace`, `typography/nuqta`, `typography/counter`, `typography/wordfade`, `typography/terminal`.
Mechanism: the grid is at 2–4% luminance above the field, so it gives the empty area a scale without ever
competing with the type (`BTY-COMP-006`, `BTY-DEPTH-009`).

### 1.2 The house chrome (35 of 39)

Dark navy field, thin inset keyline, Latin **font name** top-left, Persian **technique name** top-right, footer
`PersianDoodle · native motion typography` bottom-left. Confirmed font labels seen: `Vazirmatn`, `Estedad`,
`Sahel`, `Lalezar`, `Amiri`, `Shabnam`, `Noto Naskh Arabic`, `Noto Kufi Arabic`, `Markazi Text`, `Vazir Code`.
Evidence: `typography/assembly` (Vazirmatn), `typography/fonthymp` (Estedad), `typography/inktrace` (Amiri),
`typography/glitch` (Noto Kufi Arabic), `typography/filmstrip` (Markazi Text), `typography/scramble`
(Vazir Code), `typography/wordfade` (Shabnam), `typography/highlight` (Sahel). The chrome is what lets a viewer
compare *techniques* instead of
*layouts*, and inside a film it is the "ONE WORLD" requirement (`SKILL.md` rule 12, rule 18c).

### 1.3 One saturated accent, and the accent is the technique

In **23 of 39** typography posters there is exactly one saturated hue and it is spent on the thing the poster is
about. Best proofs: `typography/nuqta` (the letter dots are the only orange marks — accent IS the technique),
`typography/fonthymp` (the whole hero is pink; nothing else is coloured), `typography/leadzoom` (one word
orange), `typography/wordpop` (accent + size pop on the key words), `typography/reveal` (a single orange
wipe-edge bar). Mechanism: scarcity gives the accent meaning (`BTY-COLOR-004`, `BTY-COLOR-006`).

### 1.4 Between one and four words, never a paragraph

Every typography poster's Persian hero is a single line of 1–5 words except `typography/blurslide`,
`typography/filmstrip`… `typography/blurslide` carries one line plus a deck. The posters that carry a *deck*
line are the minority: `typography/blurslide`, `typography/leadzoom`, `typography/terminal`,
`typography/papercard`, `typography/counter`. The rest have no hierarchy at all — headline only.
Evidence: `typography/kashida` (one word), `typography/nuqta` (three words), `typography/wordfade` (six words).

### 1.5 Card / panel chrome: generous radius plus a real shadow

The "premium" feeling in this library is delivered by *containers*, and the posters that have one are the ones
that look expensive: `typography/docwrite` (cream paper card, ~28px radius, real drop shadow, one teal rule),
`typography/splitflap` (rounded panel with a real shadow and a visible flap seam), `typography/terminal`
(rounded window with a real traffic-light cluster), `typography/codeblock` (two #22303e panels, ~24px radius),
`typography/chipcycle` (pill with a selected-state keyline), `typography/demote` (outline pill).
Shotcraft agrees: `shotcraft/glass-pill-dictation-typing/glass-pill-dictation-typing` is a single glass pill —
gradient fill, hairline border, generous radius, caret, mic affordance — and it is the most crafted poster in
the 20 read. Count in the 20 shotcraft read: 9 posters carry a rounded container with a real shadow.

### 1.6 One heavy hero, generously scaled

`typography/counter` puts a Persian numeral at ~0.25 of frame height; `typography/stomp` ~0.22;
`typography/fonthymp` ~0.22. The shotcraft side is even bolder:
`shotcraft/counter-confetti/counter-confetti` sets `1,000` at ~0.42 of frame height — the single largest ratio
seen in either library — and `shotcraft/riso-print-hits/beat-pump` sets `ON THE BEAT` at ~0.17 with the rest of
the frame clearly subordinate. Mechanism: scale is the hierarchy (`BTY-COMP-006`).

### 1.7 Hairline annotation geometry

Dashed or hairline circles, rules and brackets used as *annotation*, not decoration: `typography/outlinefill`
(dashed circle plus dashed rule), `typography/letterdrop` (full-width baseline rule), `typography/cutout`
(full-width hairline), `shotcraft/scan-bracket-sweep/scan-bracket-sweep` (L-shaped corner brackets),
`shotcraft/outline-word-fill/outline-word-fill` (dashed circle plus rule). Caveat: in three of those the
annotation points at nothing, which is a mistake (§3).

### 1.8 The technique must survive as a still

The posters that work as stills are the ones whose idea is frozen at its most legible instant:
`typography/nuqta` (dots separated), `typography/leadzoom` (lead word coloured), `typography/wordpop`
(pop words larger), `typography/splitflap` (flap mid-roll with a visible seam). The ones that fail are those
frozen *before or after* their own event — see §3. The test is the hero-contrast frame (`BTY-COLOR-008`).

### 1.9 Typographic census (folder names, from disk)

39 Persian text techniques exist as folders; each name is a mechanism, not a mood:
`assembly, blurslide, brace, chipcycle, codeblock, converge, countdown, counter, cutout, demote, docwrite,
dotsword, filmstrip, flyingwords, fonthymp, glitch, highlight, inktrace, inktrace-penless, karaoke, kashida,
leadzoom, letterdrop, markerline, mask, nuqta, outlinefill, papercard, pillslot, reveal, rollcycle, scramble,
splitflap, stomp, sweep, terminal, typewriter, wordfade, wordpop`.
Use: the film's reuse map must name these folder names (`SKILL.md` rule 18b), never "inspired by editorial
typography".

### 1.10 Shotcraft: what the 20 read actually show

Families verified by eye, with the folder that proves each:
- **UI-chrome compositions** — `shotcraft/glow-flyline-moves/flyline-arc`,
  `shotcraft/print-texture-transitions/ink-bleed-reveal`, `shotcraft/split-flap-title/split-flap-title`,
  `shotcraft/riso-print-hits/beat-pump`: a light grey page with a dark sidebar and a grid of white cards
  carrying grey placeholder bars. This is the dominant motif (5 of the 20 read put a card grid behind the effect).
- **Large-number / stat tiles** — `shotcraft/counter-confetti/counter-confetti`,
  `shotcraft/particle-celebrate-hits/confetti-crossfire`,
  `shotcraft/particle-sand-fill/particle-sand-fill`.
- **Particle and print texture** — `shotcraft/grain-dissolve/grain-dissolve`,
  `shotcraft/hatch-depth/hatch-depth`, `shotcraft/particle-sand-fill/particle-sand-fill`.
- **HUD / bracket reticles** — `shotcraft/scan-bracket-sweep/scan-bracket-sweep`,
  `shotcraft/fui-hud-moves/line-unfold-panel`.
- **Object/paper construction** — `shotcraft/paper-craft-moves/masking-tape-slap`,
  `shotcraft/stroke-segment-build/stroke-segment-build`, `shotcraft/fracture/fracture`,
  `shotcraft/split-flap-title/split-flap-title`.
- **Greyscale dominance**: **16 of the 20** shotcraft posters read carry no saturated accent at all. Only
  `counter-confetti` (4 hues), `confetti-crossfire` (orange-brown), `particle-sand-fill` (orange),
  `hatch-depth` (blue) and `aurora-bloom-bg-flip` (lavender) have one.
- The previous claim that a "purple/blue gradient" accent dominates the shotcraft sheets is **wrong** — the
  accent is orange/terracotta where it exists at all.
- `(unverified)` for the remaining 192 shotcraft sub-techniques: only folder names were read, not posters.

### 1.11 Families grouped by story job (`(unverified)` — folder names only)

The 212 sub-techniques sit under 156 named categories. Families that recur by *name* (from disk, posters not
opened): `particle-celebrate-hits`, `counter-confetti`, `aurora-bloom-bg-flip`, `glow-flyline-moves`,
`fui-hud-moves`, `scan-bracket-sweep`, `split-flap-title`, `outline-word-fill`, `draw-svg-trace`,
`stroke-segment-build`, `grain-dissolve`, `print-texture-transitions`, `paper-craft-moves`,
`glass-pill-dictation-typing`, `cycle-glass-node-morph`, `riso-print-hits`, `hatch-depth`, `line-boil`,
`text-as-mask`, `word-relay-filmstrip`, `type-entrance-moves`, `type-assembly-moves`, `montage-rhythm-moves`,
`speed-ramp-freeze`, `transition-hidden-cut`, `white-flash-logo-simplify-cut`, `logo-shrink-wordmark-lockup`,
`ui-to-brand-morph`, `card-stack`, `deck-deal-flyin`, `cursor-flyover`, `crash-zoom-punch`.
Grouped by *story job* (reveal, prove, escalate, transform, close), which is why selection must start from
`data/beat-to-treatment.csv` and only then pick a folder (`effects-and-craft-kit.md` §0).

## 2. Mistakes seen in the library

Two of these are outright rendering bugs and should never be copied. The rest are craft errors the library
itself commits, which means *the library is a bar but not a validator* — do not treat "it is in the library" as
proof that something is right.

| # | mistake | evidence (folders) |
|---|---|---|
| M1 | **Chrome collision / content drawn over the chrome** — a card or a bar covers the footer or the font label, making both illegible. | `typography/filmstrip` (top card covers the `Markazi Text` label; the footer is drawn over the cream card), `typography/stomp` (the cream ground bar makes the footer cream-on-cream and completely invisible) |
| M2 | **The technique is invisible in its own still** — the poster is frozen before or after the event, so it is indistinguishable from a plain title. | `typography/glitch` (no slice displacement, no chroma split), `typography/mask` (~2% luminance step), `typography/typewriter` (no caret), `typography/inktrace-penless`, `typography/countdown`-adjacent `typography/scramble` (one faint outline glyph), `shotcraft/paper-craft-moves/masking-tape-slap` (no tape at all) |
| M3 | **Below the legibility floor** — the element that carries the meaning is too small or too faint. | `typography/karaoke` (progress dots invisible), `typography/rollcycle` (rolled word ~#2a3441 on #1b2836), `typography/terminal` (Persian line at 0.055 frame height), `typography/codeblock` (Persian at 0.03), `shotcraft/scramble/scramble` (glyphs at #3a3a44 on #0a0a0c), `shotcraft/hatch-depth/hatch-depth` (three value labels missing) |
| M4 | **More than one competing accent** | `typography/sweep` (three hues frozen mid-gradient in one line, glow halos bleeding into neighbours), `shotcraft/counter-confetti/counter-confetti` (four confetti hues so nothing leads) |
| M5 | **Muddy mid-tone / black-on-black** | `shotcraft/outline-word-fill/outline-word-fill` (#2a2a2c on #0a0a0b), `shotcraft/cycle-glass-node-morph/cycle-glass-node-morph` (three greys of near-equal value), `typography/pillslot` (dull brown-grey #4a4438 slot on navy), `shotcraft/grain-dissolve/grain-dissolve` |
| M6 | **Annotation that points at nothing, or decoration with no informational job** | `typography/brace` (huge braces carrying no meaning), `typography/cutout` (hairline cuts the word in half), `typography/outlinefill` (dashed circle and rule point at nothing), `shotcraft/scan-bracket-sweep/scan-bracket-sweep` (brackets are heavier than the content they bracket) |
| M7 | **No hierarchy between the two things on screen** | `typography/pillslot` (headline and slot at identical weight), `typography/splitflap` (four cells all identically weighted, two columns showing the same glyphs so it reads as a double exposure), `typography/chipcycle` (headline and chip labels at the same weight) |
| M8 | **Empty frame with no composition intent** | `shotcraft/draw-svg-trace/draw-svg-trace` (~95% empty, one hairline), `shotcraft/fui-hud-moves/line-unfold-panel` (~90% empty, a blank white box), `typography/demote` (70% empty bottom-right, elements on unrelated axes) |
| M9 | **Clutter behind the effect** | `shotcraft/split-flap-title/split-flap-title` (a six-card UI mock plus sidebar competes with the title), `typography/filmstrip` (five stacked cards) |
| M10 | **Accent placed on the wrong end for RTL** | `typography/highlight` (bar cuts through the descenders and stops mid-phrase), `typography/reveal` (wipe bar sits at the visual left, i.e. the end of the RTL sentence, and clips the final letter) |

## 3. What to copy vs what to avoid

**Copy**
1. The dot-grid field at 2–4% luminance over a near-black navy (#16222e–#1b2836) — `typography/assembly`,
   `typography/nuqta`.
2. The house chrome, as a *film-level* constant: Latin face label, Persian technique/section label, footer.
   It is what makes 39 different techniques comparable — `typography/blurslide`, `typography/counter`.
3. Exactly one saturated accent, spent on the one thing the shot is about — `typography/nuqta`,
   `typography/fonthymp`, `typography/leadzoom`.
4. A hero at 0.20–0.25 of frame height, and up to 0.42 for a hero number — `typography/counter`,
   `shotcraft/counter-confetti/counter-confetti`.
5. Rounded containers with a real shadow and a generous radius whenever a container is needed —
   `typography/docwrite`, `typography/splitflap`, `shotcraft/glass-pill-dictation-typing/glass-pill-dictation-typing`.
6. Word-level emphasis by *one* accent plus a *size* pop — `typography/wordpop`. Never by hue-per-word.
7. Warm paper fields and a two-ink headline when the beat is literary — `typography/papercard`
   (#f5efe6 field, terracotta #a0562e rule, near-black plus terracotta ink, plus a real deck line).
8. Real UI affordances when the metaphor is UI: traffic lights, carets, mic buttons, pagination dots —
   `typography/terminal`, `shotcraft/glass-pill-dictation-typing/glass-pill-dictation-typing`,
   `shotcraft/riso-print-hits/beat-pump`.

**Avoid**
1. Freezing a technique before or after its own event (M2). Choose the most legible instant of the mechanism.
2. Letting any element touch the footer or the corner labels (M1). Reserve the chrome band; nothing may enter it.
3. A second saturated hue. If a second colour is needed, use a value step of the same hue, not a new hue (M4).
4. Decorative geometry with no referent (M6). Every circle, bracket and rule must point at something.
5. Type under ~0.10 of frame height for anything that carries meaning (M3). The library does this constantly;
   it is not a licence.
6. Greyscale-only frames when the beat needs focus — 16 of the 20 shotcraft posters read are greyscale and they
   read as wireframes, not as premium (M5).
7. Copying a shotcraft poster's *look* into a Persian film. Those posters are English-labelled craft
   references; only the typography library is Persian. Take the mechanism, re-derive the type.
8. Treating the library as a validator. It contains rendering bugs (M1) and invisible-effect posters (M2);
   "it is in the library" is evidence of intent, not of correctness.

## 4. Text-first selection and evidence discipline

- For typography work, search the project's actual typography components before choosing a treatment. Explain the choice through story job, letterform shape, and function; use labels such as “editorial” only when the repository supports them.
- Keep observed evidence, owner feedback, and inference in separate statements. Do not invent project facts or numeric thresholds to make a recommendation sound precise.
- Evaluate the opening and closing text as a pair: the opener's memorable hook should earn a distinct payoff in the outro. Treat owner feedback as evidence for whether the payoff lands; do not substitute assumed audience reaction.
- Review text stability in consecutive rendered frames or playback. A static lint pass cannot prove the absence of flicker.

## 5. How to use this file

- Quote a folder name, not a vibe, in the reuse map. If the folder does not exist in the listings above, it is
  not in the library.
- Before choosing: `node work/persian/tools/cards/card-find.mjs <query>` (index
  `work/persian/tools/cards/cards.json`), then
  `node .claude/skills/persian-arts/beauty/tools/craft.mjs find "<job>"` for the treatment and its numbers.
- The library is the **visual bar**, not a template set: the posters prove that one idea, one accent and one
  shared chrome are enough. They do not excuse re-using one stage for a whole film (`CRAFT-AUDIT.md` D8).
- Per-poster numbers (background hex, accent count, type height ratio, devices, mistakes) are in
  `media/briefs-local/storylab-beauty/poster-observations.csv`.
