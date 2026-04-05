import React, { createContext, useContext, useMemo } from 'react';
import type { Theme } from '@react-navigation/native';
import {
  type ThemeColors,
  getColors,
  getHeaderOptions,
  getNavigationTheme,
  getTabScreenOptions,
} from '../theme';

type ThemeContextValue = {
  colors: ThemeColors;
  navigationTheme: Theme;
  headerOptions: ReturnType<typeof getHeaderOptions>;
  tabScreenOptions: ReturnType<typeof getTabScreenOptions>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: getColors(),
      navigationTheme: getNavigationTheme(),
      headerOptions: getHeaderOptions(),
      tabScreenOptions: getTabScreenOptions(),
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
