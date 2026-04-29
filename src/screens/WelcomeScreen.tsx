import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Image,
  type ImageStyle,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import type { AuthStackParamList } from '../navigation/types';
import { lightColors } from '../theme';
import { applyWebDocumentLightTheme } from '../utils/webDocumentTheme';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const CAR_IMG = require('../../assets/hero-car-centered.png');
const INSTRUCTOR_IMG = require('../../assets/onboarding-instructor.png');

const SKY = lightColors.bg;
const TEXT = lightColors.text;
const ACCENT = lightColors.primary;
const ON_ACCENT = lightColors.onPrimary;
const RIM_LIGHT = 'rgba(255, 255, 255, 0.92)';
const MUTED = lightColors.textMuted;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const layout = useWindowDimensions();
  const [webSize, setWebSize] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: layout.width, height: layout.height };
  });
  const w = Platform.OS === 'web' ? webSize.width : layout.width;
  const h = Platform.OS === 'web' ? webSize.height : layout.height;
  const isWeb = Platform.OS === 'web';
  const isWebDesktop = isWeb && w >= 900;
  const isMobileLayout = !isWebDesktop;
  // Для мобилки используем размеры layout (viewport), а не Dimensions.get('screen'),
  // чтобы cover-центрирование не "уезжало" на некоторых девайсах/в web-emulation.
  const bgW = Platform.OS === 'web' ? webSize.width : layout.width;
  const bgH = Platform.OS === 'web' ? webSize.height : layout.height;
  const styles = useMemo(() => createStyles(w, h, isWebDesktop), [w, h, isWebDesktop]);

  useEffect(() => {
    applyWebDocumentLightTheme();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    let raf = 0;
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setWebSize({ width: window.innerWidth, height: window.innerHeight });
      });
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
      headerTitle: '',
      title: '',
      statusBarStyle: 'dark',
      ...(Platform.OS === 'android'
        ? { navigationBarColor: SKY, navigationBarTranslucent: false }
        : {}),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor(SKY);
        StatusBar.setBarStyle('dark-content', true);
      }
      return () => {};
    }, []),
  );

  const rootExtra =
    Platform.OS === 'web'
      ? ({ width: '100%' as const, minHeight: h, minWidth: w } as const)
      : { width: bgW, height: bgH };
  const imageExtra: ImageStyle =
    Platform.OS === 'web'
      ? ({
          // На web `Image` лучше ведёт себя с явными размерами.
          width: bgW,
          height: bgH,
          // Дополнительно фиксируем центрирование объекта (react-native-web).
          objectPosition: 'center',
        } as any)
      : ({ width: bgW, height: bgH } as const);

  return (
    <View style={[styles.root, rootExtra]}>
      {__DEV__ && Platform.OS !== 'web' ? (
        <View style={styles.devMarker} accessibilityLabel="Маркер отладки: виден только в режиме разработки" />
      ) : null}
      <ExpoStatusBar style="dark" backgroundColor={SKY} translucent={false} />
      <Image
        source={CAR_IMG}
        style={[
          styles.fullImage,
          imageExtra,
          // Фиксируем строгое центрирование по горизонтали на любых экранах.
          { left: 0, right: 0, alignSelf: 'center' },
        ]}
        resizeMode="cover"
        accessibilityLabel="Учебный автомобиль на дороге"
      />
      <SafeAreaView style={styles.safe} pointerEvents="box-none" edges={['top', 'left', 'right', 'bottom']}>
        <View style={[styles.column, { minHeight: h }]} pointerEvents="box-none">
          {isWebDesktop ? (
            <View style={[styles.centerStack, styles.centerStackWeb]}>
              <View style={styles.topBlock}>
                <View style={styles.headerCluster}>
                  <Text
                    style={[
                      styles.appTitle,
                      // На web-десктопе заголовок не должен переноситься на 2 строки.
                      isWebDesktop ? ({ whiteSpace: 'nowrap' } as any) : null,
                    ]}
                    // Заголовок должен всегда помещаться целиком, без сокращений и переноса.
                    numberOfLines={1}
                    ellipsizeMode="clip"
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.72}
                    maxFontSizeMultiplier={1.35}
                    allowFontScaling={true}
                    {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                  >
                    Автоинструктор
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>АКПП</Text>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Image
                    source={INSTRUCTOR_IMG}
                    style={styles.avatar}
                    resizeMode="cover"
                    accessibilityLabel="Инструктор за рулём"
                  />
                  <View style={styles.cardBody}>
                    <Text style={styles.roleLabel}>Инструктор</Text>
                    <Text style={styles.name}>Эдуард Н.</Text>
                    <Text style={styles.experience}>Стаж 23 года</Text>
                    <Text style={styles.phone}>8 903 252-52-32</Text>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                  onPress={() => navigation.navigate('HomeMain')}
                  accessibilityRole="button"
                  accessibilityLabel="Перейти к входу"
                >
                  <Text style={styles.ctaText}>Подробнее</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.topBlock}>
                <View style={styles.headerCluster}>
                  <Text
                    style={[
                      styles.appTitle,
                      // На web-десктопе заголовок не должен переноситься на 2 строки.
                      isWebDesktop ? ({ whiteSpace: 'nowrap' } as any) : null,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="clip"
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.72}
                    maxFontSizeMultiplier={1.35}
                    allowFontScaling={true}
                    {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                  >
                    Автоинструктор
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>АКПП</Text>
                  </View>
                </View>
              </View>

              <View style={styles.spacer} />

              <View style={[styles.card, styles.cardMobileFull]}>
                <View style={[styles.cardRow, styles.cardRowMobile]}>
                  <Image
                    source={INSTRUCTOR_IMG}
                    style={styles.avatar}
                    resizeMode="cover"
                    accessibilityLabel="Инструктор за рулём"
                  />
                  <View style={[styles.cardBody, styles.cardBodyMobile]}>
                    <Text style={styles.roleLabel}>Инструктор</Text>
                    <Text style={styles.name}>Эдуард Н.</Text>
                    <Text style={styles.experience}>Стаж 23 года</Text>
                    <Text style={styles.phone}>8 903 252-52-32</Text>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                  onPress={() => navigation.navigate('HomeMain')}
                  accessibilityRole="button"
                  accessibilityLabel="Перейти к входу"
                >
                  <Text style={styles.ctaText}>Подробнее</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function createStyles(screenWidth: number, screenHeight: number, isWebDesktop: boolean) {
  // На web текущая формула делала заголовок слишком большим, из-за чего появлялось обрезание/ellipsis.
  // Делаем предсказуемый размер на web и чуть крупнее на мобилках.
  const titleFontSize = isWebDesktop
    ? Math.round(Math.min(44, Math.max(28, screenWidth * 0.05)))
    : Math.round(Math.min(44, Math.max(30, screenWidth * 0.11)));
  const webLeftGutter = isWebDesktop ? 200 : 0;
  // Веб: делаем плашку значительно уже (примерно в 4 раза уже относительно "широкой" версии).
  const webCardTargetW = 420;
  const webRightPad = 24;
  const webCardW = isWebDesktop
    ? Math.max(320, Math.min(webCardTargetW, screenWidth - webLeftGutter - webRightPad))
    : undefined;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: SKY,
      overflow: 'hidden',
    },
    devMarker: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#f97316',
      zIndex: 9999,
    },
    fullImage: {
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },
    safe: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    column: {
      flex: 1,
      justifyContent: 'space-between',
      // В мобилке/планшете держим карточку чуть выше нижней кромки
      // (SafeAreaView добавит системный inset снизу).
      paddingBottom: isWebDesktop ? 18 : 18,
      ...(isWebDesktop
        ? ({
            justifyContent: 'flex-start',
            paddingTop: 18,
            paddingBottom: 18,
          } as const)
        : null),
    },
    centerStack: {
      flex: 1,
      alignSelf: 'stretch',
      width: '100%',
      justifyContent: 'center',
      gap: 18,
    },
    centerStackWeb: {
      // На web уже используется позиционирование/отступы внутри topBlock+card.
      justifyContent: 'flex-start',
      flex: 1,
      position: 'relative',
      gap: 0,
    },
    spacer: {
      flexGrow: 1,
      minHeight: 16,
    },
    topBlock: {
      paddingTop: isWebDesktop ? 0 : 28,
      paddingHorizontal: isWebDesktop ? 0 : 16,
      alignSelf: 'stretch',
      width: '100%',
      alignItems: isWebDesktop ? 'center' : 'flex-start',
      ...(isWebDesktop
        ? ({
            alignItems: 'flex-start',
            maxWidth: 520,
            paddingLeft: webLeftGutter,
          } as const)
        : null),
    },
    headerCluster: {
      flexDirection: 'column',
      alignItems: isWebDesktop ? 'flex-start' : 'flex-start',
      maxWidth: '100%',
      ...(isWebDesktop ? ({ alignItems: 'flex-start' } as const) : null),
    },
    appTitle: {
      alignSelf: 'center',
      fontSize: titleFontSize,
      fontWeight: '600',
      color: TEXT,
      textAlign: 'center',
      maxWidth: '100%',
      flexShrink: 0,
      letterSpacing: -0.8,
      lineHeight: Math.round(titleFontSize * 1.08),
      marginBottom: 12,
      textShadowColor: RIM_LIGHT,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
      ...(isWebDesktop ? ({ textAlign: 'left', alignSelf: 'flex-start', marginBottom: 10 } as const) : null),
      ...(!isWebDesktop ? ({ textAlign: 'left', alignSelf: 'flex-start', marginBottom: 10 } as const) : null),
    },
    badge: {
      alignSelf: 'center',
      backgroundColor: ACCENT,
      paddingVertical: Math.round(titleFontSize * 0.12),
      paddingHorizontal: Math.round(titleFontSize * 0.32),
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: RIM_LIGHT,
      ...(isWebDesktop ? ({ alignSelf: 'flex-start' } as const) : null),
      ...(!isWebDesktop ? ({ alignSelf: 'flex-start' } as const) : null),
    },
    badgeText: {
      color: ON_ACCENT,
      fontWeight: '600',
      fontSize: titleFontSize,
      letterSpacing: 0.5,
      textShadowColor: 'rgba(0, 0, 0, 0.12)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 0,
    },
    card: {
      backgroundColor: '#ffffff',
      marginTop: 0,
      marginHorizontal: isWebDesktop ? 24 : 16,
      borderRadius: 20,
      padding: isWebDesktop ? 26 : 20,
      justifyContent: 'center',
      shadowColor: '#0f2133',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 6,
      borderWidth: 1,
      borderColor: lightColors.borderSubtle,
      ...(isWebDesktop
        ? ({
            // На web: опускаем плашку ближе к низу экрана.
            position: 'absolute',
            left: webLeftGutter,
            bottom: 32,
            width: webCardW,
            maxWidth: webCardW,
            padding: 22,
            marginTop: 0,
            marginHorizontal: 0,
          } as const)
        : null),
    },
    cardMobileFull: {
      // Мобилка: растянуть плашку на всю ширину экрана.
      alignSelf: 'stretch',
      // Отступы от краёв как на мокапах
      marginHorizontal: 16,
      // Равный отступ снизу, чтобы карточка не прилипала к краю
      marginBottom: 16,
      // Чуть компактнее по высоте
      padding: 18,
    },
    cardRow: {
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: isWebDesktop ? 22 : 18,
      justifyContent: 'center',
    },
    cardRowMobile: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    avatar: {
      width: isWebDesktop ? 160 : 140,
      height: isWebDesktop ? 160 : 140,
      borderRadius: isWebDesktop ? 80 : 70,
      marginRight: 0,
      marginBottom: isWebDesktop ? 16 : 12,
      backgroundColor: lightColors.surfaceMuted,
    },
    cardBody: {
      flex: 1,
      minWidth: 0,
      width: '100%',
      alignItems: 'center',
    },
    cardBodyMobile: {
      alignItems: 'flex-start',
      paddingLeft: 16,
      flex: 1,
      minWidth: 0,
      width: 'auto',
    },
    roleLabel: {
      fontSize: isWebDesktop ? 14 : 12,
      color: MUTED,
      marginBottom: 4,
      textAlign: isWebDesktop ? 'center' : 'left',
      lineHeight: isWebDesktop ? 18 : 16,
    },
    name: {
      fontSize: isWebDesktop ? 22 : 22,
      fontWeight: '700',
      color: TEXT,
      marginBottom: 4,
      textAlign: isWebDesktop ? 'center' : 'left',
      flexShrink: 1,
    },
    experience: {
      fontSize: isWebDesktop ? 15 : 15,
      fontWeight: '600',
      color: MUTED,
      marginBottom: 6,
      textAlign: isWebDesktop ? 'center' : 'left',
      flexShrink: 1,
    },
    phone: {
      fontSize: isWebDesktop ? 16 : 15,
      fontWeight: '600',
      color: ACCENT,
      marginBottom: 6,
      letterSpacing: 0.3,
      textAlign: isWebDesktop ? 'center' : 'left',
      flexShrink: 1,
    },
    cta: {
      backgroundColor: ACCENT,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: RIM_LIGHT,
    },
    ctaPressed: {
      opacity: 0.9,
    },
    ctaText: {
      color: ON_ACCENT,
      fontSize: 17,
      fontWeight: '700',
    },
  });
}
