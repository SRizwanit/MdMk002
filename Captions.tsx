import React from 'react';
import {interpolate, interpolateColors, spring, useCurrentFrame} from 'remotion';
import timestamps from './mdmktimestamp.json';
import {
  BRAND_STYLE,
  CAPTION_STYLES,
  COLORS,
  FONT_FAMILY,
  FPS,
  SIDE_MARGIN,
  SPRING_POP,
  SPRING_SOFT,
  ZONES,
  clamp01,
  displayWord,
  msToFrame,
  progressBetween,
  type CaptionStyle,
} from './Theme';

/**
 * Captions.tsx — ধাপ ৫: শব্দ-ভিত্তিক অ্যানিমেটেড রঙিন ক্যাপশন
 *
 * - ৫.১ JSON এর segments → ছোট "পেজ" (সর্বোচ্চ ৫ শব্দ / ২৬ অক্ষর)
 * - ৫.২ পেজ-সময়: প্রথম শব্দ − ১৫০ms থেকে শেষ শব্দ + ২৫০ms (পরপর পেজ হলে মাঝামাঝি বদল)
 * - ৫.৩ বলার মুহূর্তে শব্দে স্প্রিং-পপ + রঙিন পিল; বলা শেষ হলে শব্দ নিজের রঙে; ভবিষ্যৎ শব্দ হালকা সাদা
 * - ৫.৪ মোটা আউটলাইন + ড্রপ শ্যাডো
 * - ৫.৫ পেজ ঢোকা (নিচ থেকে স্লাইড+ফেড) / বেরোনো (ওপরে ফেড)
 * - ৫.৬ প্রতিটি শব্দ একটাই <span> (যুক্তাক্ষর ভাঙে না)
 * - ৫.৭ নীরবতায় (৩৫.৯–৩৮s, ৫২–৫৪s) কোনো পেজ নেই → ক্যাপশন লুকানো
 */

/* ------------------------------------------------------------------ */
/* সেটিং                                                               */
/* ------------------------------------------------------------------ */

const MAX_WORDS_PER_PAGE = 5;
const MAX_CHARS_PER_PAGE = 26;
const LEAD_MS = 150;
const TAIL_MS = 250;
/** এই ফাঁকের (ms) কম হলে পরপর দুই পেজকে "যুক্ত" ধরা হয় — মাঝামাঝি বদল */
const CHAIN_GAP_MS = 400;
const EXIT_FRAMES = 6;
const ENTER_FRAMES = 10;

const FONT_SIZE = 78;
const LINE_HEIGHT = 1.5;

/* ------------------------------------------------------------------ */
/* ডেটা                                                                */
/* ------------------------------------------------------------------ */

interface JsonWord {
  id: number;
  word: string;
  start_ms: number;
  end_ms: number;
}

interface JsonSegment {
  start_ms: number;
  end_ms: number;
  words: JsonWord[];
}

interface CaptionWord {
  id: number;
  text: string;
  startMs: number;
  endMs: number;
  style: CaptionStyle;
}

interface CaptionPage {
  index: number;
  words: CaptionWord[];
  startMs: number;
  endMs: number;
  /** দৃশ্যমান ফ্রেম-পরিসর [from, to) */
  from: number;
  to: number;
  /** আগের পেজের সাথে যুক্ত (হার্ড-কাট বদল)? */
  chainedBefore: boolean;
  /** পরের পেজের সাথে যুক্ত? */
  chainedAfter: boolean;
}

const isBrandWord = (text: string): boolean => text.trim().toUpperCase() === 'MDMK';

const styleFor = (id: number, text: string): CaptionStyle =>
  isBrandWord(text) ? BRAND_STYLE : CAPTION_STYLES[id % CAPTION_STYLES.length];

