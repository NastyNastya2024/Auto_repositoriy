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
      headerTitle: '',
      headerRight: () => (
        <View style={{ marginRight: Platform.OS === 'ios' ? 12 : 16, paddingVertical: 6 }}>
          <Text style={{ color: colors.link, fontSize: 17, fontWeight: '600' }}>Вход</Text>
        </View>
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
        <Text style={styles.title}>Авторизация</Text>
        <Text style={styles.sub}>
          Данные хранятся только на этом устройстве. Роль определяется учётной записью: админ или
          ученик.
        </Text>

        <TextInput
          style={styles.input}
          value={login}
          onChangeText={setLogin}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Логин"
          placeholderTextColor={colors.placeholder}
          textAlign="center"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Пароль"
          placeholderTextColor={colors.placeholder}
          textAlign="center"
        />

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.btn, styles.actionHalf, pressed && styles.pressed]}
            onPress={onSubmit}
          >
            <Text style={styles.btnText}>Войти</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.btnSecondary, styles.actionHalf, pressed && styles.pressed]}
            onPress={() => navigation.navigate('RegisterRequest')}
          >
            <Text style={styles.btnTextDark}>Отправить заявку</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    inner: { flex: 1, padding: 24, paddingHorizontal: 28, justifyContent: 'center', maxWidth: 440, width: '100%', alignSelf: 'center' },
    title: { fontSize: 26, fontWeight: '700', marginBottom: 14, textAlign: 'center', color: colors.text, letterSpacing: -0.3 },
    sub: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 24,
      lineHeight: 20,
      textAlign: 'center',
    },
    input: {
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      marginBottom: 14,
      fontSize: 16,
      color: colors.text,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 2,
    },
    actionHalf: {
      flex: 1,
      marginBottom: 0,
    },
    btn: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    btnSecondary: {
      backgroundColor: colors.surface,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    pressed: { opacity: 0.85 },
    btnText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
    btnTextDark: { color: colors.link, fontSize: 16, fontWeight: '600' },
  });
}
