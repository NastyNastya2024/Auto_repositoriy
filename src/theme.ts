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

/** Единая голубая палитра (в духе главного экрана). */
export const lightColors: ThemeColors = {
  bg: '#e5f1f9',
  bgElevated: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#d8eaf5',
  border: '#b9d5ea',
  borderSubtle: '#d0e4f2',
  text: '#0f2133',
  textSecondary: '#3d5266',
  textMuted: '#5c6b7a',
  primary: '#1c8fd9',
  primaryMuted: '#2596df',
  onPrimary: '#ffffff',
  link: '#1578b8',
  success: '#0d9488',
  danger: '#be185d',
  dangerBorder: '#fecaca',
  dangerText: '#b91c1c',
  overlay: 'rgba(15, 33, 51, 0.45)',
  chip: '#e8f4fc',
  chipOn: '#c5e5f7',
  chipOnText: '#0b5a8a',
  inputBg: '#ffffff',
  placeholder: '#7a8fa0',
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
