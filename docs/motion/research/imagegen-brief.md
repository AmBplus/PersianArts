# Image-generation tool availability (decision brief)

Read-only check, 2026-10-13. No installs, no git, no secrets printed.

**Answer: yes, one path is available.** The built-in Codex `imagegen` skill (`image_gen` tool, gpt-image-2) ships with Codex CLI 0.161.0 and is bundled in `.codex`, `.codex-a` and `.codex-b` (`skills/.system/imagegen`). It makes raster output only. No image MCP server is configured.

**Evidence**
- `codex features list`: `image_generation` = stable, true. `view_image` = stable.
- `codex mcp list`: no image servers. Default home has only `node_repl` and a disabled `cua_repl`. `.codex-a` and `.codex-b` have no MCP servers.
- `C:/Users/Amir/.codex/generated_images/` holds 10 dirs of `exec-*.png`, so `codex exec` has produced images before.
- Env var names: no OPENAI_API_KEY in the environment. `.codex/auth.json` contains an API-key field (not printed); the built-in path needs no key anyway.
- Claude side (`~/.claude.json`, settings, plugins): no image or dalle MCP. Only plugin MCPs (anime-story-video, codesign, etc.), none image-generation-specific for raster.
- CLIs: no magick, potrace, vtracer, inkscape, rsvg-convert, cwebp. Present: ffmpeg, Python 3.14 with Pillow 12.3.0, node, npm. Global npm has only `@openai/codex`.
- quota-hub (`D:/P/tools/quota-hub`): zero image references in bin/lib/config/service. No image option for codex workers.
- Web (WebSearch): the built-in skill is driven by naming `$imagegen` in a prompt, works headless with `codex exec`, and writes to `$CODEX_HOME/generated_images/`. No `--size` or `--quality` flags on the built-in path. Sources: https://codex.danielvaughan.com/2026/04/27/codex-cli-image-generation-gpt-image-2-visual-development-workflows/ ; https://github.com/stephenlzc/codex-image-gen ; https://github.com/jdmnk/codex-imagegen-cli

**How to call (unverified on a quota account, run one test first)**
`CODEX_HOME=C:/Users/Amir/.codex-a codex exec -s workspace-write --skip-git-repo-check -C <workdir> "Use $imagegen (built-in image_gen, transparent background if needed) to create: <prompt>. Then copy the PNG to <absolute out path>."`
Then verify with Pillow: size, mode, alpha. Resize with Pillow to exact sizes.

**Limitations**
- Built-in output is PNG-like raster, size fixed by the model; exact sizes need Pillow resize (may distort, so generate near the target aspect).
- Transparency: ask for it in the prompt, then check the alpha channel. Not guaranteed.
- No SVG output. The fallback CLI (`scripts/image_gen.py`) needs OPENAI_API_KEY and is not for workers.
- Quota: each generation spends quota on the account used.

**Recommendation**
- Raster scene assets: built-in `codex exec` + `$imagegen`, then Pillow resize/convert to WebP/PNG at exact sizes.
- Transparent PNG cutouts: built-in with transparent-background request, then verify alpha with Pillow; re-order if the background is not clean.
- SVG: hand-write it (preferred for icons/shapes), or vectorize a raster with vtracer or potrace. Neither is installed; installing needs owner approval (not done here).
- Next step for the lead: one small test order on `.codex-a` (or `.codex-b`) to confirm `$imagegen` writes a file to a given path.
