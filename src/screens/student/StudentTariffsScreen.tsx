import { useMemo } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { tariffTypeLabel, useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme';
import { formatRub } from '../../utils/format';

function runAfterTariffRequestConfirm(name: string, onSend: () => void) {
  const message = `Отправить заявку на «${name}»? Администратор увидит её в разделе «Заявки».`;
  if (Platform.OS === 'web' && typeof globalThis !== 'undefined') {
    const win = globalThis as typeof globalThis & { confirm?: (m: string) => boolean };
    if (typeof win.confirm === 'function') {
      if (win.confirm(message)) onSend();
      return;
    }
  }
  Alert.alert('Заявка на тариф', message, [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Отправить', onPress: onSend },
  ]);
}

export function StudentTariffsScreen() {
  const { state, sessionUser, submitStudentTariffRequest } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tariffs = state.tariffs.filter((t) => t.active);
  const myPending = useMemo(() => {
    if (!sessionUser?.id) return undefined;
    return (state.studentTariffRequests ?? []).find((r) => r.studentId === sessionUser.id);
  }, [sessionUser?.id, state.studentTariffRequests]);
  const pendingTariff = myPending ? state.tariffs.find((t) => t.id === myPending.tariffId) : undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.lead}>
        Выберите тариф и отправьте заявку. Администратор закрепит тариф в вашем профиле — после этого
        можно записываться на занятия.
      </Text>
      {myPending ? (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingTitle}>Заявка отправлена</Text>
          <Text style={styles.pendingText}>
            Ожидает ответа:{' '}
            <Text style={styles.pendingEm}>
              {pendingTariff?.name ?? 'тариф (ждите проверки администратором)'}
            </Text>
            . Вы можете отправить заявку на другой тариф — прежняя будет заменена.
          </Text>
        </View>
      ) : null}
      <FlatList
        data={tariffs}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>Нет доступных тарифов. Обратитесь к администратору.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.badge}>{tariffTypeLabel(item.type)}</Text>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            {item.lessonsCount != null && (
              <Text style={styles.meta}>Занятий: {item.lessonsCount}</Text>
            )}
            {item.durationMin != null && (
              <Text style={styles.meta}>Длительность: {item.durationMin} мин</Text>
            )}
            <Text style={styles.price}>{formatRub(item.priceRub)}</Text>
            <Pressable
              style={styles.btn}
              onPress={() => {
                if (sessionUser?.blocked) {
                  Alert.alert('Недоступно', 'Аккаунт заблокирован.');
                  return;
                }
                if (!sessionUser) {
                  Alert.alert('Вход', 'Войдите в аккаунт под учеником, затем откройте раздел «Тарифы».');
                  return;
                }
                runAfterTariffRequestConfirm(item.name, () => {
                  const err = submitStudentTariffRequest(item.id);
                  if (err) {
                    Alert.alert('Заявка', err);
                    return;
                  }
                  Alert.alert('Готово', 'Заявка отправлена администратору.');
                });
              }}
            >
              <Text style={styles.btnText}>Отправить заявку</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: colors.bg },
    lead: { color: colors.textSecondary, marginBottom: 12, lineHeight: 20 },
    pendingBanner: {
      backgroundColor: colors.chip,
      borderRadius: 12,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pendingTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
    pendingText: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
    pendingEm: { fontWeight: '700', color: colors.text },
    empty: { color: colors.textMuted, lineHeight: 20, marginTop: 8 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badge: { fontSize: 12, color: colors.link, fontWeight: '600', marginBottom: 6 },
    title: { fontSize: 17, fontWeight: '700', color: colors.text },
    desc: { marginTop: 6, color: colors.textSecondary, lineHeight: 20 },
    meta: { marginTop: 4, color: colors.textMuted },
    price: { marginTop: 10, fontSize: 20, fontWeight: '700', color: colors.text },
    btn: {
      marginTop: 12,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    btnText: { color: colors.onPrimary, fontWeight: '600' },
  });
}
