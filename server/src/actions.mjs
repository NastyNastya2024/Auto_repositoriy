import {
  buildAdminBookLessonState,
  buildStudentBookLessonState,
  getTemplateSlotStartsForDay,
  getWeekDayDates,
  slotOverlapsTimeRange,
  startOfWeekMonday,
} from './booking.mjs';
import { ADMIN_ID } from './seed.mjs';

const TEMPLATE_SLOT_DURATION_MIN = 90;

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeLogin(login) {
  return login.trim().toLowerCase();
}

function withSession(state, userId) {
  return { ...state, sessionUserId: userId ?? null };
}

function requireActor(actor) {
  if (!actor?.userId) {
    return { ok: false, error: 'Требуется вход в аккаунт' };
  }
  return null;
}

function requireAdmin(actor) {
  const authErr = requireActor(actor);
  if (authErr) return authErr;
  if (actor.role !== 'admin') {
    return { ok: false, error: 'Доступно только администратору' };
  }
  return null;
}

function requireStudent(actor) {
  const authErr = requireActor(actor);
  if (authErr) return authErr;
  if (actor.role !== 'student') {
    return { ok: false, error: 'Доступно только ученикам' };
  }
  return null;
}

const PUBLIC_ACTIONS = new Set(['submitRegistrationRequest', 'login']);

export function isPublicAction(action) {
  return PUBLIC_ACTIONS.has(action);
}

export function runAction(state, action, payload, actor) {
  switch (action) {
    case 'login':
      return actionLogin(state, payload);
    case 'submitRegistrationRequest':
      return actionSubmitRegistrationRequest(state, payload);
    case 'approveRegistrationRequest':
      return actionApproveRegistrationRequest(state, payload, actor);
    case 'deleteRegistrationRequest':
      return actionDeleteRegistrationRequest(state, payload, actor);
    case 'submitStudentTariffRequest':
      return actionSubmitStudentTariffRequest(state, payload, actor);
    case 'approveStudentTariffRequest':
      return actionApproveStudentTariffRequest(state, payload, actor);
    case 'deleteStudentTariffRequest':
      return actionDeleteStudentTariffRequest(state, payload, actor);
    case 'addSlot':
      return actionAddSlot(state, payload, actor);
    case 'addBlockedSlot':
      return actionAddBlockedSlot(state, payload, actor);
    case 'ensureFreeTemplateSlotsForWeek':
      return actionEnsureFreeTemplateSlotsForWeek(state, payload, actor);
    case 'removeSlot':
      return actionRemoveSlot(state, payload, actor);
    case 'bookLessonSlot':
      return actionBookLessonSlot(state, payload, actor);
    case 'adminBookStudentSlot':
      return actionAdminBookStudentSlot(state, payload, actor);
    case 'cancelBookingByStudent':
      return actionCancelBookingByStudent(state, payload, actor);
    case 'setBookingStudentPaid':
      return actionSetBookingStudentPaid(state, payload, actor);
    case 'setStudentAdminNote':
      return actionSetStudentAdminNote(state, payload, actor);
    case 'setStudentAssignedTariff':
      return actionSetStudentAssignedTariff(state, payload, actor);
    case 'setBookingStatus':
      return actionSetBookingStatus(state, payload, actor);
    case 'updateSlotStatus':
      return actionUpdateSlotStatus(state, payload, actor);
    case 'upsertTariff':
      return actionUpsertTariff(state, payload, actor);
    case 'removeTariff':
      return actionRemoveTariff(state, payload, actor);
    case 'addUser':
      return actionAddUser(state, payload, actor);
    case 'removeUser':
      return actionRemoveUser(state, payload, actor);
    case 'toggleBlockUser':
      return actionToggleBlockUser(state, payload, actor);
    case 'sendMessage':
      return actionSendMessage(state, payload, actor);
    default:
      return { ok: false, error: `Неизвестное действие: ${action}` };
  }
}

function actionLogin(state, payload) {
  const login = normalizeLogin(payload?.login ?? '');
  const password = payload?.password ?? '';
  const user = state.users.find(
    (u) => normalizeLogin(u.login) === login && u.password === password,
  );
  if (!user) return { ok: false, error: 'Неверный логин или пароль' };
  if (user.blocked) return { ok: false, error: 'Аккаунт заблокирован' };
  return {
    ok: true,
    state: withSession(state, user.id),
    tokenUser: { id: user.id, role: user.role, login: user.login, name: user.name },
  };
}

