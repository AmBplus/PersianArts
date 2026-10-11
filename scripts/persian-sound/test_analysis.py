#!/usr/bin/env python3
"""Tests for analysis.py: synthetic ffmpeg lavfi clip with 3 flashes."""
import os
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import analysis  # noqa: E402

FPS = 30
DUR = 3.0
FLASH_TIMES = (0.5, 1.5, 2.5)
FLASH_LEN = 0.06  # 2 frames


def make_flash_clip(path):
    """3 s black clip, three 2-frame white flashes at 0.5/1.5/2.5 s."""
    flashes = "+".join("between(T,%.2f,%.2f)" % (t, t + FLASH_LEN) for t in FLASH_TIMES)
    expr = "if(%s,255,0)" % flashes
    cmd = [
        "ffmpeg", "-v", "error", "-y",
        "-f", "lavfi", "-i", "color=black:s=192x108:r=%d:d=%s" % (FPS, DUR),
        "-vf", "format=gray,geq=lum='%s'" % expr,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast",
        str(path),
    ]
    subprocess.run(cmd, check=True)


class TestAnalysis(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp(prefix="persian-sound-test-")
        cls.clip = os.path.join(cls.tmp, "flash3.mp4")
        make_flash_clip(cls.clip)

    def test_motion_energy_length_and_range(self):
        e = analysis.decode_frames(self.clip, FPS)
        self.assertEqual(len(e), int(DUR * FPS))
        self.assertTrue((e >= 0).all())
        self.assertGreater(float(e.max()), 10.0)  # flashes produce real motion

    def test_detects_three_flashes(self):
        e = analysis.decode_frames(self.clip, FPS)
        cues = analysis.detect_cues(e, FPS)
        non_meta = [c for c in cues if c["kind"] not in ("intro", "outro")]
        self.assertEqual(len(non_meta), 3, "expected exactly 3 flash cues, got %r" % (non_meta,))
        for cue, t in zip(non_meta, FLASH_TIMES):
            self.assertLess(abs(cue["time"] - t), 0.15, "cue %s off from flash %s" % (cue, t))
            self.assertGreaterEqual(cue["strength"], 0.70)
            self.assertIn(cue["kind"], ("impact", "pop"))  # flashes are sharp jumps
        for a, b in zip(non_meta, non_meta[1:]):
            self.assertGreaterEqual(b["frame"] - a["frame"], 5)  # min gap 0.17 s

    def test_static_video_has_no_cues(self):
        still = os.path.join(self.tmp, "still.mp4")
        subprocess.run([
            "ffmpeg", "-v", "error", "-y",
            "-f", "lavfi", "-i", "color=gray:s=192x108:r=%d:d=2" % FPS,
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast", still,
        ], check=True)
        e = analysis.decode_frames(still, FPS)
        self.assertEqual(analysis.detect_cues(e, FPS), [])

    def test_cue_fields(self):
        e = analysis.decode_frames(self.clip, FPS)
        for cue in analysis.detect_cues(e, FPS):
            self.assertEqual(set(cue.keys()), frozenset(("frame", "time", "kind", "strength")))
            self.assertIn(cue["kind"], ("impact", "whoosh", "tick", "pop", "intro", "outro"))


if __name__ == "__main__":
    unittest.main()
