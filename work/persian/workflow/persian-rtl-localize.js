export const meta = {
  name: 'persian-rtl-localize',
  description: 'Per-card deep Persian/RTL rewrite of shotcraft demos: author -> independent review -> fix, with real renders',
  phases: [
    { title: 'Author', detail: 'analyze each demo, rewrite text + RTL layout/motion + font, render and self-check' },
    { title: 'Review', detail: 'independent adversarial review of stills/video and code' },
    { title: 'Fix', detail: 'apply reviewer findings, re-render' },
  ],
}

// Run from the repo with:  Workflow({scriptPath: '<repo>/work/persian/workflow/persian-rtl-localize.js', args: {slugs: [...], pool: 6, review: true, root: '<repo absolute path>'}})
// Pick the slugs with status todo / needs-fix / localized from work/persian/progress.json.
const ROOT = args.root || 'D:\\P\\project\\persianArts'
const SLUGS = args.slugs
const POOL = args.pool || 6
const REVIEW = args.review !== false

const COMMON = `
PROJECT CONTEXT
- Repo root: ${ROOT} (Windows; use the PowerShell or Bash tool; Bash is Git-Bash). Run all commands from the repo root.
- We are producing a FAITHFUL Persian (RTL) localization of the upstream "video-shotcraft" Remotion demos. The motion design, timing, easing, durations and random seeds must stay exactly as designed; what changes is: on-screen text (Persian), writing direction, layout/motion direction where it carries reading-direction meaning, and the font. Quality and craft are what matter here: never apply a blanket formula, analyze every element of every demo individually.
- FIRST read docs/PERSIAN-LOCALIZATION-LESSONS.md: the problems earlier agents already hit converting these demos to Persian and the fixes that worked (letter-spacing, kashida for tracking effects, fonts silently falling back unless loaded, single-weight fonts, composition balance after mirroring, dot-matrix digits, raster text, short registry durations -> use the harness --duration flag, idiomatic copy, keeping timing beats). Apply them; do not rediscover them. Report any NEW lesson in the "lessons" field of your result.
- The working copy may already contain partial edits from an interrupted earlier attempt: diff every file against the original first, then finish/repair it.
- Our working copy of the demos: work/persian/src/demos/<category>/<slug>/*.tsx (editable). The untouched originals are in work/upstream/src/demos/... (read-only reference).
- Shared Persian kit (READ-ONLY, other agents depend on it, never edit it): work/persian/src/demos/_fa/index.tsx. Read it first: FaRoot (sets direction:rtl + font for a whole demo and loads the font), faText(px,extra), fs(px), FA_LH, typeOn(text,p) (typewriter = prefix slice), joinedGroups(text) / words(text) (the ONLY safe units for per-unit animation), faDigits, revealFromStart(p), dir(dx), FONT_FILES (the 25 available font families). Fonts live in work/persian/src/workbench/public/fonts and are loaded through FaRoot/FaFonts. If you need a helper the kit lacks, write it in a NEW file inside your own card directory and import it from there.
- A finished example of the expected standard: work/persian/src/demos/interaction/ai-stream-response/StreamResponse.tsx (read its header comment: it lists every RTL decision and why). Compare with the original in work/upstream/src/demos/interaction/ai-stream-response/StreamResponse.tsx to see what a careful localization changes.
- Get the card facts with:  node work/persian/card-info.mjs --slug <slug>   (files, comps with frames/fps/size, source prompt path, library category/tags, style descriptions, out dir).
- Read the card's SOURCE PROMPT (sourcePrompt path in the card-info output, Chinese): it states the design intent, the parameter table and the known pitfalls. The motion intent described there must survive localization.
- Render/inspect harness:  node work/persian/render-card.mjs --slug <slug> [--frames 12,40,90] [--video]
  It bundles only this card, renders Persian stills (<Stem>.fa.f<F>.png) and the matching frames of the ORIGINAL render (<Stem>.orig.f<F>.png) into work/persian/out/<slug>/ and prints JSON (errors included). Default frames are 5 evenly spaced beats; pick explicit --frames at the real beats of each animation (entrances, hits, holds, the final resting frame) whenever the defaults miss something. A run takes roughly 15-60 s. Use the Read tool on the PNG files to LOOK at them (you can view images): always view fa and orig of the same frame to compare. --video renders the full Persian MP4 for every comp (do it once at the end, it proves the whole timeline renders).
- Never edit anything outside your card's directory (work/persian/src/demos/<category>/<slug>/) and your out dir (work/persian/out/<slug>/). Never run git. Do not touch shared assets/lib (copy a lib component into your card dir if it needs Persian changes). Keep the exported component names and every exported *_DURATION / *_DUR constant (and the numeric value) unchanged. Do not change fps, size, seeds, easing curves or frame timings unless RTL strictly requires it (then document it).

THE ANALYSIS CHECKLIST (apply to EVERY demo file of the card, element by element)
1. TEXT: find every on-screen string (JSX text, string arrays, template literals, SVG/canvas text, text baked into images). Translate into natural, idiomatic, modern Persian suitable for the demo's world (product UI wording, headline voice, etc.), not word-for-word. Keep brand or technical tokens that Persian UIs really keep (API, CPU, URL, code syntax), digits become Persian digits (faDigits) except inside code/URLs, use Persian punctuation (، ؛ ؟ «»). Mixed bidi: isolate Latin runs (bdi element or unicodeBidi:isolate) so punctuation does not jump. The words must fit the same boxes/timing: re-measure.
2. SHAPING RULES: never letterSpacing (set 0), never textTransform uppercase, never split Persian text into single code points for per-unit motion (letters join!). Use joinedGroups/words, or typeOn prefix slicing for typewriter effects, or whole-line effects. Remove tracking/uppercase from labels. Check line-height (use FA_LH ~1.5 for multi-line, Persian ascenders/descenders and dots are taller), font size (fs() scales 1.1x because Persian x-height is smaller), wrapping and overflow, clipped text, text inside fixed-size boxes.
3. DIRECTION SEMANTICS - decide explicitly for each item, mirror only when the meaning is reading-direction, and write the reason down:
   - MIRROR when it follows reading/layout order: sidebars and rails (left sidebar goes right), toolbars/headers/nav order, list bullets/icons/checkmarks sides, text anchoring and text-align, flex row order, columns and grids reading order, stagger/cascade order (first item = right-most), wipe/reveal/sweep/scan directions, progress bars and sliders filling, timelines and carousels advancing, page-turn direction and book spine side, slide-in/slide-out origin, chevrons/arrows meaning next/back, cursor approach paths, kanban/step order, "before/after" panels order, gradients and shadows that imply a light/reading direction, asymmetric border radii, transform-origin, clip-path inset sides, rotate/skew/rotateY angle signs, margin/padding/left/right/translateX values.
   - KEEP when it is physical or universal: gravity/up-down, camera orbits and 3D scene physics, depth, brand logos and product marks, numerals' order inside a number, code blocks and terminal content (LTR islands: direction:ltr), music/waveform time direction, rotation direction of clocks/spinners, light source physics, symmetrical compositions.
   - Charts/data: decide per chart (category axes and series order mirror for Persian readers; numeric magnitude axes and value labels keep their numeric logic; legends/labels RTL).
   - Absolute-positioned compositions: recompute positions as (W - x - w) where the composition's left/right balance is meaningful; prefer direction:rtl + logical properties (marginInlineStart, insetInlineStart, paddingInlineEnd, borderStartStartRadius ...) where flex/grid layout is used. Re-balance visual weight (an element pinned left of a hero that now sits right must still look intentional).
4. FONT: choose ONE (at most two) of the 25 families in FONT_FILES that matches the mood of this specific demo, and say why. Guide: neutral product UI -> Vazirmatn / Estedad / Sahel; bold poster/impact/slam headlines -> Lalezar / Baloo Bhaijaan 2; elegant editorial/serif voice -> Markazi Text / Amiri / Gandom; code/terminal/monospace chrome -> Vazir Code; calligraphic/ink/poetic -> Aref Ruqaa / Katibeh / Noto Nastaliq Urdu (display sizes only, very tall line-height); geometric/tech/futuristic -> Noto Kufi Arabic / Reem Kufi; friendly/casual -> Shabnam / Samim / Tanha / Lemonada; humanist handwriting-like -> Parastoo / Nahid. Check weights exist (variable fonts take 100-900, the static ones have a single weight: do not ask for fake bold; emphasize with size/colour/another family instead) and glyph coverage (Persian digits, punctuation, ZWNJ).
5. IMAGES AND TEXTURES: look at every raster/video asset in the original frames. If an image contains baked-in Latin/Chinese UI text that cannot be translated, blur/replace/regenerate it so no foreign text stays legible, or mirror the image only when it has no text and its composition carries direction. Document what you did.
6. MOTION FIDELITY: the animation must still read like the original (same beats, same energy). Mirroring must keep motion consistent (an element that entered from the left and exits right now enters from the right and exits left). Verify by viewing the same frames of original and Persian renders.
7. LEFTOVERS: after your edits, the Persian render must show no unintended Chinese/English text. Grep your files for left/right/translateX/marginLeft/paddingLeft/textAlign/letterSpacing/uppercase/clipPath/inset/gradient angles/transformOrigin/borderRadius/rotate and consciously resolve every hit.

8. PERSIAN CRAFT (the details that ruin the work when missed; check each explicitly):
   - Letter-by-letter vs word-by-word: if the original reveals per CHARACTER (typing, write-on, per-letter fade/drop), the Persian version must also progress per character - via typeOn() prefix slicing (correct contextual shaping at every frame) or per joined group - never silently degrade to per-word steps. Conversely never animate single code points as separate boxes (breaks joining). View several consecutive mid-reveal frames to prove each step adds one letter with correct shaping.
   - Pen / handwriting / ink / write-on effects: the pen must travel RIGHT-TO-LEFT along the real glyph strokes of the actual font (derive the path from the rendered text outline or a stroke mask of the real string, revealed right-to-left), body strokes first and the dots (nuqta), kashida and small marks after, like real Persian handwriting. No pen jumping randomly, moving left-to-right, or drifting off the letters. The pen tip must sit on the stroke being drawn in every frame you inspect.
   - Font elegance: in elegant, calligraphic, ink, poetic or luxury contexts the Persian face must be genuinely beautiful and fitting (Aref Ruqaa, Noto Nastaliq Urdu, Amiri, Markazi Text, Katibeh ...) with correct line-height; verify the chosen font actually rendered (not a fallback) and glyphs do not look odd, cramped or broken at that size. A strange-looking face is a defect even if the text is "correct".
   - Persian typography: ZWNJ (نیم‌فاصله) where words need it (می‌شود، نمایه‌سازی، یادداشت‌ها), no Arabic ي/ك (use ی/ک), Persian punctuation and digits, no orphaned single letters at line ends.
PROCESS: read the kit and the example -> read the card info and the source prompt -> read each original demo file fully -> view the original frames at the real beats -> write the analysis as a header comment at the top of each edited file (what was translated, every direction decision with a reason, font choice with reason, raster handling) -> edit -> render stills -> view fa vs orig -> iterate until every frame is clean (up to ~8 iterations) -> final render with --video -> write work/persian/out/<slug>/report.json containing your FULL structured result (font + reason, every rtlDecisions entry per comp with what/action/why, raster handling, concerns): it is the permanent record of this localization, a stub is not acceptable. Also view frames of EVERY comp of the card (not only the first), and when a Persian string is shorter/longer than the original and shifts a timing beat (typing speed, stagger count), keep the original beats and say so in the report.
`

