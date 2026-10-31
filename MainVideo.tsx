import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
} from 'remotion';
import video from './video.mp4';
import {Captions} from './Captions';
import {SCENES_1} from './Scenes1';
import {SCENES_2} from './Scenes2';
import {SCENES_3} from './Scenes3';
import {
  CHANNEL_NAME,
  COLORS,
  DEBUG_SCENES,
  DURATION,
  FONT_FAMILY,
  FPS,
  HEIGHT,
  LAYOUT_B,
  PALETTE,
  SCENES,
  SERIES_CHIP,
  SIDE_MARGIN,
  VIDEO_SCALE,
  VIDEO_TRANSFORM_ORIGIN,
  WIDTH,
  ZONES,
  layoutBProgress,
  sceneDuration,
  type SceneDef,
  type SceneId,
} from './Theme';

/* ------------------------------------------------------------------ */
/* ৪.২ ভিডিও লেয়ার (অডিওসহ)                                             */
/* ------------------------------------------------------------------ */

/**
 * Layout B ব্যাকড্রপ (ধাপ ৭.৩): ভিডিও ছোট কার্ডে নামলে পেছনে নেভি গ্রেডিয়েন্ট + কার্ডের পেছনে নরম গ্লো।
 * p = layoutBProgress (০..১); p = ০ হলে অদৃশ্য।
 */
const LayoutBackdrop: React.FC<{p: number}> = ({p}) => {
  if (p <= 0) {
    return null;
  }
  const {card} = LAYOUT_B;
  const cx = card.x + card.width / 2;
  const cy = card.y + card.height / 2;
  return (
    <AbsoluteFill
      style={{
        opacity: p,
        backgroundImage: [
          `radial-gradient(ellipse 520px 620px at ${cx}px ${cy}px, rgba(0,194,168,0.28) 0%, rgba(0,194,168,0) 70%)`,
          `linear-gradient(to bottom, ${COLORS.navy} 0%, ${COLORS.navy2} 42%, ${COLORS.navy} 100%)`,
        ].join(', '),
      }}
    />
  );
};

const VideoLayer: React.FC = () => {
  const frame = useCurrentFrame();
  // Layout B (S3/S8/S10): ভিডিও ফুল-স্ক্রিন → ছোট রাউন্ডেড কার্ড; p=০ হলে আগের মতোই ফুল-স্ক্রিন
  const p = layoutBProgress(frame);
  const {card} = LAYOUT_B;
  const left = p * card.x;
  const top = p * card.y;
  const width = WIDTH + p * (card.width - WIDTH);
  const height = HEIGHT + p * (card.height - HEIGHT);
  const radius = p * card.radius;

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.navy, overflow: 'hidden'}}>
      <LayoutBackdrop p={p} />
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width,
          height,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: '#000',
          boxShadow:
            p > 0
              ? `0 0 0 ${6 * p}px rgba(255,255,255,0.92), 0 0 ${48 * p}px rgba(0,194,168,0.55), 0 24px 60px rgba(0,0,0,0.55)`
              : 'none',
        }}
      >
        <OffthreadVideo
          src={video}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            // ৫৪s-পরবর্তী ৮px কালো পট্টি ঢাকতে: সামান্য বড় + নিচ থেকে (ধাপ ০.২)
            transform: `scale(${VIDEO_SCALE})`,
            transformOrigin: VIDEO_TRANSFORM_ORIGIN,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* ৪.৩ গ্রেডিয়েন্ট ওভারলে (মুখের অংশ স্বচ্ছ)                               */
/* ------------------------------------------------------------------ */

