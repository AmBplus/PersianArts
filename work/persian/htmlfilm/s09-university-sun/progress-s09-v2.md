# progress — s09-university-sun v2 (fix round 1)

- read review-1.md; read proof stills check-debug-9x16.png / check-debug-16x9.png (white `f30 undefined` HUD top-left) and zoom-panel-f576.png (۸۴ over «هیئت»، ۴/۵۲ absent) — CONFIRMED
- read film.html in full (422 lines pre-edit) + events.json
- FIX 1 debug HUD: params no longer appends "&debug=2"; debug is opt-in ?debug=1
- FIX 2 panel: rows drawn as explicit right-anchored pairs; panel 9x16 160->280, 16x9 130->180
- FIX 3 chip: "F0"+digit -> «دانشکدهٔ N» (pure Persian)
- FIX 4 CTA/deadline: retimed prog(t,2.4/3.6) — v1 needed t>=9.0 s in a 6.67 s scene
- FIX 5 deadline pair: block() -> two explicit right-anchored runs, narrower plate
- FIX 6 letterbox: camera zoom >=1 + clamped pan
- FIX 7 CUTS[] + header + events.json reconciled to the renderer's beat dispatch [0,90,180,288,342,414,630]
- FIX 8 hero: fitSize()/nameLines() helpers; question 2 lines 9x16, payoff 3 lines 9x16 / 2 lines 16x9
- FIX 9 «سال تأسیس»; 16x9 now has 4 plate positions (4th was NaN); ghosted duplicate faculty name removed
- events.json rewritten to the real edit (next)
