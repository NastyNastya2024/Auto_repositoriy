import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import { formatSlotDate } from '../../utils/format';

export function AdminSlotsScreen() {
  const { state, addSlot, removeSlot, updateSlotStatus } = useApp();
  const [modal, setModal] = useState(false);
  const [when, setWhen] = useState(new Date());
  const [duration, setDuration] = useState(90);
  const [showPicker, setShowPicker] = useState(false);

  const sorted = [...state.slots].sort((a, b) => a.startIso.localeCompare(b.startIso));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.addBtn} onPress={() => setModal(true)}>
        <Text style={styles.addBtnText}>+ Добавить слот</Text>
      </Pressable>

      {sorted.map((s) => (
        <View key={s.id} style={styles.card}>
          <Text style={styles.cardTitle}>{formatSlotDate(s.startIso)}</Text>
          <Text style={styles.meta}>{s.durationMin} мин · {s.status}</Text>
          <View style={styles.row}>
            {s.status === 'booked' && (
              <Pressable
                style={styles.smallBtn}
                onPress={() => updateSlotStatus(s.id, 'completed')}
              >
                <Text style={styles.smallBtnText}>Завершить</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.dangerOutline}
              onPress={() =>
                Alert.alert('Удалить слот?', 'Связанные записи будут сброшены из списка.', [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Удалить', style: 'destructive', onPress: () => removeSlot(s.id) },
                ])
              }
            >
              <Text style={styles.dangerText}>Удалить</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Новый слот</Text>
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
              {[60, 90, 120].map((m) => (
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
                  addSlot(when, duration);
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
  addBtn: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  meta: { marginTop: 4, color: '#6b7280' },
  row: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  smallBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallBtnText: { color: '#fff', fontWeight: '600' },
  dangerOutline: {
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dangerText: { color: '#b91c1c', fontWeight: '600' },
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
  durRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
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
