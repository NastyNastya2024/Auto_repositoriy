import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { lightColors } from './src/theme';
import { applyWebDocumentLightTheme } from './src/utils/webDocumentTheme';

const ROOT_WINDOW_BG = lightColors.bg;

function ThemedShell() {
  useEffect(() => {
    applyWebDocumentLightTheme();
    if (Platform.OS !== 'web') {
      void SystemUI.setBackgroundColorAsync(ROOT_WINDOW_BG);
    }
  }, []);

  return (
    <>
      <RootNavigator />
      <StatusBar style="dark" />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <ThemedShell />
      </ThemeProvider>
    </AppProvider>
  );
}
