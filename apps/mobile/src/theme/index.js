import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing, radius } from './spacing';
export { useResponsive, MAX_CONTENT_WIDTH, MIN_BODY_FONT } from './responsive';

export function makeTheme(isDark) {
  const colors = isDark ? darkColors : lightColors;
  return { colors, typography, spacing, radius, isDark };
}

export const lightTheme = makeTheme(false);
export const darkTheme = makeTheme(true);

// Single source of truth for theming. App.js provides the resolved theme
// (respecting the user's in-app theme preference) through ThemeProvider;
// useTheme() reads it, falling back to the OS color scheme when no provider
// is mounted (tests, isolated components).
const ThemeContext = createContext(null);
export const ThemeProvider = ThemeContext.Provider;

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
