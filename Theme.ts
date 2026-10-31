/**
 * Theme.ts — MDMK ভিডিওর ডিজাইন সিস্টেম (mdmk02.md ধাপ ৩)
 *
 * এখানে আছে: ধ্রুবক, রঙ, ফন্ট, হেল্পার ফাংশন, স্ক্রিন জোন,
 * বানান-ওভাররাইড, সিন-টাইমিং টেবিল (S1–S12) ও মূল শব্দ-সময়।
 * অন্য সব ফাইল (Root, MainVideo, Captions, Motion, Scenes) এখান থেকে ইমপোর্ট করে।
 */
import {loadFont as loadHindSiliguri} from '@remotion/google-fonts/HindSiliguri';

/* ------------------------------------------------------------------ */
/* ৩.১ ধ্রুবক                                                          */
/* ------------------------------------------------------------------ */

export const FPS = 25;
export const WIDTH = 1080;
export const HEIGHT = 1920;
/** 79.89s × 25fps ≈ 1997 ফ্রেম → 2000 ফ্রেম (80s) */
export const DURATION = 2000;

/** মূল ভিডিওর আকার (ffprobe) */
export const SRC_WIDTH = 480;
export const SRC_HEIGHT = 864;
export const SRC_DURATION_MS = 79890;

/**
 * ৫৪s-পরবর্তী ৮px কালো পট্টি ঢাকতে ভিডিও সামান্য বড় (১.৫%) + নিচের মধ্যবিন্দু থেকে।
 * পুরো ভিডিওতে স্থির, তাই কোথাও লাফ দেখা যাবে না।
 */
export const VIDEO_SCALE = 1.015;
export const VIDEO_TRANSFORM_ORIGIN = 'center bottom';

/** true করলে প্রতিটি সিনের ID ওপরে ছোট করে দেখাবে (টাইমিং টেস্টের জন্য) */
export const DEBUG_SCENES = false;

/* ব্র্যান্ড/লেখা */
export const CHANNEL_NAME = 'MDMK';
export const SERIES_CHIP = '১৬ সুন্নাহ • ইস্তেঞ্জা';
export const TOPIC_TITLE = 'ইস্তেঞ্জা সুন্নাহ';

/* ------------------------------------------------------------------ */
/* ৩.২ রঙ                                                              */
/* ------------------------------------------------------------------ */

export const COLORS = {
  navy: '#0B1B2B',
  navy2: '#12304A',
  white: '#FFFFFF',
  teal: '#00C2A8',
  gold: '#FFC83D',
  coral: '#FF5A5F',
  violet: '#7C4DFF',
  sky: '#29B6F6',
  lime: '#9CCC65',
  gray: '#8FA3B5',
} as const;

/** সিন ও গ্রাফিকে ঘুরে-ফিরে ব্যবহারের ৬ রঙ */
export const PALETTE: readonly string[] = [
  COLORS.teal,
  COLORS.gold,
  COLORS.coral,
  COLORS.sky,
  COLORS.lime,
  COLORS.violet,
];

export interface CaptionStyle {
  /** পিল/হাইলাইটের ব্যাকগ্রাউন্ড এবং "বলা হয়ে গেছে" শব্দের রঙ */
  bg: string;
  /** সক্রিয় শব্দের (পিলের ওপরের) লেখার রঙ */
  fg: string;
}

/** ক্যাপশন শব্দের রঙ ঘূর্ণন — ৬টি (PALETTE এর ক্রমে) */
export const CAPTION_STYLES: readonly CaptionStyle[] = [
  {bg: COLORS.teal, fg: COLORS.navy},
  {bg: COLORS.gold, fg: COLORS.navy},
  {bg: COLORS.coral, fg: COLORS.navy},
  {bg: COLORS.sky, fg: COLORS.navy},
  {bg: COLORS.lime, fg: COLORS.navy},
  {bg: COLORS.violet, fg: COLORS.white},
];

/** "MDMK" শব্দের বিশেষ স্টাইল */
export const BRAND_STYLE: CaptionStyle = {bg: COLORS.gold, fg: COLORS.navy};

