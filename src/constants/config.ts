// Variables de Entorno (usar import.meta.env en Expo o process.env)
export const ENV = {
  // Supabase
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

  // OpenAI
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',

  // Gemini (alternative)
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',

  // App Config
  APP_NAME: 'Life Coach AI',
  APP_VERSION: '1.0.0',
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG === 'true',
};

// Configuración de valores constantes
export const CONFIG = {
  // Timeouts
  API_TIMEOUT_MS: 15000,
  SYNC_INTERVAL_MS: 5 * 60 * 1000, // 5 minutos
  DEBOUNCE_DELAY_MS: 500,

  // Límites
  MAX_RETRIES: 3,
  BACKOFF_MULTIPLIER: 2,

  // Storage Keys
  STORAGE_KEYS: {
    TASKS: 'tasks-storage',
    HEALTH: 'health-storage',
    AUDIT: 'audit-storage',
    COACH: 'coach-storage',
    USER: 'user-storage',
    SYNC_QUEUE: 'sync-queue',
  },

  // API Endpoints
  API_ENDPOINTS: {
    TASKS: '/api/tasks',
    HEALTH: '/api/health',
    AUDIT: '/api/audit',
    COACH: '/api/coach',
    USER: '/api/user',
  },

  // Default Values
  DEFAULT_USER_STATS: {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    tasksToday: 0,
    completedToday: 0,
    averageSleep: 8,
    totalDistractions: 0,
  },
};
