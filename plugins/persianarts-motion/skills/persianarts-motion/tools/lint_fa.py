#!/usr/bin/env python3
# Persian copy/code linter. Starting point: atmirrr/persian-motion-director scripts/lint_persian.py (MIT).
"""Lint Persian copy and motion code for the mistakes that make Persian look wrong.

usage:
  python lint_fa.py [--json] PATH [PATH ...]

PATH is a file or a directory. Directories are searched recursively for .tsx .ts .jsx .js
(code), .json, .md and .txt; node_modules, out, dist and .git are skipped. Any other explicit
file is linted as plain text.

Copy rules look only at Persian text: string literals and JSX text in code, string values in
JSON (never keys), the whole text of Markdown and plain text. Comments are never copy-checked.
Code rules look at the code with comments blanked out.

Suppress a rule for the NEXT line with a comment on the line above, e.g.
    // lint-fa: allow <rule-id>[, <rule-id>...]

Exit status: 0 no ERROR, 1 at least one ERROR, 2 a PATH does not exist.
"""
import argparse
import bisect
import json
import os
import re
import sys
from dataclasses import dataclass

ERROR = "ERROR"
WARN = "WARN"

# Persian/Arabic letters. Excludes kashida (U+0640), digits, ZWNJ and punctuation.
L = "\u0621-\u063f\u0641-\u064a\u0671-\u06d3\u06fa-\u06ff"
FA_LETTER_RX = re.compile(f"[{L}]")
ZWNJ = "\u200c"
KASHIDA = "\u0640"
# Letters that never join to the following letter, so a kashida after them is invalid:
# alef forms, dal, dhal, reh, zain, zhe, waw, yeh-hamza, teh marbuta, heh with yeh.
RIGHT_ONLY = "\u0627\u0622\u0623\u0625\u062f\u0630\u0631\u0632\u0698\u0648\u0624\u0629\u06c0"
LAM = "\u0644"
ALEFS = "\u0627\u0622\u0623\u0625"
# Suffixes that must be attached with a half-space (longest first).
SUFFIXES = "\u0647\u0627\u06cc|\u0647\u0627|\u062a\u0631\u06cc\u0646|\u062a\u0631"
PERSIAN_PUNCT_LOOKAHEAD = "\\s\u060c.\u061f!:\u061b\u00bb)"


@dataclass
class Finding:
    path: str
    line: int
    col: int
    severity: str
    rule: str
    message: str

    def as_dict(self):
        return {"path": self.path, "line": self.line, "col": self.col,
                "severity": self.severity, "rule": self.rule, "message": self.message}


@dataclass
class Region:
    text: str     # the text a copy rule sees
    pos: list     # raw source offset of each character of text
    kind: str     # "string", "jsx" or "text"


# ---------------------------------------------------------------- copy rules

# (rule-id, severity, regex, message). Applied to every region that contains a Persian letter.
COPY_RULES = [
    ("arabic-yeh", ERROR, re.compile("\u064a"),
     "Arabic yeh U+064A: use Persian yeh U+06CC (ی)"),
    ("arabic-kaf", ERROR, re.compile("\u0643"),
     "Arabic kaf U+0643: use Persian kaf U+06A9 (ک)"),
    ("arabic-digit", ERROR, re.compile("[\u0660-\u0669]"),
     "Arabic-Indic digit U+0660-0669: use Persian digits U+06F0-06F9 (۰-۹)"),
    ("latin-digit", WARN, re.compile(rf"(?<=[{L}])[ \t]?[0-9]+|[0-9]+[ \t]?(?=[{L}])"),
     "Latin digits beside Persian words: use ۰-۹ unless this is a version, code or ID"),
    ("mi-space", WARN, re.compile(rf"(?<![{L}\u200c])\u0646?\u0645\u06cc (?=[{L}])"),
     "می / نمی followed by a space: use the half-space ZWNJ (U+200C), e.g. می‌خواهم"),
    ("suffix-space", WARN, re.compile(rf"(?<=[{L}]) (?:{SUFFIXES})(?=$|[{PERSIAN_PUNCT_LOOKAHEAD}])"),
     "suffix after a full space: attach it with a half-space, e.g. کتاب‌ها / بهتر"),
    ("latin-punct", WARN, re.compile(rf"(?<=[{L}])[,;?]"),
     "Latin punctuation directly after a Persian letter: use ، ؛ ؟ (U+060C, U+061B, U+061F)"),
    ("straight-quotes", WARN, re.compile(rf'"(?=[{L}])|(?<=[{L}])"'),
     "straight quotes around Persian: use « » (U+00AB, U+00BB)"),
]


