import type { AppState } from '../types';

export const ADMIN_ID = 'user-admin';

/** Демо-вход админа: логин и пароль (видны только локально на устройстве) */
export const ADMIN_LOGIN = 'admin';
export const ADMIN_PASSWORD = 'admin123';

export const initialState: AppState = {
  version: 3,
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
      id: 't-trial',
      name: 'Пробное занятие',
      description: 'Одно занятие для знакомства с инструктором и автомобилем.',
      type: 'trial',
      priceRub: 2000,
      durationMin: 90,
      active: true,
    },
    {
      id: 't-tier-1-5',
      name: 'От 1 до 5 занятий',
      description: 'Стоимость одного занятия при покупке от 1 до 5 уроков.',
      type: 'package',
      priceRub: 3000,
      lessonsCount: 5,
      active: true,
    },
    {
      id: 't-tier-6-10',
      name: 'От 6 до 10 занятий',
      description: 'Цена за одно занятие при пакете от 6 до 10 уроков.',
      type: 'package',
      priceRub: 2800,
      lessonsCount: 10,
      active: true,
    },
    {
      id: 't-tier-10plus',
      name: 'От 10 занятий и более',
      description: 'Цена за одно занятие при пакете от 10 уроков и больше.',
      type: 'package',
      priceRub: 2500,
      lessonsCount: 10,
      active: true,
    },
    {
      id: 't-custom-route',
      name: 'Кастомный маршрут',
      description:
        'Индивидуальный маршрут под экзамен или слабые места: отрабатываем участки, которые нужны именно вам.',
      type: 'route',
      priceRub: 3200,
      durationMin: 90,
      lessonsCount: 1,
      active: true,
    },
    {
      id: 't-after-exam',
      name: 'Занятие после сдачи',
      description:
        'Выезд в реальный трафик после получения прав: поддержка инструктора для спокойного старта.',
      type: 'after_exam',
      priceRub: 3000,
      durationMin: 90,
      lessonsCount: 1,
      active: true,
    },
  ],
  messages: [],
  payments: [],
  pddProgress: [],
};
