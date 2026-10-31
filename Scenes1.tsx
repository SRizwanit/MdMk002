import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {
  AnimatedTitle,
  CheckIcon,
  InfoCard,
  Particles,
  ProgressRing,
  SlideIn,
  SunnahGrid,
} from './Motion';
import {
  COLORS,
  FONT_FAMILY,
  FPS,
  KEY_MS,
  LAYOUT_B,
  SPRING_POP,
  TOPIC_TITLE,
  WIDTH,
  ZONES,
  easeInOutCubic,
  getScene,
  msToFrame,
  progressBetween,
  toBn,
  type SceneId,
} from './Theme';

/**
 * Scenes1.tsx — ধাপ ৭ এর ১ম ব্যাচ: S1–S4 (mdmk02.md ৭.১–৭.৪)
 *
 *  ৭.১ S1 সালাম        (ফ্রেম  0– 60)  Layout A
 *  ৭.২ S2 রিক্যাপ       (ফ্রেম 70–215)  Layout A
 *  ৭.৩ S3 আজকের বিষয়    (ফ্রেম 220–440) Layout B (ভিডিও ছোট কার্ডে)
 *  ৭.৪ S4 লিড-ইন        (ফ্রেম 445–545) Layout A
 *
 * সব সময় **লোকাল ফ্রেমে** (সিনের শুরু = ০)। `lf(ms, id)` = JSON এর মিলিসেকেন্ড → ঐ সিনের লোকাল ফ্রেম।
 * গ্রাফিকের কোনো লেখা বক্তার কথার বাইরে নয়; নতুন কোনো তথ্য/হুকুম যোগ হয়নি।
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

/** ছোট রঙিন লেবেল-চিপ */
const Chip: React.FC<{text: string; color: string; fontSize?: number}> = ({
  text,
  color,
  fontSize = 46,
}) => (
  <div
    style={{
      fontFamily: FONT_FAMILY,
      fontWeight: 700,
      fontSize,
      lineHeight: 1.35,
      color: COLORS.navy,
      backgroundColor: color,
      borderRadius: 999,
      padding: '4px 26px 12px',
      whiteSpace: 'nowrap',
      boxShadow: `0 8px 22px rgba(0,0,0,0.45), 0 0 22px ${color}`,
    }}
  >
    {text}
  </div>
);

/* ------------------------------------------------------------------ */
/* ৭.১ S1 — সালাম (0–2.4s)                                              */
/* ------------------------------------------------------------------ */

/**
 * "আসসালামু আলাইকুম" বড় টাইটেল — শব্দ ধরে ফুটে ওঠে (আসসালামু: 0ms, আলাইকুম: 750ms),
 * চারপাশে স্বর্ণালী তারা-কণা। ক্যাপশন আলাদা (Captions.tsx) চলছে।
 */
