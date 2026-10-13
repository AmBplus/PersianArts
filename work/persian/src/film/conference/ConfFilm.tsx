// Conference film: six scenes, one device (the scan line). Every cut is the line sweeping down; the incoming scene shows above it.
// Tokens in ./theme.ts, frames in ./events.ts, all Persian text in the git-ignored ./copy-map-conference.json.
import React from "react";
import {AbsoluteFill, Img, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame} from "remotion";
import {Emblem} from "../uni/Logo";
import {Ltr, dims, faNum, fit, inOutCubic, inOutSine, outCubic, outExpo, prog, rng, Dims} from "../uni/long/v4/kit";
import {CT, FONT_BODY, FONT_HEAD, Ratio, SIZES} from "./theme";
import {EVENTS as E, SCENE_STARTS, TW} from "./events";
import COPY from "./copy-map-conference.json";

/** Loads both families BEFORE any child renders (text measuring in fit() must never see a fallback font); a missing file fails the render. */
const Fonts: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const [h] = React.useState(() => delayRender("conf-fonts"));
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => {
    Promise.all([[FONT_HEAD, "Vazirmatn-Variable.ttf"], [FONT_BODY, "Estedad-Variable.ttf"]].map(([n, fl]) =>
      new FontFace(n, `url(${staticFile("fonts/" + fl)})`, {weight: "100 900"}).load().then((ff) => { document.fonts.add(ff); }))).then(() => { setOk(true); continueRender(h); }, (e) => cancelRender(e));
  }, [h]);
  return ok ? <>{children}</> : null;
};

interface SP {f: number; d: Dims}
const pick = <T,>(d: Dims, o: {wide: T; tall: T}) => (d.H / d.W > 1.6 ? o.tall : o.wide);
const local = (ev: {frame: number}, start: number) => ev.frame - start;

/** Lines revealed one by one under a mask (whole lines only: Persian joins stay intact). */
const Lines: React.FC<{lines: string[]; f: number; t0: number; size: number; maxW: number; weight?: number; colors: string[]; stagger?: number; lh?: number; align?: "center" | "start"}> = ({lines, f, t0, size, maxW, weight = 900, colors, stagger = 9, lh = 1.4, align = "center"}) => {
  const s = Math.min(size, ...lines.map((l) => fit(l, size, maxW, weight, FONT_HEAD)));
  return (
    <div style={{textAlign: align, direction: "rtl"}}>
      {lines.map((l, i) => {
        const p = outCubic(prog(f, t0 + i * stagger, 20));
        return (
          <div key={i} style={{overflow: "hidden", height: s * lh, lineHeight: `${s * lh}px`}}>
            <div style={{transform: `translateY(${(1 - p) * 105}%)`, opacity: Math.min(1, p * 3), fontFamily: FONT_HEAD, fontWeight: weight, fontSize: s, color: colors[Math.min(i, colors.length - 1)], whiteSpace: "nowrap"}}>{l}</div>
          </div>
        );
      })}
    </div>
  );
};

