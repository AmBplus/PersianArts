"""Tests for lint_fa.py. Run from this directory: python3 -m unittest test_lint_fa -v"""
import json
import os
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lint_fa  # noqa: E402

LINT = os.path.join(HERE, "lint_fa.py")


def run_lint(name, text):
    """Write text to a temp file named `name` and return its findings."""
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, name)
        with open(path, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        return lint_fa.lint_file(path)


def rules(findings):
    return [f.rule for f in findings]


class CopyRuleTests(unittest.TestCase):
    def test_arabic_yeh_flagged(self):
        f = run_lint("a.md", "کتابي")
        self.assertEqual(rules(f), ["arabic-yeh"])
        self.assertEqual(f[0].severity, lint_fa.ERROR)

    def test_persian_yeh_clean(self):
        self.assertEqual(run_lint("a.md", "کتابی"), [])

    def test_arabic_kaf_flagged(self):
        self.assertEqual(rules(run_lint("a.md", "کتاك")), ["arabic-kaf"])

    def test_persian_kaf_clean(self):
        self.assertEqual(run_lint("a.md", "کتاک"), [])

    def test_arabic_digit_flagged(self):
        f = run_lint("a.md", "٣ کتاب")
        self.assertEqual(rules(f), ["arabic-digit"])
        self.assertEqual(f[0].severity, lint_fa.ERROR)

    def test_persian_digit_clean(self):
        self.assertEqual(run_lint("a.md", "۳ کتاب"), [])

    def test_latin_digit_beside_persian_warns(self):
        f = run_lint("a.md", "از 31 مورد")
        self.assertEqual(rules(f), ["latin-digit"])
        self.assertEqual(f[0].severity, lint_fa.WARN)

    def test_latin_digit_in_latin_text_clean(self):
        self.assertEqual(run_lint("a.md", "Version 2.0 released"), [])

    def test_mi_space_flagged(self):
        self.assertEqual(rules(run_lint("a.md", "من می خواهم")), ["mi-space"])

    def test_mi_with_zwnj_clean(self):
        self.assertEqual(run_lint("a.md", "من می‌خواهم"), [])

    def test_suffix_after_space_flagged(self):
        self.assertEqual(rules(run_lint("a.md", "کتاب ها")), ["suffix-space"])

    def test_suffix_with_half_space_clean(self):
        self.assertEqual(run_lint("a.md", "کتاب‌ها"), [])

    def test_latin_punctuation_after_persian_flagged(self):
        f = run_lint("a.md", "سلام, دنیا; چطور?")
        self.assertEqual(rules(f), ["latin-punct", "latin-punct", "latin-punct"])
        self.assertTrue(all(x.severity == lint_fa.WARN for x in f))

    def test_persian_punctuation_clean(self):
        self.assertEqual(run_lint("a.md", "سلام، دنیا؛ چطور؟"), [])

    def test_straight_quotes_flagged(self):
        f = run_lint("a.md", '"تیتر"')
        self.assertTrue(f)
        self.assertEqual(set(rules(f)), {"straight-quotes"})

    def test_guillemets_clean(self):
        self.assertEqual(run_lint("a.md", "«تیتر»"), [])

    def test_kashida_repeated_in_word_is_error(self):
        f = run_lint("a.md", "سـبـه")
        self.assertEqual(rules(f), ["kashida-repeat"])
        self.assertEqual(f[0].severity, lint_fa.ERROR)

    def test_single_kashida_clean(self):
        self.assertEqual(run_lint("a.md", "سـلام"), [])

    def test_kashida_after_non_joining_letter_is_error(self):
        f = run_lint("a.md", "دـرس")
        self.assertEqual(rules(f), ["kashida-misplaced"])
        self.assertEqual(f[0].severity, lint_fa.ERROR)

    def test_kashida_at_word_start_is_error(self):
        self.assertEqual(rules(run_lint("a.md", "ـسلام")), ["kashida-misplaced"])

    def test_kashida_inside_lam_alef_is_error(self):
        self.assertEqual(rules(run_lint("a.md", "لـا")), ["kashida-misplaced"])

    def test_kashida_after_joining_letter_clean(self):
        self.assertEqual(run_lint("a.md", "بـه"), [])

    def test_lam_alef_without_kashida_clean(self):
        self.assertEqual(run_lint("a.md", "لا"), [])


class CodeRuleTests(unittest.TestCase):
    def test_letter_spacing_with_persian_is_error(self):
        f = run_lint("a.tsx", "const s = { letterSpacing: '0.12em' };\nconst t = 'تیتر';\n")
        self.assertEqual(rules(f), ["letter-spacing"])
        self.assertEqual(f[0].severity, lint_fa.ERROR)

    def test_letter_spacing_zero_clean(self):
        self.assertEqual(run_lint("a.tsx", "const s = { letterSpacing: 0 };\nconst t = 'تیتر';\n"), [])

    def test_letter_spacing_without_persian_clean(self):
        self.assertEqual(run_lint("a.tsx", "const s = { letterSpacing: '0.12em' };\n"), [])

    def test_array_from_on_persian_warns(self):
        f = run_lint("a.tsx", "const t = 'تیتر';\nconst c = Array.from(t);\n")
        self.assertEqual(rules(f), ["letter-boxes"])
        self.assertEqual(f[0].severity, lint_fa.WARN)

    def test_spread_map_on_persian_warns(self):
        self.assertEqual(rules(run_lint("a.tsx", "const t = 'تیتر';\nconst c = [...t].map((x) => x);\n")),
                         ["letter-boxes"])

    def test_split_on_space_clean(self):
        self.assertEqual(run_lint("a.tsx", "const t = 'تیتر شما';\nconst w = t.split(' ');\n"), [])

    def test_split_on_digit_values_clean(self):
        src = ("const t = 'تیتر';\n"
               "const DIGITS = '۰۱۲۳۴۵۶۷۸۹';\n"
               "const cells = DIGITS.split('');\n")
        self.assertEqual(run_lint("a.tsx", src), [])

    def test_ltr_direction_with_persian_warns(self):
        f = run_lint("a.ts", "const s = { direction: 'ltr' };\nconst t = 'تیتر';\n")
        self.assertEqual(rules(f), ["ltr-direction"])
        self.assertEqual(f[0].severity, lint_fa.WARN)

    def test_ltr_direction_without_persian_clean(self):
        self.assertEqual(run_lint("a.ts", "const s = { direction: 'ltr' };\n"), [])

    def test_persian_jsx_text_without_rtl_warns(self):
        f = run_lint("a.tsx", "export const A = () => <p>تیتر</p>;\n")
        self.assertEqual(rules(f), ["no-rtl"])
        self.assertEqual(f[0].severity, lint_fa.WARN)

    def test_dir_rtl_attribute_clean(self):
        self.assertEqual(run_lint("a.tsx", '<p dir="rtl">تیتر</p>\n'), [])

    def test_faroot_clean(self):
        src = 'export const A = () => <FaRoot family="Vazirmatn"><p>تیتر</p></FaRoot>;\n'
        self.assertEqual(run_lint("a.tsx", src), [])

    def test_direction_rtl_style_clean(self):
        src = "export const A = () => <p style={{ direction: 'rtl' }}>تیتر</p>;\n"
        self.assertEqual(run_lint("a.tsx", src), [])

    def test_no_jsx_text_no_rtl_warning(self):
        self.assertEqual(run_lint("a.tsx", "const t = 'تیتر';\n"), [])

    def test_fade_import_warns(self):
        f = run_lint("a.tsx", "import { fade } from '@remotion/transitions/fade';\nconst t = 'تیتر';\n")
        self.assertEqual(rules(f), ["scene-fade"])
        self.assertEqual(f[0].severity, lint_fa.WARN)

    def test_fade_call_warns(self):
        self.assertEqual(rules(run_lint("a.tsx", "const o = fade();\nconst t = 'تیتر';\n")), ["scene-fade"])

    def test_fade_out_variable_clean(self):
        src = "const fadeOut = interpolate(f, [0, 1], [1, 0]);\nconst t = 'تیتر';\n"
        self.assertEqual(run_lint("a.tsx", src), [])

    def test_persian_in_comment_not_copy_checked(self):
        src = "// کتابي\n/* کتابك */\nconst x = 1;\n"
        self.assertEqual(run_lint("a.ts", src), [])

    def test_js_unicode_escape_is_decoded(self):
        f = run_lint("a.ts", r"const t = 'ي';" + "\n")
        self.assertEqual(rules(f), ["arabic-yeh"])
        self.assertEqual((f[0].line, f[0].col), (1, 12))

    def test_string_interpolation_not_copy_checked_as_text(self):
        self.assertEqual(run_lint("a.ts", "const t = `تیتر ${value}`;\n"), [])


class JsonTests(unittest.TestCase):
    def test_values_checked_keys_skipped(self):
        src = r'{"title": "کتابي", "کتابي": "x"}' + "\n"
        f = run_lint("strings.json", src)
        self.assertEqual(rules(f), ["arabic-yeh"])
        self.assertEqual(f[0].line, 1)


class AllowTests(unittest.TestCase):
    def test_allow_applies_to_next_line_only(self):
        src = ("const t = 'تیتر';\n"
               "// lint-fa: allow letter-spacing\n"
               "const a = { letterSpacing: '0.1em' };\n"
               "const b = { letterSpacing: '0.2em' };\n")
        f = run_lint("a.tsx", src)
        self.assertEqual(rules(f), ["letter-spacing"])
        self.assertEqual(f[0].line, 4)

    def test_allow_in_markdown_comment(self):
        src = '<!-- lint-fa: allow straight-quotes -->\n"تیتر"\n'
        self.assertEqual(run_lint("a.md", src), [])

    def test_allow_only_suppresses_named_rule(self):
        src = "// lint-fa: allow letter-spacing\nconst a = 'کتابي';\n"
        self.assertEqual(rules(run_lint("a.ts", src)), ["arabic-yeh"])


class CliTests(unittest.TestCase):
    def _tree(self, files):
        tmp = tempfile.TemporaryDirectory()
        for rel, text in files.items():
            path = os.path.join(tmp.name, rel)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(text)
        self.addCleanup(tmp.cleanup)
        return tmp.name

    def _run(self, *args):
        return subprocess.run([sys.executable, LINT, *args], capture_output=True, text=True, encoding="utf-8")

    def test_exit_0_on_warnings_only(self):
        root = self._tree({"w.md": "از 31 مورد\n"})
        self.assertEqual(self._run(os.path.join(root, "w.md")).returncode, 0)

    def test_exit_1_on_error(self):
        root = self._tree({"e.md": "کتابي\n"})
        proc = self._run(os.path.join(root, "e.md"))
        self.assertEqual(proc.returncode, 1)
        self.assertIn("e.md:1:", proc.stdout)
        self.assertIn("ERROR  arabic-yeh", proc.stdout)

    def test_json_output(self):
        root = self._tree({"e.md": "کتابي\n"})
        proc = self._run("--json", os.path.join(root, "e.md"))
        data = json.loads(proc.stdout)
        self.assertEqual(len(data), 1)
        self.assertEqual(set(data[0]), {"path", "line", "col", "severity", "rule", "message"})
        self.assertEqual(data[0]["rule"], "arabic-yeh")
        self.assertEqual(data[0]["severity"], "ERROR")

    def test_directory_walk_skips_node_modules(self):
        root = self._tree({
            "ok.md": "سلام، دنیا\n",
            "node_modules/pkg/bad.md": "کتابي\n",
            "dist/bad.tsx": "const t = 'کتابي';\n",
        })
        proc = self._run("--json", root)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(json.loads(proc.stdout), [])

    def test_missing_path_exit_2(self):
        self.assertEqual(self._run(os.path.join(tempfile.gettempdir(), "no-such-lint-fa-path.md")).returncode, 2)


if __name__ == "__main__":
    unittest.main()
