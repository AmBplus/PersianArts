# Motion plans log

Every motion request gets one plan file here before any build order is sent to a worker.

- File name: `YYYY-MM-DD-<film-slug>.md`, copied from `TEMPLATE.md`.
- Fill the sections in order. "Inputs consulted" lists only files that were actually opened (path), not files assumed to exist.
- The reuse map comes first in practice: before any new component, the planner checks the inventory in `docs/motion/reports/2026-10-13/plan-audit-report.md` and the kits it lists.
- A new component needs a written reason why no existing component fits (section "New components").
- Each decision is one line, with the rejected alternative.
- "Result vs plan" is filled after the render, with numbers from the worker report.
- Retrospective logs are marked "retrospective, reconstructed" in the header.
- Client names never appear here. Use the label `uni-admissions`.
