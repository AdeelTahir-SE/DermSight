/**
 * DermSight Theme Constants
 * Color tokens consumed by tailwind.config.js and component styles.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B2B4B',
    background: '#FFFFFF',
    backgroundElement: '#F8FAFA',
    backgroundSelected: '#F1F5F5',
    textSecondary: '#64748B',
    primary: '#0D9E94',
    primaryLight: '#E6F7F5',
    border: '#E2E8F0',
    card: '#FFFFFF',
    error: '#DC2626',
    success: '#16A34A',
    warning: '#D97706',
  },
  dark: {
    text: '#F1F5F9',
    background: '#0F172A',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
    textSecondary: '#94A3B8',
    primary: '#0D9E94',
    primaryLight: '#053F3B',
    border: '#334155',
    card: '#1E293B',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
