import os, json, collections, sys

root = r"D:\P\project\persianArts\library\media"
ty = os.path.join(root, "typography")
sc = os.path.join(root, "reference", "shotcraft")

print("TY dirs", len(os.listdir(ty)))
lvl1 = sorted(d for d in os.listdir(sc) if os.path.isdir(os.path.join(sc, d)))
print("SC lvl1", len(lvl1))
tot = 0
for c in lvl1:
    p = os.path.join(sc, c)
    subs = sorted(d for d in os.listdir(p) if os.path.isdir(os.path.join(p, d)))
    tot += len(subs)
    print("  %-28s %d" % (c, len(subs)))
print("shotcraft tech total", tot)

sample = sorted(os.listdir(ty))[0]
mp = os.path.join(ty, sample, "meta.json")
print("SAMPLE FOLDER", sample)
if os.path.exists(mp):
    print(json.dumps(json.load(open(mp, encoding="utf-8")), ensure_ascii=False, indent=1)[:1200])
print("FILES IN SAMPLE", sorted(os.listdir(os.path.join(ty, sample))))
# poster presence in shotcraft
sc_poster = 0
sc_other = collections.Counter()
for c in lvl1:
    for t in sorted(os.listdir(os.path.join(sc, c))):
        d = os.path.join(sc, c, t)
        if os.path.isdir(d):
            for f in os.listdir(d):
                if f == "poster.webp":
                    sc_poster += 1
                else:
                    sc_other[f.split('.')[-1]] += 1
print("shotcraft poster.webp count", sc_poster)
print("shotcraft other files", sc_other.most_common(10))
