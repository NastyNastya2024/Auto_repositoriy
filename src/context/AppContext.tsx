import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { ADMIN_ID, initialState } from '../data/seed';
import { loadState, saveState } from '../storage/persist';
import type {
  AppState,
  BookingStatus,
  Role,
  Slot,
  SlotStatus,
  Tariff,
  TariffType,
  User,
} from '../types';
import { normalizeLogin } from '../utils/auth';
import { createId } from '../utils/id';
import { buildStudentBookLessonState } from '../utils/studentBooking';
import {
  TEMPLATE_SLOT_DURATION_MIN,
  getTemplateSlotStartsForDay,
  getWeekDayDates,
  slotOverlapsTimeRange,
  startOfWeekMonday,
} from '../utils/weekCalendar';

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
  /** Ученик: заявка на тариф (попадает в «Заявки» админа) */
  submitStudentTariffRequest: (tariffId: string) => string | null;
  approveStudentTariffRequest: (requestId: string) => void;
  deleteStudentTariffRequest: (requestId: string) => void;
  addSlot: (start: Date, durationMin: number) => void;
  /** Админ: перекрыть время (недоступно для записи) */
  addBlockedSlot: (start: Date, durationMin: number) => void;
  removeSlot: (slotId: string) => void;
  /**
   * Ученик: запись с выбором даты, времени и длительности (11:00–21:30, шаг как в сетке).
   * onSuccess — после успешного применения состояния (закрыть модалку и т.д.).
   */
  bookLessonSlot: (start: Date, durationMin: number, onSuccess?: () => void) => void;
  cancelBookingByStudent: (bookingId: string) => void;
  /** Ученик: отметить / снять отметку «оплатил» по своей записи */
  setBookingStudentPaid: (bookingId: string, paid: boolean) => void;
  /** Админ: комментарий к ученику */
  setStudentAdminNote: (studentId: string, note: string) => void;
  /** Админ: закрепить тариф за учеником (undefined — снять) */
  setStudentAssignedTariff: (studentId: string, tariffId: string | undefined) => void;
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
    /** Обязателен для роли student */
    assignedTariffId?: string;
  }) => string | null;
  removeUser: (userId: string) => void;
  toggleBlockUser: (userId: string) => void;
  sendMessage: (text: string, studentId?: string) => void;
  /** Создать недостающие свободные слоты 11:00–21:30 (90 мин) на выбранной неделе */
  ensureFreeTemplateSlotsForWeek: (weekStartMonday: Date) => void;
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
        const regs = s.registrationRequests ?? [];
        if (s.users.some((u) => normalizeLogin(u.login) === l)) {
          err = 'Такой логин уже занят';
          return s;
        }
        if (regs.some((r) => normalizeLogin(r.login) === l)) {
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
        return { ...s, registrationRequests: [...regs, req] };
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

  const submitStudentTariffRequest = useCallback((tariffId: string): string | null => {
    let err: string | null = null;
    setState((s) => {
      const reqs = s.studentTariffRequests ?? [];
      const uid = s.sessionUserId;
      if (!uid) {
        err = 'Войдите в аккаунт';
        return s;
      }
      const user = s.users.find((u) => u.id === uid);
      if (!user || user.role !== 'student') {
        err = 'Доступно только ученикам';
        return s;
      }
      if (user.blocked) {
        err = 'Аккаунт заблокирован';
        return s;
      }
      const t = s.tariffs.find((x) => x.id === tariffId);
      if (!t?.active) {
        err = 'Тариф недоступен';
        return s;
      }
      const existingForStudent = reqs.find((r) => r.studentId === uid);
      if (existingForStudent?.tariffId === tariffId) {
        err = 'Эта заявка уже у администратора. Дождитесь ответа или выберите другой тариф.';
        return s;
      }
      const req = {
        id: createId(),
        studentId: uid,
        tariffId,
        createdAt: new Date().toISOString(),
      };
      const withoutThisStudent = reqs.filter((r) => r.studentId !== uid);
      return { ...s, studentTariffRequests: [...withoutThisStudent, req] };
    });
    return err;
  }, []);

  const approveStudentTariffRequest = useCallback((requestId: string) => {
    setState((s) => {
      const reqs = s.studentTariffRequests ?? [];
      const r = reqs.find((x) => x.id === requestId);
      if (!r) return s;
      const t = s.tariffs.find((x) => x.id === r.tariffId);
      if (!t?.active) return s;
      const student = s.users.find((u) => u.id === r.studentId);
      if (!student || student.role !== 'student') {
        return { ...s, studentTariffRequests: reqs.filter((x) => x.id !== requestId) };
      }
      return {
        ...s,
        users: s.users.map((u) =>
          u.id === r.studentId ? { ...u, assignedTariffId: r.tariffId } : u,
        ),
        studentTariffRequests: reqs.filter((x) => x.id !== requestId),
      };
    });
  }, []);

  const deleteStudentTariffRequest = useCallback((requestId: string) => {
    setState((s) => ({
      ...s,
      studentTariffRequests: (s.studentTariffRequests ?? []).filter((x) => x.id !== requestId),
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

  const addBlockedSlot = useCallback((start: Date, durationMin: number) => {
    const slot = {
      id: createId(),
      startIso: start.toISOString(),
      durationMin,
      status: 'blocked' as const,
    };
    setState((s) => ({ ...s, slots: [...s.slots, slot] }));
  }, []);

  const ensureFreeTemplateSlotsForWeek = useCallback((weekStartMonday: Date) => {
    const ws = startOfWeekMonday(new Date(weekStartMonday));
    const days = getWeekDayDates(ws);
    setState((s) => {
      const toAdd: Slot[] = [];
      for (const day of days) {
        for (const start of getTemplateSlotStartsForDay(day)) {
          const tEnd = new Date(start.getTime() + TEMPLATE_SLOT_DURATION_MIN * 60_000);
          if (s.slots.some((slot) => slotOverlapsTimeRange(slot, start, tEnd))) continue;
          toAdd.push({
            id: createId(),
            startIso: start.toISOString(),
            durationMin: TEMPLATE_SLOT_DURATION_MIN,
            status: 'free',
          });
        }
      }
      if (toAdd.length === 0) return s;
      return { ...s, slots: [...s.slots, ...toAdd] };
    });
  }, []);

  const removeSlot = useCallback((slotId: string) => {
    setState((s) => ({
      ...s,
      slots: s.slots.filter((x) => x.id !== slotId),
      bookings: s.bookings.filter((b) => b.slotId !== slotId),
    }));
  }, []);

  const bookLessonSlot = useCallback(
    (rawStart: Date, durationMin: number, onSuccess?: () => void) => {
      setState((s) => {
        const r = buildStudentBookLessonState(s, rawStart, durationMin);
        if (!r.ok) {
          queueMicrotask(() => Alert.alert('Запись', r.message));
          return s;
        }
        if (onSuccess) queueMicrotask(onSuccess);
        return r.next;
      });
    },
    [],
  );

  const cancelBookingByStudent = useCallback((bookingId: string) => {
    setState((s) => {
      const uid = s.sessionUserId;
      if (!uid) return s;
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
  }, []);

  const setBookingStudentPaid = useCallback((bookingId: string, paid: boolean) => {
    setState((s) => {
      const uid = s.sessionUserId;
      if (!uid) return s;
      const b = s.bookings.find((x) => x.id === bookingId);
      if (!b || b.userId !== uid) return s;
      if (b.status === 'cancelled') return s;
      return {
        ...s,
        bookings: s.bookings.map((x) =>
          x.id === bookingId ? { ...x, studentMarkedPaid: paid } : x,
        ),
      };
    });
  }, []);

  const setStudentAdminNote = useCallback((studentId: string, note: string) => {
    setState((s) => {
      const target = s.users.find((u) => u.id === studentId);
      if (!target || target.role !== 'student') return s;
      return {
        ...s,
        users: s.users.map((u) => (u.id === studentId ? { ...u, adminNote: note } : u)),
      };
    });
  }, []);

  const setStudentAssignedTariff = useCallback(
    (studentId: string, tariffId: string | undefined) => {
      setState((s) => {
        const target = s.users.find((u) => u.id === studentId);
        if (!target || target.role !== 'student') return s;
        if (tariffId !== undefined) {
          const t = s.tariffs.find((x) => x.id === tariffId);
          if (!t?.active) return s;
        }
        return {
          ...s,
          users: s.users.map((u) =>
            u.id === studentId ? { ...u, assignedTariffId: tariffId } : u,
          ),
        };
      });
    },
    [],
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
      assignedTariffId?: string;
    }): string | null => {
      const l = normalizeLogin(payload.login);
      if (l.length < 3) return 'Логин не короче 3 символов';
      if (payload.password.length < 4) return 'Пароль не короче 4 символов';
      if (payload.role === 'student') {
        if (!payload.assignedTariffId) return 'Выберите тариф для ученика';
      }
      let err: string | null = null;
      setState((s) => {
        if (s.users.some((u) => normalizeLogin(u.login) === l)) {
          err = 'Такой логин уже занят';
          return s;
        }
        if (payload.role === 'student' && payload.assignedTariffId) {
          const t = s.tariffs.find((x) => x.id === payload.assignedTariffId);
          if (!t?.active) {
            err = 'Тариф недоступен';
            return s;
          }
        }
        const u: User = {
          id: createId(),
          login: l,
          password: payload.password,
          name: payload.name.trim() || 'Без имени',
          role: payload.role,
          phone: payload.phone?.trim() || undefined,
          email: payload.email?.trim() || undefined,
          assignedTariffId:
            payload.role === 'student' ? payload.assignedTariffId : undefined,
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
      studentTariffRequests: (s.studentTariffRequests ?? []).filter((r) => r.studentId !== userId),
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
      submitStudentTariffRequest,
      approveStudentTariffRequest,
      deleteStudentTariffRequest,
      addSlot,
      addBlockedSlot,
      removeSlot,
      bookLessonSlot,
      cancelBookingByStudent,
      setBookingStudentPaid,
      setStudentAdminNote,
      setStudentAssignedTariff,
      setBookingStatus,
      updateSlotStatus,
      upsertTariff,
      removeTariff,
      addUser,
      removeUser,
      toggleBlockUser,
      sendMessage,
      ensureFreeTemplateSlotsForWeek,
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
      submitStudentTariffRequest,
      approveStudentTariffRequest,
      deleteStudentTariffRequest,
      addSlot,
      addBlockedSlot,
      removeSlot,
      bookLessonSlot,
      cancelBookingByStudent,
      setBookingStudentPaid,
      setStudentAdminNote,
      setStudentAssignedTariff,
      setBookingStatus,
      updateSlotStatus,
      upsertTariff,
      removeTariff,
      addUser,
      removeUser,
      toggleBlockUser,
      sendMessage,
      ensureFreeTemplateSlotsForWeek,
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
    case 'trial':
      return 'Пробное занятие';
    case 'route':
      return 'Кастомный маршрут';
    case 'package':
      return 'Пакет занятий';
    case 'full':
      return 'Полный пакет';
    case 'after_exam':
      return 'Занятие после сдачи';
    default:
      return type;
  }
}
