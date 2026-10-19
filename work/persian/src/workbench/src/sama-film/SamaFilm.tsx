import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FaRoot} from "../../demosrc/_fa";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = {draw:(x:number)=>1-Math.pow(1-x,3), soft:(x:number)=>x*x*(3-2*x), snap:(x:number)=>1-Math.pow(1-x,5)};

export const SamaFilm: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / 30;
  const step = (a:number,b:number,e:(x:number)=>number=ease.soft) => e(clamp((s-a)/(b-a)));
  const text = s < 4.2 ? "از کجا شروع کنم؟" : s < 6.5 ? "یک پرسش، یک مسیر." : s < 8.8 ? "برای قدمِ بعدی." : "مدارس سما";
  const tOpacity = s < 2 ? 1 : s < 4.2 ? 1 : s < 4.35 ? 1-step(4.2,4.35) : s < 6.5 ? 1 : s < 6.65 ? 1-step(6.5,6.65) : s < 8.8 ? 1 : s < 8.95 ? 1-step(8.8,8.95) : 1;
  const title = s >= 8.8;
  const pathProgress = s < 2 ? step(0,2,ease.draw)*0.44 : s < 4.2 ? 0.44+step(2,4.2,ease.draw)*0.26 : s < 6.5 ? 0.70+step(4.2,6.5,ease.draw)*0.18 : s < 8.8 ? 0.88+step(6.5,8.8,ease.draw)*0.12 : 1;
  const under = step(8.8,10.8,ease.snap);
  return <FaRoot family="Estedad" style={{background:"#eee7d9", color:"#202b2b", overflow:"hidden"}}>
    <AbsoluteFill style={{background:"radial-gradient(ellipse at 52% 44%, rgba(255,255,255,.68), transparent 63%), linear-gradient(145deg,#f3eee4,#e7dece)"}} />
    <AbsoluteFill style={{inset:72, border:"1px solid rgba(32,43,43,.12)", borderRadius:34, boxShadow:"inset 0 0 50px rgba(73,58,38,.045)"}} />
    <div style={{position:"absolute",top:390,left:110,right:110,height:700,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg viewBox="0 0 860 650" style={{position:"absolute",width:"100%",height:"100%",overflow:"visible",filter:"drop-shadow(0 12px 12px rgba(25,35,34,.15))"}}>
        <path d="M430 76 C250 76 150 220 190 350 C220 448 350 490 430 430 C510 370 510 250 430 210 C350 170 280 220 280 300 C280 350 320 380 365 380 L580 380 Q700 380 700 500 L700 560 Q700 610 650 610 L220 610 Q170 610 170 560 L170 520" fill="none" stroke="#263738" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" pathLength="1000" strokeDasharray="1000" strokeDashoffset={1000-pathProgress*1000}/>
        <circle cx="430" cy="130" r={s<2?11:7} fill="#b77d58" opacity={s<2?1:step(2,2.35)} />
        <circle cx="170" cy="520" r="5" fill="#b77d58" opacity={step(8.5,8.8)} />
      </svg>
    </div>
    <div style={{position:"absolute",top:title?1110:1240,left:95,right:95,textAlign:"center",fontSize:title?104:92,fontWeight:700,lineHeight:1.55,opacity:tOpacity,transform:`translateY(${(1-tOpacity)*15}px)`,textShadow:"0 5px 15px rgba(39,45,40,.09)"}}>{text}</div>
    {title && <div style={{position:"absolute",top:1300,left:"24%",width:"52%",height:8,borderRadius:10,background:"#b77d58",transform:`scaleX(${under})`,transformOrigin:"center",boxShadow:"0 5px 14px rgba(98,62,39,.22)"}}/>}
    <div style={{position:"absolute",bottom:155,left:0,right:0,textAlign:"center",fontSize:24,color:"rgba(32,43,43,.55)",letterSpacing:0}}>پرسش، راهِ آغاز است</div>
  </FaRoot>;
};
