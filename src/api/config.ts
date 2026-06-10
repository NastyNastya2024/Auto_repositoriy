/** Пустая строка = тот же хост (nginx проксирует /api на backend). */
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