/* ------------------------------------------------------------------ */
/* ৩.৩ ফন্ট                                                            */
/* ------------------------------------------------------------------ */

/**
 * শুধু Bold (700): Hind Siliguri এর Regular/Medium/SemiBold এ বাংলা "১" এর গ্লিফ ত্রুটিপূর্ণ।
 * সাবসেট: bengali + latin ("MDMK" এর জন্য)। v4 এ ওয়েট/সাবসেট না দিলে সব নামে → টাইমআউট ঝুঁকি।
 */
const hind = loadHindSiliguri('normal', {
  weights: ['700'],
  subsets: ['bengali', 'latin'],
});

export const FONT_FAMILY = `${hind.fontFamily}, 'Noto Sans Bengali', sans-serif`;

/* ------------------------------------------------------------------ */
/* ৩.৪ হেল্পার ফাংশন                                                    */
/* ------------------------------------------------------------------ */

/** মিলিসেকেন্ড → ফ্রেম (পূর্ণসংখ্যা) */
export const msToFrame = (ms: number): number => Math.round((ms * FPS) / 1000);

/** ফ্রেম → মিলিসেকেন্ড */
export const frameToMs = (frame: number): number => Math.round((frame * 1000) / FPS);

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** ইংরেজি অঙ্ক → বাংলা অঙ্ক। toBn(16) === "১৬" */
export const toBn = (value: number | string): string =>
  String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

export const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/** frame কে [from, to] এর মধ্যে 0..1 এ রূপান্তর (সীমার বাইরে আটকে যায়) */
export const progressBetween = (frame: number, from: number, to: number): number =>
  to === from ? 1 : clamp01((frame - from) / (to - from));

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** সামান্য ছাড়িয়ে গিয়ে ফেরত আসে (পপ-ইফেক্ট) */
export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** স্প্রিং কনফিগ প্রিসেট (Remotion spring() এ config হিসেবে দিন) */
export const SPRING_POP = {damping: 12, stiffness: 180, mass: 0.6};
export const SPRING_SOFT = {damping: 20, stiffness: 120, mass: 0.8};
export const SPRING_SNAP = {damping: 10, stiffness: 240, mass: 0.5};

/* ------------------------------------------------------------------ */
/* ৩.৫ জোন সংজ্ঞা (1080×1920, পিক্সেল)                                    */
/* ------------------------------------------------------------------ */

const pct = (p: number): number => Math.round(HEIGHT * p);

/**
 * ধাপ ০.২ এর ফল: বক্তার মুখ-টুপি-কাঁধ ≈ ২৮%–৬৫%; ওপরের ০–২৬% ফাঁকা (ছাদ/ফ্যান)।
 * ইনফোগ্রাফিক জোন তাই ১০%–২৭%, মুখ ঢাকে না।
 */
export const ZONES = {
  safeTop: {from: 0, to: pct(0.05)},
  hud: {from: pct(0.055), to: pct(0.09)},
  info: {from: pct(0.1), to: pct(0.27)},
  face: {from: pct(0.28), to: pct(0.65)},
  caption: {from: pct(0.68), to: pct(0.83)},
  progress: {y: pct(0.915), height: 12},
  safeBottom: {from: pct(0.94), to: HEIGHT},
} as const;

/** ডান-বাম মার্জিন (পিক্সেল) */
export const SIDE_MARGIN = Math.round(WIDTH * 0.06);

/**
 * Layout B (ধাপ ৭, সিন S3/S8/S10): ভিডিও ছোট রাউন্ডেড কার্ডে নামে,
 * ওপরে বড় ইনফোগ্রাফিক এলাকা। (ধাপ ৭.১–৭.৪ এ চূড়ান্ত)
 *
 * কার্ডের মুখ ≈ কার্ডের ২৮%–৬৫% উচ্চতায়: y = 826 + 0.28×730 ≈ 1030 … 826 + 0.65×730 ≈ 1300।
 * ক্যাপশন-জোন শুরু ১৩০৬ — তাই ক্যাপশন মুখ ঢাকে না। ইনফোগ্রাফিক এলাকা: ১৯২ … ৮০৬ (৬১৪px)।
 */
