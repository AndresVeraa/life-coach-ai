/**
 * useAuth Hook
 *
 * Hook personalizado para acceder a funcionalidad de autenticación
 * Wrapper conveniente alrededor de useAuthStore
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth.store';

/**
 * Hook para usar autenticación en componentes
 */
export const useAuth = () => {
  const {
    user,
    session,
    isLoading,
    isSigningUp,
    error,
    initialize,
    login,
    signup,
    logout,
    clearError,
    updateProfile,
  } = useAuthStore();

  // Inicializar store al montar
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // Estado
    user,
    session,
    isLoading,
    isSigningUp,
    error,
    isAuthenticated: !!user && !!session,

    // Métodos
    login,
    signup,
    logout,
    clearError,
    updateProfile,
  };
};
