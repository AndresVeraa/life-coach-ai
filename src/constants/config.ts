import Constants from 'expo-constants';

/**
 * Detectar si estamos en un EAS Build
 * En EAS builds, las variables pueden no estar en build time pero sí en runtime
 */
export const isEASBuild = (): boolean => {
  // EAS inyecta esta variable durante el build
  if (process.env.EAS_BUILD === 'true') {
    return true;
  }
  
  // También verificar en runtime
  return (
    Constants.executionEnvironment === 'storeClient' ||
    Constants.appOwnership === 'standalone' ||
    (Constants.expoConfig?.extra?.eas?.projectId !== undefined && 
     Constants.expoConfig?.extra?.eas?.projectId !== '')
  );
};

/**
 * Tipos para la configuración de la aplicación
 */
interface AppExtra {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  debugMode?: boolean;
  eas?: {
    projectId?: string;
  };
}

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  OPENAI_API_KEY: string;
  GEMINI_API_KEY: string;
  DEBUG_MODE: boolean;
  EAS_PROJECT_ID: string;
}

interface AppConfig {
  APP_NAME: string;
  APP_VERSION: string;
}

interface FullConfig {
  env: EnvConfig;
  app: AppConfig;
  timeouts: {
    API_TIMEOUT_MS: number;
    SYNC_INTERVAL_MS: number;
    DEBOUNCE_DELAY_MS: number;
  };
  limits: {
    MAX_RETRIES: number;
    BACKOFF_MULTIPLIER: number;
  };
  storageKeys: {
    TASKS: string;
    HEALTH: string;
    AUDIT: string;
    COACH: string;
    USER: string;
    SYNC_QUEUE: string;
    AUTH: string;
    ANALYTICS: string;
  };
  apiEndpoints: {
    TASKS: string;
    HEALTH: string;
    AUDIT: string;
    COACH: string;
    USER: string;
  };
  defaultUserStats: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    tasksToday: number;
    completedToday: number;
    averageSleep: number;
    totalDistractions: number;
  };
}

/**
 * Obtener variables de entorno desde expo-constants
 */
const getExtraConfig = (): AppExtra => {
  return (Constants.expoConfig?.extra as AppExtra) || {};
};

/**
 * Cache para evitar múltiples lecturas
 */
let cachedConfig: FullConfig | null = null;

/**
 * Warnings de configuración (no bloquean la app)
 */
const configWarnings: string[] = [];

/**
 * Errores críticos de configuración (bloquean la app en desarrollo)
 */
const configErrors: string[] = [];

/**
 * Validar que una variable de entorno existe
 * En EAS builds, solo genera warnings, no errors (las variables vienen de EAS Secrets en runtime)
 */
const validateEnvVar = (
  value: string | undefined,
  name: string,
  required: boolean = false
): string => {
  if (!value || value.trim() === '') {
    if (required) {
      if (isEASBuild()) {
        // En EAS Build, solo warning - las variables vienen de EAS Secrets
        configWarnings.push(`⚠️ ${name} not set at build time (injected at runtime via EAS Secrets)`);
      } else {
        // En desarrollo local, es un error crítico
        configErrors.push(`❌ ${name} is required but not set`);
      }
    }
    return '';
  }
  return value;
};

/**
 * Obtener configuración completa con validación
 * En EAS builds, es más permisivo con variables faltantes
 */
export const getConfig = (): FullConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const extra = getExtraConfig();
  
  // Limpiar errores/warnings previos
  configErrors.length = 0;
  configWarnings.length = 0;

  // Validar variables de entorno
  // En EAS builds, estas pueden estar vacías en build time pero llegar en runtime
  const supabaseUrl = validateEnvVar(extra.supabaseUrl, 'EXPO_PUBLIC_SUPABASE_URL', true);
  const supabaseAnonKey = validateEnvVar(extra.supabaseAnonKey, 'EXPO_PUBLIC_SUPABASE_ANON_KEY', true);
  const openaiApiKey = validateEnvVar(extra.openaiApiKey, 'EXPO_PUBLIC_OPENAI_API_KEY', false);
  const geminiApiKey = validateEnvVar(extra.geminiApiKey, 'EXPO_PUBLIC_GEMINI_API_KEY', false);
  const easProjectId = extra.eas?.projectId || '';

  // Verificar que al menos una API key de IA esté configurada
  if (!openaiApiKey && !geminiApiKey) {
    configWarnings.push('⚠️ No AI API key configured. Set EXPO_PUBLIC_OPENAI_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY');
  }

  // Warning si no hay EAS Project ID (solo en desarrollo local)
  if (!easProjectId && !isEASBuild()) {
    configWarnings.push('⚠️ EXPO_PUBLIC_EAS_PROJECT_ID not set. EAS builds and OTA updates will not work.');
  }

  cachedConfig = {
    env: {
      SUPABASE_URL: supabaseUrl,
      SUPABASE_ANON_KEY: supabaseAnonKey,
      OPENAI_API_KEY: openaiApiKey,
      GEMINI_API_KEY: geminiApiKey,
      DEBUG_MODE: extra.debugMode ?? false,
      EAS_PROJECT_ID: easProjectId,
    },
    app: {
      APP_NAME: 'Life Coach AI',
      APP_VERSION: Constants.expoConfig?.version || '1.0.0',
    },
    timeouts: {
      API_TIMEOUT_MS: 15000,
      SYNC_INTERVAL_MS: 5 * 60 * 1000, // 5 minutos
      DEBOUNCE_DELAY_MS: 500,
    },
    limits: {
      MAX_RETRIES: 3,
      BACKOFF_MULTIPLIER: 2,
    },
    storageKeys: {
      TASKS: 'tasks-storage',
      HEALTH: 'health-storage',
      AUDIT: 'audit-storage',
      COACH: 'coach-storage',
      USER: 'user-storage',
      SYNC_QUEUE: 'sync-queue',
      AUTH: 'auth-storage',
      ANALYTICS: 'analytics-storage',
    },
    apiEndpoints: {
      TASKS: '/api/tasks',
      HEALTH: '/api/health',
      AUDIT: '/api/audit',
      COACH: '/api/coach',
      USER: '/api/user',
    },
    defaultUserStats: {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      tasksToday: 0,
      completedToday: 0,
      averageSleep: 8,
      totalDistractions: 0,
    },
  };

  return cachedConfig;
};

