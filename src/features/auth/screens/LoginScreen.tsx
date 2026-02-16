/**
 * LoginScreen
 *
 * Pantalla para iniciar sesión con email y contraseña
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenWrapper } from '@/shared/ui/ScreenWrapper';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface LoginScreenProps {
  onNavigateToSignup?: () => void;
}

export const LoginScreen = ({ onNavigateToSignup }: LoginScreenProps) => {
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = useCallback(async () => {
    // Limpiar errores previos
    setValidationError('');
    clearError();

    // Validar campos
    if (!email.trim()) {
      setValidationError('Por favor ingresa tu email');
      return;
    }

    if (!validateEmail(email)) {
      setValidationError('Email no válido');
      return;
    }

    if (!password) {
      setValidationError('Por favor ingresa tu contraseña');
      return;
    }

    if (password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Intentar login
    const { success, error: loginError } = await login(email, password);

    if (!success) {
      setValidationError(loginError || 'Error al iniciar sesión');
    }
  }, [email, password, login, clearError]);

  const handlePasswordReset = useCallback(() => {
    // TODO: Implementar reset de contraseña
    alert('Funcionalidad de reset de contraseña próximamente');
  }, []);

  const errorMessage = error || validationError;

  return (
    <ScreenWrapper className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Logo/Header */}
          <View className="pt-12 pb-8 items-center">
            <Text className="text-5xl mb-4">🧠</Text>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Life Coach AI
            </Text>
            <Text className="text-gray-600 text-center px-6">
              Tu asistente personal para productividad y bienestar
            </Text>
          </View>

          {/* Form Container */}
          <View className="px-6 py-8">
            {/* Error Alert */}
            {errorMessage && (
              <View className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                <Text className="text-red-700 font-semibold text-sm">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Email Input */}
            <View className="mb-5">
              <Text className="text-gray-900 font-semibold text-sm mb-2">
                Email
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholder="tu@email.com"
                placeholderTextColor="#d1d5db"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setValidationError('')}
              />
              <Text className="text-xs text-gray-500 mt-1">
                Usa el email registrado
              </Text>
            </View>

            {/* Password Input */}
            <View className="mb-2">
              <Text className="text-gray-900 font-semibold text-sm mb-2">
                Contraseña
              </Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
                <TextInput
                  className="flex-1 text-gray-900"
                  placeholder="••••••••"
                  placeholderTextColor="#d1d5db"
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setValidationError('')}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-2 active:opacity-70"
                >
                  <Text className="text-xl">
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </Pressable>
              </View>
              <Text className="text-xs text-gray-500 mt-1">
                Mínimo 6 caracteres
              </Text>
            </View>

            {/* Forgot Password Link */}
            <Pressable
              onPress={handlePasswordReset}
              className="mb-8 active:opacity-70"
            >
              <Text className="text-indigo-600 font-semibold text-sm text-right">
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              className={`rounded-lg py-3 items-center mb-4 ${
                isLoading
                  ? 'bg-indigo-300'
                  : 'bg-indigo-600 active:bg-indigo-700'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Iniciar Sesión
                </Text>
              )}
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="text-gray-500 mx-3 text-xs">O</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Sign Up Link */}
            <View className="flex-row items-center justify-center">
              <Text className="text-gray-700 text-sm">
                ¿No tienes cuenta?{' '}
              </Text>
              <Pressable
                onPress={onNavigateToSignup}
                className="active:opacity-70"
              >
                <Text className="text-indigo-600 font-bold text-sm">
                  Crear una
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer Info */}
          <View className="px-6 py-6 items-center">
            <Text className="text-gray-500 text-xs text-center leading-5">
              Al iniciar sesión aceptas nuestros Términos de Servicio y Política
              de Privacidad
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};