function actionSubmitRegistrationRequest(state, payload) {
  const l = normalizeLogin(payload?.login ?? '');
  const phone = (payload?.phone ?? '').trim();
  const email = (payload?.email ?? '').trim();
  const password = payload?.password ?? '';
  if (l.length < 3) return { ok: false, error: 'Логин не короче 3 символов' };
  if (password.length < 4) return { ok: false, error: 'Пароль не короче 4 символов' };
  if (!phone) return { ok: false, error: 'Укажите мобильный телефон' };
  if (!email) return { ok: false, error: 'Укажите почту' };
  const regs = state.registrationRequests ?? [];
  if (state.users.some((u) => normalizeLogin(u.login) === l)) {
    return { ok: false, error: 'Такой логин уже занят' };
  }
  if (regs.some((r) => normalizeLogin(r.login) === l)) {
    return { ok: false, error: 'Заявка с таким логином уже отправлена' };
  }
  const req = {
    id: createId(),
    login: l,
    password,
    phone,
    email,
    createdAt: new Date().toISOString(),
  };
  return {
    ok: true,
    state: {
      ...state,
      registrationRequests: [...regs, req],
    },
  };
}

function actionApproveRegistrationRequest(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  const requestId = payload?.requestId;
  const r = state.registrationRequests.find((x) => x.id === requestId);
  if (!r) return { ok: false, error: 'Заявка не найдена' };
  const l = normalizeLogin(r.login);
  if (state.users.some((u) => normalizeLogin(u.login) === l)) {
    return {
      ok: true,
      state: {
        ...state,
        registrationRequests: state.registrationRequests.filter((x) => x.id !== requestId),
      },
    };
  }
  const user = {
    id: createId(),
    login: l,
    password: r.password,
    name: r.login,
    role: 'student',
    phone: r.phone,
    email: r.email,
  };
  return {
    ok: true,
    state: {
      ...state,
      users: [...state.users, user],
      registrationRequests: state.registrationRequests.filter((x) => x.id !== requestId),
    },
  };
}

function actionDeleteRegistrationRequest(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  return {
    ok: true,
    state: {
      ...state,
      registrationRequests: state.registrationRequests.filter(
        (x) => x.id !== payload?.requestId,
      ),
    },
  };
}

function actionSubmitStudentTariffRequest(state, payload, actor) {
  const err = requireStudent(actor);
  if (err) return err;
  const tariffId = payload?.tariffId;
  const reqs = state.studentTariffRequests ?? [];
  const uid = actor.userId;
  const user = state.users.find((u) => u.id === uid);
  if (!user || user.blocked) return { ok: false, error: 'Аккаунт заблокирован' };
  const t = state.tariffs.find((x) => x.id === tariffId);
  if (!t?.active) return { ok: false, error: 'Тариф недоступен' };
  const existingForStudent = reqs.find((r) => r.studentId === uid);
  if (existingForStudent?.tariffId === tariffId) {
    return {
      ok: false,
      error: 'Эта заявка уже у администратора. Дождитесь ответа или выберите другой тариф.',
    };
  }
  const req = {
    id: createId(),
    studentId: uid,
    tariffId,
    createdAt: new Date().toISOString(),
  };
  return {
    ok: true,
    state: {
      ...state,
      studentTariffRequests: [...reqs.filter((r) => r.studentId !== uid), req],
    },
  };
}

function actionApproveStudentTariffRequest(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  const reqs = state.studentTariffRequests ?? [];
  const r = reqs.find((x) => x.id === payload?.requestId);
  if (!r) return { ok: false, error: 'Заявка не найдена' };
  const t = state.tariffs.find((x) => x.id === r.tariffId);
  if (!t?.active) return { ok: false, error: 'Тариф недоступен' };
  const student = state.users.find((u) => u.id === r.studentId);
  if (!student || student.role !== 'student') {
    return {
      ok: true,
      state: { ...state, studentTariffRequests: reqs.filter((x) => x.id !== r.id) },
    };
  }
  return {
    ok: true,
    state: {
      ...state,
      users: state.users.map((u) =>
        u.id === r.studentId ? { ...u, assignedTariffId: r.tariffId } : u,
      ),
      studentTariffRequests: reqs.filter((x) => x.id !== r.id),
    },
  };
}

function actionDeleteStudentTariffRequest(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  return {
    ok: true,
    state: {
      ...state,
      studentTariffRequests: (state.studentTariffRequests ?? []).filter(
        (x) => x.id !== payload?.requestId,
      ),
    },
  };
}

function actionAddSlot(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  const slot = {
    id: createId(),
    startIso: new Date(payload.startIso).toISOString(),
    durationMin: payload.durationMin,
    status: 'free',
  };
  return { ok: true, state: { ...state, slots: [...state.slots, slot] } };
}

function actionAddBlockedSlot(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  const slot = {
    id: createId(),
    startIso: new Date(payload.startIso).toISOString(),
    durationMin: payload.durationMin,
    status: 'blocked',
  };
  return { ok: true, state: { ...state, slots: [...state.slots, slot] } };
}

