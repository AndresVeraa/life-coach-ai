import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import Home from '../screens/index';
import Tasks from '../screens/tasks';
import Health from '../screens/health';
import Coach from '../screens/coach';
import Audit from '../screens/audit';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={Tasks}
        options={{
          tabBarLabel: 'Tasks',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📎</Text>,
        }}
      />
      <Tab.Screen
        name="Health"
        component={Health}
        options={{
          tabBarLabel: 'Health',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏥</Text>,
        }}
      />
      <Tab.Screen
        name="Coach"
        component={Coach}
        options={{
          tabBarLabel: 'Coach',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🤖</Text>,
        }}
      />
      <Tab.Screen
        name="Audit"
        component={Audit}
        options={{
          tabBarLabel: 'Audit',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Root" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
