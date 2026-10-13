# DECISION BRIEF: excalidraw-mcp for PersianArts Motion

**Subject:** https://github.com/excalidraw/excalidraw-mcp (v0.3.2, excalidraw org)
**Question:** Should our headless agent pipeline use it to draw storyboards, scene plans, and hand-drawn SVG assets?
**Date:** 2026-10-13

---

## 1. What it is, exactly

An **MCP Apps** server (the MCP extension that renders interactive HTML UIs inside chat) that streams an Excalidraw canvas while the agent draws into it element by element, with animated camera pans. Built by antonpk1, transferred to the excalidraw org. 5,515 stars, 520 forks, TypeScript, 61 open issues. MIT per README and package.json — **but no LICENSE file exists in the repo (issue #98 open) [verified: file tree]**.

**Tools (from src/server.ts, read in full):**
- `read_me` — dumps a large element-format cheat sheet: shapes, arrows, bindings, palette, camera rules.
- `create_view` — takes a JSON string of Excalidraw elements; streams them into the chat-side UI app with draw-on animation; returns **only a `checkpointId` string** to the model.
- `export_to_excalidraw` — **app-only** (`visibility: ["app"]`, not callable by the model): uploads encrypted JSON to json.excalidraw.com, returns a shareable excalidraw.com URL. Needs network; known to hang (issue #99).
- `save_checkpoint` / `read_checkpoint` — app-only widget state (local tmp-dir store on stdio; Upstash Redis on the Vercel deployment).

**What it does NOT do:** no `.excalidraw` file output, **no SVG or PNG export at all**, no writing files to disk at a chosen path or size. Issue #87 ("Add an agent-accessible image export tool (PNG/SVG)") and #90 (.excalidraw JSON export) are open — not built. The streaming viewport is hard-locked to 4:3 cameras (400x300 ... 1600x1200); our 9:16 / 1:1 / 4:5 / 16:9 frames are unsupported by design (affects only the in-chat view, but shows the design target).

**How it runs:** stdio (`node dist/index.js --stdio`) or streamable HTTP (`/mcp`, Express; Vercel deploy at mcp.excalidraw.com). The visual app requires an **MCP-Apps-capable host with a browser UI** (Claude Desktop, ChatGPT, VS Code) and loads the Excalidraw React bundle + fonts from esm.sh (network needed). Local build needs pnpm and a Bun setup script on postinstall (fragile).

**Maturity:** created 2026-02; **last commit 2026-03-24 (~7 months stale)**; one dominant author (antonpk1: 65 commits; dwelle, Excalidraw founder: 8). Young and effectively dormant.

## 2. Can our headless workers use it?

**Effectively no — and there is no payoff even if they could.** `create_view` renders into a chat UI widget; a headless GLM/Haiku/Codex worker receives only a checkpoint id, never pixels or files. There is no tool to export SVG/PNG to disk at chosen sizes. And the real asset — the element JSON — is authored *by the worker anyway*; the server merely streams it. A worker able to write that JSON can write it straight to a `.excalidraw` file and convert it itself, with no MCP server in the loop.

## 3. Concrete uses for us (bypassing the server)

- **Storyboards, shot-list diagrams, scene plans, timing sketches:** solid. The `read_me` cheat sheet is effectively a free *spec* for element JSON (bindings, labels, z-order, sizing). A worker can emit `.excalidraw` JSON that humans open in excalidraw.com for review, and we convert with `exportToSvg` from `@excalidraw/excalidraw` / `@excalidraw/utils` (a ~10-line Node script — feasibility unverified).
- **Hand-drawn SVG for the pencil film:** Excalidraw renders via **rough.js**, and SVG export preserves the rough stroke paths — a genuine fit for stroke-draw-on animation in Remotion (stroke-dasharray/dashoffset), for shapes and Latin text.
- **Architecture/pipeline diagrams** for docs: fits.

## 4. Risks

- **Persian/RTL text is the deal-breaker risk.** Excalidraw bidi/RTL rendering works (core issues #1687/#1722 fixed long ago), **but its hand-drawn font (Excalifont) has no Arabic-script glyphs**; Persian text falls back to a plain (non-hand-drawn) font. Open upstream items: #9984 "Add Persian/Arabic font", #9986 (Vazir), #8394, PR #11725 (Playpen Arabic handwriting), PR #11399 (Arabic auto-switch font). **None merged as of 2026-10.** The signature pencil look therefore cannot cover Persian text — a serious problem for the pencil/notebook film. [Exact fallback behavior unverified — confirm in pilot.]
- **Font embedding for export:** Excalidraw SVG export references CDN `@font-face`; Remotion needs locally bundled fonts. Licenses of Vazir / Playpen Arabic / Excalifont must be checked before embedding. [Unverified.]
- **Palette:** the server pushes a bright SaaS palette (#4a9eed, #f59e0b, ...). Irrelevant if we author JSON ourselves, but the default look is not our notebook palette.
- **MCP Apps availability:** our worker session types likely expose no MCP-Apps UI surface; the headline feature is dead weight there.
- **Token cost:** `read_me` injects ~15 KB per conversation; element JSON is verbose.
- **Dormancy + missing LICENSE file** raise adoption risk for anything built on top.

## 5. Alternatives we have or could use instead

- **rough.js directly (MIT):** the same engine under Excalidraw; we generate SVG ourselves, pick any font (e.g. a Persian handwriting font), and control draw-on timing precisely in Remotion. **Best path for pencil-style assets.**
- **Hand-written SVG** with our own pencil-texture filters: full palette and font control; workers already do this.
- **Codex imagegen + vtracer:** raster-to-SVG for painterly textures, not clean strokes.
- **Mermaid:** docs diagrams only; corporate look, not pencil.
- **tldraw:** also UI-first; same headless-export problem.

## 6. Recommendation: **SKIP the MCP server; PILOT the underlying format (half a day)**

The server solves a problem we do not have (a human watching a diagram stream in chat) and lacks the thing we need (file export, non-4:3 framing, Persian fonts). Adopting dormant, LICENSE-less chat infrastructure into our pipeline is not justified. However, the path *element JSON -> exportToSvg -> rough.js SVG* is worth one cheap probe, because storyboards viewable in excalidraw.com are genuinely useful for client review — and the cheat-sheet spec costs us nothing to reuse.

**Smallest pilot:** one storyboard frame of the pencil film authored by a worker as `.excalidraw` JSON (no MCP server): one 9:16 frame, 3 shot boxes + arrows, a Persian title (e.g. «قلم و کاغذ») plus one Latin label; convert via a small Node script using `exportToSvg`.
**Acceptance check:** (1) exported SVG opens in Remotion and Persian text renders with correct RTL shaping; (2) Persian glyphs either carry a hand-drawn look or we explicitly accept the plain fallback; (3) stroke paths animate cleanly with stroke-draw-on; (4) palette matches our notebook look. **Any failure on (1) or (3) -> drop Excalidraw entirely and default to direct rough.js generation**, which should be our baseline plan regardless.

---
*Verified against repo source and GitHub API on 2026-10-13 unless marked [unverified]. Items to confirm in the pilot: Persian font-fallback behavior, exportToSvg script feasibility, font licenses.*
