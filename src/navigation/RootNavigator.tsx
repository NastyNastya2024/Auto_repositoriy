import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { StudentPddScreen } from '../screens/student/StudentPddScreen';
import { StudentChatScreen } from '../screens/student/StudentChatScreen';
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
    <Pressable onPress={() => navigation.navigate('Login')} hitSlop={10}>
      <Text style={{ color: colors.link, fontWeight: '700', fontSize: 16 }}>Войти</Text>
    </Pressable>
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
          title: 'Главная',
          headerBackTitle: 'Назад',
          headerRight: () => <AuthLoginHeaderButton />,
        }}
      />
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Вход', headerBackTitle: 'Назад' }}
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

function StudentNavigator() {
  const { tabScreenOptions } = useTheme();
  return (
    <StudentTabs.Navigator
      screenOptions={{
        ...tabScreenOptions,
        headerRight: () => <SessionHeaderRight />,
      }}
    >
      <StudentTabs.Screen
        name="Calendar"
        component={StudentCalendarScreen}
        options={{ title: 'Календарь', tabBarLabel: 'Календарь' }}
      />
      <StudentTabs.Screen
        name="MyBookings"
        component={StudentMyBookingsScreen}
        options={{ title: 'Мои заявки', tabBarLabel: 'Заявки' }}
      />
      <StudentTabs.Screen
        name="Tariffs"
        component={StudentTariffsScreen}
        options={{ title: 'Тарифы', tabBarLabel: 'Тарифы' }}
      />
      <StudentTabs.Screen
        name="PDD"
        component={StudentPddScreen}
        options={{ title: 'ПДД', tabBarLabel: 'ПДД' }}
      />
      <StudentTabs.Screen
        name="Chat"
        component={StudentChatScreen}
        options={{ title: 'Чат', tabBarLabel: 'Чат' }}
      />
    </StudentTabs.Navigator>
  );
}

function AdminNavigator() {
  const { tabScreenOptions } = useTheme();
  return (
    <AdminTabs.Navigator screenOptions={tabScreenOptions}>
      <AdminTabs.Screen
        name="Slots"
        component={AdminSlotsScreen}
        options={{
          title: 'Слоты',
          tabBarLabel: 'Слоты',
          headerRight: () => <SessionHeaderRight />,
        }}
      />
      <AdminTabs.Screen
        name="Bookings"
        component={AdminBookingsScreen}
        options={{
          title: 'Записи',
          tabBarLabel: 'Записи',
          headerRight: () => <SessionHeaderRight />,
        }}
      />
      <AdminTabs.Screen
        name="Tariffs"
        component={AdminTariffsScreen}
        options={{
          title: 'Тарифы',
          tabBarLabel: 'Тарифы',
          headerRight: () => <SessionHeaderRight />,
        }}
      />
      <AdminTabs.Screen
        name="Requests"
        component={AdminRegistrationRequestsScreen}
        options={{
          title: 'Заявки',
          tabBarLabel: 'Заявки',
          headerRight: () => <SessionHeaderRight />,
        }}
      />
      <AdminTabs.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{
          title: 'Ученики',
          tabBarLabel: 'Ученики',
          headerRight: () => <SessionHeaderRight />,
        }}
      />
      <AdminTabs.Screen
        name="Chats"
        component={AdminChatNavigator}
        options={{
          title: 'Чаты',
          tabBarLabel: 'Чаты',
          headerShown: false,
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
        <ActivityIndicator size="large" color={colors.primaryMuted} />
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
});
