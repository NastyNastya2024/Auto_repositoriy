import { useLayoutEffect, useMemo, useState } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { ADMIN_LOGIN, ADMIN_PASSWORD } from '../data/seed';
import type { AuthStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { loginWithCredentials } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('HomeMain');
            }
          }}
          hitSlop={12}
          style={{
            marginLeft: Platform.OS === 'ios' ? 12 : 16,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: colors.link, fontSize: 17, fontWeight: '600' }}>Назад</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors.link]);

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
          placeholderTextColor={colors.placeholder}
        />
        <Text style={styles.label}>Пароль</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Пароль"
          placeholderTextColor={colors.placeholder}
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    inner: { flex: 1, padding: 24, justifyContent: 'center' },
    title: { fontSize: 26, fontWeight: '700', marginBottom: 12, textAlign: 'center', color: colors.text },
    sub: { fontSize: 14, color: colors.textSecondary, marginBottom: 12, lineHeight: 20 },
    hint: {
      fontSize: 13,
      color: colors.link,
      marginBottom: 20,
      lineHeight: 18,
      textAlign: 'center',
    },
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
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    btnSecondary: {
      backgroundColor: colors.surface,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.85 },
    btnText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
    btnTextDark: { color: colors.text, fontSize: 16, fontWeight: '600' },
  });
}
