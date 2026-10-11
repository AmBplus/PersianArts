// پایان‌بندی «دانا» — دو حالت:
//   fast (B4، کلایمکس اول): فرود سریع مارک + وردمارک، پالس روی ضرب ۲۸٫۵۶، بدون شعار.
//   full (E3، پایان): فرود کامل + خط طلایی + دو خط شعار (سامانهٔ جامع آموزش + مرکز فناوری اطلاعات…)
// الگوی حرکتی از کارت logo-shrink-wordmark-lockup (جمع‌شدن 5.4→1 با ترمز، جابه‌جایی مارک،
// ورود وردمارک با برش از راست، فید تأخیری شعار) بازسازی شده برای برند دانا.
// لوگو همیشه تصویر شفاف PNG برند است (بدون هیچ زمینه یا شبح سفید) — نسخهٔ رنگی فقط.
import React from "react";
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame, Easing} from "remotion";
import {FaFonts} from "../../persian/src/demos/_fa";

const NAVY = "#040A22";
const GOLD = "#F2B84B";
const ICE = "#EAF2FF";

const MARK = {w: 430, h: 471};
const WORDMARK_TEXT = "دانا";

const TAG1 = "سامانهٔ جامع آموزش";
const TAG2 = "مرکز فناوری اطلاعات دانشگاه آزاد اسلامی واحد مشهد";

export const LogoLockupFa: React.FC<{mode?: "fast" | "full"}> = ({mode = "full"}) => {
  const frame = useCurrentFrame();
  const fast = mode === "fast";
  const cl = (a: number, b: number, from: number, to: number, ease = Easing.inOut(Easing.cubic)) =>
    interpolate(frame, [a, b], [from, to], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease});

  const dEnd = fast ? 18 : 38; // فرود مارک
  const brake = Math.sin(cl(dEnd - 4, dEnd + 9, 0, 1, Easing.inOut(Easing.quad)) * Math.PI) * 0.06;
  const shift0 = fast ? 20 : 40;
  const markScale = cl(fast ? 0 : 2, dEnd, 5.4, 1) * (1 + brake) * cl(shift0, fast ? 42 : 62, 1, 0.92);
  const enterOp = cl(0, fast ? 4 : 6, 0, 1, Easing.out(Easing.cubic));
  const enterBlur = cl(0, fast ? 6 : 10, 18, 0);
  const cx = cl(shift0, fast ? 42 : 62, 960, 1120);

  const w0 = fast ? 18 : 58;
  const wordReveal = cl(w0, w0 + 14, 0, 1, Easing.out(Easing.cubic));
  const wordSlide = (1 - wordReveal) * 8;

  const pulseAt = fast ? 130 : 120; // ضرب آخر موسیقی: ۲۸٫۵۶ (fast) و ۶۴٫۳ (full)
  const pulse = 1 + Math.sin(cl(pulseAt - 2, pulseAt + 8, 0, 1) * Math.PI) * (fast ? 0.04 : 0.03);
  const halo = fast
    ? Math.sin(cl(pulseAt - 4, pulseAt + 10, 0, 1) * Math.PI) * 0.3
    : Math.sin(cl(pulseAt - 4, pulseAt + 12, 0, 1) * Math.PI) * 0.25;

  const ruleW = fast ? 0 : cl(88, 100, 0, 380, Easing.out(Easing.cubic));
  const tag1Op = fast ? 0 : cl(95, 113, 0, 1, Easing.out(Easing.cubic));
  const tag2Op = fast ? 0 : cl(105, 125, 0, 1, Easing.out(Easing.cubic));
  const tagY = cl(95, 115, 14, 0, Easing.out(Easing.cubic));
  const exitOp = fast ? 1 - cl(140, 146, 0, 1) : 1; // fast بعد از پالس محو می‌شود تا فصل ویژگی‌ها باز شود

  const markH = fast ? 340 : 300;
  const markW = markH * (MARK.w / MARK.h);
  const markLeft = cx - markW / 2;
  const wordFs = fast ? 170 : 150;
  const wordRight = markLeft - 46;
  const midY = fast ? 500 : 500;

  return (
    <FaFonts families={["Vazirmatn", "Amiri"]}>
      <AbsoluteFill style={{backgroundColor: NAVY, opacity: exitOp}}>
        <AbsoluteFill style={{background: `radial-gradient(900px 600px at 50% 46%, rgba(11,31,92,0.5), transparent 70%)`}}/>
        <AbsoluteFill style={{transform: `scale(${pulse})`, transformOrigin: "50% 46%"}}>
          <div
            style={{
              position: "absolute",
              left: cx - 330,
              top: midY - 330,
              width: 660,
              height: 660,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(242,184,75,${halo}) 0%, rgba(242,184,75,0) 62%)`,
            }}
          />
          {/* مارک رنگیِ شفاف — بدون هیچ نسخهٔ سفید/شبح */}
          <div
            style={{
              position: "absolute",
              left: markLeft,
              top: midY - markH / 2,
              width: markW,
              height: markH,
              opacity: enterOp,
              filter: `blur(${enterBlur}px)`,
              transform: `scale(${markScale})`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("assets/logo-mark@2x.png")}
              alt=""
              style={{position: "absolute", inset: 0, width: "100%", height: "100%"}}
            />
          </div>
          {/* تکسِ وکتوری «دانا» (Amiri — هم‌خانوادهٔ افتتاحیهٔ فیلم): برش از راست به چپ */}
          <div
            style={{
              position: "absolute",
              right: 1920 - wordRight,
              top: midY - wordFs * 0.75,
              height: wordFs * 1.5,
              overflow: "hidden",
              opacity: wordReveal,
              transform: `translateX(${wordSlide}px)`,
              clipPath: `inset(0 0 0 ${(1 - wordReveal) * 100}%)`,
            }}
          >
            <div
              style={{
                fontFamily: '"Amiri", "Vazirmatn", serif',
                fontWeight: 700,
                fontSize: wordFs,
                lineHeight: 1.5,
                letterSpacing: 0,
                color: ICE,
                direction: "rtl",
                whiteSpace: "pre",
              }}
            >
              {WORDMARK_TEXT}
            </div>
          </div>
          {!fast && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 960 - ruleW / 2,
                  top: 762,
                  width: ruleW,
                  height: 3,
                  borderRadius: 2,
                  background: GOLD,
                  opacity: ruleW > 4 ? 0.9 : 0,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 800,
                  textAlign: "center",
                  fontFamily: '"Vazirmatn", sans-serif',
                  fontWeight: 700,
                  fontSize: 46,
                  lineHeight: 1.5,
                  letterSpacing: 0,
                  color: ICE,
                  direction: "rtl",
                  opacity: tag1Op,
                  transform: `translateY(${tagY}px)`,
                }}
              >
                {TAG1}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 884,
                  textAlign: "center",
                  fontFamily: '"Vazirmatn", sans-serif',
                  fontWeight: 600,
                  fontSize: 36,
                  lineHeight: 1.5,
                  letterSpacing: 0,
                  color: GOLD,
                  direction: "rtl",
                  opacity: tag2Op,
                }}
              >
                {TAG2}
              </div>
            </>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    </FaFonts>
  );
};
