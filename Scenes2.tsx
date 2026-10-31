import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {
  AnimatedTitle,
  ClodIcon,
  ClothIcon,
  CrossMark,
  InfoCard,
  NumberBadge,
  Particles,
  PopIn,
  QiblaIcon,
  ShieldIcon,
  SittingCheck,
  SlideIn,
  StandingCross,
  StarIcon,
  StepArrow,
  TissueIcon,
  WaterDrop,
} from './Motion';
import {
  COLORS,
  FONT_FAMILY,
  FPS,
  KEY_MS,
  LAYOUT_B,
  SPRING_POP,
  WIDTH,
  ZONES,
  easeOutCubic,
  getScene,
  msToFrame,
  progressBetween,
  type SceneId,
} from './Theme';

/**
 * Scenes2.tsx — ধাপ ৭ এর ২য় ব্যাচ: S5–S8 (mdmk02.md ৭.৫–৭.৮)
 *
 *  ৭.৫ S5 সুন্নাহ ১  (ফ্রেম  548– 660)  Layout A — কেবলার দিকে মুখ বা পিঠ করে না বসা
 *  ৭.৬ S6 সুন্নাহ ২  (ফ্রেম  655– 865)  Layout A — ২ক সতর ঢাকা • ২খ বসে করা • ২গ দাঁড়িয়ে না করা
 *  ৭.৭ S7 সুন্নাহ ৩  (ফ্রেম  862–1065)  Layout A — নাপাক পানি/প্রস্রাব থেকে সতর্কতার সাথে বেঁচে থাকা
 *  ৭.৮ S8 সুন্নাহ ৪  (ফ্রেম 1063–1305)  Layout B — ঢিলা-কুলুপ/টয়লেট পেপার → পানি (প্রবাহ)
 *
 * সব সময় **লোকাল ফ্রেমে** (সিনের শুরু = ০)। `lf(ms, id)` = JSON এর মিলিসেকেন্ড → ঐ সিনের লোকাল ফ্রেম।
 * গ্রাফিকের কোনো লেখা বক্তার কথার বাইরে নয়; নতুন কোনো তথ্য/হুকুম যোগ হয়নি।
 * শুধু বিদ্যমান `Motion.tsx` / `Theme.ts` ব্যবহৃত — নতুন প্যাকেজ নেই। `Scenes1.tsx` অপরিবর্তিত
 * (তাই ছোট হেল্পারগুলো `lf`, `Zone`, `Fade` এখানে আবার লেখা হয়েছে)।
 */

/* ------------------------------------------------------------------ */
/* সাহায্যকারী                                                          */
/* ------------------------------------------------------------------ */

/** মিলিসেকেন্ড → সিনের লোকাল ফ্রেম */
const lf = (ms: number, id: SceneId): number => msToFrame(ms) - getScene(id).from;

/** Layout A এর ইনফোগ্রাফিক জোন (মুখের ওপরে) */
const INFO = ZONES.info;
const INFO_H = INFO.to - INFO.from;

/** স্থির জোন: ওপর+উচ্চতা দিলে ভেতরে কেন্দ্রে বসায় */
const Zone: React.FC<{
  top: number;
  height: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({top, height, children, style}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      width: WIDTH,
      top,
      height,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT_FAMILY,
      ...style,
    }}
  >
    {children}
  </div>
);

