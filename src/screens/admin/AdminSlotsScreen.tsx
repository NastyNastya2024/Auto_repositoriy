import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WeekScheduleGrid } from '../../components/WeekScheduleGrid';
import { useApp } from '../../context/AppContext';
import type { Slot } from '../../types';
import { formatSlotDate } from '../../utils/format';
import { addWeeks, getBookingForSlot, startOfWeekMonday } from '../../utils/weekCalendar';

export function AdminSlotsScreen() {
  const { state, addSlot, addBlockedSlot, removeSlot, setBookingStatus, ensureFreeTemplateSlotsForWeek } =
    useApp();
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
    setWhen(new Date());
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
      <Text style={styles.lead}>
        Добавляйте свободные окна для записи или закрывайте время (выходной). На занятых слотах видны
        ученики.
      </Text>

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
                    if (Platform.OS === 'ios' && e.type === 'dismissed') setShowPicker(false);
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
                <Text>Отмена</Text>
              </Pressable>
              <Pressable
                style={styles.save}
                onPress={() => {
                  if (modalKind === 'free') addSlot(when, duration);
                  else addBlockedSlot(when, duration);
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' },
  content: { padding: 16, paddingBottom: 32 },
  lead: { fontSize: 13, color: '#4b5563', marginBottom: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
  addBtn: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  blockBtn: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#be185d',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  blockBtnText: { color: '#fff', fontWeight: '700' },
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
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  dateBtn: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  dateBtnText: { fontWeight: '600' },
  label: { marginBottom: 8, color: '#4b5563' },
  durRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  chipOn: { backgroundColor: '#dbeafe' },
  chipText: { color: '#374151' },
  chipTextOn: { color: '#1d4ed8', fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancel: { padding: 10 },
  save: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  saveText: { color: '#fff', fontWeight: '600' },
  iosDone: { alignSelf: 'flex-end', paddingVertical: 8 },
  iosDoneText: { color: '#2563eb', fontWeight: '700' },
});
