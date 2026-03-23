import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { ADMIN_LOGIN, ADMIN_PASSWORD } from '../data/seed';
import type { AuthStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { loginWithCredentials } = useApp();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = () => {
    const err = loginWithCredentials(login, password);
    if (err) Alert.alert('Вход', err);
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Автошкола</Text>
        <Text style={styles.sub}>
          Данные хранятся только на этом устройстве. Роль определяется учётной записью: админ или
          ученик.
        </Text>
        <Text style={styles.hint}>
          Демо-админ: логин «{ADMIN_LOGIN}», пароль «{ADMIN_PASSWORD}»
        </Text>

        <Text style={styles.label}>Логин</Text>
        <TextInput
          style={styles.input}
          value={login}
          onChangeText={setLogin}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Логин"
        />
        <Text style={styles.label}>Пароль</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Пароль"
        />

        <Pressable style={({ pressed }) => [styles.btn, pressed && styles.pressed]} onPress={onSubmit}>
          <Text style={styles.btnText}>Войти</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          onPress={() => navigation.navigate('RegisterRequest')}
        >
          <Text style={styles.btnTextDark}>Отправить заявку</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f6f7f9' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  sub: { fontSize: 14, color: '#5c6370', marginBottom: 12, lineHeight: 20 },
  hint: {
    fontSize: 13,
    color: '#2563eb',
    marginBottom: 20,
    lineHeight: 18,
    textAlign: 'center',
  },
  label: { fontSize: 13, color: '#4b5563', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
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