const AUTHOR_SCHEMA = {
  type: 'object',
  properties: {
    slug: { type: 'string' },
    status: { type: 'string', enum: ['done', 'partial', 'blocked'] },
    font: { type: 'object', properties: { family: { type: 'string' }, reason: { type: 'string' } }, required: ['family', 'reason'] },
    comps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          video: { type: 'string' },
          translatedSummary: { type: 'string' },
          rtlDecisions: {
            type: 'array',
            items: {
              type: 'object',
              properties: { what: { type: 'string' }, action: { type: 'string', enum: ['mirrored', 'kept', 'adapted'] }, why: { type: 'string' } },
              required: ['what', 'action', 'why'],
            },
          },
        },
        required: ['id', 'rtlDecisions'],
      },
    },
    rasterTextHandling: { type: 'string' },
    concerns: { type: 'array', items: { type: 'string' } },
    lessons: { type: 'array', items: { type: 'string' }, description: 'NEW reusable lessons (symptom -> cause -> fix) not already in docs/PERSIAN-LOCALIZATION-LESSONS.md' },
    iterations: { type: 'number' },
  },
  required: ['slug', 'status', 'font', 'comps'],
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    slug: { type: 'string' },
    verdict: { type: 'string', enum: ['approve', 'fix'] },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          where: { type: 'string' },
          problem: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
        required: ['severity', 'where', 'problem', 'suggestedFix'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['slug', 'verdict', 'issues'],
}

