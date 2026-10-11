"""mix.py -- sections 2 and 3 of docs/PERSIAN-SOUND-SPEC.md.

Section 2: tempo snap (grid offset + bpm nudge so the strongest impact/first
strong cue lands exactly on a beat 1) and music layer placement locked to that
grid, built from the synth.py instruments of the chosen profile.
Section 3 helpers: SFX bus placement at the picture-locked cues, sidechain
ducking (kick: pad+bass -3 dB / 90 ms; music -2.5 dB under impact/whoosh with
150 ms release), bus peak targets (sfx -10 dBFS, music -20 dBFS) and fades.

Only dependency: numpy (+ the sibling synth.py).
"""
import numpy as np

import synth

BAR = 4                    # 4/4 grid
GRID_TOL = 0.040           # never move a picture cue more than 40 ms
KICK_DUCK_DB = 3.0         # pad+bass duck after each kick
KICK_DUCK_S = 0.090
MUSIC_DUCK_DB = 2.5        # music ducked under impact/whoosh
MUSIC_DUCK_RELEASE = 0.150
SFX_PEAK = synth.db(-10.0)   # sfx bus peak target
MUSIC_PEAK = synth.db(-20.0) # music bus peak target (before master)
IMPACT_HOLD = 0.6          # duck hold under an impact
WHOOSH_HOLD = 0.5          # duck hold under a whoosh
FADE_IN_S = 0.060
FADE_OUT_S = 0.040


def _grid_dist(t, offset, beat):
    k = round((t - offset) / beat)
    return abs(t - (offset + k * beat))


def snap_tempo(cues, bpm_range, rng):
    """Pick (bpm, offset) so the anchor cue sits exactly on a beat 1.

    Anchor = strongest impact, else first strong cue (s >= 0.6), else first
    cue. bpm is nudged at most +-4 percent around the profile draw to maximize
    the number of strong cues within GRID_TOL of a grid beat."""
    base = float(rng.uniform(*bpm_range))
    playable = [c for c in cues if c["kind"] not in ("intro", "outro")]
    strong = [c["time"] for c in playable
              if c["kind"] == "impact" or c["strength"] >= 0.6]
    impacts = [c["time"] for c in playable if c["kind"] == "impact"]
    if impacts:
        anchor = impacts[0]
    elif strong:
        anchor = strong[0]
    elif playable:
        anchor = playable[0]["time"]
    else:
        anchor = 0.0
    ref = strong or [c["time"] for c in playable] or [0.0]

    best = None
    pcts = [0.0]
    for step in range(1, 9):                 # 0.5 percent steps up to 4
        pcts += [0.5 * step, -0.5 * step]
    for pct in pcts:
        bpm = base * (1.0 + pct / 100.0)
        beat = 60.0 / bpm
        offset = anchor % (BAR * beat)       # anchor lands exactly on beat 1
        score = sum(1 for t in ref if _grid_dist(t, offset, beat) <= GRID_TOL)
        key = (-score, abs(pct))
        if best is None or key < best[0]:
            best = (key, bpm, offset)
    return best[1], best[2], anchor


def duck_env(n, events, amount_db, release):
    """Multiplicative duck envelope; events = list of (start_sec, hold_sec)."""
    env = np.ones(n)
    drop = synth.db(-amount_db)
    rn = int(release * synth.SR)
    for t, hold in events:
        i0 = max(0, int(round(t * synth.SR)))
        if i0 >= n:
            continue
        i1 = min(n, i0 + int(hold * synth.SR))
        i2 = min(n, i1 + rn)
        env[i0:i1] *= drop
        if i2 > i1:
            env[i1:i2] *= drop + (1.0 - drop) * np.linspace(0.0, 1.0, i2 - i1)
    return env[:, None]


