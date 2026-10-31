import {Config} from '@remotion/cli/config';

// Frames are rendered as JPEG (faster; our video has no transparency).
Config.setVideoImageFormat('jpeg');

// H.264 video + AAC audio in an .mp4 (plays on every phone and social platform).
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');

// Constant Rate Factor: lower = better quality, bigger file. 18 is visually near-lossless.
Config.setCrf(18);

// Re-rendering overwrites out.mp4 instead of asking.
Config.setOverwriteOutput(true);

// Give Google Fonts / OffthreadVideo up to 60s per frame on a slow CI machine
// (default is 30s) so the first frame does not time out.
Config.setDelayRenderTimeoutInMilliseconds(60000);