/** শব্দের ক্রম ভেঙে ছোট ছোট গ্রুপে ভাগ (একটা শব্দের একলা পেজ এড়ানো হয়) */
const splitIntoGroups = (words: CaptionWord[]): CaptionWord[][] => {
  const groups: CaptionWord[][] = [];
  let current: CaptionWord[] = [];
  let chars = 0;

  for (const w of words) {
    const len = w.text.length;
    const wouldOverflow =
      current.length >= MAX_WORDS_PER_PAGE ||
      (current.length > 0 && chars + 1 + len > MAX_CHARS_PER_PAGE);
    if (wouldOverflow) {
      groups.push(current);
      current = [];
      chars = 0;
    }
    current.push(w);
    chars += (chars > 0 ? 1 : 0) + len;
  }
  if (current.length > 0) {
    groups.push(current);
  }

  // শেষ পেজে মাত্র ১ শব্দ থাকলে আগের পেজ থেকে একটা শব্দ টেনে আনা
  if (groups.length >= 2) {
    const last = groups[groups.length - 1];
    const prev = groups[groups.length - 2];
    if (last.length === 1 && prev.length >= 3) {
      last.unshift(prev.pop() as CaptionWord);
    }
  }
  return groups;
};

const buildPages = (): CaptionPage[] => {
  const segments = (timestamps as {segments: JsonSegment[]}).segments;
  const raw: Omit<CaptionPage, 'index' | 'from' | 'to' | 'chainedBefore' | 'chainedAfter'>[] = [];

  for (const segment of segments) {
    const words: CaptionWord[] = segment.words.map((w) => {
      const text = displayWord(w.word);
      return {
        id: w.id,
        text,
        startMs: w.start_ms,
        endMs: w.end_ms,
        style: styleFor(w.id, text),
      };
    });
    for (const group of splitIntoGroups(words)) {
      raw.push({
        words: group,
        startMs: group[0].startMs,
        endMs: group[group.length - 1].endMs,
      });
    }
  }

  return raw.map((page, i) => {
    const prev = i > 0 ? raw[i - 1] : null;
    const next = i < raw.length - 1 ? raw[i + 1] : null;
    const chainedBefore = prev !== null && page.startMs - prev.endMs < CHAIN_GAP_MS;
    const chainedAfter = next !== null && next.startMs - page.endMs < CHAIN_GAP_MS;

    const fromMs =
      chainedBefore && prev ? (prev.endMs + page.startMs) / 2 : page.startMs - LEAD_MS;
    const toMs =
      chainedAfter && next ? (page.endMs + next.startMs) / 2 : page.endMs + TAIL_MS;

    return {
      ...page,
      index: i,
      from: Math.max(0, msToFrame(fromMs)),
      to: msToFrame(toMs),
      chainedBefore,
      chainedAfter,
    };
  });
};

/** মডিউল লোডের সময় একবারই তৈরি (রেন্ডারে প্রতি ফ্রেমে গণনা হয় না) */
const PAGES: CaptionPage[] = buildPages();

const findPage = (frame: number): CaptionPage | null => {
  for (const page of PAGES) {
    if (frame >= page.from && frame < page.to) {
      return page;
    }
  }
  return null;
};

/* ------------------------------------------------------------------ */
/* একটি শব্দ                                                            */
/* ------------------------------------------------------------------ */