export const LAYOUT_B = {
  infoArea: {from: pct(0.1), to: pct(0.42)},
  card: {
    width: 410,
    height: 730,
    x: Math.round((WIDTH - 410) / 2),
    y: pct(0.43),
    radius: 36,
  },
} as const;

/* ------------------------------------------------------------------ */
/* ৩.৬ বানান-ওভাররাইড                                                   */
/* ------------------------------------------------------------------ */

/**
 * ক্যাপশনের কোনো শব্দের বানান বদলাতে চাইলে এখানে এক লাইন যোগ করুন:
 *   'বর্তমান(JSON এর)': 'নতুন বানান',
 * উদাহরণ (এখন চালু নেই — JSON যেমন আছে তেমন যাচ্ছে):
 *   'ইস্তেঞ্জার': 'ইস্তিঞ্জার',
 * শুধু ক্যাপশনের লেখা বদলাবে; টাইমিং (JSON) অপরিবর্তিত থাকবে।
 */
export const TEXT_OVERRIDES: Record<string, string> = {};

export const displayWord = (word: string): string => TEXT_OVERRIDES[word] ?? word;

/* ------------------------------------------------------------------ */
/* ৩.৭ সিন-টাইমিং টেবিল (ফ্রেম @25fps; ছোট ওভারল্যাপ ট্রানজিশনের জন্য)         */
/* ------------------------------------------------------------------ */

export type SceneId =
  | 'S1'
  | 'S2'
  | 'S3'
  | 'S4'
  | 'S5'
  | 'S6'
  | 'S7'
  | 'S8'
  | 'S9'
  | 'S10'
  | 'S11'
  | 'S12';

export interface SceneDef {
  id: SceneId;
  /** শুরুর ফ্রেম (অন্তর্ভুক্ত) */
  from: number;
  /** শেষের ফ্রেম (বর্জিত) */
  to: number;
  title: string;
  /** A = ভিডিও ফুল-স্ক্রিন + ওপরে ইনফোগ্রাফিক; B = ভিডিও ছোট কার্ডে */
  layout: 'A' | 'B';
}

export const SCENES: readonly SceneDef[] = [
  {id: 'S1', from: 0, to: 60, title: 'সালাম', layout: 'A'},
  {id: 'S2', from: 70, to: 215, title: 'সিরিজ রিক্যাপ', layout: 'A'},
  {id: 'S3', from: 220, to: 440, title: 'আজকের বিষয়', layout: 'B'},
  {id: 'S4', from: 445, to: 545, title: 'পরবর্তী ৪টি (লিড-ইন)', layout: 'A'},
  {id: 'S5', from: 548, to: 660, title: 'সুন্নাহ ১', layout: 'A'},
  {id: 'S6', from: 655, to: 865, title: 'সুন্নাহ ২', layout: 'A'},
  {id: 'S7', from: 862, to: 1065, title: 'সুন্নাহ ৩', layout: 'A'},
  {id: 'S8', from: 1063, to: 1305, title: 'সুন্নাহ ৪', layout: 'B'},
  {id: 'S9', from: 1345, to: 1530, title: 'সারাংশ', layout: 'A'},
  {id: 'S10', from: 1545, to: 1710, title: 'বাকি ৮টি', layout: 'B'},
  {id: 'S11', from: 1720, to: 1910, title: 'CTA', layout: 'A'},
  {id: 'S12', from: 1945, to: 2000, title: 'বিদায়', layout: 'A'},
];

export const sceneDuration = (scene: SceneDef): number => scene.to - scene.from;

export const getScene = (id: SceneId): SceneDef => {
  const found = SCENES.find((s) => s.id === id);
  if (!found) {
    throw new Error(`Unknown scene: ${id}`);
  }
  return found;
};

/**
 * Layout B এর অগ্রগতি (০ = ভিডিও ফুল-স্ক্রিন, ১ = ছোট কার্ডে)।
 * প্রতিটি `layout: 'B'` সিনের শুরুতে (২ ফ্রেম আগে থেকে) ১৪ ফ্রেমে নামে; শেষে (১০ ফ্রেম আগে থেকে) ১৪ ফ্রেমে ফেরে,
 * যাতে পরের সিন শুরুর ঠিক আগে ভিডিও ফুল-স্ক্রিনে পৌঁছায়।
 * MainVideo এর VideoLayer এটা দিয়ে ভিডিওর আকার/অবস্থান ঠিক করে।
 */