const authorPrompt = (slug) => `${COMMON}
YOUR TASK: localize the card "${slug}" (every demo component of that card) into Persian/RTL with full craft, following the checklist and process above. Return the structured result (it is also saved by you in work/persian/out/${slug}/report.json).`

const reviewPrompt = (slug, author) => `${COMMON}
YOU ARE THE INDEPENDENT, ADVERSARIAL REVIEWER for card "${slug}". Another agent already localized it (summary of their report: ${JSON.stringify(author).slice(0, 6000)}). Do not trust it. Your job is to find what is wrong or merely mediocre.
Steps: read the card info, the source prompt, the ORIGINAL demo files and the Persian working copy; re-render with the harness at the real beat frames (choose them yourself from the code's timing constants, not only the defaults; include the first frames, mid-motion frames, hits and the final resting frame of every comp) and VIEW fa vs orig frames. Check hard:
 a) broken Persian shaping (separated/unjoined letters, letter-spacing, reversed word order, punctuation or Latin tokens in the wrong place, digits mixed Latin/Persian wrongly);
 b) text overflow, clipping, overlap, wrong wrapping, unbalanced composition after mirroring, elements that fell off-canvas;
 c) direction semantics: anything that should have mirrored but did not (sidebars, reveals/wipes/sweeps, stagger order, carousels, page turns, progress, arrows, gradients/shadows, asymmetric radii, rotate/skew signs, transform origins) or was mirrored although it should not (3D physics, logos, code, numerals, clocks); motion inconsistent (enters one side exits the same side...);
 d) leftover Chinese/English text or baked-in image text; 
 e) font fit for the mood, wrong weight (fake bold on a single-weight font), missing glyph boxes, poor line-height;
 f) motion fidelity: timings/durations/exports unchanged vs the original files (diff them), the animation still reads like the source prompt describes;
 h) Persian craft (checklist item 8): letter-by-letter reveals stay letter-by-letter with correct shaping at every step (inspect consecutive frames), pen/handwriting paths move right-to-left on the real strokes with dots after, the font is genuinely fitting/elegant and actually loaded, ZWNJ and ی/ک correct;
 g) code hygiene: grep the Persian files for left/right/translateX/marginLeft/paddingLeft/textAlign/letterSpacing/uppercase/clipPath/gradient angles/transformOrigin/rotate and judge every hit; the header comment must truthfully list the decisions.
Do NOT edit any demo file. You may only write work/persian/out/${slug}/review.json. Return verdict "approve" only if you would ship this as a polished Persian version; otherwise "fix" with concrete, located issues (file, line or frame, what is wrong, how to fix).`

