import { useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tariffTypeLabel, useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import type { AuthStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme';
import { formatRub } from '../utils/format';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'HomeMain'>;

const INSTRUCTOR_IMG = require('../../assets/onboarding-instructor.png');
const CAR_IMG = require('../../assets/onboarding-car.png');

export function HomeMainScreen() {
  const navigation = useNavigation<Nav>();
  const { state } = useApp();
  const { colors } = useTheme();
  const { width: winW } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tariffs = useMemo(
    () => [...state.tariffs].filter((t) => t.active).sort((a, b) => a.priceRub - b.priceRub),
    [state.tariffs],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tariffCardWidth = Math.min(340, Math.max(260, winW - 56));

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollInner}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageLead}>Автоинструктор · АКПП</Text>

        {/* Инструктор */}
        <View style={styles.card}>
          <View style={styles.instructorRow}>
            <Image source={INSTRUCTOR_IMG} style={styles.avatar} resizeMode="cover" />
            <View style={styles.instructorBody}>
              <Text style={styles.roleLabel}>Инструктор</Text>
              <Text style={styles.name}>Эдуард Н.</Text>
              <Text style={styles.phone}>8 903 252-52-32</Text>
              <Text style={styles.carHint}>Skoda Octavia</Text>
            </View>
          </View>
        </View>

        {/* Плашка до экзамена */}
        <View style={styles.examBanner}>
          <Text style={styles.examTitle}>Доведение до экзамена</Text>
          <Text style={styles.examText}>
            Пошаговая подготовка под требования ГИБДД: городские маршруты, типовые ошибки, внутренний
            экзамен и спокойное сопровождение до успешной сдачи. Занятия строятся под ваш темп и
            график.
          </Text>
          <View style={styles.examPills}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Маршруты</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Разбор ошибок</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Сопровождение</Text>
            </View>
          </View>
        </View>

        {/* Тарифы */}
        <Text style={styles.sectionTitle}>Тарифы</Text>
        <Text style={styles.sectionSub}>Выберите формат занятий — детали уточнит инструктор после входа.</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={styles.tariffRow}
          decelerationRate="fast"
          snapToInterval={tariffCardWidth + 12}
          snapToAlignment="start"
          keyboardShouldPersistTaps="handled"
        >
          {tariffs.map((t) => (
            <View key={t.id} style={[styles.tariffCard, { width: tariffCardWidth }]}>
              <View style={styles.tariffCardBody}>
                <View style={styles.tariffHead}>
                  <View style={styles.tariffBadgeWrap}>
                    <Text style={styles.tariffBadge}>{tariffTypeLabel(t.type)}</Text>
                  </View>
                  <Text style={styles.tariffPrice}>{formatRub(t.priceRub)}</Text>
                </View>
                <Text style={styles.tariffName}>{t.name}</Text>
                <Text style={styles.tariffDesc}>{t.description}</Text>
                {t.lessonsCount != null && (
                  <Text style={styles.tariffMeta}>Занятий в пакете: {t.lessonsCount}</Text>
                )}
                {t.durationMin != null && (
                  <Text style={styles.tariffMeta}>Длительность: {t.durationMin} мин</Text>
                )}
              </View>
              <Pressable
                style={({ pressed }) => [styles.tariffCta, pressed && styles.tariffCtaPressed]}
                onPress={() => navigation.navigate('RegisterRequest')}
              >
                <Text style={styles.tariffCtaText}>Отправить заявку</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {/* Автомобиль */}
        <View style={styles.carBlock}>
          <Text style={styles.sectionTitle}>Автомобиль</Text>
          <View style={[styles.carImageWrap, { maxWidth: winW - 32 }]}>
            <Image source={CAR_IMG} style={styles.carImage} resizeMode="cover" />
          </View>
          <View style={styles.carCard}>
            <Text style={styles.carTitle}>Škoda Octavia</Text>
            <Text style={styles.carSubtitle}>Учебный автомобиль с АКПП</Text>
            <View style={styles.carFacts}>
              <Text style={styles.carFact}>• Коробка: автомат (АКПП)</Text>
              <Text style={styles.carFact}>• Знак «У» на крыше — учебная езда по правилам</Text>
              <Text style={styles.carFact}>• Комфортный салон и хороший обзор для новичков</Text>
              <Text style={styles.carFact}>• Регулярное техобслуживание и страховка</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.loginCta, pressed && styles.loginCtaPressed]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginCtaText}>Войти в приложение</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollInner: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 28,
    },
    pageLead: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 14,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      marginBottom: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    instructorRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      marginRight: 14,
      backgroundColor: colors.surfaceMuted,
    },
    instructorBody: {
      flex: 1,
      minWidth: 0,
    },
    roleLabel: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 4,
    },
    name: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    phone: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.link,
      marginBottom: 4,
    },
    carHint: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    examBanner: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 24,
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    examTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.onPrimary,
      marginBottom: 10,
      letterSpacing: -0.3,
    },
    examText: {
      fontSize: 15,
      lineHeight: 22,
      color: 'rgba(255,255,255,0.92)',
      marginBottom: 16,
    },
    examPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pill: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    pillText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onPrimary,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6,
      letterSpacing: -0.3,
    },
    sectionSub: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: 14,
    },
    tariffRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingRight: 16,
      marginBottom: 28,
    },
    tariffCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginRight: 12,
      justifyContent: 'space-between',
      minHeight: 220,
    },
    tariffCardBody: {
      flexShrink: 0,
    },
    tariffHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    tariffBadgeWrap: {
      backgroundColor: colors.chipOn,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    tariffBadge: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.chipOnText,
    },
    tariffPrice: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
    },
    tariffName: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    tariffDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    tariffMeta: {
      fontSize: 13,
      color: colors.textMuted,
    },
    tariffCta: {
      marginTop: 14,
      backgroundColor: colors.surface,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    tariffCtaPressed: { opacity: 0.88 },
    tariffCtaText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    carBlock: {
      marginBottom: 24,
    },
    carImageWrap: {
      alignSelf: 'center',
      width: '100%',
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 14,
      backgroundColor: colors.surfaceMuted,
    },
    carImage: {
      width: '100%',
      aspectRatio: 9 / 16,
      maxHeight: 340,
    },
    carCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    carTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    carSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    carFacts: {
      gap: 6,
    },
    carFact: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    loginCta: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    loginCtaPressed: { opacity: 0.9 },
    loginCtaText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
