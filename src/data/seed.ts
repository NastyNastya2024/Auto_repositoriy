import type { AppState } from '../types';

export const ADMIN_ID = 'user-admin';

/** Демо-вход админа: логин и пароль (видны только локально на устройстве) */
export const ADMIN_LOGIN = 'admin';
export const ADMIN_PASSWORD = 'admin123';

export const initialState: AppState = {
  version: 2,
  sessionUserId: null,
  users: [
    {
      id: ADMIN_ID,
      login: ADMIN_LOGIN,
      password: ADMIN_PASSWORD,
      name: 'Администратор',
      role: 'admin',
      phone: '+7 900 000-00-00',
    },
  ],
  registrationRequests: [],
  slots: [],
  bookings: [],
  tariffs: [
    {
      id: 't-route',
      name: 'Разовый маршрут (город)',
      description: 'Одно занятие по маршруту, отработка типовых ситуаций.',
      type: 'route',
      priceRub: 2500,
      durationMin: 90,
      active: true,
    },
    {
      id: 't-pack',
      name: 'Пакет 10 занятий',
      description: 'Скидка при покупке пакета.',
      type: 'package',
      priceRub: 22000,
      lessonsCount: 10,
      active: true,
    },
    {
      id: 't-full',
      name: 'Полный пакет до экзамена',
      description: 'Обучение и сопровождение до сдачи в ГАИ.',
      type: 'full',
      priceRub: 65000,
      active: true,
    },
    {
      id: 't-after',
      name: 'Сопровождение после сдачи',
      description: 'Дополнительные занятия после получения прав.',
      type: 'after_exam',
      priceRub: 3000,
      active: true,
    },
  ],
  messages: [],
  payments: [],
  pddProgress: [],
};
