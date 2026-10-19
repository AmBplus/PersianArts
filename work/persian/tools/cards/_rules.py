import csv, sys, re
sys.stdout.reconfigure(encoding="utf-8")
P = r"D:\P\project\persianArts\.claude\skills\persian-arts\beauty\data"
rows = list(csv.DictReader(open(P + r"\beauty-rules.csv", encoding="utf-8")))
print("rules:", len(rows))
doms = {}
for r in rows:
    doms[r["domain"]] = doms.get(r["domain"], 0) + 1
print("domains:", doms)
KW = ["cream", "near-black", "mid-tone", "midtone", "muddy", "bimodal", "luminance", "band",
      "grid", "dot", "texture", "noise", "radius", "rounded", "glow", "bloom", "halo",
      "border", "stroke", "frame", "overline", "headline", "type scale", "big type",
      "contrast", "60%", "70%", "occup", "background", "plate", "accent", "single", "hue",
      "1080", "% of frame"]
hits = {}
for r in rows:
    blob = " ".join(str(v) for v in r.values()).lower()
    for k in KW:
        if k in blob:
            hits.setdefault(k, []).append(r["id"])
for k in KW:
    ids = hits.get(k, [])
    print("%-12s %3d  %s" % (k, len(ids), ",".join(ids[:8]) + (" ..." if len(ids) > 8 else "")))
