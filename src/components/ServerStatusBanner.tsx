import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export function ServerStatusBanner() {
  const { ready, serverOnline } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!ready || serverOnline) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>Нет связи с сервером. Данные не сохранятся.</Text>
    </View>
  );
}

function createStyles(colors: { danger: string; onPrimary: string }) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.danger,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    text: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}
