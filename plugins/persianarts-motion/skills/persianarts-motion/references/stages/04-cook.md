# Stage 4 — Cook (build)

1. Build scene by scene, in film order. For each scene: set slots/knobs in `film.json`, or write a project
   ingredient in `scenes/` (contract in `../craft/cooking.md`).
2. After each scene: `python3 $SKILL/tools/lint_fa.py film.json scenes/` and `pa stills --scene <id>` at its key beats (entry,
   hit, hold). Look at every still at full size: Persian joins and dots, hierarchy (one hero), theme fidelity,
   nothing overflowing (`pa fit-check`).
3. Watch the scene in motion (`pa render --scene <id> --draft`) when it has a camera move, a transition or a
   per-unit text effect — stills cannot show a broken reveal direction.
4. Never hard-code colours, fonts or frame numbers; never `Math.random()`; never the composition duration for
   scene timing.
5. Keep `decisions.jsonl` current when you deviate from the approved storyboard (and why).

Exit criteria: every scene built, `pa validate` clean, a contact sheet of the whole film (`pa stills --contact`).
