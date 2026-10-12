# Decision brief: shaongitbd/doory for PersianArts Motion

Question: is https://github.com/shaongitbd/doory useful for our design work or our rendering speed work?
Method: web research only (GitHub pages, raw package.json and README, search). No installs, clones or downloads. Items marked UNVERIFIED were not confirmed in source or by a test.

## 1. What Doory is

- A browser-based design editor, described as a free, self-hostable alternative to Canva. Source: https://github.com/shaongitbd/doory
- Frontend: React 19, TypeScript, Vite, Fabric.js 7 (canvas), Yjs (real-time co-editing), Zustand. Backend: Django 5, DRF, Channels, PostgreSQL. Source: https://raw.githubusercontent.com/shaongitbd/doory/main/frontend/package.json and https://github.com/shaongitbd/doory (backend/requirements.txt linked from the README).
- Export: PNG, JPG, SVG, PDF, MP4, WebM, animated GIF, said to be made in the browser. Server-side PDF needs headless Chromium (INSTALL_CHROMIUM setting). Source: https://raw.githubusercontent.com/shaongitbd/doory/main/README.md
- Media encoding libraries: mp4-muxer, webm-muxer, gifenc, jspdf. No ffmpeg dependency. Source: frontend/package.json (above). How frames are produced and timed for video: UNVERIFIED (the DeepWiki page returned HTTP 429 and could not be read).
- Driven by: the web UI, a REST API (/api), WebSockets (/ws), Docker Compose, Django management commands (seed_templates, sync_fonts), and Make targets. Source: README (above).
- Design features listed: text (curved text, font pairings, uploaded fonts), shapes, icons, stickers, QR codes, layers, snapping, multi-page designs, 27 enter/exit animations, 12 emphasis effects, 16 page transitions, audio, present mode, brand kits, print PDF with bleed and crop marks, 10 starter templates. Source: README and DeepWiki summary (https://deepwiki.com/shaongitbd/doory, via search).
- License: "Attribution Assurance License", which requires crediting the author in the running app. The license text was not read in this run. LICENSE and NOTICE: https://github.com/shaongitbd/doory/blob/main/LICENSE . Treat as non-standard until a lawyer or the LICENSE text confirms; it is not an OSI license.
- Maturity: 793 stars, 32 forks, 2 watchers, 1 open issue (#17, a bug in account confirmation email, opened 2026-10-12), no published releases. Source: https://github.com/shaongitbd/doory and https://github.com/shaongitbd/doory/issues
- Activity: only 6 commits visible, all dated 2026-10-10, mostly README and starter templates. Source: https://github.com/shaongitbd/doory/commits/main . Total commit history and age: UNVERIFIED.

## 2. Rendering (our bottleneck)

- Doory is an interactive editor. It is not a frame-deterministic video renderer for coded scenes. Nothing in the README or package.json describes a headless frame-by-frame render pipeline, a CLI render command, or a render-farm mode.
- Speed: the README makes no speed, GPU or benchmark claims. The only performance item is a Playwright script named e2e:perf in package.json, which tests editor behaviour, not export throughput. Source: frontend/package.json scripts list.
- GPU: onnxruntime-web is listed (used for background removal in the browser). No GPU video path is claimed. Source: frontend/package.json.
- Determinism and frame accuracy for MP4: UNVERIFIED. The app records/encodes in the browser, so it inherits Chrome's timing, which is the same class of cost we already measure as the bottleneck.
- Audio muxing: the editor supports audio elements; whether MP4 export includes an audio track: UNVERIFIED.
- Windows: the stack is Docker and Python plus a browser; no Windows-specific rendering support is claimed. Platform support: UNVERIFIED.
- Conclusion: no evidence Doory renders faster than Remotion/Chrome. It would be an equal or slower browser path with an extra backend. Recommendation for rendering: do not use it.

## 3. Design features

- Relevant to us: a visual editor for layout, brand kits, layers, snapping, SVG export and multi-page designs. Useful as a reference for a storyboard or layout UI.
- Not relevant to us: its templates and animation presets are generic Canva-style effects (27 entrance and 12 emphasis effects), not our Persian motion grammar. Our scenes are code (spring, interpolate, SVG), which Doory does not expose.
- SVG asset handling: export to SVG is listed. Import and round-trip fidelity for our SVG scenes: UNVERIFIED.

## 4. Persian and Arabic support (hard requirement)

- The README does not mention Arabic, Persian, Farsi, RTL, right-to-left, Unicode or scripts. Source: README (above).
- Font handling: five @fontsource-variable packages in the dependencies (Caveat, Fraunces, Inter, Nunito, Plus Jakarta Sans). None is a Persian or Arabic face. Source: frontend/package.json.
- The font catalogue is pulled by `manage.py sync_fonts --popular 100`. Whether it includes Arabic-script faces: UNVERIFIED.
- Text shaping: no HarfBuzz, opentype.js or other shaping library is listed in package.json. Text is drawn by Fabric.js, which uses the browser canvas text engine. So Arabic joining and bidi come from the browser, not from a controlled shaper. Fabric's RTL behaviour has known old issues: https://github.com/fabricjs/fabric.js/issues/5877 (RTL letters in wrong place, old version) and https://github.com/fabricjs/fabric.js/issues/2766 (Arabic textbox behaviour, old version). Current state in Fabric 7: UNVERIFIED.
- No issue in the Doory tracker mentions Arabic or RTL (only one open issue, unrelated). Source: https://github.com/shaongitbd/doory/issues
- Verdict: no evidence of Persian or Arabic support. It fails the hard requirement as far as the public record shows.

## 5. Reuse or port options

- Reuse the whole editor: no. It is a self-hosted web product with Django, Postgres and Docker, and no Persian support.
- Reuse the frame renderer for SVG scenes: no. It has no frame-accurate render API, and our scenes depend on Remotion timing.
- Reuse design components (layers, snapping, brand-kit UI): possible, but only as code reading. Effort: several days to extract, plus a license check (attribution in the running app). Risk: high, low value.
- Port our scenes: not needed. Our scenes are already code and render through Remotion.

## 6. Recommendation

SKIP for both design and rendering. Keep it as a reference for editor UX only.

Smallest pilot, if the owner still wants evidence (about 1 hour, needs owner approval because it runs an installed app):
1. Run the public demo or a local Docker build (only after owner approval; no install by workers without the owner's OK).
2. Enter the Persian line from one of our simple scenes (for example the title card text) into a text object and export PNG and SVG.
3. Acceptance: (a) joined Arabic-script forms visible at 100% zoom, (b) correct RTL line order, (c) SVG export opens in a browser with the same glyph shapes. Pass = all three. Fail on any one means skip.
4. Rendering timing is not part of the pilot, because Doory has no comparable video render path. Do not benchmark it against Remotion.

Unknowns to close first: LICENSE text, Persian font list from sync_fonts, Fabric 7 RTL behaviour, and whether the MP4 export is frame-accurate.

## Sources

- https://github.com/shaongitbd/doory
- https://raw.githubusercontent.com/shaongitbd/doory/main/README.md
- https://raw.githubusercontent.com/shaongitbd/doory/main/frontend/package.json
- https://github.com/shaongitbd/doory/commits/main
- https://github.com/shaongitbd/doory/issues
- https://github.com/shaongitbd/doory/blob/main/LICENSE
- https://deepwiki.com/shaongitbd/doory (summary only; a later fetch returned 429)
- https://github.com/fabricjs/fabric.js/issues/5877
- https://github.com/fabricjs/fabric.js/issues/2766