/** সিনের শেষে নরমভাবে মিলিয়ে যাওয়া (কণা/ডেকোরেশনের জন্য) */
const Fade: React.FC<{outAt?: number; outDur?: number; children?: React.ReactNode}> = ({
  outAt,
  outDur = 8,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = outAt === undefined ? 1 : 1 - progressBetween(frame, outAt, outAt + outDur);
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

/** কার্ড/সারির সাধারণ গ্লো-স্পন্দন (০.৩–০.৮) */
const pulseGlow = (frame: number, delay: number): number =>
  0.55 + 0.25 * Math.sin(((frame - delay) / FPS) * Math.PI * 1.6);

/** সাধারণ কার্ড-ব্যাকগ্রাউন্ড (InfoCard এর মতোই) */
const CARD_BG = 'linear-gradient(135deg, rgba(18,48,74,0.92) 0%, rgba(11,27,43,0.9) 100%)';

/* ------------------------------------------------------------------ */
/* ৭.৫ S5 — সুন্নাহ ১ (21.9–26.4s) • Layout A                            */
/* ------------------------------------------------------------------ */

/** "মুখ করে ✖" / "পিঠ করে ✖" — নিষেধ-চিপ; `crossAt` এ ক্রস আঁকা হয়ে পপ করে */
const NoChip: React.FC<{text: string; delay: number; crossAt: number; exitAt: number}> = ({
  text,
  delay,
  crossAt,
  exitAt,
}) => {
  const frame = useCurrentFrame();
  const draw = progressBetween(frame, crossAt, crossAt + 12);
  const pop = spring({frame: frame - crossAt, fps: FPS, config: SPRING_POP});
  const crossScale = frame < crossAt ? 0.6 : 0.6 + 0.4 * Math.min(1.3, Math.max(0, pop));
  return (
    <SlideIn direction="up" distance={50} delay={delay} exitAt={exitAt}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.35,
          color: COLORS.white,
          backgroundColor: 'rgba(11,27,43,0.88)',
          border: `4px solid ${COLORS.coral}`,
          borderRadius: 999,
          padding: '4px 28px 12px 18px',
          whiteSpace: 'nowrap',
          boxShadow: `0 8px 22px rgba(0,0,0,0.45), 0 0 ${18 + 14 * draw}px ${COLORS.coral}`,
        }}
      >
        <div style={{transform: `scale(${crossScale})`, paddingTop: 8}}>
          <CrossMark size={48} color={COLORS.coral} draw={draw} strokeWidth={14} />
        </div>
        <span>{text}</span>
      </div>
    </SlideIn>
  );
};

/**
 * ২২.০০s "কেবলার" → NumberBadge ১ + কার্ড "কেবলার দিকে / মুখ বা পিঠ করে না বসা"; কম্পাস আঁকা হয়
 * ২২.৯৩s "মুখ"    → চিপ "মুখ করে ✖" (ক্রস আঁকা + পপ)
 * ২৪.৩৩s "পিঠ"    → চিপ "পিঠ করে ✖" (ক্রস আঁকা + পপ)
 * ২৬.১৬s "বসা" শেষ → সব প্রস্থান (পরের সিন S6 ২৬.২s এ)
 */
export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const qiblaAt = lf(KEY_MS.p1Start, 'S5'); // ≈ ২
  const faceAt = lf(KEY_MS.p1Face, 'S5'); // ≈ ২৫
  const backAt = lf(KEY_MS.p1Back, 'S5'); // ≈ ৬০
  const endAt = lf(26162, 'S5') - 8; // "বসা" শেষ ≈ ১০৬ → ৯৮
  const compass = progressBetween(frame, qiblaAt + 6, qiblaAt + 30);

  return (
    <AbsoluteFill>
      <Fade outAt={endAt}>
        <Particles
          count={14}
          seed={51}
          shape="mixed"
          colors={[COLORS.gold, COLORS.white, COLORS.teal]}
          area={{x: 0, y: INFO.from - 20, width: WIDTH, height: INFO_H + 40}}
          minSize={10}
          maxSize={24}
          opacity={0.65}
        />
      </Fade>

      <Zone top={INFO.from} height={INFO_H}>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 28}}>
          <NumberBadge value={1} color={COLORS.gold} size={190} delay={2} exitAt={endAt} />
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 16}}>
            <InfoCard
              width={732}
              title="কেবলার দিকে"
              subtitle="মুখ বা পিঠ করে না বসা"
              color={COLORS.gold}
              titleSize={60}
              subtitleSize={46}
              iconSize={134}
              delay={qiblaAt + 2}
              exitAt={endAt}
              icon={
                <QiblaIcon size={92} color={COLORS.white} accent={COLORS.gold} draw={compass} />
              }
            />
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 22}}>
              <NoChip text="মুখ করে" delay={faceAt} crossAt={faceAt + 4} exitAt={endAt} />
              <NoChip text="পিঠ করে" delay={backAt} crossAt={backAt + 4} exitAt={endAt} />
            </div>
          </div>
        </div>
      </Zone>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* ৭.৬ S6 — সুন্নাহ ২ (26.2–34.6s) • Layout A                            */
