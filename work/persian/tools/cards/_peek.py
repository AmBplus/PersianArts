import json, sys, os
sys.stdout.reconfigure(encoding="utf-8")
rows = json.load(open(r"D:\P\project\persianArts\work\persian\tools\cards\out\posters.json", encoding="utf-8"))
for r in rows:
    print("%-34s %-12s bg=%s f=%.2f L=%.3f ctr=%5.1f type=%.3f lines=%d px=%5.1f dg=%6.1f acc=%s%s rad=%2d glow=%s brd=%s" % (
        r["technique"][:34], r["kind"], r["bg_hex"], r["bg_frac"], r["mean_lum"], r["contrast"],
        r["type_h_ratio"], r["line_count"], r["est_font_px_1080"], r["dotgrid_score"],
        "Y" if r["has_accent"] else "n", (r["accent_hex"] or "------"), r["radius_px"],
        "Y" if r["has_glow"] else "n", "Y" if r["has_border"] else "n"))
