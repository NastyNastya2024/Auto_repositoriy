import { DefaultTheme, type Theme } from '@react-navigation/native';

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryMuted: string;
  onPrimary: string;
  link: string;
  success: string;
  danger: string;
  dangerBorder: string;
  dangerText: string;
  overlay: string;
  chip: string;
  chipOn: string;
  chipOnText: string;
  inputBg: string;
  placeholder: string;
};

export const lightColors: ThemeColors = {
  bg: '#f6f7f9',
  bgElevated: '#ffffff',
  surface: '#ffffff',
  /** Светлый вторичный фон (экраны, панели ввода). Не использовать тёмные цвета — это ломает «светлую» тему. */
  surfaceMuted: '#eef0f4',
  border: '#e5e7eb',
  borderSubtle: '#e5e7eb',
  text: '#0f172a',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  primary: '#2563eb',
  primaryMuted: '#2563eb',
  onPrimary: '#ffffff',
  link: '#2563eb',
  success: '#059669',
  danger: '#be185d',
  dangerBorder: '#fecaca',
  dangerText: '#b91c1c',
  overlay: 'rgba(0,0,0,0.4)',
  chip: '#f3f4f6',
  chipOn: '#dbeafe',
  chipOnText: '#1d4ed8',
  inputBg: '#ffffff',
  placeholder: '#9ca3af',
};

export function getColors(): ThemeColors {
  return lightColors;
}

export function getNavigationTheme(): Theme {
  const c = lightColors;
  return {
    ...DefaultTheme,
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      primary: c.primaryMuted,
      background: c.bg,
      card: c.bgElevated,
      text: c.text,
      border: c.border,
      notification: c.danger,
    },
  };
}

export function getHeaderOptions() {
  const c = lightColors;
  return {
    headerStyle: { backgroundColor: c.bgElevated },
    headerTintColor: c.text,
    headerTitleStyle: { color: c.text },
    headerShadowVisible: false,
  };
}

export function getTabScreenOptions() {
  const h = getHeaderOptions();
  const c = lightColors;
  return {
    ...h,
    tabBarStyle: {
      backgroundColor: c.bgElevated,
      borderTopColor: c.border,
    },
    tabBarActiveTintColor: c.primaryMuted,
    tabBarInactiveTintColor: c.textMuted,
  };
}
