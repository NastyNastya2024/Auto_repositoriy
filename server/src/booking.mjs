const GRID_HOUR_START = 11;
const STUDENT_BOOKING_DURATIONS_MIN = [30, 60, 90, 120, 180];

function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getSlotEnd(startIso, durationMin) {
  return new Date(new Date(startIso).getTime() + durationMin * 60_000);
}

function slotOverlapsTimeRange(slot, rangeStart, rangeEnd) {
  const s = new Date(slot.startIso).getTime();
  const e = getSlotEnd(slot.startIso, slot.durationMin).getTime();
  return s < rangeEnd.getTime() && e > rangeStart.getTime();
}

function snapToTemplateSlotStart(preferred) {
  const dayMidnight = new Date(preferred);
  dayMidnight.setHours(0, 0, 0, 0);
  const starts = getTemplateSlotStartsForDay(dayMidnight);
  if (starts.length === 0) return new Date(preferred);
  const t = preferred.getTime();
  let best = starts[0];
  let bestDist = Math.abs(t - best.getTime());
  for (const s of starts) {
    const d = Math.abs(t - s.getTime());
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return new Date(best);
}

function getTemplateSlotStartsForDay(day) {
  const TEMPLATE_SLOT_DURATION_MIN = 90;
  const out = [];
  let t = new Date(day);
  t.setHours(11, 0, 0, 0);
  const limit = new Date(day);
  limit.setHours(21, 30, 0, 0);
  while (true) {
    const tEnd = new Date(t.getTime() + TEMPLATE_SLOT_DURATION_MIN * 60_000);
    if (tEnd.getTime() > limit.getTime()) break;
    out.push(new Date(t));
    t = tEnd;
  }
  return out;
}

function isWithinLessonGridWindow(start, durationMin) {
  const rangeEnd = getSlotEnd(start.toISOString(), durationMin);
  if (!isSameCalendarDay(start, rangeEnd)) return false;
  const day = new Date(start);
  day.setHours(0, 0, 0, 0);
  const gridStart = new Date(day);
  gridStart.setHours(GRID_HOUR_START, 0, 0, 0);
  const limit = new Date(day);
  limit.setHours(21, 30, 0, 0);
  if (start.getTime() < gridStart.getTime()) return false;
  if (rangeEnd.getTime() > limit.getTime()) return false;
  return true;
}

export function buildStudentBookLessonState(s, rawStart, durationMin, createId) {
  const uid = s.sessionUserId;
  if (!uid) return { ok: false, message: 'Войдите в аккаунт' };
  const user = s.users.find((u) => u.id === uid);
  if (!user || user.blocked || user.role !== 'student') {
    return { ok: false, message: 'Запись недоступна' };
  }
  if (!user.assignedTariffId) {
    return {
      ok: false,
      message: 'Администратор не закрепил за вами тариф. Запись невозможна.',
    };
  }
  const assignedTariff = s.tariffs.find((t) => t.id === user.assignedTariffId);
  if (!assignedTariff?.active) {
    return { ok: false, message: 'Ваш тариф недоступен. Обратитесь к администратору.' };
  }
  if (!STUDENT_BOOKING_DURATIONS_MIN.includes(durationMin)) {
    return { ok: false, message: 'Недопустимая длительность' };
  }
  const start = snapToTemplateSlotStart(rawStart);
  if (!isWithinLessonGridWindow(start, durationMin)) {
    return {
      ok: false,
      message: 'Время и длительность должны умещаться в интервал 11:00–21:30',
    };
  }
  const rangeEnd = getSlotEnd(start.toISOString(), durationMin);
  const blocked = s.slots.filter(
    (sl) => sl.status !== 'free' && slotOverlapsTimeRange(sl, start, rangeEnd),
  );
  if (blocked.length > 0) {
    return { ok: false, message: 'Это время уже занято или закрыто администратором' };
  }
  const keptSlots = s.slots.filter((sl) => {
    if (sl.status !== 'free') return true;
    return !slotOverlapsTimeRange(sl, start, rangeEnd);
  });
  const newSlotId = createId();
  const newSlot = {
    id: newSlotId,
    startIso: start.toISOString(),
    durationMin,
    status: 'pending',
  };
  const booking = {
    id: createId(),
    slotId: newSlotId,
    userId: uid,
    tariffId: user.assignedTariffId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  return {
    ok: true,
    next: {
      ...s,
      slots: [...keptSlots, newSlot],
      bookings: [...s.bookings, booking],
    },
  };
}

export function buildAdminBookLessonState(s, studentId, rawStart, durationMin, createId) {
  const user = s.users.find((u) => u.id === studentId);
  if (!user || user.role !== 'student') {
    return { ok: false, message: 'Выберите ученика из списка' };
  }
  if (user.blocked) return { ok: false, message: 'Ученик заблокирован' };
  if (durationMin <= 0) return { ok: false, message: 'Недопустимая длительность' };
  const start = new Date(rawStart);
  if (!isWithinLessonGridWindow(start, durationMin)) {
    return {
      ok: false,
      message: 'Время и длительность должны умещаться в интервал 11:00–21:30',
    };
  }
  const rangeEnd = getSlotEnd(start.toISOString(), durationMin);
  const blocked = s.slots.filter(
    (sl) => sl.status !== 'free' && slotOverlapsTimeRange(sl, start, rangeEnd),
  );
  if (blocked.length > 0) {
    return { ok: false, message: 'Это время уже занято или закрыто' };
  }
  const keptSlots = s.slots.filter((sl) => {
    if (sl.status !== 'free') return true;
    return !slotOverlapsTimeRange(sl, start, rangeEnd);
  });
  const newSlotId = createId();
  const newSlot = {
    id: newSlotId,
    startIso: start.toISOString(),
    durationMin,
    status: 'booked',
  };
  const booking = {
    id: createId(),
    slotId: newSlotId,
    userId: studentId,
    tariffId: user.assignedTariffId,
    status: 'booked',
    createdAt: new Date().toISOString(),
  };
  return {
    ok: true,
    next: {
      ...s,
      slots: [...keptSlots, newSlot],
      bookings: [...s.bookings, booking],
    },
  };
}

export {
  getTemplateSlotStartsForDay,
  slotOverlapsTimeRange,
  startOfWeekMonday,
  getWeekDayDates,
};

function startOfWeekMonday(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function getWeekDayDates(weekStartMonday) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartMonday);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
}
