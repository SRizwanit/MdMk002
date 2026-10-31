// Remotion bundles .mp4 files with Webpack when they are imported.
// This tells TypeScript that `import video from './video.mp4'` gives back a URL string.
declare module '*.mp4' {
  const src: string;
  export default src;
}
