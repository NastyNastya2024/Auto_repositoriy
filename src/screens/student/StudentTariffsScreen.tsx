import { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { tariffTypeLabel, useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme';
import { formatRub } from '../../utils/format';

export function StudentTariffsScreen() {
  const { state, sessionUser, mockPayTariff } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tariffs = state.tariffs.filter((t) => t.active);

  return (
    <View style={styles.container}>
      <Text style={styles.lead}>Витрина тарифов. Реальная оплата Т-Банка требует сервер с секретами — здесь демо «оплата».</Text>
      <FlatList
        data={tariffs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.badge}>{tariffTypeLabel(item.type)}</Text>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            {item.lessonsCount != null && (
              <Text style={styles.meta}>Занятий: {item.lessonsCount}</Text>
            )}
            {item.durationMin != null && (
              <Text style={styles.meta}>Длительность: {item.durationMin} мин</Text>
            )}
            <Text style={styles.price}>{formatRub(item.priceRub)}</Text>
            <Pressable
              style={styles.btn}
              onPress={() => {
                if (sessionUser?.blocked) {
                  Alert.alert('Оплата недоступна', 'Аккаунт заблокирован.');
                  return;
                }
                Alert.alert('Демо-оплата', `Зафиксировать оплату «${item.name}» локально?`, [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Оплатить (демо)', onPress: () => mockPayTariff(item.id) },
                ]);
              }}
            >
              <Text style={styles.btnText}>Оплатить (демо)</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: colors.bg },
    lead: { color: colors.textSecondary, marginBottom: 12, lineHeight: 20 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badge: { fontSize: 12, color: colors.link, fontWeight: '600', marginBottom: 6 },
    title: { fontSize: 17, fontWeight: '700', color: colors.text },
    desc: { marginTop: 6, color: colors.textSecondary, lineHeight: 20 },
    meta: { marginTop: 4, color: colors.textMuted },
    price: { marginTop: 10, fontSize: 20, fontWeight: '700', color: colors.text },
    btn: {
      marginTop: 12,
      backgroundColor: colors.surfaceMuted,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    btnText: { color: colors.onPrimary, fontWeight: '600' },
  });
}
