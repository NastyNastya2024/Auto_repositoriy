import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { DefaultTheme, type Theme } from '@react-navigation/native';
import { Platform, StyleSheet, type TextStyle } from 'react-native';

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

/**
 * Белый фон, голубой — основной бренд (кнопки, табы, чипы).
 * Зелёный только для успеха; нейтрали слегка подмешаны к небу для цельности.
 */
export const lightColors: ThemeColors = {
  bg: '#ffffff',
  bgElevated: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f2f8fc',
  border: '#c5dbe8',
  borderSubtle: '#e3eef5',
  text: '#0f2133',
  textSecondary: '#3d5266',
  textMuted: '#5c6b7a',
  primary: '#1c8fd9',
  primaryMuted: '#2596df',
  onPrimary: '#ffffff',
  link: '#1578b8',
  success: '#059669',
  danger: '#be185d',
  dangerBorder: '#fecaca',
  dangerText: '#b91c1c',
  overlay: 'rgba(15, 33, 51, 0.45)',
  chip: '#e8f4fc',
  chipOn: '#c5e5f7',
  chipOnText: '#0b5a8a',
  inputBg: '#fafcfe',
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
      primary: c.primary,
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

export function getTabScreenOptions(): BottomTabNavigationOptions {
  const h = getHeaderOptions();
  const c = lightColors;
  const tabBarLabelStyle: TextStyle = {
    fontSize: 12,
    fontWeight: 600,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  };
  return {
    ...h,
    tabBarStyle: {
      backgroundColor: c.bgElevated,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderSubtle,
    },
    tabBarLabelStyle,
    tabBarActiveTintColor: c.primary,
    tabBarInactiveTintColor: c.textMuted,
  };
}
