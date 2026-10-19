import csv, sys, textwrap
sys.stdout.reconfigure(encoding="utf-8")
P = r"D:\P\project\persianArts\.claude\skills\persian-arts\beauty\data"
rows = list(csv.DictReader(open(P + r"\beauty-rules.csv", encoding="utf-8")))
want = ["BTY-COMP-001", "BTY-COMP-002", "BTY-COMP-003", "BTY-COMP-004", "BTY-COMP-007",
        "BTY-COMP-008", "BTY-COMP-009", "BTY-COLOR-003", "BTY-COLOR-004", "BTY-COLOR-008",
        "BTY-COLOR-010", "BTY-COLOR-012", "BTY-DEPTH-009", "BTY-TEXTURE-003", "BTY-TEXTURE-006",
        "BTY-LIGHT-011", "BTY-LIGHT-015", "BTY-MATERIAL-005", "BTY-MATERIAL-006",
        "BTY-TYPE-001", "BTY-TYPE-002", "BTY-TYPE-005", "BTY-TYPE-006", "BTY-TYPE-010",
        "BTY-TYPE-011", "BTY-TYPE-017", "BTY-TYPE-018", "BTY-TYPE-026", "BTY-FA-004",
        "BTY-FA-009", "BTY-FA-020", "BTY-FA-021", "BTY-FA-026", "BTY-FA-030"]
by = {r["id"]: r for r in rows}
for w in want:
    r = by.get(w)
    if not r:
        print("MISSING", w); continue
    print("%s [%s] %s" % (r["id"], r["domain"], r["rule"]))
    print("   numbers: %s" % r["numbers"])
    print("   do: %s" % r["do"][:220])
    print("   anti: %s" % r["antipattern"][:160])
