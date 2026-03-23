import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ADMIN_ID } from '../../data/seed';

export function AdminUsersScreen() {
  const { state, addUser, removeUser, toggleBlockUser } = useApp();
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const students = state.users.filter((u) => u.role === 'student');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>Новый ученик (вручную)</Text>
      <TextInput
        style={styles.input}
        placeholder="Имя"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Логин"
        value={login}
        onChangeText={setLogin}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Телефон"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Почта (необязательно)"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Pressable
        style={styles.addBtn}
        onPress={() => {
          const err = addUser({
            name: name || 'Ученик',
            login,
            password,
            phone: phone || undefined,
            email: email || undefined,
            role: 'student',
          });
          if (err) {
            Alert.alert('Ошибка', err);
            return;
          }
          setName('');
          setLogin('');
          setPassword('');
          setPhone('');
          setEmail('');
        }}
      >
        <Text style={styles.addBtnText}>Добавить учётную запись</Text>
      </Pressable>

      <Text style={[styles.section, { marginTop: 20 }]}>Ученики</Text>
      {students.map((u) => (
        <View key={u.id} style={styles.card}>
          <Text style={styles.name}>{u.name}</Text>
          <Text style={styles.meta}>Логин: {u.login}</Text>
          {u.phone && <Text style={styles.meta}>{u.phone}</Text>}
          {u.email && <Text style={styles.meta}>{u.email}</Text>}
          <Text style={styles.meta}>{u.blocked ? 'Заблокирован' : 'Активен'}</Text>
          <View style={styles.row}>
            <Pressable style={styles.small} onPress={() => toggleBlockUser(u.id)}>
              <Text style={styles.smallText}>{u.blocked ? 'Разблокировать' : 'Заблокировать'}</Text>
            </Pressable>
            {u.id !== ADMIN_ID && (
              <Pressable
                style={styles.danger}
                onPress={() =>
                  Alert.alert('Удалить пользователя?', u.name, [
                    { text: 'Отмена', style: 'cancel' },
                    { text: 'Удалить', style: 'destructive', onPress: () => removeUser(u.id) },
                  ])
                }
              >
                <Text style={styles.dangerText}>Удалить</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' },
  content: { padding: 16, paddingBottom: 32 },
  section: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  addBtn: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { marginTop: 4, color: '#6b7280' },
  row: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  small: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  smallText: { fontWeight: '600' },
  danger: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' },
  dangerText: { color: '#b91c1c', fontWeight: '600' },
});
