import { useEffect, useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WeekScheduleGrid } from '../../components/WeekScheduleGrid';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme';
import type { Slot } from '../../types';
import { STUDENT_BOOKING_DURATIONS_MIN } from '../../utils/studentBooking';
import { addWeeks, snapToTemplateSlotStart, startOfWeekMonday } from '../../utils/weekCalendar';

type PickerKind = 'date' | 'time' | null;

export function StudentCalendarScreen() {
  const { state, sessionUser, bookLessonSlot, cancelBookingByStudent, ensureFreeTemplateSlotsForWeek } =
    useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookTarget, setBookTarget] = useState<Slot | null>(null);
  const [pickStart, setPickStart] = useState(new Date());
  const [pickDuration, setPickDuration] = useState(90);
  const [picker, setPicker] = useState<PickerKind>(null);

  const weekStartMonday = useMemo(
    () => addWeeks(startOfWeekMonday(new Date()), weekOffset),
    [weekOffset],
  );

  useEffect(() => {
    ensureFreeTemplateSlotsForWeek(weekStartMonday);
  }, [weekStartMonday, ensureFreeTemplateSlotsForWeek]);

  const openBookModal = (slot: Slot) => {
    if (sessionUser?.blocked) {
      Alert.alert('Доступ ограничен', 'Аккаунт заблокирован администратором.');
      return;
    }
    if (!sessionUser?.assignedTariffId) {
      Alert.alert(
        'Нет тарифа',
        'Администратор ещё не закрепил за вами тариф. Записаться на занятие нельзя.',
      );
      return;
    }
    const at = state.tariffs.find((t) => t.id === sessionUser.assignedTariffId);
    if (!at?.active) {
      Alert.alert(
        'Тариф недоступен',
        'Закреплённый за вами тариф снят с витрины. Обратитесь к администратору.',
      );
      return;
    }
    setPickStart(new Date(slot.startIso));
    setPickDuration(
      (STUDENT_BOOKING_DURATIONS_MIN as readonly number[]).includes(slot.durationMin)
        ? slot.durationMin
        : 90,
    );
    setPicker(null);
    setBookTarget(slot);
  };

  const closeBookModal = () => {
    setBookTarget(null);
    setPicker(null);
  };

  const confirmBook = () => {
    bookLessonSlot(pickStart, pickDuration, closeBookModal);
  };

  const mergeDate = (d: Date) => {
    const next = new Date(pickStart);
    next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    setPickStart(snapToTemplateSlotStart(next));
  };

  const mergeTime = (d: Date) => {
    const next = new Date(pickStart);
    next.setHours(d.getHours(), d.getMinutes(), 0, 0);
    setPickStart(snapToTemplateSlotStart(next));
  };

  const dateLabel = pickStart.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeLabel = pickStart.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        onPressFreeSlot={openBookModal}
        onPressOwnPending={(bookingId) =>
          Alert.alert('Отмена заявки', 'Отменить запрос?', [
            { text: 'Нет', style: 'cancel' },
            { text: 'Да', onPress: () => cancelBookingByStudent(bookingId) },
          ])
        }
        onPressAdminSlot={() => {}}
      />

      <Text style={styles.hint}>
        Нажмите свободное окно. В форме записи можно изменить дату, время начала и длительность
        (11:00–21:30). Светло-голубое в сетке — свободно. Запись возможна только если
        администратор закрепил за вами тариф.
      </Text>

      <Modal visible={!!bookTarget} animationType="slide" transparent onRequestClose={closeBookModal}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Запись на занятие</Text>

            <Text style={styles.fieldLabel}>Дата</Text>
            <Pressable style={styles.dateBtn} onPress={() => setPicker('date')}>
              <Text style={styles.dateBtnText}>{dateLabel}</Text>
            </Pressable>

            <Text style={styles.fieldLabel}>Время начала</Text>
            <Pressable style={styles.dateBtn} onPress={() => setPicker('time')}>
              <Text style={styles.dateBtnText}>{timeLabel}</Text>
            </Pressable>

            {picker && (
              <>
                <DateTimePicker
                  value={pickStart}
                  mode={picker}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, d) => {
                    if (Platform.OS === 'android') setPicker(null);
                    if (e.type === 'dismissed') {
                      if (Platform.OS === 'ios') setPicker(null);
                      return;
                    }
                    if (d) {
                      if (picker === 'date') mergeDate(d);
                      else mergeTime(d);
                    }
                  }}
                />
                {Platform.OS === 'ios' && (
                  <Pressable style={styles.iosDone} onPress={() => setPicker(null)}>
                    <Text style={styles.iosDoneText}>Готово</Text>
                  </Pressable>
                )}
              </>
            )}

            <Text style={styles.fieldLabel}>Длительность (мин)</Text>
            <View style={styles.durRow}>
              {STUDENT_BOOKING_DURATIONS_MIN.map((m) => (
                <Pressable
                  key={m}
                  style={[styles.chip, pickDuration === m && styles.chipOn]}
                  onPress={() => setPickDuration(m)}
                >
                  <Text style={[styles.chipText, pickDuration === m && styles.chipTextOn]}>{m}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={closeBookModal}>
                <Text style={styles.modalCancelText}>Отмена</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={confirmBook}>
                <Text style={styles.modalSaveText}>Отправить заявку</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    hint: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 12,
      lineHeight: 18,
    },
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
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    navBtnText: { fontSize: 22, fontWeight: '600', color: colors.link },
    weekNavTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    modalBg: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      maxHeight: '92%',
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    fieldLabel: {
      marginTop: 12,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    dateBtn: {
      backgroundColor: colors.surfaceMuted,
      padding: 12,
      borderRadius: 10,
      marginTop: 6,
    },
    dateBtnText: { fontWeight: '600', color: colors.text },
    durRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.chip,
    },
    chipOn: { backgroundColor: colors.chipOn },
    chipText: { color: colors.textSecondary },
    chipTextOn: { color: colors.chipOnText, fontWeight: '700' },
    iosDone: { alignSelf: 'flex-end', paddingVertical: 8 },
    iosDoneText: { color: colors.link, fontWeight: '700' },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 20,
    },
    modalCancel: { padding: 10 },
    modalCancelText: { color: colors.textSecondary },
    modalSave: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },
    modalSaveText: { color: colors.onPrimary, fontWeight: '600' },
  });
}
