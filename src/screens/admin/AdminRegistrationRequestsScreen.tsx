import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme';

export function AdminRegistrationRequestsScreen() {
  const { state, approveRegistrationRequest, deleteRegistrationRequest } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const list = [...state.registrationRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Новые пользователи не могут войти, пока вы не подтвердите заявку. Отклонение — удаление заявки.
      </Text>
      {list.length === 0 && <Text style={styles.empty}>Нет входящих заявок</Text>}
      {list.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.login}>{r.login}</Text>
          <Text style={styles.meta}>{r.phone}</Text>
          <Text style={styles.meta}>{r.email}</Text>
          <Text style={styles.date}>
            {new Date(r.createdAt).toLocaleString('ru-RU')}
          </Text>
          <View style={styles.row}>
            <Pressable
              style={styles.ok}
              onPress={() =>
                Alert.alert('Подтвердить заявку?', `Создать учётную запись для «${r.login}»?`, [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Подтвердить', onPress: () => approveRegistrationRequest(r.id) },
                ])
              }
            >
              <Text style={styles.okText}>Подтвердить</Text>
            </Pressable>
            <Pressable
              style={styles.no}
              onPress={() =>
                Alert.alert('Удалить заявку?', undefined, [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Удалить', style: 'destructive', onPress: () => deleteRegistrationRequest(r.id) },
                ])
              }
            >
              <Text style={styles.noText}>Удалить</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    lead: { fontSize: 14, color: colors.textSecondary, marginBottom: 12, lineHeight: 20 },
    empty: { color: colors.textMuted },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    login: { fontSize: 18, fontWeight: '700', color: colors.text },
    meta: { marginTop: 4, color: colors.textSecondary },
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
