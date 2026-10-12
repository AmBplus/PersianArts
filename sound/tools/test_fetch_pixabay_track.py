import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(__file__))
import fetch_pixabay_track as f

GOOD = "https://pixabay.com/music/beautiful-plays-ambient-piano-12345/"


class T(unittest.TestCase):
    def test_slug(self):
        self.assertEqual(f.slug_from_url(GOOD), "ambient-piano-12345".join(["beautiful-plays-", ""]))
        self.assertEqual(f.slug_from_url("https://pixabay.com/music/x/Odd_Name!!-9/"), "odd-name-9")

    def test_url_validation(self):
        self.assertTrue(f.valid_url(GOOD))
        for bad in ("http://pixabay.com/music/a/b/", "https://evil.com/music/a-1/", "https://pixabay.com/photos/a-1/",
                    "https://pixabay.com/music/", "https://pixabay.com.evil.com/music/a-1/"):
            self.assertFalse(f.valid_url(bad), bad)

    def test_limit(self):
        out = tempfile.mkdtemp()
        self.assertIsNone(f.validate_args([GOOD] * 5, out, False))
        self.assertIn("at most", f.validate_args([GOOD] * 6, out, False))
        self.assertIsNotNone(f.validate_args([], out, False))

    def test_git_tree(self):
        with tempfile.TemporaryDirectory() as d:
            os.mkdir(os.path.join(d, ".git"))
            sub = os.path.join(d, "a", "b")
            self.assertTrue(f.in_git_tree(sub))
            self.assertIn("git", f.validate_args([GOOD], sub, False))
            self.assertIsNone(f.validate_args([GOOD], sub, True))


if __name__ == "__main__":
    unittest.main()
