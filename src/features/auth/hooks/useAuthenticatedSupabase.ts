/**
 * useAuthenticatedSupabase Hook
 *
 * Hook para obtener un cliente Supabase autenticado con refresh automático.
 * Este es el ÚNICO punto de entrada para operaciones autenticadas con Supabase.
 */

import { useCallback, useEffect, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, getAnonSupabaseClient } from '@/services/db/supabaseClient';
import { useAuthStore } from '@/features/auth/auth.store';
import { getConfig } from '@/constants/config';

export interface AuthenticatedSupabaseResult {
  client: SupabaseClient | null;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  error: string | null;
  getClient: () => Promise<SupabaseClient>;
  checkSession: () => Promise<boolean>;
}

/**
 * Hook para usar Supabase autenticado en componentes
 */
export const useAuthenticatedSupabase = (): AuthenticatedSupabaseResult => {
  const {
    tokens,
    session,
    isRefreshing,
    error,
    refreshSessionIfNeeded,
    getAccessToken,
  } = useAuthStore();

  const config = getConfig();
  const lastClientRef = useRef<SupabaseClient | null>(null);

  const getCurrentClient = useCallback((): SupabaseClient | null => {
    if (!tokens?.access_token) {
      return null;
    }
    return getSupabaseClient({ accessToken: tokens.access_token });
  }, [tokens?.access_token]);

  const getClient = useCallback(async (): Promise<SupabaseClient> => {
    const isValid = await refreshSessionIfNeeded();

    if (!isValid) {
      throw new Error('SESSION_EXPIRED: No se pudo refrescar la sesión');
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error('NO_TOKEN: No hay token de acceso disponible');
    }

    const client = getSupabaseClient({ accessToken });
    lastClientRef.current = client;

    return client;
  }, [refreshSessionIfNeeded, getAccessToken]);

  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const isValid = await refreshSessionIfNeeded();
      return isValid;
    } catch {
      return false;
    }
  }, [refreshSessionIfNeeded]);

  useEffect(() => {
    if (config.env.DEBUG_MODE) {
      console.log('[useAuthenticatedSupabase] Estado:', {
        isAuthenticated: !!session,
        hasTokens: !!tokens,
        isRefreshing,
      });
    }
  }, [session, tokens, isRefreshing, config.env.DEBUG_MODE]);

  return {
    client: getCurrentClient(),
    isAuthenticated: !!session && !!tokens,
    isRefreshing,
    error,
    getClient,
    checkSession,
  };
};

/**
 * Hook simplificado para obtener cliente autenticado
 */
export const useRequireAuth = (): {
  getClient: () => Promise<SupabaseClient>;
  isReady: boolean;
} => {
  const { getClient, isAuthenticated, isRefreshing } = useAuthenticatedSupabase();

  return {
    getClient,
    isReady: isAuthenticated && !isRefreshing,
  };
};

// ============================================
// HELPER FUNCTIONS (para uso fuera de componentes)
// ============================================

/**
 * Obtener cliente autenticado fuera de componentes React
 */
export const getAuthenticatedClient = async (): Promise<SupabaseClient> => {
  const { tokens, refreshSessionIfNeeded, getAccessToken } = useAuthStore.getState();
  const config = getConfig();

  if (config.env.DEBUG_MODE) {
    console.log('[getAuthenticatedClient] Obteniendo cliente autenticado...');
  }

  if (!tokens) {
    throw new Error('NO_AUTH: No hay sesión activa');
  }

  const isValid = await refreshSessionIfNeeded();

  if (!isValid) {
    throw new Error('SESSION_EXPIRED: La sesión expiró y no se pudo refrescar');
  }

  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('NO_TOKEN: No se pudo obtener token de acceso');
  }

  return getSupabaseClient({ accessToken });
};

/**
 * Ejecutar operación con cliente autenticado
 */
export const withAuthenticatedClient = async <T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> => {
  const client = await getAuthenticatedClient();
  return operation(client);
};
