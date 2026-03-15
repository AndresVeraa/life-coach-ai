import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const animatePress = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSignup = useCallback(async () => {
    setValidationError('');
    clearError();

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

    const { success, error: signupError } = await signup(email, password, name);

    if (!success) {
      setValidationError(signupError || 'Error al crear la cuenta');
    }
  }, [name, email, password, confirmPassword, agreeToTerms, signup, clearError]);

  const errorMessage = error || validationError;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={styles.logoBubble}>
              <Text style={styles.logo}>🤖</Text>
            </View>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a Life Coach AI</Text>
          </View>

          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                placeholder="Tu nombre"
                placeholderTextColor="#6B6B8A"
                autoCapitalize="words"
                editable={!isSigningUp}
                value={name}
                onChangeText={setName}
                onFocus={() => { setFocusedField('name'); setValidationError(''); }}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                placeholder="tu@email.com"
                placeholderTextColor="#6B6B8A"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSigningUp}
                value={email}
                onChangeText={setEmail}
                onFocus={() => { setFocusedField('email'); setValidationError(''); }}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput, focusedField === 'password' && styles.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor="#6B6B8A"
                  secureTextEntry={!showPassword}
                  editable={!isSigningUp}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => { setFocusedField('password'); setValidationError(''); }}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput, focusedField === 'confirm' && styles.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor="#6B6B8A"
                  secureTextEntry={!showConfirmPassword}
                  editable={!isSigningUp}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => { setFocusedField('confirm'); setValidationError(''); }}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeText}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreeToTerms && styles.checkboxActive]}>
                {agreeToTerms && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                Acepto los Términos de Servicio y Política de Privacidad
              </Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                onPress={handleSignup}
                disabled={isSigningUp}
                activeOpacity={0.9}
                onPressIn={() => animatePress(0.96)}
                onPressOut={() => animatePress(1)}
              >
                <LinearGradient
                  colors={['#7C6FCD', '#4ECDC4']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.primaryButton}
                >
                  {isSigningUp ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Crear cuenta</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.footerRow}>
              <Text style={styles.secondaryText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
                <Text style={styles.linkText}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  logoBubble: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#7C6FCD40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#7C6FCD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  logo: {
    fontSize: 42,
  },
  title: {
    color: '#F0F0FF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6B6B8A',
    marginTop: 6,
    fontSize: 14,
  },
  formCard: {
    backgroundColor: '#12121A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF15',
    padding: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.16)',
    borderWidth: 1,
    borderColor: '#FF6B6B66',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#FFB4B4',
    fontWeight: '600',
    fontSize: 13,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#F0F0FF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: '#FFFFFF15',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F0F0FF',
    fontSize: 15,
  },
  inputFocused: {
    borderColor: '#7C6FCD',
    backgroundColor: '#7C6FCD08',
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 4,
  },
  eyeText: {
    fontSize: 20,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FFFFFF25',
    backgroundColor: '#1A1A26',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: '#7C6FCD',
    borderColor: '#7C6FCD',
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  termsText: {
    flex: 1,
    color: '#6B6B8A',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryText: {
    color: '#6B6B8A',
    fontSize: 13,
  },
  linkText: {
    color: '#7C6FCD',
    fontWeight: '700',
    fontSize: 13,
  },
});
