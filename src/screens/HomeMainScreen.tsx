import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  Image,
  Platform,
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
import { useApp } from '../context/AppContext';
import { TariffCard } from '../components/TariffCard';
import { useTheme } from '../context/ThemeContext';
import type { AuthStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'HomeMain'>;

const INSTRUCTOR_IMG = require('../../assets/onboarding-instructor.png');
const CAR_IMG = require('../../assets/hero-car-centered.png');

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
  const isWebDesktop = Platform.OS === 'web' && winW >= 900;
  const sectionGap = isWebDesktop ? 18 : 12;
  const insets = useSafeAreaInsets();
  const tariffs = useMemo(() => state.tariffs.filter((t) => t.active), [state.tariffs]);
  const styles = useMemo(() => createStyles(colors, isWebDesktop), [colors, isWebDesktop]);
  const scrollBottomPad = 28;
  const scrollPad = 16;
  const tariffsSectionInnerW = winW - scrollPad * 2 - 16 * 2;
  const tariffCardWidth = Math.min(310, Math.max(240, tariffsSectionInnerW - 28));
  const instructorStacked = winW < 420;

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom, backgroundColor: colors.bg }]}>
      <Image
        source={CAR_IMG}
        style={[
          styles.screenBgImage,
          { width: winW, height: winH },
          Platform.OS === 'web' ? ({ objectPosition: 'center' } as any) : null,
        ]}
        resizeMode="cover"
      />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.scrollTopMask}>
          <View style={[styles.topStack, { gap: sectionGap }]}>
            <View style={styles.webTopRow}>
              <View style={[styles.card, styles.webTopCol, isWebDesktop && { marginBottom: 0 }]}>
                <View style={styles.instructorBlock}>
                <View
                  style={[
                    styles.instructorSpeechBand,
                    instructorStacked ? styles.instructorSpeechBandMobile : null,
                  ]}
                >
                  <View style={[styles.avatarColumn, instructorStacked ? styles.avatarColumnMobile : null]}>
                      <View style={styles.avatarRing}>
                        <Image source={INSTRUCTOR_IMG} style={styles.avatar} resizeMode="cover" />
                      </View>
                    </View>
                  <View
                    style={[
                      styles.speechArea,
                      instructorStacked ? styles.speechAreaMobile : null,
                    ]}
                  >
                      <View style={styles.instructorBody}>
                        <Text style={styles.roleLabel}>Инструктор</Text>
                        <Text style={styles.name}>Эдуард Н.</Text>
                        <View style={styles.instructorMetaBlock}>
                          <Text style={styles.experienceLine}>Стаж 23 года ·</Text>
                          <Text style={styles.experienceLine}>Обучение на АКПП</Text>
                        </View>
                        <Text style={styles.phone}>8 903 252-52-32</Text>
                        <Pressable style={styles.instructorCta} onPress={() => navigation.navigate('RegisterRequest')}>
                          <Text style={styles.instructorCtaText}>Отправить заявку</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.examBanner, styles.webTopCol, isWebDesktop && { marginBottom: 0 }]}>
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
            </View>

            <View style={[styles.tariffsSection, { marginBottom: 0 }]}>
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
                  <TariffCard
                    key={t.id}
                    tariff={t}
                    colors={colors}
                    cardWidth={tariffCardWidth}
                    onPressCta={() => navigation.navigate('RegisterRequest')}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Низ: фото видно на весь экран; стеклянная карточка поверх */}
        <View
          style={[
            styles.carOverPhoto,
            {
              minHeight: Math.max(winH * 0.58, 400),
              marginTop: sectionGap,
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

function createStyles(colors: ThemeColors, isWebDesktop: boolean) {
  const s = isWebDesktop ? 1.12 : 1;
  const px = (n: number) => Math.round(n * s);

  return StyleSheet.create({
    topStack: {
      alignSelf: 'stretch',
      width: '100%',
    },
    screen: {
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
    },
    screenBgImage: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignSelf: 'center',
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
      paddingHorizontal: isWebDesktop ? 18 : 12,
      // Делаем верхний отступ таким же, как межсекционный gap на мобилке,
      // чтобы расстояние "до первой плашки" совпадало с расстоянием "после неё".
      paddingTop: isWebDesktop ? 16 : 12,
      backgroundColor: 'transparent',
    },
    webTopRow: {
      flexDirection: isWebDesktop ? 'row' : 'column',
      alignItems: 'stretch',
      gap: isWebDesktop ? 18 : 12,
    },
    webTopCol: {
      flex: isWebDesktop ? 1 : undefined,
      marginBottom: isWebDesktop ? 0 : undefined,
    },
    carOverPhoto: {
      alignSelf: 'stretch',
      width: '100%',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      paddingHorizontal: isWebDesktop ? 18 : 12,
      paddingTop: 0,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: px(20),
      paddingVertical: px(18),
      paddingHorizontal: px(18),
      marginBottom: isWebDesktop ? 18 : 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#0f2133',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 4,
      ...(isWebDesktop ? ({ alignSelf: 'center', width: '100%', maxWidth: 980 } as const) : null),
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
    instructorSpeechBandMobile: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarColumn: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingRight: px(16),
    },
    avatarColumnMobile: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingRight: px(14),
    },
    speechArea: {
      flex: 1,
      minWidth: 0,
      paddingLeft: px(6),
      paddingVertical: px(2),
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    speechAreaMobile: {
      paddingLeft: 0,
      paddingVertical: 0,
    },
    /** Круглый аватар поменьше. */
    avatarRing: {
      padding: px(3),
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
      width: px(96),
      height: px(96),
      borderRadius: px(48),
      backgroundColor: colors.surfaceMuted,
    },
    instructorBody: {
      justifyContent: 'center',
      flex: 1,
      alignSelf: 'stretch',
      alignItems: 'flex-start',
      paddingVertical: 4,
      paddingHorizontal: 0,
      backgroundColor: colors.surface,
    },
    instructorMetaBlock: {
      marginTop: px(6),
      gap: px(5),
    },
    experienceLine: {
      fontSize: px(14),
      fontWeight: '600',
      color: colors.textSecondary,
      lineHeight: px(20),
      textAlign: 'left',
    },
    roleLabel: {
      fontSize: px(12),
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: px(8),
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      textAlign: 'left',
    },
    name: {
      fontSize: px(23),
      fontWeight: '800',
      color: colors.text,
      marginBottom: px(6),
      letterSpacing: -0.25,
      textAlign: 'left',
    },
    phone: {
      fontSize: px(16),
      fontWeight: '700',
      color: colors.link,
      marginTop: px(10),
      letterSpacing: 0.2,
      textAlign: 'left',
    },
    instructorCta: {
      marginTop: px(14),
      backgroundColor: '#ffffff',
      borderRadius: px(14),
      paddingHorizontal: px(16),
      paddingVertical: px(12),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#0f2133',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    instructorCtaText: {
      color: colors.link,
      fontWeight: '800',
      fontSize: px(14),
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    /** Карточка «пакет документов»: иконка + заголовок слева, чип, список с зелёными галочками. */
    examBanner: {
      backgroundColor: colors.surface,
      borderRadius: px(20),
      paddingVertical: px(20),
      paddingHorizontal: px(20),
      marginBottom: isWebDesktop ? 18 : 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#0f2133',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 4,
    },
    examBannerHeader: {
      marginBottom: px(18),
      alignSelf: 'stretch',
    },
    examTitle: {
      fontSize: px(20),
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.35,
      textAlign: 'left',
    },
    examTag: {
      alignSelf: 'flex-start',
      marginTop: px(10),
      backgroundColor: colors.chip,
      paddingHorizontal: px(12),
      paddingVertical: px(6),
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.primaryMuted,
    },
    examTagText: {
      fontSize: px(13),
      fontWeight: '600',
      color: colors.primary,
      letterSpacing: 0.2,
    },
    examBulletList: {
      alignSelf: 'stretch',
      width: '100%',
      gap: px(12),
    },
    examBulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    examBulletIcon: {
      marginRight: px(10),
      marginTop: 0,
    },
    examBulletText: {
      flex: 1,
      fontSize: px(14),
      lineHeight: px(22),
      fontWeight: '500',
      color: colors.text,
    },
    tariffsSection: {
      backgroundColor: colors.surface,
      borderRadius: px(20),
      paddingVertical: px(20),
      paddingHorizontal: px(16),
      marginBottom: isWebDesktop ? 18 : 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      shadowColor: '#0f2133',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: px(22),
      fontWeight: '800',
      color: colors.text,
      marginBottom: px(16),
      letterSpacing: -0.35,
    },
    tariffRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingRight: px(8),
      paddingBottom: px(4),
    },
    carCardGlass: {
      alignSelf: 'stretch',
      width: '100%',
      borderRadius: px(20),
      paddingVertical: px(26),
      paddingHorizontal: px(22),
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
      fontSize: px(20),
      fontWeight: '800',
      color: colors.text,
      marginBottom: px(8),
    },
    carSubtitle: {
      fontSize: px(14),
      color: colors.textSecondary,
      marginBottom: px(14),
    },
    carFacts: {
      gap: px(8),
    },
    carFact: {
      fontSize: px(13),
      color: colors.textSecondary,
      lineHeight: px(18),
    },
  });
}
