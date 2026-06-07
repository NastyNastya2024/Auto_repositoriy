import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../theme';
import { buttonLabelStyle, sheetFooterButtonLayout, sheetFooterLayout } from '../utils/typography';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
};

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Да',
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
  destructive,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.footer}>
            <Pressable style={styles.secondary} onPress={onCancel}>
              <Text style={styles.secondaryText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={destructive ? styles.danger : styles.primary}
              onPress={() => {
                onConfirm();
                onCancel();
              }}
            >
              <Text style={destructive ? styles.dangerText : styles.primaryText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'center', padding: 24 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: buttonLabelStyle({ fontSize: 17, color: colors.text, textAlign: 'left' }),
    message: { marginTop: 10, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
    footer: { ...sheetFooterLayout(), marginTop: 16 },
    secondary: {
      ...sheetFooterButtonLayout(),
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryText: buttonLabelStyle({ color: colors.text, fontSize: 14 }),
    primary: { ...sheetFooterButtonLayout(), backgroundColor: colors.primary },
    primaryText: buttonLabelStyle({ color: colors.onPrimary, fontSize: 14 }),
    danger: {
      ...sheetFooterButtonLayout(),
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.dangerBorder,
    },
    dangerText: buttonLabelStyle({ color: colors.dangerText, fontSize: 14 }),
  });
}
