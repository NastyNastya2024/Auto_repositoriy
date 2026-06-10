import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmSheet } from '../../components/ConfirmSheet';
import { useApp } from '../../context/AppContext';
import { useServerRefreshOnFocus } from '../../hooks/useServerRefreshOnFocus';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme';
import { buttonLabelStyle } from '../../utils/typography';

function confirmWeb(message: string): boolean {
  if (Platform.OS !== 'web' || typeof globalThis === 'undefined') return false;
  const win = globalThis as typeof globalThis & { confirm?: (m: string) => boolean };
  if (typeof win.confirm !== 'function') return false;
  return win.confirm(message);
}

type PendingConfirm = {
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
};

export function AdminRegistrationRequestsScreen() {
  const {
    state,
    approveRegistrationRequest,
    deleteRegistrationRequest,
    approveStudentTariffRequest,
    deleteStudentTariffRequest,
  } = useApp();
  useServerRefreshOnFocus();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const askConfirm = (cfg: PendingConfirm) => {
    if (Platform.OS === 'web') {
      const text = cfg.message ? `${cfg.title}\n\n${cfg.message}` : cfg.title;
      if (confirmWeb(text)) cfg.onConfirm();
      return;
    }
    setPendingConfirm(cfg);
  };

  const regList = [...(state.registrationRequests ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const tariffReqList = [...(state.studentTariffRequests ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Здесь заявки на доступ в приложение и на тариф. Новые пользователи не могут войти, пока вы не
        подтвердите регистрацию. Заявку на тариф можно подтвердить — тогда тариф закрепится за учеником.
      </Text>

      <Text style={styles.sectionTitle}>Заявки на доступ</Text>
      {regList.length === 0 && <Text style={styles.empty}>Нет заявок на доступ</Text>}
      {regList.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.kind}>Заявка на доступ</Text>
          <Text style={styles.login}>{r.login}</Text>
          <Text style={styles.meta}>{r.phone}</Text>
          <Text style={styles.meta}>{r.email}</Text>
          <Text style={styles.date}>{new Date(r.createdAt).toLocaleString('ru-RU')}</Text>
          <View style={styles.row}>
            <Pressable
              style={styles.ok}
              onPress={() =>
                askConfirm({
                  title: 'Подтвердить заявку?',
                  message: `Создать учётную запись для «${r.login}»?`,
                  confirmLabel: 'Подтвердить',
                  onConfirm: () => approveRegistrationRequest(r.id),
                })
              }
            >
              <Text style={styles.okText}>Подтвердить</Text>
            </Pressable>
            <Pressable
              style={styles.no}
              onPress={() =>
                askConfirm({
                  title: 'Удалить заявку?',
                  message: `Заявка «${r.login}» будет удалена.`,
                  confirmLabel: 'Удалить',
                  destructive: true,
                  onConfirm: () => deleteRegistrationRequest(r.id),
                })
              }
            >
              <Text style={styles.noText}>Удалить</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Заявки на тариф</Text>
      {tariffReqList.length === 0 && <Text style={styles.empty}>Нет заявок на тариф</Text>}
      {tariffReqList.map((req) => {
        const student = state.users.find((u) => u.id === req.studentId);
        const tariff = state.tariffs.find((t) => t.id === req.tariffId);
        const nameLine = student?.name?.trim() || 'Ученик';
        const loginLine = student ? student.login : req.studentId;
        return (
          <View key={req.id} style={styles.card}>
            <Text style={styles.kind}>Заявка на тариф</Text>
            <Text style={styles.login}>{nameLine}</Text>
            <Text style={styles.meta}>@{loginLine}</Text>
            <Text style={styles.tariffName}>{tariff?.name ?? 'Тариф удалён'}</Text>
            <Text style={styles.date}>{new Date(req.createdAt).toLocaleString('ru-RU')}</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.ok}
                onPress={() => {
                  if (!tariff?.active) {
                    Alert.alert(
                      'Нельзя подтвердить',
                      'Тариф снят с витрины или удалён. Сначала включите тариф или удалите заявку.',
                    );
                    return;
                  }
                  const message = `Закрепить тариф?\nНазначить ученику «${nameLine}» тариф «${tariff.name}»?`;
                  askConfirm({
                    title: 'Закрепить тариф?',
                    message: `Назначить ученику «${nameLine}» тариф «${tariff.name}»?`,
                    confirmLabel: 'Назначить',
                    onConfirm: () => approveStudentTariffRequest(req.id),
                  });
                }}
              >
                <Text style={styles.okText}>Назначить тариф</Text>
              </Pressable>
              <Pressable
                style={styles.no}
                onPress={() =>
                  askConfirm({
                    title: 'Отклонить заявку?',
                    message: 'Заявка на тариф будет удалена.',
                    confirmLabel: 'Отклонить',
                    destructive: true,
                    onConfirm: () => deleteStudentTariffRequest(req.id),
                  })
                }
              >
                <Text style={styles.noText}>Отклонить</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <ConfirmSheet
        visible={pendingConfirm !== null}
        title={pendingConfirm?.title ?? ''}
        message={pendingConfirm?.message}
        confirmLabel={pendingConfirm?.confirmLabel ?? 'Да'}
        destructive={pendingConfirm?.destructive}
        onConfirm={() => pendingConfirm?.onConfirm()}
        onCancel={() => setPendingConfirm(null)}
      />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    intro: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
    sectionTitle: buttonLabelStyle({
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
      textAlign: 'left',
    }),
    sectionTitleSpaced: { marginTop: 8 },
    empty: { color: colors.textMuted, marginBottom: 12 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    kind: buttonLabelStyle({
      fontSize: 12,
      fontWeight: '600',
      color: colors.link,
      marginBottom: 6,
      textAlign: 'left',
    }),
    login: buttonLabelStyle({
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'left',
    }),
    meta: { marginTop: 4, color: colors.textSecondary },
    tariffName: buttonLabelStyle({
      marginTop: 8,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'left',
    }),
    date: { marginTop: 6, fontSize: 12, color: colors.textMuted },
    row: { flexDirection: 'row', gap: 10, marginTop: 12 },
    ok: { backgroundColor: colors.success, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
    okText: buttonLabelStyle({ color: colors.onPrimary, fontWeight: '600', fontSize: 14 }),
    no: {
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
    },
    noText: buttonLabelStyle({ color: colors.dangerText, fontWeight: '600', fontSize: 14 }),
  });
}
