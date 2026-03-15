/**
 * Auth Store
 *
 * Gestiona estado de autenticación (login/signup/logout)
 * Almacena tokens de forma segura con SecureStore
 * Sincroniza con Supabase Auth
 * Refresh automático de tokens
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getAnonSupabaseClient, getSupabaseClient } from '@/services/db/supabaseClient';
import { AuthError, Session } from '@supabase/supabase-js';
import { getConfig } from '@/constants/config';

// ============================================
// TYPES
// ============================================

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp en segundos
}

interface AuthState {
  // Estado
  user: AuthUser | null;
  session: Session | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSigningUp: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefreshAttempt: number | null;

  // Métodos principales
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;

  // Métodos de token
  getAccessToken: () => Promise<string | null>;
  refreshSessionIfNeeded: () => Promise<boolean>;
  isTokenExpiringSoon: (thresholdMinutes?: number) => boolean;
}

// ============================================
// SECURE STORE KEYS
// ============================================

const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  EXPIRES_AT: 'auth_expires_at',
} as const;

// ============================================
// HELPER FUNCTIONS - SECURE TOKEN STORAGE
// ============================================

/**
 * Guardar tokens en SecureStore
 */
const saveTokensToSecureStore = async (tokens: AuthTokens): Promise<void> => {
  const config = getConfig();

  try {
    await Promise.all([
      SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, tokens.access_token),
      SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, tokens.refresh_token),
      SecureStore.setItemAsync(SECURE_STORE_KEYS.EXPIRES_AT, tokens.expires_at.toString()),
    ]);

    if (config.env.DEBUG_MODE) {
      console.log('[Auth] Tokens guardados en SecureStore');
    }
  } catch (err) {
    console.error('[Auth] Error guardando tokens en SecureStore:', err);
    throw err;
  }
};

/**
 * Cargar tokens desde SecureStore
 */
const loadTokensFromSecureStore = async (): Promise<AuthTokens | null> => {
  const config = getConfig();

  try {
    const [accessToken, refreshToken, expiresAtStr] = await Promise.all([
      SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
      SecureStore.getItemAsync(SECURE_STORE_KEYS.EXPIRES_AT),
    ]);

    if (!accessToken || !refreshToken || !expiresAtStr) {
      if (config.env.DEBUG_MODE) {
        console.log('[Auth] No hay tokens en SecureStore');
      }
      return null;
    }

    const tokens: AuthTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: parseInt(expiresAtStr, 10),
    };

    if (config.env.DEBUG_MODE) {
      console.log('[Auth] Tokens cargados desde SecureStore');
    }

    return tokens;
  } catch (err) {
    console.error('[Auth] Error cargando tokens de SecureStore:', err);
    return null;
  }
};

/**
 * Eliminar tokens de SecureStore
 */
const clearTokensFromSecureStore = async (): Promise<void> => {
  const config = getConfig();

  try {
    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(SECURE_STORE_KEYS.EXPIRES_AT),
    ]);

    if (config.env.DEBUG_MODE) {
      console.log('[Auth] Tokens eliminados de SecureStore');
    }
  } catch (err) {
    console.error('[Auth] Error eliminando tokens de SecureStore:', err);
  }
};

/**
 * Extraer tokens de una sesión de Supabase
 */
const extractTokensFromSession = (session: Session): AuthTokens => {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
  };
};

/**
 * Limpiar stores de dominio al cerrar sesión.
 * Preserva preferencias de salud (targetWakeTime/targetBedTime/alarmas).
 */
const clearDomainStoresOnLogout = async (): Promise<void> => {
  const config = getConfig();
  const keysToRemove = [
    'tasks-storage',
    'tasks-pro-v2-storage',
    'coach-chat-v2-storage',
    'analytics-store',
    'audit-analytics-v2-storage',
    'university-storage',
  ];

  try {
    await Promise.all(keysToRemove.map((key) => AsyncStorage.removeItem(key)));

    // Limpieza selectiva de health (preservar preferencias)
    const healthKey = 'health-v3-storage';
    const raw = await AsyncStorage.getItem(healthKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed?.state ?? parsed;

      const preserved = {
        targetWakeTime: state?.targetWakeTime ?? '07:00',
        targetBedTime: state?.targetBedTime ?? '23:00',
        wakeAlarmEnabled: state?.wakeAlarmEnabled ?? false,
        bedAlarmEnabled: state?.bedAlarmEnabled ?? false,
      };

      const cleanedState = {
        ...state,
        sleepRecords: [],
        records: [],
        sleepLogs: [],
        last7Days: [],
        sleepStats: {
          weeklyAverage: 0,
          monthlyAverage: 0,
          bestStreak: 0,
          currentStreak: 0,
          totalRecords: 0,
          sleepDebt: 0,
          trendDirection: 'estable',
        },
        metrics: {
          averageSleep: 0,
          consecutiveDays: 0,
          bestDay: 0,
          worstDay: 0,
          goalMet: false,
          lastRecordDate: null,
          totalRecordsMonth: 0,
        },
        ...preserved,
      };

      const nextRaw = parsed?.state
        ? JSON.stringify({ ...parsed, state: cleanedState })
        : JSON.stringify(cleanedState);

      await AsyncStorage.setItem(healthKey, nextRaw);
    }

    if (config.env.DEBUG_MODE) {
      console.log('[Auth] Stores de dominio limpiados (preferencias preservadas)');
    }
  } catch (err) {
    console.error('[Auth] Error limpiando stores en logout:', err);
  }
};

