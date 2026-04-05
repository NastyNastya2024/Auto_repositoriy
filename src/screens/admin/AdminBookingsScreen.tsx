import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme';
import { formatSlotDate } from '../../utils/format';

export function AdminBookingsScreen() {
  const { state, setBookingStatus } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const rows = useMemo(
    () => [...state.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.bookings],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {rows.length === 0 && <Text style={styles.empty}>Записей пока нет</Text>}
      {rows.map((b) => {
        const slot = state.slots.find((s) => s.id === b.slotId);
        const user = state.users.find((u) => u.id === b.userId);
        return (
          <View key={b.id} style={styles.card}>
            <Text style={styles.title}>{user?.name ?? 'Ученик'}</Text>
            <Text style={styles.meta}>{slot ? formatSlotDate(slot.startIso) : 'Слот удалён'}</Text>
            <Text style={styles.meta}>Статус: {b.status}</Text>
            <View style={styles.row}>
              {b.status === 'pending' && (
                <>
                  <Pressable
                    style={styles.ok}
                    onPress={() => setBookingStatus(b.id, 'booked')}
                  >
                    <Text style={styles.okText}>Подтвердить</Text>
                  </Pressable>
                  <Pressable
                    style={styles.no}
                    onPress={() =>
                      Alert.alert('Отклонить запись?', undefined, [
                        { text: 'Отмена', style: 'cancel' },
                        { text: 'Отклонить', style: 'destructive', onPress: () => setBookingStatus(b.id, 'cancelled') },
                      ])
                    }
                  >
                    <Text style={styles.noText}>Отклонить</Text>
                  </Pressable>
                </>
              )}
              {b.status === 'booked' && (
                <Pressable style={styles.ok} onPress={() => setBookingStatus(b.id, 'completed')}>
                  <Text style={styles.okText}>Завершить</Text>
                </Pressable>
              )}
            </View>
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
    empty: { color: colors.textMuted },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: { fontSize: 16, fontWeight: '700', color: colors.text },
    meta: { marginTop: 4, color: colors.textSecondary },
    row: { flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' },
    ok: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    okText: { color: colors.onPrimary, fontWeight: '600' },
    no: {
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    noText: { color: colors.dangerText, fontWeight: '600' },
  });
}
