# Music first

The music is chosen and mapped **before** the storyboard. The picture is cut to the music, never the other way.
Method adapted from video-shotcraft `music-beat-sync.md` (measured cuts ≤ 2.2 f on a 70 s film).

## Why one track

Splicing pieces of different songs with short crossfades and matched loudness always sounds patched: different
key, tempo, timbre and mix make every join audible. Loudness (RMS) matching is not musical matching.

**Rules that follow:**
1. **One film, one track.** Edit only inside it.
2. **Cut on phrase boundaries**, usually every 4 or 8 bars, at the downbeat (bar 1 beat 1) of both the outgoing and
   incoming phrase. Prefer cutting *into* a section start (the arrangement re-enters naturally).
3. **Crossfades ≤ 1 beat and only between phrases of the same section type**; otherwise a hard cut on a downbeat
   (or 1–2 frames before it).
4. **End on the track's own ending** (or its last strong downbeat + natural decay). Never fade out mid-phrase
   unless the brief is a loop.
5. A second track is allowed only with a deliberate musical stop between them (silence ≥ 1 beat or a hit + tail),
   and only with the owner's approval.

## Choosing a track

Library tracks have a sidecar JSON (schema `schemas/music-track.schema.json`): `bpm`, `t0` (seconds of beat 0),
`beat_s`, `beats_per_bar`, `sections[]` (`kind`, `from_bar`, `to_bar`), `energy[]` per bar, `impacts[]` (detected
drum/impact transients), `key`/`mode`, optional `dastgah`, `mood[]`, `instruments[]`, `safe_cuts[]`.

Pick by, in order: the design read's emotion → energy curve that matches the story arc (hook, build, breath, climax,
resolve) → length (≥ duration, or cuttable via `safe_cuts`) → tempo for the motion dial:

| Content | BPM | Notes |
|---|---|---|
| calm explainer / tutorial | 60–85 | steady, few accents; long holds need slow phrases |
| standard educational | 85–110 | even dynamics; avoid big drops under narration |
| upbeat promo / product | 110–130 | clear downbeats to cut on |
| high-energy launch / sport | 120–150 | strong kick grid; ≤ 3 full-frame hits per film |

Instrumental only under voice-over or dense on-screen text.

### Persian colour (guideline, not law)

When the piece should feel Iranian, prefer instruments (tar, setar, santur, kamancheh, ney, tombak, daf) and modal
colour over "generic oriental" pads. Common associations (conventional, verify by ear):

| Dastgah / avaz | Common colour | Fits |
|---|---|---|
| Mahur | bright, festive, confident | launches, celebrations, positive announcements |
| Chahargah | strong, epic, driving | institutional pride, big reveals |
| Homayun | grand, solemn, deep | heritage, formal openings |
| Shur | intimate, lyrical, everyday | storytelling, human topics |
| Segah | tender, reflective | thoughtful explainers, endings |
| Bayat-e Esfahan / Dashti / Afshari | melancholic, nostalgic, plaintive | memory, loss, poetry — avoid for upbeat briefs |
| Abu-ata / Bayat-e Tork | folk, warm, plain-spoken | community, everyday education |

A Persian-colour track must still have a grid you can cut on; free-rhythm avaz sections suit openings and breaths,
not information runs.

## Mapping (stage 2 output)

1. Beat grid: `pa music add` fits an even grid to detected beats (least squares), checks ½×/1×/2× ambiguity, and
   reports `match ≥ 98 %`, mean error < 10 ms, drift < 5 ms. Free-tempo tracks: map sections by hand and cut on real
   onsets, not grid points.
2. Section map: story parts → bar ranges (in `direction.md`). Big changes on phrase starts; details on beats.
3. Strongest impacts: the 2–3 largest kick/impact moments from the sidecar's `impacts[]` → hook, climax, close. Only these may drive full-frame
   impacts (scale pump, flash, shake), ≥ 16 beats apart. Everything else animates the hero element, not the frame.
4. Anchors: dense regular cuts → grid; sparse accents and the final hold → the real onset time.
5. Times stay in float seconds until the engine converts `bar N beat M` to frames at render.
