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

/** Заливка под небо на иллюстрации (светлый голубой, как верх кадра). */
const CAR_SKY_FILL = '#c4e2fa';

export function HomeMainScreen() {
  const navigation = useNavigation<Nav>();
  const { state } = useApp();
  const { colors } = useTheme();
  const { width: winW, height: winH } = useWindowDimensions();
  /** Смещение фото вниз: сверху видна заливка «неба». */
  const carImageTop = Math.round(Math.min(140, Math.max(64, winH * 0.1)));
  const insets = useSafeAreaInsets();
  const tariffs = useMemo(
    () => [...state.tariffs].filter((t) => t.active).sort((a, b) => a.priceRub - b.priceRub),
    [state.tariffs],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollPad = 16;
  const scrollBottomPad = 28;
  const tariffsSectionInnerW = winW - scrollPad * 2 - 16 * 2;
  const tariffCardWidth = Math.min(310, Math.max(240, tariffsSectionInnerW - 28));

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom, backgroundColor: CAR_SKY_FILL }]}>
      <Image
        source={CAR_IMG}
        style={[styles.screenBgImage, { width: winW, height: winH, top: carImageTop }]}
        resizeMode="cover"
      />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.scrollTopMask}>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>Автоинструктор</Text>
            <View style={styles.akppBadge}>
              <Text style={styles.akppBadgeText}>АКПП</Text>
            </View>
          </View>

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
            <Pressable
              style={({ pressed }) => [styles.trialCta, pressed && styles.trialCtaPressed]}
              onPress={() => navigation.navigate('RegisterRequest')}
            >
              <Text style={styles.trialCtaText}>Записаться на пробный урок</Text>
            </Pressable>
          </View>

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

          <View style={styles.tariffsSection}>
            <Text style={styles.sectionTitle}>Тарифы</Text>
            <Text style={styles.sectionSub}>
              Выберите формат занятий — детали уточнит инструктор после входа.
            </Text>
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
          </View>
        </View>

        {/* Низ: фото видно на весь экран; стеклянная карточка поверх */}
        <View
          style={[
            styles.carOverPhoto,
            {
              minHeight: Math.max(winH * 0.52, 340),
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
        >
          <View style={styles.carCardGlass}>
            <Text style={styles.carTitle}>Škoda Octavia</Text>
            <Text style={styles.carSubtitle}>Учебная с АКПП</Text>
            <View style={styles.carFacts}>
              <Text style={styles.carFact}>• АКПП, знак «У», комфортный салон</Text>
              <Text style={styles.carFact}>• Регулярное ТО и страховка</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
    },
    screenBgImage: {
      position: 'absolute',
      left: 0,
      zIndex: 0,
    },
    scroll: {
      flex: 1,
      backgroundColor: 'transparent',
      zIndex: 1,
    },
    scrollInner: {
      paddingBottom: 0,
      flexGrow: 1,
    },
    scrollTopMask: {
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: 'transparent',
    },
    carOverPhoto: {
      alignSelf: 'stretch',
      width: '100%',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      paddingHorizontal: 16,
      paddingTop: 0,
    },
    heroTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingRight: 2,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
      flex: 1,
      textShadowColor: 'rgba(0,0,0,0.35)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    akppBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    akppBadgeText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.onPrimary,
      letterSpacing: 0.5,
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
    trialCta: {
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
    },
    trialCtaPressed: { opacity: 0.9 },
    trialCtaText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    examBanner: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 24,
      paddingHorizontal: 20,
      marginBottom: 22,
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
    tariffsSection: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      marginBottom: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
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
      paddingRight: 8,
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
    carCardGlass: {
      alignSelf: 'stretch',
      width: '100%',
      borderRadius: 20,
      paddingVertical: 18,
      paddingHorizontal: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.55)',
      shadowColor: '#0f2133',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 4,
    },
    carTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#ffffff',
      marginBottom: 4,
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    carSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.92)',
      marginBottom: 10,
      textShadowColor: 'rgba(0,0,0,0.35)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    carFacts: {
      gap: 4,
    },
    carFact: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.95)',
      lineHeight: 18,
      textShadowColor: 'rgba(0,0,0,0.35)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
  });
}
