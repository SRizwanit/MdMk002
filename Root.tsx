import React from 'react';
import {Composition} from 'remotion';
import {MainVideo} from './MainVideo';
import {DURATION, FPS, HEIGHT, WIDTH} from './Theme';

/**
 * ধাপ ৪.১ — কম্পোজিশন রেজিস্ট্রেশন।
 * আইডি "MDMK" (package.json স্ক্রিপ্ট ও render.yml এ এই আইডি ব্যবহার হয়)।
 * 1080×1920, 25fps, 2000 ফ্রেম (80 সেকেন্ড)।
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MDMK"
        component={MainVideo}
        durationInFrames={DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