def place_music(profile, dur, bpm, offset, rng):
    """Place the profile layers on the snapped grid. Returns (music bus,
    kick_times). Music bus peak normalized to MUSIC_PEAK."""
    p = profile
    beat = 60.0 / bpm
    n = int(np.ceil((dur + 1.2) * synth.SR))
    main = np.zeros((n, 2))        # kick / clap / hat / resolve
    duckable = np.zeros((n, 2))    # bass / pad / drone (sidechained)
    wet = np.zeros((n, 2))         # reverb send: pluck / sparkle
    wet_duck = np.zeros((n, 2))    # reverb send for the duckable instruments
    scale = [synth.note_hz(x) for x in p["scale"]]
    L = p["layers"]
    kick_times = []

    def slots(pattern):
        out = []
        for bpos in synth._pattern_times(pattern, dur + 0.6, beat, rng):
            t = offset + bpos * beat
            if -0.05 < t <= dur:
                out.append((bpos, t))
        return out

    def cfg(kind):
        c = L.get(kind)
        return c if isinstance(c, dict) else None

    c = cfg("kick")
    if c:
        for _, t in slots(c.get("pattern", "light")):
            kick_times.append(t)
            synth.place(main, synth.kick(rng), t, c.get("gain", -12))
    c = cfg("clap")
    if c:
        for _, t in slots(c.get("pattern", "2/4")):
            synth.place(main, synth.clap(rng), t, c.get("gain", -16))
    c = cfg("hat")
    if c:
        swing = p.get("swing", 0.0)
        for bpos, t in slots(c.get("pattern", "8ths")):
            tt = t + (bpos % 1.0 > 0.25) * swing * 0.5 * beat
            synth.place(main, synth.hat(rng), tt, c.get("gain", -22))
    c = cfg("bass")
    if c:
        for _, t in slots(c.get("pattern", "roots")):
            f = scale[int(rng.integers(0, max(1, len(scale) // 2)))] * 0.5
            synth.place(duckable, synth.bass(f, dur=min(0.45, beat * 0.9)), t,
                        c.get("gain", -18))
    c = cfg("pad")
    if c:
        degs = c.get("degrees", [0, 2, 4])
        chord = [scale[d % len(scale)] * 2 ** (d // len(scale)) for d in degs]
        sig = synth.pad(chord, dur=dur, attack=0.25)
        synth.place(duckable, sig, 0.0, c.get("gain", -24))
        synth.place(wet_duck, sig, 0.0, c.get("gain", -24))
    c = cfg("drone")
    if c:
        notes = [synth.note_hz(x) for x in c["notes"]]
        sig = synth.pad(notes, dur=dur, attack=0.6)
        synth.place(duckable, sig, 0.0, c.get("gain", -26))
        synth.place(wet_duck, sig, 0.0, c.get("gain", -26))
    c = cfg("pluck")
    if c:
        step = int(c.get("step", 2))
        deg = 0
        for bpos, t in slots(c.get("pattern", "motif"))[::step]:
            deg = int(np.clip(deg + rng.integers(-2, 3), 0, len(scale) * 2 - 1))
            f = scale[deg % len(scale)] * 2 ** (deg // len(scale))
            eng = c.get("engine", "karplus")
            synth.place(wet, synth.pluck(f, dur=0.6, engine=eng, rng=rng), t,
                        c.get("gain", -20))
            if c.get("ornament") and rng.random() < 0.5:
                synth.place(wet, synth.pluck(f * 2 ** (2 / 12.0), dur=0.25,
                                             engine=eng, rng=rng),
                            t - 0.05, c.get("gain", -20) + 6.0)
    c = cfg("sparkle")
    if c:
        for _, t in slots("sparse")[:3]:
            synth.place(wet, synth.sparkle(scale[-1] * 2, dur=0.5), t,
                        c.get("gain", -26))

    # kick sidechain: pad+bass -3 dB for 90 ms after each kick
    kd = duck_env(n, [(t, KICK_DUCK_S) for t in kick_times],
                  KICK_DUCK_DB, release=0.02)
    music = (main
             + duckable * kd
             + synth.reverb(wet, wet=p.get("reverb_wet", 0.18))
             + synth.reverb(wet_duck, wet=p.get("reverb_wet", 0.18)) * kd)

    # resolve: final tonic chord on the last bar 1, rings past the picture
    beat_pos = max(0.0, dur - offset) / beat
    resolve_t = offset + float(np.floor(beat_pos / BAR)) * BAR * beat
    synth.place(main, synth.pad(scale[:3], dur=0.60, attack=0.05),
                resolve_t, -20.0)

    m = np.max(np.abs(music))
    if m > 0:
        music *= MUSIC_PEAK / m
    return music, kick_times


def render_sfx(cues, dur, rng):
    """Place the picture-locked SFX. Returns (sfx bus at about -10 dBFS peak,
    output cue list including the applied gain)."""
    n = int(np.ceil((dur + 1.5) * synth.SR))
    dry = np.zeros((n, 2))
    wet = np.zeros((n, 2))
    out = []
    ti = 0
    strong = [c for c in cues
              if c["kind"] in ("impact", "whoosh") or c["strength"] >= 0.6]
    first_strong = strong[0] if strong else None
    for cue in cues:
        k = cue["kind"]
        if k == "intro":
            if first_strong is not None and first_strong["time"] >= 0.5:
                synth.place(wet, synth.riser(rng), first_strong["time"] - 0.5, -12.0)
                out.append(dict(cue, gain=-12.0))
            else:
                out.append(dict(cue, gain=0.0))
            continue
        if k == "outro":
            out.append(dict(cue, gain=0.0))
            continue
        if k == "impact":
            g = -6.0
            synth.place(dry, synth.impact(rng), cue["time"], g)
        elif k == "whoosh":
            g = -10.0
            direction = "up" if ti % 2 == 0 else "down"
            synth.place(dry, synth.whoosh(rng, direction=direction), cue["time"], g)
        elif k == "tick":
            g = -14.0 + float(rng.uniform(-1.5, 1.5))
            synth.place(wet, synth.tick(rng, timbre=ti % 2), cue["time"], g)
        else:
            g = -16.0
            synth.place(wet, synth.pop(rng), cue["time"], g)
        ti += 1
        out.append(dict(cue, gain=round(g, 2)))
    bus = dry + synth.reverb(wet, wet=0.18)
    m = np.max(np.abs(bus))
    if m > 0:
        bus *= min(SFX_PEAK / m, 4.0)     # normalize bus to about -10 dBFS
    return bus, out


def build_mix(cues, profile, dur, slug, stem):
    """Full section 2+3 render. Returns (stereo mix of exactly round(dur*SR)
    samples, output cue list, info dict)."""
    rng = np.random.default_rng(synth.fnv1a(slug + "|" + stem))
    bpm, offset, anchor = snap_tempo(cues, profile["bpm"], rng)
    music, kick_times = place_music(profile, dur, bpm, offset, rng)
    sfx, cues_out = render_sfx(cues, dur, rng)

    events = [(c["time"], IMPACT_HOLD if c["kind"] == "impact" else WHOOSH_HOLD)
              for c in cues_out if c["kind"] in ("impact", "whoosh")]
    music = music * duck_env(len(music), events, MUSIC_DUCK_DB, MUSIC_DUCK_RELEASE)

    n = int(round(dur * synth.SR))
    total = music[:n] + sfx[:n]
    fi = min(n, int(FADE_IN_S * synth.SR))
    total[:fi] *= np.linspace(0.0, 1.0, fi)[:, None]
    fo = min(n - fi, int(FADE_OUT_S * synth.SR)) or 1
    total[-fo:] *= (0.5 + 0.5 * np.cos(np.linspace(0.0, np.pi, fo)))[:, None]
    m = np.max(np.abs(total))
    if m > 0.98:
        total *= 0.98 / m
    info = dict(bpm=round(bpm, 2), offset=round(offset, 4), anchor=round(anchor, 4),
                kicks=len(kick_times), duck_events=len(events))
    return total, cues_out, info
