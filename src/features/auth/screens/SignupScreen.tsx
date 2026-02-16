/**
 * SignupScreen
 *
 * Pantalla para crear nueva cuenta con email, contraseña y nombre
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

interface SignupScreenProps {
  onNavigateToLogin?: () => void;
}

export const SignupScreen = ({ onNavigateToLogin }: SignupScreenProps) => {
  const { signup, isSigningUp, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = useCallback(async () => {
    // Limpiar errores previos
    setValidationError('');
    clearError();

    // Validar campos
    if (!name.trim()) {
      setValidationError('Por favor ingresa tu nombre');
      return;
    }

    if (!email.trim()) {
      setValidationError('Por favor ingresa tu email');
      return;
    }

    if (!validateEmail(email)) {
      setValidationError('Email no válido');
      return;
    }

    if (!password) {
      setValidationError('Por favor crea una contraseña');
      return;
    }

    if (password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden');
      return;
    }

    if (!agreeToTerms) {
      setValidationError('Debes aceptar los Términos de Servicio');
      return;
    }

    // Intentar signup
    const { success, error: signupError } = await signup(
      email,
      password,
      name
    );

    if (!success) {
      setValidationError(signupError || 'Error al crear la cuenta');
    }
  }, [name, email, password, confirmPassword, agreeToTerms, signup, clearError]);

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
          <View className="pt-8 pb-6 items-center">
            <Text className="text-4xl mb-3">🧠</Text>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Crear Cuenta
            </Text>
            <Text className="text-gray-600 text-center px-6 text-sm">
              Únete a Life Coach AI y mejora tu productividad
            </Text>
          </View>

          {/* Form Container */}
          <View className="px-6 py-6">
            {/* Error Alert */}
            {errorMessage && (
              <View className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                <Text className="text-red-700 font-semibold text-sm">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Name Input */}
            <View className="mb-4">
              <Text className="text-gray-900 font-semibold text-sm mb-2">
                Nombre
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholder="Tu nombre completo"
                placeholderTextColor="#d1d5db"
                autoCapitalize="words"
                editable={!isSigningUp}
                value={name}
                onChangeText={setName}
                onFocus={() => setValidationError('')}
              />
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-gray-900 font-semibold text-sm mb-2">
                Email
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholder="tu@email.com"
                placeholderTextColor="#d1d5db"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSigningUp}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setValidationError('')}
              />
              <Text className="text-xs text-gray-500 mt-1">
                Te enviaremos un email de confirmación
              </Text>
            </View>

            {/* Password Input */}
            <View className="mb-4">
              <Text className="text-gray-900 font-semibold text-sm mb-2">
                Contraseña
              </Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
                <TextInput
                  className="flex-1 text-gray-900"
                  placeholder="••••••••"
                  placeholderTextColor="#d1d5db"
                  secureTextEntry={!showPassword}
                  editable={!isSigningUp}
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

            {/* Confirm Password Input */}
            <View className="mb-5">
              <Text className="text-gray-900 font-semibold text-sm mb-2">
                Confirma Contraseña
              </Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
                <TextInput
                  className="flex-1 text-gray-900"
                  placeholder="••••••••"
                  placeholderTextColor="#d1d5db"
                  secureTextEntry={!showPassword}
                  editable={!isSigningUp}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setValidationError('')}
                />
              </View>
            </View>

            {/* Terms Agreement */}
            <Pressable
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              className="flex-row items-start mb-6 active:opacity-70"
            >
              <View
                className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 mt-0.5 ${
                  agreeToTerms
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'border-gray-300'
                }`}
              >
                {agreeToTerms && (
                  <Text className="text-white font-bold text-sm">✓</Text>
                )}
              </View>
              <Text className="flex-1 text-gray-700 text-sm leading-5">
                Acepto los{' '}
                <Text className="text-indigo-600 font-semibold">
                  Términos de Servicio
                </Text>{' '}
                y la{' '}
                <Text className="text-indigo-600 font-semibold">
                  Política de Privacidad
                </Text>
              </Text>
            </Pressable>

            {/* Sign Up Button */}
            <Pressable
              onPress={handleSignup}
              disabled={isSigningUp}
              className={`rounded-lg py-3 items-center mb-4 ${
                isSigningUp
                  ? 'bg-indigo-300'
                  : 'bg-indigo-600 active:bg-indigo-700'
              }`}
            >
              {isSigningUp ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Crear Cuenta
                </Text>
              )}
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="text-gray-500 mx-3 text-xs">O</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Login Link */}
            <View className="flex-row items-center justify-center">
              <Text className="text-gray-700 text-sm">
                ¿Ya tienes cuenta?{' '}
              </Text>
              <Pressable
                onPress={onNavigateToLogin}
                className="active:opacity-70"
              >
                <Text className="text-indigo-600 font-bold text-sm">
                  Inicia sesión
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer Info */}
          <View className="px-6 py-6 items-center">
            <Text className="text-gray-500 text-xs text-center leading-5">
              Tus datos están protegidos y encriptados. Nunca compartiremos tu
              información.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};
