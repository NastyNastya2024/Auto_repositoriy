import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Dimensions,
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

const CAR_IMG = require('../../assets/onboarding-car.png');
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
  const [webSize, setWebSize] = useState({ width: layout.width, height: layout.height });
  const w = Platform.OS === 'web' ? webSize.width : layout.width;
  const h = Platform.OS === 'web' ? webSize.height : layout.height;
  const screen = Dimensions.get('screen');
  const bgW = Platform.OS === 'web' ? webSize.width : screen.width;
  const bgH = Platform.OS === 'web' ? webSize.height : screen.height;
  const styles = useMemo(() => createStyles(w), [w]);

  useEffect(() => {
    applyWebDocumentLightTheme();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onResize = () => setWebSize({ width: window.innerWidth, height: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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
      ? { width: '100%' as const, minHeight: h }
      : { width: bgW, height: bgH };
  const imageExtra: ImageStyle =
    Platform.OS === 'web' ? { width: '100%', height: h } : { width: bgW, height: bgH };

  return (
    <View style={[styles.root, rootExtra]}>
      {__DEV__ && Platform.OS !== 'web' ? (
        <View style={styles.devMarker} accessibilityLabel="Маркер отладки: виден только в режиме разработки" />
      ) : null}
      <ExpoStatusBar style="dark" backgroundColor={SKY} translucent={false} />
      <Image
        source={CAR_IMG}
        style={[styles.fullImage, imageExtra]}
        resizeMode="cover"
        accessibilityLabel="Учебный автомобиль на дороге"
      />
      <SafeAreaView style={styles.safe} pointerEvents="box-none" edges={['top', 'left', 'right', 'bottom']}>
        <View style={[styles.column, { minHeight: h }]} pointerEvents="box-none">
          <View style={styles.topBlock}>
            <View style={styles.headerCluster}>
              <Text
                style={styles.appTitle}
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
      </SafeAreaView>
    </View>
  );
}

function createStyles(screenWidth: number) {
  const titleFontSize = Math.round(Math.min(52, Math.max(38, screenWidth * 0.11)));

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
      paddingBottom: 8,
    },
    topBlock: {
      paddingTop: 28,
      paddingHorizontal: 16,
      alignSelf: 'stretch',
      width: '100%',
      alignItems: 'center',
    },
    headerCluster: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      maxWidth: '100%',
    },
    spacer: {
      flexGrow: 1,
      minHeight: 16,
    },
    appTitle: {
      alignSelf: 'flex-start',
      fontSize: titleFontSize,
      fontWeight: '600',
      color: TEXT,
      textAlign: 'left',
      letterSpacing: -0.8,
      lineHeight: Math.round(titleFontSize * 1.08),
      marginBottom: 12,
      textShadowColor: RIM_LIGHT,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: ACCENT,
      paddingVertical: Math.round(titleFontSize * 0.12),
      paddingHorizontal: Math.round(titleFontSize * 0.32),
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: RIM_LIGHT,
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
      marginHorizontal: 16,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#0f2133',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 6,
      borderWidth: 1,
      borderColor: lightColors.borderSubtle,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      marginRight: 16,
      backgroundColor: lightColors.surfaceMuted,
    },
    cardBody: {
      flex: 1,
      minWidth: 0,
    },
    roleLabel: {
      fontSize: 13,
      color: MUTED,
      marginBottom: 4,
    },
    name: {
      fontSize: 20,
      fontWeight: '700',
      color: TEXT,
      marginBottom: 4,
    },
    experience: {
      fontSize: 14,
      fontWeight: '600',
      color: MUTED,
      marginBottom: 6,
    },
    phone: {
      fontSize: 15,
      fontWeight: '600',
      color: ACCENT,
      marginBottom: 6,
      letterSpacing: 0.3,
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
