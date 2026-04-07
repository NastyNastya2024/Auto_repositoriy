import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme';
import { formatSlotDate } from '../../utils/format';

export function StudentMyBookingsScreen() {
  const { state, sessionUser, cancelBookingByStudent, setBookingStudentPaid } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const myBookings = useMemo(() => {
    if (!sessionUser) return [];
    const slotTime = (slotId: string) => {
      const sl = state.slots.find((s) => s.id === slotId);
      if (!sl) return Number.MAX_SAFE_INTEGER;
      return new Date(sl.startIso).getTime();
    };
    return state.bookings
      .filter((b) => b.userId === sessionUser.id)
      .slice()
      .sort((a, b) => {
        const ta = slotTime(a.slotId);
        const tb = slotTime(b.slotId);
        if (ta !== tb) return ta - tb;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [state.bookings, state.slots, sessionUser]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Расписание ваших занятий. Статус записи и оплату можно отметить ниже.
      </Text>
      {myBookings.length === 0 && <Text style={styles.muted}>Пока нет занятий</Text>}
      {myBookings.map((item) => {
        const slot = state.slots.find((s) => s.id === item.slotId);
        const tariff = item.tariffId
          ? state.tariffs.find((t) => t.id === item.tariffId)
          : undefined;
        return (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{slot ? formatSlotDate(slot.startIso) : 'Слот'}</Text>
            {tariff && (
              <Text style={styles.tariffLine}>
                Пакет: {tariff.name} — {tariff.priceRub.toLocaleString('ru-RU')} ₽
              </Text>
            )}
            <Text style={styles.status}>Статус: {item.status}</Text>
            {item.status !== 'cancelled' && (
              <View style={styles.paidRow}>
                <Text style={styles.paidLabel}>Оплатил</Text>
                <Switch
                  value={!!item.studentMarkedPaid}
                  onValueChange={(v) => setBookingStudentPaid(item.id, v)}
                  trackColor={{ false: colors.borderSubtle, true: colors.primaryMuted }}
                  thumbColor={item.studentMarkedPaid ? colors.primary : colors.surface}
                />
              </View>
            )}
            {item.status === 'pending' && (
              <Pressable
                style={({ pressed }) => [styles.link, pressed && { opacity: 0.8 }]}
                onPress={() =>
                  Alert.alert('Отмена заявки', 'Отменить запрос на этот слот?', [
                    { text: 'Нет', style: 'cancel' },
                    { text: 'Да', onPress: () => cancelBookingByStudent(item.id) },
                  ])
                }
              >
                <Text style={styles.linkText}>Отменить заявку</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    lead: { fontSize: 14, color: colors.textSecondary, marginBottom: 12, lineHeight: 20 },
    muted: { color: colors.textMuted, marginBottom: 8 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    tariffLine: { marginTop: 6, fontSize: 14, color: colors.textSecondary },
    status: { marginTop: 4, color: colors.textSecondary },
    paidRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    paidLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
    link: { marginTop: 8 },
    linkText: { color: colors.dangerText, fontWeight: '600' },
  });
}
