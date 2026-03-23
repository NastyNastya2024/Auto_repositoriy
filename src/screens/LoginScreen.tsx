import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';

export function LoginScreen() {
  const { login } = useApp();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Автошкола</Text>
      <Text style={styles.sub}>
        Локальное демо: данные только на этом устройстве. Без сервера нет синхронизации между
        учеником и админом на разных телефонах.
      </Text>
      <Pressable style={({ pressed }) => [styles.btn, pressed && styles.pressed]} onPress={() => login('student')}>
        <Text style={styles.btnText}>Войти как ученик</Text>
      </Pressable>
      <Pressable style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]} onPress={() => login('admin')}>
        <Text style={styles.btnTextDark}>Войти как администратор</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f6f7f9' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  sub: { fontSize: 14, color: '#5c6370', marginBottom: 28, lineHeight: 20 },
  btn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnSecondary: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  pressed: { opacity: 0.85 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnTextDark: { color: '#111827', fontSize: 16, fontWeight: '600' },
});
