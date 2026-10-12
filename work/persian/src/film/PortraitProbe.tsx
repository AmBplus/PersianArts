import React from "react";
import {FaRoot} from "../demos/_fa";

const SAFE = 160; // large safe margin (px) on all sides
export const PortraitProbe: React.FC = () => (
  <FaRoot family="Vazirmatn" style={{background: "#10141c", color: "#f4efe6"}}>
    <div style={{position: "absolute", inset: SAFE, display: "flex", flexDirection: "column", justifyContent: "center", gap: 64, letterSpacing: 0, textAlign: "right"}}>
      <div style={{fontSize: 150, fontWeight: 800, lineHeight: 1.4, color: "#e8b04a"}}>هنر ایرانی در حرکت</div>
      <div style={{fontSize: 140, fontWeight: 600, lineHeight: 1.3}}>۱۲۳</div>
      <div style={{fontSize: 64, fontWeight: 400, lineHeight: 1.8}}>این یک خط آزمایشی است تا ببینیم حروف به‌درستی به هم می‌چسبند.</div>
    </div>
  </FaRoot>
);
