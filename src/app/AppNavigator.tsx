import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Home, ListTodo, Activity, Bot, Clock, TrendingUp } from 'lucide-react-native';
import { DashboardScreen } from '@/features/home/DashboardScreen';
import { TasksScreen } from '@/features/tasks/TasksScreen';
import { HealthScreen } from '@/features/health/HealthScreen';
import { CoachScreen } from '@/features/coach/CoachScreen';
import { AuditScreen } from '@/features/audit/components/AuditScreen';
import { AnalyticsScreen } from '@/features/analytics/screens/AnalyticsScreen';
import { ProfileScreen } from '@/features/auth/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#1f2937',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f3f4f6',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="TasksTab"
        component={TasksScreen}
        options={{
          title: 'Tareas',
          tabBarIcon: ({ color, size }) => (
            <ListTodo color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="HealthTab"
        component={HealthScreen}
        options={{
          title: 'Salud',
          tabBarIcon: ({ color, size }) => (
            <Activity color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="CoachTab"
        component={CoachScreen}
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, size }) => (
            <Bot color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsScreen}
        options={{
          title: 'Análisis',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="AuditTab"
        component={AuditScreen}
        options={{
          title: 'Auditoría',
          tabBarIcon: ({ color, size }) => (
            <Clock color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};
