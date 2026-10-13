# P3 progress — uni-admissions teaser (narrow fix round)

PLAN
1. [x] Hook reveal: per-word RTL reveal (fade + 0.18em rise, flex wrap, gap; no clip, no per-char split, joins intact).
2. [x] Support pencil: touch-at-contact then step-aside keys; clears ACCENT tick by local 60 = global 480; payoff frames unchanged.
3. [x] QR: no module present -> qrcode-generator installed --no-save in workbench; local script in gitignored uni-local reads copy-map B8 -> qr.json (21x21, M); QrPlate SVG navy-on-cream, quiet zone 4 modules, 227px @1080 (>=224, scaled per ratio); pops local 72 = global 672, before final hold 705, readable to 719 (47 f = 1.57 s >= 1.5 s).
4. [x] Arch: PNG copied to gitignored uni-local (only source was media/briefs-local imagegen-test); rendered as SVG <image> inside Frame svg (HTML img is wrong namespace there); radial-gradient feather mask dissolves edge specks; saturate 0.88 to sit in palette. A/B at f560: clearly better than thin procedural swoosh -> kept (USE_ARCH).
5. [ ] Acceptance: stills + tsc + full silent render + ffprobe.

LOG
- qr generator script kept at gitignored uni-local/gen-qr.mjs (URL from token, nothing hardcoded).
- Remotion <Img> decode() fails in this pipeline; fetch+blob+dataURL preload used instead.
- A/B stills: _stills-P3/ab-arch4-560.png (kept) vs ab-swoosh-560.png (rejected).
