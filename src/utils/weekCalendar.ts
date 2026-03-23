import type { Booking, Slot, User } from '../types';

/** Первый видимый час (включительно) */
export const GRID_HOUR_START = 7;
/** Последний видимый час начала слота (например 22 = до 23:00) */
export const GRID_HOUR_END = 22;

export const HOUR_ROW_PX = 44;

export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export function addWeeks(weekStart: Date, delta: number): Date {
  const x = new Date(weekStart);
  x.setDate(x.getDate() + delta * 7);
  return x;
}

export function getWeekDayDates(weekStartMonday: Date): Date[] {
  const out: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartMonday);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getSlotEnd(startIso: string, durationMin: number): Date {
  return new Date(new Date(startIso).getTime() + durationMin * 60_000);
}

/** Визуальная позиция слота внутри колонки дня (в пикселях) или null */
export function getSlotLayoutPx(
  slot: Slot,
  columnDay: Date,
): { top: number; height: number } | null {
  const start = new Date(slot.startIso);
  if (!isSameCalendarDay(start, columnDay)) return null;

  const dayAnchor = new Date(columnDay);
  dayAnchor.setHours(GRID_HOUR_START, 0, 0, 0);
  const dayEnd = new Date(columnDay);
  dayEnd.setHours(GRID_HOUR_END + 1, 0, 0, 0);

  const slotEnd = getSlotEnd(slot.startIso, slot.durationMin);
  const visStart = Math.max(start.getTime(), dayAnchor.getTime());
  const visEnd = Math.min(slotEnd.getTime(), dayEnd.getTime());
  if (visEnd <= visStart) return null;

  const minutesFromGridStart = (visStart - dayAnchor.getTime()) / 60_000;
  const durationMinVisible = (visEnd - visStart) / 60_000;
  const top = (minutesFromGridStart / 60) * HOUR_ROW_PX;
  const height = Math.max((durationMinVisible / 60) * HOUR_ROW_PX, 18);
  return { top, height };
}

export function slotOverlapsWeek(slot: Slot, weekStartMonday: Date): boolean {
  const ws = startOfWeekMonday(new Date(weekStartMonday));
  const we = new Date(ws);
  we.setDate(we.getDate() + 7);
  const s = new Date(slot.startIso).getTime();
  const e = getSlotEnd(slot.startIso, slot.durationMin).getTime();
  return s < we.getTime() && e > ws.getTime();
}

export function getBookingForSlot(
  slotId: string,
  bookings: Booking[],
): Booking | undefined {
  return bookings.find((b) => b.slotId === slotId && b.status !== 'cancelled');
}

export function getStudentName(userId: string, users: User[]): string {
  return users.find((u) => u.id === userId)?.name ?? 'Ученик';
}
