# ADVISOR: the Opus advisor on call (2026-10-13)

Opus never builds, renders, edits or reviews files. It is consulted for a few important questions and answers in one page. Default workers stay Haiku (mechanics) and Sonnet (studio agent, QC).

## Budget
At most 3 consults per film (default). The count lives in goal memory: every consult is a DECISIONS line tagged `advisor:`. A fourth consult needs the lead's order.

## Allowed triggers (only these)
1. Concept lock: the studio agent is torn between two or more strong directions (TODO step `director`).
2. After two failed fix rounds on the same defect (steps `motion-fixes`, `fix-round`).
3. A brand, taste or claim-risk call the studio agent cannot judge.
Not allowed: routine review, wording polish, anything a gate or a number can decide, anything just to save effort.

## Rule: decide first
Before asking, the studio agent writes what it would do by default and why. If the advisor answer is not needed to choose between those options, do not ask.

## Request format (at most 15 lines + paths)
Question in one sentence; the default you would pick; the options (2-3 lines each); constraints; paths: goal memory (`media/briefs-local/<label>/memory/goal-memory.md`), the stills/frames or files that show the options. No pasted content.

## Answer format (at most one page)
Recommendation first, then why, the risk if wrong, and what to do if it fails. No file edits.

## Logging
The studio agent appends to goal-memory DECISIONS within the same step: `date | advisor: <question> | answer: <recommendation> | taken/overruled: <what> | consult n of 3 | minutes/credit note`. A REJECTED line for each option dropped.

## In the TODO
Each step has `advisor: optional|none`; default `none`, except `director` (concept lock). The orchestrator names the advisor only at those steps.