const Circuit: React.FC<{d: Dims; seed: number; f: number; color: string; op?: number}> = ({d, seed, f, color, op = 0.35}) => {
  const {W, H, u} = d;
  const paths = React.useMemo(() => {
    const r = rng(seed);
    return Array.from({length: 11}, () => {
      const left = r() < 0.5, x0 = left ? r() * W * 0.18 : W - r() * W * 0.18, y0 = r() * H;
      const dx = (left ? 1 : -1) * (60 + r() * 140) * u, dy = (r() < 0.5 ? -1 : 1) * (50 + r() * 120) * u;
      return {pts: [[x0, y0], [x0 + dx, y0], [x0 + dx + Math.sign(dx) * Math.abs(dy), y0 + dy]]};
    });
  }, [W, H, u, seed]);
  return (
    <svg width={W} height={H} style={{position: "absolute", inset: 0}}>
      {paths.map((p, i) => {
        const t = outCubic(prog(f, 5 + i * 3, 40));
        return (
          <g key={i} opacity={op}>
            <polyline points={p.pts.map((q) => q.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={2.5 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
            <circle cx={p.pts[0][0]} cy={p.pts[0][1]} r={5 * u} fill={color} opacity={t} />
          </g>
        );
      })}
    </svg>
  );
};

// ---------------- S1: network, one node turns amber
const S1: React.FC<SP> = ({f, d}) => {
  const {W, H, u, wide} = d;
  const net = React.useMemo(() => {
    const r = rng(11), n = wide ? 54 : 46;
    const pts = Array.from({length: n}, () => ({x: (0.04 + r() * 0.92) * W, y: (0.05 + r() * 0.9) * H}));
    const edges: [number, number][] = [];
    pts.forEach((a, i) => {
      pts.map((b, j) => ({j, dd: (a.x - b.x) ** 2 + (a.y - b.y) ** 2})).filter((o) => o.j !== i).sort((p, q) => p.dd - q.dd).slice(0, 2).forEach((o) => edges.push([i, o.j]));
    });
    let hot = 0, best = 1e18;
    pts.forEach((p, i) => { const dd = (p.x - W * 0.66) ** 2 + (p.y - H * (wide ? 0.3 : 0.28)) ** 2; if (dd < best) { best = dd; hot = i; } });
    return {pts, edges, hot};
  }, [W, H, wide]);
  const ping = f - local(E.ping, 0);
  const nb = (i: number) => net.edges.some(([a, b]) => (a === net.hot && b === i) || (b === net.hot && a === i));
  const size = wide ? H * 0.17 : H / W > 1.6 ? H * 0.12 : H * 0.15;
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 90% at 60% 30%, ${CT.mid} 0%, ${CT.navy} 55%, ${CT.deep} 100%)`}}>
      <svg width={W} height={H} style={{position: "absolute", inset: 0}}>
        {net.edges.map(([a, b], i) => {
          const hotEdge = (a === net.hot || b === net.hot) && ping > 15;
          return <line key={i} x1={net.pts[a].x} y1={net.pts[a].y} x2={net.pts[b].x} y2={net.pts[b].y} stroke={hotEdge ? CT.amber : CT.cyan} strokeOpacity={hotEdge ? 0.8 : 0.28} strokeWidth={2 * u} />;
        })}
        {net.pts.map((p, i) => {
          const hot = i === net.hot, hh = hot && ping > 0, drift = Math.sin(f / 22 + i) * 2 * u;
          return <circle key={i} cx={p.x} cy={p.y + drift} r={(hot ? 11 : 5.5) * u} fill={hh ? CT.amber : CT.cyan} opacity={hh ? 1 : nb(i) && ping > 25 ? 0.95 : 0.7} />;
        })}
        {ping > 0 && [0, 25].map((o, k) => {
          const t = ((ping + o) % 70) / 70;
          return <circle key={k} cx={net.pts[net.hot].x} cy={net.pts[net.hot].y} r={(14 + t * 170) * u} fill="none" stroke={CT.amber} strokeWidth={3 * u} opacity={(1 - t) * 0.8} />;
        })}
      </svg>
      <div style={{position: "absolute", left: 0, right: 0, top: H * (wide ? 0.64 : 0.7), height: 0}}>
        <div style={{position: "absolute", left: "50%", transform: "translate(-50%, -50%)", width: W * 0.9}}>
          <div style={{position: "absolute", inset: `${-size * 0.3}px ${-size * 0.4}px`, background: `radial-gradient(closest-side, ${CT.deep}cc, transparent)`}} />
          <div style={{position: "relative"}}><Lines lines={pick(d, COPY.s1)} f={f} t0={local(E.threat, 0) - 12} size={size} maxW={W * 0.86} colors={[CT.white, CT.white, CT.cyan]} /></div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- S2: title on pale sky
const S2: React.FC<SP> = ({f, d}) => {
  const {W, H, u, wide} = d, st = SCENE_STARTS[1];
  const size = wide ? H * 0.17 : H * 0.14;
  const lab = outCubic(prog(f, 4, 20));
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${CT.sky1}, ${CT.sky2})`}}>
      <Circuit d={d} seed={5} f={f} color={CT.blue} op={0.3} />
      {!wide && (
        <svg width={W} height={H} style={{position: "absolute", inset: 0}}>
          {[0.34, 0.5, 0.68].map((k, i) => (
            <circle key={i} cx={W / 2} cy={H / 2} r={Math.min(W, H) * k} fill="none" stroke={CT.blue} strokeOpacity={0.18} strokeWidth={3 * u} strokeDasharray={`${(40 + i * 24) * u} ${(26 + i * 10) * u}`} strokeDashoffset={-f * (i % 2 ? -1.2 : 1.2) * u} />
          ))}
        </svg>
      )}
      <div style={{position: "absolute", left: 0, right: 0, top: H * 0.5, transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 * u}}>
        <div style={{display: "flex", alignItems: "center", gap: 28 * u, opacity: lab}}>
          <div style={{width: (wide ? 200 : 120) * u * lab, height: 3 * u, background: CT.ink}} />
          <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: (wide ? 64 : 62) * u, color: CT.ink, direction: "rtl"}}>{COPY.s2.label}</div>
          <div style={{width: (wide ? 200 : 120) * u * lab, height: 3 * u, background: CT.ink}} />
        </div>
        <Lines lines={wide ? COPY.s2.wide : COPY.s2.tall} f={f} t0={local(E.title, st) - 6} size={size} maxW={W * 0.9} colors={[CT.ink, CT.blue, CT.blue, CT.blue]} stagger={10} />
      </div>
    </AbsoluteFill>
  );
};

