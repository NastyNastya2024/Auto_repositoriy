import type { AppState, Slot } from '../types';
import { createId } from './id';
import {
  GRID_HOUR_START,
  getSlotEnd,
  isSameCalendarDay,
  slotOverlapsTimeRange,
  snapToTemplateSlotStart,
} from './weekCalendar';

export const STUDENT_BOOKING_DURATIONS_MIN = [30, 60, 90, 120, 180] as const;

export type BookLessonResult =
  | { ok: true; next: AppState }
  | { ok: false; message: string };

/** Начало и окончание в пределах 11:00–21:30 в один календарный день */
export function isWithinLessonGridWindow(start: Date, durationMin: number): boolean {
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

/**
 * Запись ученика на выбранное время и длительность: пересекающиеся свободные слоты
 * убираются, добавляется новый pending-слот и заявка. Занятые/закрытые пересечения — отказ.
 */
export function buildStudentBookLessonState(
  s: AppState,
  rawStart: Date,
  durationMin: number,
): BookLessonResult {
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
    return {
      ok: false,
      message: 'Ваш тариф недоступен. Обратитесь к администратору.',
    };
  }

  if (!(STUDENT_BOOKING_DURATIONS_MIN as readonly number[]).includes(durationMin)) {
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
  const newSlot: Slot = {
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
    status: 'pending' as const,
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