export const Scene1: React.FC = () => {
  const exitAt = 46;
  return (
    <AbsoluteFill>
      <Fade outAt={50}>
        <Particles
          count={26}
          seed={11}
          shape="star"
          colors={[COLORS.gold, COLORS.white, COLORS.teal]}
          area={{x: 0, y: INFO.from - 30, width: WIDTH, height: INFO_H + 60}}
          minSize={12}
          maxSize={32}
          opacity={0.9}
        />
      </Fade>
      <Zone top={INFO.from} height={INFO_H}>
        <AnimatedTitle
          text="আসসালামু আলাইকুম"
          fontSize={98}
          gradient={[COLORS.gold, COLORS.teal]}
          underlineColor={COLORS.gold}
          delay={2}
          stagger={17}
          maxWidth={980}
          exitAt={exitAt}
        />
      </Zone>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* ৭.২ S2 — রিক্যাপ (2.8–8.6s)                                          */
/* ------------------------------------------------------------------ */

/**
 * ধাপ ১ (৩.০–৫.১s "প্রিয় দর্শক শ্রোতা"): শিরোনাম।
 * ধাপ ২ (৫.১s "গত ভিডিওতে" থেকে): ProgressRing ০→৪/১৬ ভরে; "আমরা জেনেছি" (৬.৬–৭.৯s) এ
 * পাশে কার্ড "গত ভিডিওতে • ৪টি সুন্নাহ জানা" + টিক আঁকা।
 */
export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const titleExit = 52;
  const ringAt = lf(5100, 'S2'); // ≈ ৫৬
  const cardAt = lf(6571, 'S2'); // "আমরা" ≈ ৯৪ → কার্ড একটু আগে
  const endAt = lf(7942, 'S2') - 2; // "জেনেছি" শেষ ≈ ১২৬
  const tick = progressBetween(frame, cardAt + 12, cardAt + 28);

  return (
    <AbsoluteFill>
      <Fade outAt={endAt}>
        <Particles
          count={16}
          seed={23}
          shape="mixed"
          colors={[COLORS.sky, COLORS.teal, COLORS.white]}
          area={{x: 0, y: INFO.from - 20, width: WIDTH, height: INFO_H + 40}}
          minSize={10}
          maxSize={26}
          opacity={0.75}
        />
      </Fade>

      {/* ধাপ ১: "প্রিয় দর্শক শ্রোতা" */}
      <Zone top={INFO.from} height={INFO_H}>
        <AnimatedTitle
          text="প্রিয় দর্শক শ্রোতা"
          fontSize={92}
          gradient={[COLORS.sky, COLORS.teal]}
          underlineColor={COLORS.sky}
          delay={5}
          stagger={18}
          maxWidth={980}
          exitAt={titleExit}
        />
      </Zone>

      {/* ধাপ ২: রিং + কার্ড */}
      <Zone top={INFO.from} height={INFO_H}>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 36}}>
          <ProgressRing
            value={4}
            total={16}
            size={260}
            color={COLORS.teal}
            delay={ringAt}
            duration={40}
            exitAt={endAt}
            label="সুন্নাহ"
          />
          <InfoCard
            width={600}
            title="গত ভিডিওতে"
            subtitle="৪টি সুন্নাহ জানা"
            color={COLORS.lime}
            titleSize={52}
            subtitleSize={38}
            iconSize={118}
            delay={cardAt}
            exitAt={endAt}
            icon={<CheckIcon size={76} color={COLORS.lime} draw={tick} />}
          />
        </div>
      </Zone>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* ৭.৩ S3 — আজকের বিষয় (8.8–17.6s) • Layout B                          */
/* ------------------------------------------------------------------ */

const GRID_CELL = 96;
const GRID_GAP = 14;
const GRID_SIZE = 4 * GRID_CELL + 3 * GRID_GAP; // ৪২৬

/**
 * ৯.০s "ষোলোটি সুন্নাহ" → শিরোনাম "১৬টি সুন্নাহ" + ১৬ ঘরের গ্রিড (ধূসর, বাকি)
 * ১১.০s "চারটি জেনেছি" → প্রথম ৪ ঘর সবুজ ✓ + চিপ "৪টি জেনেছি"
 * ১৩.০s "পরবর্তী চারটি জানবো" → পরের ৪ ঘর গোল্ড-পালস + চিপ "আজকে ৪টি"
 * ১৬.০s "ইস্তেঞ্জার সুন্নাহ" → বড় শিরোনাম (গ্রেডিয়েন্ট + আন্ডারলাইন)
 * ভিডিও এই সিনে ছোট কার্ডে (MainVideo এর Layout B); কার্ড ওপরের এলাকা ছেড়ে দেয়।
 */
export const Scene3: React.FC = () => {
  const area = LAYOUT_B.infoArea;
  const headerTop = area.from - 6;
  const headerH = 150;
  const gridTop = area.from + headerH;
  const gridLeft = Math.round((WIDTH - GRID_SIZE) / 2);

  const sixteenAt = lf(9000, 'S3'); // ≈ ৫
  const knownAt = lf(11000, 'S3'); // ≈ ৫৫
  const todayAt = lf(13000, 'S3'); // ≈ ১০৫
  const remainAt = lf(10000, 'S3'); // "এর" ≈ ৩০ → ধূসর ৮ ঘর
  const titleAt = lf(16000, 'S3'); // ≈ ১৮০
  const endAt = lf(16960, 'S3') + 2; // "সুন্নাহ" শেষ ≈ ২০৬

  const rowY = (row: number): number => gridTop + row * (GRID_CELL + GRID_GAP) + GRID_CELL / 2;
  const chipH = 70;

  return (
    <AbsoluteFill>
      <Fade outAt={endAt}>
        <Particles
          count={22}
          seed={31}
          shape="star"
          colors={[COLORS.gold, COLORS.white, COLORS.sky]}
          area={{x: 0, y: area.from, width: WIDTH, height: area.to - area.from}}
          minSize={10}
          maxSize={26}
          opacity={0.6}
        />
      </Fade>

      {/* শিরোনাম ১: "১৬টি সুন্নাহ" */}
      <Zone top={headerTop} height={headerH}>
        <AnimatedTitle
          text={`${toBn(16)}টি সুন্নাহ`}
          fontSize={82}
          gradient={[COLORS.sky, COLORS.teal]}
          underlineColor={COLORS.sky}
          delay={sixteenAt - 1}
          stagger={13}
          maxWidth={900}
          exitAt={titleAt - 10}
        />
      </Zone>

      {/* শিরোনাম ২: "ইস্তেঞ্জা সুন্নাহ" (একই জায়গায়) */}
      <Zone top={headerTop} height={headerH}>
        <AnimatedTitle
          text={TOPIC_TITLE}
          fontSize={92}
          gradient={[COLORS.gold, COLORS.coral]}
          underlineColor={COLORS.gold}
          delay={titleAt - 2}
          stagger={13}
          maxWidth={980}
          exitAt={endAt}
        />
      </Zone>

      {/* ১৬ ঘরের গ্রিড */}
      <div style={{position: 'absolute', left: gridLeft, top: gridTop}}>
        <SunnahGrid
          cols={4}
          cellSize={GRID_CELL}
          gap={GRID_GAP}
          delay={sixteenAt + 4}
          exitAt={endAt}
          groups={[
            {start: 0, count: 4, kind: 'known', at: knownAt},
            {start: 4, count: 4, kind: 'today', at: todayAt},
            {start: 8, count: 8, kind: 'remaining', at: remainAt},
          ]}
        />
      </div>

      {/* বাঁয়ে: জানা ৪টি (সারি ১) */}
      <div
        style={{
          position: 'absolute',
          right: WIDTH - gridLeft + 24,
          top: rowY(0) - chipH / 2,
        }}
      >
        <SlideIn direction="right" distance={120} delay={knownAt + 3} exitAt={endAt}>
          <Chip text="৪টি জেনেছি" color={COLORS.lime} />
        </SlideIn>
      </div>

      {/* ডানে: আজকের ৪টি (সারি ২) */}
      <div
        style={{
          position: 'absolute',
          left: gridLeft + GRID_SIZE + 24,
          top: rowY(1) - chipH / 2,
        }}
      >
        <SlideIn direction="left" distance={120} delay={todayAt + 3} exitAt={endAt}>
          <Chip text="আজকে ৪টি" color={COLORS.gold} />
        </SlideIn>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* ৭.৪ S4 — লিড-ইন (17.8–21.8s)                                         */
/* ------------------------------------------------------------------ */

const DOT = 84;
const DOT_GAP = 46;

/** ১–৪ ক্রমের ৪টি গোল ডট; `litAt` এ প্রথমটি জ্বলে ওঠে (গোল্ড + পালস রিং) */
const StepDots: React.FC<{delay: number; litAt: number; exitAt?: number}> = ({
  delay,
  litAt,
  exitAt,
}) => {
  const frame = useCurrentFrame();
  const exit = exitAt === undefined ? 1 : 1 - easeInOutCubic(progressBetween(frame, exitAt, exitAt + 8));
  const total = 4 * DOT + 3 * DOT_GAP;
  const lit = spring({frame: frame - litAt, fps: FPS, config: SPRING_POP});
  const ringCycle = frame > litAt + 10 ? ((frame - litAt - 10) % 36) / 36 : -1;

  return (
    <div style={{position: 'relative', width: total, height: DOT, opacity: exit}}>
      {/* সংযোগ-রেখা */}
      <div
        style={{
          position: 'absolute',
          left: DOT / 2,
          right: DOT / 2,
          top: DOT / 2 - 3,
          height: 6,
          borderRadius: 6,
          backgroundColor: 'rgba(255,255,255,0.28)',
        }}
      />
      {[1, 2, 3, 4].map((n, i) => {
        const pop = spring({frame: frame - (delay + i * 4), fps: FPS, config: SPRING_POP});
        const isFirst = i === 0;
        const litAmount = isFirst ? Math.min(1, Math.max(0, lit)) : 0;
        const scale = (0.3 + 0.7 * Math.min(1, pop)) * (isFirst ? 1 + 0.18 * litAmount : 1);
        return (
          <div
            key={n}
            style={{
              position: 'absolute',
              left: i * (DOT + DOT_GAP),
              top: 0,
              width: DOT,
              height: DOT,
              borderRadius: '50%',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT_FAMILY,
              fontWeight: 700,
              fontSize: 48,
              lineHeight: 1,
              paddingBottom: 8,
              opacity: Math.min(1, pop * 1.6),
              transform: `scale(${scale})`,
              color: isFirst && litAmount > 0.3 ? COLORS.navy : COLORS.gray,
              backgroundColor:
                isFirst && litAmount > 0.3 ? COLORS.gold : 'rgba(11,27,43,0.78)',
              border: `5px solid ${isFirst && litAmount > 0.3 ? COLORS.white : 'rgba(255,255,255,0.4)'}`,
              boxShadow:
                isFirst && litAmount > 0.3
                  ? `0 0 34px ${COLORS.gold}, 0 8px 18px rgba(0,0,0,0.45)`
                  : '0 6px 14px rgba(0,0,0,0.4)',
            }}
          >
            {toBn(n)}
            {isFirst && ringCycle >= 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: -5,
                  borderRadius: '50%',
                  border: `5px solid ${COLORS.gold}`,
                  opacity: 0.7 * (1 - ringCycle),
                  transform: `scale(${1 + 0.6 * ringCycle})`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * "পরবর্তী ৪টি সুন্নাহ" শিরোনাম + ৪টি ডট (১ম জ্বলছে)।
 * ১৯.৭৫s "এক নাম্বার" এ ডট ১ জ্বলে — পরের সিনে (S5) NumberBadge ১ ঢোকার প্রস্তুতি।
 */
export const Scene4: React.FC = () => {
  const oneAt = lf(KEY_MS.oneNumber, 'S4'); // ≈ ৪৯
  const endAt = lf(21453, 'S4') - 2; // "হলো" শেষ ≈ ৮৯
  const titleH = 150;

  return (
    <AbsoluteFill>
      <Fade outAt={endAt}>
        <Particles
          count={14}
          seed={41}
          shape="mixed"
          colors={[COLORS.teal, COLORS.gold, COLORS.white]}
          area={{x: 0, y: INFO.from - 20, width: WIDTH, height: INFO_H + 40}}
          minSize={10}
          maxSize={24}
          opacity={0.7}
        />
      </Fade>

      <Zone top={INFO.from - 8} height={titleH}>
        <AnimatedTitle
          text="পরবর্তী ৪টি সুন্নাহ"
          fontSize={84}
          gradient={[COLORS.sky, COLORS.teal]}
          underlineColor={COLORS.teal}
          delay={3}
          stagger={12}
          maxWidth={980}
          exitAt={endAt}
        />
      </Zone>

      <Zone top={INFO.from - 8 + titleH + 8} height={DOT + 30}>
        <StepDots delay={20} litAt={oneAt} exitAt={endAt} />
      </Zone>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* MainVideo এর জন্য এক্সপোর্ট                                           */
/* ------------------------------------------------------------------ */

export const SCENES_1: Partial<Record<SceneId, React.FC>> = {
  S1: Scene1,
  S2: Scene2,
  S3: Scene3,
  S4: Scene4,
};