const Photo: React.FC<{src: string; w: number; h: number; f: number; z0?: number; z1?: number; pan?: number; natAspect: number; x?: number}> = ({src, w, h, f, z0 = 1, z1 = 1.12, pan = 0, natAspect, x = 0.5}) => {
  const zoom = z0 + (z1 - z0) * inOutSine(prog(f, 0, 180));
  const ih = Math.max(h, w / natAspect), iw = ih * natAspect;
  return (
    <div style={{width: w, height: h, overflow: "hidden", position: "relative"}}>
      <Img src={staticFile(src)} style={{position: "absolute", width: iw, height: ih, left: (w - iw) * (x + pan * prog(f, 0, 180)), top: (h - ih) / 2, transform: `scale(${zoom})`, transformOrigin: "50% 50%", maxWidth: "none"}} />
    </div>
  );
};

// ---------------- S3: gate photo band below, aim above
const S3: React.FC<SP> = ({f, d}) => {
  const {W, H, u, wide} = d, st = SCENE_STARTS[2];
  const ph = H * (wide ? 0.48 : 0.4);
  const size = wide ? H * 0.1 : H * 0.075;
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${CT.deep}, ${CT.navy})`}}>
      <div style={{position: "absolute", left: 0, right: 0, top: 0, height: H - ph, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 * u}}>
        <div style={{fontFamily: FONT_BODY, fontWeight: 700, fontSize: (wide ? 40 : 44) * u, color: CT.cyan, opacity: outCubic(prog(f, 3, 20)), direction: "rtl"}}>{COPY.s3.label}</div>
        <Lines lines={pick(d, COPY.s3)} f={f} t0={local(E.aim, st) - 3} size={size} maxW={W * 0.9} colors={[CT.white]} stagger={10} />
      </div>
      <div style={{position: "absolute", left: 0, right: 0, bottom: 0}}>
        <Photo src="conf-local/gate.jpg" w={W} h={ph} f={f} natAspect={1135 / 288} z0={1} z1={1.1} pan={-0.04} />
        <div style={{position: "absolute", inset: 0, background: `linear-gradient(180deg, ${CT.navy} 0%, transparent 28%)`}} />
        <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 3 * u, background: CT.cyan, opacity: 0.8 * outCubic(prog(f, 10, 40))}} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- S4: server photo + three lines lit in turn
const S4: React.FC<SP> = ({f, d}) => {
  const {W, H, u, wide} = d, st = SCENE_STARTS[3];
  const lit = [E.l1, E.l2, E.l3].map((e) => local(e, st));
  const pw = wide ? W * 0.36 : W, ph = wide ? H : H * 0.36;
  const size = wide ? H * 0.075 : H * 0.05;
  return (
    <AbsoluteFill style={{background: `linear-gradient(${wide ? 90 : 180}deg, ${CT.mid}, ${CT.navy})`}}>
      <div style={{position: "absolute", left: 0, top: 0}}>
        <Photo src="conf-local/server.jpg" w={pw} h={ph} f={f} natAspect={509 / 585} z0={1.02} z1={1.1} />
        <div style={{position: "absolute", inset: 0, background: wide ? `linear-gradient(90deg, transparent 60%, ${CT.mid})` : `linear-gradient(180deg, transparent 60%, ${CT.mid})`}} />
      </div>
      <div style={{position: "absolute", left: wide ? pw : 0, right: 0, top: wide ? 0 : ph, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: (wide ? 70 : 50) * u, padding: `0 ${W * (wide ? 0.06 : 0.08)}px`, direction: "rtl"}}>
        {COPY.s4.rows.map((row, i) => {
          const on = outCubic(prog(f, lit[i], 14)), cur = f >= lit[i];
          const lines = pick(d, row);
          return (
            <div key={i} style={{display: "flex", alignItems: "center", gap: 28 * u, opacity: 0.3 + 0.7 * on}}>
              <div style={{width: 8 * u, alignSelf: "stretch", background: CT.cyan, transform: `scaleY(${0.25 + 0.75 * on})`, boxShadow: cur ? `0 0 ${14 * u}px ${CT.cyan}` : "none", borderRadius: 4 * u}} />
              <div style={{flex: 1}}>
                {lines.map((l, k) => (
                  <div key={k} style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: Math.min(size, fit(l, size, wide ? W * 0.56 : W * 0.8, 800, FONT_HEAD)), lineHeight: 1.45, color: CT.white, whiteSpace: "nowrap"}}>{l}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- S5: organisers on pale sky, each logo in its own colours
const S5: React.FC<SP> = ({f, d}) => {
  const {W, H, u, wide} = d, st = SCENE_STARTS[4];
  const t = [E.lg1, E.lg2, E.lg3].map((e) => local(e, st));
  const row = H / W < 1.2, lh = wide ? H * 0.42 : row ? Math.min(H * 0.34, W * 0.2) : H * 0.2;
  const reveal = (i: number) => outCubic(prog(f, t[i] - 12, 22));
  const wrap = (i: number): React.CSSProperties => ({opacity: reveal(i), transform: `translateY(${(1 - reveal(i)) * 30 * u}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 * u});
  const nameStyle = (px: number): React.CSSProperties => ({fontFamily: FONT_BODY, fontWeight: 700, fontSize: px, color: CT.ink, direction: "rtl", textAlign: "center", maxWidth: lh * 1.7, lineHeight: 1.5});
  const uniP = prog(f, t[0] - 12, 40);
  const ifrc = (
    <div style={wrap(1)}>
      <Img src={staticFile("conf-local/ifrc.png")} style={{height: lh * 0.8, width: "auto"}} />
      <Ltr style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 40 * u, color: CT.ink}}>IFRC</Ltr>
      <div style={nameStyle(30 * u)}>{COPY.s5.ifrc}</div>
    </div>
  );
  const afta = (
    <div style={wrap(2)}>
      <Img src={staticFile("conf-local/afta-mark.png")} style={{height: lh * 0.98, width: "auto"}} />
      <div style={nameStyle(30 * u)}>{COPY.s5.afta}</div>
    </div>
  );
  const uni = (
    <div style={wrap(0)}>
      <div style={{position: "relative", width: lh * 0.8, height: lh * 0.9}}>
        <Emblem x={lh * 0.4} y={lh * 0.45} h={lh * 0.9} wingOpen={outCubic(uniP)} shieldIn={outCubic(prog(f, t[0] - 4, 26))} penDot={outCubic(prog(f, t[0] + 6, 20))} penIn={outCubic(prog(f, t[0] + 6, 22))} plate="none" rim="none" dot={CT.ink} />
      </div>
      <div style={nameStyle(34 * u)}>{COPY.s5.uni}</div>
    </div>
  );
  const lineP = outExpo(prog(f, 8, 40));
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${CT.sky1}, ${CT.sky2})`}}>
      <Circuit d={d} seed={21} f={f} color={CT.blue} op={0.25} />
      <div style={{position: "absolute", left: 0, right: 0, top: H * (wide ? 0.12 : 0.06), textAlign: "center", fontFamily: FONT_BODY, fontWeight: 800, fontSize: (wide ? 50 : 54) * u, color: CT.ink, direction: "rtl", opacity: outCubic(prog(f, 2, 20))}}>{COPY.s5.label}</div>
      <div style={{position: "absolute", right: W * 0.1, width: W * 0.8 * lineP, top: wide ? H * 0.2 : H * 0.06 + 100 * u, height: 3 * u, background: CT.cyan}} />
      <div style={{position: "absolute", left: 0, right: 0, top: wide ? H * 0.3 : H * 0.06 + 130 * u, bottom: H * 0.05, padding: `0 ${W * 0.03}px`, display: "flex", flexDirection: row ? "row" : "column", justifyContent: "space-around", alignItems: "center", direction: "rtl"}}>
        {row ? <>{ifrc}{uni}{afta}</> : <>{uni}{ifrc}{afta}</>}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- S6: date card
const S6: React.FC<SP> = ({f, d}) => {
  const {H, u, wide} = d, st = SCENE_STARTS[5];
  const tDate = local(E.date, st), tRing = local(E.ring, st), tVenue = local(E.venue, st);
  const dayN = Math.round(COPY.s6.day * outExpo(prog(f, 12, tDate - 12)));
  const dayP = outCubic(prog(f, 6, 18));
  const daySize = wide ? H * 0.5 : H * 0.26;
  const monSize = wide ? H * 0.15 : H * 0.095;
  const ring = outCubic(prog(f, tRing, 28));
  const rr = daySize * 0.78;
  const vp = outCubic(prog(f, tVenue, 20));
  const dateBlock = (
    <div style={{position: "relative", width: rr * 2, height: rr * 2, flex: "none"}}>
      <svg width={rr * 2} height={rr * 2} style={{position: "absolute", inset: 0, transform: "rotate(-90deg)"}}>
        <circle cx={rr} cy={rr} r={rr - 6 * u} fill="none" stroke={CT.cyan} strokeWidth={4 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} />
      </svg>
      <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: dayP}}>
        <Ltr style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: daySize, color: CT.white, lineHeight: 1}}>{faNum(dayN, false)}</Ltr>
      </div>
    </div>
  );
  const text = (
    <div style={{display: "flex", flexDirection: "column", alignItems: wide ? "flex-start" : "center", gap: 10 * u, direction: "rtl"}}>
      <div style={{fontFamily: FONT_BODY, fontWeight: 700, fontSize: (wide ? 60 : 64) * u, color: CT.cyan, opacity: dayP}}>{COPY.s6.weekday}</div>
      <div style={{fontFamily: FONT_HEAD, fontWeight: 900, fontSize: monSize, color: CT.white, lineHeight: 1.3, opacity: outCubic(prog(f, 14, 20)), display: "flex", gap: 24 * u, alignItems: "baseline"}}>
        <span>{COPY.s6.month}</span><Ltr>{faNum(COPY.s6.year, false)}</Ltr>
      </div>
      <div style={{opacity: vp, transform: `translateY(${(1 - vp) * 20 * u}px)`, marginTop: 26 * u, borderTop: `${3 * u}px solid ${CT.cyan}`, paddingTop: 22 * u, textAlign: wide ? "start" : "center"}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: (wide ? 54 : 56) * u, color: CT.white, lineHeight: 1.5}}>{COPY.s6.venue1}</div>
        <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: (wide ? 44 : 46) * u, color: CT.sky2, lineHeight: 1.5}}>{COPY.s6.venue2}</div>
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{background: `radial-gradient(110% 90% at 50% 40%, ${CT.mid} 0%, ${CT.navy} 60%, ${CT.deep} 100%)`}}>
      <Circuit d={d} seed={9} f={f} color={CT.cyan} op={0.25} />
      <Emblem x={wide ? d.W * 0.94 : d.W / 2} y={wide ? H * 0.13 : H * 0.075} h={wide ? H * 0.17 : H * 0.115} wingOpen={outCubic(prog(f, 20, 40))} shieldIn={outCubic(prog(f, 24, 26))} penDot={outCubic(prog(f, 40, 20))} penIn={outCubic(prog(f, 40, 22))} plate="none" rim="none" dot={CT.ink} />
      <div style={{position: "absolute", inset: 0, display: "flex", flexDirection: wide ? "row" : "column", alignItems: "center", justifyContent: "center", gap: (wide ? 100 : 40) * u, direction: "rtl"}}>
        {dateBlock}{text}
      </div>
    </AbsoluteFill>
  );
};

const SCENES = [S1, S2, S3, S4, S5, S6];

export const ConfFilm: React.FC<{ratio: Ratio}> = ({ratio}) => {
  const f = useCurrentFrame();
  const {W, H} = SIZES[ratio], d = dims(W, H), u = d.u;
  let i = 0;
  SCENE_STARTS.forEach((s, k) => { if (f >= s) i = k; });
  const since = f - SCENE_STARTS[i];
  const trans = since < TW;
  const y = trans ? H * inOutCubic(prog(f, SCENE_STARTS[i], TW)) : H;
  const Cur = SCENES[i], Prev = i > 0 ? SCENES[i - 1] : null;
  return (
    <Fonts>
      <AbsoluteFill style={{background: CT.deep, direction: "rtl"}}>
        {trans && Prev && (
          <AbsoluteFill style={{clipPath: `inset(${y}px 0 0 0)`}}><Prev f={f - SCENE_STARTS[i - 1]} d={d} /></AbsoluteFill>
        )}
        <AbsoluteFill style={{clipPath: trans ? `inset(0 0 ${H - y}px 0)` : undefined}}><Cur f={since} d={d} /></AbsoluteFill>
        {trans && (
          <>
            <div style={{position: "absolute", left: 0, right: 0, top: y - 140 * u, height: 140 * u, background: `linear-gradient(180deg, transparent, ${CT.cyan}40)`, pointerEvents: "none"}} />
            <div style={{position: "absolute", left: 0, right: 0, top: y - 1.5 * u, height: 3 * u, background: CT.cyan, boxShadow: `0 0 ${16 * u}px ${CT.cyan}`, pointerEvents: "none"}} />
          </>
        )}
      </AbsoluteFill>
    </Fonts>
  );
};
