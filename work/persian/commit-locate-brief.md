# Commit locate brief (motion-skill commits)

Question: where do commits 19da66e, 7b33c18, 363ada8, f8bf69c live?

Remotes: `origin` = https://github.com/AmBplus/persiandoodle.git (fetch and push). `git fetch --all` succeeded (1 new ref). Stale ref namespace `ssh/main` exists but no `ssh` remote is configured.

Findings:
- All 4 hashes exist locally as commits. All 4 are reachable from `origin/main` (= 32e7991).
- None are reachable from local `main` (= fb13765). Local main is 0 ahead / 11 behind origin/main, so it is a strict ancestor: a fast-forward is possible.
- Remote check: `git ls-remote` of git@github.com:AmBplus/PersianArts.git HEAD succeeded (SSH), HEAD = 32e79918bcc089d30a49640606fb12a6166538b8. The HTTPS ls-remote of the same repo also succeeded with the same HEAD. That hash matches origin/main, so the persiandoodle URL and the PersianArts repo point to the same tip.
- `git log --all --grep=evals`: 19da66e is the only match.
- `docs/MOTION-SKILL-HANDOFF.md` history: d52b454, 3720c97, d2ad35d (all on origin/main).
- Other remote branches on origin (not checked for the target commits): feat/persian-shotcraft, feature/*-20261009, motion-library-typography, rebuild/source-faithful-20261010, redesign/unified-react, typography-library-tab.

Risk: working tree has uncommitted changes (deleted/modified media/dana/* files). A fast-forward is blocked if the 11 incoming commits touch those paths.

Minimal safe sequence (NOT run; for the lead to order):
1. Confirm the 11 incoming commits do not touch dirty paths: `git diff --stat main origin/main`.
2. Stash or leave the dirty media files alone (do not discard them).
3. On main: `git merge --ff-only origin/main` (fails safely if it would overwrite local changes).
4. Verify: `git merge-base --is-ancestor 19da66e main` and the same for 7b33c18, 363ada8, f8bf69c.

Decision needed from lead: none for locating. Note the ssh/https tip match, and that origin points at persiandoodle.git rather than PersianArts.
