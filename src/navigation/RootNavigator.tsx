import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppNavigator from './AppNavigator';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { SignupScreen } from '@/features/auth/screens/SignupScreen';
import { useAuthStore } from '@/features/auth/auth.store';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const SplashScreen = () => {
  return (
    <View style={styles.splashContainer}>
      <Text style={styles.splashIcon}>🤖</Text>
      <Text style={styles.splashTitle}>Life Coach AI</Text>
      <ActivityIndicator size="small" color="#7C6FCD" style={styles.splashLoader} />
    </View>
  );
};

const AuthNavigator = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const screen = useMemo(() => {
    if (mode === 'signup') {
      return <SignupScreen onNavigateToLogin={() => setMode('login')} />;
    }

    return <LoginScreen onNavigateToSignup={() => setMode('signup')} />;
  }, [mode]);

  return (
    <NavigationContainer>
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        {mode === 'signup' ? (
          <AuthStack.Screen name="Signup">{() => screen}</AuthStack.Screen>
        ) : (
          <AuthStack.Screen name="Login">{() => screen}</AuthStack.Screen>
        )}
      </AuthStack.Navigator>
    </NavigationContainer>
  );
};

export const RootNavigator = () => {
  const initialize = useAuthStore((state) => state.initialize);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return <AppNavigator />;
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0F',
  },
  splashIcon: {
    fontSize: 54,
  },
  splashTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#F0F0FF',
  },
  splashLoader: {
    marginTop: 14,
  },
});
