// Persian localization of list-stack-press — element-by-element decisions:
// - Replace the baked page/card screenshots with DOM Persian text; the opaque
//   page surface and slot masks prevent any original Chinese/English raster text
//   from leaking during flights. Keep the source card bounds and slot timing.
// - Brand/nav, title/subtitle, filter, date/summary rule and all card prose use RTL.
//   Header contents share cards[0].x/w, so the initial camera zoom cannot crop
//   their right edge and the counter's separate screen-space rail stays clear.
//   Persian line boxes use FA_LH; compact header rows end before the first slot.
// - Filter moves to the left of the RTL title. Date/count and update metadata
//   follow RTL order; the full-width bar background stays physically symmetric.
// - Rank/upvote markers keep their meaning (#۱ / ↑ ۶۳ رای). Identifiers retain
//   periods and Latin digits in bdi LTR islands; arXiv/HuggingFace are brand tokens.
//   Summary gets «خلاصه:» (TL;DR); footer restores «همهٔ مقاله‌ها بارگذاری شد».
// - Counter mirrors top-right → top-left, including text anchor, flex alignment
//   and scale origin. Numeric order and continuous 8f rolls stay physical/LTR.
//   Only its zero uses the Latin 0 glyph: Persian ۰ is a tiny ring at this size.
//   Fixed-width cells with a taller line box fit the Persian digits; moving clips
//   during rolls are the source odometer effect, settled glyphs are fully visible.
// - Project highlight grows from the right; trailing border is on the left.
//   It lives inside the actual tag row, rather than at a percentage of card height.
//   Last-card fade ends at f87 (source prompt's explicit end-of-shot compression).
// - Glaze mirrors right anchor, -14deg tilt and 270deg gradient, following RTL.
// - Keep vertical gravity/flights, camera follow, alternating ±2deg tilts,
//   compression, shadows, cues, easing, scale and duration; these express physics.
// - Vazirmatn is loaded by FaRoot: a restrained variable-weight product/feed face.
//   Whole Persian runs retain joining, no tracking/uppercase or character boxes.
// "堆叠有重量"：每张新卡落上来，已落定的整摞被压下再弹回——物理反馈里读出
// "这是实打实攒下来的东西"。参考实现从 template ScenePapers 剥离：
// 预备拍（计数器先于首卡 4–6f 亮起微缩，把视线引到堆叠区）；5 卡 12f 等距节拍
// 从底部 600px 升入（交替 ±2° 倾斜收平 + scale 1.06→1）；后一张到场时整摞压下
// 6px、8f 弹回（stackPress 脉冲——"有重量"的关键一笔）；落地后高亮条滞后 2–4f
// 长出；收尾一道 glaze 扫光掠过整摞；屏幕空间 DigitRoll 计数器落一张滚一格。
// 正视机位（堆叠/列表镜头必须正视，Q6），相机跟随堆叠向下。
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { PageCam2D, CamKey2D } from '../../_fixtures/PageCam2D';
import layout from '../../_textures/live-layout.json';
import { FaRoot, faDigits, faText, fs, FA_LH } from '../../_fa';

export const LIST_STACK_PRESS_DURATION = 88; // 18–88f 落在 shot 内 offset 0

