import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import type { AuthStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'RegisterRequest'>;

function webAlert(message: string) {
  if (Platform.OS === 'web' && typeof globalThis !== 'undefined') {
    const win = globalThis as typeof globalThis & { alert?: (m: string) => void };
    if (typeof win.alert === 'function') {
      win.alert(message);
      return true;
    }
  }
  return false;
}

export function RegisterRequestScreen() {
  const navigation = useNavigation<Nav>();
  const { submitRegistrationRequest } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const onSubmit = () => {
    try {
      const err = submitRegistrationRequest({ login, password, phone, email });
      if (err) {
        if (!webAlert(`Заявка\n\n${err}`)) {
          Alert.alert('Заявка не отправлена', err);
        }
        return;
      }
      const okTitle = 'Заявка отправлена';
      const okBody =
        'Дождитесь подтверждения администратора, затем войдите с этим логином и паролем.';
      const goLogin = () => navigation.navigate('Login');
      if (!webAlert(`${okTitle}\n\n${okBody}`)) {
        Alert.alert(okTitle, okBody, [{ text: 'OK', onPress: goLogin }]);
      } else {
        goLogin();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось сохранить заявку';
      if (!webAlert(`Ошибка\n\n${msg}`)) {
        Alert.alert('Ошибка', msg);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>
          Заполните поля. После одобрения заявки вы сможете войти в приложение.
        </Text>
        <Text style={styles.label}>Логин</Text>
        <TextInput
          style={styles.input}
          value={login}
          onChangeText={setLogin}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Не короче 3 символов"
          placeholderTextColor={colors.placeholder}
        />
        <Text style={styles.label}>Пароль</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Не короче 4 символов"
          placeholderTextColor={colors.placeholder}
        />
        <Text style={styles.label}>Мобильный телефон</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+7 …"
          placeholderTextColor={colors.placeholder}
        />
        <Text style={styles.label}>Электронная почта</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="email@example.com"
          placeholderTextColor={colors.placeholder}
        />
        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]} onPress={onSubmit}>
          <Text style={styles.btnText}>Отправить заявку</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingBottom: 40 },
    lead: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
    label: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
    input: {
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 12,
      fontSize: 16,
      color: colors.text,
    },
    btn: {
      marginTop: 8,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    btnText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  });
}
