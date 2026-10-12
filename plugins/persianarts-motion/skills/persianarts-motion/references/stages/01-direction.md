# Stage 1 — Direction → `direction.md`, `theme.json`, 3 style frames

Goal: a visual language that belongs to *this* subject and no other. This is where films become different from
each other — not by avoiding shared ingredients, but by a fresh direction each time.

## 1. Design read (one or two sentences)

Specific, tied to audience, promise and subject. Good: «آموزش علوم برای نوجوان: کنجکاو و لمس‌پذیر؛ فیزیک نامرئی
را ملموس کن». Weak: "modern, clean, professional".

## 2. Three dials (1–10)

| Dial | Low | High |
|---|---|---|
| `visual_variance` | one tight grammar repeated | each beat may use a distinct visual mode |
| `motion_intensity` | calm holds, small moves | fast kinetic language, frequent direction changes |
| `information_density` | one idea per frame | layered diagrams and callouts |

Consequences: high motion + low density → short kinetic beats; low motion + high density → stable frames with
builds and long readable holds; high variance → stronger anchors (recurring type, palette, sound motif).

## 3. Theme

Copy the closest file in `themes/` into the project as `theme.json` and edit it, or write a new one. It must
validate against `schemas/theme.schema.json` (required colour roles `bg surface ink inkMuted accent line`; fonts
`display` and `body`; motion frame counts are at 30 fps). Decide: colour roles (one accent, a second only with a job), at most two font
families (display + body; numeric may reuse one), type scale, motion tokens (from the dials), texture with a
physical reason or none, SFX family. Brand colours/fonts override when given. Check contrast ink/bg ≥ 4.5.

## 4. Signature device

One visual idea unique to this piece (a shape that carries the story, a material, a camera behaviour). It appears
in one or two beats, usually the climax. Ask: *what visual metaphor belongs to this subject that I have not used
before?*

## 5. Anti-patterns for this piece

List 3–5 things this film must not look like (e.g. "AI-purple gradient", "centred title on blur", "stock
corporate blue with no reason").

## 6. Style frames

Render 3 stills that represent the direction: an opening frame, an information frame, and the signature moment
(`pa stills --frames`; or a throwaway composition). Without a renderer (phase 0), describe each frame precisely
in `direction.md` instead: layout, sizes, colours by role, the copy. Show them with the design read, dials, palette and fonts.

✋ Co-create: present and end the turn. Approval locks the theme; later changes go to `decisions.jsonl`.
