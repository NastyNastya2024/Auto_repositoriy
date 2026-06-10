import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, AppState as RNAppState, Platform } from 'react-native';
import { ApiError, fetchState, loginRequest, postAction } from '../api/client';
import { saveAuthToken, loadAuthToken } from '../api/session';
import { ADMIN_ID } from '../data/seed';
import type {
  AppState,
  BookingStatus,
  Role,
  SlotStatus,
  Tariff,
  TariffType,
  User,
} from '../types';

type AppContextValue = {
  ready: boolean;
  state: AppState;
  sessionUser: User | null;
  adminUser: User | null;
  loginWithCredentials: (login: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  submitRegistrationRequest: (payload: {
    login: string;
    password: string;
    phone: string;
    email: string;
  }) => Promise<string | null>;
  approveRegistrationRequest: (requestId: string) => void;
  deleteRegistrationRequest: (requestId: string) => void;
  submitStudentTariffRequest: (tariffId: string) => Promise<string | null>;
  approveStudentTariffRequest: (requestId: string) => void;
  deleteStudentTariffRequest: (requestId: string) => void;
  addSlot: (start: Date, durationMin: number) => void;
  addBlockedSlot: (start: Date, durationMin: number) => void;
  removeSlot: (slotId: string) => void;
  bookLessonSlot: (start: Date, durationMin: number, onSuccess?: () => void) => void;
  adminBookStudentSlot: (
    studentId: string,
    start: Date,
    durationMin: number,
    onSuccess?: () => void,
    cancelBookingId?: string,
  ) => void;
  cancelBookingByStudent: (bookingId: string) => void;
  setBookingStudentPaid: (bookingId: string, paid: boolean) => void;
  setStudentAdminNote: (studentId: string, note: string) => void;
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
    assignedTariffId?: string;
  }) => Promise<string | null>;
  removeUser: (userId: string) => void;
  toggleBlockUser: (userId: string) => void;
  sendMessage: (text: string, studentId?: string) => void;
  ensureFreeTemplateSlotsForWeek: (weekStartMonday: Date) => void;
  refreshFromServer: () => Promise<void>;
  serverOnline: boolean;
  pendingAdminRequestsCount: number;
  pendingBookingsCount: number;
};

const AppContext = createContext<AppContextValue | null>(null);

