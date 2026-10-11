// Persian localization of list-stack-press.
// RTL decisions: the feed's text and metadata are right-aligned; the screen-space
// counter moves from top-right to top-left to mirror reading order; the glaze
// sweep changes from left-to-right to right-to-left. The page remains centered,
// vertical camera follow and gravity-driven card entrances stay physical, and
// alternating ±2° card tilts retain their designed balance.
// Raster handling: the source screenshot plate and five card screenshots contain
// baked Chinese/English UI and paper titles. Rebuilt the plate and card surfaces
// as Persian DOM text; no source screenshot text remains visible.
// Font: Vazirmatn, a variable-weight neutral Persian UI face with reliable glyph
// coverage, matching the restrained academic feed rather than the source Latin mono.
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
import { FaRoot, faDigits, faText, fs } from '../../_fa';

export const LIST_STACK_PRESS_DURATION = 88; // 18–88f 落在 shot 内 offset 0

const cards = layout.papers.cards;
const PAGE_H = layout.papers.pageH;
const AMBER = 'oklch(52% 0.115 65)';
const PAPERS = [
  { title: 'پیش‌بینی فرسایش کالیبراسیون حسگر با ترنسفورمرهای کوچک', meta: 'پژوهشگران · پیش‌چاپ ۲۶۰۷٫۰۱۰۰۱', summary: 'مدل سبکِ توجه، رانش حسگر را زودتر از روش‌های آماری تشخیص می‌دهد.', tag: 'هشدار زودهنگام رانش', note: 'آزمون‌های اولیه، امکان استفاده از این روش را در پایش بلادرنگ نشان می‌دهند.' },
  { title: 'چه زمانی باید پرسش را به مدل بزرگ‌تر سپرد؟', meta: 'نویسندگان: د. رایت و ا. ریدر · پیش‌چاپ ۲۶۰۷٫۰۱۰۰۲', summary: 'کالیبراسیون اطمینان در واگذاری مرحله‌ای، هزینهٔ استنتاج را کاهش می‌دهد.', tag: 'زنجیرهٔ واگذاری مدل', note: 'آستانهٔ اطمینان، تعادل میان هزینه و دقت را بهتر می‌کند.' },
  { title: 'عامل‌های پژوهشی، زمان‌بندی یادگیری را بهبود می‌دهند', meta: 'گروه یادگیری ماشین · پیش‌چاپ ۲۶۰۷٫۰۱۰۰۳', summary: 'عامل‌های خودبهبودگر در حلقهٔ پژوهش، برنامه‌های نرخ یادگیری را می‌آزمایند.', tag: 'حلقهٔ پژوهش خودکار', note: 'نتیجه‌ها از بهبود نسبت به خط پایه در چند آزمایش خبر می‌دهند.' },
  { title: 'لهجه‌های مصنوعی، شکاف بازشناسی گفتار را کم می‌کنند', meta: 'آزمایشگاه گفتار · پیش‌چاپ ۲۶۰۷٫۰۱۰۰۴', summary: 'افزودن دادهٔ لهجه‌های کم‌منبع، نرخ خطای واژه را پایین می‌آورد.', tag: 'بازشناسی مقاوم به لهجه', note: 'روش ارزیابی، مقایسهٔ منصفانهٔ لهجه‌ها را ممکن می‌کند.' },
  { title: 'عامل‌های چندروزه برای کارهای نرم‌افزاری بلندمدت', meta: 'پژوهشگران سامانه‌ها · پیش‌چاپ ۲۶۰۷٫۰۱۰۰۵', summary: 'حافظهٔ چندلایه به عامل کمک می‌کند کارهای طولانی را پیگیری کند.', tag: 'برنامه‌نویسی افق‌بلند', note: 'این نتیجه می‌تواند مبنای آزمون‌های بعدی روی وظایف چندمرحله‌ای باشد.' },
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
const DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ROLL_DUR = 8; // 单格滚动帧数，< 12f 落卡间距
const DigitRoll: React.FC<{ pos: number; lineH: number; color: string }> = ({ pos, lineH, color }) => (
  <span style={{ display: 'inline-flex', overflow: 'hidden', height: lineH, verticalAlign: 'bottom' }}>
    <span style={{ display: 'inline-block', height: lineH }}>
      <span style={{ display: 'block', transform: `translateY(${-pos * lineH}px)` }}>
        {(DIGITS + DIGITS).split('').map((d, j) => (
          <span key={j} style={{ display: 'block', fontSize: fs(96), lineHeight: `${lineH}px`, color, fontVariantNumeric: 'tabular-nums' }}>
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
        <div style={{ position: 'absolute', inset: '0 0 auto', height: 106, background: '#fffdfa', borderBottom: '1px solid #e8e2d9', display: 'flex', alignItems: 'center', padding: '0 215px', gap: 24, direction: 'rtl', color: '#514a42', fontSize: fs(22), fontFamily: 'Vazirmatn' }}>
          <strong style={{ color: '#211e1b', fontSize: fs(25) }}>آزمایشگاه بنیاد هوش مصنوعی</strong><span>گزارش‌ها</span><span>مقاله‌ها</span>
        </div>
        <div style={{ position: 'absolute', left: 215, right: 215, top: 132, height: 62, direction: 'rtl', fontFamily: 'Vazirmatn', color: '#292521' }}>
          <div style={{ fontSize: fs(27), fontWeight: 750 }}>تازه‌های پژوهش</div>
          <div style={{ fontSize: fs(16), color: '#79736d', marginTop: 4 }}>مقاله‌های تازه در یادگیری ماشین و هوش مصنوعی</div>
          <div style={{ position: 'absolute', insetInlineStart: 0, top: 70, width: '100%', borderBottom: '1px solid #e6dfd5', paddingBottom: 10, display: 'flex', justifyContent: 'space-between', fontSize: fs(14), color: '#77716a' }}><span>امروز · {faDigits(5)} مقالهٔ تازه</span><span>به‌روزرسانی روزانه</span></div>
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
          const hlFade = interpolate(frame, [hlStart + 7, hlStart + 12], [1, 0], {
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
              <div style={{ position: 'absolute', inset: 0, background: '#fffdfa', border: '1px solid #e6dfd5', borderRadius: 12, padding: '19px 21px', boxSizing: 'border-box', direction: 'rtl', fontFamily: 'Vazirmatn', color: '#282521', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: fs(13), color: '#817970', marginBottom: 8 }}><span>{faDigits(i + 1)} · {faDigits([63,51,87,44,72][i])} رأی</span><span>{PAPERS[i].meta}</span></div>
                <div style={{ fontSize: fs(19), lineHeight: 1.45, fontWeight: 750, whiteSpace: 'nowrap' }}>{PAPERS[i].title}</div>
                <div style={{ fontSize: fs(13), color: '#726c65', marginTop: 4 }}>{PAPERS[i].summary}</div>
                <div style={{ borderTop: '1px solid #ebe5dc', marginTop: 12, paddingTop: 8, fontSize: fs(12), color: '#847d75' }}>مرتبط با پروژه</div>
                <div style={{ fontSize: fs(14), color: '#a45a21', fontWeight: 700, marginTop: 2 }}>{PAPERS[i].tag}</div>
                <div style={{ fontSize: fs(12), color: '#59544e', marginTop: 3, whiteSpace: 'nowrap' }}>{PAPERS[i].note}</div>
              </div>
              {hlGrow > 0 && hlFade > 0 ? (
                <div
                  style={{
                    position: 'absolute', right: 20, top: c.h * 0.72,
                    width: `${hlGrow * 40}%`, height: 30,
                    background: 'oklch(97% 0.028 85)', opacity: 0.6 * hlFade,
                    borderLeft: `2px solid ${AMBER}`, pointerEvents: 'none',
                  }}
                />
              ) : null}
            </div>
          );
        })}

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
          position: 'absolute', top: 70, left: 96, textAlign: 'left', direction: 'rtl', fontFamily: 'Vazirmatn',
          pointerEvents: 'none', opacity: counterOpacity,
          transform: `scale(${counterScale})`, transformOrigin: 'top right',
        }}
      >
        <div style={{ ...faText(24), color: 'oklch(50% 0.006 82)', fontWeight: 650 }}>
          رادار مقاله
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <DigitRoll pos={rollPos} lineH={96 * 1.15} color={AMBER} />
        </div>
        <div style={{ ...faText(20), color: 'oklch(50% 0.006 82)', marginTop: 4 }}>
          از {faDigits(31)} مقالهٔ امروز
        </div>
      </div>
      </FaRoot>
    </AbsoluteFill>
  );
};
