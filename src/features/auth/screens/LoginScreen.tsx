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

interface LoginScreenProps {
  onNavigateToSignup?: () => void;
}

export const LoginScreen = ({ onNavigateToSignup }: LoginScreenProps) => {
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = useCallback(async () => {
    setValidationError('');
    clearError();

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

    const { success, error: loginError } = await login(email, password);

    if (!success) {
      setValidationError(loginError || 'Error al iniciar sesión');
    }
  }, [email, password, login, clearError]);

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
            <Text style={styles.title}>Life Coach AI</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>

          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                placeholder="tu@email.com"
                placeholderTextColor="#6B6B8A"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
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
                  editable={!isLoading}
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

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
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
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.footerRow}>
              <Text style={styles.secondaryText}>¿No tienes cuenta?</Text>
              <TouchableOpacity onPress={onNavigateToSignup} activeOpacity={0.7}>
                <Text style={styles.linkText}>Crear una</Text>
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
    marginTop: 28,
    marginBottom: 26,
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
  primaryButton: {
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
