import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WeekScheduleGrid } from '../../components/WeekScheduleGrid';
import { useApp } from '../../context/AppContext';
import type { Slot } from '../../types';
import { formatSlotDate } from '../../utils/format';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme';
import {
  addWeeks,
  defaultNewSlotStart,
  getBookingForSlot,
  snapToTemplateSlotStart,
  startOfWeekMonday,
} from '../../utils/weekCalendar';

export function AdminSlotsScreen() {
  const { state, addSlot, addBlockedSlot, removeSlot, setBookingStatus, ensureFreeTemplateSlotsForWeek } =
    useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [modal, setModal] = useState(false);
  const [modalKind, setModalKind] = useState<'free' | 'blocked'>('free');
  const [when, setWhen] = useState(new Date());
  const [duration, setDuration] = useState(90);
  const [showPicker, setShowPicker] = useState(false);

  const weekStartMonday = useMemo(
    () => addWeeks(startOfWeekMonday(new Date()), weekOffset),
    [weekOffset],
  );

  useEffect(() => {
    ensureFreeTemplateSlotsForWeek(weekStartMonday);
  }, [weekStartMonday, ensureFreeTemplateSlotsForWeek]);

  const openModal = (kind: 'free' | 'blocked') => {
    setModalKind(kind);
    setWhen(defaultNewSlotStart());
    setDuration(kind === 'blocked' ? 120 : 90);
    setModal(true);
  };

  const onPressAdminSlot = (slot: Slot) => {
    const lines = [
      formatSlotDate(slot.startIso),
      `${slot.durationMin} мин`,
      `Статус: ${slot.status}`,
    ].join('\n');

    if (slot.status === 'free' || slot.status === 'blocked') {
      Alert.alert('Слот', lines, [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Удалить?', 'Связанные записи будут удалены.', [
              { text: 'Нет', style: 'cancel' },
              { text: 'Да', style: 'destructive', onPress: () => removeSlot(slot.id) },
            ]),
        },
      ]);
      return;
    }

    const actions: {
      text: string;
      style?: 'destructive' | 'cancel';
      onPress?: () => void;
    }[] = [{ text: 'Закрыть', style: 'cancel' }];

    const booking = getBookingForSlot(slot.id, state.bookings);
    if (slot.status === 'booked' && booking) {
      actions.unshift({
        text: 'Завершить занятие',
        onPress: () => setBookingStatus(booking.id, 'completed'),
      });
    }

    actions.unshift({
      text: 'Удалить слот',
      style: 'destructive',
      onPress: () =>
        Alert.alert('Удалить слот?', undefined, [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Удалить', style: 'destructive', onPress: () => removeSlot(slot.id) },
        ]),
    });

    Alert.alert('Слот', lines, actions);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.actions}>
        <Pressable style={styles.addBtn} onPress={() => openModal('free')}>
          <Text style={styles.addBtnText}>+ Свободный слот</Text>
        </Pressable>
        <Pressable style={styles.blockBtn} onPress={() => openModal('blocked')}>
          <Text style={styles.blockBtnText}>Закрыть время</Text>
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
        onPressFreeSlot={() => {}}
        onPressAdminSlot={onPressAdminSlot}
      />

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalKind === 'free' ? 'Новый свободный слот' : 'Закрыть время (блок)'}
            </Text>
            <Pressable style={styles.dateBtn} onPress={() => setShowPicker(true)}>
              <Text style={styles.dateBtnText}>{formatSlotDate(when.toISOString())}</Text>
            </Pressable>
            {showPicker && (
              <>
                <DateTimePicker
                  value={when}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, d) => {
                    if (Platform.OS === 'android') setShowPicker(false);
                    if (e.type === 'dismissed') {
                      if (Platform.OS === 'ios') setShowPicker(false);
                      return;
                    }
                    if (d) setWhen(d);
                  }}
                />
                {Platform.OS === 'ios' && (
                  <Pressable style={styles.iosDone} onPress={() => setShowPicker(false)}>
                    <Text style={styles.iosDoneText}>Готово</Text>
                  </Pressable>
                )}
              </>
            )}
            <Text style={styles.label}>Длительность (мин)</Text>
            <View style={styles.durRow}>
              {[60, 90, 120, 180, 240].map((m) => (
                <Pressable
                  key={m}
                  style={[styles.chip, duration === m && styles.chipOn]}
                  onPress={() => setDuration(m)}
                >
                  <Text style={[styles.chipText, duration === m && styles.chipTextOn]}>{m}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancel} onPress={() => setModal(false)}>
                <Text style={styles.cancelText}>Отмена</Text>
              </Pressable>
              <Pressable
                style={styles.save}
                onPress={() => {
                  const start = snapToTemplateSlotStart(when);
                  if (modalKind === 'free') addSlot(start, duration);
                  else addBlockedSlot(start, duration);
                  setModal(false);
                }}
              >
                <Text style={styles.saveText}>Сохранить</Text>
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
    actions: { flexDirection: 'row', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
    addBtn: {
      flex: 1,
      minWidth: 140,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    addBtnText: { color: colors.onPrimary, fontWeight: '700' },
    blockBtn: {
      flex: 1,
      minWidth: 140,
      backgroundColor: colors.link,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    blockBtnText: { color: colors.onPrimary, fontWeight: '700' },
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
    modalCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.text },
    dateBtn: {
      backgroundColor: colors.surfaceMuted,
      padding: 12,
      borderRadius: 10,
      marginBottom: 12,
    },
    dateBtnText: { fontWeight: '600', color: colors.text },
    label: { marginBottom: 8, color: colors.textSecondary },
    durRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.chip,
    },
    chipOn: { backgroundColor: colors.chipOn },
    chipText: { color: colors.textSecondary },
    chipTextOn: { color: colors.chipOnText, fontWeight: '700' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    cancel: { padding: 10 },
    cancelText: { color: colors.textSecondary },
    save: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    saveText: { color: colors.onPrimary, fontWeight: '600' },
    iosDone: { alignSelf: 'flex-end', paddingVertical: 8 },
    iosDoneText: { color: colors.link, fontWeight: '700' },
  });
}
