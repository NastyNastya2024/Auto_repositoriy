import React from 'react';
import {
  Platform,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type FontSet = {
  regular: string;
  medium: string;
  bold: string;
};

const SYSTEM_FONTS: FontSet = {
  regular: 'sans-serif',
  medium: 'sans-serif-medium',
  bold: 'sans-serif-bold',
};

const ROBOTO_FONTS: FontSet = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
};

let activeFonts: FontSet = SYSTEM_FONTS;

/** Вызывается после useFonts — Roboto с полной кириллицей. */
export function activateRobotoFonts() {
  activeFonts = ROBOTO_FONTS;
}

function weightToFamily(weight: TextStyle['fontWeight']): string {
  if (
    weight === 'bold' ||
    weight === '700' ||
    weight === 700 ||
    weight === '800' ||
    weight === 800 ||
    weight === '900' ||
    weight === 900
  ) {
    return activeFonts.bold;
  }
  if (weight === '600' || weight === 600 || weight === '500' || weight === 500) {
    return activeFonts.medium;
  }
  return activeFonts.regular;
}

/**
 * На Android fontWeight подменяет глифы — «Записать ученика» превращается в мусор.
 * Задаём fontFamily явно и убираем fontWeight.
 */
export function androidTextStyle(style?: TextProps['style']): TextProps['style'] {
  if (Platform.OS !== 'android') return style ?? undefined;
  const flat = StyleSheet.flatten(style) ?? {};
  const fontFamily = weightToFamily(flat.fontWeight);
  const { fontWeight: _drop, ...rest } = flat;
  return { ...rest, fontFamily, includeFontPadding: false };
}

function wrapText(Original: typeof RNText) {
  const Wrapped = React.forwardRef<RNText, TextProps>(function AndroidText(props, ref) {
    return React.createElement(Original, {
      ...props,
      ref,
      style: androidTextStyle(props.style),
    });
  });
  Wrapped.displayName = 'Text';
  return Wrapped as unknown as typeof RNText;
}

function wrapTextInput(Original: typeof RNTextInput) {
  const Wrapped = React.forwardRef<RNTextInput, TextInputProps>(function AndroidTextInput(props, ref) {
    return React.createElement(Original, {
      ...props,
      ref,
      style: androidTextStyle(props.style),
    });
  });
  Wrapped.displayName = 'TextInput';
  return Wrapped as unknown as typeof RNTextInput;
}

let patched = false;

/** Патчит react-native Text/TextInput для всего приложения. */
export function setupAndroidTypography() {
  if (Platform.OS !== 'android' || patched) return;
  patched = true;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native') as typeof import('react-native');
  RN.Text = wrapText(RN.Text);
  RN.TextInput = wrapTextInput(RN.TextInput);
}

/** Подпись вкладки нижнего меню. */
export function tabBarLabelStyle(extra?: TextStyle): TextStyle {
  if (Platform.OS === 'android') {
    return {
      fontSize: 12,
      fontFamily: activeFonts.medium,
      lineHeight: 16,
      textAlign: 'center',
      includeFontPadding: false,
      textAlignVertical: 'center',
      paddingBottom: 0,
      ...extra,
    };
  }
  return {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    paddingBottom: 0,
    ...extra,
  };
}

/** Заголовок экрана / шапка. */
export function headerTitleStyle(extra?: { color?: string; fontSize?: number }): {
  color?: string;
  fontSize?: number;
  fontWeight?: '700';
  fontFamily?: string;
} {
  if (Platform.OS === 'android') {
    return { fontFamily: activeFonts.bold, ...extra };
  }
  return { fontWeight: '700', ...extra };
}

/** Текст на кнопках — по центру, без сжатия. */
export function buttonLabelStyle(extra?: TextStyle): TextStyle {
  const base: TextStyle = {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    ...extra,
  };
  if (Platform.OS === 'android') {
    const flat = androidTextStyle(base);
    return StyleSheet.flatten(flat) ?? base;
  }
  return base;
}

/** Футер шторки: на Android кнопки столбиком — текст не обрезается. */
export function sheetFooterLayout(extra?: ViewStyle): ViewStyle {
  return {
    flexDirection: Platform.OS === 'android' ? 'column' : 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    ...extra,
  };
}

export function sheetFooterButtonLayout(): ViewStyle {
  if (Platform.OS === 'android') {
    return {
      width: '100%',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    };
  }
  return {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  };
}