def _check_copy(reg, add):
    text, pos = reg.text, reg.pos

    def at(k):
        if k < len(pos):
            return pos[k]
        return pos[-1] + 1 if pos else 0

    for rule, sev, rx, msg in COPY_RULES:
        for m in rx.finditer(text):
            add(at(m.start()), rule, sev, msg)

    # Kashida (tatweel U+0640): one elongation per word, placed after a joining letter.
    for m in re.finditer(f"{KASHIDA}+", text):
        s = m.start()
        prev = text[s - 1] if s > 0 else ""
        nxt = text[m.end()] if m.end() < len(text) else ""
        if not (prev and FA_LETTER_RX.fullmatch(prev)):
            add(at(s), "kashida-misplaced", ERROR,
                "kashida (ـ) at a word start: it needs a joining letter before it")
        elif prev in RIGHT_ONLY:
            add(at(s), "kashida-misplaced", ERROR,
                f"kashida (ـ) after a letter that does not join forward (U+{ord(prev):04X})")
        elif prev == LAM and nxt and nxt in ALEFS:
            add(at(s), "kashida-misplaced", ERROR,
                "kashida inside لا breaks the required lam-alef ligature")

    for m in re.finditer(f"[{L}{ZWNJ}{KASHIDA}]+", text):
        word = m.group()
        if word.count(KASHIDA) > 1:
            first = word.index(KASHIDA)
            second = word.index(KASHIDA, first + 1)
            add(at(m.start() + second), "kashida-repeat", ERROR,
                "more than one kashida (ـ) in a word: keep a single elongation per word")


# ---------------------------------------------------------------- code rules

LETTER_SPACING_RX = re.compile(r"\b(?:letter-spacing|letterSpacing)\s*:\s*([^,;}\n]+)")
LTR_RX = re.compile(r"""direction\s*:\s*['"`]ltr|\bdir\s*=\s*\{?\s*['"`]ltr""")
RTL_RX = re.compile(r"""dir\s*=\s*\{?\s*['"`]rtl|direction\s*:\s*['"`]rtl|<FaRoot\b""")
FADE_RX = re.compile(r"""(?<![\w.$])fade\s*\(|from\s+['"]@remotion/transitions/fade['"]""")
# Per-character splitting: .split(''), Array.from(name), [...name].map(
SPLIT_RX = re.compile(
    r"""\.split\(\s*(['"`])\1\s*\)"""
    r"""|\bArray\.from\(\s*[A-Za-z_$][\w$]*\s*\)"""
    r"""|\[\s*\.\.\.\s*[A-Za-z_$][\w$]*\s*\]\s*\.map\("""
)
# A split on digit values is harmless (Persian digits do not join): look back for digit context.
DIGIT_CONTEXT_RX = re.compile(r"digit|\bnumbers?\b|[\u06f0-\u06f9]{2}", re.IGNORECASE)


def _check_code(code, regions, add):
    lines = code.split("\n")
    if FA_LETTER_RX.search(code):
        for m in LETTER_SPACING_RX.finditer(code):
            value = m.group(1).strip().strip("'\"`").strip()
            if re.search("[1-9]", value):
                add(m.start(), "letter-spacing", ERROR,
                    f"letter-spacing {value} in a file with Persian: breaks joining; use 0 and kashida (ـ)")
        for m in LTR_RX.finditer(code):
            add(m.start(), "ltr-direction", WARN,
                "direction ltr in a file with Persian: keep it only for Latin or number islands")
        for m in SPLIT_RX.finditer(code):
            ln = code.count("\n", 0, m.start()) + 1
            window = "\n".join(lines[max(0, ln - 11):ln])
            if not DIGIT_CONTEXT_RX.search(window):
                add(m.start(), "letter-boxes", WARN,
                    "Persian text split into characters: per-letter units break joins; "
                    "use joinedGroups()/words() or shaped outlines")
        jsx_fa = [r for r in regions if r.kind == "jsx" and FA_LETTER_RX.search(r.text)]
        if jsx_fa and not RTL_RX.search(code):
            add(jsx_fa[0].pos[0], "no-rtl", WARN,
                'Persian JSX text but no dir="rtl", direction: \'rtl\' or FaRoot in this file')
    for m in FADE_RX.finditer(code):
        add(m.start(), "scene-fade", WARN,
            "scene-to-scene fade(): move a camera or carry an object across instead")


