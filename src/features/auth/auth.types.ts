/**
 * Auth Helpers & Types
 * 
 * Tipos compartidos y funciones de utilidad para autenticación
 */

import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validar formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar contraseña (mínimo 6 caracteres)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Convertir Supabase user a AuthUser
 */
export const mapSupabaseUserToAuthUser = (
  supabaseUser: SupabaseUser | null,
  profile?: any
): AuthUser | null => {
  if (!supabaseUser) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: profile?.name || supabaseUser.user_metadata?.name,
    avatar_url: profile?.avatar_url,
    created_at: supabaseUser.created_at || new Date().toISOString(),
  };
};

/**
 * Extraer error amigable de Supabase error
 */
export const getFriendlyErrorMessage = (error: any): string => {
  // Errores de autenticación específicos de Supabase
  if (error?.message?.includes('Invalid login credentials')) {
    return 'Email o contraseña incorrectos';
  }
  if (error?.message?.includes('Email not confirmed')) {
    return 'Por favor verifica tu email';
  }
  if (error?.message?.includes('User already registered')) {
    return 'Este email ya está registrado';
  }
  if (error?.message?.includes('weak password')) {
    return 'La contraseña es muy débil';
  }
  if (error?.message?.includes('invalid_grant')) {
    return 'Credenciales inválidas';
  }

  // Error genérico
  return error?.message || 'Algo salió mal, intenta de nuevo';
};
