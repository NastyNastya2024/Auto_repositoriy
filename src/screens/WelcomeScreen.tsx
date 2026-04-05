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
import { applyWebDocumentLightTheme } from '../utils/webDocumentTheme';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const CAR_IMG = require('../../assets/onboarding-car.png');
const INSTRUCTOR_IMG = require('../../assets/onboarding-instructor.png');

/** Явно светлая палитра экрана — не зависит от темы приложения. */
const SKY = '#e8f4fc';
const TEXT = '#0f172a';
const PRIMARY = '#2563eb';
const ON_PRIMARY = '#ffffff';
const MUTED = '#6b7280';

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const layout = useWindowDimensions();
  const [webSize, setWebSize] = useState({ width: layout.width, height: layout.height });
  const w = Platform.OS === 'web' ? webSize.width : layout.width;
  const h = Platform.OS === 'web' ? webSize.height : layout.height;
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
    Platform.OS === 'web' ? { width: '100%' as const, minHeight: h } : { width: w, height: h };
  const imageExtra: ImageStyle =
    Platform.OS === 'web' ? { width: '100%', height: h } : { width: w, height: h };

  return (
    <View style={[styles.root, rootExtra]}>
      {__DEV__ && Platform.OS !== 'web' ? (
        <View style={styles.devMarker} accessibilityLabel="Маркер отладки: виден только в режиме разработки" />
      ) : null}
      <ExpoStatusBar style="dark" backgroundColor={SKY} translucent={false} />
      <Image
        source={CAR_IMG}
        style={[styles.fullImage, imageExtra]}
        resizeMode="stretch"
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
                <Text style={styles.phone}>8 903 252-52-32</Text>
                <Text style={styles.carModel}>Skoda Octavia</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
              onPress={() => navigation.navigate('Login')}
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
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: PRIMARY,
      paddingVertical: Math.round(titleFontSize * 0.12),
      paddingHorizontal: Math.round(titleFontSize * 0.32),
      borderRadius: 10,
      marginBottom: 8,
    },
    badgeText: {
      color: ON_PRIMARY,
      fontWeight: '600',
      fontSize: titleFontSize,
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: '#ffffff',
      marginHorizontal: 16,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(15, 23, 42, 0.08)',
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
      backgroundColor: '#e5e7eb',
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
      marginBottom: 6,
    },
    phone: {
      fontSize: 15,
      fontWeight: '600',
      color: PRIMARY,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    carModel: {
      fontSize: 16,
      color: TEXT,
    },
    cta: {
      backgroundColor: PRIMARY,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    ctaPressed: {
      opacity: 0.9,
    },
    ctaText: {
      color: ON_PRIMARY,
      fontSize: 17,
      fontWeight: '700',
    },
  });
}
