import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WeekScheduleGrid } from '../../components/WeekScheduleGrid';
import { useApp } from '../../context/AppContext';
import { useServerRefreshOnFocus } from '../../hooks/useServerRefreshOnFocus';
import type { Slot } from '../../types';
import { bookingStatusLabel, formatSlotDate } from '../../utils/format';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme';
import { buttonLabelStyle, sheetFooterButtonLayout, sheetFooterLayout } from '../../utils/typography';
import {
  addWeeks,
  defaultNewSlotStart,
  getBookingForSlot,
  slotStatusLabel,
  snapToTemplateSlotStart,
  startOfWeekMonday,
} from '../../utils/weekCalendar';

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
  // если дата перепрыгнула месяц (например 31.02) — отклоняем
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

function toInputDateValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toInputTimeValue(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function StudentPicker({
  students,
  selectedId,
  onSelect,
  styles,
}: {
  students: { id: string; name: string; phone?: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  if (students.length === 0) {
    return (
      <Text style={styles.emptyStudents}>
        Нет учеников. Добавьте их в разделе «Пользователи».
      </Text>
    );
  }
  return (
    <View style={styles.studentList}>
      {students.map((u) => {
        const on = selectedId === u.id;
        return (
          <Pressable
            key={u.id}
            style={[styles.studentRow, on ? styles.studentRowOn : null]}
            onPress={() => onSelect(u.id)}
          >
            <Text style={[styles.studentName, on ? styles.studentNameOn : null]}>{u.name}</Text>
            {u.phone ? <Text style={styles.studentMeta}>{u.phone}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function AdminSlotsScreen() {
  const {
    state,
    addBlockedSlot,
    adminBookStudentSlot,
    removeSlot,
    setBookingStatus,
    ensureFreeTemplateSlotsForWeek,
  } = useApp();
  useServerRefreshOnFocus();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: screenWidth } = useWindowDimensions();
  const [weekOffset, setWeekOffset] = useState(0);
  const [modal, setModal] = useState(false);
  const [startAt, setStartAt] = useState(new Date());
  const [endAt, setEndAt] = useState(new Date());
  const [picker, setPicker] = useState<PickerKind>(null);
  const webDateRef = useRef<HTMLInputElement | null>(null);
  const [timeFromText, setTimeFromText] = useState('11:00');
  const [timeToText, setTimeToText] = useState('12:30');
  const [dateText, setDateText] = useState('01.01');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [actionSlot, setActionSlot] = useState<Slot | null>(null);
  const [actionConfirm, setActionConfirm] = useState<'cancel-booking' | 'remove-slot' | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';
  const isWebDesktop = isWeb && screenWidth >= 900;

  const students = useMemo(
    () =>
      state.users
        .filter((u) => u.role === 'student' && !u.blocked)
        .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [state.users],
  );

  const weekStartMonday = useMemo(
    () => addWeeks(startOfWeekMonday(new Date()), weekOffset),
    [weekOffset],
  );

  useEffect(() => {
    ensureFreeTemplateSlotsForWeek(weekStartMonday);
  }, [weekStartMonday, ensureFreeTemplateSlotsForWeek]);

  const resetStudentSelection = () => {
    setSelectedStudentId(students[0]?.id ?? null);
  };

  const closeActionSheet = () => {
    setActionSlot(null);
    setActionConfirm(null);
  };

  const openModal = () => {
    const start = defaultNewSlotStart();
    const end = new Date(start.getTime() + 90 * 60_000);
    setStartAt(start);
    setEndAt(end);
    setTimeFromText(toInputTimeValue(start));
    setTimeToText(toInputTimeValue(end));
    setDateText(`${pad2(start.getDate())}.${pad2(start.getMonth() + 1)}`);
    setPicker(null);
    setEditingBookingId(null);
    resetStudentSelection();
    setModal(true);
  };

  const openModalAt = (dt: Date) => {
    const start = new Date(dt);
    const end = new Date(start.getTime() + 90 * 60_000);
    setStartAt(start);
    setEndAt(end);
    setTimeFromText(toInputTimeValue(start));
    setTimeToText(toInputTimeValue(end));
    setDateText(`${pad2(start.getDate())}.${pad2(start.getMonth() + 1)}`);
    setPicker(null);
    setEditingBookingId(null);
    resetStudentSelection();
    setModal(true);
  };

  const openEditBooking = (slot: Slot, bookingId: string, studentId: string) => {
    const start = new Date(slot.startIso);
    const end = new Date(start.getTime() + slot.durationMin * 60_000);
    setStartAt(start);
    setEndAt(end);
    setTimeFromText(toInputTimeValue(start));
    setTimeToText(toInputTimeValue(end));
    setDateText(`${pad2(start.getDate())}.${pad2(start.getMonth() + 1)}`);
    setSelectedStudentId(studentId);
    setEditingBookingId(bookingId);
    setPicker(null);
    closeActionSheet();
    setModal(true);
  };

  const parseModalRange = () => {
    const st = applyTimeText(startAt, timeFromText) ?? startAt;
    const en = applyTimeText(endAt, timeToText) ?? endAt;
    const dur = Math.round((en.getTime() - st.getTime()) / 60_000);
    return { st, dur };
  };

  const submitStudentBooking = () => {
    const { st, dur } = parseModalRange();
    if (dur <= 0) {
      Alert.alert('Время', 'Проверьте, что «До» позже, чем «С».');
      return;
    }
    if (!selectedStudentId) {
      Alert.alert('Ученик', 'Выберите ученика из списка.');
      return;
    }
    const cancelId = editingBookingId ?? undefined;
    adminBookStudentSlot(selectedStudentId, st, dur, () => {
      setModal(false);
      setEditingBookingId(null);
    }, cancelId);
  };

  const submitBlockedTime = () => {
    const { st, dur } = parseModalRange();
    if (dur <= 0) {
      Alert.alert('Время', 'Проверьте, что «До» позже, чем «С».');
      return;
    }
    addBlockedSlot(st, dur);
    setModal(false);
  };

  const mergeDate = (d: Date) => {
    const nextStart = new Date(startAt);
    nextStart.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    const nextEnd = new Date(endAt);
    nextEnd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    setStartAt(nextStart);
    setEndAt(nextEnd);
    setTimeFromText(toInputTimeValue(nextStart));
    setTimeToText(toInputTimeValue(nextEnd));
    setDateText(`${pad2(nextStart.getDate())}.${pad2(nextStart.getMonth() + 1)}`);
  };

  const dateLabelNumeric = `${pad2(startAt.getDate())}.${pad2(startAt.getMonth() + 1)}`;
  const timeRangeLabel = useMemo(() => {
    return `${toInputTimeValue(startAt)}–${toInputTimeValue(endAt)}`;
  }, [startAt, endAt]);

  const onPressAdminSlot = (slot: Slot) => {
    setActionConfirm(null);
    setActionSlot(slot);
  };

  const actionBooking = actionSlot
    ? getBookingForSlot(actionSlot.id, state.bookings)
    : undefined;
  const actionStudent = actionBooking
    ? state.users.find((u) => u.id === actionBooking.userId)
    : undefined;
  const bookingModalTitle = editingBookingId ? 'Изменить запись' : 'Запись ученика';
  const bookingSubmitLabel = editingBookingId ? 'Сохранить' : 'Записать ученика';

  const renderSlotActionSheet = () => {
    if (!actionSlot) return null;

    const slot = actionSlot;
    const booking = actionBooking;
    const studentName = actionStudent?.name;

    const infoLines = [
      formatSlotDate(slot.startIso),
      `${slot.durationMin} мин`,
      `Слот: ${slotStatusLabel(slot.status)}`,
      ...(booking ? [`Запись: ${bookingStatusLabel(booking.status)}`] : []),
      ...(studentName ? [`Ученик: ${studentName}`] : []),
    ];

    const sheetBody = (
      <>
        <Pressable style={styles.sheetBackdrop} onPress={closeActionSheet} />
        <View style={[styles.sheet, isWebDesktop ? styles.sideSheet : null]}>
          {isWebDesktop ? null : <View style={styles.sheetHandle} />}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {slot.status === 'free'
                ? 'Свободное время'
                : slot.status === 'blocked'
                  ? 'Закрытое время'
                  : 'Запись'}
            </Text>
            <Pressable onPress={closeActionSheet} hitSlop={12} style={styles.sheetCloseHit}>
              <Text style={styles.sheetClose}>×</Text>
            </Pressable>
          </View>

          <View style={styles.actionInfo}>
            {infoLines.map((line) => (
              <Text key={line} style={styles.actionInfoLine}>
                {line}
              </Text>
            ))}
          </View>

          {actionConfirm ? (
            <View style={styles.actionStack}>
              <Text style={styles.actionConfirmText}>
                {actionConfirm === 'cancel-booking'
                  ? 'Отменить запись? Слот снова станет свободным.'
                  : 'Удалить? Связанные записи будут удалены.'}
              </Text>
              <Pressable
                style={styles.actionBtnDanger}
                onPress={() => {
                  if (actionConfirm === 'cancel-booking' && booking) {
                    setBookingStatus(booking.id, 'cancelled');
                  } else if (actionConfirm === 'remove-slot') {
                    removeSlot(slot.id);
                  }
                  closeActionSheet();
                }}
              >
                <Text style={styles.actionBtnDangerText}>
                  {actionConfirm === 'cancel-booking' ? 'Да, отменить' : 'Да, удалить'}
                </Text>
              </Pressable>
              <Pressable style={styles.saveSecondary} onPress={() => setActionConfirm(null)}>
                <Text style={styles.saveSecondaryText}>Назад</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.actionStack}>
              {slot.status === 'free' ? (
                <Pressable
                  style={styles.savePrimary}
                  onPress={() => {
                    closeActionSheet();
                    openModalAt(new Date(slot.startIso));
                  }}
                >
                  <Text style={styles.savePrimaryText}>Записать ученика</Text>
                </Pressable>
              ) : null}

              {slot.status === 'blocked' ? (
                <Pressable
                  style={styles.actionBtnDanger}
                  onPress={() => setActionConfirm('remove-slot')}
                >
                  <Text style={styles.actionBtnDangerText}>Удалить закрытие</Text>
                </Pressable>
              ) : null}

              {booking && (slot.status === 'pending' || slot.status === 'booked') ? (
                <>
                  {booking.status === 'pending' ? (
                    <Pressable
                      style={styles.savePrimary}
                      onPress={() => {
                        setBookingStatus(booking.id, 'booked');
                        closeActionSheet();
                      }}
                    >
                      <Text style={styles.savePrimaryText}>Подтвердить запись</Text>
                    </Pressable>
                  ) : null}
                  {booking.status === 'booked' ? (
                    <Pressable
                      style={styles.savePrimary}
                      onPress={() => {
                        setBookingStatus(booking.id, 'completed');
                        closeActionSheet();
                      }}
                    >
                      <Text style={styles.savePrimaryText}>Завершить занятие</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={styles.saveSecondary}
                    onPress={() => openEditBooking(slot, booking.id, booking.userId)}
                  >
                    <Text style={styles.saveSecondaryText}>Изменить запись</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionBtnDanger}
                    onPress={() => setActionConfirm('cancel-booking')}
                  >
                    <Text style={styles.actionBtnDangerText}>Отменить запись</Text>
                  </Pressable>
                </>
              ) : null}

              {slot.status === 'completed' ? (
                <Pressable
                  style={styles.actionBtnDanger}
                  onPress={() => setActionConfirm('remove-slot')}
                >
                  <Text style={styles.actionBtnDangerText}>Убрать из календаря</Text>
                </Pressable>
              ) : null}

              {!booking && slot.status !== 'free' && slot.status !== 'blocked' ? (
                <Pressable
                  style={styles.actionBtnDanger}
                  onPress={() => setActionConfirm('remove-slot')}
                >
                  <Text style={styles.actionBtnDangerText}>Удалить слот</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </>
    );

    if (isWeb) {
      return (
        <View
          style={[
            isWebDesktop ? styles.webSideSheetRoot : styles.webSheetRoot,
            styles.webOverlay,
          ]}
        >
          {sheetBody}
        </View>
      );
    }

    return (
      <Modal visible animationType="slide" transparent onRequestClose={closeActionSheet}>
        <View style={styles.sheetRoot}>{sheetBody}</View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.actions}>
        <Pressable style={styles.blockBtn} onPress={openModal}>
          <Text style={styles.blockBtnText}>+ Записать ученика</Text>
        </Pressable>
      </View>

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
        mode="admin"
        hideFreeSlots
        onPressFreeSlot={(slot) => openModalAt(new Date(slot.startIso))}
        onPressAdminSlot={onPressAdminSlot}
        onPressEmptyCell={(dt, durationMin) => {
          const start = new Date(dt);
          const end = new Date(start.getTime() + (durationMin ?? 90) * 60_000);
          openModalAt(start);
          // openModalAt выставляет start/end на 90 минут — поправим под drag-выбор
          setStartAt(start);
          setEndAt(end);
          setTimeFromText(toInputTimeValue(start));
          setTimeToText(toInputTimeValue(end));
          setDateText(`${pad2(start.getDate())}.${pad2(start.getMonth() + 1)}`);
        }}
      />

      {isWeb ? (
        modal ? (
          <View style={[isWebDesktop ? styles.webSideSheetRoot : styles.webSheetRoot, styles.webOverlay]}>
            <Pressable style={styles.sheetBackdrop} onPress={() => setModal(false)} />
            <View style={[styles.sheet, isWebDesktop ? styles.sideSheet : null]}>
              {isWebDesktop ? null : <View style={styles.sheetHandle} />}
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{bookingModalTitle}</Text>
                <Pressable onPress={() => setModal(false)} hitSlop={12} style={styles.sheetCloseHit}>
                  <Text style={styles.sheetClose}>×</Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Сверху выбранные значения */}
                <View style={styles.selectedRow}>
                  <View style={styles.selectedCell}>
                    <Text style={styles.selectedLabel}>Дата</Text>
                    <TextInput
                      value={dateText}
                      onChangeText={setDateText}
                      onBlur={() => {
                        if (!isValidDateTextDM(dateText)) {
                          setDateText(dateLabelNumeric);
                          return;
                        }
                        const next = applyDateTextDM(startAt, dateText);
                        if (!next) {
                          setDateText(dateLabelNumeric);
                          return;
                        }
                        const nextStart = new Date(startAt);
                        nextStart.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
                        const nextEnd = new Date(endAt);
                        nextEnd.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
                        setStartAt(nextStart);
                        setEndAt(nextEnd);
                        setTimeFromText(toInputTimeValue(nextStart));
                        setTimeToText(toInputTimeValue(nextEnd));
                        setDateText(`${pad2(next.getDate())}.${pad2(next.getMonth() + 1)}`);
                      }}
                      placeholder="ДД.ММ"
                      style={styles.dateInput}
                    />
                    <Text style={styles.dateHint}>ДД — день, ММ — месяц</Text>
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
                              setTimeFromText(toInputTimeValue(startAt));
                              return;
                            }
                            const next = applyTimeText(startAt, timeFromText);
                            if (!next) {
                              setTimeFromText(toInputTimeValue(startAt));
                              return;
                            }
                            setStartAt(next);
                            setTimeFromText(toInputTimeValue(next));
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
                              setTimeToText(toInputTimeValue(endAt));
                              return;
                            }
                            const end = applyTimeText(endAt, timeToText);
                            if (!end) {
                              setTimeToText(toInputTimeValue(endAt));
                              return;
                            }
                            setEndAt(end);
                            setTimeToText(toInputTimeValue(end));
                          }}
                          placeholder="HH:MM"
                          style={styles.timeInput}
                        />
                      </View>
                    </View>
                    <Text style={styles.rangeHint}>{timeRangeLabel}</Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Ученик</Text>
                <StudentPicker
                  students={students}
                  selectedId={selectedStudentId}
                  onSelect={setSelectedStudentId}
                  styles={styles}
                />

                <Text style={styles.fieldLabel}>Календарь</Text>
                <MonthCalendar selected={startAt} onSelectDate={(d) => mergeDate(d)} colors={colors} />
              </ScrollView>

              <View style={styles.sheetFooter}>
                <Pressable style={styles.saveSecondary} onPress={submitBlockedTime}>
                  <Text style={styles.saveSecondaryText}>Закрыть время</Text>
                </Pressable>
                <Pressable style={styles.savePrimary} onPress={submitStudentBooking}>
                  <Text style={styles.savePrimaryText}>{bookingSubmitLabel}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null
      ) : (
        <Modal visible={modal} animationType="slide" transparent>
          <View style={styles.sheetRoot}>
            <Pressable style={styles.sheetBackdrop} onPress={() => setModal(false)} />
            <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{bookingModalTitle}</Text>
              <Pressable onPress={() => setModal(false)} hitSlop={12} style={styles.sheetCloseHit}>
                <Text style={styles.sheetClose}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Сверху выбранные значения */}
              <View style={styles.selectedRow}>
                <View style={styles.selectedCell}>
                  <Text style={styles.selectedLabel}>Дата</Text>
                  <TextInput
                    value={dateText}
                    onChangeText={setDateText}
                    onBlur={() => {
                      if (!isValidDateTextDM(dateText)) {
                        setDateText(dateLabelNumeric);
                        return;
                      }
                      const next = applyDateTextDM(startAt, dateText);
                      if (!next) {
                        setDateText(dateLabelNumeric);
                        return;
                      }
                      const nextStart = new Date(startAt);
                      nextStart.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
                      const nextEnd = new Date(endAt);
                      nextEnd.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
                      setStartAt(nextStart);
                      setEndAt(nextEnd);
                      setTimeFromText(toInputTimeValue(nextStart));
                      setTimeToText(toInputTimeValue(nextEnd));
                      setDateText(`${pad2(next.getDate())}.${pad2(next.getMonth() + 1)}`);
                    }}
                    placeholder="ДД.ММ"
                    style={styles.dateInput}
                  />
                  <Text style={styles.dateHint}>ДД — день, ММ — месяц</Text>
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
                            setTimeFromText(toInputTimeValue(startAt));
                            return;
                          }
                          const next = applyTimeText(startAt, timeFromText);
                          if (!next) {
                            setTimeFromText(toInputTimeValue(startAt));
                            return;
                          }
                          setStartAt(next);
                          setTimeFromText(toInputTimeValue(next));
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
                            setTimeToText(toInputTimeValue(endAt));
                            return;
                          }
                          const end = applyTimeText(endAt, timeToText);
                          if (!end) {
                            setTimeToText(toInputTimeValue(endAt));
                            return;
                          }
                          setEndAt(end);
                          setTimeToText(toInputTimeValue(end));
                        }}
                        placeholder="HH:MM"
                        style={styles.timeInput}
                      />
                    </View>
                  </View>
                  <Text style={styles.rangeHint}>{timeRangeLabel}</Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Ученик</Text>
              <StudentPicker
                students={students}
                selectedId={selectedStudentId}
                onSelect={setSelectedStudentId}
                styles={styles}
              />

              {/* Календарь сразу виден */}
              <Text style={styles.fieldLabel}>Календарь</Text>
              {Platform.OS === 'web' ? (
                <MonthCalendar selected={startAt} onSelectDate={(d) => mergeDate(d)} colors={colors} />
              ) : (
                <>
                  <Pressable style={styles.dateBtn} onPress={() => setPicker((p) => (p === 'date' ? null : 'date'))}>
                    <Text style={styles.dateBtnText}>Выбрать дату</Text>
                  </Pressable>
                  {picker === 'date' ? (
                    <>
                      <DateTimePicker
                        value={startAt}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(e, d) => {
                          if (Platform.OS === 'android') setPicker(null);
                          if (e.type === 'dismissed') {
                            if (Platform.OS === 'ios') setPicker(null);
                            return;
                          }
                          if (d) mergeDate(d);
                        }}
                      />
                      {Platform.OS === 'ios' && (
                        <Pressable style={styles.iosDone} onPress={() => setPicker(null)}>
                          <Text style={styles.iosDoneText}>Готово</Text>
                        </Pressable>
                      )}
                    </>
                  ) : null}
                </>
              )}
            </ScrollView>

            <View style={styles.sheetFooter}>
              <Pressable style={styles.saveSecondary} onPress={submitBlockedTime}>
                <Text style={styles.saveSecondaryText}>Закрыть время</Text>
              </Pressable>
              <Pressable style={styles.savePrimary} onPress={submitStudentBooking}>
                <Text style={styles.savePrimaryText}>{bookingSubmitLabel}</Text>
              </Pressable>
            </View>
          </View>
          </View>
        </Modal>
      )}

      {renderSlotActionSheet()}
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
        <Pressable
          style={calendarStyles.nav}
          onPress={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
        >
          <Text style={[calendarStyles.navText, { color: colors.link }]}>‹</Text>
        </Pressable>
        <Text style={[calendarStyles.month, { color: colors.text }]}>{monthLabel}</Text>
        <Pressable
          style={calendarStyles.nav}
          onPress={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
        >
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
              style={[
                calendarStyles.day,
                on ? { backgroundColor: colors.primary } : null,
              ]}
              onPress={() => onSelectDate(d)}
            >
              <Text
                style={[
                  calendarStyles.dayText,
                  { color: on ? colors.onPrimary : inMonth ? colors.text : colors.textMuted },
                ]}
              >
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
    actions: { flexDirection: 'row', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
    blockBtn: {
      flex: 1,
      minWidth: 140,
      backgroundColor: colors.link,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
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
    // На web у Modal бывает "белый экран", если корневой контейнер не absolute-fill.
    sheetRoot: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', backgroundColor: 'transparent' },
    // На web overlay должен быть фиксирован к viewport, иначе внутри ScrollView может "съезжать" и давать белый экран.
    // `position: fixed` не входит в типы RN, но в RN Web работает.
    webSheetRoot: ({
      position: 'fixed',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'flex-end',
    } as any),
    webSideSheetRoot: ({
      position: 'fixed',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'flex-end',
    } as any),
    webOverlay: { zIndex: 9999 },
    sheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      maxHeight: '92%',
    },
    sideSheet: {
      width: '50%',
      maxWidth: 560,
      minWidth: 380,
      height: '100%',
      maxHeight: '100%',
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: 18,
      borderBottomLeftRadius: 18,
      borderTopWidth: 0,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.border,
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
    fieldLabel: {
      marginTop: 12,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    sheetScroll: { flexGrow: 0 },
    sheetScrollContent: { paddingBottom: 12 },
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
    selectedValue: { fontSize: 13, color: colors.text, fontWeight: '800' },
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
    timeRow: { flexDirection: 'column', gap: 10 },
    timeField: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    timeFieldLabel: { width: 28, color: colors.textMuted, fontWeight: '800' },
    rangeHint: { marginTop: 6, color: colors.textMuted, fontSize: 12, fontWeight: '700' },
    dateBtn: {
      backgroundColor: colors.surfaceMuted,
      padding: 12,
      borderRadius: 10,
      marginBottom: 12,
    },
    dateBtnText: { fontWeight: '600', color: colors.text },
    studentList: { gap: 8, marginBottom: 4 },
    studentRow: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    studentRowOn: {
      borderColor: colors.primary,
      backgroundColor: colors.chipOn,
    },
    studentName: { fontSize: 15, fontWeight: '700', color: colors.text },
    studentNameOn: { color: colors.primary },
    studentMeta: { marginTop: 4, fontSize: 12, color: colors.textMuted },
    emptyStudents: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
    sheetFooter: {
      ...sheetFooterLayout(),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    saveSecondary: {
      ...sheetFooterButtonLayout(),
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveSecondaryText: buttonLabelStyle({ color: colors.text, fontSize: 14 }),
    savePrimary: {
      ...sheetFooterButtonLayout(),
      backgroundColor: colors.primary,
    },
    savePrimaryText: buttonLabelStyle({ color: colors.onPrimary, fontSize: 15 }),
    actionInfo: {
      marginTop: 4,
      marginBottom: 8,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    actionInfoLine: { fontSize: 14, lineHeight: 22, color: colors.text },
    actionStack: { gap: 10, marginTop: 4, paddingBottom: 8 },
    actionConfirmText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    actionBtnDanger: {
      ...sheetFooterButtonLayout(),
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.dangerBorder,
    },
    actionBtnDangerText: buttonLabelStyle({ color: colors.dangerText, fontSize: 15 }),
    blockBtnText: buttonLabelStyle({ color: colors.onPrimary, fontSize: 15 }),
    iosDone: { alignSelf: 'flex-end', paddingVertical: 8 },
    iosDoneText: { color: colors.link, fontWeight: '700' },
  });
}
