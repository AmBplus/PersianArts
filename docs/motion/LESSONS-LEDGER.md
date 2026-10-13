# LESSONS-LEDGER (retro rule)

File: docs/motion/LESSONS-LEDGER.jsonl, one JSON object per line.
Fields: id (L-###), date, defect, evidence (report file), class (accidental | systematic | misunderstanding | rule-conflict), root_cause, layer_fixed (skill | recipe | gate | memory | order-template), file_changed, check_added (script path or checklist item), status (open | verified-in-next-run).

RULE: every systematic defect (and every misunderstanding or rule conflict) gets a ledger line, a fix at the SOURCE layer (not only in the film) and a detector or checklist item. The next run verifies it with the detectors (work/persian/tools/gates/run-gates.mjs) and the QC checklist, then flips status to verified-in-next-run. Accidental defects are fixed in the artifact only. No client real name in evidence quotes. Version cap: a film has at most three versions (LOOP-POLICY.md).
