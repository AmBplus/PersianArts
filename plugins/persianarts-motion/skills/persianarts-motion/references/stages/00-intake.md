# Stage 0 — Intake → `brief.json`

Goal: know exactly what to make, asking only what you cannot reasonably infer.

## Fill these fields (schema: `schemas/brief.schema.json`)

| Field | Ask if missing? | Default when not asked |
|---|---|---|
| `goal` — the one thing a viewer should know/feel/do after watching | **yes** | — |
| `audience` | if unclear from goal | general Persian-speaking adults |
| `kind` — explainer · educational · product · launch · announcement · title · social · other | infer | from wording |
| `duration_s` | if not given | educational 45–60, social 15–30, title 8–15 |
| `aspect` — 16:9 · 9:16 · 1:1 · 4:5 | if a platform implies one, infer | 16:9 |
| `platform` — where it will be published | infer | — |
| `fps` | no | 30 |
| `copy` — every on-screen line the user supplied, verbatim | — | you will draft copy at storyboard |
| `brand` — logo files, colours, fonts | if a brand is named | none |
| `music` — a given track, a mood, or "choose for me" | **yes, briefly** | choose from library |
| `voiceover` — none · user audio · TTS | if educational | none |
| `mode` — co-create · autonomous | no | co-create |
| `must` / `must_not` | — | [] |

## How to ask

One message, at most 4 short questions, each with a recommended default (the user can answer "defaults"). In
autonomous mode ask nothing that has a safe default; record assumptions in `brief.json.assumptions`.

## Then

Create the project folder (`pa init <slug>` when it exists; otherwise by hand: `brief.json`, `scenes/`,
`public/`, `out/`, `review/`) and write `brief.json`.

Size follows aspect: 16:9 → 1920×1080, 9:16 → 1080×1920, 1:1 → 1080×1080, 4:5 → 1080×1350.

**If you asked any question, end your turn and wait for the answer.** Otherwise (everything had a safe
default, or autonomous mode) continue to stage 1 in the same turn.
