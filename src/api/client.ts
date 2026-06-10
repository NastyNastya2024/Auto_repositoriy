import type { AppState } from '../types';
import { apiUrl } from './config';
import { loadAuthToken } from './session';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ActionResult = {
  state: AppState;
  token?: string;
  user?: { id: string; role: string; login: string; name: string };
};

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await loadAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchState(): Promise<AppState> {
  const res = await fetch(apiUrl('/api/state'), { headers: await authHeaders() });
  if (!res.ok) {
    const body = await parseJson<{ error?: string }>(res);
    throw new ApiError(body.error ?? 'Не удалось загрузить данные', res.status);
  }
  const body = await parseJson<{ state: AppState }>(res);
  return body.state;
}

export async function loginRequest(
  login: string,
  password: string,
): Promise<ActionResult & { token: string }> {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  });
  const body = await parseJson<ActionResult & { error?: string; token?: string }>(res);
  if (!res.ok || !body.token) {
    throw new ApiError(body.error ?? 'Ошибка входа', res.status);
  }
  return body as ActionResult & { token: string };
}

export async function postAction(
  action: string,
  payload?: Record<string, unknown>,
): Promise<ActionResult> {
  const res = await fetch(apiUrl('/api/actions'), {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ action, payload }),
  });
  const body = await parseJson<ActionResult & { error?: string }>(res);
  if (!res.ok) {
    throw new ApiError(body.error ?? 'Ошибка сервера', res.status);
  }
  return body;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/health'));
    return res.ok;
  } catch {
    return false;
  }
}
