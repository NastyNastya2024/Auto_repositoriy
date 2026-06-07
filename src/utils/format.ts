import type { BookingStatus } from '../types';

export function bookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'pending':
      return 'Ожидает подтверждения';
    case 'booked':
      return 'Записано';
    case 'completed':
      return 'Завершено';
    case 'cancelled':
      return 'Отменено';
    default:
      return status;
  }
}

export function accountStatusLabel(blocked?: boolean): string {
  return blocked ? 'Заблокирован' : 'Активен';
}

export function formatSlotDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatRub(n: number): string {
  return `${n.toLocaleString('ru-RU')} ₽`;
}