const fixPrompt = (slug, review) => `${COMMON}
YOU ARE THE FIXER for card "${slug}". An independent reviewer found problems. Fix every blocker and major issue and the minor ones that are cheap, with the same craft standard (re-analyze the affected elements; do not patch blindly), re-render with the harness, VIEW fa vs orig again, then run --video once more. Update the header comments so they stay truthful, and rewrite work/persian/out/${slug}/report.json. Reviewer findings: ${JSON.stringify(review).slice(0, 8000)}`

const pool = async (items, n, fn) => {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) {
      const k = next++
      try { out[k] = await fn(items[k], k) } catch (e) { out[k] = { slug: items[k], error: String(e) } }
    }
  }))
  return out
}

const results = await pool(SLUGS, POOL, async (slug) => {
  log('start ' + slug)
  const author = await agent(authorPrompt(slug), { label: 'author:' + slug, phase: 'Author', schema: AUTHOR_SCHEMA, model: 'sonnet', effort: 'medium' })
  if (!author) return { slug, status: 'author-failed' }
  if (!REVIEW) return { slug, author }
  const review = await agent(reviewPrompt(slug, author), { label: 'review:' + slug, phase: 'Review', schema: REVIEW_SCHEMA, model: 'sonnet', effort: 'medium' })
  if (!review) return { slug, author, status: 'review-failed' }
  if (review.verdict === 'approve' && !review.issues.some((i) => i.severity !== 'minor')) {
    log(slug + ': approved')
    return { slug, author, review, final: 'approved' }
  }
  const fixed = await agent(fixPrompt(slug, review), { label: 'fix:' + slug, phase: 'Fix', schema: AUTHOR_SCHEMA, model: 'sonnet', effort: 'medium' })
  log(slug + ': fixed after ' + review.issues.length + ' issues')
  return { slug, author, review, fixed, final: fixed ? 'fixed' : 'fix-failed' }
})

return results.map((r) => ({
  slug: r.slug,
  final: r.final || r.status || (r.error ? 'error: ' + r.error : 'unknown'),
  font: (r.fixed || r.author)?.font?.family,
  issues: r.review ? r.review.issues.map((i) => i.severity + ': ' + i.problem) : [],
  concerns: (r.fixed || r.author)?.concerns || [],
  lessons: [ ...((r.author && r.author.lessons) || []), ...((r.fixed && r.fixed.lessons) || []) ],
}))
