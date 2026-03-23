import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { formatSlotDate } from '../../utils/format';

export function StudentMyBookingsScreen() {
  const { state, sessionUser, cancelBookingByStudent } = useApp();

  const myBookings = useMemo(() => {
    if (!sessionUser) return [];
    return state.bookings
      .filter((b) => b.userId === sessionUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.bookings, sessionUser]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>Здесь только ваши записи и статусы заявок.</Text>
      {myBookings.length === 0 && <Text style={styles.muted}>Пока нет записей</Text>}
      {myBookings.map((item) => {
        const slot = state.slots.find((s) => s.id === item.slotId);
        return (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{slot ? formatSlotDate(slot.startIso) : 'Слот'}</Text>
            <Text style={styles.status}>Статус: {item.status}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' },
  content: { padding: 16, paddingBottom: 32 },
  lead: { fontSize: 14, color: '#4b5563', marginBottom: 12, lineHeight: 20 },
  muted: { color: '#6b7280', marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  status: { marginTop: 4, color: '#374151' },
  link: { marginTop: 8 },
  linkText: { color: '#dc2626', fontWeight: '600' },
});
