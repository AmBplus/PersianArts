---
name: persian-arts
description: The ONLY skill to use in the PersianArts repo for any motion graphic, promo, teaser, reel, social cut or Persian/RTL animated video request, or when the user types /persian-arts. Forces the project framework (playbooks, plan log with reuse map, events contract, short cut first, film gates, status board). Do not use any other motion, video or Persian skill here.
---

# persian-arts

## 0. Purpose and exclusivity
Single entry point for every motion graphic / Persian-RTL video in this repo. State at the start: "persian-arts active; other motion skills not used".
Do NOT use, imitate or auto-select as workflow: persian-motion-director, commercial-motion, motion-reel, animation-studio, video-shotcraft, anidoodle, codesign:launch-video, codesign:animate, any "director" skill, or the old plugins/persianarts-motion kitchen skill. If one was loaded, say so, stop, restart here. Files under skills/anidoodle may be reused as source code only.

## 1. Intake (spec and Persian wording: docs/motion/INTAKE.md)
- PARSE FIRST: take every answer already in the message (GOAL first: objective, audience, desiredAction+CTA; then label, ratios, duration, genre, character, logo/images, ideas, copy, music, deadline). Never re-ask. A delegation phrase ("خودت تصمیم بگیر", "you decide") = zero questions.
- Ask only what is missing, in the user's language, in ONE batch. Claude Code: one AskUserQuestion call with at most 4 of Q0 GOAL (first, when objective/desiredAction missing; genre presets + Other), Q1 ratios (multi), Q2 genre, Q4 "what do you have" logo/images/copy/character (multi); character is inferred from genre unless ticked; a delegate option or "Other" = defaults. Codex: one markdown form (INTAKE.md section 4).
- Batch 2 (at most one more call) ONLY if logo or images were ticked: how to show images (display catalogue) + one line "drop files in media/briefs-local/<label>/inbox/ or give paths". Raster logo: one yes/no to vectorize into layered SVG. Hard cap: 2 rounds; missing files = placeholders, never a blocker.
- Fill the rest from the genre preset (INTAKE.md section 6); write media/briefs-local/<label>/brief.json (schema docs/motion/brief.schema.json) and print the assumptions block (goal line first), then proceed without further questions.
- LABEL only in tracked files (never the real client name). Drafted copy is marked "not reviewed by a native reader". Never ask permission for routine steps.

## 2. Read (before any plan)
docs/motion/README.md; docs/motion/PLAYBOOK-BUILD-MOTION.md; last 30 lines of docs/motion/DECISIONS.jsonl; docs/PERSIAN-LOCALIZATION-LESSONS.md; docs/PERSIAN-RENDER-CONTRACT.md; docs/motion/FILM-GATES.md. Also PLAYBOOK-RENDER.md and PLAYBOOK-SOUND.md before those stages.

## 3. Board item and plan log
- `pwsh -File work/persian/tools/pa.ps1 status add-item <ID> -Goal <goal> -Title "..." -ExpectedMinutes N`, then `status set` at every step (docs/motion/STATUS-PROTOCOL.md).
- GOAL RULE: every plan, scene and review must trace back to goal.objective and goal.desiredAction; a scene that serves neither is cut. The plan opens with the Goal section and a Scene -> goal trace table.
- Copy docs/motion/plans/TEMPLATE.md to docs/motion/plans/<date>-<slug>.md (see plans/README.md).
- Fill a REUSE MAP: needed element -> existing component path -> reused / adapted / new + reason.
  Samples, including the pencil film, are inspiration only, never the baseline.
  Building from scratch needs a stated reason. Shared helpers (easing etc.) live in ONE module.

## 4. Events contract first
Write an EVENTS constant (named events with times: land, settle, swap...) used by the animation AND exported to events.json, before building anything.

## 5. Short cut first (12 s)
Build the 12 s cut. At first look render stills: 9 frames per ratio. Do one fix round. No full cut yet.

## 6. Sound
One recorded track on the beat grid (PLAYBOOK-SOUND.md). SFX placed from events.json (cue sheet). Verify on the FINAL mix, not on stems.

## 7. Film gates
Run the FILM-GATES.md checks and record the numbers: digits left-to-right isolated, hero size (>= 12% of 9:16 height), empty zones (<= 30% height without motion), beat error <= 15 ms, SFX within 1 frame, loudness -14 LUFS / TP <= -1. Each scene maps to a mustSay claim or to the desiredAction (else cut). Any not-run / unknown / to-build check blocks the claim. A failed gate means a fix round, not a waiver.

## 8. Log
Record findings in docs/motion/DECISIONS.jsonl and in the plan log: result vs plan, minutes per stage.

## 9. Full cut
Only after steps 5-8 pass, build and render the full cut with the same events contract.

## 10. Roles (brain and hands, CLAUDE.md)
When running as the lead: delegate. The lead orders, judges reports, talks to the owner. Workers implement (GLM flash default; Sol for hard cases; Haiku for quick lookups/small edits). An independent Sonnet reviewer judges craft, approve at 85+. Every order has goal, context paths, constraints, deliverables, report path, acceptance (cite FILM-GATES.md and the stage), time box, and "no human is present, do not ask questions".
Owner reports: a short plain Persian decision summary in chat; details in docs/motion/reports/<date>/.

## 11. Time and metering
State expected minutes per step; update the board at each step (docs/motion/METERING.md, METRICS.md). Reports say: done / not done / measured time. No excuses. If one path fails, try two other reasonable paths before declaring a blocker.
