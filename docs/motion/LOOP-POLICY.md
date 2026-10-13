# LOOP-POLICY: one round, then ship (owner policy 2026-10-13)

The process must never get stuck in a "quality below threshold" loop. At most ONE defined fix round per film; if the result is still poor, the output is DELIVERED with an honest score and the defect list. Never loop for a score.

## Score use
- Scores inform and are recorded (review-<n>.md, goal memory DECISIONS). They never block delivery.
- 85+ = SHIP (no notes). Below 85 after the single fix round = SHIP WITH NOTES (score + open defect list + fix list). Not a blocker, not a reason for a second round.
- Gates still report numbers; a not-run gate is stated in the notes, not hidden.

## Fix at the right place
Find where the error originates, then fix it there. Accidental = once in the artifact. Anything else = at the source, so it cannot recur.

| Class | Meaning | Fixed in |
|---|---|---|
| Accidental | one-off slip (typo, stray offset) | artifact only |
| Systematic | the process produces it again | skill / recipe / gate / order template |
| Misunderstanding | an actor misread a rule or fact | the skill or memory that holds the rule/fact (plus the artifact) |
| Rule conflict | fixing one rule breaks another | gate or QC check that tests both rules together; skill note |

## DECISIONS.jsonl entry for each systematic fix
`id`, `date`, `area`, `decision` (the defect and the fix), root-cause layer (skill / recipe / memory / gate / order template), the check added (file + what it tests), `evidence`, `status`, `owner_approved`.

## Lessons (2026-10-13)
1. Misunderstanding: QC read "48 000 students" as a wrong claim, but the copy says 48 000 = students and 148 000 = alumni. Fix: QC verifies every number/claim against the source copy (copy-map or brief) before judging it.
2. Rule conflict: enlarging the S3 hero fixed the size rule but digits then clipped at the frame edge. Fix: after any resize re-check the width/edge rule AND the size rule in one check.
3. Order-caused violation: the logo was recoloured white for contrast, by the lead's own order. Fix: art-director skill (done) and the order template (logos keep own colours, transparent background).
4. Systematic: decorative motifs (muqarnas, minarets, lamps) were added by the director with no goal link. Fix: director skill; every motif traces to the goal's claims or the brand's own assets.

## VERSION CAP (owner rule 2026-10-13)
A film has at most THREE versions: v1 first build, v2 one fix round, v3 final. A 4th needs the USER to ask for it in chat (todo field `user_requested_version: true`). In improvement mode the thing to improve is the SKILL (ledger, rules, detectors), not the film. QC never requests or loops for another version: SHIP or SHIP WITH NOTES. Evidence: v1..v9 of one film (ledger L-041).
