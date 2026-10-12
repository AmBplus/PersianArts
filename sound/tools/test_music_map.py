#!/usr/bin/env python3
"""Tests for music_map on synthetic drum tracks (no audio files needed). Run:
    python3 -m unittest sound/tools/test_music_map.py      (or: python3 sound/tools/test_music_map.py)
"""
import os
import sys
import tempfile
import unittest

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import music_map as mm  # noqa: E402

SR = 44100


def _kick(amp):
    t = np.arange(int(0.25 * SR)) / SR
    ph = 2 * np.pi * (48 * t + 90 * 0.03 * (1 - np.exp(-t / 0.03)))
    k = np.sin(ph) * np.exp(-t / 0.09)
    rng = np.random.default_rng(1)
    k[: int(0.003 * SR)] += rng.standard_normal(int(0.003 * SR)) * 0.6  # beater click
    return amp * k


def _snare(amp):
    t = np.arange(int(0.2 * SR)) / SR
    rng = np.random.default_rng(2)
    n = rng.standard_normal(len(t)) * np.exp(-t / 0.06)
    return amp * (0.5 * n + 0.6 * np.sin(2 * np.pi * 220 * t) * np.exp(-t / 0.05))


def _hat(amp):
    t = np.arange(int(0.05 * SR)) / SR
    rng = np.random.default_rng(3)
    n = np.diff(rng.standard_normal(len(t) + 1)) * np.exp(-t / 0.012)
    return amp * 0.5 * n


def synth_track(times, dur, snare=True, offbeat_hats=True, offbeat_amp=1.0, T=None, kick_amp=0.9):
    """Kick on every grid time (accent on every 4th), snare on beats 2/4, hats/claps on the off-beats."""
    x = np.zeros(int(dur * SR) + SR)

    def put(t, w):
        s = int(round(t * SR))
        if 0 <= s < len(x) - len(w):
            x[s:s + len(w)] += w

    for i, t in enumerate(times):
        put(t, _kick(kick_amp * (1.0 if i % 4 == 0 else 0.8)))
        if snare and i % 2 == 1:
            put(t, _snare(0.8))
        if offbeat_hats:
            tt = (times[i + 1] - t) if i + 1 < len(times) else (T or 0.5)
            put(t + 0.5 * tt, _hat(offbeat_amp))
    return (x[: int(dur * SR)] / 1.5).astype(np.float32)


def run(x, name="syn"):
    import soundfile as sf

    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, name + ".wav")
        sf.write(p, np.stack([x, x], axis=1), SR, subtype="PCM_16")
        res, _ = mm.analyze(p)
    return res


def steady(bpm, t0, dur=22.0):
    T = 60.0 / bpm
    return np.arange(t0, dur - 0.5, T), T


class SteadyGrid(unittest.TestCase):
    def check(self, bpm, t0, **kw):
        times, T = steady(bpm, t0)
        res = run(synth_track(times, 22.0, T=T, **kw))
        g = res["grid"]
        self.assertAlmostEqual(res["bpm"] / bpm, 1.0, delta=0.003, msg=f"bpm {res['bpm']} vs {bpm}")
        ph = ((res["t0"] - t0 + T / 2) % T) - T / 2   # beat 0 may be any beat of the grid, never off-grid
        self.assertLess(abs(ph), 0.005, msg=f"t0 {res['t0']} vs {t0} (off by {ph * 1000:.1f} ms)")
        self.assertEqual(g["verdict"], "PASS", msg=str(g["reasons"]))
        self.assertGreaterEqual(g["match"], 0.98)
        self.assertLess(g["mean_abs_ms"], 10)
        self.assertLess(g["drift_ms"], 5)
        self.assertTrue(g["first_beat_on_attack"])
        return res

    def test_120_bpm_t0_025(self):
        res = self.check(120, 0.25)
        self.assertEqual(res["grid"]["winner"], "1x")
        self.assertEqual(res["beats_per_bar"], 4)
        self.assertAlmostEqual(res["t0"], 0.25, delta=0.005)  # no accents -> beat 0 stays the first beat

    def test_90_bpm_t0_040(self):
        self.check(90, 0.40)

    def test_2x_ambiguity_offbeat_events_as_strong_as_beats(self):
        # 100 bpm kick+snare on beats, equally strong claps on every off-beat: looks like 200 bpm too.
        self.check(100, 0.30, offbeat_amp=1.8)

    def test_fast_tempo_not_halved(self):
        self.check(150, 0.20)

    def test_candidate_selection_recovers_from_wrong_octave(self):
        times, T = steady(120, 0.25)
        x = synth_track(times, 22.0, T=T)
        tr = mm.detect_transients(x, SR)
        ct, cs, cst = mm.cluster_hits(tr)
        for seed_T in (T / 2, T * 2):  # beat tracker locked to 2x or 0.5x
            cands, win, _ = mm.select_grid(seed_T, 0.25, 22.0, ct[cst], ct[cst], ct)
            self.assertAlmostEqual(win["bpm"] / 120.0, 1.0, delta=0.003, msg=str([(c["id"], c["bpm"], c["score"]) for c in cands]))
        self.assertEqual(len(cands), 4)


class NotAGrid(unittest.TestCase):
    def test_jittered_hits_fail(self):
        rng = np.random.default_rng(7)
        T = 0.5
        base = np.arange(0.25, 21.5, T)
        times = base + rng.uniform(-0.055, 0.055, len(base))
        res = run(synth_track(times, 22.0, T=T))
        self.assertEqual(res["grid"]["verdict"], "FAIL", msg=str(res["grid"]))
        self.assertTrue(res["grid"]["reasons"])

    def test_free_tempo_accelerando_fails(self):
        # tempo ramps 80 -> 160 bpm: no constant grid exists
        t, times = 0.25, []
        while t < 21.5:
            times.append(t)
            t += 60.0 / (80 + 80 * t / 22.0)
        res = run(synth_track(np.array(times), 22.0, T=0.5))
        self.assertEqual(res["grid"]["verdict"], "FAIL", msg=str(res["grid"]))

    def test_silence_writes_a_fail_sidecar(self):
        res = run(np.zeros(SR * 6, np.float32))
        self.assertEqual(res["grid"]["verdict"], "FAIL")
        self.assertIn("sections", res)


if __name__ == "__main__":
    unittest.main(verbosity=2)