function actionEnsureFreeTemplateSlotsForWeek(state, payload, actor) {
  const err = requireActor(actor);
  if (err) return err;
  const ws = startOfWeekMonday(new Date(payload.weekStartIso));
  const days = getWeekDayDates(ws);
  const toAdd = [];
  for (const day of days) {
    for (const start of getTemplateSlotStartsForDay(day)) {
      const tEnd = new Date(start.getTime() + TEMPLATE_SLOT_DURATION_MIN * 60_000);
      if (state.slots.some((slot) => slotOverlapsTimeRange(slot, start, tEnd))) continue;
      toAdd.push({
        id: createId(),
        startIso: start.toISOString(),
        durationMin: TEMPLATE_SLOT_DURATION_MIN,
        status: 'free',
      });
    }
  }
  if (toAdd.length === 0) return { ok: true, state };
  return { ok: true, state: { ...state, slots: [...state.slots, ...toAdd] } };
}

function actionRemoveSlot(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  const slotId = payload?.slotId;
  return {
    ok: true,
    state: {
      ...state,
      slots: state.slots.filter((x) => x.id !== slotId),
      bookings: state.bookings.filter((b) => b.slotId !== slotId),
    },
  };
}

function actionBookLessonSlot(state, payload, actor) {
  const err = requireStudent(actor);
  if (err) return err;
  const working = withSession(state, actor.userId);
  const result = buildStudentBookLessonState(
    working,
    new Date(payload.startIso),
    payload.durationMin,
    createId,
  );
  if (!result.ok) return { ok: false, error: result.message };
  return { ok: true, state: withSession(result.next, actor.userId) };
}

function actionAdminBookStudentSlot(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  let working = withSession(state, actor.userId);
  if (payload.cancelBookingId) {
    const old = working.bookings.find((x) => x.id === payload.cancelBookingId);
    if (old && old.status !== 'cancelled') {
      working = {
        ...working,
        bookings: working.bookings.map((x) =>
          x.id === payload.cancelBookingId ? { ...x, status: 'cancelled' } : x,
        ),
        slots: working.slots.map((sl) =>
          sl.id === old.slotId ? { ...sl, status: 'free' } : sl,
        ),
      };
    }
  }
  const result = buildAdminBookLessonState(
    working,
    payload.studentId,
    new Date(payload.startIso),
    payload.durationMin,
    createId,
  );
  if (!result.ok) return { ok: false, error: result.message };
  return { ok: true, state: withSession(result.next, actor.userId) };
}

function actionCancelBookingByStudent(state, payload, actor) {
  const err = requireStudent(actor);
  if (err) return err;
  const uid = actor.userId;
  const b = state.bookings.find((x) => x.id === payload?.bookingId);
  if (!b || b.userId !== uid || b.status !== 'pending') {
    return { ok: false, error: 'Запись не найдена' };
  }
  return {
    ok: true,
    state: withSession(
      {
        ...state,
        bookings: state.bookings.map((x) =>
          x.id === b.id ? { ...x, status: 'cancelled' } : x,
        ),
        slots: state.slots.map((sl) =>
          sl.id === b.slotId ? { ...sl, status: 'free' } : sl,
        ),
      },
      uid,
    ),
  };
}

function actionSetBookingStudentPaid(state, payload, actor) {
  const err = requireStudent(actor);
  if (err) return err;
  const uid = actor.userId;
  const b = state.bookings.find((x) => x.id === payload?.bookingId);
  if (!b || b.userId !== uid || b.status === 'cancelled') {
    return { ok: false, error: 'Запись не найдена' };
  }
  return {
    ok: true,
    state: withSession(
      {
        ...state,
        bookings: state.bookings.map((x) =>
          x.id === b.id ? { ...x, studentMarkedPaid: !!payload.paid } : x,
        ),
      },
      uid,
    ),
  };
}

function actionSetStudentAdminNote(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  const target = state.users.find((u) => u.id === payload?.studentId);
  if (!target || target.role !== 'student') return { ok: false, error: 'Ученик не найден' };
  return {
    ok: true,
    state: {
      ...state,
      users: state.users.map((u) =>
        u.id === payload.studentId ? { ...u, adminNote: payload.note ?? '' } : u,
      ),
    },
  };
}

function actionSetStudentAssignedTariff(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  const target = state.users.find((u) => u.id === payload?.studentId);
  if (!target || target.role !== 'student') return { ok: false, error: 'Ученик не найден' };
  if (payload.tariffId !== undefined && payload.tariffId !== null) {
    const t = state.tariffs.find((x) => x.id === payload.tariffId);
    if (!t?.active) return { ok: false, error: 'Тариф недоступен' };
  }
  return {
    ok: true,
    state: {
      ...state,
      users: state.users.map((u) =>
        u.id === payload.studentId
          ? { ...u, assignedTariffId: payload.tariffId ?? undefined }
          : u,
      ),
    },
  };
}