/**
 * Verificar configuración al startup
 * @returns Array de todos los mensajes (errores + warnings)
 */
export const validateConfig = (): string[] => {
  // Forzar lectura de config para ejecutar validaciones
  getConfig();
  return [...configErrors, ...configWarnings];
};

/**
 * Obtener solo errores críticos
 */
export const getCriticalErrors = (): string[] => {
  validateConfig();
  return configErrors.filter((e) => e.startsWith('❌'));
};

/**
 * Obtener solo warnings
 */
export const getConfigWarnings = (): string[] => {
  validateConfig();
  return [...configWarnings, ...configErrors.filter((e) => e.startsWith('⚠️'))];
};

/**
 * Verificar si hay errores críticos de configuración
 * En EAS builds, ser más permisivo
 */
export const hasConfigErrors = (): boolean => {
  validateConfig();
  
  // En EAS builds, no tratar variables faltantes como errores críticos
  if (isEASBuild()) {
    return false;
  }
  
  return configErrors.some((e) => e.startsWith('❌'));
};

/**
 * Obtener mensaje de error para mostrar al usuario
 */
export const getConfigErrorMessage = (): string | null => {
  const criticalErrors = getCriticalErrors();
  
  // En EAS builds, no mostrar error si solo son warnings
  if (isEASBuild() && criticalErrors.length === 0) {
    return null;
  }
  
  if (criticalErrors.length === 0) {
    return null;
  }

  return `Configuration Error:\n${criticalErrors.join('\n')}`;
};

/**
 * Limpiar cache (útil para testing)
 */
export const resetConfigCache = (): void => {
  cachedConfig = null;
  configErrors.length = 0;
  configWarnings.length = 0;
};

// ============================================
// EXPORTS LEGACY (para compatibilidad)
// ============================================

/**
 * @deprecated Use getConfig().env instead
 */
export const ENV = {
  get SUPABASE_URL() {
    return getConfig().env.SUPABASE_URL;
  },
  get SUPABASE_ANON_KEY() {
    return getConfig().env.SUPABASE_ANON_KEY;
  },
  get OPENAI_API_KEY() {
    return getConfig().env.OPENAI_API_KEY;
  },
  get GEMINI_API_KEY() {
    return getConfig().env.GEMINI_API_KEY;
  },
  get DEBUG_MODE() {
    return getConfig().env.DEBUG_MODE;
  },
  get EAS_PROJECT_ID() {
    return getConfig().env.EAS_PROJECT_ID;
  },
  // Legacy names
  get APP_NAME() {
    return getConfig().app.APP_NAME;
  },
  get APP_VERSION() {
    return getConfig().app.APP_VERSION;
  },
};

/**
 * @deprecated Use getConfig() instead
 */
export const CONFIG = {
  get API_TIMEOUT_MS() {
    return getConfig().timeouts.API_TIMEOUT_MS;
  },
  get SYNC_INTERVAL_MS() {
    return getConfig().timeouts.SYNC_INTERVAL_MS;
  },
  get DEBOUNCE_DELAY_MS() {
    return getConfig().timeouts.DEBOUNCE_DELAY_MS;
  },
  get MAX_RETRIES() {
    return getConfig().limits.MAX_RETRIES;
  },
  get BACKOFF_MULTIPLIER() {
    return getConfig().limits.BACKOFF_MULTIPLIER;
  },
  get STORAGE_KEYS() {
    return getConfig().storageKeys;
  },
  get API_ENDPOINTS() {
    return getConfig().apiEndpoints;
  },
  get DEFAULT_USER_STATS() {
    return getConfig().defaultUserStats;
  },
};
