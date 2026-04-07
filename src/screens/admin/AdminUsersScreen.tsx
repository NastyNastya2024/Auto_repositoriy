import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { ADMIN_ID } from '../../data/seed';
import type { ThemeColors } from '../../theme';

export function AdminUsersScreen() {
  const { state, addUser, removeUser, toggleBlockUser } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        placeholderTextColor={colors.placeholder}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Логин"
        placeholderTextColor={colors.placeholder}
        value={login}
        onChangeText={setLogin}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        placeholderTextColor={colors.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Телефон"
        placeholderTextColor={colors.placeholder}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Почта (необязательно)"
        placeholderTextColor={colors.placeholder}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Pressable
        style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
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
          <Text style={styles.meta}>Пароль: {u.password}</Text>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    section: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: colors.text },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      backgroundColor: colors.inputBg,
      color: colors.text,
    },
    addBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 8,
    },
    addBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    name: { fontSize: 16, fontWeight: '700', color: colors.text },
    meta: { marginTop: 4, color: colors.textMuted },
    row: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
    small: { backgroundColor: colors.chip, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    smallText: { fontWeight: '600', color: colors.text },
    danger: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
    },
    dangerText: { color: colors.dangerText, fontWeight: '600' },
  });
}
