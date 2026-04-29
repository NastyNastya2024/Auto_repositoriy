import { useMemo } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme';

function confirmWeb(message: string): boolean {
  if (Platform.OS !== 'web' || typeof globalThis === 'undefined') return false;
  const win = globalThis as typeof globalThis & { confirm?: (m: string) => boolean };
  if (typeof win.confirm !== 'function') return false;
  return win.confirm(message);
}

export function AdminRegistrationRequestsScreen() {
  const {
    state,
    approveRegistrationRequest,
    deleteRegistrationRequest,
    approveStudentTariffRequest,
    deleteStudentTariffRequest,
  } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const regList = [...state.registrationRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const tariffReqList = [...state.studentTariffRequests].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Здесь заявки на регистрацию и на тариф. Новые пользователи не могут войти, пока вы не подтвердите
        регистрацию. Заявку на тариф можно подтвердить — тогда тариф закрепится за учеником.
      </Text>

      <Text style={styles.sectionTitle}>Регистрация</Text>
      {regList.length === 0 && <Text style={styles.empty}>Нет заявок на регистрацию</Text>}
      {regList.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.kind}>Новый пользователь</Text>
          <Text style={styles.login}>{r.login}</Text>
          <Text style={styles.meta}>{r.phone}</Text>
          <Text style={styles.meta}>{r.email}</Text>
          <Text style={styles.date}>{new Date(r.createdAt).toLocaleString('ru-RU')}</Text>
          <View style={styles.row}>
            <Pressable
              style={styles.ok}
              onPress={() => {
                const message = `Подтвердить заявку?\nСоздать учётную запись для «${r.login}»?`;
                if (confirmWeb(message)) {
                  approveRegistrationRequest(r.id);
                  return;
                }
                Alert.alert('Подтвердить заявку?', `Создать учётную запись для «${r.login}»?`, [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Подтвердить', onPress: () => approveRegistrationRequest(r.id) },
                ]);
              }}
            >
              <Text style={styles.okText}>Подтвердить</Text>
            </Pressable>
            <Pressable
              style={styles.no}
              onPress={() => {
                const message = `Удалить заявку «${r.login}»?`;
                if (confirmWeb(message)) {
                  deleteRegistrationRequest(r.id);
                  return;
                }
                Alert.alert('Удалить заявку?', undefined, [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Удалить', style: 'destructive', onPress: () => deleteRegistrationRequest(r.id) },
                ]);
              }}
            >
              <Text style={styles.noText}>Удалить</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Заявки на тариф</Text>
      {tariffReqList.length === 0 && <Text style={styles.empty}>Нет заявок на тариф</Text>}
      {tariffReqList.map((req) => {
        const student = state.users.find((u) => u.id === req.studentId);
        const tariff = state.tariffs.find((t) => t.id === req.tariffId);
        const nameLine = student?.name?.trim() || 'Ученик';
        const loginLine = student ? student.login : req.studentId;
        return (
          <View key={req.id} style={styles.card}>
            <Text style={styles.kind}>Тариф</Text>
            <Text style={styles.login}>{nameLine}</Text>
            <Text style={styles.meta}>@{loginLine}</Text>
            <Text style={styles.tariffName}>{tariff?.name ?? 'Тариф удалён'}</Text>
            <Text style={styles.date}>{new Date(req.createdAt).toLocaleString('ru-RU')}</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.ok}
                onPress={() => {
                  if (!tariff?.active) {
                    Alert.alert(
                      'Нельзя подтвердить',
                      'Тариф снят с витрины или удалён. Сначала включите тариф или удалите заявку.',
                    );
                    return;
                  }
                  const message = `Закрепить тариф?\nНазначить ученику «${nameLine}» тариф «${tariff.name}»?`;
                  if (confirmWeb(message)) {
                    approveStudentTariffRequest(req.id);
                    return;
                  }
                  Alert.alert('Закрепить тариф?', `Назначить ученику «${nameLine}» тариф «${tariff.name}»?`, [
                    { text: 'Отмена', style: 'cancel' },
                    { text: 'Назначить', onPress: () => approveStudentTariffRequest(req.id) },
                  ]);
                }}
              >
                <Text style={styles.okText}>Назначить тариф</Text>
              </Pressable>
              <Pressable
                style={styles.no}
                onPress={() => {
                  const message = `Отклонить заявку на тариф?`;
                  if (confirmWeb(message)) {
                    deleteStudentTariffRequest(req.id);
                    return;
                  }
                  Alert.alert('Отклонить заявку?', undefined, [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Отклонить',
                      style: 'destructive',
                      onPress: () => deleteStudentTariffRequest(req.id),
                    },
                  ]);
                }}
              >
                <Text style={styles.noText}>Отклонить</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    lead: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
    sectionTitleSpaced: { marginTop: 8 },
    empty: { color: colors.textMuted, marginBottom: 12 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    kind: { fontSize: 12, fontWeight: '600', color: colors.link, marginBottom: 6 },
    login: { fontSize: 18, fontWeight: '700', color: colors.text },
    meta: { marginTop: 4, color: colors.textSecondary },
    tariffName: { marginTop: 8, fontSize: 16, fontWeight: '600', color: colors.text },
    date: { marginTop: 6, fontSize: 12, color: colors.textMuted },
    row: { flexDirection: 'row', gap: 10, marginTop: 12 },
    ok: { backgroundColor: colors.success, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
    okText: { color: colors.onPrimary, fontWeight: '600' },
    no: {
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
    },
    noText: { color: colors.dangerText, fontWeight: '600' },
  });
}