// ============================================
// STORE
// ============================================

/**
 * Store de autenticación con persistencia y SecureStore para tokens
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      session: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,
      isSigningUp: false,
      isRefreshing: false,
      error: null,
      lastRefreshAttempt: null,

      /**
       * Obtener token de acceso actual (con refresh si es necesario)
       */
      getAccessToken: async (): Promise<string | null> => {
        const config = getConfig();
        const { tokens, refreshSessionIfNeeded } = get();
        
        if (!tokens) {
          if (config.env.DEBUG_MODE) {
            console.log('[Auth] getAccessToken: No hay tokens');
          }
          return null;
        }

        // Verificar si el token está por expirar
        const isExpiringSoon = get().isTokenExpiringSoon(5); // 5 minutos
        
        if (isExpiringSoon) {
          if (config.env.DEBUG_MODE) {
            console.log('[Auth] Token expirando pronto, refrescando...');
          }
          const refreshed = await refreshSessionIfNeeded();
          if (!refreshed) {
            return null;
          }
        }

        return get().tokens?.access_token || null;
      },

      /**
       * Verificar si el token expira pronto
       */
      isTokenExpiringSoon: (thresholdMinutes: number = 5): boolean => {
        const { tokens } = get();
        if (!tokens) return true;

        const nowSeconds = Math.floor(Date.now() / 1000);
        const thresholdSeconds = thresholdMinutes * 60;
        
        return tokens.expires_at - nowSeconds <= thresholdSeconds;
      },

      /**
       * Refrescar sesión si es necesario
       */
      refreshSessionIfNeeded: async (): Promise<boolean> => {
        const config = getConfig();
        const { tokens, isRefreshing, lastRefreshAttempt, session } = get();
        
        // Si ya estamos refrescando, esperar
        if (isRefreshing) {
          if (config.env.DEBUG_MODE) {
            console.log('[Auth] Ya hay un refresh en progreso');
          }
          return !!tokens;
        }

        // Si no hay tokens, no podemos refrescar
        if (!tokens || !tokens.refresh_token) {
          if (config.env.DEBUG_MODE) {
            console.log('[Auth] No hay refresh token disponible');
          }
          return false;
        }

        // Rate limiting: no refrescar más de una vez cada 30 segundos
        const now = Date.now();
        if (lastRefreshAttempt && now - lastRefreshAttempt < 30000) {
          if (config.env.DEBUG_MODE) {
            console.log('[Auth] Rate limiting refresh (30s cooldown)');
          }
          return !!tokens;
        }

        // Verificar si necesita refresh
        const isExpiringSoon = get().isTokenExpiringSoon(5);
        if (!isExpiringSoon) {
          return true;
        }

        // Ejecutar refresh
        set({ isRefreshing: true, lastRefreshAttempt: now });

        try {
          if (config.env.DEBUG_MODE) {
            console.log('[Auth] Iniciando refresh de sesión...');
          }

          const supabase = getAnonSupabaseClient();
          const { data, error } = await supabase.auth.refreshSession({
            refresh_token: tokens.refresh_token,
          });

          if (error) {
            console.error('[Auth] Error refrescando sesión:', error.message);
            
            // Si el refresh token es inválido, limpiar sesión
            if (error.message.includes('invalid') || error.message.includes('expired')) {
              await clearTokensFromSecureStore();
              set({
                user: null,
                session: null,
                tokens: null,
                isAuthenticated: false,
                error: 'SESSION_EXPIRED',
              });
            }
            
            return false;
          }

          if (data.session) {
            const newTokens = extractTokensFromSession(data.session);
            
            // Guardar tokens en SecureStore
            await saveTokensToSecureStore(newTokens);

            if (config.env.DEBUG_MODE) {
              console.log('[Auth] Sesión refrescada exitosamente');
            }

            set({
              session: data.session,
              tokens: newTokens,
              isAuthenticated: true,
              error: null,
            });

            return true;
          }

          return false;
        } catch (err) {
          console.error('[Auth] Error inesperado en refresh:', err);
          return false;
        } finally {
          set({ isRefreshing: false });
        }
      },

      /**
       * Inicializar store - verificar sesión existente
       */
      initialize: async () => {
        const config = getConfig();
        
        try {
          set({ isLoading: true, error: null });

          if (config.env.DEBUG_MODE) {
            console.log('[Auth] Inicializando...');
          }

          // Primero intentar cargar tokens desde SecureStore
          const storedTokens = await loadTokensFromSecureStore();

          if (storedTokens) {
            if (config.env.DEBUG_MODE) {
              console.log('[Auth] Tokens encontrados en SecureStore');
            }

            // Establecer tokens temporalmente
            set({ tokens: storedTokens, isAuthenticated: true });

            // Verificar si los tokens son válidos refrescando
            const isValid = await get().refreshSessionIfNeeded();

            if (isValid && get().tokens) {
              const supabase = getSupabaseClient({ accessToken: get().tokens!.access_token });
              
              // Cargar perfil del usuario
              const { data: { user: authUser } } = await supabase.auth.getUser();
              
              if (authUser) {
                const { data: profile } = await supabase
                  .from('user_profiles')
                  .select('*')
                  .eq('id', authUser.id)
                  .single();

                const user: AuthUser = {
                  id: authUser.id,
                  email: authUser.email || '',
                  name: profile?.name || authUser.user_metadata?.name,
                  avatar_url: profile?.avatar_url,
                  created_at: authUser.created_at || new Date().toISOString(),
                };

                set({ user, isAuthenticated: true, error: null });
                
                if (config.env.DEBUG_MODE) {
                  console.log('[Auth] Inicialización completa:', user.email);
                }
                return;
              }
            }
          }

          // No hay sesión válida
          if (config.env.DEBUG_MODE) {
            console.log('[Auth] No hay sesión activa');
          }
          
          set({ user: null, session: null, tokens: null, isAuthenticated: false });
        } catch (err) {
          const message = err instanceof AuthError ? err.message : 'Error inicializando sesión';
          console.error('[Auth] Initialize error:', message);
          set({ error: message, user: null, session: null, tokens: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Login con email y password
       */
      login: async (email: string, password: string) => {
        const config = getConfig();
        
        try {
          set({ isLoading: true, error: null });

          if (config.env.DEBUG_MODE) {
            console.log('[Auth] Login:', email);
          }

          const supabase = getAnonSupabaseClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            throw error;
          }

          if (data.session?.user) {
            // Extraer y guardar tokens
            const tokens = extractTokensFromSession(data.session);
            await saveTokensToSecureStore(tokens);

            // Cargar perfil del usuario
            const authenticatedClient = getSupabaseClient({ accessToken: tokens.access_token });
            const { data: profile } = await authenticatedClient
              .from('user_profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();

            const user: AuthUser = {
              id: data.session.user.id,
              email: data.session.user.email || '',
              name: profile?.name,
              avatar_url: profile?.avatar_url,
              created_at: data.session.user.created_at || new Date().toISOString(),
            };

            set({ user, session: data.session, tokens, isAuthenticated: true, error: null });
            
            if (config.env.DEBUG_MODE) {
              console.log('[Auth] Login exitoso:', user.email);
            }
            
            return { success: true };
          }

          return { success: false, error: 'No session data' };
        } catch (err) {
          const message =
            err instanceof AuthError
              ? err.message
              : typeof err === 'object' && err !== null && 'message' in err
                ? String(err.message)
                : 'Error al iniciar sesión';

          console.error('[Auth] Login error:', message);
          set({ error: message, isAuthenticated: false });
          return { success: false, error: message };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Sign up con email, password and name
       */
      signup: async (email: string, password: string, name?: string) => {
        const config = getConfig();
        
        try {
          set({ isSigningUp: true, error: null });

          if (config.env.DEBUG_MODE) {
            console.log('[Auth] Signup:', email);
          }

          const supabase = getAnonSupabaseClient();
          
          // Crear cuenta en Supabase Auth
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name || email.split('@')[0],
              },
            },
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            // Si supabase.auth.signUp auto-confirma (sin verificación de email)
            if (data.session) {
              // Extraer y guardar tokens
              const tokens = extractTokensFromSession(data.session);
              await saveTokensToSecureStore(tokens);

              const authenticatedClient = getSupabaseClient({ accessToken: tokens.access_token });
              
              // Crear perfil en tabla user_profiles
              const { error: profileError } = await authenticatedClient.from('user_profiles').insert({
                id: data.user.id,
                email: data.user.email,
                name: name || email.split('@')[0],
                created_at: new Date().toISOString(),
              });

              if (profileError) {
                console.warn('[Auth] Error creando perfil:', profileError);
              }

              const user: AuthUser = {
                id: data.user.id,
                email: data.user.email || '',
                name: name || email.split('@')[0],
                created_at: data.user.created_at || new Date().toISOString(),
              };

              set({ user, session: data.session, tokens, isAuthenticated: true, error: null });
              
              if (config.env.DEBUG_MODE) {
                console.log('[Auth] Signup exitoso:', user.email);
              }
              
              return { success: true };
            }

            // Si requiere email verification
            return {
              success: true,
              error: 'Verifica tu email para completar el registro',
            };
          }

          return { success: false, error: 'Error creando cuenta' };
        } catch (err) {
          const message =
            err instanceof AuthError
              ? err.message
              : typeof err === 'object' && err !== null && 'message' in err
                ? String(err.message)
                : 'Error al registrarse';

          console.error('[Auth] Signup error:', message);
          set({ error: message, isAuthenticated: false });
          return { success: false, error: message };
        } finally {
          set({ isSigningUp: false });
        }
      },

      /**
       * Logout - eliminar sesión y tokens
       */
      logout: async () => {
        const config = getConfig();
        
        try {
          set({ isLoading: true });

          if (config.env.DEBUG_MODE) {
            console.log('[Auth] Logout...');
          }

          const supabase = getAnonSupabaseClient();
          const { error } = await supabase.auth.signOut();

          if (error) {
            console.warn('[Auth] Error en signOut:', error);
          }

          // Siempre limpiar tokens locales
          await clearTokensFromSecureStore();

          // Limpiar stores de dominio (con preferencias de health preservadas)
          await clearDomainStoresOnLogout();

          set({ user: null, session: null, tokens: null, isAuthenticated: false, error: null });
          
          if (config.env.DEBUG_MODE) {
            console.log('[Auth] Logout completo');
          }
        } catch (err) {
          const message = err instanceof AuthError ? err.message : 'Error al cerrar sesión';
          console.error('[Auth] Logout error:', message);
          
          // Aún así limpiar estado local
          await clearTokensFromSecureStore();
          await clearDomainStoresOnLogout();
          set({ user: null, session: null, tokens: null, isAuthenticated: false, error: message });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Limpiar mensaje de error
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Actualizar perfil del usuario
       */
      updateProfile: async (updates: Partial<AuthUser>) => {
        const config = getConfig();
        
        try {
          const { user, tokens } = get();
          if (!user || !tokens) {
            throw new Error('No user logged in');
          }

          const supabase = getSupabaseClient({ accessToken: tokens.access_token });
          
          const { error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user.id);

          if (error) {
            throw error;
          }

          // Actualizar estado local
          set({
            user: { ...user, ...updates },
          });
          
          if (config.env.DEBUG_MODE) {
            console.log('[Auth] Perfil actualizado');
          }
        } catch (err) {
          const message = err instanceof AuthError ? err.message : 'Error actualizando perfil';
          set({ error: message });
          throw err;
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo persistir datos no sensibles en AsyncStorage
      // Los tokens van en SecureStore
      partialize: (state) => ({
        user: state.user,
        // NO persistir session ni tokens aquí - van en SecureStore
      }),
    }
  )
);

// ============================================
// HELPERS EXPORTADOS
// ============================================

/**
 * Helper: Check if user is authenticated
 */
export const isUserAuthenticated = (): boolean => {
  const { isAuthenticated, user, session, tokens } = useAuthStore.getState();
  return isAuthenticated || !!(user && (session || tokens));
};

/**
 * Helper: Get current user
 */
export const getCurrentAuthUser = (): AuthUser | null => {
  return useAuthStore.getState().user;
};

/**
 * Helper: Get current tokens (para uso en servicios)
 */
export const getCurrentTokens = (): AuthTokens | null => {
  return useAuthStore.getState().tokens;
};

/**
 * Helper: Suscribirse a eventos de auth (para syncManager, etc.)
 */
export const subscribeToAuthEvents = (
  onSessionExpired: () => void,
  onSessionRefreshed: () => void
): (() => void) => {
  return useAuthStore.subscribe((state, prevState) => {
    // Detectar sesión expirada
    if (prevState.tokens && !state.tokens && state.error === 'SESSION_EXPIRED') {
      onSessionExpired();
    }
    
    // Detectar sesión refrescada
    if (!prevState.tokens && state.tokens) {
      onSessionRefreshed();
    }
  });
};

// Exportar tipo para uso externo
export type { AuthUser, AuthTokens };
