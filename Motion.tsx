/**
 * Motion.tsx — MDMK মোশন গ্রাফিক্স কম্পোনেন্ট লাইব্রেরি (mdmk02.md ধাপ ৬)
 *
 * সব কম্পোনেন্ট `useCurrentFrame()` এর ওপর নির্ভর করে — অর্থাৎ যে <Sequence> এর ভেতরে বসবে,
 * তার নিজস্ব ফ্রেম (০ থেকে শুরু) ধরে চলবে। `delay`, `exitAt` ইত্যাদি সবই ঐ লোকাল ফ্রেমে।
 *
 * বিষয়সূচি:
 *  ৬.১  PopIn, SlideIn
 *  ৬.২  NumberBadge
 *  ৬.৩  InfoCard
 *  ৬.৪  ProgressRing
 *  ৬.৫  SunnahGrid
 *  ৬.৬  FlowLine, StepArrow
 *  ৬.৭  SVG আইকন সেট (নিজে আঁকা) + Icons ম্যাপ
 *  ৬.৮  Particles
 *  ৬.৯  WipeTransition
 *  ৬.১০ AnimatedTitle
 *  ৬.১১ Checklist
 *  ৬.১২ SubscribeBell
 *
 * নিয়ম: কোথাও `Math.random()` নেই (রেন্ডারে ফ্রেম-ফ্রেমে একই ফল আসতে হবে);
 * বাংলা শব্দ কখনো অক্ষর ধরে ভাঙা হয় না (যুক্তাক্ষর অটুট রাখতে শুধু শব্দ/স্পেস ধরে ভাগ)।
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame} from 'remotion';
import {
  CHANNEL_NAME,
  COLORS,
  FONT_FAMILY,
  FPS,
  PALETTE,
  SPRING_POP,
  SPRING_SOFT,
  clamp01,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  progressBetween,
  toBn,
} from './Theme';

/* ================================================================== */
/* অভ্যন্তরীণ হেল্পার                                                    */
/* ================================================================== */

type SpringConfig = {damping?: number; stiffness?: number; mass?: number; overshootClamping?: boolean};

/** স্প্রিং: delay ফ্রেম পর শুরু; ০ → ~১ (ছাড়িয়ে গিয়ে ফেরে) */
const useSpring = (delay = 0, config: SpringConfig = SPRING_POP): number => {
  const frame = useCurrentFrame();
  return spring({frame: frame - delay, fps: FPS, config});
};

/** exitAt ফ্রেম থেকে exitDuration ফ্রেমে ১ → ০ (সরানোর অংশ); exitAt না দিলে সবসময় ১ */
const useExitFactor = (exitAt?: number, exitDuration = 8): number => {
  const frame = useCurrentFrame();
  if (exitAt === undefined) {
    return 1;
  }
  return 1 - easeInOutCubic(progressBetween(frame, exitAt, exitAt + exitDuration));
};

/** সিড-ভিত্তিক সিউডো-র‍্যান্ডম (mulberry32) — প্রতিবার একই ক্রম */
const makeRandom = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const textBase: React.CSSProperties = {
  fontFamily: FONT_FAMILY,
  fontWeight: 700,
  // বাংলার মাত্রা/কার ছাঁটা না পড়ার জন্য একটু বেশি লাইন-হাইট
  lineHeight: 1.4,
};

/* ================================================================== */
/* ৬.১ PopIn / SlideIn                                                  */
/* ================================================================== */

export interface EnterExitProps {
  children?: React.ReactNode;
  /** এই ফ্রেমে প্রবেশ শুরু (লোকাল ফ্রেম) */
  delay?: number;
  /** এই ফ্রেমে প্রস্থান শুরু (না দিলে থাকে) */
  exitAt?: number;
  /** প্রস্থানের দৈর্ঘ্য (ফ্রেম) */
  exitDuration?: number;
  style?: React.CSSProperties;
  config?: SpringConfig;
}

/** স্কেল ০.৪ → ১ (স্প্রিং পপ) + ফেড; প্রস্থানে ছোট হয়ে মিলিয়ে যায় */
export const PopIn: React.FC<EnterExitProps & {fromScale?: number}> = ({
  children,
  delay = 0,
  exitAt,
  exitDuration = 8,
  style,
  config = SPRING_POP,
  fromScale = 0.4,
}) => {
  const enter = useSpring(delay, config);
  const exit = useExitFactor(exitAt, exitDuration);
  const scale = interpolate(enter, [0, 1], [fromScale, 1]) * (0.85 + 0.15 * exit);
  const opacity = clamp01(enter * 1.6) * exit;
  return (
    <div style={{opacity, transform: `scale(${scale})`, ...style}}>{children}</div>
  );
};

export type Direction = 'up' | 'down' | 'left' | 'right';

/** নির্দিষ্ট দিক থেকে স্লাইড করে ঢোকে (distance px) + ফেড; প্রস্থানে একই দিকে ফেরত যায় */
export const SlideIn: React.FC<
  EnterExitProps & {direction?: Direction; distance?: number}
