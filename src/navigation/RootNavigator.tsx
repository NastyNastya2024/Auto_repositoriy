import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterRequestScreen } from '../screens/RegisterRequestScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { HomeMainScreen } from '../screens/HomeMainScreen';
import { StudentCalendarScreen } from '../screens/student/StudentCalendarScreen';
import { StudentMyBookingsScreen } from '../screens/student/StudentMyBookingsScreen';
import { StudentTariffsScreen } from '../screens/student/StudentTariffsScreen';
import { StudentChatScreen } from '../screens/student/StudentChatScreen';
import { StudentPddScreen } from '../screens/student/StudentPddScreen';
import { AdminSlotsScreen } from '../screens/admin/AdminSlotsScreen';
import { AdminBookingsScreen } from '../screens/admin/AdminBookingsScreen';
import { AdminTariffsScreen } from '../screens/admin/AdminTariffsScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminRegistrationRequestsScreen } from '../screens/admin/AdminRegistrationRequestsScreen';
import { AdminChatListScreen } from '../screens/admin/AdminChatListScreen';
import { AdminChatThreadScreen } from '../screens/admin/AdminChatThreadScreen';
import type { AdminChatStackParamList, AuthStackParamList } from './types';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const StudentTabs = createBottomTabNavigator();
const AdminTabs = createBottomTabNavigator();
const AdminChatStack = createNativeStackNavigator<AdminChatStackParamList>();

const WEB_CONTENT_MAX_WIDTH = 1040;
const WEB_CONTENT_PADDING = 18;

/** Подпись в 2 строки без «…», т.к. стандартный Label в react-navigation с numberOfLines={1}. */
function adminTabBarLabel(title: string) {
  return function AdminTabBarLabel({ color }: { color: string }) {
    return (
      <Text
        style={{
          color,
          fontSize: 11,
          fontWeight: '600',
          textAlign: 'center',
          lineHeight: 14,
          marginTop: 2,
          paddingHorizontal: 1,
        }}
        numberOfLines={2}
        ellipsizeMode="clip"
      >
        {title}
      </Text>
    );
  };
}

function LogoutHeaderButton() {
  const { logout } = useApp();
  const { colors } = useTheme();
  return (
    <Pressable onPress={logout} hitSlop={12}>
      <Text style={{ color: colors.link, fontWeight: '600', fontSize: 16 }}>Выйти</Text>
    </Pressable>
  );
}

function SessionHeaderRight() {
  return (
    <View style={styles.headerActions}>
      <LogoutHeaderButton />
    </View>
  );
}

function AuthLoginHeaderButton() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  return (
    <Pressable
      onPress={() => navigation.navigate('Login')}
      hitSlop={10}
      style={styles.authHeaderLoginBtn}
    >
      <Text style={{ color: colors.link, fontWeight: '700', fontSize: 16 }}>Войти</Text>
    </Pressable>
  );
}

function HomeMainHeaderTitle() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
      <Text
        style={{ fontSize: 17, fontWeight: '800', color: colors.text }}
        numberOfLines={1}
      >
        Автоинструктор
      </Text>
      <View
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: colors.onPrimary, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>
          АКПП
        </Text>
      </View>
    </View>
  );
}

function AuthNavigator() {
  const { headerOptions, colors } = useTheme();
  return (
    <AuthStack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        ...headerOptions,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <AuthStack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{
          headerShown: false,
          headerLargeTitle: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <AuthStack.Screen
        name="HomeMain"
        component={HomeMainScreen}
        options={{
          headerBackTitle: 'Назад',
          headerTitleAlign: 'left',
          headerTitle: () => <HomeMainHeaderTitle />,
          headerRight: () => <AuthLoginHeaderButton />,
        }}
      />
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: '', headerBackTitle: 'Назад' }}
      />
      <AuthStack.Screen
        name="RegisterRequest"
        component={RegisterRequestScreen}
        options={{ title: 'Заявка на доступ' }}
      />
    </AuthStack.Navigator>
  );
}

function AdminChatNavigator() {
  const { headerOptions } = useTheme();
  return (
    <AdminChatStack.Navigator screenOptions={headerOptions}>
      <AdminChatStack.Screen
        name="ChatList"
        component={AdminChatListScreen}
        options={{ title: 'Чаты', headerRight: () => <SessionHeaderRight /> }}
      />
      <AdminChatStack.Screen
        name="ChatThread"
        component={AdminChatThreadScreen}
        options={({ route }) => ({
          title: route.params.studentName,
          headerBackTitle: 'Назад',
        })}
      />
    </AdminChatStack.Navigator>
  );
}

/** Высота контента табов ученика (иконка + подпись); safe area добавляется отдельно снизу. */
const STUDENT_TAB_BAR_INNER = 72;

