"""Acceptance tests for synth.py (spec section 5: unittest, no extra deps).

Renders every instrument and every profile's 4-second phrase to
work/persian/sound-task/samples/*.wav and asserts: no NaN/Inf, no peak above
0.99, deterministic output for the same seed. Run:
    python scripts/persian-sound/test_synth.py
"""
import io
import os
import sys
import unittest
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import synth  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..",
                   "work", "persian", "sound-task", "samples")


def wav_bytes(data, sr=synth.SR):
    b = io.BytesIO()
    import tempfile
    fd, tmp = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    try:
        synth.write_wav(tmp, data, sr)
        with open(tmp, "rb") as fh:
            return fh.read()
    finally:
        os.remove(tmp)


class TestInstruments(unittest.TestCase):
    def test_all_instruments(self):
        rng = np.random.default_rng(42)
        cases = {
            "kick": lambda: synth.kick(rng),
            "clap": lambda: synth.clap(rng),
            "hat": lambda: synth.hat(rng),
            "bass": lambda: synth.bass(synth.note_hz("E2"), dur=0.5),
            "pad": lambda: synth.pad([synth.note_hz(x) for x in ("A3", "C4", "E4")], dur=1.5),
            "pluck_karplus": lambda: synth.pluck(synth.note_hz("A4"), dur=0.8, engine="karplus", rng=rng),
            "pluck_setar": lambda: synth.pluck(synth.note_hz("D4"), dur=0.8, engine="setar", rng=rng),
            "pluck_marimba": lambda: synth.pluck(synth.note_hz("C5"), dur=0.8, engine="marimba", rng=rng),
            "sparkle": lambda: synth.sparkle(synth.note_hz("A6")),
            "impact": lambda: synth.impact(rng),
            "whoosh": lambda: synth.whoosh(rng, dur=0.5, direction="up"),
            "tick": lambda: synth.tick(rng, timbre=1),
            "pop": lambda: synth.pop(rng),
            "riser": lambda: synth.riser(rng),
            "reverb": lambda: synth.reverb(synth.pluck(synth.note_hz("A4"), 1.2), wet=0.18),
        }
        os.makedirs(OUT, exist_ok=True)
        for name, fn in sorted(cases.items()):
            y = fn()
            arr = np.asarray(y)
            self.assertTrue(np.all(np.isfinite(arr)), name + ": NaN/Inf")
            peak = float(np.max(np.abs(arr)))
            self.assertLessEqual(peak, 0.99, "%s: peak %.3f" % (name, peak))
            self.assertGreater(peak, 0.0, name + ": silent")
            synth.write_wav(os.path.join(OUT, "inst-%s.wav" % name), arr)
        self.assertEqual(len(sorted(cases)), 15)

    def test_note_hz(self):
        self.assertAlmostEqual(synth.note_hz("A4"), 440.0, places=6)
        self.assertAlmostEqual(synth.note_hz("E4-50"), 440.0 * 2 ** (-5 / 12.0) * 2 ** (-50 / 1200.0), places=6)


class TestProfiles(unittest.TestCase):
    def test_all_profiles_4s(self):
        profiles = synth.load_profiles()
        self.assertGreaterEqual(len(profiles), 8)
        os.makedirs(OUT, exist_ok=True)
        for name in sorted(profiles):
            y, sr = synth.render_phrase(name, dur=4.0, seed="acceptance")
            self.assertTrue(np.all(np.isfinite(y)), name + ": NaN/Inf")
            peak = float(np.max(np.abs(y)))
            self.assertLessEqual(peak, 0.99, "%s: peak %.3f" % (name, peak))
            self.assertGreater(peak, 0.05, name + ": too quiet")
            # clip start/end silent (fades)
            self.assertLess(float(np.max(np.abs(y[:int(0.02 * sr)]))), 0.05, name + ": start click")
            self.assertLess(float(np.max(np.abs(y[-int(0.01 * sr):]))), 0.02, name + ": end click")
            synth.write_wav(os.path.join(OUT, "phrase-%s.wav" % name), y, sr)

    def test_deterministic_same_seed(self):
        a, _ = synth.render_phrase("clean-tech", dur=4.0, seed="det")
        b, _ = synth.render_phrase("clean-tech", dur=4.0, seed="det")
        c, _ = synth.render_phrase("clean-tech", dur=4.0, seed="other")
        self.assertEqual(wav_bytes(a), wav_bytes(b), "same seed must be byte-identical")
        self.assertNotEqual(wav_bytes(a), wav_bytes(c), "different seeds must differ")


if __name__ == "__main__":
    unittest.main(verbosity=2)
