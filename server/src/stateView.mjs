/** Какие данные отдаём клиенту в зависимости от роли (полная БД остаётся на сервере). */

export function publicState(state) {
  return {
    version: state.version,
    sessionUserId: null,
    users: [],
    registrationRequests: [],
    studentTariffRequests: [],
    slots: [],
    bookings: [],
    tariffs: state.tariffs ?? [],
    messages: [],
    payments: [],
  };
}

export function stateForActor(state, actor) {
  if (!actor) return publicState(state);

  if (actor.role === 'admin') {
    return { ...state, sessionUserId: actor.userId };
  }

  // Ученик: расписание общее, чаты и заявки — только свои.
  const uid = actor.userId;
  return {
    version: state.version,
    sessionUserId: uid,
    users: (state.users ?? []).filter((u) => u.id === uid || u.role === 'admin'),
    registrationRequests: [],
    studentTariffRequests: (state.studentTariffRequests ?? []).filter((r) => r.studentId === uid),
    slots: state.slots ?? [],
    bookings: (state.bookings ?? []).filter((b) => b.userId === uid),
    tariffs: state.tariffs ?? [],
    messages: (state.messages ?? []).filter((m) => m.studentId === uid),
    payments: (state.payments ?? []).filter((p) => p.userId === uid),
  };
}
