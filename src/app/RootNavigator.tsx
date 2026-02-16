/**
 * AuthNavigator / RootNavigator
 *
 * Gestiona navegación condicional:
 * - Si no está autenticado: muestra AuthStack (Login/Signup)
 * - Si está autenticado: muestra AppNavigator (Main app)
 *
 * Usado en App.tsx en lugar de AppNavigator directo
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { SignupScreen } from '@/features/auth/screens/SignupScreen';
import { AppNavigator } from '@/app/AppNavigator';

const Stack = createNativeStackNavigator();

/**
 * Auth Stack - Login / Signup screens
 */
const AuthStack = () => {
  const [currentScreen, setCurrentScreen] = React.useState<'login' | 'signup'>(
    'login'
  );

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {currentScreen === 'login' ? (
        <Stack.Screen
          name="Login"
          options={{ animationTypeForReplace: 'pop' }}
        >
          {() => (
            <LoginScreen
              onNavigateToSignup={() => setCurrentScreen('signup')}
            />
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen
          name="Signup"
          options={{ animationTypeForReplace: 'pop' }}
        >
          {() => (
            <SignupScreen
              onNavigateToLogin={() => setCurrentScreen('login')}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};

/**
 * Root Navigator - condicional Auth Stack vs App Stack
 */
export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras se inicializa la autenticación
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Mostrar stack apropiado según auth state
  return isAuthenticated ? <AppNavigator /> : <AuthStack />;
};