# ---------------------------------------------------------------- scanning

_ESC = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f", "v": "\v", "0": "\0"}


def _unescape(src, spans):
    """Decode escapes inside raw (start, end) spans; returns (text, pos)."""
    text, pos = [], []
    for a, b in spans:
        k = a
        while k < b:
            ch = src[k]
            if ch == "\\" and k + 1 < b:
                nxt = src[k + 1]
                hexlen = 4 if nxt == "u" else 2 if nxt == "x" else 0
                digits = src[k + 2:k + 2 + hexlen] if hexlen else ""
                if hexlen and re.fullmatch(r"[0-9a-fA-F]+", digits) and len(digits) == hexlen:
                    text.append(chr(int(digits, 16)))
                    pos.append(k)
                    k += 2 + hexlen
                    continue
                text.append(_ESC.get(nxt, nxt))
                pos.append(k)
                k += 2
                continue
            text.append(ch)
            pos.append(k)
            k += 1
    return "".join(text), pos


def _read_quoted(src, i, quote):
    """Scan a JS string starting at src[i]. Returns (end_index, body_spans)."""
    n = len(src)
    k = i + 1
    seg = k
    spans = []
    while k < n:
        ch = src[k]
        if ch == "\\":
            k += 2
            continue
        if ch == quote:
            spans.append((seg, k))
            return k + 1, spans
        if quote != "`" and ch == "\n":  # unterminated: stop at the line end
            spans.append((seg, k))
            return k, spans
        if quote == "`" and ch == "$" and src[k + 1:k + 2] == "{":
            spans.append((seg, k))
            depth, m = 0, k + 1
            while m < n:
                if src[m] == "{":
                    depth += 1
                elif src[m] == "}":
                    depth -= 1
                    if depth == 0:
                        break
                m += 1
            k = seg = m + 1
            continue
        k += 1
    end = min(n, k)
    spans.append((seg, end))
    return end, spans


def scan_js(src):
    """Return (regions, code) where code is src with comments blanked (same length)."""
    n = len(src)
    regions, blanks = [], []
    i = 0
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ""
        if c == "/" and nxt == "/":
            end = src.find("\n", i)
            end = n if end < 0 else end
            blanks.append((i, end))
            i = end
            continue
        if c == "/" and nxt == "*":
            end = src.find("*/", i + 2)
            end = n if end < 0 else end + 2
            blanks.append((i, end))
            i = end
            continue
        if c in "'\"`":
            end, spans = _read_quoted(src, i, c)
            text, pos = _unescape(src, spans)
            regions.append(Region(text, pos, "string"))
            i = end
            continue
        # JSX text: the run after a tag's closing '>' (not an arrow =>, not >= or >>).
        if c == ">" and (i == 0 or src[i - 1] not in "=-") and nxt not in ("=", ">"):
            j = i + 1
            while j < n and src[j] not in "<{}'\"`;=":
                j += 1
            if j > i + 1:
                regions.append(Region(src[i + 1:j], list(range(i + 1, j)), "jsx"))
            i = j
            continue
        i += 1
    chars = list(src)
    for a, b in blanks:
        for k in range(a, b):
            if chars[k] != "\n":
                chars[k] = " "
    return regions, "".join(chars)


JSON_STR_RX = re.compile(r'"(?:[^"\\\n]|\\.)*"')
JSON_KEY_RX = re.compile(r"\s*:")


