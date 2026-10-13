---
name: persian-arts-sound
description: INTERNAL craft skill of the persian-arts orchestrator (sound for motion films: one recorded track on the beat, SFX from events). Invoked only by the persian-arts TODO step "sound"; never auto-trigger for general requests.
---

<!-- GENERATED from .claude/skills/persian-arts-sound/SKILL.md by scripts/sync-persian-arts-skill.mjs. Do not edit; run the script. -->
Invocation in Codex: $persian-arts-sound  (Claude Code: /persian-arts-sound or the Skill tool)

# persian-arts-sound (internal)

## When called
TODO step `sound`, after the picture is locked. DEFERRED when the owner postponed music (record it in memory and skip; the film ships silent).

## Reads (goal memory first)
`goal-memory.md` (OWNER FEEDBACK on music, CONSTRAINTS, THROUGH-LINE), `docs/motion/PLAYBOOK-SOUND.md`, `events.json` of the locked picture, `docs/motion/FILM-GATES.md` rows Music/SFX/Loudness.

## Decides
The one recorded track and its tempo/grid; which events get SFX; the mix balance and the musical ending.

## Delivers
Mixed audio and muxed film, the cue sheet from `events.json`, and the measured numbers of the FINAL mix.

## CRITICAL rules (motion graphics)
1. Recorded audio only: no synthesized bed passed off as music; one track that evolves, on the beat grid (grid error <= 15 ms).
2. SFX are placed only from rows of `events.json` (cue sheet), within 1 frame (33 ms at 30 fps) of the picture event.
3. Verify on the FINAL mix, not on stems: loudness -14 LUFS, true peak <= -1 dBTP, event comparison on the mix.
4. Sound never changes the picture timing; if the grid does not fit, report it to the Director (picture owns time).
5. Music is postponed until the design is right when the owner says so; never mix before picture lock.

## Appends to goal memory
DECISIONS (track choice, rejected tracks); CURRENT STATE lines for audio files; REJECTED sounds.