const emptyState = (): AppState => ({
  version: 3,
  sessionUserId: null,
  users: [],
  registrationRequests: [],
  studentTariffRequests: [],
  slots: [],
  bookings: [],
  tariffs: [],
  messages: [],
  payments: [],
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);
  const [state, setState] = useState<AppState>(emptyState());
  const stateRef = useRef(state);
  stateRef.current = state;

  const showServerError = useCallback((message: string) => {
    Alert.alert('Ошибка', message);
  }, []);

  const applyState = useCallback((next: AppState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const dispatch = useCallback(
    async (action: string, payload?: Record<string, unknown>): Promise<string | null> => {
      try {
        const result = await postAction(action, payload);
        if (result.token) await saveAuthToken(result.token);
        applyState(result.state);
        setServerOnline(true);
        return null;
      } catch (e) {
        if (e instanceof ApiError) return e.message;
        return 'Сервер недоступен. Проверьте подключение к интернету.';
      }
    },
    [applyState],
  );

  const dispatchVoid = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      void dispatch(action, payload).then((err) => {
        if (err) showServerError(err);
      });
    },
    [dispatch, showServerError],
  );

  const refreshFromServer = useCallback(async () => {
    try {
      const remote = await fetchState();
      applyState(remote);
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    }
  }, [applyState]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadAuthToken();
        const remote = await fetchState();
        if (!cancelled) {
          applyState(remote);
          setServerOnline(true);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          applyState(emptyState());
          setServerOnline(false);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyState]);

  useEffect(() => {
    if (!ready) return;

    const onResume = () => {
      void refreshFromServer();
    };

    const sub = RNAppState.addEventListener('change', (next) => {
      if (next === 'active') onResume();
    });

    const poll = setInterval(() => {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        if (document.visibilityState !== 'visible') return;
      }
      void refreshFromServer();
    }, 5_000);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const onVisible = () => {
        if (document.visibilityState === 'visible') onResume();
      };
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        sub.remove();
        document.removeEventListener('visibilitychange', onVisible);
        clearInterval(poll);
      };
    }

    return () => {
      sub.remove();
      clearInterval(poll);
    };
  }, [ready, refreshFromServer]);

  const sessionUser = useMemo(() => {
    if (!state.sessionUserId) return null;
    return state.users.find((u) => u.id === state.sessionUserId) ?? null;
  }, [state.sessionUserId, state.users]);

  const adminUser = useMemo(
    () =>
      state.users.find((u) => u.role === 'admin' && u.id === ADMIN_ID) ??
      state.users.find((u) => u.role === 'admin') ??
      null,
    [state.users],
  );

  const loginWithCredentials = useCallback(
    async (login: string, password: string): Promise<string | null> => {
      try {
        const result = await loginRequest(login, password);
        await saveAuthToken(result.token);
        applyState(result.state);
        return null;
      } catch (e) {
        if (e instanceof ApiError) return e.message;
        return 'Сервер недоступен. Проверьте подключение к интернету.';
      }
    },
    [applyState],
  );

  const logout = useCallback(async () => {
    await saveAuthToken(null);
    try {
      const remote = await fetchState();
      applyState(remote);
    } catch {
      applyState({ ...stateRef.current, sessionUserId: null });
    }
  }, [applyState]);

  const submitRegistrationRequest = useCallback(
    async (payload: {
      login: string;
      password: string;
      phone: string;
      email: string;
    }): Promise<string | null> => dispatch('submitRegistrationRequest', payload),
    [dispatch],
  );

  const approveRegistrationRequest = useCallback(
    (requestId: string) => {
      dispatchVoid('approveRegistrationRequest', { requestId });
    },
    [dispatchVoid],
  );

  const deleteRegistrationRequest = useCallback(
    (requestId: string) => {
      dispatchVoid('deleteRegistrationRequest', { requestId });
    },
    [dispatchVoid],
  );

  const submitStudentTariffRequest = useCallback(
    (tariffId: string): Promise<string | null> =>
      dispatch('submitStudentTariffRequest', { tariffId }),
    [dispatch],
  );

  const approveStudentTariffRequest = useCallback(
    (requestId: string) => {
      dispatchVoid('approveStudentTariffRequest', { requestId });
    },
    [dispatchVoid],
  );

  const deleteStudentTariffRequest = useCallback(
    (requestId: string) => {
      dispatchVoid('deleteStudentTariffRequest', { requestId });
    },
    [dispatchVoid],
  );

  const addSlot = useCallback(
    (start: Date, durationMin: number) => {
      dispatchVoid('addSlot', { startIso: start.toISOString(), durationMin });
    },
    [dispatchVoid],
  );

  const addBlockedSlot = useCallback(
    (start: Date, durationMin: number) => {
      dispatchVoid('addBlockedSlot', { startIso: start.toISOString(), durationMin });
    },
    [dispatchVoid],
  );

  const ensureFreeTemplateSlotsForWeek = useCallback(
    (weekStartMonday: Date) => {
      dispatchVoid('ensureFreeTemplateSlotsForWeek', {
        weekStartIso: weekStartMonday.toISOString(),
      });
    },
    [dispatchVoid],
  );

  const removeSlot = useCallback(
    (slotId: string) => {
      dispatchVoid('removeSlot', { slotId });
    },
    [dispatchVoid],
  );

  const bookLessonSlot = useCallback(
    (rawStart: Date, durationMin: number, onSuccess?: () => void) => {
      void dispatch('bookLessonSlot', {
        startIso: rawStart.toISOString(),
        durationMin,
      }).then((err) => {
        if (err) {
          Alert.alert('Запись', err);
          return;
        }
        onSuccess?.();
      });
    },
    [dispatch],
  );

  const adminBookStudentSlot = useCallback(
    (
      studentId: string,
      rawStart: Date,
      durationMin: number,
      onSuccess?: () => void,
      cancelBookingId?: string,
    ) => {
      void dispatch('adminBookStudentSlot', {
        studentId,
        startIso: rawStart.toISOString(),
        durationMin,
        cancelBookingId,
      }).then((err) => {
        if (err) {
          Alert.alert('Запись', err);
          return;
        }
        onSuccess?.();
      });
    },
    [dispatch],
  );

  const cancelBookingByStudent = useCallback(
    (bookingId: string) => {
      dispatchVoid('cancelBookingByStudent', { bookingId });
    },
    [dispatchVoid],
  );

  const setBookingStudentPaid = useCallback(
    (bookingId: string, paid: boolean) => {
      dispatchVoid('setBookingStudentPaid', { bookingId, paid });
    },
    [dispatchVoid],
  );

  const setStudentAdminNote = useCallback(
    (studentId: string, note: string) => {
      dispatchVoid('setStudentAdminNote', { studentId, note });
    },
    [dispatchVoid],
  );

  const setStudentAssignedTariff = useCallback(
    (studentId: string, tariffId: string | undefined) => {
      dispatchVoid('setStudentAssignedTariff', { studentId, tariffId });
    },
    [dispatchVoid],
  );

  const setBookingStatus = useCallback(
    (bookingId: string, status: BookingStatus) => {
      dispatchVoid('setBookingStatus', { bookingId, status });
    },
    [dispatchVoid],
  );

  const updateSlotStatus = useCallback(
    (slotId: string, status: SlotStatus) => {
      dispatchVoid('updateSlotStatus', { slotId, status });
    },
    [dispatchVoid],
  );

  const upsertTariff = useCallback(
    (t: Tariff) => {
      dispatchVoid('upsertTariff', { tariff: t });
    },
    [dispatchVoid],
  );

  const removeTariff = useCallback(
    (tariffId: string) => {
      dispatchVoid('removeTariff', { tariffId });
    },
    [dispatchVoid],
  );

  const addUser = useCallback(
    (payload: {
      name: string;
      login: string;
      password: string;
      phone?: string;
      email?: string;
      role: Role;
      assignedTariffId?: string;
    }): Promise<string | null> => dispatch('addUser', payload),
    [dispatch],
  );

  const removeUser = useCallback(
    (userId: string) => {
      if (userId === ADMIN_ID) return;
      dispatchVoid('removeUser', { userId });
    },
    [dispatchVoid],
  );

  const toggleBlockUser = useCallback(
    (userId: string) => {
      if (userId === ADMIN_ID) return;
      dispatchVoid('toggleBlockUser', { userId });
    },
    [dispatchVoid],
  );

  const sendMessage = useCallback(
    (text: string, studentId?: string) => {
      const trimmed = text.trim();
      if (!trimmed || !state.sessionUserId) return;
      dispatchVoid('sendMessage', { text: trimmed, studentId });
    },
    [dispatchVoid, state.sessionUserId],
  );

  const pendingAdminRequestsCount = useMemo(
    () =>
      (state.registrationRequests?.length ?? 0) + (state.studentTariffRequests?.length ?? 0),
    [state.registrationRequests, state.studentTariffRequests],
  );

  const pendingBookingsCount = useMemo(
    () => state.bookings.filter((b) => b.status === 'pending').length,
    [state.bookings],
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
      adminBookStudentSlot,
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
      refreshFromServer,
      serverOnline,
      pendingAdminRequestsCount,
      pendingBookingsCount,
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
      adminBookStudentSlot,
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
      refreshFromServer,
      serverOnline,
      pendingAdminRequestsCount,
      pendingBookingsCount,
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