> = ({
  children,
  delay = 0,
  exitAt,
  exitDuration = 8,
  style,
  config = SPRING_SOFT,
  direction = 'up',
  distance = 90,
}) => {
  const enter = useSpring(delay, config);
  const exit = useExitFactor(exitAt, exitDuration);
  // "up" = নিচ থেকে ওপরে উঠে আসে
  const vec: Record<Direction, [number, number]> = {
    up: [0, 1],
    down: [0, -1],
    left: [1, 0],
    right: [-1, 0],
  };
  const [dx, dy] = vec[direction];
  const remain = (1 - enter) + (1 - exit);
  const opacity = clamp01(enter * 1.5) * exit;
  return (
    <div
      style={{
        opacity,
        transform: `translate(${dx * distance * remain}px, ${dy * distance * remain}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ================================================================== */
/* ৬.২ NumberBadge                                                      */
/* ================================================================== */

export interface NumberBadgeProps {
  /** দেখানোর সংখ্যা (১, ২, ৩, ৪ …) — বাংলা অঙ্কে রূপান্তরিত হয় */
  value: number | string;
  color?: string;
  size?: number;
  delay?: number;
  exitAt?: number;
  /** আউটার রিং পালস চালু/বন্ধ */
  pulse?: boolean;
  /** পালস চক্রের দৈর্ঘ্য (ফ্রেম) */
  pulsePeriod?: number;
  style?: React.CSSProperties;
}

/** বড় গোল সংখ্যা-ব্যাজ: স্কেল-বাউন্স প্রবেশ + আউটার রিং পালস */
export const NumberBadge: React.FC<NumberBadgeProps> = ({
  value,
  color = COLORS.gold,
  size = 220,
  delay = 0,
  exitAt,
  pulse = true,
  pulsePeriod = 40,
  style,
}) => {
  const frame = useCurrentFrame();
  const enter = useSpring(delay, {damping: 9, stiffness: 170, mass: 0.7});
  const exit = useExitFactor(exitAt);
  const local = frame - delay;
  const scale = interpolate(enter, [0, 1], [0.2, 1]) * (0.85 + 0.15 * exit);
  const opacity = clamp01(enter * 2) * exit;

  // রিং: প্রতি pulsePeriod ফ্রেমে ভেতর থেকে বাইরে ছড়ায় ও মিলায় (প্রবেশের পরে)
  const cycle = local > 12 && pulse ? ((local - 12) % pulsePeriod) / pulsePeriod : -1;
  const ringScale = cycle >= 0 ? 1 + 0.55 * easeOutCubic(cycle) : 1;
  const ringOpacity = cycle >= 0 ? 0.7 * (1 - cycle) : 0;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        opacity,
        transform: `scale(${scale})`,
        ...style,
      }}
    >
      {/* আউটার রিং */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `${Math.max(6, size * 0.035)}px solid ${color}`,
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
        }}
      />
      {/* ভরাট বৃত্ত */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          backgroundImage: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${color} 46%, ${color} 100%)`,
          border: `${Math.max(6, size * 0.03)}px solid ${COLORS.white}`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.45), 0 0 ${size * 0.25}px ${color}88`,
        }}
      />
      <div
        style={{
          ...textBase,
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.56,
          color: COLORS.navy,
          // বাংলা অঙ্কের গ্লিফ ওপরে-নিচে একটু নিচে বসে — অপটিক্যাল সামঞ্জস্য
          paddingBottom: size * 0.04,
        }}
      >
        {toBn(value)}
      </div>
    </div>
  );
};

/* ================================================================== */
/* ৬.৩ InfoCard                                                         */
/* ================================================================== */

export interface InfoCardProps {
  title: string;
  subtitle?: string;
  /** আইকন (৬.৭ এর যেকোনো আইকন বা যেকোনো ReactNode) */
  icon?: React.ReactNode;
  color?: string;
  width?: number;
  delay?: number;
  exitAt?: number;
  titleSize?: number;
  subtitleSize?: number;
  /** আইকন-বৃত্তের ব্যাস */
  iconSize?: number;
  style?: React.CSSProperties;
}

/** রাউন্ডেড গ্লাস-কার্ড: আইকন-বৃত্ত + শিরোনাম + উপ-লাইন, রঙিন বর্ডার গ্লো (ধীর স্পন্দন) */
export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  icon,
  color = COLORS.teal,
  width = 950,
  delay = 0,
  exitAt,
  titleSize = 54,
  subtitleSize = 38,
  iconSize = 150,
  style,
}) => {
  const frame = useCurrentFrame();
  const enter = useSpring(delay, SPRING_POP);
  const exit = useExitFactor(exitAt);
  const scale = interpolate(enter, [0, 1], [0.8, 1]) * (0.9 + 0.1 * exit);
  const slide = interpolate(enter, [0, 1], [60, 0]);
  const opacity = clamp01(enter * 1.6) * exit;
  const glow = 0.55 + 0.25 * Math.sin(((frame - delay) / FPS) * Math.PI * 1.6);

  return (
    <div
      style={{
        width,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 28,
        padding: '22px 34px 26px 24px',
        borderRadius: 40,
        backgroundImage: `linear-gradient(135deg, rgba(18,48,74,0.92) 0%, rgba(11,27,43,0.9) 100%)`,
        border: `4px solid ${color}`,
        boxShadow: `0 14px 36px rgba(0,0,0,0.5), 0 0 ${34 * glow}px ${color}`,
        opacity,
        transform: `translateY(${slide}px) scale(${scale})`,
        ...style,
      }}
    >
      {icon !== undefined && (
        <div
          style={{
            flex: '0 0 auto',
            width: iconSize,
            height: iconSize,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${color}2e`,
            border: `3px solid ${color}`,
          }}
        >
          {icon}
        </div>
      )}
      <div style={{display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0}}>
        <div style={{...textBase, fontSize: titleSize, color: COLORS.white}}>{title}</div>
        {subtitle !== undefined && (
          <div style={{...textBase, fontSize: subtitleSize, color, lineHeight: 1.35}}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

/* ================================================================== */
/* ৬.৪ ProgressRing                                                     */
/* ================================================================== */

export interface ProgressRingProps {
  /** অর্জিত মান (যেমন ৪) */
  value: number;
  /** মোট (ডিফল্ট ১৬) */
  total?: number;
  size?: number;
  color?: string;
  delay?: number;
  /** ভরতে কত ফ্রেম লাগবে */
  duration?: number;
  exitAt?: number;
  /** নিচের ছোট লেখা (যেমন "সুন্নাহ") */
  label?: string;
  style?: React.CSSProperties;
}

/** বৃত্তাকার অগ্রগতি: স্ট্রোক ভরে + মাঝের সংখ্যা ০ → value গোনে, নিচে "/ মোট" */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  total = 16,
  size = 280,
  color = COLORS.teal,
  delay = 0,
  duration = 45,
  exitAt,
  label,
  style,
}) => {
  const frame = useCurrentFrame();
  const enter = useSpring(delay, SPRING_SOFT);
  const exit = useExitFactor(exitAt);
  const p = easeOutCubic(progressBetween(frame, delay + 6, delay + 6 + duration));
  const shown = Math.round(value * p);
  const stroke = size * 0.1;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const frac = (value / total) * p;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        opacity: clamp01(enter * 1.6) * exit,
        transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])})`,
        ...style,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow: 'visible'}}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="rgba(11,27,43,0.72)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circ * frac} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{filter: `drop-shadow(0 0 10px ${color})`}}
        />
      </svg>
      <div
        style={{
          ...textBase,
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.white,
        }}
      >
        <div style={{fontSize: size * 0.36, lineHeight: 1.1, color}}>{toBn(shown)}</div>
        <div style={{fontSize: size * 0.15, lineHeight: 1.2, color: COLORS.white}}>
          / {toBn(total)}
        </div>
        {label !== undefined && (
          <div style={{fontSize: size * 0.11, lineHeight: 1.3, color: COLORS.gray}}>{label}</div>
        )}
      </div>
    </div>
  );
};

/* ================================================================== */
/* ৬.৭ SVG আইকন সেট (নিজে আঁকা; বাইরের ছবি/প্যাকেজ লাগে না)                 */
/* ================================================================== */

export interface IconProps {
  size?: number;
  /** প্রধান রঙ (স্ট্রোক/ভরাট) */
  color?: string;
  /** দ্বিতীয় রঙ (ক্রস/টিক ইত্যাদির জন্য) */
  accent?: string;
  strokeWidth?: number;
  /** ০..১ — আঁকার অগ্রগতি (১ = সম্পূর্ণ আঁকা)। না দিলে সম্পূর্ণ */
  draw?: number;
  style?: React.CSSProperties;
}

const ICON_DEFAULTS = {size: 100, color: COLORS.white, accent: COLORS.coral, strokeWidth: 6, draw: 1};

/** একটা স্ট্রোক-পাথ যা `draw` অনুযায়ী আঁকা হয় (pathLength=1 কৌশল) */
const Stroke: React.FC<{
  d: string;
  color: string;
  width: number;
  draw: number;
  from?: number;
  to?: number;
  fill?: string;
}> = ({d, color, width, draw, from = 0, to = 1, fill = 'none'}) => {
  const local = clamp01((draw - from) / (to - from));
  return (
    <path
      d={d}
      fill={fill}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - local}
      opacity={local > 0 ? 1 : 0}
    />
  );
};

const IconSvg: React.FC<{size: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
  size,
  style,
  children,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible', ...style}}>
    {children}
  </svg>
);

/** ফেড-ইন সাহায্যকারী: draw এর শেষ অংশে ভরাট আকার ফুটে ওঠে */
const fillOpacity = (draw: number, from = 0.5): number => clamp01((draw - from) / (1 - from));

/** ✔ টিক */
export const CheckIcon: React.FC<IconProps> = (p) => {
  const {size, color, strokeWidth, draw, style} = {...ICON_DEFAULTS, color: COLORS.lime, strokeWidth: 12, ...p};
  return (
    <IconSvg size={size} style={style}>
      <Stroke d="M20 54 L42 76 L82 26" color={color} width={strokeWidth} draw={draw} />
    </IconSvg>
  );
};

/** ✖ ক্রস / নিষেধ চিহ্ন */
export const CrossMark: React.FC<IconProps> = (p) => {
  const {size, accent, strokeWidth, draw, style} = {...ICON_DEFAULTS, strokeWidth: 13, ...p};
  const color = p.color ?? accent;
  return (
    <IconSvg size={size} style={style}>
      <Stroke d="M24 24 L76 76" color={color} width={strokeWidth} draw={draw} from={0} to={0.5} />
      <Stroke d="M76 24 L24 76" color={color} width={strokeWidth} draw={draw} from={0.5} to={1} />
    </IconSvg>
  );
};

/** 🚫 গোল নিষেধ-চিহ্ন (বৃত্ত + কোনাকুনি দাগ) */
export const NoMark: React.FC<IconProps> = (p) => {
  const {size, accent, strokeWidth, draw, style} = {...ICON_DEFAULTS, ...p};
  const color = p.color ?? accent;
  return (
    <IconSvg size={size} style={style}>
      <Stroke d="M50 8 A42 42 0 1 1 49.99 8" color={color} width={strokeWidth + 2} draw={draw} from={0} to={0.65} />
      <Stroke d="M22 22 L78 78" color={color} width={strokeWidth + 2} draw={draw} from={0.55} to={1} />
    </IconSvg>
  );
};

/** 🧭 কেবলা-কম্পাস: বৃত্ত + চার দিকের টিক + কেন্দ্রে কা'বা-ঘর (চৌকো) + উত্তরমুখী তীর */
export const QiblaIcon: React.FC<IconProps> = (p) => {
  const {size, color, accent, strokeWidth, draw, style} = {...ICON_DEFAULTS, accent: COLORS.gold, ...p};
  return (
    <IconSvg size={size} style={style}>
      <Stroke d="M50 6 A44 44 0 1 1 49.99 6" color={color} width={strokeWidth} draw={draw} from={0} to={0.6} />
      <Stroke d="M50 6 L50 14 M94 50 L86 50 M50 94 L50 86 M6 50 L14 50" color={color} width={strokeWidth - 1} draw={draw} from={0.4} to={0.8} />
      {/* কা'বা-ঘর */}
      <rect
        x="36"
        y="48"
        width="28"
        height="28"
        rx="3"
        fill={accent}
        stroke={color}
        strokeWidth={strokeWidth - 2}
        opacity={fillOpacity(draw, 0.6)}
      />
      <path d="M36 57 H64" stroke={color} strokeWidth="3" opacity={fillOpacity(draw, 0.7)} />
      {/* তীর */}
      <Stroke d="M50 44 L50 20 M40 30 L50 18 L60 30" color={accent} width={strokeWidth} draw={draw} from={0.6} to={1} />
    </IconSvg>
  );
};

/** 🧎 বসা মানুষ (পাশ থেকে, সরল): মাথা + শরীর + হাঁটু-পা */
export const SittingPerson: React.FC<IconProps> = (p) => {
  const {size, color, strokeWidth, draw, style} = {...ICON_DEFAULTS, strokeWidth: 8, ...p};
  return (
    <IconSvg size={size} style={style}>
      <circle cx="40" cy="20" r="10" fill={color} opacity={fillOpacity(draw, 0)} />
      {/* শরীর → উরু → হাঁটু → পায়ের পাতা */}
      <Stroke d="M40 34 L40 60 L68 60 L68 82" color={color} width={strokeWidth + 4} draw={draw} />
      {/* হাত */}
      <Stroke d="M40 42 L58 52" color={color} width={strokeWidth} draw={draw} from={0.4} to={1} />
      {/* ভূমি */}
      <Stroke d="M22 88 H84" color={color} width={strokeWidth - 2} draw={draw} from={0.6} to={1} />
    </IconSvg>
  );
};

/** 🧍 দাঁড়ানো মানুষ (সামনে থেকে, সরল) */
export const StandingPerson: React.FC<IconProps> = (p) => {
  const {size, color, strokeWidth, draw, style} = {...ICON_DEFAULTS, strokeWidth: 8, ...p};
  return (
    <IconSvg size={size} style={style}>
      <circle cx="50" cy="16" r="10" fill={color} opacity={fillOpacity(draw, 0)} />
      <Stroke d="M50 30 L50 60" color={color} width={strokeWidth + 4} draw={draw} />
      <Stroke d="M30 44 L50 36 L70 44" color={color} width={strokeWidth} draw={draw} from={0.3} to={1} />
      <Stroke d="M50 60 L36 90 M50 60 L64 90" color={color} width={strokeWidth + 2} draw={draw} from={0.4} to={1} />
    </IconSvg>
  );
};

/** 🧍❌ দাঁড়ানো মানুষ + লাল ক্রস (দাঁড়িয়ে প্রস্রাব না করা) */
export const StandingCross: React.FC<IconProps> = (p) => {
  const {size, color, accent, draw, style} = {...ICON_DEFAULTS, ...p};
  return (
    <div style={{position: 'relative', width: size, height: size, ...style}}>
      <StandingPerson size={size * 0.82} color={color} draw={Math.min(1, draw * 2)} style={{position: 'absolute', left: size * 0.04, top: size * 0.09}} />
      <CrossMark
        size={size * 0.62}
        color={accent}
        draw={clamp01(draw * 2 - 1)}
        strokeWidth={14}
        style={{position: 'absolute', right: -size * 0.02, top: -size * 0.02}}
      />
    </div>
  );
};

/** 🧎✔ বসা মানুষ + টিক (বসে প্রস্রাব-পায়খানা করা) */
export const SittingCheck: React.FC<IconProps> = (p) => {
  const {size, color, accent, draw, style} = {...ICON_DEFAULTS, accent: COLORS.lime, ...p};
  return (
    <div style={{position: 'relative', width: size, height: size, ...style}}>
      <SittingPerson size={size * 0.82} color={color} draw={Math.min(1, draw * 2)} style={{position: 'absolute', left: size * 0.0, top: size * 0.1}} />
      <CheckIcon
        size={size * 0.5}
        color={accent}
        draw={clamp01(draw * 2 - 1)}
        style={{position: 'absolute', right: -size * 0.02, top: -size * 0.04}}
      />
    </div>
  );
};

/** 👕 কাপড়/ঢাকা চিহ্ন: ভাঁজ-করা কাপড়ের মতো তরঙ্গায়িত চাদর */
export const ClothIcon: React.FC<IconProps> = (p) => {
  const {size, color, accent, strokeWidth, draw, style} = {...ICON_DEFAULTS, accent: COLORS.sky, ...p};
  return (
    <IconSvg size={size} style={style}>
      <path
        d="M14 26 Q32 14 50 26 T86 26 L86 70 Q68 82 50 70 T14 70 Z"
        fill={accent}
        opacity={fillOpacity(draw, 0.4) * 0.9}
      />
      <Stroke
        d="M14 26 Q32 14 50 26 T86 26 L86 70 Q68 82 50 70 T14 70 Z"
        color={color}
        width={strokeWidth}
        draw={draw}
      />
      <Stroke d="M30 36 Q36 48 30 62 M50 38 Q56 50 50 64 M70 36 Q76 48 70 62" color={color} width={4} draw={draw} from={0.5} to={1} />
    </IconSvg>
  );
};

/** 💧 পানির ফোঁটা */
export const WaterDrop: React.FC<IconProps> = (p) => {
  const {size, color, strokeWidth, draw, style} = {...ICON_DEFAULTS, color: COLORS.sky, ...p};
  const d = 'M50 8 C50 8 20 44 20 62 A30 30 0 0 0 80 62 C80 44 50 8 50 8 Z';
  return (
    <IconSvg size={size} style={style}>
      <path d={d} fill={color} opacity={fillOpacity(draw, 0.45) * 0.85} />
      <Stroke d={d} color={COLORS.white} width={strokeWidth - 1} draw={draw} />
      <Stroke d="M34 62 A16 16 0 0 0 46 77" color={COLORS.white} width={5} draw={draw} from={0.6} to={1} />
    </IconSvg>
  );
};

/** 🧱 ঢিলা/কুলুপ (মাটির টুকরো): অমসৃণ ডেলা */
export const ClodIcon: React.FC<IconProps> = (p) => {
  const {size, color, strokeWidth, draw, style} = {...ICON_DEFAULTS, color: '#C58B55', ...p};
  const d = 'M16 62 L22 40 L40 28 L62 30 L82 44 L86 66 L70 80 L36 82 Z';
  return (
    <IconSvg size={size} style={style}>
      <path d={d} fill={color} opacity={fillOpacity(draw, 0.4)} />
      <Stroke d={d} color={COLORS.white} width={strokeWidth - 1} draw={draw} />
      <Stroke d="M34 48 L46 56 M58 46 L66 58 M40 68 L52 70" color="#7a4d28" width={4} draw={draw} from={0.55} to={1} />
    </IconSvg>
  );
};

/** 🧻 টয়লেট পেপার/টিস্যু রোল */
export const TissueIcon: React.FC<IconProps> = (p) => {
  const {size, color, strokeWidth, draw, style} = {...ICON_DEFAULTS, ...p};
  return (
    <IconSvg size={size} style={style}>
      <rect x="22" y="22" width="52" height="56" rx="8" fill={color} opacity={fillOpacity(draw, 0.4) * 0.92} />
      <Stroke d="M22 22 H66 A8 8 0 0 1 74 30 V70 A8 8 0 0 1 66 78 H30 A8 8 0 0 1 22 70 Z" color={COLORS.white} width={strokeWidth - 1} draw={draw} />
      {/* ঝুলন্ত পাতা */}
      <path d="M74 62 H84 V84 H74" fill="none" stroke={COLORS.white} strokeWidth="5" opacity={fillOpacity(draw, 0.6)} strokeLinejoin="round" />
      {/* কেন্দ্র-গর্ত */}
      <ellipse cx="38" cy="50" rx="7" ry="12" fill={COLORS.navy} opacity={fillOpacity(draw, 0.6)} />
    </IconSvg>
  );
};

/** ⚠ সতর্কতা-ঢাল + বিস্ময়চিহ্ন */
export const ShieldIcon: React.FC<IconProps> = (p) => {
  const {size, color, strokeWidth, draw, style} = {...ICON_DEFAULTS, color: COLORS.gold, ...p};
  const d = 'M50 8 L84 20 V50 C84 72 68 86 50 94 C32 86 16 72 16 50 V20 Z';
  return (
    <IconSvg size={size} style={style}>
      <path d={d} fill={color} opacity={fillOpacity(draw, 0.4) * 0.9} />
      <Stroke d={d} color={COLORS.white} width={strokeWidth} draw={draw} />
      <Stroke d="M50 30 V56" color={COLORS.navy} width={strokeWidth + 4} draw={draw} from={0.6} to={1} />
      <circle cx="50" cy="71" r="5.5" fill={COLORS.navy} opacity={fillOpacity(draw, 0.8)} />
    </IconSvg>
  );
};

/** ★ তারা */
export const StarIcon: React.FC<IconProps> = (p) => {
  const {size, color, strokeWidth, draw, style} = {...ICON_DEFAULTS, color: COLORS.gold, ...p};
  const d = 'M50 8 L61 36 L91 38 L68 57 L76 87 L50 70 L24 87 L32 57 L9 38 L39 36 Z';
  return (
    <IconSvg size={size} style={style}>
      <path d={d} fill={color} opacity={fillOpacity(draw, 0.4)} />
      <Stroke d={d} color={COLORS.white} width={Math.max(3, strokeWidth - 2)} draw={draw} />
    </IconSvg>
  );
};

/** 🔔 ঘণ্টা */
export const BellIcon: React.FC<IconProps> = (p) => {
  const {size, color, strokeWidth, draw, style} = {...ICON_DEFAULTS, color: COLORS.gold, ...p};
  const d = 'M50 12 C34 12 28 26 28 40 C28 58 22 62 16 70 H84 C78 62 72 58 72 40 C72 26 66 12 50 12 Z';
  return (
    <IconSvg size={size} style={style}>
      <path d={d} fill={color} opacity={fillOpacity(draw, 0.4)} />
      <Stroke d={d} color={COLORS.white} width={strokeWidth - 1} draw={draw} />
      <path d="M42 78 A8 8 0 0 0 58 78" fill={color} stroke={COLORS.white} strokeWidth="5" opacity={fillOpacity(draw, 0.7)} />
    </IconSvg>
  );
};

/** ▶ প্লে-বাটন */
export const PlayButton: React.FC<IconProps> = (p) => {
  const {size, color, strokeWidth, draw, style} = {...ICON_DEFAULTS, color: COLORS.coral, ...p};
  return (
    <IconSvg size={size} style={style}>
      <rect x="6" y="20" width="88" height="60" rx="18" fill={color} opacity={fillOpacity(draw, 0.3)} />
      <Stroke d="M24 20 H76 A18 18 0 0 1 94 38 V62 A18 18 0 0 1 76 80 H24 A18 18 0 0 1 6 62 V38 A18 18 0 0 1 24 20 Z" color={COLORS.white} width={strokeWidth - 1} draw={draw} />
      <path d="M42 34 L66 50 L42 66 Z" fill={COLORS.white} opacity={fillOpacity(draw, 0.6)} />
    </IconSvg>
  );
};

/** ➜ তীর (ডান দিকে) — প্রবাহ-চিত্রের ছোট চিহ্ন */
export const ArrowIcon: React.FC<IconProps> = (p) => {
  const {size, color, strokeWidth, draw, style} = {...ICON_DEFAULTS, color: COLORS.gold, strokeWidth: 10, ...p};
  return (
    <IconSvg size={size} style={style}>
      <Stroke d="M14 50 H82 M60 28 L84 50 L60 72" color={color} width={strokeWidth} draw={draw} />
    </IconSvg>
  );
};

/** সব আইকনের ম্যাপ — নাম ধরে ব্যবহার: `const I = Icons.qibla; <I size={120} />` */
export const Icons = {
  check: CheckIcon,
  cross: CrossMark,
  no: NoMark,
  qibla: QiblaIcon,
  sitting: SittingPerson,
  sittingCheck: SittingCheck,
  standing: StandingPerson,
  standingCross: StandingCross,
  cloth: ClothIcon,
  drop: WaterDrop,
  clod: ClodIcon,
  tissue: TissueIcon,
  shield: ShieldIcon,
  star: StarIcon,
  bell: BellIcon,
  play: PlayButton,
  arrow: ArrowIcon,
} as const;

export type IconName = keyof typeof Icons;

/* ================================================================== */
/* ৬.৫ SunnahGrid                                                       */
/* ================================================================== */

export type CellKind = 'known' | 'today' | 'remaining';

export interface GridGroup {
  /** প্রথম ঘরের সূচক (০ থেকে) */
  start: number;
  /** কয়টা ঘর */
  count: number;
  kind: CellKind;
  /** এই ফ্রেমে (লোকাল) গ্রুপ সক্রিয় হয় */
  at: number;
}

export interface SunnahGridProps {
  total?: number;
  cols?: number;
  cellSize?: number;
  gap?: number;
  groups: GridGroup[];
  /** পুরো গ্রিড ঢোকার ফ্রেম */
  delay?: number;
  exitAt?: number;
  /** "known" ঘরের রঙ */
  knownColor?: string;
  todayColor?: string;
  remainingColor?: string;
  style?: React.CSSProperties;
}

/**
 * ১৬ ঘরের গ্রিড (ডিফল্ট ৪×৪)। প্রতিটি ঘরে সুন্নাহ-নম্বর (বাংলায়)।
 *  - known (সবুজ ✓): আগে জানা/সম্পূর্ণ
 *  - today (গোল্ড পালস): আজকের ৪টি
 *  - remaining (ধূসর আউটলাইন, মৃদু পালস): বাকি
 * গ্রুপ সক্রিয় না হওয়া পর্যন্ত ঘর "নিষ্ক্রিয়" (ক্ষীণ আউটলাইন)।
 */
export const SunnahGrid: React.FC<SunnahGridProps> = ({
  total = 16,
  cols = 4,
  cellSize = 112,
  gap = 18,
  groups,
  delay = 0,
  exitAt,
  knownColor = COLORS.lime,
  todayColor = COLORS.gold,
  remainingColor = COLORS.gray,
  style,
}) => {
  const frame = useCurrentFrame();
  const gridEnter = useSpring(delay, SPRING_SOFT);
  const exit = useExitFactor(exitAt);
  const rows = Math.ceil(total / cols);
  const width = cols * cellSize + (cols - 1) * gap;
  const height = rows * cellSize + (rows - 1) * gap;

  const cells = Array.from({length: total}, (_, i) => {
    const group = groups.find((g) => i >= g.start && i < g.start + g.count);
    if (!group) {
      return {i, group: undefined, local: -1};
    }
    // গ্রুপের ভেতরে ক্রমানুসারে ৩ ফ্রেম ব্যবধানে
    return {i, group, local: frame - group.at - (i - group.start) * 3};
  });

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        opacity: clamp01(gridEnter * 1.6) * exit,
        transform: `scale(${interpolate(gridEnter, [0, 1], [0.85, 1])})`,
        ...style,
      }}
    >
      {cells.map(({i, group, local}) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const active = group !== undefined && local >= 0;
        const kind = group?.kind;
        const pop = active
          ? spring({frame: local, fps: FPS, config: {damping: 9, stiffness: 200, mass: 0.6}})
          : 0;
        const baseColor =
          kind === 'known' ? knownColor : kind === 'today' ? todayColor : remainingColor;
        const pulse =
          active && kind !== 'known'
            ? 0.5 + 0.5 * Math.sin((local / FPS) * Math.PI * (kind === 'today' ? 3 : 1.6))
            : 0;
        const scale = active ? interpolate(pop, [0, 1], [0.6, 1]) * (1 + 0.06 * pulse) : 1;

        const filled = active && kind !== 'remaining';
        const bg = filled ? baseColor : 'rgba(11,27,43,0.55)';
        const border = active ? baseColor : 'rgba(255,255,255,0.22)';
        const fg = filled ? COLORS.navy : active ? baseColor : 'rgba(255,255,255,0.4)';

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: col * (cellSize + gap),
              top: row * (cellSize + gap),
              width: cellSize,
              height: cellSize,
              boxSizing: 'border-box',
              borderRadius: cellSize * 0.24,
              backgroundColor: bg,
              border: `${active ? 5 : 3}px solid ${border}`,
              boxShadow: active
                ? `0 6px 16px rgba(0,0,0,0.4), 0 0 ${12 + 22 * pulse}px ${baseColor}${filled ? 'cc' : '77'}`
                : 'none',
              transform: `scale(${scale})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {active && kind === 'known' ? (
              <CheckIcon size={cellSize * 0.62} color={COLORS.navy} strokeWidth={14} draw={clamp01(local / 8)} />
            ) : (
              <span style={{...textBase, fontSize: cellSize * 0.46, color: fg, paddingBottom: cellSize * 0.04}}>
                {toBn(i + 1)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ================================================================== */
/* ৬.৬ FlowLine / StepArrow                                             */
/* ================================================================== */

export interface FlowLineProps {
  /** শুরু ও শেষ বিন্দু (SVG-র নিজস্ব স্থানাঙ্ক, পিক্সেল) */
  from: [number, number];
  to: [number, number];
  /** SVG ক্যানভাসের মাপ (ডিফল্ট: পুরো ফ্রেম 1080×1920) */
  width?: number;
  height?: number;
  color?: string;
  lineWidth?: number;
  /** কত ফ্রেমে আঁকা শেষ */
  duration?: number;
  delay?: number;
  exitAt?: number;
  /** তীরের মাথা */
  head?: boolean;
  /** বাঁকা রেখা (০ = সোজা; ধনাত্মক/ঋণাত্মক = বাঁকের পরিমাণ px) */
  curve?: number;
  /** ড্যাশ-ড্যাশ ধরনের (আঁকা শেষে) */
  dashed?: boolean;
  style?: React.CSSProperties;
}

/** stroke-dashoffset দিয়ে আঁকা প্রবাহ-রেখা (+ ঐচ্ছিক তীরের মাথা) */
export const FlowLine: React.FC<FlowLineProps> = ({
  from,
  to,
  width = 1080,
  height = 1920,
  color = COLORS.gold,
  lineWidth = 12,
  duration = 20,
  delay = 0,
  exitAt,
  head = true,
  curve = 0,
  dashed = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const exit = useExitFactor(exitAt);
  const t = easeInOutCubic(progressBetween(frame, delay, delay + duration));
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  // বাঁকের কন্ট্রোল পয়েন্ট (লম্ব দিকে)
  const cx = (x1 + x2) / 2 - (dy / len) * curve;
  const cy = (y1 + y2) / 2 + (dx / len) * curve;
  // শেষ বিন্দুর স্পর্শক দিক
  const tx = x2 - cx;
  const ty = y2 - cy;
  const angle = (Math.atan2(curve === 0 ? dy : ty, curve === 0 ? dx : tx) * 180) / Math.PI;
  const headSize = lineWidth * 2.6;
  const headOpacity = clamp01((t - 0.85) / 0.15);
  // ড্যাশ ধরন: আঁকা শেষে ড্যাশ-প্যাটার্ন; আঁকার সময় সম্পূর্ণ ঢাকা
  const drawn = t >= 1;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: exit, ...style}}
    >
      <path
        d={`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth={lineWidth}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={dashed && drawn ? '0.05 0.04' : 1}
        strokeDashoffset={dashed && drawn ? 0 : 1 - t}
        style={{filter: `drop-shadow(0 0 8px ${color})`}}
      />
      {head && (
        <g transform={`translate(${x2} ${y2}) rotate(${angle})`} opacity={headOpacity}>
          <path
            d={`M${-headSize} ${-headSize * 0.62} L0 0 L${-headSize} ${headSize * 0.62}`}
            fill="none"
            stroke={color}
            strokeWidth={lineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
};

export interface StepArrowProps {
  /** তীরের দৈর্ঘ্য (px) */
  length?: number;
  direction?: 'right' | 'down';
  color?: string;
  lineWidth?: number;
  delay?: number;
  duration?: number;
  exitAt?: number;
  style?: React.CSSProperties;
}

/** ধাপ-প্রবাহের ছোট তীর (ঢিলা → পানি): নিজের আকারের বাক্সে আঁকে, flex/absolute লেআউটে বসানো সহজ */
export const StepArrow: React.FC<StepArrowProps> = ({
  length = 150,
  direction = 'right',
  color = COLORS.gold,
  lineWidth = 12,
  delay = 0,
  duration = 16,
  exitAt,
  style,
}) => {
  const pad = lineWidth * 2.2;
  const horizontal = direction === 'right';
  const w = horizontal ? length : pad * 2;
  const h = horizontal ? pad * 2 : length;
  const from: [number, number] = horizontal ? [lineWidth, h / 2] : [w / 2, lineWidth];
  const to: [number, number] = horizontal ? [w - lineWidth, h / 2] : [w / 2, h - lineWidth];
  return (
    <div style={{position: 'relative', width: w, height: h, ...style}}>
      <FlowLine
        from={from}
        to={to}
        width={w}
        height={h}
        color={color}
        lineWidth={lineWidth}
        delay={delay}
        duration={duration}
        exitAt={exitAt}
      />
    </div>
  );
};

/* ================================================================== */
/* ৬.৮ Particles                                                        */
/* ================================================================== */

export interface ParticlesProps {
  count?: number;
  seed?: number;
  colors?: readonly string[];
  /** কণা যে বাক্সে ভাসবে (ডিফল্ট: পুরো ফ্রেম) */
  area?: {x: number; y: number; width: number; height: number};
  shape?: 'star' | 'circle' | 'mixed';
  /** ধীর = ০.৫, ডিফল্ট ১ */
  speed?: number;
  minSize?: number;
  maxSize?: number;
  /** সর্বোচ্চ স্বচ্ছতা (০..১) */
  opacity?: number;
  /** ভাসার দিক: true = নিচ থেকে ওপরে */
  rise?: boolean;
  style?: React.CSSProperties;
}

const STAR_POINTS = '50,4 61,36 95,38 68,58 77,92 50,72 23,92 32,58 5,38 39,36';

/**
 * সিড-ভিত্তিক ভাসমান তারা/বৃত্ত। প্রতিটি কণার পথ ফ্রেমের খাঁটি ফাংশন →
 * রেন্ডারে (সমান্তরাল ফ্রেমেও) একই ফল। চক্রের শুরু-শেষে ফেড, তাই লাফ দেখা যায় না।
 */
export const Particles: React.FC<ParticlesProps> = ({
  count = 28,
  seed = 7,
  colors = [COLORS.gold, COLORS.white, COLORS.teal, COLORS.sky],
  area = {x: 0, y: 0, width: 1080, height: 1920},
  shape = 'mixed',
  speed = 1,
  minSize = 10,
  maxSize = 30,
  opacity = 0.8,
  rise = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const particles = React.useMemo(() => {
    const rnd = makeRandom(seed);
    return Array.from({length: count}, (_, i) => {
      const size = minSize + rnd() * (maxSize - minSize);
      return {
        x: rnd(),
        phase: rnd(),
        period: 160 + rnd() * 220, // ফ্রেমে এক চক্র
        drift: 14 + rnd() * 40,
        wobble: 0.6 + rnd() * 1.4,
        size,
        color: colors[Math.floor(rnd() * colors.length) % colors.length],
        isStar: shape === 'star' ? true : shape === 'circle' ? false : rnd() > 0.5,
        spin: (rnd() - 0.5) * 2,
        id: i,
      };
    });
  }, [count, seed, colors, shape, minSize, maxSize]);

  return (
    <AbsoluteFill style={{pointerEvents: 'none', ...style}}>
      {particles.map((p) => {
        const cycle = (((frame * speed) / p.period + p.phase) % 1 + 1) % 1;
        const y = rise ? 1 - cycle : cycle;
        const px = area.x + p.x * area.width + Math.sin(cycle * Math.PI * 2 * p.wobble) * p.drift;
        const py = area.y + y * area.height;
        // শুরু ও শেষে ফেড
        const fade = Math.min(1, cycle / 0.15, (1 - cycle) / 0.15);
        const twinkle = 0.7 + 0.3 * Math.sin((frame / FPS) * Math.PI * 2 * p.wobble + p.id);
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: px - p.size / 2,
              top: py - p.size / 2,
              width: p.size,
              height: p.size,
              opacity: opacity * clamp01(fade) * twinkle,
              transform: `rotate(${frame * p.spin * 1.5}deg)`,
              filter: `drop-shadow(0 0 ${p.size * 0.4}px ${p.color})`,
            }}
          >
            {p.isStar ? (
              <svg width={p.size} height={p.size} viewBox="0 0 100 100">
                <polygon points={STAR_POINTS} fill={p.color} />
              </svg>
            ) : (
              <div style={{width: '100%', height: '100%', borderRadius: '50%', backgroundColor: p.color}} />
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* ৬.৯ WipeTransition                                                   */
/* ================================================================== */

export interface WipeTransitionProps {
  /** মোট দৈর্ঘ্য (ফ্রেম) — ডিফল্ট ১০ (০.৪s)। প্রথম অর্ধেক ঢাকে, দ্বিতীয় অর্ধেক খোলে */
  duration?: number;
  color?: string;
  variant?: 'slide' | 'circle' | 'diagonal';
  /** ওয়াইপ যে অনুভূমিক ফালিতে চলবে (ডিফল্ট: পুরো ফ্রেম)। বক্তার মুখ বাঁচাতে ZONES.info ব্যবহার করুন */
  region?: {top: number; height: number};
  /** আবরণ মোটামুটি পুরো ঢাকলে (মাঝখানে) ভেতরে কী দেখাবে (যেমন ছোট লোগো) */
  children?: React.ReactNode;
}

/**
 * সিন বদলের রঙিন ওয়াইপ। <Sequence from={সীমানা - duration/2} durationInFrames={duration}> এর ভেতরে বসান;
 * মাঝের ফ্রেমে (duration/2) আবরণ সবচেয়ে বেশি — ঠিক ঐ মুহূর্তে সিন বদলান।
 */
export const WipeTransition: React.FC<WipeTransitionProps> = ({
  duration = 10,
  color = COLORS.teal,
  variant = 'slide',
  region = {top: 0, height: 1920},
  children,
}) => {
  const frame = useCurrentFrame();
  const half = duration / 2;
  const cover = easeInOutCubic(progressBetween(frame, 0, half)); // ০ → ১
  const reveal = easeInOutCubic(progressBetween(frame, half, duration)); // ০ → ১

  let clip: string;
  if (variant === 'circle') {
    // কেন্দ্র থেকে বৃত্ত বড় হয়, তারপর বৃত্ত-ছিদ্র বড় হয়ে খুলে যায়
    const maxR = 150; // %
    const outer = cover * maxR;
    clip = `circle(${outer}% at 50% 50%)`;
  } else if (variant === 'diagonal') {
    const a = -20 + cover * 140;
    clip = `polygon(0 0, ${a}% 0, ${a - 20}% 100%, 0 100%)`;
  } else {
    clip = `inset(0 ${100 - cover * 100}% 0 0)`;
  }

  // খোলার সময়: ডান থেকে মুছে যায় (slide/diagonal), বৃত্তের জন্য ছোট হয়
  const revealStyle: React.CSSProperties =
    variant === 'circle'
      ? {clipPath: `circle(${(1 - reveal) * 150}% at 50% 50%)`}
      : {clipPath: clip, transform: `translateX(${reveal * 105}%)`};

  const isRevealing = frame >= half;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: region.top,
        height: region.height,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(135deg, ${color} 0%, ${COLORS.navy2} 140%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(isRevealing ? revealStyle : {clipPath: clip}),
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** সিন-সীমানার ক্রমিক নম্বর থেকে রঙ (প্যালেট ঘুরে) */
export const wipeColor = (index: number): string => PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];

/* ================================================================== */
/* ৬.১০ AnimatedTitle                                                   */
/* ================================================================== */

export interface AnimatedTitleProps {
  /** শিরোনামের লেখা — স্পেস ধরে শব্দে ভাগ হয় (অক্ষর কখনো নয়) */
  text: string;
  fontSize?: number;
  color?: string;
  /** দিলে লেখায় গ্রেডিয়েন্ট (CSS color-stop তালিকা, যেমন [gold, coral]) */
  gradient?: readonly string[];
  delay?: number;
  /** শব্দের মধ্যে ব্যবধান (ফ্রেম) */
  stagger?: number;
  underline?: boolean;
  underlineColor?: string;
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
  exitAt?: number;
  style?: React.CSSProperties;
}

/** শব্দ-ধরে-ধরে ফুটে ওঠা শিরোনাম (প্রতি শব্দ স্প্রিং-পপ) + ঐচ্ছিক গ্রেডিয়েন্ট ও আঁকা আন্ডারলাইন */
export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  text,
  fontSize = 96,
  color = COLORS.white,
  gradient,
  delay = 0,
  stagger = 5,
  underline = true,
  underlineColor = COLORS.gold,
  align = 'center',
  maxWidth = 950,
  exitAt,
  style,
}) => {
  const frame = useCurrentFrame();
  const exit = useExitFactor(exitAt);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const lastStart = delay + (words.length - 1) * stagger;
  const underlineT = easeOutCubic(progressBetween(frame, lastStart + 6, lastStart + 24));
  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  const wordStyle = (): React.CSSProperties =>
    gradient && gradient.length > 0
      ? {
          backgroundImage: `linear-gradient(90deg, ${gradient.join(', ')})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
        }
      : {color};

  return (
    <div
      style={{
        position: 'relative',
        maxWidth,
        opacity: exit,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: justify,
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: justify,
          columnGap: fontSize * 0.28,
          // ড্রপ-শ্যাডো পুরো লাইনে (গ্রেডিয়েন্ট টেক্সটেও কাজ করে)
          filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.55))',
        }}
      >
        {words.map((w, i) => {
          const s = spring({frame: frame - (delay + i * stagger), fps: FPS, config: SPRING_POP});
          return (
            <span
              key={`${w}-${i}`}
              style={{
                ...textBase,
                display: 'inline-block',
                fontSize,
                opacity: clamp01(s * 1.8),
                transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px) scale(${interpolate(s, [0, 1], [0.7, 1])})`,
                // শব্দ একটাই span — যুক্তাক্ষর অটুট
                ...wordStyle(),
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      {underline && (
        <svg
          width={Math.min(maxWidth, 760)}
          height={fontSize * 0.2}
          viewBox="0 0 400 20"
          preserveAspectRatio="none"
          style={{marginTop: -fontSize * 0.04, overflow: 'visible'}}
        >
          <path
            d="M6 12 Q100 2 200 11 T394 8"
            fill="none"
            stroke={underlineColor}
            strokeWidth={9}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - underlineT}
            style={{filter: `drop-shadow(0 0 8px ${underlineColor})`}}
          />
        </svg>
      )}
    </div>
  );
};

/* ================================================================== */
/* ৬.১১ Checklist                                                       */
/* ================================================================== */

export interface ChecklistItem {
  text: string;
  color?: string;
}

export interface ChecklistProps {
  items: ChecklistItem[];
  /** প্রথম সারি আসার ফ্রেম */
  startAt?: number;
  /** দুই সারির মাঝের ব্যবধান (ফ্রেম); ডিফল্ট ৩০ = ১.২s */
  interval?: number;
  width?: number;
  fontSize?: number;
  exitAt?: number;
  style?: React.CSSProperties;
}

/** একটার পর একটা সারি ঢোকে; প্রতি সারিতে ক্রমিক নম্বর + লেখা + ডানে টিক যা আঁকা হয় */
export const Checklist: React.FC<ChecklistProps> = ({
  items,
  startAt = 0,
  interval = 30,
  width = 950,
  fontSize = 52,
  exitAt,
  style,
}) => {
  const frame = useCurrentFrame();
  const exit = useExitFactor(exitAt);
  const chip = fontSize * 1.15;
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16, width, opacity: exit, ...style}}>
      {items.map((item, i) => {
        const at = startAt + i * interval;
        const color = item.color ?? PALETTE[i % PALETTE.length];
        const s = spring({frame: frame - at, fps: FPS, config: SPRING_POP});
        const tick = clamp01((frame - (at + 8)) / 10);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              boxSizing: 'border-box',
              padding: '10px 24px 14px 14px',
              borderRadius: 28,
              backgroundColor: 'rgba(11,27,43,0.78)',
              border: `3px solid ${tick >= 1 ? color : 'rgba(255,255,255,0.25)'}`,
              boxShadow: tick >= 1 ? `0 0 22px ${color}66` : 'none',
              opacity: clamp01(s * 1.8),
              transform: `translateX(${interpolate(s, [0, 1], [-120, 0])}px)`,
            }}
          >
            <div
              style={{
                ...textBase,
                flex: '0 0 auto',
                width: chip,
                height: chip,
                borderRadius: '50%',
                backgroundColor: color,
                color: COLORS.navy,
                fontSize: fontSize * 0.82,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingBottom: chip * 0.05,
              }}
            >
              {toBn(i + 1)}
            </div>
            <div style={{...textBase, flex: 1, fontSize, color: COLORS.white, lineHeight: 1.3}}>{item.text}</div>
            <div
              style={{
                flex: '0 0 auto',
                width: chip,
                height: chip,
                borderRadius: '50%',
                border: `4px solid ${tick > 0 ? COLORS.lime : 'rgba(255,255,255,0.25)'}`,
                backgroundColor: tick >= 1 ? 'rgba(156,204,101,0.22)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckIcon size={chip * 0.72} color={COLORS.lime} strokeWidth={13} draw={tick} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ================================================================== */
/* ৬.১২ SubscribeBell                                                   */
/* ================================================================== */

export interface SubscribeBellProps {
  delay?: number;
  /** ঘণ্টার পাশের বাটনের লেখা (ব্র্যান্ড) */
  brand?: string;
  /** বাটনের নিচের লেখা */
  label?: string;
  exitAt?: number;
  size?: number;
  style?: React.CSSProperties;
}

/** ঘণ্টা দোলে (ক্ষয়িষ্ণু দোলন, বারবার) + "MDMK" বাটন স্প্রিং-পপ + "সাথে থাকুন" লেবেল */
export const SubscribeBell: React.FC<SubscribeBellProps> = ({
  delay = 0,
  brand = CHANNEL_NAME,
  label = 'সাথে থাকুন',
  exitAt,
  size = 190,
  style,
}) => {
  const frame = useCurrentFrame();
  const exit = useExitFactor(exitAt);
  const btn = spring({frame: frame - delay, fps: FPS, config: {damping: 9, stiffness: 190, mass: 0.7}});
  const bellIn = spring({frame: frame - (delay + 8), fps: FPS, config: SPRING_POP});
  const labelIn = spring({frame: frame - (delay + 16), fps: FPS, config: SPRING_SOFT});

  // দোলন: প্রতি ৫০ ফ্রেমে একবার ২০ ফ্রেমের ক্ষয়িষ্ণু দোলা
  const t = Math.max(0, frame - (delay + 14));
  const inCycle = t % 50;
  const swing = inCycle < 24 ? Math.sin(inCycle * 0.9) * 26 * Math.pow(1 - inCycle / 24, 1.2) : 0;
  const dotPop = easeOutBack(progressBetween(frame, delay + 22, delay + 30));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        opacity: exit,
        ...style,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
        {/* বাটন */}
        <div
          style={{
            ...textBase,
            fontSize: size * 0.42,
            letterSpacing: 3,
            color: COLORS.navy,
            backgroundColor: COLORS.gold,
            borderRadius: 999,
            padding: '8px 46px 14px',
            boxShadow: `0 12px 28px rgba(0,0,0,0.5), 0 0 30px ${COLORS.gold}88`,
            opacity: clamp01(btn * 1.8),
            transform: `scale(${interpolate(btn, [0, 1], [0.3, 1])})`,
          }}
        >
          {brand}
        </div>
        {/* ঘণ্টা */}
        <div
          style={{
            position: 'relative',
            width: size * 0.62,
            height: size * 0.62,
            opacity: clamp01(bellIn * 1.8),
            transform: `scale(${interpolate(bellIn, [0, 1], [0.3, 1])}) rotate(${swing}deg)`,
            transformOrigin: '50% 12%',
          }}
        >
          <BellIcon size={size * 0.62} />
          <div
            style={{
              position: 'absolute',
              right: -size * 0.02,
              top: size * 0.0,
              width: size * 0.2,
              height: size * 0.2,
              borderRadius: '50%',
              backgroundColor: COLORS.coral,
              border: `4px solid ${COLORS.white}`,
              transform: `scale(${Math.max(0, dotPop)})`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          ...textBase,
          fontSize: size * 0.34,
          color: COLORS.white,
          backgroundColor: 'rgba(11,27,43,0.75)',
          border: `3px solid ${COLORS.teal}`,
          borderRadius: 999,
          padding: '4px 36px 10px',
          opacity: clamp01(labelIn * 1.8),
          transform: `translateY(${interpolate(labelIn, [0, 1], [30, 0])}px)`,
        }}
      >
        {label}
      </div>
    </div>
  );
};
