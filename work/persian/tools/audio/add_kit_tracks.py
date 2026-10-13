import json, glob, os, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8")
SRC = "D:/P/test/music"; K = "sound/library/kit/music"; S = "media/music-staging/viditor"
ADD = [
 dict(id=5687, slug="coffee-capsule-teaser", grid="PASS", moods=["upbeat","fresh"], genre=["electronic","bright","instrumental"],
      good_for=["product and food reels","bright lifestyle cuts"], avoid_for=["dramatic or emotional films"], bed_only=False, arc="steady build, high energy"),
 dict(id=6852, slug="corporate-build", grid="PASS", moods=["corporate","clean","driving"], genre=["corporate","instrumental"],
      good_for=["explainers","company and B2B films"], avoid_for=["playful kids content"], bed_only=False, arc="steady, moderate energy"),
 dict(id=5724, slug="old-house-nostalgia", grid="FAIL-bed", moods=["emotional","calm","warm"], genre=["nostalgic","slideshow","instrumental"],
      good_for=["memory and family stories","calm documentary beds"], avoid_for=["fast promo cuts"], bed_only=True, arc="soft start, lift mid, gentle end"),
 dict(id=5914, slug="kids-album-playful", grid="FAIL-bed", moods=["playful","quirky"], genre=["kids","slideshow","instrumental"],
      good_for=["playful stories","children and school films"], avoid_for=["serious or dramatic films"], bed_only=True, arc="steady, light energy"),
 dict(id=5831, slug="salon-elegant", grid="FAIL-bed", moods=["calm","elegant"], genre=["slideshow","light","instrumental"],
      good_for=["calm beauty and lifestyle","soft intros and outros"], avoid_for=["tight beat-synced cuts"], bed_only=True, arc="steady, soft"),
 dict(id=5546, slug="mystery-teaser", grid="FAIL-bed", moods=["dramatic","mysterious"], genre=["cinematic","teaser","instrumental"],
      good_for=["mystery and reveal films","dramatic teasers"], avoid_for=["upbeat product films"], bed_only=True, arc="build, ends in silence (built-in tail)"),
 dict(id=6960, slug="lab-graphic-minimal", grid="FAIL-bed", moods=["minimal","tech","quirky"], genre=["electronic","minimal","instrumental"],
      good_for=["science and tech explainers","minimal motion graphics"], avoid_for=["emotional stories"], bed_only=True, arc="steady, low bass"),
]
def find_src(i):
    return [f for f in os.listdir(SRC) if f.startswith(f"{i}-") and f.endswith(".m4a")][0]
meta = {t["id"]: t for t in json.load(open("work/viditor-reference/music-standalone.json", encoding="utf-8"))["tracks"]}
audit = {str(a["id"]): a for a in json.load(open(f"{S}/audit-metrics.json", encoding="utf-8"))}
for a in ADD:
    i = a["id"]; kid = f"tr-vd-{i}-{a['slug']}"
    subprocess.run(["ffmpeg","-v","error","-y","-i",f"{SRC}/{find_src(i)}","-t","90","-af","loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-ac","2","-ar","44100","-c:a","libvorbis","-q:a","4",f"{K}/{kid}.ogg"], check=True)
    d = json.load(open(f"{S}/{i}.music.json", encoding="utf-8"))
    d["file"] = f"{kid}.ogg"
    x = audit[str(i)]
    d["kit"] = {"id": kid, "source": {"provider": "viditor", "template_id": i,
                "source_url": meta[i]["sourceTemplateUrl"], "template_name": meta[i]["name"]},
        "duration_s": round(min(x["dur"], 90.0), 1), "excerpt": "start 0.0 s, first 90 s or whole track",
        "loudness": "loudnorm I=-16 TP=-1.5 LRA=11 (single pass)", "grid_verdict": a["grid"],
        "bass_ratio": x["bass_ratio"], "centroid_hz": x["centroid_hz"], "onset_per_s": x["onset_per_s"],
        "vocal_proxy": x["vocal_proxy"], "vocal_note": "crude proxy only; audition before use",
        "energy_arc_db": x["arc_db"], "energy_arc": a["arc"], "loopable": bool(x["loop_corr"]==x["loop_corr"] and x["loop_corr"]>0.8),
        "loop_corr": x["loop_corr"], "mood_tags": a["moods"], "genre_tags": a["genre"], "good_for": a["good_for"],
        "avoid_for": a["avoid_for"], "bed_only": a["bed_only"],
        "credit_line": f"Viditor template {i} (see source_url)", "licence": "owner-provided, personal use; source/credit fields are data only"}
    json.dump(d, open(f"{K}/{kid}.music.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(kid, round(d["bpm"],1), a["grid"], os.path.getsize(f"{K}/{kid}.ogg"))
