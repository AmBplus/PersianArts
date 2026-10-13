# Daily reports: convention

One folder per calendar day (owner's local time, Asia/Tehran), named `YYYY-MM-DD/`.

Each day folder holds two files:

- `summary.md`: HIGH-LEVEL DECISION REPORT for the owner, in simple Persian. Max 70 lines.
  Sections, in this order:
  1. چه اتفاقی افتاد (max 8 plain bullets)
  2. تصمیم‌هایی که گرفتیم و دلیلش (each: decision, why, status `confirmed` or `proposed`)
  3. بهبودها (table: item, before, after, in plain words)
  4. چه چیزی از شما لازم است (open owner decisions, most important first)
  5. جدیدترین خروجی‌ها برای دیدن/شنیدن (paths only)
  6. ریسک‌ها (max 4)
  7. last line: ملاک بهبود رندر (only when render numbers exist)
  No file lists, no commands, no jargon (explain a term in a few words).
- `detail.md`: FULL TECHNICAL REPORT, Persian/English mix. Sections: order table (qh id,
  worker, title, state, duration), per-order files created or changed, key numbers, progress
  and report paths, commits (hash and subject), scripts and commands used, benchmark tables,
  defects found, deviations, sources.

Index:

- `INDEX.md`: one line per day, linking summary and detail, with a one-line headline.
- `index.jsonl`: one JSON object per day (`date`, `summary`, `detail`, `headline`, `commits`).

Checkpoints: the 10-minute cron appends a `## HH:MM checkpoint` section to both files with
`work/persian/tools/reports/new_report.ps1`. It never overwrites; it only appends.

Rules:

- Never write client or institution real names. Use the label `uni-admissions`.
- No secrets, keys, tokens or account ids. Keys live in git-ignored env files, named by path only.
- Run `node contracts/scan.mjs` after writing; fix hits in files you created.
- Facts come from the sources listed in `detail.md`. Mark anything unverified as "not verified".
- Dates: from file mtimes and git log. Say so when a date is inferred.
