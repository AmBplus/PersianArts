# START (any machine)

1. `git clone git@github.com:AmBplus/PersianArts.git && cd PersianArts` (SSH key = the only manual auth)
2. Windows: `pwsh -File install.ps1`   |   macOS/Linux: `bash install.sh`   (prerequisites, venvs, npm, browser, fonts, kit check, skill install, doctor; `-DryRun` / `-Check` first if you like)
3. Open Claude Code in this folder (or any project after `pa install-skill --user`) and run `/persian-arts <brief>`; step 0 runs `pa doctor --quiet` and repairs itself.
4. `pwsh -File work/persian/tools/pa.ps1 sync` pulls the latest and prints RESUME, the TODO top 10 and metrics. Open `output/LATEST` (or `deliver/` for our own films).
5. Client material: set `PA_VAULT_PASS`, then `pa vault unpack` (docs/motion/PORTABILITY.md).

Daily: `pa todo list|next|add|done`, `pa meter task ...` after every task, `pa metrics`, `pa doctor`, `pa assets-check`.
Optional keys only: `.env`, `work/persian/.freesound.env`, `work/persian/.jamendo.env` (created empty by the installer; fill your own values, never commit).
Manual by design: git SSH auth, optional API keys, the vault passphrase. Assets list: docs/motion/ASSETS-IN-GIT.md. Skill: rule 15.
