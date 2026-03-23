import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WeekScheduleGrid } from '../../components/WeekScheduleGrid';
import { useApp } from '../../context/AppContext';
import { formatSlotDate } from '../../utils/format';
import { addWeeks, startOfWeekMonday } from '../../utils/weekCalendar';

export function StudentCalendarScreen() {
  const { state, sessionUser, bookSlot, cancelBookingByStudent } = useApp();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStartMonday = useMemo(
    () => addWeeks(startOfWeekMonday(new Date()), weekOffset),
    [weekOffset],
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

      <Text style={[styles.heading, { marginTop: 20 }]}>Расписание недели</Text>
      <Text style={styles.hint}>
        Зелёные блоки — свободные слоты. Серые и розовые — занято (без имён других учеников).
      </Text>

      <View style={styles.weekNav}>
        <Pressable style={styles.navBtn} onPress={() => setWeekOffset((w) => w - 1)}>
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.weekNavTitle}>Неделя</Text>
        <Pressable style={styles.navBtn} onPress={() => setWeekOffset((w) => w + 1)}>
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
      </View>

      <WeekScheduleGrid
        weekStartMonday={weekStartMonday}
        slots={state.slots}
        bookings={state.bookings}
        users={state.users}
        mode="student"
        currentStudentId={sessionUser?.id}
        onPressFreeSlot={(slot) => onBook(slot.id)}
        onPressOwnPending={(bookingId) =>
          Alert.alert('Отмена заявки', 'Отменить запрос?', [
            { text: 'Нет', style: 'cancel' },
            { text: 'Да', onPress: () => cancelBookingByStudent(bookingId) },
          ])
        }
        onPressAdminSlot={() => {}}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  hint: { fontSize: 13, color: '#6b7280', marginBottom: 8, lineHeight: 18 },
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
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  navBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  navBtnText: { fontSize: 22, fontWeight: '600', color: '#2563eb' },
  weekNavTitle: { fontSize: 15, fontWeight: '600' },
});
