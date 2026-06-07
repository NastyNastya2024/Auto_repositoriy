import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  useFonts,
} from '@expo-google-fonts/roboto';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { lightColors } from './src/theme';
import { activateRobotoFonts } from './src/utils/typography';
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
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  if (fontsLoaded && Platform.OS === 'android') {
    activateRobotoFonts();
  }

  if (Platform.OS === 'android' && !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: ROOT_WINDOW_BG }}>
        <ActivityIndicator size="large" color={lightColors.primary} />
      </View>
    );
  }

  return (
    <AppProvider>
      <ThemeProvider>
        <ThemedShell />
      </ThemeProvider>
    </AppProvider>
  );
}
