# Post-mortem conference-event (2026-10-13)

Total 62 min (system clock, marks + file mtimes; labels ignored). Marks: 10, files seen: 74.

## Minutes per phase
| phase | min |
|---|---|
| build | 5 |
| capture | 11 |
| deliver | 27 |
| fix | 18 |
| sound | 1 |

## Idle gaps > 2 min
| from | to | min | class | after phase |
|---|---|---|---|---|
| 19:19 | 19:24 | 5 | work | build |
| 19:24 | 19:28 | 4.1 | render-capture | capture |
| 19:30 | 19:55 | 24.8 | wait-lead | deliver |
| 19:55 | 20:03 | 8 | rework | fix |
| 20:03 | 20:13 | 10 | rework | fix |
| 20:15 | 20:18 | 2.5 | render-capture | capture |

## Top 3 delays
1. wait-lead: 24.8 min (lead idle between rounds (no mark, no file activity))
2. rework: 18 min (fix round / repeated phase)
3. render-capture: 6.6 min (capture/encode wall time)

## Draft LESSONS-LEDGER lines (status proposed; assign real L-ids when merging)
`{"date":"2026-10-13","defect":"wait-lead: 25 min lost in film conference-event","evidence":"docs/motion/ledger/postmortem-conference-event-2026-10-13.md","class":"systematic","root_cause":"decision loop has no clock: the lead waits instead of ordering","layer_fixed":"skill","file_changed":"persian-arts/SKILL.md","check_added":"`pa time status` after every worker report; order the next step within 2 min or ship (SKILL rule 10)","status":"proposed"}`
`{"date":"2026-10-13","defect":"rework: 18 min lost in film conference-event","evidence":"docs/motion/ledger/postmortem-conference-event-2026-10-13.md","class":"systematic","root_cause":"v1 did not meet the bar or a weaker worker left partial results","layer_fixed":"skill","file_changed":"persian-arts/SKILL.md","check_added":"one studio pass with the right worker; no Haiku for craft; freeze scope","status":"proposed"}`
`{"date":"2026-10-13","defect":"render-capture: 7 min lost in film conference-event","evidence":"docs/motion/ledger/postmortem-conference-event-2026-10-13.md","class":"accidental","root_cause":"slow capture (PNG encode) or repeated captures","layer_fixed":"skill","file_changed":"persian-arts/SKILL.md","check_added":"lighten before capture; capture once per version; `--draft` for previews","status":"proposed"}`

