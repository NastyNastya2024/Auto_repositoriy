import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { tariffTypeLabel, useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { Tariff, TariffType } from '../../types';
import type { ThemeColors } from '../../theme';
import { createId } from '../../utils/id';
import { formatRub } from '../../utils/format';

const TYPES: TariffType[] = ['route', 'package', 'full', 'after_exam'];

export function AdminTariffsScreen() {
  const { state, upsertTariff, removeTariff } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tariff | null>(null);

  const openNew = () => {
    setEditing({
      id: createId(),
      name: '',
      description: '',
      type: 'route',
      priceRub: 0,
      active: true,
    });
    setOpen(true);
  };

  const openEdit = (t: Tariff) => {
    setEditing({ ...t });
    setOpen(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.addBtn} onPress={openNew}>
        <Text style={styles.addBtnText}>+ Новый тариф</Text>
      </Pressable>
      {state.tariffs.map((t) => (
        <View key={t.id} style={styles.card}>
          <Text style={styles.badge}>{tariffTypeLabel(t.type)}</Text>
          <Text style={styles.title}>{t.name}</Text>
          <Text style={styles.meta}>{formatRub(t.priceRub)} · {t.active ? 'активен' : 'выкл'}</Text>
          <View style={styles.row}>
            <Pressable style={styles.linkBtn} onPress={() => openEdit(t)}>
              <Text style={styles.linkBtnText}>Изменить</Text>
            </Pressable>
            <Pressable
              style={styles.danger}
              onPress={() =>
                Alert.alert('Удалить тариф?', t.name, [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Удалить', style: 'destructive', onPress: () => removeTariff(t.id) },
                ])
              }
            >
              <Text style={styles.dangerText}>Удалить</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing?.name ? 'Тариф' : 'Новый тариф'}</Text>
            {editing && (
              <>
                <Text style={styles.label}>Название</Text>
                <TextInput
                  style={styles.input}
                  value={editing.name}
                  onChangeText={(name) => setEditing({ ...editing, name })}
                />
                <Text style={styles.label}>Описание</Text>
                <TextInput
                  style={[styles.input, { minHeight: 72 }]}
                  multiline
                  value={editing.description}
                  onChangeText={(description) => setEditing({ ...editing, description })}
                />
                <Text style={styles.label}>Цена (₽)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={String(editing.priceRub)}
                  onChangeText={(v) => setEditing({ ...editing, priceRub: Number(v.replace(/\D/g, '')) || 0 })}
                />
                <Text style={styles.label}>Тип</Text>
                <View style={styles.typeRow}>
                  {TYPES.map((tp) => (
                    <Pressable
                      key={tp}
                      style={[styles.chip, editing.type === tp && styles.chipOn]}
                      onPress={() => setEditing({ ...editing, type: tp })}
                    >
                      <Text style={[styles.chipText, editing.type === tp && styles.chipTextOn]} numberOfLines={1}>
                        {tariffTypeLabel(tp)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.label}>Занятий (для пакета)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={editing.lessonsCount != null ? String(editing.lessonsCount) : ''}
                  onChangeText={(v) =>
                    setEditing({
                      ...editing,
                      lessonsCount: v ? Number(v) : undefined,
                    })
                  }
                />
                <Pressable
                  style={styles.toggle}
                  onPress={() => setEditing({ ...editing, active: !editing.active })}
                >
                  <Text style={styles.toggleText}>Активен: {editing.active ? 'да' : 'нет'}</Text>
                </Pressable>
                <View style={styles.modalActions}>
                  <Pressable style={styles.cancel} onPress={() => setOpen(false)}>
                    <Text style={styles.cancelText}>Закрыть</Text>
                  </Pressable>
                  <Pressable
                    style={styles.save}
                    onPress={() => {
                      upsertTariff(editing);
                      setOpen(false);
                    }}
                  >
                    <Text style={styles.saveText}>Сохранить</Text>
                  </Pressable>
                </View>
              </>
            )}
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
    addBtn: {
      backgroundColor: colors.surfaceMuted,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 14,
    },
    addBtnText: { color: colors.onPrimary, fontWeight: '700' },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badge: { fontSize: 12, color: colors.link, fontWeight: '600' },
    title: { fontSize: 16, fontWeight: '700', marginTop: 4, color: colors.text },
    meta: { marginTop: 4, color: colors.textMuted },
    row: { flexDirection: 'row', gap: 12, marginTop: 10 },
    linkBtn: { paddingVertical: 6 },
    linkBtnText: { color: colors.link, fontWeight: '600' },
    danger: { paddingVertical: 6 },
    dangerText: { color: colors.dangerText, fontWeight: '600' },
    modalBg: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: 12,
    },
    modalCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, maxHeight: '90%' },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: colors.text },
    label: { marginTop: 8, marginBottom: 4, color: colors.textSecondary, fontSize: 13 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.inputBg,
      color: colors.text,
    },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.chip,
      maxWidth: '48%',
    },
    chipOn: { backgroundColor: colors.chipOn },
    chipText: { fontSize: 12, color: colors.textSecondary },
    chipTextOn: { color: colors.chipOnText, fontWeight: '700' },
    toggle: { marginTop: 12, padding: 10, backgroundColor: colors.chip, borderRadius: 8 },
    toggleText: { fontWeight: '600', color: colors.text },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 14 },
    cancel: { padding: 10 },
    cancelText: { color: colors.textSecondary },
    save: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    saveText: { color: colors.onPrimary, fontWeight: '600' },
  });
}
