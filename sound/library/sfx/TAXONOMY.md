# SFX taxonomy

One category vocabulary for every source under `sound/library/sfx/`. Layout: `sound/library/sfx/<source>/<category>/<file>`.
Sources: `kenney`, `freesound`, `anidoodle`, `owner-pack`. Machine-readable mapping: `CATALOG.json` (field `category`).

## Categories

| category | covers |
|---|---|
| ui | interface clicks, ticks, rollovers, confirm/error UI tones |
| click | short mechanical clicks (switches, buttons, typewriter-like single clicks) |
| typing | keyboard keys, typewriter strikes, spacebar, carriage return, backspace |
| slide | slide, swipe, paper slide, sliding sheets or cards |
| whoosh | air whooshes, swishes, fast sweeps (short) |
| swoosh-transition | long transition swooshes used between scenes |
| pop | small percussive pops, element appears |
| bubble | bubble pops, bubble appear |
| paper-pencil | pencil or pen writing, scribble, marker, eraser, paper rustle, tear, crumble, page turn |
| stamp-thud | rubber stamp, thud landing on paper or table |
| impact | hard hits: glass, metal, wood, doors, bodies |
| riser | rising build-ups, reverse swells leading into a hit |
| downlifter | falling sweeps after a hit |
| stinger | short musical or sound-design accent, title or reveal hit |
| ding-chime | bells, chimes, dings, end-of-line bell |
| success | positive confirmation jingle |
| fail | negative buzz or error jingle |
| boing-cartoon | cartoon boing, spring, bounce |
| glitch | digital stutter, corruption, distortion bursts |
| tick-clock | clock ticks, countdown ticks |
| camera-shutter | camera shutter, photo click |
| sparkle-magic | sparkle, twinkle, magic zing |
| ambience | room tone, rain, radio or TV noise, drones, long beds |
| alarm-timer | alarm clocks, alarm bells, kitchen or countdown timer ends (end-of-timer signal) |
| boom-sub | sub-bass booms, bass drops, low impact hits used as a payoff |
| misc | anything that does not fit (unsure -> misc) |

## Mapping of existing sources

- `kenney/<category>/` already uses this vocabulary. The folder `ding` is the same concept as `ding-chime` (not renamed; the manifest is tracked).
- `freesound/<category>/`: folder `boing` = `boing-cartoon`, folder `ding` = `ding-chime`. Others map 1:1. Added by `work/persian/freesound_payoff_fill.py`: folders `alarm-timer` and `boom-sub` are new categories; folder `misc` holds water-drop ripples; folder `riser` also holds shimmer and swell clips. Query-to-category choices and their results are logged in `work/persian/freesound-payoff-fill.log`. Freesound search is by tags and name only, so clips in the new folders are unlistened and may be off-target (e.g. some `boom-sub` clips are named "riser hit", and some `alarm-timer` clips are kitchen or toaster dings).
- `anidoodle/<category>/`: synthesised clips (code-generated, not sampled), flagged `preview_only: true` in `CATALOG.json`.
- `owner-pack/<category>/`: imported from the owner's `songpack` folders. Rules and per-file flags are in `owner-pack/manifest.json`.

Owner-pack folder -> category (first matching rule per file): abstract (bell-reverse, rocky/reverse build-ups -> riser; glass, window-crack, crash-with-glass, smashed, wet-splat, guitar-hit -> impact; freeze, ice, rain, tv-noise, radio-snow, dark-drone -> ambience; paper-crumble/rip/tear/turn -> paper-pencil; paper-shifting -> slide; slice -> whoosh; magic-zing -> sparkle-magic; distortion -> glitch; liquid, water, heartbeat, record, sizzle, weird-noise, tone-cross, tv-off, radio-station -> misc); calligraphy -> paper-pencil; camera -> camera-shutter; cinematic -> stinger (doubt); digital -> misc (doubt); door -> impact (doubt); heartbeat -> misc; single-note -> ding-chime (doubt); slide -> slide; type -> typing; typewriter-antique (bell -> ding-chime, click and type-with-return -> typing, paper-* -> paper-pencil, switch -> click (doubt), typewriter-drop -> impact); typewriter (keys, spacebar, return, shift, backspace, random sentences -> typing; end-bell solo/tab -> ding-chime; page-feed/page-holder -> paper-pencil); woosh -> whoosh.

## Known misfits (not moved)

- Freesound `ambience/` holds about 44 clips whose names say paper (crumple, tear, page, writing). They should be `paper-pencil`. Not moved: the manifest is tracked, so moving would break its paths. Listed in `media/sfx/_import/dupes_misfile.json`.
- Kenney `misc/footstep_carpet_001/002` and `003/004` are byte-identical pairs.
- Freesound `whoosh/391445` and `391449` (ukulele whoosh) are byte-identical.

## Doubts

Owner-pack files flagged `category_doubt` in `owner-pack/manifest.json` (62 files) were classified by folder name only, without listening. Audition before using them for a specific beat.