const WordView: React.FC<{
  word: CaptionWord;
  /** পরের শব্দ শুরুর ফ্রেম (শেষ শব্দে পেজ শেষের ফ্রেম) — এই পর্যন্ত শব্দ "সক্রিয়" */
  activeUntil: number;
  frame: number;
}> = ({word, activeUntil, frame}) => {
  const startFrame = msToFrame(word.startMs);
  const {bg, fg} = word.style;

  // ১) ঢোকার স্প্রিং (০ → ~১, সামান্য ছাড়িয়ে ফেরে)
  const pop = spring({
    frame: frame - startFrame,
    fps: FPS,
    config: SPRING_POP,
  });
  // ২) সক্রিয় থেকে "বলা হয়ে গেছে" তে যাওয়ার ধাপ (৫ ফ্রেমে)
  const release = progressBetween(frame, activeUntil, activeUntil + 5);
  // ৩) বলার আগে → সক্রিয় (৩ ফ্রেমে)
  const reveal = progressBetween(frame, startFrame - 1, startFrame + 2);

  const isFuture = frame < startFrame;

  // স্কেল: ০.৮ → ~১.১৫ → স্থির ১.১ (সক্রিয়), তারপর ধীরে ১.০
  const activeScale = 0.8 + 0.3 * pop;
  const scale = isFuture ? 1 : interpolate(release, [0, 1], [activeScale, 1]);
  const lift = isFuture ? 0 : interpolate(pop, [0, 1], [10, 0]) * (1 - release);

  // পিলের স্বচ্ছতা: সক্রিয় থাকলে ১, শেষ হলে মিলিয়ে যায়
  const pillOpacity = isFuture ? 0 : clamp01(reveal) * (1 - release);

  // লেখার রঙ: ভবিষ্যৎ = সাদা; সক্রিয় = fg; বলা-শেষ = শব্দের নিজের রঙ (bg)
  let color: string;
  if (isFuture) {
    color = COLORS.white;
  } else if (release > 0) {
    color = interpolateColors(release, [0, 1], [fg, bg]);
  } else {
    color = interpolateColors(reveal, [0, 1], [COLORS.white, fg]);
  }

  const isActive = !isFuture && release < 1;
  const showOutline = !isActive || release > 0.5;

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        whiteSpace: 'nowrap',
        padding: '0 22px',
        margin: '0 4px',
        transform: `translateY(${-lift}px) scale(${scale})`,
        transformOrigin: 'center 60%',
        opacity: isFuture ? 0.42 : 1,
      }}
    >
      {/* রঙিন পিল (সক্রিয় শব্দের পেছনে) */}
      <span
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 6,
          bottom: 6,
          borderRadius: 30,
          backgroundColor: bg,
          opacity: pillOpacity,
          boxShadow: `0 8px 24px rgba(0,0,0,0.45), 0 0 ${28 * pillOpacity}px ${bg}`,
        }}
      />
      {/* শব্দ — পুরোটা একটা span (যুক্তাক্ষর অটুট) */}
      <span
        style={{
          position: 'relative',
          color,
          WebkitTextStroke: showOutline ? `9px ${COLORS.navy}` : '0px transparent',
          paintOrder: 'stroke fill',
          textShadow: showOutline ? '0 6px 14px rgba(0,0,0,0.55)' : 'none',
        }}
      >
        {word.text}
      </span>
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* মূল Captions কম্পোনেন্ট                                              */
/* ------------------------------------------------------------------ */

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const page = findPage(frame);

  if (page === null) {
    return null; // নীরবতা / পেজের বাইরে: ক্যাপশন লুকানো
  }

  // ৫.৫ ঢোকা: নিচ থেকে স্লাইড + ফেড (যুক্ত পেজে ছোট নড়াচড়া)
  const enterSpring = spring({
    frame: frame - page.from,
    fps: FPS,
    durationInFrames: ENTER_FRAMES,
    config: SPRING_SOFT,
  });
  const slideFrom = page.chainedBefore ? 26 : 70;
  const enterY = interpolate(enterSpring, [0, 1], [slideFrom, 0]);
  const enterOpacity = clamp01(progressBetween(frame, page.from, page.from + 4));
  const enterScale = interpolate(enterSpring, [0, 1], [0.94, 1]);

  // বেরোনো: যুক্ত না হলে ওপরে ফেড (যুক্ত হলে হার্ড-কাট; পরের পেজ ঢোকে)
  const exitProgress = page.chainedAfter
    ? 0
    : progressBetween(frame, page.to - EXIT_FRAMES, page.to);
  const exitY = interpolate(exitProgress, [0, 1], [0, -34]);
  const opacity = enterOpacity * (1 - exitProgress);

  const zoneHeight = ZONES.caption.to - ZONES.caption.from;

  // প্রতিটি শব্দ "সক্রিয়" থাকবে পরের শব্দ শুরু পর্যন্ত; শেষ শব্দ পেজ শেষ পর্যন্ত
  const activeUntilFor = (i: number): number =>
    i < page.words.length - 1 ? msToFrame(page.words[i + 1].startMs) : page.to;

  return (
    <div
      style={{
        position: 'absolute',
        left: SIDE_MARGIN,
        right: SIDE_MARGIN,
        top: ZONES.caption.from,
        height: zoneHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          rowGap: 4,
          maxWidth: '100%',
          textAlign: 'center',
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
          opacity,
          transform: `translateY(${enterY + exitY}px) scale(${enterScale})`,
          transformOrigin: 'center center',
        }}
      >
        {page.words.map((word, i) => (
          <WordView key={word.id} word={word} activeUntil={activeUntilFor(i)} frame={frame} />
        ))}
      </div>
    </div>
  );
};

/** টেস্ট/ডিবাগের জন্য: পেজ তালিকা বাইরে থেকে দেখার সুযোগ (Studio/Node থেকে) */
export const CAPTION_PAGES: readonly CaptionPage[] = PAGES;
