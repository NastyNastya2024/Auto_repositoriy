import { Platform } from 'react-native';
import { lightColors } from '../theme';

const WEB_BG = lightColors.bg;
const WEB_TEXT = lightColors.text;

let webViewportListenersBound = false;

function setRootViewportHeight(el: HTMLElement) {
  // На мобильных браузерах (особенно Chrome Android) `100vh` может включать/исключать UI браузера,
  // из-за чего фиксированные элементы снизу (например, таб-бар) оказываются "за экраном".
  // `100dvh` решает это там, где поддерживается; иначе используем реальную высоту viewport в px.
  const supportsDvh =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    (CSS.supports('height: 100dvh') || CSS.supports('height', '100dvh'));

  if (supportsDvh) {
    el.style.minHeight = '100dvh';
    return;
  }

  if (typeof window !== 'undefined') {
    const vh = Math.round(window.visualViewport?.height ?? window.innerHeight);
    el.style.minHeight = `${vh}px`;
  } else {
    el.style.minHeight = '100vh';
  }
}

/**
 * В браузере при системной тёмной теме страница получает `color-scheme: dark`
 * и тёмный фон у html/body — из-за этого «localhost» выглядит как тёмная тема.
 * Фиксируем светлую схему и фон у документа и корня приложения.
 */
export function applyWebDocumentLightTheme(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  document.documentElement.style.colorScheme = 'light';
  document.documentElement.style.backgroundColor = WEB_BG;
  document.documentElement.style.height = '100%';
  document.body.style.backgroundColor = WEB_BG;
  document.body.style.color = WEB_TEXT;
  document.body.style.height = '100%';

  let meta = document.querySelector('meta[name="color-scheme"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'color-scheme');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', 'light');

  const applyHeight = () => {
    for (const id of ['root', 'expo-root', 'main']) {
      const el = document.getElementById(id) as HTMLElement | null;
      if (el) {
        el.style.backgroundColor = WEB_BG;
        el.style.height = '100%';
        setRootViewportHeight(el);
      }
    }
  };

  applyHeight();

  // Поддерживаем корректную высоту при показе/скрытии адресной строки.
  if (!webViewportListenersBound && typeof window !== 'undefined') {
    webViewportListenersBound = true;
    window.addEventListener('resize', applyHeight, { passive: true });
    window.visualViewport?.addEventListener('resize', applyHeight, { passive: true });
  }
}
