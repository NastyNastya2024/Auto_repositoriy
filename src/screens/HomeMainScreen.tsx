import { Ionicons } from '@expo/vector-icons';
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

/** Что даёт «полный пакет документов» — короткие пункты под заголовком. */
const DOC_PACK_BULLETS: readonly string[] = [
  'Справки и бумаги по правилам автошколы.',
  'Маршруты и теория как на экзамене ГИБДД.',
  'Сопровождение до сдачи прав.',
];

export function HomeMainScreen() {
  const navigation = useNavigation<Nav>();
  const { state } = useApp();
  const { colors } = useTheme();
  const { width: winW, height: winH } = useWindowDimensions();
  /** Смещение фото вниз: сверху видна заливка «неба». */
  const carImageTop = Math.round(Math.min(140, Math.max(64, winH * 0.1)));
  const insets = useSafeAreaInsets();
  const tariffs = useMemo(() => state.tariffs.filter((t) => t.active), [state.tariffs]);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollBottomPad = 28;
  const scrollPad = 16;
  const tariffsSectionInnerW = winW - scrollPad * 2 - 16 * 2;
  const tariffCardWidth = Math.min(310, Math.max(240, tariffsSectionInnerW - 28));
  const instructorStacked = winW < 420;

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
          <View style={styles.card}>
            <View style={styles.instructorBlock}>
              <View
                style={[styles.instructorSpeechBand, instructorStacked && styles.instructorSpeechBandStacked]}
              >
                <View style={[styles.avatarColumn, instructorStacked && styles.avatarColumnStacked]}>
                  <View style={styles.avatarRing}>
                    <Image source={INSTRUCTOR_IMG} style={styles.avatar} resizeMode="cover" />
                  </View>
                </View>
                <View style={[styles.speechArea, instructorStacked && styles.speechAreaStacked]}>
                  <View style={styles.instructorBody}>
                    <Text style={styles.roleLabel}>Инструктор</Text>
                    <Text style={styles.name}>Эдуард Н.</Text>
                    <View style={styles.instructorMetaBlock}>
                      <Text style={styles.experienceLine}>Стаж 23 года ·</Text>
                      <Text style={styles.experienceLine}>Обучение на АКПП</Text>
                    </View>
                    <Text style={styles.phone}>8 903 252-52-32</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.examBanner}>
            <View style={styles.examBannerHeader}>
              <Text style={styles.examTitle}>Полный пакет документов</Text>
              <View style={styles.examTag}>
                <Text style={styles.examTagText}>как у автошколы</Text>
              </View>
            </View>
            <View style={styles.examBulletList}>
              {DOC_PACK_BULLETS.map((line, i) => (
                <View key={i} style={styles.examBulletRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.success}
                    style={styles.examBulletIcon}
                  />
                  <Text style={styles.examBulletText}>{line}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.tariffsSection}>
            <Text style={styles.sectionTitle}>Тарифы</Text>
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
                      <Text style={[styles.tariffMeta, styles.tariffMetaAfter]}>
                        Длительность: {t.durationMin} мин
                      </Text>
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
              minHeight: Math.max(winH * 0.58, 400),
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
      paddingTop: 6,
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 22,
      paddingHorizontal: 20,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#0f2133',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 4,
    },
    instructorBlock: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    /** Правая колонка по высоте тянется — аватар визуально центрируется рядом с текстом. */
    instructorSpeechBand: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    instructorSpeechBandStacked: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    avatarColumn: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingRight: 16,
    },
    avatarColumnStacked: {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      paddingRight: 0,
      marginBottom: 0,
    },
    speechArea: {
      flex: 1,
      minWidth: 0,
      paddingLeft: 6,
      paddingVertical: 2,
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    speechAreaStacked: {
      marginTop: 16,
      paddingLeft: 0,
      paddingVertical: 0,
      width: '100%',
    },
    /** Круглый аватар поменьше. */
    avatarRing: {
      padding: 3,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#0f2133',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.surfaceMuted,
    },
    instructorBody: {
      justifyContent: 'center',
      flex: 1,
      alignSelf: 'stretch',
      paddingVertical: 4,
      paddingHorizontal: 0,
      backgroundColor: colors.surface,
    },
    instructorMetaBlock: {
      marginTop: 6,
      gap: 5,
    },
    experienceLine: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    roleLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: 8,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    name: {
      fontSize: 23,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6,
      letterSpacing: -0.25,
    },
    phone: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.link,
      marginTop: 10,
      letterSpacing: 0.2,
    },
    /** Карточка «пакет документов»: иконка + заголовок слева, чип, список с зелёными галочками. */
    examBanner: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 20,
      paddingHorizontal: 20,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#0f2133',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 4,
    },
    examBannerHeader: {
      marginBottom: 18,
      alignSelf: 'stretch',
    },
    examTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.35,
      textAlign: 'left',
    },
    examTag: {
      alignSelf: 'flex-start',
      marginTop: 10,
      backgroundColor: colors.chip,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.primaryMuted,
    },
    examTagText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
      letterSpacing: 0.2,
    },
    examBulletList: {
      alignSelf: 'stretch',
      width: '100%',
      gap: 12,
    },
    examBulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    examBulletIcon: {
      marginRight: 10,
      marginTop: 0,
    },
    examBulletText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '500',
      color: colors.text,
    },
    tariffsSection: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 20,
      paddingHorizontal: 16,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      shadowColor: '#0f2133',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 16,
      letterSpacing: -0.35,
    },
    tariffRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingRight: 8,
      paddingBottom: 4,
    },
    /** Вложенная карточка тарифа: рамка, без тяжёлой тени. */
    tariffCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      marginRight: 12,
      justifyContent: 'space-between',
      minHeight: 272,
    },
    tariffCardBody: {
      flexShrink: 0,
    },
    tariffHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    tariffBadgeWrap: {
      backgroundColor: colors.chip,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    tariffBadge: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.15,
    },
    tariffPrice: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.2,
    },
    tariffName: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      letterSpacing: -0.2,
    },
    tariffDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 21,
      marginBottom: 10,
    },
    tariffMeta: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
    tariffMetaAfter: {
      marginTop: 6,
    },
    /** Контурная кнопка: белый фон, синяя рамка и текст. */
    tariffCta: {
      marginTop: 20,
      backgroundColor: colors.surface,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    tariffCtaPressed: { opacity: 0.85 },
    tariffCtaText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    carCardGlass: {
      alignSelf: 'stretch',
      width: '100%',
      borderRadius: 20,
      paddingVertical: 26,
      paddingHorizontal: 22,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#0f2133',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 4,
    },
    carTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8,
    },
    carSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 14,
    },
    carFacts: {
      gap: 8,
    },
    carFact: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
}