const cards = layout.papers.cards;
const PAGE_H = layout.papers.pageH;
const AMBER = 'oklch(52% 0.115 65)';
const PAPERS = [
  { title: 'پیش‌بینی فرسایش کالیبراسیون حسگر با ترنسفورمرهای کوچک', meta: 'پژوهشگران', summary: 'مدل سبکِ توجه، رانش حسگر را زودتر از روش‌های آماری تشخیص می‌دهد.', tag: 'هشدار زودهنگام رانش', note: 'آزمون‌های اولیه، امکان استفاده از این روش را در پایش بلادرنگ نشان می‌دهند.' },
  { title: 'چه زمانی باید پرسش را به مدل بزرگ‌تر سپرد؟', meta: 'نویسندگان: د. رایت و ا. ریدر', summary: 'کالیبراسیون اطمینان در واگذاری مرحله‌ای، هزینهٔ استنتاج را کاهش می‌دهد.', tag: 'زنجیرهٔ واگذاری مدل', note: 'آستانهٔ اطمینان، تعادل میان هزینه و دقت را بهتر می‌کند.' },
  { title: 'عامل‌های پژوهشی، زمان‌بندی یادگیری را بهبود می‌دهند', meta: 'گروه یادگیری ماشین', summary: 'عامل‌های خودبهبودگر در حلقهٔ پژوهش، برنامه‌های نرخ یادگیری را می‌آزمایند.', tag: 'حلقهٔ پژوهش خودکار', note: 'نتیجه‌ها از بهبود نسبت به خط پایه در چند آزمایش خبر می‌دهند.' },
  { title: 'لهجه‌های مصنوعی، شکاف بازشناسی گفتار را کم می‌کنند', meta: 'آزمایشگاه گفتار', summary: 'افزودن دادهٔ لهجه‌های کم‌منبع، نرخ خطای واژه را پایین می‌آورد.', tag: 'بازشناسی مقاوم به لهجه', note: 'روش ارزیابی، مقایسهٔ منصفانهٔ لهجه‌ها را ممکن می‌کند.' },
  { title: 'عامل‌های چندروزه برای کارهای نرم‌افزاری بلندمدت', meta: 'پژوهشگران سامانه‌ها', summary: 'حافظهٔ چندلایه به عامل کمک می‌کند کارهای طولانی را پیگیری کند.', tag: 'برنامه‌نویسی افق‌بلند', note: 'این نتیجه می‌تواند مبنای آزمون‌های بعدی روی وظایف چندمرحله‌ای باشد.' },
];

const CUES = [6, 18, 30, 42, 54]; // 首卡前留 6f 给计数器预备拍（anticipation）
const DUR = 22;
const FLY_EASE = Easing.bezier(0.45, 0.05, 0.25, 1.12);
const TILTS = [2, -2, 2, -2, 2];

// 预备拍：计数器先于首卡亮起 + 微缩 (0.96→1)，把视线引到堆叠区（段落级一次）
const ANTICIPATE_START = 0;
const ANTICIPATE_END = 6;

const CAM_KEYS: CamKey2D[] = [
  { frame: 0, cx: 960, cy: 270, zoom: 1.35 },
  { frame: 12, cx: 960, cy: 330, zoom: 1.15 },
  { frame: 18, cx: 960, cy: 520, zoom: 1.02 },
  { frame: 56, cx: 960, cy: 820, zoom: 0.95 },
  { frame: 82, cx: 960, cy: 860, zoom: 0.9 },
];

