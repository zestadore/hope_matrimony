/**
 * App-wide color palette. The app uses a single light theme, tuned to the
 * Hope Matrimony brand (pink/magenta + blue), with a soft, warm "cute" feel.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#2B1B24',
  textSecondary: '#8A6B78',
  background: '#FFFBFD',
  backgroundElement: '#FDEEF4',
  backgroundSelected: '#FBDCE8',
  primary: '#D7006D',
  primarySoft: '#FCE4EE',
  secondary: '#00548B',
  primaryText: '#ffffff',
  border: '#F6D9E6',
  success: '#2E9E6E',
  danger: '#E5484D',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
