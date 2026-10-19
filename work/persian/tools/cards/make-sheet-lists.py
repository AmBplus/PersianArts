import os, sys, json
sys.stdout.reconfigure(encoding="utf-8")
REPO = r"D:\P\project\persianArts"
rows = json.load(open(os.path.join(REPO, "work/persian/tools/cards/out/posters.json"), encoding="utf-8"))
ty = [r for r in rows if r["kind"] == "typography"]
sc = [r for r in rows if r["kind"] == "shotcraft"]
out = os.path.join(REPO, "work/persian/tools/cards/out")
for name, sel in (("list-typography.txt", ty), ("list-shotcraft.txt", sc)):
    with open(os.path.join(out, name), "w", encoding="utf-8") as fh:
        for r in sel:
            fh.write("file '%s'\n" % os.path.join(REPO, r["path"].replace("/", os.sep)).replace("\\", "/"))
    print(name, len(sel))