// odometer digit column —— 连续里程计，不重挂：`pos` 是数字带上的连续位置
// （0→5），每张卡落地让 pos 多滚进一格。单格滚动必须短于 12f 落卡间距、
// 且最后一格在镜头结束前落定——key 重挂从 0 重滚 22f 的写法两条都踩
// （前一格永远滚不完、尾帧停在 4）。
const DIGITS = '0۱۲۳۴۵۶۷۸۹';
const ROLL_DUR = 8; // 单格滚动帧数，< 12f 落卡间距
const DigitRoll: React.FC<{ pos: number; lineH: number; color: string }> = ({ pos, lineH, color }) => (
  <span style={{ display: 'inline-flex', direction: 'ltr', width: 88, overflow: 'hidden', height: lineH, verticalAlign: 'bottom' }}>
    <span style={{ display: 'inline-block', height: lineH }}>
      <span style={{ display: 'block', transform: `translateY(${-pos * lineH}px)` }}>
        {(DIGITS + DIGITS).split('').map((d, j) => (
          <span key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: lineH, fontSize: fs(96), lineHeight: FA_LH, color, fontVariantNumeric: 'tabular-nums' }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  </span>
);

export const ListStackPress: React.FC = () => {
  const frame = useCurrentFrame();
  // 计数器连续位置：每张卡落地（cue+DUR）时向前滚一格，8f 滚定。
  // 最后一张 f76 落地、f84 滚定，早于 f88 镜头结束。
  let rollPos = 0;
  for (const c of CUES) {
    rollPos += interpolate(frame, [c + DUR, c + DUR + ROLL_DUR], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 0.8, 0.25, 1),
    });
  }

  // 预备拍：计数器 0→6f 从 scale 0.96 微缩回 1 并亮起，视线先引到堆叠区
  const antT = interpolate(frame, [ANTICIPATE_START, ANTICIPATE_END], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
  });
  const counterScale = 0.96 + 0.04 * antT;
  const counterOpacity = 0.3 + 0.7 * antT;

  // when a *later* card enters, the settled stack gets pressed down 6px then
  // springs back over ~8 frames
  const stackPress = (settledIndex: number) => {
    let press = 0;
    for (let j = settledIndex + 1; j < CUES.length; j++) {
      const cue = CUES[j];
      const p = interpolate(frame, [cue, cue + 4, cue + 8], [0, 6, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      });
      press = Math.max(press, p);
    }
    return press;
  };

  // glaze sweep once everything has landed (~78)
  const glazeX = interpolate(frame, [64, 78], [-700, 2600], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.35, 1),
  });
  const glazeVis = interpolate(frame, [63, 68, 74, 77], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#faf7f2' }}>
      <FaRoot family="Vazirmatn">
      <PageCam2D src="textures/live/papers-full.png" pageH={PAGE_H} keys={CAM_KEYS}>
        <div style={{ position: 'absolute', inset: 0, background: '#faf7f2' }} />
        <div style={{ position: 'absolute', inset: '0 0 auto', height: 62, background: '#fffdfa', borderBottom: '1px solid #e8e2d9' }}>
          <div style={{ position: 'absolute', left: cards[0].x, width: cards[0].w, height: '100%', display: 'flex', alignItems: 'center', gap: 24, color: '#514a42', fontSize: fs(18), lineHeight: FA_LH }}>
            <strong style={{ color: '#211e1b', fontSize: fs(22) }}>آزمایشگاه بنیاد هوش مصنوعی</strong><span>گزارش‌ها</span><span>مقاله‌ها</span>
          </div>
        </div>
        <div style={{ position: 'absolute', left: cards[0].x, width: cards[0].w, top: 88, height: 116, color: '#292521', lineHeight: FA_LH }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: fs(24), fontWeight: 750 }}>تازه‌های پژوهش</div>
            <div style={{ fontSize: fs(13), padding: '5px 14px', border: '1px solid #e6dfd5', borderRadius: 6, background: '#fffdfa', color: '#79736d' }}>فیلتر</div>
          </div>
          <div style={{ fontSize: fs(16), color: '#79736d', marginTop: 4 }}>مقاله‌های تازه در یادگیری ماشین و هوش مصنوعی</div>
          <div style={{ position: 'absolute', insetInlineStart: 0, top: 86, width: '100%', borderBottom: '1px solid #e6dfd5', paddingBottom: 5, display: 'flex', justifyContent: 'space-between', fontSize: fs(13), color: '#77716a' }}><span><bdi dir="ltr">{faDigits('2026-07-05')}</bdi> · {faDigits(5)} مقالهٔ تازه</span><span>به‌روزرسانی روزانه · خلاصهٔ {faDigits(31)} مقاله</span></div>
        </div>
        {/* blank card slots fade as Persian cards land */}
        {cards.map((c, i) => (
          <div
            key={`slot-${i}`}
            style={{
              position: 'absolute', left: c.x - 12, top: c.y - 10,
              width: c.w + 24, height: c.h + 20, background: '#faf7f2',
              opacity: frame >= CUES[i] + DUR - 2 ? 0 : 1,
            }}
          />
        ))}

        {cards.map((c, i) => {
          const cue = CUES[i];
          const t = interpolate(frame, [cue, cue + DUR], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: FLY_EASE,
          });
          if (t <= 0) return null;
          const settled = t >= 0.999;
          const dy = 600 * (1 - t) + (settled ? stackPress(i) : 0);
          const rot = TILTS[i] * (1 - t);
          const scale = 1.06 - 0.06 * t;
          const shadow = settled
            ? '0 2px 8px rgba(60,45,30,.10)'
            : `0 32px 64px rgba(60,45,30,${0.22 * (1 - t) + 0.06})`;

          // amber highlight over the linked-project name, after landing
          const hlStart = cue + DUR;
          const hlGrow = interpolate(frame, [hlStart, hlStart + 7], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
          });
          const hlFade = interpolate(frame, [hlStart + 7, i === cards.length - 1 ? LIST_STACK_PRESS_DURATION - 1 : hlStart + 12], [1, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });

          return (
            <div
              key={PAPERS[i].tag}
              style={{
                position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h,
                transform: `translateY(${dy}px) rotate(${rot}deg) scale(${scale})`,
                transformOrigin: 'center center', boxShadow: shadow, borderRadius: 12,
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: '#fffdfa', border: '1px solid #e6dfd5', borderRadius: 12, padding: '19px 21px', boxSizing: 'border-box', direction: 'rtl', fontFamily: 'Vazirmatn', color: '#282521', lineHeight: FA_LH, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: fs(13), color: '#817970', marginBottom: 8 }}><span><bdi dir="ltr">#{faDigits(i + 1)}</bdi> · <bdi dir="ltr">↑ {faDigits([63,51,87,44,72][i])}</bdi> رای</span><span>{PAPERS[i].meta.split(' · پیش‌چاپ')[0]} · <bdi dir="ltr">arXiv:2607.0100{i + 1}</bdi> · <bdi dir="ltr">HuggingFace ↗</bdi></span></div>
                <div style={{ fontSize: fs(19), lineHeight: FA_LH, fontWeight: 750, whiteSpace: 'nowrap' }}>{PAPERS[i].title}</div>
                <div style={{ fontSize: fs(13), color: '#726c65', marginTop: 4 }}>خلاصه: {PAPERS[i].summary}</div>
                <div style={{ borderTop: '1px solid #ebe5dc', marginTop: 12, paddingTop: 8, fontSize: fs(12), color: '#847d75' }}>مرتبط با پروژه</div>
                <div style={{ position: 'relative', fontSize: fs(14), color: '#a45a21', fontWeight: 700, marginTop: 2 }}>
                  {PAPERS[i].tag}
                  {hlGrow > 0 && hlFade > 0 ? (
                    <div style={{ position: 'absolute', right: 0, top: 0, width: hlGrow * c.w * 0.4, height: '100%', background: 'oklch(97% 0.028 85)', opacity: 0.6 * hlFade, borderLeft: `2px solid ${AMBER}`, pointerEvents: 'none' }} />
                  ) : null}
                </div>
                <div style={{ fontSize: fs(12), color: '#59544e', marginTop: 3, whiteSpace: 'nowrap' }}>{PAPERS[i].note}</div>
              </div>
            </div>
          );
        })}

        <div style={{ position: 'absolute', left: cards[0].x, width: cards[0].w, top: cards[4].y + cards[4].h + 20, textAlign: 'center', fontSize: fs(12), lineHeight: FA_LH, color: '#847d75' }}>همهٔ مقاله‌ها بارگذاری شد</div>

        {/* page-space glaze sweeps in the RTL reading direction */}
        <div
          style={{
            position: 'absolute', top: 40, height: PAGE_H - 80, right: glazeX, width: 420,
            transform: 'rotate(-14deg)', opacity: glazeVis * 0.5, mixBlendMode: 'overlay',
            background: 'linear-gradient(270deg, transparent, rgba(255,240,214,0.9) 45%, rgba(255,240,214,0.9) 55%, transparent)',
            pointerEvents: 'none',
          }}
        />
      </PageCam2D>

      {/* screen-space counter, top-left — lands one digit per card */}
      <div
        style={{
          position: 'absolute', top: 70, left: 96, width: 210, textAlign: 'left', lineHeight: FA_LH, direction: 'rtl', fontFamily: 'Vazirmatn',
          pointerEvents: 'none', opacity: counterOpacity,
          transform: `scale(${counterScale})`, transformOrigin: 'top left',
        }}
      >
        <div style={{ ...faText(24), color: 'oklch(50% 0.006 82)', fontWeight: 650 }}>
          رادار مقاله
        </div>
        <div style={{ display: 'flex', direction: 'ltr', justifyContent: 'flex-start', marginTop: 6 }}>
          <DigitRoll pos={rollPos} lineH={fs(96) * FA_LH} color={AMBER} />
        </div>
        <div style={{ ...faText(20), color: 'oklch(50% 0.006 82)', marginTop: 4 }}>
          از {faDigits(31)} مقالهٔ امروز
        </div>
      </div>
      </FaRoot>
    </AbsoluteFill>
  );
};
