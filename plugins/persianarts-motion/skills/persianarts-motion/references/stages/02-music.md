# Stage 2 — Music first → track, beat map, section map

**No music** (`brief.music.source = "none"`): skip this stage; time scenes in seconds and keep a steady internal
rhythm (cut on motion, hold to read). Otherwise read `../sound/music-first.md` fully. Summary of the stage:

1. Shortlist 2–3 tracks from the music library (`pa music list --mood … --bpm …`) that fit the design read and
   the duration. Each library track has a sidecar `.json` with BPM, phase, bars, sections, energy curve, key/mode
   and safe edit points. A user-supplied track: run `pa music add <file>` first.
2. Choose **one** track. Plan the edit *inside* that track only: which sections, cut on phrase boundaries
   (usually every 4 or 8 bars), the ending on the track's own ending or a hard stop on a downbeat.
3. Write the **section map**: which part of the story lives on which bars (hook, build, information run, breath,
   climax, close). Big changes on bar 1 of a phrase; details on beats.
4. Record `film.json.music` (`track`, `edits[]` in **source-track** bars, `gain_db`), and the section map in
   `direction.md` in **edited-film** bars (bar 1 = first bar of the edited music).

✋ Co-create: give the user the edited preview (`pa music preview`) and the section map; end the turn.
Never present a mashup of two songs. If no track fits, say so and propose: user provides one, or a different mood.
