# beauty pack — routed craft data + references (persian-arts)

Routed bundle inside the `persian-arts` skill (skill_version 2.17). Route in from `.claude/skills/persian-arts/SKILL.md`
§3d. Default lane is **workbench-card** (rule 9): compose named cards from `work/persian/src/demos/**` into a
`WorkbenchManifest` and render with Remotion. The `html-film` lane is secondary (bespoke shots only). This pack serves
the workbench-card lane first: it answers "which card / which treatment / which palette / is my plan legal", not
"how do I draw a shape".

## Three entry points

1. **Search CLI** (start here, every time)
   ```
   node .claude/skills/persian-arts/beauty/tools/craft.mjs find "text reveal"
   node .claude/skills/persian-arts/beauty/tools/craft.mjs list --domain LIGHT
   node .claude/skills/persian-arts/beauty/tools/craft.mjs show BTY-LIGHT-004
   node .claude/skills/persian-arts/beauty/tools/craft.mjs check
   ```
   Searches all five CSVs at once (rules, recipes, palettes, beats, budget), with Persian/English synonym expansion
   (`پالت دمنوش` and `tea palette` hit the same row). Zero dependencies, plain Node. `check` validates the data layer.
2. **The data** (`.claude/skills/persian-arts/beauty/data/`) — the source of truth; never restate it, quote ids from it.
   | file | rows | what | id shape |
   |---|---|---|---|
   | `beauty-rules.csv` | 167 | atomic craft rules with `why` + `numbers` + `provenance` | `BTY-<DOMAIN>-NNN` |
   | `recipes.csv` | 60 | timed motion recipes with real `code` | `BTY-REC-NNN` |
   | `palettes.csv` | 22 | 6-token palettes with measured contrast notes | `BTY-PAL-NNN` |
   | `beat-to-treatment.csv` | 45 | story beat → treatment, camera, type role, transition, effect | `BTY-BEAT-NNN` |
   | `frame-budget.csv` | 33 | ms/frame at 1080p for each technique | — (keyed by technique) |
   Domains in `beauty-rules.csv`: FA 31, TYPE 28, LIGHT 18, MOTION 15, PROC 14, COLOR 12, DEPTH 12, MATERIAL 10,
   TEXTURE 10, COMP 9, CAMERA 4, RATIO 4.
3. **The linter** (mechanical, runs before delivery)
   ```
   node .claude/skills/persian-arts/beauty/tools/lint-film.mjs <film.html | folder> [--only P01,T04,K01] [--json <out>]
   ```
   16 checks. Purity P01–P05 (rAF, wall clock, unseeded random, remote assets, scroll API) · type T01–T04
   (letter-spacing on Persian, text stroke, per-character split, unnested Persian numerals) · design D01–D03
   (token layer, declared key light, weight-differentiated roles) · kit K01–K03 (kit usage density, spring/overshoot,
   shader used via story) · X01 (declared-rectangle text overlap proxy).
   Exit 0 = no FAIL, 1 = FAIL, 2 = usage error. It **cannot see the rendered frame** — PASS means "no banned source
   pattern found", never "this film is good". It is written against `film.html` sources; for the workbench-card lane
   run it on the composed card source / film source, and treat PASS as necessary, not sufficient.
   `palette-contrast.mjs` lives beside it for palette contrast math.

## If you only read one thing (10 lines)

1. Declare the light before anything else: key direction, colour, softness, fill %, rim, ambient (`BTY-LIGHT-001`).
2. Every object gets lit side + core shadow + contact shadow + one rim; flat single fill is banned (`BTY-LIGHT-003`, `BTY-MATERIAL-001`).
3. Three planes minimum per scene, adjacent planes ≥ 15% L* apart (`BTY-DEPTH-001`).
4. Six palette tokens; accent+signal ≤ 10% of screen area; the end card stays in the same page-hue family (`BTY-COLOR-001`, `BTY-COLOR-009`).
5. Hierarchy is weight + size together, ≥ 200 weight units and ≥ 1.5× size between adjacent roles (`BTY-TYPE-002`).
6. Persian: `letter-spacing: 0` always; animate joined groups or words, never code points; typewriter = prefix slice (`BTY-FA-001`, `BTY-FA-003`).
7. Never linear on an entrance; two named easings minimum; spring or `outBack` for mass; HUD never moves (`BTY-MOTION-002`, `BTY-MOTION-006`, `BTY-MOTION-009`).
8. No two consecutive scenes share framing, background family, entrance direction or hero scale band (`BTY-COMP-003`).
9. `window.film.seek(t)` pure in t; no CSS animation; assets local; every frame inside 82–350 ms at 1080×1920 (`BTY-PROC-001`, `BTY-PROC-007`).
10. One hero-contrast frame per film, named in the header; end card designed as its own artefact (`BTY-COLOR-008`, `BTY-COMP-007`).

## References (read the file that matches the question)

- `references/quick-reference.md` — the searchable surface: ~215 numbered atomic rules, grouped by theme, each with its mechanism and its `BTY-` id.
- `references/craft/light-and-depth.md` — elevation, glow, rim, ambient occlusion, shadow stacking, contrast that reads expensive.
- `references/craft/colour-and-grade.md` — palette construction, ONE accent, dark↔light arc, grade moves, no default-gradient look.
- `references/craft/type-and-hierarchy.md` — eyebrow/headline/deck, scale ratios, optical alignment, weight contrast, tracking, the Persian exception.
- `references/craft/persian-craft.md` — RTL, joined letters, the `_fa` kit, faDigits, typewriter prefix slice, kashida, nuqta, Nastaliq, logical mirroring.
- `references/craft/motion-and-easing.md` — easing vocabulary, springs, anticipation/overshoot/settle, stagger, holds, frame budgets.
- `references/craft/composition-and-variety.md` — negative space, grids, symmetry vs tension, per-beat variety, three-same-family guard.
- `references/craft/effects-and-craft-kit.md` — the effect arsenal: when each is right, when it is a cliché.
- `references/craft/premium-techniques.md` — the moves that separate premium from generic; "the last 10%".
- `references/showcase-notes.md` — annotated notes on the card library (folder-name evidence).
- `checklists/pre-delivery.md` — mechanical pre-delivery checklist, every item YES/NO with its lint id or grep.

## Honesty

The pack's data layer was built and linted before these references. Where a claim here is not backed by a `BTY-` id, a
measured number in the CSVs, or a named path in this repo, it is marked `(unverified)`. Do not promote an unverified
claim into a rule; measure it and add a CSV row instead.
