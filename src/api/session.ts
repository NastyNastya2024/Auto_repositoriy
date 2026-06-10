import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'autoschool-auth-token';

export async function loadAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveAuthToken(token: string | null): Promise<void> {
  if (!token) {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }
  await AsyncStorage.setItem(TOKEN_KEY, token);
}
