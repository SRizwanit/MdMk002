import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame} from 'remotion';
import {
  AnimatedTitle,
  CheckIcon,
  Particles,
  SlideIn,
  SubscribeBell,
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
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  getScene,
  sceneLen,
  wEnd,
  wStart,
  msToFrame,
  progressBetween,
  toBn,
  type SceneId,
} from './Theme';

/**
 * Scenes3.tsx — ধাপ ৭ এর ৩য় ব্যাচ: S9–S12 (mdmk02.md ৭.৯–৭.১২)
 *
 *  ৭.৯  S9  সারাংশ      (ফ্রেম 1345–1530)  Layout A — "এই ৪টি সুন্নাত" চেকলিস্ট (প্রতি ১.২s এ একটা টিক)
 *  ৭.১০ S10 বাকি ৮টি    (ফ্রেম 1545–1710)  Layout B — ১৬ ঘর: ৮টি সবুজ ✓ + ৮টি বাকি, কাউন্টার "৮ / ১৬"
 *  ৭.১১ S11 CTA         (ফ্রেম 1720–1910)  Layout A — "পর্ব আকারে বাকি ৮টি সুন্নাত" + MDMK বাটন + ঘণ্টা + বিদায়ী-ফেড
 *  ৭.১২ S12 বিদায়       (ফ্রেম 1945–2000)  Layout A — "ওয়া রাহমাতুল্লাহি ওয়া বারাকাতুহু" + শেষ ০.৫s ডার্ক ফেড
 *
 * সব সময় **লোকাল ফ্রেমে** (সিনের শুরু = ০)। `lf(ms, id)` = JSON এর মিলিসেকেন্ড → ঐ সিনের লোকাল ফ্রেম।
 * গ্রাফিকের কোনো লেখা বক্তার কথার বাইরে নয়; নতুন কোনো তথ্য/হুকুম যোগ হয়নি।
 * শুধু বিদ্যমান `Motion.tsx` / `Theme.ts` ব্যবহৃত — নতুন প্যাকেজ নেই। `Scenes1.tsx`/`Scenes2.tsx` অপরিবর্তিত
 * (তাই ছোট হেল্পার `lf`, `Zone`, `Fade`, `Chip` এখানে আবার লেখা হয়েছে)।
 */

/* ------------------------------------------------------------------ */
/* সাহায্যকারী                                                          */
/* ------------------------------------------------------------------ */

/** মিলিসেকেন্ড → সিনের লোকাল ফ্রেম */
const lf = (ms: number, id: SceneId): number => msToFrame(ms) - getScene(id).from;
/** সিনের শেষ-প্রস্থানের ফ্রেম (লোকাল): শব্দ শেষ − margin; কিন্তু সিনের মধ্যেই প্রস্থান (৮ ফ্রেম) শেষ হতে হবে */
const endLf = (ms: number, id: SceneId, margin: number): number =>
  Math.min(lf(ms, id) - margin, sceneLen(id) - 9);


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