def scan_json(src):
    regions = []
    for m in JSON_STR_RX.finditer(src):
        if JSON_KEY_RX.match(src, m.end()):
            continue  # object key, not copy
        text, pos = _unescape(src, [(m.start() + 1, m.end() - 1)])
        regions.append(Region(text, pos, "string"))
    return regions


class _Lines:
    def __init__(self, src):
        self.starts = [0] + [m.end() for m in re.finditer("\n", src)]

    def locate(self, off):
        ln = bisect.bisect_right(self.starts, off)
        return ln, off - self.starts[ln - 1] + 1


ALLOW_RX = re.compile(r"lint-fa:\s*allow\s+([\w-]+(?:\s*,\s*[\w-]+)*)")


def _allowed_lines(src):
    """Map line number -> rule ids allowed on that line by a directive on the line above."""
    allow = {}
    for ln, line in enumerate(src.split("\n"), 1):
        m = ALLOW_RX.search(line)
        if m:
            ids = {x.strip() for x in m.group(1).split(",") if x.strip()}
            allow.setdefault(ln + 1, set()).update(ids)
    return allow


def lint_source(path, src, kind):
    """kind is 'code', 'json' or 'text'. Returns findings sorted by position."""
    if kind == "code":
        regions, code = scan_js(src)
    elif kind == "json":
        regions, code = scan_json(src), None
    else:
        regions, code = [Region(src, list(range(len(src))), "text")], None
    line_of = _Lines(src)
    found = []

    def add(off, rule, sev, msg):
        ln, col = line_of.locate(off)
        found.append(Finding(path, ln, col, sev, rule, msg))

    for reg in regions:
        if FA_LETTER_RX.search(reg.text):
            _check_copy(reg, add)
    if code is not None:
        _check_code(code, regions, add)
    allow = _allowed_lines(src)
    kept = [f for f in found if f.rule not in allow.get(f.line, ())]
    kept.sort(key=lambda f: (f.line, f.col, f.rule))
    return kept


def kind_for(path):
    low = path.lower()
    if low.endswith((".tsx", ".ts", ".jsx", ".js")):
        return "code"
    if low.endswith(".json"):
        return "json"
    return "text"


def lint_file(path):
    with open(path, encoding="utf-8-sig") as fh:
        src = fh.read()
    return lint_source(path, src, kind_for(path))


SCAN_EXT = (".tsx", ".ts", ".jsx", ".js", ".json", ".md", ".txt")
SKIP_DIRS = {"node_modules", "out", "dist", ".git"}


def iter_files(paths):
    for p in paths:
        if os.path.isdir(p):
            for root, dirs, files in os.walk(p):
                dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
                for f in sorted(files):
                    if f.lower().endswith(SCAN_EXT):
                        yield os.path.join(root, f)
        elif os.path.isfile(p):
            yield p


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, OSError):
        pass
    ap = argparse.ArgumentParser(description="Lint Persian copy and motion code.")
    ap.add_argument("--json", action="store_true", help="print findings as a JSON list")
    ap.add_argument("paths", nargs="+", metavar="PATH")
    args = ap.parse_args(argv)

    missing = [p for p in args.paths if not os.path.exists(p)]
    for p in missing:
        print(f"lint_fa: no such file or directory: {p}", file=sys.stderr)

    findings = []
    for path in iter_files(args.paths):
        try:
            findings += lint_file(path)
        except (UnicodeDecodeError, OSError) as exc:
            print(f"lint_fa: skipped {path}: {exc}", file=sys.stderr)

    if args.json:
        print(json.dumps([f.as_dict() for f in findings], ensure_ascii=False, indent=2))
    else:
        for f in findings:
            print(f"{f.path}:{f.line}:{f.col}  {f.severity}  {f.rule}  {f.message}")
        if findings:
            errors = sum(f.severity == ERROR for f in findings)
            print(f"\n{len(findings)} finding(s): {errors} error(s), {len(findings) - errors} warning(s)")
        else:
            print("clean")

    if missing:
        return 2
    return 1 if any(f.severity == ERROR for f in findings) else 0


if __name__ == "__main__":
    sys.exit(main())
