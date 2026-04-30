import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tariffTypeLabel, useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { ADMIN_ID } from '../../data/seed';
import type { ThemeColors } from '../../theme';
import type { Booking } from '../../types';

/** Записи, которые админ подтвердил («Записи» → Подтвердить) или уже завершил. */
function countAdminApprovedLessonsForTariff(
  bookings: Booking[],
  studentId: string,
  assignedTariffId: string | undefined,
): number {
  if (!assignedTariffId) return 0;
  return bookings.filter(
    (b) =>
      b.userId === studentId &&
      b.tariffId === assignedTariffId &&
      (b.status === 'booked' || b.status === 'completed'),
  ).length;
}

function BottomSheetLayout({
  visible,
  onClose,
  title,
  hint,
  keyboard,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  hint?: string;
  keyboard?: boolean;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: screenWidth } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && screenWidth >= 900;
  const sheetBody = (
    <>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          isWebDesktop ? styles.sideSheet : null,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        {isWebDesktop ? null : <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />}
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.sheetCloseHit}>
            <Text style={[styles.sheetClose, { color: colors.link }]}>Закрыть</Text>
          </Pressable>
        </View>
        {hint ? (
          <Text style={[styles.sheetHint, { color: colors.textSecondary }]}>{hint}</Text>
        ) : null}
        {children}
      </View>
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {keyboard ? (
        <KeyboardAvoidingView
          style={[styles.modalRoot, isWebDesktop ? styles.modalRootSide : null]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {sheetBody}
        </KeyboardAvoidingView>
      ) : (
        <View style={[styles.modalRoot, isWebDesktop ? styles.modalRootSide : null]}>{sheetBody}</View>
      )}
    </Modal>
  );
}

