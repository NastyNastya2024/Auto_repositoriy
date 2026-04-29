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
  TextInput,
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

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function isValidDateTextDM(s: string): boolean {
  const m = /^(\d{1,2})\.(\d{1,2})$/.exec(s.trim());
  if (!m) return false;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  return dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12;
}

function applyDateTextDM(base: Date, s: string): Date | null {
  const m = /^(\d{1,2})\.(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(dd) || Number.isNaN(mm) || dd < 1 || dd > 31 || mm < 1 || mm > 12) return null;
  const next = new Date(base);
  next.setMonth(mm - 1, dd);
  if (next.getMonth() !== mm - 1 || next.getDate() !== dd) return null;
  return next;
}

function isValidTimeText(s: string): boolean {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return false;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

function applyTimeText(base: Date, s: string): Date | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  const next = new Date(base);
  next.setHours(hh, mm, 0, 0);
  return next;
}

function toTimeText(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

function closestAllowedDuration(target: number, allowed: readonly number[]): number {
  if (allowed.length === 0) return target;
  let best = allowed[0];
  let bestDist = Math.abs(target - best);
  for (const m of allowed) {
    const dist = Math.abs(target - m);
    if (dist < bestDist) {
      bestDist = dist;
      best = m;
    }
  }
  return best;
}

export function StudentCalendarScreen() {
  const { state, sessionUser, bookLessonSlot, cancelBookingByStudent, ensureFreeTemplateSlotsForWeek } =
    useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isWeb = Platform.OS === 'web';
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookTarget, setBookTarget] = useState<Slot | null>(null);
  const [pickStart, setPickStart] = useState(new Date());
  const [pickDuration, setPickDuration] = useState(90);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [dateText, setDateText] = useState('01.01');
  const [timeFromText, setTimeFromText] = useState('11:00');
  const [timeToText, setTimeToText] = useState('12:30');

  const weekStartMonday = useMemo(
    () => addWeeks(startOfWeekMonday(new Date()), weekOffset),
    [weekOffset],
  );

  useEffect(() => {
    ensureFreeTemplateSlotsForWeek(weekStartMonday);
  }, [weekStartMonday, ensureFreeTemplateSlotsForWeek]);

  const ensureCanBook = () => {
    if (sessionUser?.blocked) {
      Alert.alert('Доступ ограничен', 'Аккаунт заблокирован администратором.');
      return false;
    }
    if (!sessionUser?.assignedTariffId) {
      Alert.alert('Нет тарифа', 'Администратор ещё не закрепил за вами тариф. Записаться на занятие нельзя.');
      return false;
    }
    const at = state.tariffs.find((t) => t.id === sessionUser.assignedTariffId);
    if (!at?.active) {
      Alert.alert('Тариф недоступен', 'Закреплённый за вами тариф снят с витрины. Обратитесь к администратору.');
      return false;
    }
    return true;
  };

  const openBookSheet = (start: Date) => {
    if (!ensureCanBook()) return;
    const dt = new Date(start);
    setPickStart(dt);
    setDateText(`${pad2(dt.getDate())}.${pad2(dt.getMonth() + 1)}`);
    setTimeFromText(toTimeText(dt));
    const initialDur =
      (STUDENT_BOOKING_DURATIONS_MIN as readonly number[]).includes(pickDuration) ? pickDuration : 90;
    setPickDuration(initialDur);
    setTimeToText(toTimeText(addMinutes(dt, initialDur)));
    setPicker(null);
    // используем bookTarget как "флаг открыт/закрыт"
    setBookTarget({ id: 'sheet', startIso: dt.toISOString(), durationMin: initialDur, status: 'free' });
  };

  const openBookModal = (slot: Slot) => {
    if (!ensureCanBook()) return;
    const dt = new Date(slot.startIso);
    setPickStart(dt);
    setDateText(`${pad2(dt.getDate())}.${pad2(dt.getMonth() + 1)}`);
    setTimeFromText(toTimeText(dt));
    setPickDuration(
      (STUDENT_BOOKING_DURATIONS_MIN as readonly number[]).includes(slot.durationMin)
        ? slot.durationMin
        : 90,
    );
    setTimeToText(toTimeText(addMinutes(dt, slot.durationMin)));
    setPicker(null);
    setBookTarget(slot);
  };

  const closeBookModal = () => {
    setBookTarget(null);
    setPicker(null);
  };

  const confirmBook = () => {
    // На всякий случай применяем введённые значения перед отправкой.
    if (isValidDateTextDM(dateText)) {
      const d = applyDateTextDM(pickStart, dateText);
      if (d) mergeDate(d);
    }
    if (isValidTimeText(timeFromText)) {
      const t = applyTimeText(pickStart, timeFromText);
      if (t) mergeTime(t);
    }
    if (isValidTimeText(timeToText)) {
      const end = applyTimeText(addMinutes(pickStart, pickDuration), timeToText);
      if (end) {
        const diff = Math.round((end.getTime() - pickStart.getTime()) / 60_000);
        if (diff > 0) {
          const nextDur = closestAllowedDuration(diff, STUDENT_BOOKING_DURATIONS_MIN);
          setPickDuration(nextDur);
          setTimeToText(toTimeText(addMinutes(pickStart, nextDur)));
        }
      }
    }
    bookLessonSlot(pickStart, pickDuration, closeBookModal);
  };

  const mergeDate = (d: Date) => {
    const next = new Date(pickStart);
    next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    const normalized = snapToTemplateSlotStart(next);
    setPickStart(normalized);
    setDateText(`${pad2(normalized.getDate())}.${pad2(normalized.getMonth() + 1)}`);
    setTimeFromText(toTimeText(normalized));
    setTimeToText(toTimeText(addMinutes(normalized, pickDuration)));
  };

  const mergeTime = (d: Date) => {
    const next = new Date(pickStart);
    next.setHours(d.getHours(), d.getMinutes(), 0, 0);
    const normalized = snapToTemplateSlotStart(next);
    setPickStart(normalized);
    setDateText(`${pad2(normalized.getDate())}.${pad2(normalized.getMonth() + 1)}`);
    setTimeFromText(toTimeText(normalized));
    setTimeToText(toTimeText(addMinutes(normalized, pickDuration)));
  };

  const dateLabel = `${pad2(pickStart.getDate())}.${pad2(pickStart.getMonth() + 1)}`;
  const dateLabelLong = pickStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const timeLabel = toTimeText(pickStart);
  const timeToLabel = toTimeText(addMinutes(pickStart, pickDuration));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable
        style={styles.bigBookBtn}
        onPress={() => {
          // по умолчанию: сегодня (или ближайший старт), но в рамках текущей недели
          const base = new Date();
          const start = snapToTemplateSlotStart(base);
          openBookSheet(start);
        }}
      >
        <Text style={styles.bigBookBtnText}>Забронировать время</Text>
      </Pressable>

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
        hideFreeSlots={true}
        onPressEmptyCell={(dt) => openBookSheet(snapToTemplateSlotStart(dt))}
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

      {isWeb && bookTarget ? (
        <View style={[styles.webSheetRoot, styles.webOverlay]}>
          <Pressable style={styles.sheetBackdrop} onPress={closeBookModal} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Запись на занятие</Text>
              <Pressable onPress={closeBookModal} hitSlop={12} style={styles.sheetCloseHit}>
                <Text style={styles.sheetClose}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.selectedRow}>
                <View style={styles.selectedCell}>
                  <Text style={styles.selectedLabel}>Дата</Text>
                  <TextInput
                    value={dateText}
                    onChangeText={setDateText}
                    onBlur={() => {
                      if (!isValidDateTextDM(dateText)) {
                        setDateText(dateLabel);
                        return;
                      }
                      const d = applyDateTextDM(pickStart, dateText);
                      if (!d) {
                        setDateText(dateLabel);
                        return;
                      }
                      mergeDate(d);
                    }}
                    placeholder="ДД.ММ"
                    style={styles.dateInput}
                  />
                  <Text style={styles.dateHint}>ДД — день, ММ — месяц</Text>
                  <Text style={styles.dateHintExample}>{dateLabelLong}</Text>
                </View>
                <View style={styles.selectedCell}>
                  <Text style={styles.selectedLabel}>Время</Text>
                  <View style={styles.timeRow}>
                    <View style={styles.timeField}>
                      <Text style={styles.timeFieldLabel}>С</Text>
                      <TextInput
                        value={timeFromText}
                        onChangeText={setTimeFromText}
                        onBlur={() => {
                          if (!isValidTimeText(timeFromText)) {
                            setTimeFromText(timeLabel);
                            return;
                          }
                          const t = applyTimeText(pickStart, timeFromText);
                          if (t) mergeTime(t);
                        }}
                        placeholder="HH:MM"
                        style={styles.timeInput}
                      />
                    </View>
                    <View style={styles.timeField}>
                      <Text style={styles.timeFieldLabel}>До</Text>
                      <TextInput
                        value={timeToText}
                        onChangeText={setTimeToText}
                        onBlur={() => {
                          if (!isValidTimeText(timeToText)) {
                            setTimeToText(timeToLabel);
                            return;
                          }
                          const end = applyTimeText(addMinutes(pickStart, pickDuration), timeToText);
                          if (!end) {
                            setTimeToText(timeToLabel);
                            return;
                          }
                          const diff = Math.round((end.getTime() - pickStart.getTime()) / 60_000);
                          if (diff <= 0) {
                            setTimeToText(timeToLabel);
                            return;
                          }
                          const nextDur = closestAllowedDuration(diff, STUDENT_BOOKING_DURATIONS_MIN);
                          setPickDuration(nextDur);
                          setTimeToText(toTimeText(addMinutes(pickStart, nextDur)));
                        }}
                        placeholder="HH:MM"
                        style={styles.timeInput}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Календарь</Text>
              <MonthCalendar selected={pickStart} onSelectDate={mergeDate} colors={colors} />

              <Text style={styles.fieldLabel}>Длительность (мин)</Text>
              <View style={styles.durRow}>
                {STUDENT_BOOKING_DURATIONS_MIN.map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.chip, pickDuration === m && styles.chipOn]}
                    onPress={() => {
                      setPickDuration(m);
                      setTimeToText(toTimeText(addMinutes(pickStart, m)));
                    }}
                  >
                    <Text style={[styles.chipText, pickDuration === m && styles.chipTextOn]}>{m}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <Pressable style={styles.savePrimary} onPress={confirmBook}>
                <Text style={styles.savePrimaryText}>Забронировать урок</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <Modal visible={!!bookTarget} animationType="slide" transparent onRequestClose={closeBookModal}>
          <View style={styles.sheetRoot}>
            <Pressable style={styles.sheetBackdrop} onPress={closeBookModal} />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Запись на занятие</Text>
                <Pressable onPress={closeBookModal} hitSlop={12} style={styles.sheetCloseHit}>
                  <Text style={styles.sheetClose}>×</Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.fieldLabel}>Дата</Text>
                <Pressable style={styles.dateBtn} onPress={() => setPicker('date')}>
                  <Text style={styles.dateBtnText}>{dateLabel}</Text>
                </Pressable>

                <Text style={styles.fieldLabel}>Время начала</Text>
                <Pressable style={styles.dateBtn} onPress={() => setPicker('time')}>
                  <Text style={styles.dateBtnText}>{timeLabel}</Text>
                </Pressable>
                <Text style={styles.rangeHint}>{timeLabel}–{timeToLabel}</Text>

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
                      onPress={() => {
                        setPickDuration(m);
                        setTimeToText(toTimeText(addMinutes(pickStart, m)));
                      }}
                    >
                      <Text style={[styles.chipText, pickDuration === m && styles.chipTextOn]}>{m}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.sheetFooter}>
                <Pressable style={styles.savePrimary} onPress={confirmBook}>
                  <Text style={styles.savePrimaryText}>Забронировать урок</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

