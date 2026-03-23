export type Role = 'student' | 'admin';

export interface User {
  id: string;
  /** Уникальный логин (сравнение без учёта регистра) */
  login: string;
  /** Локальное демо — пароль хранится открытым текстом */
  password: string;
  name: string;
  role: Role;
  phone?: string;
  email?: string;
  blocked?: boolean;
}

export interface RegistrationRequest {
  id: string;
  login: string;
  password: string;
  phone: string;
  email: string;
  createdAt: string;
}

export type SlotStatus =
  | 'free'
  | 'pending'
  | 'booked'
  | 'completed'
  | 'cancelled'
  /** Перекрытие админом (выходной, недоступно для записи) */
  | 'blocked';

export interface Slot {
  id: string;
  startIso: string;
  durationMin: number;
  status: SlotStatus;
}

export type BookingStatus = 'pending' | 'booked' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  slotId: string;
  userId: string;
  tariffId?: string;
  status: BookingStatus;
  createdAt: string;
}

export type TariffType = 'route' | 'package' | 'full' | 'after_exam';

export interface Tariff {
  id: string;
  name: string;
  description: string;
  type: TariffType;
  priceRub: number;
  lessonsCount?: number;
  durationMin?: number;
  active: boolean;
}

export interface Message {
  id: string;
  studentId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface LocalPayment {
  id: string;
  userId: string;
  tariffId: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface PddQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  category: string;
}

export interface PddProgress {
  userId: string;
  lastScore: number;
  lastTotal: number;
  updatedAt: string;
}

export interface AppState {
  version: 2;
  sessionUserId: string | null;
  users: User[];
  registrationRequests: RegistrationRequest[];
  slots: Slot[];
  bookings: Booking[];
  tariffs: Tariff[];
  messages: Message[];
  payments: LocalPayment[];
  pddProgress: PddProgress[];
}
