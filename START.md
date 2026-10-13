# START (any machine)

1. `git clone git@github.com:AmBplus/PersianArts.git && cd PersianArts`
2. `pwsh -File work/persian/tools/pa.ps1 bootstrap` (venvs, npm, Remotion browser, kit verify, doctor; `--dry-run` first if you like)
3. `pwsh -File work/persian/tools/pa.ps1 sync` (git pull --ff-only, doctor quick, RESUME head, TODO top 10, metrics, deliver list)
4. Open `output/LATEST` (or `deliver/` for our own films' finals).
5. Client material: set `PA_VAULT_PASS`, then `pa vault unpack` (see docs/motion/PORTABILITY.md).

Daily: `pa todo list|next|add|done`, `pa meter task ...` at the end of every task, `pa metrics`, `pa doctor`.
Optional keys: copy `.env.example` / `work/persian/.*.env.example` and fill your own values (never commit them).
Skill: /persian-arts (rule 13 GIT-FIRST and PORTABLE).