/* ------------------------------------------------------------------ */

const ROW_W = 772;
const ROW_H = 98;
const ROW_GAP = 10;
const ROWS_TOTAL = 3 * ROW_H + 2 * ROW_GAP; // ৩১৪ (জোন ৩২৬ এর ভেতরে)

/** একটা সাব-কার্ড সারি: আইকন-বৃত্ত + এক লাইন লেখা; ডান থেকে স্লাইড করে ঢোকে */
const SubRow: React.FC<{
  index: number;
  text: string;
  color: string;
  delay: number;
  exitAt: number;
  renderIcon: (draw: number) => React.ReactNode;
}> = ({index, text, color, delay, exitAt, renderIcon}) => {
  const frame = useCurrentFrame();
  const draw = progressBetween(frame, delay + 6, delay + 28);
  const glow = pulseGlow(frame, delay);
  return (
    <div style={{position: 'absolute', left: 0, top: index * (ROW_H + ROW_GAP), width: ROW_W}}>
      <SlideIn direction="left" distance={170} delay={delay} exitAt={exitAt}>
        <div
          style={{
            width: ROW_W,
            height: ROW_H,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 18,
            padding: '0 24px 0 14px',
            borderRadius: 34,
            backgroundImage: CARD_BG,
            border: `4px solid ${color}`,
            boxShadow: `0 10px 26px rgba(0,0,0,0.5), 0 0 ${28 * glow}px ${color}`,
          }}
        >
          <div
            style={{
              flex: '0 0 auto',
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${color}2e`,
              border: `3px solid ${color}`,
            }}
          >
            {renderIcon(draw)}
          </div>
          <div
            style={{
              fontFamily: FONT_FAMILY,
              fontWeight: 700,
              fontSize: 50,
              lineHeight: 1.4,
              paddingBottom: 6,
              color: COLORS.white,
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </div>
        </div>
      </SlideIn>
    </div>
  );
};

/**
 * ২৬.২০s "দুই"        → NumberBadge ২
 * ২৭.৬০s "যথাসম্ভব"   → ২ক "বসার নিকটবর্তী হয়ে সতর ঢাকা" (কাপড়/ঢাকা আইকন)
 * ৩০.৮৭s "বসিয়া"     → ২খ "বসে প্রস্রাব-পায়খানা করা" (বসা মানুষ + টিক)
 * ৩২.৭৩s "দাঁড়িয়ে"   → ২গ "দাঁড়িয়ে প্রস্রাব না করা" (দাঁড়ানো মানুষ + লাল ক্রস)
 * তিনটি সারি জায়গা নির্দিষ্ট; একটার পর একটা যোগ হয়, আগেরগুলো থাকে।
 */
export const Scene6: React.FC = () => {
  const aAt = lf(KEY_MS.p2aStart, 'S6') - 2; // ≈ ৩৩
  const bAt = lf(KEY_MS.p2bStart, 'S6') - 2; // ≈ ১১৫
  const cAt = lf(KEY_MS.p2cStart, 'S6') - 2; // ≈ ১৬১
  const endAt = lf(34562, 'S6') - 10; // "করা" শেষ ≈ ২০৯ → ১৯৯ (২০৭ এ S7 শুরু)

  return (
    <AbsoluteFill>
      <Fade outAt={endAt}>
        <Particles
          count={14}
          seed={61}
          shape="mixed"
          colors={[COLORS.sky, COLORS.white, COLORS.lime]}
          area={{x: 0, y: INFO.from - 20, width: WIDTH, height: INFO_H + 40}}
          minSize={10}
          maxSize={24}
          opacity={0.6}
        />
      </Fade>

      <Zone top={INFO.from} height={INFO_H}>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 28}}>
          <NumberBadge value={2} color={COLORS.sky} size={150} delay={0} exitAt={endAt} />
          <div style={{position: 'relative', width: ROW_W, height: ROWS_TOTAL}}>
            <SubRow
              index={0}
              text="বসার নিকটবর্তী হয়ে সতর ঢাকা"
              color={COLORS.sky}
              delay={aAt}
              exitAt={endAt}
              renderIcon={(draw) => <ClothIcon size={56} color={COLORS.white} accent={COLORS.sky} draw={draw} />}
            />
            <SubRow
              index={1}
              text="বসে প্রস্রাব-পায়খানা করা"
              color={COLORS.lime}
              delay={bAt}
              exitAt={endAt}
              renderIcon={(draw) => <SittingCheck size={56} color={COLORS.white} accent={COLORS.lime} draw={draw} />}
            />
            <SubRow
              index={2}
              text="দাঁড়িয়ে প্রস্রাব না করা"
              color={COLORS.coral}
              delay={cAt}
              exitAt={endAt}
              renderIcon={(draw) => <StandingCross size={56} color={COLORS.white} accent={COLORS.coral} draw={draw} />}
            />
          </div>
        </div>
      </Zone>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* ৭.৭ S7 — সুন্নাহ ৩ (34.5–42.6s) • Layout A                            */
/* ------------------------------------------------------------------ */

/** সতর্ক-ঢাল + "ঝিলিক" (গ্লো-ফ্ল্যাশ + ঘুরন্ত ছোট তারা) — `glintAt` এ ঝিলিক শুরু */
const GlintShield: React.FC<{delay: number; glintAt: number; exitAt: number; size?: number}> = ({
  delay,
  glintAt,
  exitAt,
  size = 110,
}) => {
  const frame = useCurrentFrame();
  const draw = progressBetween(frame, delay + 2, delay + 22);
  const g = progressBetween(frame, glintAt, glintAt + 26);
  const flash = Math.sin(Math.PI * g); // ০ → ১ → ০
  return (
    <PopIn delay={delay} exitAt={exitAt} fromScale={0.3}>
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          filter: `drop-shadow(0 0 ${8 + 30 * flash}px ${COLORS.gold}) brightness(${1 + 0.45 * flash})`,
        }}
      >
        <ShieldIcon size={size} color={COLORS.gold} draw={draw} />
        <div
          style={{
            position: 'absolute',
            right: -16,
            top: -16,
            opacity: flash,
            transform: `scale(${0.4 + 0.9 * flash}) rotate(${g * 120}deg)`,
          }}
        >
          <StarIcon size={50} color={COLORS.white} strokeWidth={3} />
        </div>
      </div>
    </PopIn>
  );
};

/**
 * ৩৪.৬০s "তিন"        → NumberBadge ৩ (৩৬–৩৮s নীরবতায় স্থির + হালকা পালস — NumberBadge এর নিজস্ব পালস)
 * ৩৮.০০s "নাপাক"      → কার্ড "নাপাক পানি বা প্রস্রাব থেকে / সতর্কতার সাথে বেঁচে থাকা" + পানির ফোঁটা আঁকা
 * ৪০.৫০s "সতর্কতার"   → ডানে ঢাল পপ + ঝিলিক
 * ৪২.৪৬s "থাকা" শেষ   → প্রস্থান (পরের সিন S8 Layout B তে ৪২.৫s এ)
 */
export const Scene7: React.FC = () => {
  const frame = useCurrentFrame();
  const badgeAt = lf(KEY_MS.threeNumber, 'S7') - 2; // ≈ ১
  const cardAt = lf(KEY_MS.p3Start, 'S7') - 2; // ≈ ৮৬
  const shieldAt = lf(KEY_MS.p3Care, 'S7') - 2; // ≈ ১৪৮
  const endAt = lf(42460, 'S7') - 10; // "থাকা" শেষ ≈ ২০০ → ১৯০
  const drop = progressBetween(frame, cardAt + 6, cardAt + 30);

  return (
    <AbsoluteFill>
      <Fade outAt={endAt}>
        <Particles
          count={16}
          seed={71}
          shape="mixed"
          colors={[COLORS.violet, COLORS.white, COLORS.sky]}
          area={{x: 0, y: INFO.from - 20, width: WIDTH, height: INFO_H + 40}}
          minSize={10}
          maxSize={26}
          opacity={0.65}
        />
      </Fade>

      <Zone top={INFO.from} height={INFO_H}>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 20}}>
          <NumberBadge value={3} color={COLORS.violet} size={140} delay={badgeAt} exitAt={endAt} />
          <InfoCard
            width={640}
            title={'নাপাক পানি বা\nপ্রস্রাব থেকে'}
            subtitle="সতর্কতার সাথে বেঁচে থাকা"
            color={COLORS.sky}
            titleSize={52}
            subtitleSize={44}
            iconSize={130}
            delay={cardAt}
            exitAt={endAt}
            style={{whiteSpace: 'pre-line'}}
            icon={<WaterDrop size={86} color={COLORS.sky} draw={drop} />}
          />
          <GlintShield delay={shieldAt} glintAt={shieldAt + 4} exitAt={endAt} />
        </div>
      </Zone>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* ৭.৮ S8 — সুন্নাহ ৪ (42.5–52.2s) • Layout B                            */
/* ------------------------------------------------------------------ */

const FLOW_A_W = 600;
const FLOW_B_W = 260;
const FLOW_H = 330;
const ARROW_LEN = 90;
const COL_W = 210;
const OR_W = 120;

/** ফ্লো-কার্ড: InfoCard এর মতো গ্লাস-কার্ড, ভেতরে যেকোনো কনটেন্ট; `boostAt` থেকে গ্লো বাড়ে */
const FlowCard: React.FC<{
  width: number;
  color: string;
  delay: number;
  exitAt: number;
  boostAt?: number;
  children?: React.ReactNode;
}> = ({width, color, delay, exitAt, boostAt, children}) => {
  const frame = useCurrentFrame();
  const boost = boostAt === undefined ? 0 : progressBetween(frame, boostAt, boostAt + 10);
  const glow = pulseGlow(frame, delay) + 0.55 * boost;
  return (
    <PopIn delay={delay} exitAt={exitAt}>
      <div
        style={{
          position: 'relative',
          width,
          height: FLOW_H,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 20px 24px',
          borderRadius: 44,
          backgroundImage: CARD_BG,
          border: `5px solid ${color}`,
          boxShadow: `0 14px 36px rgba(0,0,0,0.5), 0 0 ${34 * glow}px ${color}`,
        }}
      >
        {children}
      </div>
    </PopIn>
  );
};

/** আইকন + নিচে লেখা (এক কলাম) */
const FlowItem: React.FC<{label: string; children: React.ReactNode}> = ({label, children}) => (
  <div
    style={{
      flex: '0 0 auto',
      width: COL_W,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
    }}
  >
    <div style={{height: 165, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {children}
    </div>
    <div
      style={{
        width: COL_W,
        display: 'flex',
        justifyContent: 'center',
        fontFamily: FONT_FAMILY,
        fontWeight: 700,
        fontSize: 44,
        lineHeight: 1.4,
        paddingBottom: 6,
        color: COLORS.white,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  </div>
);

/** ধাপ-ক্রম চিহ্ন (১ / ২): কার্ডের বাঁ-ওপর কোণে ছোট ব্যাজ */
const StepTag: React.FC<{value: number; color: string; delay: number; exitAt: number}> = ({
  value,
  color,
  delay,
  exitAt,
}) => (
  <NumberBadge
    value={value}
    color={color}
    size={76}
    delay={delay}
    exitAt={exitAt}
    pulse={false}
    style={{position: 'absolute', left: -24, top: -34}}
  />
);

/**
 * ৪২.৫০s "চার"            → NumberBadge ৪ (বাঁয়ে-ওপরে)
 * ৪৪.০০s "প্রস্রাব"        → শিরোনাম "প্রস্রাব-পায়খানা শেষে"
 * ৪৫.৫০s "ঢিলা"           → কার্ড A (ধাপ ১): ঢিলা-কুলুপ আইকন আঁকা
 * ৪৭.০০s "পানি"           → কার্ড B (ধাপ ২): পানির ফোঁটা
 * ৪৮.০০s "আগে"            → তীর A→B আঁকা + ধাপ-ব্যাজ ১ ও ২ (প্রথমে ঢিলা, পরে পানি)
 * ৪৮.৫০s "ঢিলা কুলুপ"     → A কার্ডের গ্লো বাড়ে
 * ৪৯.৫০s "অথবা"           → A এর ভেতরে "অথবা" ব্যাজ পপ (ঢিলা সরে বাঁয়ে যায়)
 * ৫০.০০s "টয়লেট"          → টয়লেট পেপার আইকন + লেখা
 * ৫১.৯৬s "করা" শেষ        → প্রস্থান (ভিডিও ফুল-স্ক্রিনে ফেরা শুরু ≈ ৫১.৮s)
 */
export const Scene8: React.FC = () => {
  const frame = useCurrentFrame();
  const area = LAYOUT_B.infoArea;
  const badgeAt = 0; // "চার" ≈ ফ্রেম ১০৬২ (লোকাল −১)
  const titleAt = lf(KEY_MS.p4aStart, 'S8') - 2; // ≈ ৩৫
  const clodAt = lf(45500, 'S8') - 2; // "ঢিলা" ≈ ৭৫ → ৭৩
  const waterAt = lf(KEY_MS.p4Water, 'S8') - 2; // "পানি" ≈ ১১২ → ১১০
  const aagheAt = lf(KEY_MS.p4bStart, 'S8'); // "আগে" ≈ ১৩৭
  const clodAgainAt = lf(48500, 'S8'); // "ঢিলা কুলুপ" ≈ ১৪৯
  const orAt = lf(KEY_MS.p4Or, 'S8') - 2; // "অথবা" ≈ ১৭৫ → ১৭৩
  const tissueAt = lf(50000, 'S8') - 2; // "টয়লেট" ≈ ১৮৭ → ১৮৫
  const endAt = lf(51960, 'S8') - 10; // "করা" শেষ ≈ ২৩৬ → ২২৬

  const clodDraw = progressBetween(frame, clodAt + 6, clodAt + 28);
  const dropDraw = progressBetween(frame, waterAt + 6, waterAt + 28);
  const tissueDraw = progressBetween(frame, tissueAt + 4, tissueAt + 24);

  // "অথবা" ও টয়লেট পেপার কলাম প্রথমে শূন্য-চওড়া; খুলে গেলে ঢিলা-কলাম কার্ডের মাঝ থেকে বাঁয়ে সরে
  const orOpen = easeOutCubic(progressBetween(frame, orAt - 4, orAt + 10));
  const tissueOpen = easeOutCubic(progressBetween(frame, tissueAt - 6, tissueAt + 10));
  const orPop = spring({frame: frame - orAt, fps: FPS, config: SPRING_POP});
  const orScale = frame < orAt ? 0.3 : 0.3 + 0.7 * Math.min(1.25, Math.max(0, orPop));

  return (
    <AbsoluteFill>
      <Fade outAt={endAt}>
        <Particles
          count={22}
          seed={81}
          shape="star"
          colors={[COLORS.lime, COLORS.white, COLORS.gold]}
          area={{x: 0, y: area.from, width: WIDTH, height: area.to - area.from}}
          minSize={10}
          maxSize={26}
          opacity={0.55}
        />
      </Fade>

      {/* শিরোনাম-সারি: ব্যাজ ৪ + "প্রস্রাব-পায়খানা শেষে" */}
      <Zone top={area.from} height={170}>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 28}}>
          <NumberBadge value={4} color={COLORS.lime} size={150} delay={badgeAt} exitAt={endAt} />
          <AnimatedTitle
            text="প্রস্রাব-পায়খানা শেষে"
            fontSize={58}
            gradient={[COLORS.lime, COLORS.teal]}
            underline={false}
            align="left"
            delay={titleAt}
            stagger={10}
            maxWidth={760}
            exitAt={endAt}
          />
        </div>
      </Zone>

      {/* প্রবাহ-সারি: [ধাপ ১: ঢিলা/টয়লেট পেপার] → [ধাপ ২: পানি] */}
      <Zone top={area.from + 190} height={FLOW_H + 60}>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
          <FlowCard
            width={FLOW_A_W}
            color={COLORS.gold}
            delay={clodAt}
            exitAt={endAt}
            boostAt={clodAgainAt}
          >
            <StepTag value={1} color={COLORS.gold} delay={aagheAt} exitAt={endAt} />
            <FlowItem label="ঢিলা-কুলুপ">
              <ClodIcon size={145} draw={clodDraw} />
            </FlowItem>
            <div
              style={{
                flex: '0 0 auto',
                width: OR_W * orOpen,
                display: 'flex',
                justifyContent: 'center',
                opacity: orOpen,
              }}
            >
              <div
                style={{
                  flex: '0 0 auto',
                  fontFamily: FONT_FAMILY,
                  fontWeight: 700,
                  fontSize: 42,
                  lineHeight: 1.35,
                  color: COLORS.navy,
                  backgroundColor: COLORS.gold,
                  borderRadius: 999,
                  padding: '2px 18px 10px',
                  whiteSpace: 'nowrap',
                  transform: `scale(${orScale})`,
                  boxShadow: `0 6px 16px rgba(0,0,0,0.45), 0 0 18px ${COLORS.gold}`,
                }}
              >
                অথবা
              </div>
            </div>
            <div
              style={{
                flex: '0 0 auto',
                width: COL_W * tissueOpen,
                display: 'flex',
                justifyContent: 'center',
                opacity: tissueOpen,
              }}
            >
              <FlowItem label="টয়লেট পেপার">
                <TissueIcon size={145} color={COLORS.white} draw={tissueDraw} />
              </FlowItem>
            </div>
          </FlowCard>

          <StepArrow
            length={ARROW_LEN}
            direction="right"
            color={COLORS.gold}
            lineWidth={12}
            delay={aagheAt}
            duration={16}
            exitAt={endAt}
          />

          <FlowCard width={FLOW_B_W} color={COLORS.sky} delay={waterAt} exitAt={endAt}>
            <StepTag value={2} color={COLORS.sky} delay={aagheAt + 6} exitAt={endAt} />
            <FlowItem label="পানি">
              <WaterDrop size={145} color={COLORS.sky} draw={dropDraw} />
            </FlowItem>
          </FlowCard>
        </div>
      </Zone>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* MainVideo এর জন্য এক্সপোর্ট                                           */
/* ------------------------------------------------------------------ */

export const SCENES_2: Partial<Record<SceneId, React.FC>> = {
  S5: Scene5,
  S6: Scene6,
  S7: Scene7,
  S8: Scene8,
};