/** নরমভাবে মিলিয়ে যাওয়া (কণা/ডেকোরেশন/পুরো গ্রুপ); `outDur` বাড়ালে ধীর বিদায় */
const Fade: React.FC<{
  outAt?: number;
  outDur?: number;
  lift?: number;
  children?: React.ReactNode;
}> = ({outAt, outDur = 8, lift = 0, children}) => {
  const frame = useCurrentFrame();
  const t = outAt === undefined ? 0 : easeInOutCubic(progressBetween(frame, outAt, outAt + outDur));
  return (
    <AbsoluteFill style={{opacity: 1 - t, transform: `translateY(${-lift * t}px)`}}>
      {children}
    </AbsoluteFill>
  );
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

/** সুন্নাত-ক্রমের রঙ (Scenes2 এর ব্যাজ-বরাদ্দ): ১ = গোল্ড • ২ = স্কাই • ৩ = ভায়োলেট • ৪ = লাইম */
const SUNNAH_COLORS = [COLORS.gold, COLORS.sky, COLORS.violet, COLORS.lime] as const;

/* ------------------------------------------------------------------ */
/* ৭.৯ S9 — সারাংশ (53.8–61.2s) • Layout A                              */
/* ------------------------------------------------------------------ */

/** চেকলিস্টের ৪টি লাইন (প্ল্যানের তালিকা; ১ নং লাইনের শব্দ-বদল নোট দেখুন) */
const SUMMARY_ITEMS: readonly {text: string; color: string}[] = [
  // ℹ️ প্ল্যানে "কেবলামুখী/পিঠ নয়" ছিল — "কেবলামুখী" শব্দে উল্টো অর্থ (কেবলার দিকে মুখ করা ঠিক) বোঝার ঝুঁকি আছে।
  //    তাই বক্তার নিজের কথার কাছাকাছি: "কেবলার দিকে মুখ/পিঠ নয়"।
  {text: 'কেবলার দিকে মুখ/পিঠ নয়', color: SUNNAH_COLORS[0]},
  {text: 'সতর খোলা ও বসে করা', color: SUNNAH_COLORS[1]},
  {text: 'নাপাক থেকে বাঁচা', color: SUNNAH_COLORS[2]},
  {text: 'ঢিলা/টিস্যুর পর পানি', color: SUNNAH_COLORS[3]},
];

const SUM_ROW_W = 654;
const SUM_ROW_H = 76;
const SUM_ROW_GAP = 6;
const SUM_LIST_H = 4 * SUM_ROW_H + 3 * SUM_ROW_GAP; // ৩২২ (জোন ৩২৬ এর ভেতরে)
const SUM_LEFT_W = 270;
const SUM_GAP = 26;

/** একটি সারাংশ-সারি: ক্রমিক চিপ + এক লাইন লেখা + ডানে আঁকা টিক; `tickAt` এ টিক পড়ে */
const SummaryRow: React.FC<{
  index: number;
  text: string;
  color: string;
  at: number;
  tickAt: number;
  allDoneAt: number;
  exitAt: number;
}> = ({index, text, color, at, tickAt, allDoneAt, exitAt}) => {
  const frame = useCurrentFrame();
  const s = spring({frame: frame - at, fps: FPS, config: SPRING_POP});
  const tick = clamp01((frame - tickAt) / 10);
  const tickPop = spring({frame: frame - tickAt, fps: FPS, config: SPRING_POP});
  const exit = 1 - easeInOutCubic(progressBetween(frame, exitAt, exitAt + 8));
  // সব টিক পড়ার পর নরম গ্লো-স্পন্দন
  const done = frame >= allDoneAt;
  const glow = done ? 0.5 + 0.5 * Math.sin(((frame - allDoneAt) / FPS) * Math.PI * 2) : 0;
  const chip = 54;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: index * (SUM_ROW_H + SUM_ROW_GAP),
        width: SUM_ROW_W,
        height: SUM_ROW_H,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: '0 16px 0 10px',
        borderRadius: 26,
        backgroundColor: 'rgba(11,27,43,0.82)',
        border: `3px solid ${tick >= 1 ? color : 'rgba(255,255,255,0.25)'}`,
        boxShadow: tick >= 1 ? `0 0 ${18 + 14 * glow}px ${color}88` : '0 6px 16px rgba(0,0,0,0.4)',
        opacity: clamp01(s * 1.8) * exit,
        transform: `translateX(${interpolate(s, [0, 1], [-130, 0])}px)`,
      }}
    >
      <div
        style={{
          flex: '0 0 auto',
          width: chip,
          height: chip,
          borderRadius: '50%',
          backgroundColor: color,
          color: index === 2 ? COLORS.white : COLORS.navy,
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          fontSize: 40,
          lineHeight: 1,
          paddingBottom: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {toBn(index + 1)}
      </div>
      <div
        style={{
          flex: 1,
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.3,
          paddingBottom: 4,
          color: COLORS.white,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
      <div
        style={{
          flex: '0 0 auto',
          width: chip,
          height: chip,
          borderRadius: '50%',
          boxSizing: 'border-box',
          border: `4px solid ${tick > 0 ? COLORS.lime : 'rgba(255,255,255,0.25)'}`,
          backgroundColor: tick >= 1 ? 'rgba(156,204,101,0.22)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${tick > 0 ? 1 + 0.18 * Math.max(0, 1 - Math.min(1, tickPop)) + 0.12 * Math.max(0, tickPop - 1) : 1})`,
        }}
      >
        <CheckIcon size={chip * 0.7} color={COLORS.lime} strokeWidth={13} draw={tick} />
      </div>
    </div>
  );
};

/**
 * ৫৪.৬১s "এই ৪টি হলো"       → শিরোনাম "এই ৪টি সুন্নাত" (বাঁ কলামে)
 * ৫৭.০৩s "ইস্তেঞ্জার"       → শিরোনাম বদলে "ইস্তেঞ্জার সুন্নাত"
 * ডানে ৪ সারি: প্রতি ১.২s (৩০ ফ্রেম) এ একটা ঢোকে ও টিক পড়ে (১ম ≈ "চারটি")
 * ৫৯.৩s "অন্যতম" এর কাছে শেষ টিক; সব সারি গ্লো-স্পন্দন; "সুন্নাত" শেষের আগেই সব প্রস্থান
 */
export const Scene9: React.FC = () => {
  const frame = useCurrentFrame();
  const firstAt = lf(wStart(93), 'S9') + 3; // "চারটি"
  const interval = 30; // ১.২s
  const rowAt = (i: number): number => firstAt + i * interval; // ২১, ৫১, ৮১, ১১১
  const tickAt = (i: number): number => rowAt(i) + 8;
  const allDoneAt = tickAt(3) + 10;
  const titleAAt = Math.max(0, lf(wStart(92), 'S9') - 2); // "এই"
  const titleAOut = lf(wStart(95), 'S9') - 11; // শিরোনাম-ক সরে (৮ ফ্রেমে অদৃশ্য)
  const titleBAt = lf(wStart(95), 'S9') - 2; // "ইস্তেঞ্জার"
  const endAt = endLf(wEnd(101), 'S9', 8); // "সুন্নাত" শেষ
  const rowsLeft = SUM_LEFT_W + SUM_GAP;
  // বাঁ কলাম ও ডান তালিকার মাঝের সরু দাগ — আঁকা হয়
  const rule = easeOutCubic(progressBetween(frame, 4, 24));
  const ruleOut = 1 - easeInOutCubic(progressBetween(frame, endAt, endAt + 8));

  return (
    <AbsoluteFill>
      <Fade outAt={endAt}>
        <Particles
          count={14}
          seed={91}
          shape="mixed"
          colors={[COLORS.gold, COLORS.white, COLORS.teal]}
          area={{x: 0, y: INFO.from - 20, width: WIDTH, height: INFO_H + 40}}
          minSize={10}
          maxSize={24}
          opacity={0.6}
        />
      </Fade>

      <Zone top={INFO.from} height={INFO_H}>
        <div
          style={{
            position: 'relative',
            width: SUM_LEFT_W + SUM_GAP + SUM_ROW_W,
            height: SUM_LIST_H,
          }}
        >
          {/* বাঁ কলাম: শিরোনাম (দুই ধাপ) */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: SUM_LEFT_W - 14,
              height: SUM_LIST_H,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{position: 'absolute', left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
              <AnimatedTitle
                text={`এই ${toBn(4)}টি সুন্নাত`}
                fontSize={76}
                gradient={[COLORS.sky, COLORS.teal]}
                underlineColor={COLORS.sky}
                delay={titleAAt}
                stagger={9}
                maxWidth={SUM_LEFT_W - 14}
                exitAt={titleAOut}
              />
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
              <AnimatedTitle
                text={TOPIC_TITLE}
                fontSize={76}
                gradient={[COLORS.gold, COLORS.coral]}
                underlineColor={COLORS.gold}
                delay={titleBAt}
                stagger={10}
                maxWidth={SUM_LEFT_W - 14}
                exitAt={endAt}
              />
            </div>
          </div>

          {/* মাঝের দাগ */}
          <div
            style={{
              position: 'absolute',
              left: SUM_LEFT_W - 8,
              top: SUM_LIST_H * (1 - rule) * 0.5,
              width: 5,
              height: SUM_LIST_H * rule,
              borderRadius: 5,
              backgroundColor: COLORS.gold,
              opacity: 0.8 * ruleOut,
              boxShadow: `0 0 14px ${COLORS.gold}`,
            }}
          />

          {/* ডান কলাম: ৪ সারির চেকলিস্ট */}
          <div style={{position: 'absolute', left: rowsLeft, top: 0, width: SUM_ROW_W, height: SUM_LIST_H}}>
            {SUMMARY_ITEMS.map((item, i) => (
              <SummaryRow
                key={item.text}
                index={i}
                text={item.text}
                color={item.color}
                at={rowAt(i)}
                tickAt={tickAt(i)}
                allDoneAt={allDoneAt}
                exitAt={endAt}
              />
            ))}
          </div>
        </div>
      </Zone>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* ৭.১০ S10 — বাকি ৮টি (61.8–68.4s) • Layout B                           */
/* ------------------------------------------------------------------ */

const G_CELL = 100;
const G_GAP = 14;
const G_SIZE = 4 * G_CELL + 3 * G_GAP; // ৪৪২

/** কাউন্টার: "৮ / ১৬" — `at` থেকে ১ম সংখ্যা ০ → ৮ গোনে; `popAt` এ সংখ্যা একবার ফুলে ওঠে */
const Counter: React.FC<{at: number; popAt: number; exitAt: number}> = ({at, popAt, exitAt}) => {
  const frame = useCurrentFrame();
  const shown = Math.round(8 * easeOutCubic(progressBetween(frame, at + 4, at + 30)));
  const pop = spring({frame: frame - popAt, fps: FPS, config: SPRING_POP});
  const bump = frame >= popAt ? 1 + 0.18 * Math.max(0, 1 - Math.min(1, pop)) : 1;
  return (
    <SlideIn direction="right" distance={120} delay={at} exitAt={exitAt}>
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          lineHeight: 1.25,
          color: COLORS.navy,
          backgroundColor: COLORS.lime,
          borderRadius: 999,
          padding: '2px 28px 12px',
          whiteSpace: 'nowrap',
          boxShadow: `0 8px 22px rgba(0,0,0,0.45), 0 0 22px ${COLORS.lime}`,
        }}
      >
        <span style={{fontSize: 72, display: 'inline-block', transform: `scale(${bump})`}}>
          {toBn(shown)}
        </span>
        <span style={{fontSize: 48}}>/ {toBn(16)}</span>
      </div>
    </SlideIn>
  );
};

/** বাকি ৮ ঘর (সারি ২–৩) ঘিরে জ্বলন্ত ফ্রেম — "আর আটটি" এ ফোটে */
const RemainBracket: React.FC<{at: number; exitAt: number}> = ({at, exitAt}) => {
  const frame = useCurrentFrame();
  const s = spring({frame: frame - at, fps: FPS, config: SPRING_POP});
  const exit = 1 - easeInOutCubic(progressBetween(frame, exitAt, exitAt + 8));
  const glow = 0.5 + 0.5 * Math.sin(((frame - at) / FPS) * Math.PI * 3);
  const pad = 12;
  const rowsH = 2 * G_CELL + G_GAP;
  return (
    <div
      style={{
        position: 'absolute',
        left: -pad,
        top: 2 * (G_CELL + G_GAP) - pad,
        width: G_SIZE + 2 * pad,
        height: rowsH + 2 * pad,
        boxSizing: 'border-box',
        borderRadius: 34,
        border: `6px solid ${COLORS.coral}`,
        opacity: clamp01(s * 1.8) * exit,
        transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
        boxShadow: `0 0 ${14 + 26 * glow}px ${COLORS.coral}, inset 0 0 ${10 + 16 * glow}px ${COLORS.coral}55`,
        pointerEvents: 'none',
      }}
    />
  );
};

/**
 * ৬২.২৩s "ইস্তেঞ্জার"     → সিন শুরু (ভিডিও ছোট কার্ডে নামে)
 * ৬২.৭৩s "১৬টি"          → শিরোনাম "১৬টি সুন্নাত" + ১৬ ঘরের গ্রিড (নিষ্ক্রিয়)
 * ৬৪.৪৩s "অন্যতম ৪টি"    → ৮ ঘর সবুজ ✓ (০–৭) + কাউন্টার "৮ / ১৬" গোনে (বাঁয়ে)
 * ৬৬.৭০s "বাকি"         → ৮ ঘর ধূসর-পালস (৮–১৫) + চিপ "বাকি ৮টি" (ডানে)
 * ৬৭.৬৯s "আর"/"৮টি"      → বাকি ৮ ঘর ঘিরে কোরাল ফ্রেম জ্বলে; কাউন্টারের সংখ্যা ফোলে
 * ভিডিও এই সিনে ছোট কার্ডে (MainVideo এর Layout B); কার্ড ওপরের এলাকা (১৯২–৮০৬) ছেড়ে দেয়।
 */
export const Scene10: React.FC = () => {
  const area = LAYOUT_B.infoArea;
  const headerTop = area.from - 6;
  const headerH = 150;
  const gridTop = area.from + headerH;
  const gridLeft = Math.round((WIDTH - G_SIZE) / 2);

  const sixteenAt = lf(KEY_MS.remainStart, 'S10');
  const knownAt = lf(wStart(106), 'S10') - 2; // "অন্যতম"
  const remainAt = lf(wStart(109), 'S10') - 2; // "বাকি"
  const emphasisAt = lf(wStart(111), 'S10') - 2; // "আর"
  const eightWordAt = lf(wStart(112), 'S10'); // "আটটি"
  const endAt = endLf(wEnd(113), 'S10', 4); // "সুন্নাত" শেষ

  const rowY = (row: number): number => gridTop + row * (G_CELL + G_GAP) + G_CELL / 2;
  const chipH = 80;

  return (
    <AbsoluteFill>
      <Fade outAt={endAt}>
        <Particles
          count={22}
          seed={101}
          shape="star"
          colors={[COLORS.lime, COLORS.white, COLORS.coral]}
          area={{x: 0, y: area.from, width: WIDTH, height: area.to - area.from}}
          minSize={10}
          maxSize={26}
          opacity={0.55}
        />
      </Fade>

      {/* শিরোনাম: "১৬টি সুন্নাত" */}
      <Zone top={headerTop} height={headerH}>
        <AnimatedTitle
          text={`${toBn(16)}টি সুন্নাত`}
          fontSize={82}
          gradient={[COLORS.sky, COLORS.teal]}
          underlineColor={COLORS.sky}
          delay={sixteenAt - 1}
          stagger={13}
          maxWidth={900}
          exitAt={endAt}
        />
      </Zone>

      {/* ১৬ ঘরের গ্রিড */}
      <div style={{position: 'absolute', left: gridLeft, top: gridTop}}>
        <SunnahGrid
          cols={4}
          cellSize={G_CELL}
          gap={G_GAP}
          delay={sixteenAt + 4}
          exitAt={endAt}
          groups={[
            {start: 0, count: 8, kind: 'known', at: knownAt},
            {start: 8, count: 8, kind: 'remaining', at: remainAt},
          ]}
        />
        <RemainBracket at={emphasisAt} exitAt={endAt} />
      </div>

      {/* বাঁয়ে: কাউন্টার "৮ / ১৬" (সারি ১–২ এর মাঝামাঝি) */}
      <div
        style={{
          position: 'absolute',
          right: WIDTH - gridLeft + 22,
          top: (rowY(0) + rowY(1)) / 2 - chipH / 2,
        }}
      >
        <Counter at={knownAt + 4} popAt={eightWordAt} exitAt={endAt} />
      </div>

      {/* ডানে: "বাকি ৮টি" (সারি ৩–৪ এর মাঝামাঝি) */}
      <div
        style={{
          position: 'absolute',
          left: gridLeft + G_SIZE + 22,
          top: (rowY(2) + rowY(3)) / 2 - chipH / 2,
        }}
      >
        <SlideIn direction="left" distance={120} delay={remainAt + 3} exitAt={endAt}>
          <Chip text={`বাকি ${toBn(8)}টি`} color={COLORS.coral} fontSize={50} />
        </SlideIn>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* ৭.১১ S11 — CTA (68.8–76.4s) • Layout A                                */
/* ------------------------------------------------------------------ */

/** বাটন-পপের মুহূর্তে ছড়িয়ে পড়া গোল্ড রিং (২টি, পরপর) */
const BurstRings: React.FC<{at: number; cx: number; cy: number}> = ({at, cx, cy}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {[0, 6].map((off) => {
        const t = progressBetween(frame, at + off, at + off + 26);
        if (t <= 0 || t >= 1) {
          return null;
        }
        const size = 160 + 380 * easeOutCubic(t);
        return (
          <div
            key={off}
            style={{
              position: 'absolute',
              left: cx - size / 2,
              top: cy - size / 2,
              width: size,
              height: size,
              borderRadius: '50%',
              boxSizing: 'border-box',
              border: `${8 - 5 * t}px solid ${COLORS.gold}`,
              opacity: 0.7 * (1 - t),
            }}
          />
        );
      })}
    </>
  );
};

/**
 * ৬৯.০০s "পর্ব আকারে"        → লেখা "পর্ব আকারে" (শব্দ ধরে)
 * ৭০.০৮s "বাকি আটটি সুন্নাত"  → দ্বিতীয় লাইন "বাকি ৮টি সুন্নাত" (গ্রেডিয়েন্ট + আন্ডারলাইন)
 * ৭২.৭৭s "MDMK"            → দুই লাইন সরে; বড় "MDMK" বাটন পপ + রিং-বার্স্ট + ঘণ্টা দোলে + "সাথে থাকুন"
 * ৭৪.৯২s সালাম (১ম অংশ)    → শান্ত বিদায়ী-ফেড (ধীরে মিলায়, সামান্য ওপরে ওঠে); কণা ধীরে ঝিমিয়ে যায়
 */
export const Scene11: React.FC = () => {
  const partsAt = lf(KEY_MS.partsStart, 'S11') - 2;
  const baakiAt = lf(wStart(117), 'S11') - 2; // "বাকি"
  const phase1Out = lf(wEnd(121), 'S11') - 8; // "জন্য" শেষ
  const mdmkAt = lf(KEY_MS.mdmkWord, 'S11') - 2; // "MDMK"
  const calmAt = lf(KEY_MS.salamEndStart, 'S11'); // বিদায়ী-ফেড শুরু
  const calmDur = 28;
  const sceneEnd = getScene('S11').to - getScene('S11').from; // ১৯০

  const midY = INFO.from + INFO_H / 2;

  return (
    <AbsoluteFill>
      {/* কণা: পুরো সিনে; শেষ দিকে ধীরে ঝিমিয়ে যায় */}
      <Fade outAt={sceneEnd - 26} outDur={24}>
        <Particles
          count={18}
          seed={111}
          shape="star"
          colors={[COLORS.gold, COLORS.white, COLORS.teal]}
          area={{x: 0, y: INFO.from - 20, width: WIDTH, height: INFO_H + 40}}
          minSize={10}
          maxSize={26}
          opacity={0.65}
          speed={0.7}
        />
      </Fade>

      <BurstRings at={mdmkAt + 2} cx={WIDTH / 2} cy={midY - 20} />

      {/* ধাপ ১: "পর্ব আকারে / বাকি ৮টি সুন্নাত" */}
      <Zone top={INFO.from} height={INFO_H}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <AnimatedTitle
            text="পর্ব আকারে"
            fontSize={96}
            gradient={[COLORS.sky, COLORS.teal]}
            underline={false}
            delay={partsAt}
            stagger={13}
            maxWidth={760}
            exitAt={phase1Out}
          />
          <AnimatedTitle
            text={`বাকি ${toBn(8)}টি সুন্নাত`}
            fontSize={96}
            gradient={[COLORS.coral, COLORS.gold]}
            underlineColor={COLORS.coral}
            delay={baakiAt}
            stagger={13}
            maxWidth={680}
            exitAt={phase1Out}
          />
        </div>
      </Zone>

      {/* ধাপ ২: MDMK বাটন + ঘণ্টা + "সাথে থাকুন" (সালামে ধীর বিদায়ী-ফেড) */}
      <Fade outAt={calmAt} outDur={calmDur} lift={26}>
        <Zone top={INFO.from} height={INFO_H}>
          <SubscribeBell delay={mdmkAt} brand="MDMK" label="সাথে থাকুন" size={210} />
        </Zone>
      </Fade>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* ৭.১২ S12 — বিদায় (77.8–80s) • Layout A                               */
/* ------------------------------------------------------------------ */

/**
 * ৭৮.০০s "ওয়া"          → শিরোনাম ফুটতে শুরু (ওয়া • রাহমাতুল্লাহি • ওয়া • বারাকাতুহু — JSON ≈ ৩০০–৩৫০ms ব্যবধান)
 * ৭৯.৪৭s শেষ শব্দ শেষ    → গ্রাফিক ধীরে মিলায়
 * শেষ ০.৫s (১২ ফ্রেম)   → ভিডিও-লেয়ারের ওপর হালকা ডার্ক (নেভি) ফেড; ক্যাপশন ও HUD এর নিচে, তাই লেখা পড়া যায়
 */
export const Scene12: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneEnd = getScene('S12').to - getScene('S12').from; // ৫৫
  const titleAt = Math.max(0, lf(wStart(128), 'S12') - 2); // "ওয়া"
  const titleOut = Math.min(lf(wEnd(131), 'S12') - 2, sceneEnd - 18); // শেষ শব্দ শেষ
  const darkFrom = sceneEnd - 12; // শেষ ০.৪৮s
  const dark = easeInOutCubic(progressBetween(frame, darkFrom, sceneEnd - 1));

  return (
    <AbsoluteFill>
      {/* শেষ ০.৫s: হালকা ডার্ক ফেড (সবচেয়ে নিচের স্তর, যাতে লেখা ঢাকে না) */}
      <AbsoluteFill style={{backgroundColor: COLORS.navy, opacity: 0.62 * dark}} />

      <Fade outAt={sceneEnd - 16} outDur={14}>
        <Particles
          count={22}
          seed={121}
          shape="star"
          colors={[COLORS.gold, COLORS.white, COLORS.teal]}
          area={{x: 0, y: INFO.from - 20, width: WIDTH, height: INFO_H + 40}}
          minSize={10}
          maxSize={24}
          opacity={0.6}
          speed={0.7}
        />
      </Fade>

      <Zone top={INFO.from} height={INFO_H}>
        <AnimatedTitle
          text="ওয়া রাহমাতুল্লাহি ওয়া বারাকাতুহু"
          fontSize={92}
          gradient={[COLORS.gold, COLORS.teal]}
          underlineColor={COLORS.gold}
          delay={titleAt}
          stagger={Math.max(5, Math.round(msToFrame(wStart(131) - wStart(128)) / 3))}
          maxWidth={960}
          exitAt={titleOut}
        />
      </Zone>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* MainVideo এর জন্য এক্সপোর্ট                                           */
/* ------------------------------------------------------------------ */

export const SCENES_3: Partial<Record<SceneId, React.FC>> = {
  S9: Scene9,
  S10: Scene10,
  S11: Scene11,
  S12: Scene12,
};
