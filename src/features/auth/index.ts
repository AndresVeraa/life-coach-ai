/**
 * Auth Module Exports
 */

// Store
export { useAuthStore, isUserAuthenticated, getCurrentAuthUser } from './auth.store';

// Hooks
export { useAuth } from './hooks/useAuth';

// Screens
export { LoginScreen } from './screens/LoginScreen';
export { SignupScreen } from './screens/SignupScreen';
export { ProfileScreen } from './screens/ProfileScreen';

// Types & Helpers
export {
  AuthUser,
  AuthCredentials,
  AuthResponse,
  isValidEmail,
  isValidPassword,
  mapSupabaseUserToAuthUser,
  getFriendlyErrorMessage,
} from './auth.types';