function MonthCalendar({
  selected,
  onSelectDate,
  colors,
}: {
  selected: Date;
  onSelectDate: (d: Date) => void;
  colors: ThemeColors;
}) {
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  useEffect(() => {
    setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [selected]);

  const monthLabel = cursor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const start = new Date(cursor);
  const weekday = (start.getDay() + 6) % 7; // Monday=0
  start.setDate(start.getDate() - weekday);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  return (
    <View style={[calendarStyles.wrap, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
      <View style={calendarStyles.head}>
        <Pressable style={calendarStyles.nav} onPress={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}>
          <Text style={[calendarStyles.navText, { color: colors.link }]}>‹</Text>
        </Pressable>
        <Text style={[calendarStyles.month, { color: colors.text }]}>{monthLabel}</Text>
        <Pressable style={calendarStyles.nav} onPress={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}>
          <Text style={[calendarStyles.navText, { color: colors.link }]}>›</Text>
        </Pressable>
      </View>
      <View style={calendarStyles.dowRow}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((x) => (
          <Text key={x} style={[calendarStyles.dow, { color: colors.textMuted }]}>
            {x}
          </Text>
        ))}
      </View>
      <View style={calendarStyles.grid}>
        {days.map((d) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const on = isSameDay(d, selected);
          return (
            <Pressable
              key={d.toISOString()}
              style={[calendarStyles.day, on ? { backgroundColor: colors.primary } : null]}
              onPress={() => onSelectDate(d)}
            >
              <Text style={[calendarStyles.dayText, { color: on ? colors.onPrimary : inMonth ? colors.text : colors.textMuted }]}>
                {d.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 14, padding: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  nav: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  navText: { fontSize: 18, fontWeight: '800' },
  month: { fontSize: 14, fontWeight: '800', textTransform: 'capitalize' },
  dowRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dow: { width: '14.285%', textAlign: 'center', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: '14.285%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  dayText: { fontSize: 13, fontWeight: '800' },
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    bigBookBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      marginBottom: 14,
    },
    bigBookBtnText: { color: colors.onPrimary, fontWeight: '900', fontSize: 16 },
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
    sheetRoot: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', backgroundColor: 'transparent' },
    // `position: fixed` не в типах RN, но для RN Web работает.
    webSheetRoot: ({ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, justifyContent: 'flex-end' } as any),
    webOverlay: { zIndex: 9999 },
    sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      maxHeight: '92%',
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginTop: 2,
      marginBottom: 10,
    },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    sheetTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
    sheetCloseHit: { paddingVertical: 12, paddingLeft: 12 },
    sheetClose: { color: colors.link, fontWeight: '900', fontSize: 24, lineHeight: 24 },
    sheetScroll: { flexGrow: 0 },
    sheetScrollContent: { paddingBottom: 12 },
    fieldLabel: {
      marginTop: 12,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    selectedRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    selectedCell: {
      flex: 1,
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    selectedLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', marginBottom: 6 },
    dateInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      color: colors.text,
      fontWeight: '800',
      fontSize: 14,
    },
    dateHint: { marginTop: 8, color: colors.textMuted, fontSize: 12, fontWeight: '700' },
    dateHintExample: { marginTop: 6, color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
    timeInput: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      color: colors.text,
      fontWeight: '800',
      fontSize: 14,
    },
    timeRow: { flexDirection: 'column', gap: 10, marginTop: 10 },
    timeField: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    timeFieldLabel: { width: 28, color: colors.textMuted, fontWeight: '800' },
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
    rangeHint: { marginTop: 8, color: colors.textMuted, fontSize: 12, fontWeight: '700' },
    sheetFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    savePrimary: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    savePrimaryText: { color: colors.onPrimary, fontWeight: '800', fontSize: 15 },
  });
}
