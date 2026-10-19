# TODO (living; generated from todo.jsonl by `pa todo`; edit through the tool)
After every completed task the lead orders `pa todo done <id>` plus a checkpoint commit.

## Now
- [ ] T015 Checkpoint policy: commit after every task (pa todo done + checkpoint) (lead)

## Next
- [ ] T013 Carry-over: 4 simultaneous-cue defect in old finals (rebuild with build_sound) (studio, est 20 min)
- [ ] T023 Image FX phase 2: geometry effects (crumple/shatter/particles via OGL/Three), only if a story needs it (studio, est 25 min)

### Agent-proposed (batch S08-S12 open items; no human present, queued for the next round)
- [ ] T026 Wire the two new detectors (overlay-hud, black-bands) into run-gates.mjs (agent-proposed, work/persian/tools/gates/run-gates.mjs, est 10 min)
- [ ] T027 Record the gate-suite revision in every gate --json run so v1->v2 deltas are attributable (agent-proposed, work/persian/tools/gates/run-gates.mjs, est 15 min)
- [ ] T028 capture.mjs: set keyframe interval <= 2 s (-g 60) so captures stop failing TV gop_le_2s (agent-proposed, work/persian/htmlfilm/capture.mjs, est 10 min)
- [ ] T029 capture.mjs --segment mode that re-encodes the joined file (never stream-copy) for >300 s films (agent-proposed, work/persian/htmlfilm/capture.mjs, est 30 min)
- [ ] T030 film-integrity.mjs --restill: regenerate stills from the final mp4 after the last render (agent-proposed, work/persian/tools/verify/film-integrity.mjs, est 20 min)
- [ ] T031 deliver.mjs: refuse a version folder with no VERSION.json (run --write-version first) (agent-proposed, work/persian/tools/deliver/deliver.mjs, est 10 min)
- [ ] T032 logo-colour.mjs: stop treating the default uni-local --logo-files as the film's own evidence (agent-proposed, work/persian/tools/gates/logo-colour.mjs, est 15 min)
- [ ] T033 dead-frames.mjs: require >= 3 checked scene windows instead of passing on one (agent-proposed, work/persian/tools/gates/dead-frames.mjs, est 15 min)
- [ ] T034 pa-selftest.mjs: parse each film inline <script> + orphan-token scan before any render (agent-proposed, work/persian/htmlfilm/lib/pa-selftest.mjs, est 20 min)
- [ ] T035 pa-layout.js: return W/H instead of clobbering, and assert scene count vs cut count (agent-proposed, work/persian/htmlfilm/lib/pa-layout.js, est 15 min)
- [ ] T036 One shared PA.ltr isolate helper + a bidi rule in SPEC.md (Persian digits must not mirror) (agent-proposed, work/persian/htmlfilm/lib/pa-motion.js, est 20 min)
- [ ] T037 Enforce the film.html header contract (GOAL, treatment, EVENTS, FIX LOG) before capture (agent-proposed, work/persian/htmlfilm/SPEC.md, est 15 min)

## Waiting for owner
- [ ] T006 git gc --prune of 860 MB local unreachable objects (owner approval pending) (owner, est 5 min)
- [ ] T007 media/dana decision (keep, move to vault or drop) (owner)
- [ ] T008 Remove http.sslverify false from the global .gitconfig (owner, est 2 min)
- [ ] T009 Pages URL still persiandoodle: decide the public name (owner)
- [ ] T010 Set the vault passphrase PA_VAULT_PASS, then run pa vault pack for client folders (owner, est 5 min) - docs/motion/PORTABILITY.md
- [ ] T011 Preact build step decision (owner)
- [ ] T012 Research-centre emblem asset: owner can send it (owner)

## Done today
- [x] T014 Cleanup duplicate decision ids D-20261013-01/-16 in DECISIONS.jsonl (lead, est 10 min, actual 3)
- [x] T024 Story build S05 (studio, est 25 min)
- [x] T025 Story build S02 (studio, est 25 min)
