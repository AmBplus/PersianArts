# Process measurement adapter

Use this adapter with [`plans/MEASURED-TEMPLATE.md`](plans/MEASURED-TEMPLATE.md) for each new film. It defines the record and gate commands; this playbook connects them to the build sequence. Keep film copy generic in tracked paths and store confidential source material locally.

Before implementation, create the plan and production directory. Record consulted inputs, decision references (including superseded decisions and the currently applicable replacement), explicit constraints, and eligible/observed reuse opportunities in separate `idea`, `code`, and `process` ledgers. Reuse is counted by distinct opportunities with evidence, never import-line percentage. Treat earlier films as samples; start concept work from the framework, demos, catalogs, library, and shared utilities.

Keep a completed `actions.jsonl` row for every work attempt, including failures and retries. Capture actual UTC start/end, actor/model/reasoning, declared timebox, outcome, retry/parent links, and acceptance evidence. Use measured values only; unknown stays unknown. Hash all consumed sources and the current director file after edits.

Run the stages independently against current files:

```powershell
node work/persian/tools/film-process-gates.mjs --production-dir <production-directory> --root . --stage structural
node work/persian/tools/film-process-gates.mjs --production-dir <production-directory> --root . --stage preflight
node work/persian/tools/film-process-gates.mjs --production-dir <production-directory> --root . --stage delivery
```

Structural PASS means only that a draft record is well formed. Preflight requires fresh source/director hashes, decisions, constraints, nonempty per-scope reuse ledgers, action log, reviewed frame declarations, and existing evidence paths. Delivery additionally requires every applicable requirement, Persian reading, bidi, actual font-role, and preserved-positive-trait review to be `pass` with evidence. These commands validate declarations and paths; they do not measure music, sync, loudness, contrast, visual quality, Persian readability, font loading, or story fidelity. Use the domain check and human/source review named in [`FILM-GATES.md`](FILM-GATES.md); any required `not-run`, `unknown`, stale, failed, or `to build` item blocks the claimed stage.

Report observed results, paths, hashes, failures, retry/overrun counts, and unverified items in the worker report. Keep subjective review distinct from measurements. No public release until all required evidence has been reviewed and the owner accepts the result.
