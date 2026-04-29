import React, { useMemo } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme';

const PDD_URL = 'https://biletpdd.ru/exam/ab';

export function StudentPddScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();

  if (Platform.OS === 'web') {
    const IFrame = 'iframe' as unknown as React.ComponentType<any>;
    // На узких экранах (мобильный web) сам сайт рисуется "мелко".
    // Масштабируем iframe-контент, сохраняя адаптив контейнера.
    const isNarrow = width < 520;
    const scale = isNarrow ? 1.35 : 1;
    const iframeStyle: React.CSSProperties = {
      border: 'none',
      width: `${100 / scale}%`,
      height: `${100 / scale}%`,
      display: 'block',
      background: colors.bg,
      transform: scale === 1 ? undefined : `scale(${scale})`,
      transformOrigin: '0 0',
    };
    return (
      <View style={styles.webRoot}>
        <IFrame
          title="Экзамен ПДД (категория B)"
          src={PDD_URL}
          style={iframeStyle}
          // allow same-origin features needed by the site
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </View>
    );
  }

  return (
    <View style={styles.mobileRoot}>
      <Text style={styles.title}>ПДД</Text>
      <Text style={styles.text}>
        На телефоне встроенный просмотр билетов через iframe недоступен. Откройте страницу в браузере.
      </Text>
      <Pressable style={styles.btn} onPress={() => Linking.openURL(PDD_URL)}>
        <Text style={styles.btnText}>Открыть билеты ПДД</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    webRoot: {
      flex: 1,
      backgroundColor: colors.bg,
      alignSelf: 'stretch',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    },
    mobileRoot: { flex: 1, padding: 16, backgroundColor: colors.bg },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 10 },
    text: { color: colors.textSecondary, lineHeight: 20, marginBottom: 14 },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignSelf: 'flex-start',
    },
    btnText: { color: colors.onPrimary, fontWeight: '800' },
  });
}

