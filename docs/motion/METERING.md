# METERING / متر زمان

اندازه‌گیری: فقط «زمان کارگر» (دقیقه‌هایی که خود کارگرها گزارش دادند). انتظار بین فرمان‌ها (ساعت دیواری) اندازه‌گیری نشد.
Measured: worker time only. Wall-clock waiting between orders was NOT measured.

## Table / جدول (worker minutes, total 76.7)
| Order | Min | Order | Min |
|---|---|---|---|
| status brief | 0.5 | audio-gap record | 0.4 |
| P3 attempt (blocked) | 3.0 | status board | 3.7 |
| asset path search | 1.4 | standing-orders record | 0.8 |
| portability audit | 1.3 | unblock (npm ci, placeholders, smoke) | 4.2 |
| portability brief | 1.6 | board-fix | 0.4 |
| M1 fonts | 0.5 | creative review | 1.5 |
| M2 pa.ps1 | 1.4 | render-fix | 4.7 |
| M6 font guard | 0.5 | resilience record | 0.3 |
| M3 render_all setup | 0.5 | board outputs | 3.6 |
| M5 remove D: paths | 0.9 | first video | 3.0 |
| M7 docs | 0.6 | fix round | 8.9 |
| logo SVG | 1.9 | S1 short build | 10.2 |
| creative direction | 5.6 | S2 four ratios | 6.5 |
| git checkpoint | 1.3 | S3 sound | 7.5 |

## Productive vs overhead / مسیر مولد و سربار
- Productive (real build) about 27 min: first video 3.0, S1 10.2, S2 6.5, S3 7.5.
- Overhead: portability about 25, dashboard about 8, creative direction + fix round about 15, review 1.5, blocked P3 3.0.

## Measured render speeds / سرعت رندر
12 s film: 33 s. 24 s film: 62 s. Four ratios: 67-69 s. Stills: 8-15 s.

## Why it was slow / چرا کند شد
1. Private/ignored files were missing on this machine (P3 blocked, then portability work).
2. Permission questions from the lead interrupted the flow.
3. Two document/review rounds happened before anything was built.
4. The dashboard was built late, so nothing was measured early.

## Rules / قوانین
1. Build the short cut first; a watchable render comes before any document.
2. Measure per order (board stamps startedAt/finishedAt automatically).
3. Put expected minutes on every order.
4. No review loops before the first watchable render.
5. Late = reported automatically: the board panel "متر زمان" shows on time / late / running per item.
