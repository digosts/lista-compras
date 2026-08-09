/**
 * Telas de abertura do iOS. O Safari só aceita a imagem quando o media query
 * casa exatamente com largura, altura e densidade do aparelho.
 * `width`/`height` são os pontos CSS; `scale` é o device pixel ratio.
 */
export type SplashSpec = {
  width: number;
  height: number;
  scale: number;
  label: string;
};

export const SPLASH_SCREENS: SplashSpec[] = [
  { width: 440, height: 956, scale: 3, label: "iPhone 16 Pro Max" },
  { width: 430, height: 932, scale: 3, label: "iPhone 14/15 Pro Max" },
  { width: 428, height: 926, scale: 3, label: "iPhone 12/13 Pro Max" },
  { width: 402, height: 874, scale: 3, label: "iPhone 16 Pro" },
  { width: 393, height: 852, scale: 3, label: "iPhone 14/15 Pro" },
  { width: 390, height: 844, scale: 3, label: "iPhone 12/13/14" },
  { width: 375, height: 812, scale: 3, label: "iPhone X/XS/11 Pro" },
  { width: 414, height: 896, scale: 3, label: "iPhone XS Max/11 Pro Max" },
  { width: 414, height: 896, scale: 2, label: "iPhone XR/11" },
  { width: 414, height: 736, scale: 3, label: "iPhone 8 Plus" },
  { width: 375, height: 667, scale: 2, label: "iPhone SE/8" },
  { width: 1024, height: 1366, scale: 2, label: 'iPad Pro 12.9"' },
  { width: 834, height: 1194, scale: 2, label: 'iPad Pro 11"' },
  { width: 820, height: 1180, scale: 2, label: "iPad Air" },
  { width: 768, height: 1024, scale: 2, label: 'iPad 9.7"' },
];

export function splashFileName(spec: SplashSpec) {
  return `splash-${spec.width * spec.scale}x${spec.height * spec.scale}.png`;
}

export function splashMedia(spec: SplashSpec) {
  return `(device-width: ${spec.width}px) and (device-height: ${spec.height}px) and (-webkit-device-pixel-ratio: ${spec.scale}) and (orientation: portrait)`;
}
