import { useWindowDimensions, PixelRatio } from 'react-native';

// Reference width the design was built against (a typical phone).
const BASE_WIDTH = 390;
// Content is capped so phones, large phones and tablets all read well.
export const MAX_CONTENT_WIDTH = 640;
// Minimum readable body text; also prevents iOS from zooming focused TextInputs.
export const MIN_BODY_FONT = 16;

export function getMetrics(width, height) {
  const isLandscape = width > height;
  // Moderate scaling: full proportional scaling makes small phones cramped
  // and tablets gigantic, so scale is damped around the base width.
  const raw = width / BASE_WIDTH;
  const scale = 0.85 + 0.15 * Math.min(raw, 1); // width factor, damped
  const fontScaleCap = Math.min(PixelRatio.getFontScale(), 1.4);
  return {
    width,
    height,
    isLandscape,
    // Large phones in portrait and tablets are treated as wide layouts.
    isTablet: Math.min(width, height) >= 600,
    isSmallPhone: Math.min(width, height) < 350,
    scale,
    fontScaleCap,
  };
}

// Scales a design-space spacing value to the device. Not used at module
// scope (needs live dimensions); call inside components via useResponsive().
export function vs(value, width) {
  const { scale } = getMetrics(width);
  return Math.round(value * scale);
}

export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();
  const m = getMetrics(width, height);
  // Spacing helper: s(16) -> device-adjusted 16.
  const s = (value) => Math.round(value * m.scale);
  // Font helper: respects both device size and the OS accessibility font
  // scale, capped so layouts don't explode.
  const f = (size) => Math.round(size * m.scale * fontScale);
  return { ...m, s, f, maxContentWidth: MAX_CONTENT_WIDTH, minBodyFont: MIN_BODY_FONT };
}
