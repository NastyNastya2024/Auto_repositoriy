import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState, RegistrationRequest, Tariff, User } from '../types';
import { ADMIN_ID, ADMIN_LOGIN, ADMIN_PASSWORD, initialState } from '../data/seed';

const KEY = 'driving-school-local-v3';
const LEGACY_KEY_V2 = 'driving-school-local-v2';

/** Подмешивает новые тарифы из seed; сохранённые по id поля остаются (цена и т.д. с правками пользователя). */
function mergeTariffsFromSeed(stored: unknown, seed: Tariff[]): Tariff[] {
  const list = Array.isArray(stored) ? (stored as Tariff[]) : [];
  const map = new Map(list.map((t) => [t.id, t]));
  return seed.map((t) => map.get(t.id) ?? t);
}

function migrateV1ToV2(raw: Record<string, unknown>): AppState {
  const oldUsers = (raw.users as Partial<User>[]) || [];
  const users: User[] = oldUsers.map((u) => {
    const id = String(u.id ?? '');
    const role = u.role === 'admin' ? 'admin' : 'student';
    if (id === ADMIN_ID || role === 'admin') {
      return {
        id: ADMIN_ID,
        login: ADMIN_LOGIN,
        password: ADMIN_PASSWORD,
        name: u.name || 'Администратор',
        role: 'admin',
        phone: u.phone,
        email: u.email,
        blocked: u.blocked,
      };
    }
    return {
      id: id || `user-${Math.random().toString(36).slice(2)}`,
      login: u.login || 'student',
      password: (u as User).password || 'student',
      name: u.name || 'Ученик',
      role: 'student',
      phone: u.phone,
      email: u.email,
      blocked: u.blocked,
    };
  });

  if (!users.some((u) => u.id === ADMIN_ID)) {
    users.unshift({
      id: ADMIN_ID,
      login: ADMIN_LOGIN,
      password: ADMIN_PASSWORD,
      name: 'Администратор',
      role: 'admin',
    });
  }

  return {
    version: 3,
    sessionUserId: (raw.sessionUserId as string | null) ?? null,
    users,
    registrationRequests: [] as RegistrationRequest[],
    slots: Array.isArray(raw.slots) ? raw.slots : initialState.slots,
    bookings: Array.isArray(raw.bookings) ? raw.bookings : [],
    tariffs: initialState.tariffs,
    messages: Array.isArray(raw.messages) ? raw.messages : [],
    payments: Array.isArray(raw.payments) ? raw.payments : [],
    pddProgress: Array.isArray(raw.pddProgress) ? raw.pddProgress : [],
  };
}

function normalize(raw: Record<string, unknown> | null): AppState {
  if (!raw) return { ...initialState };

  if (raw.version === 1) {
    return migrateV1ToV2(raw);
  }

  if (raw.version === 2) {
    const users = (raw.users as User[]) || initialState.users;
    const withLogin = users.map((u) => {
      if (u.login && u.password) return u;
      if (u.id === ADMIN_ID) {
        return { ...u, login: ADMIN_LOGIN, password: ADMIN_PASSWORD };
      }
      return {
        ...u,
        login: u.login || `user_${u.id.slice(-6)}`,
        password: u.password || 'changeme',
      };
    });
    return {
      version: 3,
      sessionUserId: (raw.sessionUserId as string | null) ?? null,
      users: withLogin,
      registrationRequests: Array.isArray(raw.registrationRequests)
        ? raw.registrationRequests
        : [],
      slots: Array.isArray(raw.slots) ? raw.slots : initialState.slots,
      bookings: Array.isArray(raw.bookings) ? raw.bookings : [],
      tariffs: initialState.tariffs,
      messages: Array.isArray(raw.messages) ? raw.messages : [],
      payments: Array.isArray(raw.payments) ? raw.payments : [],
      pddProgress: Array.isArray(raw.pddProgress) ? raw.pddProgress : [],
    };
  }

  if (raw.version === 3) {
    const users = (raw.users as User[]) || initialState.users;
    const withLogin = users.map((u) => {
      if (u.login && u.password) return u;
      if (u.id === ADMIN_ID) {
        return { ...u, login: ADMIN_LOGIN, password: ADMIN_PASSWORD };
      }
      return {
        ...u,
        login: u.login || `user_${u.id.slice(-6)}`,
        password: u.password || 'changeme',
      };
    });
    return {
      version: 3,
      sessionUserId: (raw.sessionUserId as string | null) ?? null,
      users: withLogin,
      registrationRequests: Array.isArray(raw.registrationRequests)
        ? raw.registrationRequests
        : [],
      slots: Array.isArray(raw.slots) ? raw.slots : initialState.slots,
      bookings: Array.isArray(raw.bookings) ? raw.bookings : [],
      tariffs: mergeTariffsFromSeed(raw.tariffs, initialState.tariffs),
      messages: Array.isArray(raw.messages) ? raw.messages : [],
      payments: Array.isArray(raw.payments) ? raw.payments : [],
      pddProgress: Array.isArray(raw.pddProgress) ? raw.pddProgress : [],
    };
  }

  return { ...initialState };
}

export async function loadState(): Promise<AppState> {
  try {
    let raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      raw = await AsyncStorage.getItem(LEGACY_KEY_V2);
      if (raw) {
        const parsed = normalize(JSON.parse(raw) as Record<string, unknown>);
        await AsyncStorage.setItem(KEY, JSON.stringify(parsed));
        await AsyncStorage.removeItem(LEGACY_KEY_V2);
        return parsed;
      }
    }
    if (!raw) {
      raw = await AsyncStorage.getItem('driving-school-local-v1');
      if (raw) {
        const parsed = normalize(JSON.parse(raw) as Record<string, unknown>);
        await AsyncStorage.setItem(KEY, JSON.stringify(parsed));
        await AsyncStorage.removeItem('driving-school-local-v1');
        return parsed;
      }
    }
    if (!raw) return { ...initialState };
    return normalize(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return { ...initialState };
  }
}

export async function saveState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}
