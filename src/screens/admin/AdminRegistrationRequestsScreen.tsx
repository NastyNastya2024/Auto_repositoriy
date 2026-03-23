import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';

export function AdminRegistrationRequestsScreen() {
  const { state, approveRegistrationRequest, deleteRegistrationRequest } = useApp();
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' },
  content: { padding: 16, paddingBottom: 32 },
  lead: { fontSize: 14, color: '#4b5563', marginBottom: 12, lineHeight: 20 },
  empty: { color: '#6b7280' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  login: { fontSize: 18, fontWeight: '700' },
  meta: { marginTop: 4, color: '#374151' },
  date: { marginTop: 6, fontSize: 12, color: '#9ca3af' },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  ok: { backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  okText: { color: '#fff', fontWeight: '600' },
  no: { borderWidth: 1, borderColor: '#fecaca', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  noText: { color: '#b91c1c', fontWeight: '600' },
});