function actionSetBookingStatus(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  const b = state.bookings.find((x) => x.id === payload?.bookingId);
  if (!b) return { ok: false, error: 'Запись не найдена' };
  const status = payload.status;
  let slots = state.slots;
  if (status === 'booked') {
    slots = slots.map((sl) => (sl.id === b.slotId ? { ...sl, status: 'booked' } : sl));
  }
  if (status === 'cancelled') {
    slots = slots.map((sl) => (sl.id === b.slotId ? { ...sl, status: 'free' } : sl));
  }
  if (status === 'completed') {
    slots = slots.map((sl) => (sl.id === b.slotId ? { ...sl, status: 'completed' } : sl));
  }
  return {
    ok: true,
    state: {
      ...state,
      bookings: state.bookings.map((x) => (x.id === b.id ? { ...x, status } : x)),
      slots,
    },
  };
}

function actionUpdateSlotStatus(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  return {
    ok: true,
    state: {
      ...state,
      slots: state.slots.map((sl) =>
        sl.id === payload.slotId ? { ...sl, status: payload.status } : sl,
      ),
    },
  };
}

function actionUpsertTariff(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  const t = payload.tariff;
  const idx = state.tariffs.findIndex((x) => x.id === t.id);
  if (idx === -1) return { ok: true, state: { ...state, tariffs: [...state.tariffs, t] } };
  const copy = [...state.tariffs];
  copy[idx] = t;
  return { ok: true, state: { ...state, tariffs: copy } };
}

function actionRemoveTariff(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  return {
    ok: true,
    state: { ...state, tariffs: state.tariffs.filter((t) => t.id !== payload.tariffId) },
  };
}

function actionAddUser(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  const l = normalizeLogin(payload.login ?? '');
  if (l.length < 3) return { ok: false, error: 'Логин не короче 3 символов' };
  if ((payload.password ?? '').length < 4) return { ok: false, error: 'Пароль не короче 4 символов' };
  if (payload.role === 'student' && !payload.assignedTariffId) {
    return { ok: false, error: 'Выберите тариф для ученика' };
  }
  if (state.users.some((u) => normalizeLogin(u.login) === l)) {
    return { ok: false, error: 'Такой логин уже занят' };
  }
  if (payload.role === 'student' && payload.assignedTariffId) {
    const t = state.tariffs.find((x) => x.id === payload.assignedTariffId);
    if (!t?.active) return { ok: false, error: 'Тариф недоступен' };
  }
  const u = {
    id: createId(),
    login: l,
    password: payload.password,
    name: (payload.name ?? '').trim() || 'Без имени',
    role: payload.role,
    phone: payload.phone?.trim() || undefined,
    email: payload.email?.trim() || undefined,
    assignedTariffId: payload.role === 'student' ? payload.assignedTariffId : undefined,
  };
  return { ok: true, state: { ...state, users: [...state.users, u] } };
}

function actionRemoveUser(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  if (payload.userId === ADMIN_ID) return { ok: false, error: 'Нельзя удалить администратора' };
  return {
    ok: true,
    state: {
      ...state,
      users: state.users.filter((u) => u.id !== payload.userId),
      bookings: state.bookings.filter((b) => b.userId !== payload.userId),
      messages: state.messages.filter((m) => m.studentId !== payload.userId),
      payments: state.payments.filter((p) => p.userId !== payload.userId),
      studentTariffRequests: (state.studentTariffRequests ?? []).filter(
        (r) => r.studentId !== payload.userId,
      ),
    },
  };
}

function actionToggleBlockUser(state, payload, actor) {
  const err = requireAdmin(actor);
  if (err) return err;
  if (payload.userId === ADMIN_ID) return { ok: false, error: 'Нельзя заблокировать администратора' };
  return {
    ok: true,
    state: {
      ...state,
      users: state.users.map((u) =>
        u.id === payload.userId ? { ...u, blocked: !u.blocked } : u,
      ),
    },
  };
}

function actionSendMessage(state, payload, actor) {
  const err = requireActor(actor);
  if (err) return err;
  const trimmed = (payload.text ?? '').trim();
  if (!trimmed) return { ok: false, error: 'Пустое сообщение' };
  const user = state.users.find((u) => u.id === actor.userId);
  if (!user || user.blocked) return { ok: false, error: 'Сообщение недоступно' };
  let targetStudentId = payload.studentId;
  if (user.role === 'student') targetStudentId = actor.userId;
  if (user.role === 'admin' && !targetStudentId) {
    return { ok: false, error: 'Укажите ученика' };
  }
  const msg = {
    id: createId(),
    studentId: targetStudentId,
    senderId: actor.userId,
    text: trimmed,
    createdAt: new Date().toISOString(),
  };
  return {
    ok: true,
    state: withSession({ ...state, messages: [...state.messages, msg] }, actor.userId),
  };
}