export const LAYOUT_B_RAMP = 14;

export const layoutBProgress = (frame: number): number => {
  let best = 0;
  for (const scene of SCENES) {
    if (scene.layout !== 'B') {
      continue;
    }
    const inn = easeInOutCubic(progressBetween(frame, scene.from - 2, scene.from - 2 + LAYOUT_B_RAMP));
    const out = easeInOutCubic(progressBetween(frame, scene.to - 10, scene.to - 10 + LAYOUT_B_RAMP));
    best = Math.max(best, inn * (1 - out));
  }
  return best;
};

/* ------------------------------------------------------------------ */
/* মূল শব্দ-সময় (মিলিসেকেন্ড; mdmktimestamp.json থেকে) — ধাপ ৭ এর জন্য      */
/* ------------------------------------------------------------------ */

export const KEY_MS = {
  /** "ষোলোটি" */
  sixteen: 9000,
  /** "চারটি জেনেছি" */
  fourKnown: 11000,
  /** "পরবর্তী চারটি জানবো" */
  nextFour: 13000,
  /** "ইস্তেঞ্জার সুন্নাহ" */
  istenjaTitle: 16000,
  /** "এক নাম্বার হলো" */
  oneNumber: 19750,
  /** সুন্নাহ ১ — "কেবলার" */
  p1Start: 22000,
  /** "মুখ" */
  p1Face: 22933,
  /** "পিঠ" */
  p1Back: 24333,
  /** "দুই নাম্বার হলো" */
  twoNumber: 26200,
  /** ২ক — "যথাসম্ভব" */
  p2aStart: 27600,
  /** ২খ — "বসিয়া" */
  p2bStart: 30866,
  /** ২গ — "দাঁড়িয়ে" */
  p2cStart: 32733,
  /** "তিন নাম্বার হলো" */
  threeNumber: 34600,
  /** নীরবতা শুরু / শেষ */
  silenceAStart: 35962,
  silenceAEnd: 38000,
  /** সুন্নাহ ৩ — "নাপাক" */
  p3Start: 38000,
  /** "সতর্কতার" */
  p3Care: 40500,
  /** "চার নাম্বার হলো" */
  fourNumber: 42500,
  /** ৪ক — "প্রস্রাব পায়খানা শেষে ঢিলা কুলুপ" */
  p4aStart: 44000,
  /** "পানি" */
  p4Water: 47000,
  /** ৪খ — "আগে ঢিলা কুলুপ" */
  p4bStart: 48000,
  /** "অথবা" */
  p4Or: 49500,
  /** নীরবতা ২ শুরু (শেষ শব্দ "করা" শেষ) */
  silenceBStart: 51960,
  /** "এই চারটি হলো" */
  summaryStart: 54000,
  /** "ইস্তেঞ্জার পরবর্তী চারটি সুন্নার মধ্যে" */
  summaryNextFour: 56000,
  /** "ষোলোটি সুন্নার মধ্যে অন্যতম চারটি" */
  remainStart: 62000,
  /** "আর আটটি সুন্নাহ" */
  eightLeft: 66909,
  /** "পর্ব আকারে" */
  partsStart: 69000,
  /** "MDMK" */
  mdmkWord: 72769,
  /** শেষ সালাম ১ম অংশ "আসসালামু আলাইকুম" */
  salamEndStart: 74923,
  /** শেষ সালাম ২য় অংশ "ওয়া রহমাতুল্লাহি …" */
  salamEnd2Start: 78000,
  /** শেষ শব্দ শেষ */
  endMs: 79470,
} as const;

/** KEY_MS এর ফ্রেম-সংস্করণ (সিন কোডে সরাসরি ব্যবহারযোগ্য) */
export const KEY_FRAMES = Object.fromEntries(
  Object.entries(KEY_MS).map(([key, ms]) => [key, msToFrame(ms)]),
) as {[K in keyof typeof KEY_MS]: number};