const GradientOverlay: React.FC = () => {
  const navy = '11, 27, 43';
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        backgroundImage: [
          // ওপরে: ইনফোগ্রাফিক ও HUD এর জন্য
          `linear-gradient(to bottom, rgba(${navy}, 0.82) 0%, rgba(${navy}, 0.5) 14%, rgba(${navy}, 0) 29%)`,
          // নিচে: ক্যাপশন ও প্রগ্রেস বারের জন্য
          `linear-gradient(to top, rgba(${navy}, 0.9) 0%, rgba(${navy}, 0.62) 28%, rgba(${navy}, 0.3) 38%, rgba(${navy}, 0) 46%)`,
        ].join(', '),
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* ৪.৪ স্থায়ী HUD: MDMK ট্যাগ + সিরিজ চিপ + প্রগ্রেস বার                    */
/* ------------------------------------------------------------------ */

const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = spring({
    frame: frame - 5,
    fps: FPS,
    config: {damping: 14, stiffness: 140, mass: 0.7},
  });
  const translateY = interpolate(enter, [0, 1], [-70, 0]);
  const opacity = Math.min(1, Math.max(0, enter));
  const height = ZONES.hud.to - ZONES.hud.from;

  return (
    <div
      style={{
        position: 'absolute',
        left: SIDE_MARGIN,
        right: SIDE_MARGIN,
        top: ZONES.hud.from,
        height,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: FONT_FAMILY,
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      {/* বাঁ দিকে: MDMK ট্যাগ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          backgroundColor: COLORS.gold,
          color: COLORS.navy,
          borderRadius: 999,
          padding: '6px 28px 10px 20px',
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: 2,
          lineHeight: 1.2,
          boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            backgroundColor: COLORS.coral,
          }}
        />
        {CHANNEL_NAME}
      </div>

      {/* ডান দিকে: সিরিজ চিপ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          backgroundColor: 'rgba(11,27,43,0.68)',
          border: '2px solid rgba(255,255,255,0.28)',
          color: COLORS.white,
          borderRadius: 999,
          padding: '6px 26px 10px 20px',
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 1.25,
          boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            backgroundColor: COLORS.teal,
          }}
        />
        {SERIES_CHIP}
      </div>
    </div>
  );
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const trackWidth = WIDTH - SIDE_MARGIN * 2;
  const progress = Math.min(1, Math.max(0, frame / (DURATION - 1)));
  const fillWidth = Math.max(0, trackWidth * progress);
  const gradient = `linear-gradient(90deg, ${PALETTE.join(', ')})`;
  const {y, height} = ZONES.progress;

  return (
    <div
      style={{
        position: 'absolute',
        left: SIDE_MARGIN,
        top: y,
        width: trackWidth,
        height,
      }}
    >
      {/* ট্র্যাক */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: height,
          backgroundColor: 'rgba(255,255,255,0.22)',
          overflow: 'hidden',
        }}
      >
        {/* ভরা অংশ — গ্রেডিয়েন্ট পুরো ট্র্যাকের মাপে বাঁধা, তাই রঙ স্থির থাকে */}
        <div
          style={{
            width: fillWidth,
            height: '100%',
            backgroundImage: gradient,
            backgroundSize: `${trackWidth}px 100%`,
            backgroundRepeat: 'no-repeat',
            borderRadius: height,
          }}
        />
      </div>
      {/* ডগা */}
      <div
        style={{
          position: 'absolute',
          left: fillWidth - 13,
          top: height / 2 - 13,
          width: 26,
          height: 26,
          borderRadius: 999,
          backgroundColor: COLORS.white,
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* ৪.৫ সিন কন্টেইনার (এখন প্লেসহোল্ডার; ধাপ ৭ এ আসল সিন বসবে)             */
/* ------------------------------------------------------------------ */

const ScenePlaceholder: React.FC<{scene: SceneDef}> = ({scene}) => {
  if (!DEBUG_SCENES) {
    return null;
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: SIDE_MARGIN,
        top: ZONES.info.from,
        fontFamily: FONT_FAMILY,
        fontSize: 44,
        color: COLORS.white,
        backgroundColor: 'rgba(255,90,95,0.85)',
        borderRadius: 16,
        padding: '4px 22px 10px',
      }}
    >
      {scene.id} • {scene.title} • লেআউট {scene.layout}
    </div>
  );
};

/**
 * সিন-নম্বর → আসল সিন কম্পোনেন্ট। যেগুলো তৈরি হয়নি সেগুলো (এখন কোনোটিই নয়) প্লেসহোল্ডার।
 * ধাপ ৭.১–৭.৪: S1–S4 (Scenes1.tsx)। ধাপ ৭.৫–৭.৮: S5–S8 (Scenes2.tsx)।
 * ধাপ ৭.৯–৭.১২: S9–S12 (Scenes3.tsx)।
 */
const SCENE_COMPONENTS: Partial<Record<SceneId, React.FC>> = {
  ...SCENES_1,
  ...SCENES_2,
  ...SCENES_3,
};

const SceneLayer: React.FC = () => {
  return (
    <>
      {SCENES.map((scene) => {
        const Component = SCENE_COMPONENTS[scene.id];
        return (
          <Sequence
            key={scene.id}
            name={`${scene.id} ${scene.title}`}
            from={scene.from}
            durationInFrames={sceneDuration(scene)}
          >
            {Component ? <Component /> : <ScenePlaceholder scene={scene} />}
          </Sequence>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* মূল কম্পোজিশন                                                       */
/* ------------------------------------------------------------------ */

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.navy}}>
      <VideoLayer />
      <GradientOverlay />
      <SceneLayer />
      <Captions />
      <Hud />
      <ProgressBar />
    </AbsoluteFill>
  );
};
