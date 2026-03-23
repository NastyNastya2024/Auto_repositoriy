import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ADMIN_ID, initialState } from '../data/seed';
import { loadState, saveState } from '../storage/persist';
import type {
  AppState,
  BookingStatus,
  Role,
  SlotStatus,
  Tariff,
  TariffType,
  User,
} from '../types';
import { normalizeLogin } from '../utils/auth';
import { createId } from '../utils/id';

type AppContextValue = {
  ready: boolean;
  state: AppState;
  sessionUser: User | null;
  adminUser: User | null;
  loginWithCredentials: (login: string, password: string) => string | null;
  logout: () => void;
  submitRegistrationRequest: (payload: {
    login: string;
    password: string;
    phone: string;
    email: string;
  }) => string | null;
  approveRegistrationRequest: (requestId: string) => void;
  deleteRegistrationRequest: (requestId: string) => void;
  addSlot: (start: Date, durationMin: number) => void;
  removeSlot: (slotId: string) => void;
  bookSlot: (slotId: string) => void;
  cancelBookingByStudent: (bookingId: string) => void;
  setBookingStatus: (bookingId: string, status: BookingStatus) => void;
  updateSlotStatus: (slotId: string, status: SlotStatus) => void;
  upsertTariff: (t: Tariff) => void;
  removeTariff: (tariffId: string) => void;
  addUser: (payload: {
    name: string;
    login: string;
    password: string;
    phone?: string;
    email?: string;
    role: Role;
  }) => string | null;
  removeUser: (userId: string) => void;
  toggleBlockUser: (userId: string) => void;
  sendMessage: (text: string, studentId?: string) => void;
  mockPayTariff: (tariffId: string) => void;
  savePddResult: (correct: number, total: number) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>({ ...initialState });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadState();
      if (!cancelled) {
        setState(loaded);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveState(state);
  }, [state, ready]);

  const sessionUser = useMemo(() => {
    if (!state.sessionUserId) return null;
    return state.users.find((u) => u.id === state.sessionUserId) ?? null;
  }, [state.sessionUserId, state.users]);

  const adminUser = useMemo(
    () => state.users.find((u) => u.role === 'admin' && u.id === ADMIN_ID) ?? state.users.find((u) => u.role === 'admin') ?? null,
    [state.users],
  );

  const loginWithCredentials = useCallback((login: string, password: string): string | null => {
    const l = normalizeLogin(login);
    if (!l || !password) return 'Введите логин и пароль';
    const u = state.users.find((x) => normalizeLogin(x.login) === l && x.password === password);
    if (!u) return 'Неверный логин или пароль';
    if (u.blocked) return 'Аккаунт заблокирован';
    setState((s) => ({ ...s, sessionUserId: u.id }));
    return null;
  }, [state.users]);

  const logout = useCallback(() => {
    setState((s) => ({ ...s, sessionUserId: null }));
  }, []);

  const submitRegistrationRequest = useCallback(
    (payload: { login: string; password: string; phone: string; email: string }): string | null => {
      const l = normalizeLogin(payload.login);
      const phone = payload.phone.trim();
      const email = payload.email.trim();
      if (l.length < 3) return 'Логин не короче 3 символов';
      if (payload.password.length < 4) return 'Пароль не короче 4 символов';
      if (!phone) return 'Укажите мобильный телефон';
      if (!email) return 'Укажите почту';

      let err: string | null = null;
      setState((s) => {
        if (s.users.some((u) => normalizeLogin(u.login) === l)) {
          err = 'Такой логин уже занят';
          return s;
        }
        if (s.registrationRequests.some((r) => normalizeLogin(r.login) === l)) {
          err = 'Заявка с таким логином уже отправлена';
          return s;
        }
        const req = {
          id: createId(),
          login: l,
          password: payload.password,
          phone,
          email,
          createdAt: new Date().toISOString(),
        };
        return { ...s, registrationRequests: [...s.registrationRequests, req] };
      });
      return err;
    },
    [],
  );

  const approveRegistrationRequest = useCallback((requestId: string) => {
    setState((s) => {
      const r = s.registrationRequests.find((x) => x.id === requestId);
      if (!r) return s;
      const l = normalizeLogin(r.login);
      if (s.users.some((u) => normalizeLogin(u.login) === l)) {
        return {
          ...s,
          registrationRequests: s.registrationRequests.filter((x) => x.id !== requestId),
        };
      }
      const user: User = {
        id: createId(),
        login: l,
        password: r.password,
        name: r.login,
        role: 'student',
        phone: r.phone,
        email: r.email,
      };
      return {
        ...s,
        users: [...s.users, user],
        registrationRequests: s.registrationRequests.filter((x) => x.id !== requestId),
      };
    });
  }, []);

  const deleteRegistrationRequest = useCallback((requestId: string) => {
    setState((s) => ({
      ...s,
      registrationRequests: s.registrationRequests.filter((x) => x.id !== requestId),
    }));
  }, []);

  const addSlot = useCallback((start: Date, durationMin: number) => {
    const slot = {
      id: createId(),
      startIso: start.toISOString(),
      durationMin,
      status: 'free' as const,
    };
    setState((s) => ({ ...s, slots: [...s.slots, slot] }));
  }, []);

  const removeSlot = useCallback((slotId: string) => {
    setState((s) => ({
      ...s,
      slots: s.slots.filter((x) => x.id !== slotId),
      bookings: s.bookings.filter((b) => b.slotId !== slotId),
    }));
  }, []);

  const bookSlot = useCallback(
    (slotId: string) => {
      const uid = state.sessionUserId;
      if (!uid) return;
      const user = state.users.find((u) => u.id === uid);
      if (!user || user.blocked || user.role !== 'student') return;

      setState((s) => {
        const slot = s.slots.find((x) => x.id === slotId);
        if (!slot || slot.status !== 'free') return s;
        const booking: (typeof s.bookings)[0] = {
          id: createId(),
          slotId,
          userId: uid,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        return {
          ...s,
          slots: s.slots.map((x) => (x.id === slotId ? { ...x, status: 'pending' as const } : x)),
          bookings: [...s.bookings, booking],
        };
      });
    },
    [state.sessionUserId, state.users],
  );

  const cancelBookingByStudent = useCallback(
    (bookingId: string) => {
      const uid = state.sessionUserId;
      if (!uid) return;
      setState((s) => {
        const b = s.bookings.find((x) => x.id === bookingId);
        if (!b || b.userId !== uid || b.status !== 'pending') return s;
        return {
          ...s,
          bookings: s.bookings.map((x) =>
            x.id === bookingId ? { ...x, status: 'cancelled' as const } : x,
          ),
          slots: s.slots.map((sl) =>
            sl.id === b.slotId ? { ...sl, status: 'free' as const } : sl,
          ),
        };
      });
    },
    [state.sessionUserId],
  );

  const setBookingStatus = useCallback((bookingId: string, status: BookingStatus) => {
    setState((s) => {
      const b = s.bookings.find((x) => x.id === bookingId);
      if (!b) return s;
      let slots = s.slots;
      if (status === 'booked') {
        slots = slots.map((sl) =>
          sl.id === b.slotId ? { ...sl, status: 'booked' as const } : sl,
        );
      }
      if (status === 'cancelled') {
        slots = slots.map((sl) =>
          sl.id === b.slotId ? { ...sl, status: 'free' as const } : sl,
        );
      }
      if (status === 'completed') {
        slots = slots.map((sl) =>
          sl.id === b.slotId ? { ...sl, status: 'completed' as const } : sl,
        );
      }
      return {
        ...s,
        bookings: s.bookings.map((x) => (x.id === bookingId ? { ...x, status } : x)),
        slots,
      };
    });
  }, []);

  const updateSlotStatus = useCallback((slotId: string, status: SlotStatus) => {
    setState((s) => ({
      ...s,
      slots: s.slots.map((sl) => (sl.id === slotId ? { ...sl, status } : sl)),
    }));
  }, []);

  const upsertTariff = useCallback((t: Tariff) => {
    setState((s) => {
      const idx = s.tariffs.findIndex((x) => x.id === t.id);
      if (idx === -1) return { ...s, tariffs: [...s.tariffs, t] };
      const copy = [...s.tariffs];
      copy[idx] = t;
      return { ...s, tariffs: copy };
    });
  }, []);

  const removeTariff = useCallback((tariffId: string) => {
    setState((s) => ({ ...s, tariffs: s.tariffs.filter((t) => t.id !== tariffId) }));
  }, []);

  const addUser = useCallback(
    (payload: {
      name: string;
      login: string;
      password: string;
      phone?: string;
      email?: string;
      role: Role;
    }): string | null => {
      const l = normalizeLogin(payload.login);
      if (l.length < 3) return 'Логин не короче 3 символов';
      if (payload.password.length < 4) return 'Пароль не короче 4 символов';
      let err: string | null = null;
      setState((s) => {
        if (s.users.some((u) => normalizeLogin(u.login) === l)) {
          err = 'Такой логин уже занят';
          return s;
        }
        const u: User = {
          id: createId(),
          login: l,
          password: payload.password,
          name: payload.name.trim() || 'Без имени',
          role: payload.role,
          phone: payload.phone?.trim() || undefined,
          email: payload.email?.trim() || undefined,
        };
        return { ...s, users: [...s.users, u] };
      });
      return err;
    },
    [],
  );

  const removeUser = useCallback((userId: string) => {
    if (userId === ADMIN_ID) return;
    setState((s) => ({
      ...s,
      users: s.users.filter((u) => u.id !== userId),
      bookings: s.bookings.filter((b) => b.userId !== userId),
      messages: s.messages.filter((m) => m.studentId !== userId),
      payments: s.payments.filter((p) => p.userId !== userId),
    }));
  }, []);

  const toggleBlockUser = useCallback((userId: string) => {
    if (userId === ADMIN_ID) return;
    setState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === userId ? { ...u, blocked: !u.blocked } : u,
      ),
    }));
  }, []);

  const sendMessage = useCallback(
    (text: string, studentId?: string) => {
      const trimmed = text.trim();
      if (!trimmed || !state.sessionUserId) return;
      const sid = state.sessionUserId;
      const user = state.users.find((u) => u.id === sid);
      if (!user || user.blocked) return;

      let targetStudentId = studentId;
      if (user.role === 'student') {
        targetStudentId = sid;
      }
      if (user.role === 'admin' && !targetStudentId) return;

      const stId = user.role === 'student' ? sid : (targetStudentId as string);

      const msg = {
        id: createId(),
        studentId: stId,
        senderId: sid,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, messages: [...s.messages, msg] }));
    },
    [state.sessionUserId, state.users],
  );

  const mockPayTariff = useCallback(
    (tariffId: string) => {
      const uid = state.sessionUserId;
      if (!uid) return;
      const pay = {
        id: createId(),
        userId: uid,
        tariffId,
        status: 'paid' as const,
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, payments: [...s.payments, pay] }));
    },
    [state.sessionUserId],
  );

  const savePddResult = useCallback(
    (correct: number, total: number) => {
      const uid = state.sessionUserId;
      if (!uid) return;
      setState((s) => {
        const rest = s.pddProgress.filter((p) => p.userId !== uid);
        return {
          ...s,
          pddProgress: [
            ...rest,
            {
              userId: uid,
              lastScore: correct,
              lastTotal: total,
              updatedAt: new Date().toISOString(),
            },
          ],
        };
      });
    },
    [state.sessionUserId],
  );

  const value = useMemo(
    () => ({
      ready,
      state,
      sessionUser,
      adminUser,
      loginWithCredentials,
      logout,
      submitRegistrationRequest,
      approveRegistrationRequest,
      deleteRegistrationRequest,
      addSlot,
      removeSlot,
      bookSlot,
      cancelBookingByStudent,
      setBookingStatus,
      updateSlotStatus,
      upsertTariff,
      removeTariff,
      addUser,
      removeUser,
      toggleBlockUser,
      sendMessage,
      mockPayTariff,
      savePddResult,
    }),
    [
      ready,
      state,
      sessionUser,
      adminUser,
      loginWithCredentials,
      logout,
      submitRegistrationRequest,
      approveRegistrationRequest,
      deleteRegistrationRequest,
      addSlot,
      removeSlot,
      bookSlot,
      cancelBookingByStudent,
      setBookingStatus,
      updateSlotStatus,
      upsertTariff,
      removeTariff,
      addUser,
      removeUser,
      toggleBlockUser,
      sendMessage,
      mockPayTariff,
      savePddResult,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp outside AppProvider');
  return ctx;
}

export function tariffTypeLabel(type: TariffType): string {
  switch (type) {
    case 'route':
      return 'Разовый маршрут';
    case 'package':
      return 'Пакет занятий';
    case 'full':
      return 'Полный пакет';
    case 'after_exam':
      return 'После сдачи';
    default:
      return type;
  }
}