export function AdminUsersScreen() {
  const { state, addUser, removeUser, toggleBlockUser, setStudentAdminNote, setStudentAssignedTariff } =
    useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newStudentTariffId, setNewStudentTariffId] = useState<string>('');

  const activeTariffs = useMemo(() => state.tariffs.filter((t) => t.active), [state.tariffs]);
  const students = state.users.filter((u) => u.role === 'student');
  const detailUser = detailStudentId
    ? state.users.find((u) => u.id === detailStudentId && u.role === 'student')
    : undefined;

  useEffect(() => {
    if (activeTariffs.length === 0) {
      setNewStudentTariffId('');
      return;
    }
    if (!activeTariffs.some((t) => t.id === newStudentTariffId)) {
      setNewStudentTariffId(activeTariffs[0].id);
    }
  }, [activeTariffs, newStudentTariffId]);

  useEffect(() => {
    if (detailStudentId && !state.users.some((u) => u.id === detailStudentId)) {
      setDetailStudentId(null);
    }
  }, [detailStudentId, state.users]);

  const closeAddStudentSheet = () => setAddStudentOpen(false);

  const submitNewStudent = () => {
    const err = addUser({
      name: name || 'Ученик',
      login,
      password,
      phone: phone || undefined,
      email: email || undefined,
      role: 'student',
      assignedTariffId: newStudentTariffId,
    });
    if (err) {
      Alert.alert('Ошибка', err);
      return;
    }
    setName('');
    setLogin('');
    setPassword('');
    setPhone('');
    setEmail('');
    setNewStudentTariffId(activeTariffs[0]?.id ?? '');
    closeAddStudentSheet();
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable style={styles.openSheetBtn} onPress={() => setAddStudentOpen(true)}>
          <Text style={styles.openSheetBtnText}>+ Добавить ученика</Text>
        </Pressable>

        <Text style={[styles.section, { marginTop: 4 }]}>Ученики</Text>
        {students.map((u) => {
          const currentTariff = u.assignedTariffId
            ? state.tariffs.find((t) => t.id === u.assignedTariffId)
            : undefined;
          return (
            <Pressable key={u.id} style={styles.listRow} onPress={() => setDetailStudentId(u.id)}>
              <View style={styles.listRowMain}>
                <Text style={styles.name} numberOfLines={1}>
                  {u.name}
                </Text>
                <Text style={styles.listRowSub} numberOfLines={1}>
                  {currentTariff
                    ? `${currentTariff.name} · ${u.blocked ? 'заблокирован' : 'активен'}`
                    : `${u.blocked ? 'Заблокирован' : 'Активен'} · тариф не назначен`}
                </Text>
              </View>
              <Text style={styles.listRowChevron}>›</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <BottomSheetLayout
        visible={addStudentOpen}
        onClose={closeAddStudentSheet}
        title="Новый ученик"
        hint="Создание учётной записи вручную. Тариф обязателен для записи на занятия."
        keyboard
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScrollContent}
        >
          <TextInput
            style={styles.input}
            placeholder="Имя"
            placeholderTextColor={colors.placeholder}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Логин"
            placeholderTextColor={colors.placeholder}
            value={login}
            onChangeText={setLogin}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Пароль"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Телефон"
            placeholderTextColor={colors.placeholder}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Почта (необязательно)"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.tariffLabel}>Тариф (обязательно)</Text>
          {activeTariffs.length === 0 ? (
            <Text style={styles.warn}>Сначала включите тарифы в разделе «Тарифы».</Text>
          ) : (
            <View style={styles.tariffChips}>
              {activeTariffs.map((t) => {
                const on = newStudentTariffId === t.id;
                return (
                  <Pressable
                    key={t.id}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => setNewStudentTariffId(t.id)}
                  >
                    <Text style={[styles.chipTitle, on && styles.chipTitleOn]} numberOfLines={2}>
                      {t.name}
                    </Text>
                    <Text style={[styles.chipMeta, on && styles.chipMetaOn]}>
                      {tariffTypeLabel(t.type)} · {t.priceRub.toLocaleString('ru-RU')} ₽
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Pressable
            style={[
              styles.addBtn,
              (activeTariffs.length === 0 || !newStudentTariffId) && styles.addBtnDisabled,
            ]}
            disabled={activeTariffs.length === 0 || !newStudentTariffId}
            onPress={submitNewStudent}
          >
            <Text style={styles.addBtnText}>Добавить учётную запись</Text>
          </Pressable>
        </ScrollView>
      </BottomSheetLayout>

      <BottomSheetLayout
        visible={detailUser != null}
        onClose={() => setDetailStudentId(null)}
        title={detailUser?.name ?? 'Ученик'}
        hint="Данные учётной записи, тариф и заметки. Счётчик уроков — по текущему закреплённому тарифу."
      >
        {detailUser ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetScrollContentDetail}
          >
            {(() => {
              const u = detailUser;
              const currentTariff = u.assignedTariffId
                ? state.tariffs.find((t) => t.id === u.assignedTariffId)
                : undefined;
              const approvedCount = countAdminApprovedLessonsForTariff(
                state.bookings,
                u.id,
                u.assignedTariffId,
              );
              return (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Аккаунт</Text>
                    <View style={styles.detailCard}>
                      <View style={styles.kvStack}>
                        <Text style={styles.kvLabel}>Логин</Text>
                        <Text style={styles.kvValue} selectable>
                          {u.login}
                        </Text>
                      </View>
                      <View style={styles.kvStack}>
                        <Text style={styles.kvLabel}>Пароль</Text>
                        <Text style={styles.kvValue} selectable>
                          {u.password}
                        </Text>
                      </View>
                      {u.phone ? (
                        <View style={styles.kvStack}>
                          <Text style={styles.kvLabel}>Телефон</Text>
                          <Text style={styles.kvValue} selectable>
                            {u.phone}
                          </Text>
                        </View>
                      ) : null}
                      {u.email ? (
                        <View style={styles.kvStack}>
                          <Text style={styles.kvLabel}>Почта</Text>
                          <Text style={styles.kvValue} selectable>
                            {u.email}
                          </Text>
                        </View>
                      ) : null}
                      <View style={[styles.kvStack, styles.kvStackLast]}>
                        <Text style={styles.kvLabel}>Статус</Text>
                        <View
                          style={[
                            styles.statusPill,
                            u.blocked ? styles.statusPillBlocked : styles.statusPillOk,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              u.blocked ? styles.statusPillTextBlocked : styles.statusPillTextOk,
                            ]}
                          >
                            {u.blocked ? 'Заблокирован' : 'Активен'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Тариф и уроки</Text>
                    <Text style={styles.detailBody}>
                      {currentTariff
                        ? `${currentTariff.name} — ${currentTariff.priceRub.toLocaleString('ru-RU')} ₽`
                        : 'Тариф не назначен. Запись на занятия недоступна.'}
                    </Text>
                    {u.assignedTariffId ? (
                      <View style={styles.approvedStat}>
                        <Text style={styles.approvedStatValue}>
                          Подтверждено уроков: {approvedCount}
                          {currentTariff?.lessonsCount != null
                            ? ` из ${currentTariff.lessonsCount}`
                            : ''}
                        </Text>
                        {!currentTariff ? (
                          <Text style={styles.approvedStatHint}>
                            Тариф не найден в справочнике — назначьте актуальный тариф. Счётчик относится к
                            текущему закреплённому id.
                          </Text>
                        ) : (
                          <Text style={styles.approvedStatHint}>
                            Учитываются записи в разделе «Записи» со статусом подтверждена или завершена,
                            оформленные с этим тарифом.
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.metaDim}>
                        После назначения тарифа здесь появится число подтверждённых уроков по нему.
                      </Text>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Сменить тариф</Text>
                    {activeTariffs.length > 0 ? (
                      <View style={styles.tariffChipsDetail}>
                        {activeTariffs.map((t) => {
                          const on = u.assignedTariffId === t.id;
                          return (
                            <Pressable
                              key={t.id}
                              style={[styles.chipSmallDetail, on && styles.chipOn]}
                              onPress={() => setStudentAssignedTariff(u.id, t.id)}
                            >
                              <Text
                                style={[styles.chipSmallTextDetail, on && styles.chipSmallTextOn]}
                                numberOfLines={2}
                              >
                                {t.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                        <Pressable
                          style={[styles.chipSmallDetail, styles.chipDanger]}
                          onPress={() =>
                            Alert.alert(
                              'Снять тариф?',
                              'Ученик не сможет записываться, пока снова не выберете тариф.',
                              [
                                { text: 'Отмена', style: 'cancel' },
                                {
                                  text: 'Снять',
                                  style: 'destructive',
                                  onPress: () => setStudentAssignedTariff(u.id, undefined),
                                },
                              ],
                            )
                          }
                        >
                          <Text style={styles.chipDangerText}>Снять тариф</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.warn}>Нет активных тарифов для выбора.</Text>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Комментарий</Text>
                    <TextInput
                      style={styles.noteInputDetail}
                      placeholder="Заметки об ученике, договорённости…"
                      placeholderTextColor={colors.placeholder}
                      value={u.adminNote ?? ''}
                      onChangeText={(t) => setStudentAdminNote(u.id, t)}
                      multiline
                    />
                  </View>

                  <View style={styles.detailActionsRow}>
                    <Pressable
                      style={[styles.actionBtnSecondary, styles.actionBtnFlex]}
                      onPress={() => toggleBlockUser(u.id)}
                    >
                      <Text style={styles.actionBtnSecondaryText}>
                        {u.blocked ? 'Разблокировать' : 'Заблокировать'}
                      </Text>
                    </Pressable>
                    {u.id !== ADMIN_ID ? (
                      <Pressable
                        style={[styles.actionBtnDanger, styles.actionBtnFlex]}
                        onPress={() =>
                          Alert.alert('Удалить пользователя?', u.name, [
                            { text: 'Отмена', style: 'cancel' },
                            {
                              text: 'Удалить',
                              style: 'destructive',
                              onPress: () => {
                                removeUser(u.id);
                                setDetailStudentId(null);
                              },
                            },
                          ])
                        }
                      >
                        <Text style={styles.actionBtnDangerText}>Удалить</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </>
              );
            })()}
          </ScrollView>
        ) : null}
      </BottomSheetLayout>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    openSheetBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    openSheetBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
    modalRoot: { flex: 1, justifyContent: 'flex-end' },
    modalRootSide: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-end' },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      maxHeight: '92%',
    },
    sideSheet: {
      width: '50%',
      maxWidth: 560,
      minWidth: 380,
      height: '100%',
      maxHeight: '100%',
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
      borderTopWidth: 0,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.border,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      marginTop: 12,
      marginBottom: 10,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    sheetTitle: { fontSize: 20, fontWeight: '700', flex: 1, paddingRight: 12 },
    sheetCloseHit: { paddingVertical: 4, paddingLeft: 8 },
    sheetClose: { fontSize: 16, fontWeight: '600' },
    sheetHint: {
      fontSize: 14,
      lineHeight: 21,
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    sheetScrollContent: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 36 },
    sheetScrollContentDetail: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
    detailSection: { marginBottom: 28 },
    detailSectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      letterSpacing: -0.2,
    },
    detailCard: {
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    kvStack: { marginBottom: 16 },
    kvStackLast: { marginBottom: 0 },
    kvLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    kvValue: { fontSize: 16, color: colors.text, lineHeight: 22, fontWeight: '500' },
    statusPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    statusPillOk: { backgroundColor: colors.chip },
    statusPillBlocked: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.dangerBorder },
    statusPillText: { fontSize: 14, fontWeight: '600' },
    statusPillTextOk: { color: colors.success },
    statusPillTextBlocked: { color: colors.dangerText },
    detailBody: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: 14,
    },
    tariffChipsDetail: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, rowGap: 12 },
    chipSmallDetail: {
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: colors.chip,
      borderWidth: 2,
      borderColor: 'transparent',
      maxWidth: '100%',
    },
    chipSmallTextDetail: { fontSize: 13, fontWeight: '600', color: colors.text },
    noteInputDetail: {
      minHeight: 100,
      maxHeight: 180,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      lineHeight: 22,
      backgroundColor: colors.inputBg,
      color: colors.text,
      textAlignVertical: 'top',
    },
    detailActionsRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 4 },
    actionBtnFlex: { flex: 1, minWidth: 120 },
    actionBtnSecondary: {
      backgroundColor: colors.chip,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionBtnSecondaryText: { fontWeight: '700', fontSize: 15, color: colors.text },
    actionBtnDanger: {
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.surface,
    },
    actionBtnDangerText: { fontWeight: '700', fontSize: 15, color: colors.dangerText },
    section: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: colors.text },
    listRow: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    listRowMain: { flex: 1, minWidth: 0 },
    listRowSub: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
    listRowChevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
    tariffLabel: {
      marginTop: 8,
      marginBottom: 12,
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },
    warn: { color: colors.dangerText, marginTop: 4, marginBottom: 12, lineHeight: 22, fontSize: 14 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 15,
      marginBottom: 14,
      fontSize: 16,
      backgroundColor: colors.inputBg,
      color: colors.text,
    },
    tariffChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      rowGap: 14,
      marginBottom: 12,
    },
    chip: {
      width: '48%',
      flexGrow: 1,
      maxWidth: '100%',
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.chip,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    chipOn: {
      backgroundColor: colors.chipOn,
      borderColor: colors.primary,
    },
    chipTitle: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 19 },
    chipTitleOn: { color: colors.chipOnText },
    chipMeta: { marginTop: 8, fontSize: 12, color: colors.textMuted, lineHeight: 16 },
    chipMetaOn: { color: colors.textSecondary },
    chipSmall: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.chip,
      borderWidth: 2,
      borderColor: 'transparent',
      maxWidth: '100%',
    },
    chipSmallText: { fontSize: 12, fontWeight: '600', color: colors.text },
    chipSmallTextOn: { color: colors.chipOnText },
    chipDanger: { borderColor: colors.dangerBorder, backgroundColor: colors.surface },
    chipDangerText: { fontSize: 12, fontWeight: '600', color: colors.dangerText },
    addBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 12,
    },
    addBtnDisabled: { opacity: 0.45 },
    addBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
    name: { fontSize: 16, fontWeight: '700', color: colors.text },
    meta: { marginTop: 4, color: colors.textMuted },
    metaDim: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
    approvedStat: {
      marginTop: 4,
      padding: 16,
      borderRadius: 14,
      backgroundColor: colors.chip,
      borderWidth: 1,
      borderColor: colors.border,
    },
    approvedStatValue: { fontSize: 16, fontWeight: '700', color: colors.text, lineHeight: 22 },
    approvedStatHint: { marginTop: 10, fontSize: 13, lineHeight: 19, color: colors.textMuted },
    noteLabel: {
      marginTop: 10,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    noteInput: {
      marginTop: 6,
      minHeight: 72,
      maxHeight: 140,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 10,
      backgroundColor: colors.inputBg,
      color: colors.text,
      textAlignVertical: 'top',
    },
    row: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
    small: { backgroundColor: colors.chip, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    smallText: { fontWeight: '600', color: colors.text },
    danger: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
    },
    dangerText: { color: colors.dangerText, fontWeight: '600' },
  });
}
