import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { formatSlotDate } from '../../utils/format';

export function StudentCalendarScreen() {
  const { state, sessionUser, bookSlot, cancelBookingByStudent } = useApp();

  const freeSlots = useMemo(
    () => state.slots.filter((s) => s.status === 'free').sort((a, b) => a.startIso.localeCompare(b.startIso)),
    [state.slots],
  );

  const myBookings = useMemo(() => {
    if (!sessionUser) return [];
    return state.bookings
      .filter((b) => b.userId === sessionUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.bookings, sessionUser]);

  const onBook = (slotId: string) => {
    if (sessionUser?.blocked) {
      Alert.alert('Доступ ограничен', 'Аккаунт заблокирован администратором.');
      return;
    }
    Alert.alert('Запись на занятие', 'Отправить заявку на выбранный слот?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Записаться', onPress: () => bookSlot(slotId) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Мои заявки</Text>
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

      <Text style={[styles.heading, { marginTop: 16 }]}>Свободные слоты</Text>
      {freeSlots.length === 0 && <Text style={styles.muted}>Нет свободных слотов</Text>}
      {freeSlots.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{formatSlotDate(item.startIso)}</Text>
          <Text style={styles.muted}>{item.durationMin} мин</Text>
          <Pressable style={styles.primaryBtn} onPress={() => onBook(item.id)}>
            <Text style={styles.primaryBtnText}>Записаться</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
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
  primaryBtn: {
    marginTop: 10,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  link: { marginTop: 8 },
  linkText: { color: '#dc2626', fontWeight: '600' },
});