function StudentNavigator() {
  const { tabScreenOptions } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWebDesktop = width >= 900;
  const isWeb = Platform.OS === 'web';
  const tabScale = isWeb ? 1.15 : 1;
  const studentIconSize = Math.round(STUDENT_TAB_ICON * tabScale);

  return (
    <StudentTabs.Navigator
      screenOptions={{
        ...tabScreenOptions,
        tabBarStyle: [
          tabScreenOptions.tabBarStyle,
          {
            minHeight: Math.round(STUDENT_TAB_BAR_INNER * tabScale) + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: Math.round(6 * tabScale),
            ...(isWebDesktop
              ? ({
                  alignSelf: 'center',
                  width: '100%',
                  maxWidth: WEB_CONTENT_MAX_WIDTH,
                } as const)
              : null),
          },
        ],
        tabBarItemStyle: { paddingTop: 0, paddingBottom: 0 },
        headerRight: () => <SessionHeaderRight />,
        tabBarLabelStyle: [
          tabScreenOptions.tabBarLabelStyle,
          isWeb ? ({ fontSize: 13, lineHeight: 18 } as const) : null,
        ],
      }}
    >
      <StudentTabs.Screen
        name="Calendar"
        component={StudentCalendarScreen}
        options={{
          title: 'Календарь',
          tabBarLabel: 'Календарь',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={studentIconSize} color={color} />
          ),
        }}
      />
      <StudentTabs.Screen
        name="MyBookings"
        component={StudentMyBookingsScreen}
        options={{
          title: 'Уроки',
          tabBarLabel: 'Уроки',
          tabBarIcon: ({ color }) => (
            <Ionicons name="clipboard-outline" size={studentIconSize} color={color} />
          ),
        }}
      />
      <StudentTabs.Screen
        name="Tariffs"
        component={StudentTariffsScreen}
        options={{
          title: 'Тарифы',
          tabBarLabel: 'Тарифы',
          tabBarIcon: ({ color }) => (
            <Ionicons name="pricetag-outline" size={studentIconSize} color={color} />
          ),
        }}
      />
      <StudentTabs.Screen
        name="Chat"
        component={StudentChatScreen}
        options={{
          title: 'Чат',
          tabBarLabel: 'Чат',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles-outline" size={studentIconSize} color={color} />
          ),
        }}
      />
      <StudentTabs.Screen
        name="Pdd"
        component={StudentPddScreen}
        options={{
          title: 'ПДД',
          tabBarLabel: 'ПДД',
          tabBarIcon: ({ color }) => (
            <Ionicons name="book-outline" size={studentIconSize} color={color} />
          ),
        }}
      />
    </StudentTabs.Navigator>
  );
}

const ADMIN_TAB_ICON = 22;
const STUDENT_TAB_ICON = 22;

/** Зона под иконку + двухстрочную подпись (высота без учёта safe area снизу). */
const ADMIN_TAB_BAR_INNER = 58;

function AdminNavigator() {
  const { tabScreenOptions } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWebDesktop = width >= 900;
  const isWeb = Platform.OS === 'web';
  const tabScale = isWeb ? 1.2 : 1;
  const adminIconSize = Math.round(ADMIN_TAB_ICON * tabScale);
  const tabBarHeight = Math.round(ADMIN_TAB_BAR_INNER * tabScale) + insets.bottom;

  return (
    <AdminTabs.Navigator
      screenOptions={{
        ...tabScreenOptions,
        tabBarStyle: [
          tabScreenOptions.tabBarStyle,
          {
            height: tabBarHeight,
            paddingTop: isWeb ? 6 : undefined,
            ...(isWebDesktop
              ? ({
                  alignSelf: 'center',
                  width: '100%',
                  maxWidth: WEB_CONTENT_MAX_WIDTH,
                } as const)
              : null),
          },
        ],
        tabBarItemStyle: { paddingTop: 4, paddingBottom: 2 },
        tabBarLabelStyle: [
          tabScreenOptions.tabBarLabelStyle,
          isWeb ? ({ fontSize: 12, lineHeight: 16 } as const) : null,
        ],
      }}
    >
      <AdminTabs.Screen
        name="Slots"
        component={AdminSlotsScreen}
        options={{
          title: 'Слоты',
          tabBarLabel: adminTabBarLabel('Слоты'),
          headerRight: () => <SessionHeaderRight />,
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={adminIconSize} color={color} />
          ),
        }}
      />
      <AdminTabs.Screen
        name="Bookings"
        component={AdminBookingsScreen}
        options={{
          title: 'Записи',
          tabBarLabel: adminTabBarLabel('Записи'),
          headerRight: () => <SessionHeaderRight />,
          tabBarIcon: ({ color }) => (
            <Ionicons name="clipboard-outline" size={adminIconSize} color={color} />
          ),
        }}
      />
      <AdminTabs.Screen
        name="Tariffs"
        component={AdminTariffsScreen}
        options={{
          title: 'Тарифы',
          tabBarLabel: adminTabBarLabel('Тарифы'),
          headerRight: () => <SessionHeaderRight />,
          tabBarIcon: ({ color }) => (
            <Ionicons name="pricetag-outline" size={adminIconSize} color={color} />
          ),
        }}
      />
      <AdminTabs.Screen
        name="Requests"
        component={AdminRegistrationRequestsScreen}
        options={{
          title: 'Заявки',
          tabBarLabel: adminTabBarLabel('Заявки'),
          headerRight: () => <SessionHeaderRight />,
          tabBarIcon: ({ color }) => (
            <Ionicons name="mail-unread-outline" size={adminIconSize} color={color} />
          ),
        }}
      />
      <AdminTabs.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{
          title: 'Ученики',
          tabBarLabel: adminTabBarLabel('Ученики'),
          headerRight: () => <SessionHeaderRight />,
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={adminIconSize} color={color} />
          ),
        }}
      />
      <AdminTabs.Screen
        name="Chats"
        component={AdminChatNavigator}
        options={{
          title: 'Чаты',
          tabBarLabel: adminTabBarLabel('Чаты'),
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles-outline" size={adminIconSize} color={color} />
          ),
        }}
      />
    </AdminTabs.Navigator>
  );
}

export function RootNavigator() {
  const { ready, sessionUser } = useApp();
  const { colors, navigationTheme } = useTheme();

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {!sessionUser ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : sessionUser.role === 'student' ? (
          <RootStack.Screen name="Student" component={StudentNavigator} />
        ) : (
          <RootStack.Screen name="Admin" component={AdminNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authHeaderLoginBtn: {
    paddingRight: 16,
  },
});
