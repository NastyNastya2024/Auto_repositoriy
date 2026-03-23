import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WeekScheduleGrid } from '../../components/WeekScheduleGrid';
import { useApp } from '../../context/AppContext';
import { addWeeks, startOfWeekMonday } from '../../utils/weekCalendar';

export function StudentCalendarScreen() {
  const { state, sessionUser, bookSlot, cancelBookingByStudent, ensureFreeTemplateSlotsForWeek } =
    useApp();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStartMonday = useMemo(
    () => addWeeks(startOfWeekMonday(new Date()), weekOffset),
    [weekOffset],
  );

  useEffect(() => {
    ensureFreeTemplateSlotsForWeek(weekStartMonday);
  }, [weekStartMonday, ensureFreeTemplateSlotsForWeek]);

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
      <Text style={styles.hint}>
        Слоты по 1,5 ч с 11:00 до 21:30 создаются автоматически на выбранную неделю. Зелёные —
        свободно; серые и розовые — занято (без имён других учеников).
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
  hint: { fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 18 },
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
