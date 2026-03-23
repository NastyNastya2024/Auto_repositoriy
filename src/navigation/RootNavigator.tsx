import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterRequestScreen } from '../screens/RegisterRequestScreen';
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

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f6f7f9',
  },
};

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const StudentTabs = createBottomTabNavigator();
const AdminTabs = createBottomTabNavigator();
const AdminChatStack = createNativeStackNavigator<AdminChatStackParamList>();

function LogoutHeaderButton() {
  const { logout } = useApp();
  return (
    <Pressable onPress={logout} hitSlop={12}>
      <Text style={styles.logout}>Выйти</Text>
    </Pressable>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#f6f7f9' },
        headerShadowVisible: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Вход' }} />
      <AuthStack.Screen
        name="RegisterRequest"
        component={RegisterRequestScreen}
        options={{ title: 'Заявка на доступ' }}
      />
    </AuthStack.Navigator>
  );
}

function AdminChatNavigator() {
  return (
    <AdminChatStack.Navigator>
      <AdminChatStack.Screen
        name="ChatList"
        component={AdminChatListScreen}
        options={{ title: 'Чаты', headerRight: () => <LogoutHeaderButton /> }}
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
  return (
    <StudentTabs.Navigator
      screenOptions={{
        headerRight: () => <LogoutHeaderButton />,
        tabBarActiveTintColor: '#2563eb',
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
  return (
    <AdminTabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
      }}
    >
      <AdminTabs.Screen
        name="Slots"
        component={AdminSlotsScreen}
        options={{
          title: 'Слоты',
          tabBarLabel: 'Слоты',
          headerRight: () => <LogoutHeaderButton />,
        }}
      />
      <AdminTabs.Screen
        name="Bookings"
        component={AdminBookingsScreen}
        options={{
          title: 'Записи',
          tabBarLabel: 'Записи',
          headerRight: () => <LogoutHeaderButton />,
        }}
      />
      <AdminTabs.Screen
        name="Tariffs"
        component={AdminTariffsScreen}
        options={{
          title: 'Тарифы',
          tabBarLabel: 'Тарифы',
          headerRight: () => <LogoutHeaderButton />,
        }}
      />
      <AdminTabs.Screen
        name="Requests"
        component={AdminRegistrationRequestsScreen}
        options={{
          title: 'Заявки',
          tabBarLabel: 'Заявки',
          headerRight: () => <LogoutHeaderButton />,
        }}
      />
      <AdminTabs.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{
          title: 'Ученики',
          tabBarLabel: 'Ученики',
          headerRight: () => <LogoutHeaderButton />,
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

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f7f9' },
  logout: { color: '#2563eb', fontWeight: '600', fontSize: 16 },
});
