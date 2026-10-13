# Progress: payoff A2 (Daily ring pulses + day-7 accent, CTA bow settle + ring-out, +1 s film)

Plan:
1. motion.ts: CUT_BEATS last 34 -> 36 (CTA scene 27..36 = 135 frames, film 540 = 18 s at any BPM; DURATION_FRAMES/entry/SocialFilm all derive from it).
2. scenes.tsx SceneDaily: ring-pulse recipe per check (rows 1-6 mint, max rowH*0.9), day 7 = two coral rings (+4 frames, max rowH*1.3) + check scale 1.35*outBack; ticks at local 22,29,36,43,50,57,64.
3. scenes.tsx SceneCta: bow already settles at 98 (outBack 89-98 kept); add ring-out (3 staggered rings from pen base, end ~124) + full-frame paper flash 0.25 (98-101, fade 120-132); pill beat pulse damped to 0 by 98 so nothing moves after the ring-out; extra second absorbed by the calm hold to 135.
4. Verify: remotion compositions (4 durations), stills for all 4 ratios (Daily abs 362/364/366/370, CTA abs 501/503/509/525/539), tsc.
Status: in progress.
Status: DONE. motion.ts CUT_BEATS [0,4,8,14,20,27,36]; scenes.tsx SceneDaily ringPulse helper + day-7 double coral ring/1.35x check; SceneCta ring-out (3 rings) + flash 98-101 fade 120-132 + beat-pulse damp by 98. Compositions: 4x 540f/18s. 36/36 stills OK. tsc clean. Report: report-payoff-A2.md.
