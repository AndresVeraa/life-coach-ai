/**
 * Auth Store
 *
 * Gestiona estado de autenticación (login/signup/logout)
 * Persiste sesión en AsyncStorage
 * Sincroniza con Supabase Auth
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '@/services/db/supabaseClient';
import { AuthError, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthState {
  // Estado
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isSigningUp: boolean;
  error: string | null;

  // Métodos
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

/**
 * Store de autenticación con persistencia
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      session: null,
      isLoading: true,
      isSigningUp: false,
      error: null,

      /**
       * Inicializar store - verificar sesión existente
       */
      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          // Obtener sesión actual
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            throw sessionError;
          }

          if (session?.user) {
            // Usuario autenticado - cargar datos del perfil
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              // PGRST116 = no rows returned (nuevo usuario)
              console.warn('Error cargando perfil:', profileError);
            }

            const user: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: profile?.name || session.user.user_metadata?.name,
              avatar_url: profile?.avatar_url,
              created_at: session.user.created_at || new Date().toISOString(),
            };

            set({ user, session, error: null });
          } else {
            // No hay sesión activa
            set({ user: null, session: null });
          }
        } catch (err) {
          const message = err instanceof AuthError ? err.message : 'Error inicializando sesión';
          console.error('Initialize auth error:', message);
          set({ error: message, user: null, session: null });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Login con email y password
       */
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            throw error;
          }

          if (data.session?.user) {
            // Cargar perfil del usuario
            const { data: profile } = await supabase
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

            set({ user, session: data.session, error: null });
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

          set({ error: message });
          return { success: false, error: message };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Sign up con email, password and name
       */
      signup: async (email: string, password: string, name?: string) => {
        try {
          set({ isSigningUp: true, error: null });

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
            // Crear perfil en tabla user_profiles
            const { error: profileError } = await supabase.from('user_profiles').insert({
              id: data.user.id,
              email: data.user.email,
              name: name || email.split('@')[0],
              created_at: new Date().toISOString(),
            });

            if (profileError) {
              console.warn('Error creando perfil:', profileError);
            }

            // Si supabase.auth.signUp auto-confirma (sin verificación de email)
            // obtener session
            if (data.session) {
              const user: AuthUser = {
                id: data.user.id,
                email: data.user.email || '',
                name: name || email.split('@')[0],
                created_at: data.user.created_at || new Date().toISOString(),
              };

              set({ user, session: data.session, error: null });
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

          set({ error: message });
          return { success: false, error: message };
        } finally {
          set({ isSigningUp: false });
        }
      },

      /**
       * Logout - eliminar sesión
       */
      logout: async () => {
        try {
          set({ isLoading: true });

          const { error } = await supabase.auth.signOut();

          if (error) {
            throw error;
          }

          set({ user: null, session: null, error: null });
        } catch (err) {
          const message = err instanceof AuthError ? err.message : 'Error al cerrar sesión';
          console.error('Logout error:', message);
          set({ error: message });
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
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('No user logged in');
          }

          const { error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', currentUser.id);

          if (error) {
            throw error;
          }

          // Actualizar estado local
          set({
            user: { ...currentUser, ...updates },
          });
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
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);

/**
 * Helper: Check if user is authenticated
 */
export const isUserAuthenticated = (): boolean => {
  const { user, session } = useAuthStore.getState();
  return !!(user && session);
};

/**
 * Helper: Get current user
 */
export const getCurrentAuthUser = (): AuthUser | null => {
  return useAuthStore.getState().user;
};
