import { Platform } from 'react-native';

const WEB_BG = '#f6f7f9';
const WEB_TEXT = '#0f172a';

/**
 * В браузере при системной тёмной теме страница получает `color-scheme: dark`
 * и тёмный фон у html/body — из-за этого «localhost» выглядит как тёмная тема.
 * Фиксируем светлую схему и фон у документа и корня приложения.
 */
export function applyWebDocumentLightTheme(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  document.documentElement.style.colorScheme = 'light';
  document.documentElement.style.backgroundColor = WEB_BG;
  document.body.style.backgroundColor = WEB_BG;
  document.body.style.color = WEB_TEXT;

  let meta = document.querySelector('meta[name="color-scheme"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'color-scheme');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', 'light');

  for (const id of ['root', 'expo-root', 'main']) {
    const el = document.getElementById(id) as HTMLElement | null;
    if (el) {
      el.style.backgroundColor = WEB_BG;
      el.style.minHeight = '100vh';
    }
  }
}
