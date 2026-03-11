import { ExpoConfig, ConfigContext } from 'expo/config';

// EAS Project ID con fallback hardcodeado (es público, no secreto)
const EAS_PROJECT_ID = process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '4c2c94d0-cd49-497a-b621-3e8ab027dcfb';

/**
 * Expo Config para Life Coach AI
 * 
 * Configuración completa para builds de desarrollo, preview y producción.
 * Incluye permisos para notificaciones, background fetch y secure storage.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  return {
  ...config,
  
  // ============================================
  // INFORMACIÓN BÁSICA DE LA APP
  // ============================================
  name: 'Life Coach AI',
  slug: 'life-coach-ai',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  
  // ============================================
  // ASSETS
  // ============================================
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#4F46E5',
  },
  assetBundlePatterns: ['**/*'],
  
  // ============================================
  // iOS CONFIGURATION
  // ============================================
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.tuempresa.lifecoachai',
    buildNumber: '1',
    
    // Permisos y configuraciones de iOS
    infoPlist: {
      // Background Modes (requerido para notificaciones y background fetch)
      UIBackgroundModes: [
        'fetch',                    // expo-background-fetch
        'remote-notification',      // Push notifications
        'processing',               // Background processing tasks
      ],
      
      // Descripciones de permisos (requeridas por Apple)
      NSCameraUsageDescription: 
        'Life Coach AI puede usar la cámara para tomar fotos de perfil.',
      
      NSPhotoLibraryUsageDescription: 
        'Life Coach AI puede acceder a tu galería para seleccionar fotos de perfil.',
      
      NSUserNotificationsUsageDescription: 
        'Life Coach AI envía recordatorios de hábitos, tareas y tips motivacionales diarios.',
      
      NSCalendarsUsageDescription: 
        'Life Coach AI puede sincronizar tus hábitos con el calendario.',
      
      NSFaceIDUsageDescription: 
        'Life Coach AI puede usar Face ID para proteger tus datos sensibles.',
      
      // Configuración de seguridad de red
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
        NSExceptionDomains: {
          'supabase.co': {
            NSIncludesSubdomains: true,
            NSThirdPartyExceptionAllowsInsecureHTTPLoads: false,
            NSThirdPartyExceptionRequiresForwardSecrecy: true,
          },
        },
      },
    },
    
    // Configuración de entitlements
    entitlements: {
      'aps-environment': 'production',
    },
  },
  
  // ============================================
  // ANDROID CONFIGURATION
  // ============================================
  android: {
    package: 'com.tuempresa.lifecoachai',
    versionCode: 1,
    edgeToEdgeEnabled: true,
    
    // Iconos adaptativos de Android
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#4F46E5',
    },
    
    // Permisos de Android
    permissions: [
      // Notificaciones
      'NOTIFICATIONS',
      'POST_NOTIFICATIONS',           // Android 13+ (API 33+)
      'RECEIVE_BOOT_COMPLETED',       // Iniciar tareas al reiniciar dispositivo
      'VIBRATE',                       // Vibración en notificaciones
      'WAKE_LOCK',                     // Mantener CPU para background tasks
      
      // Alarmas y recordatorios
      'SCHEDULE_EXACT_ALARM',          // Alarmas exactas (Android 12+)
      'USE_EXACT_ALARM',               // Usar alarmas exactas
      
      // Red
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      
      // Servicios en segundo plano
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_DATA_SYNC',
      
      // Cámara y almacenamiento (opcional, para foto de perfil)
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
  },
  
  // ============================================
  // WEB CONFIGURATION
  // ============================================
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },
  
  // ============================================
  // PLUGINS
  // ============================================
  plugins: [
    // Expo Notifications
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#4F46E5',
        defaultChannel: 'default',
      },
    ],
    
    // Expo Background Fetch
    'expo-background-fetch',
    
    // Expo Task Manager (requerido por background-fetch)
    'expo-task-manager',
    
    // Expo Secure Store
    [
      'expo-secure-store',
      {
        faceIDPermission: 
          'Permite usar Face ID para acceder de forma segura a tu cuenta.',
      },
    ],
  ],
  
  // ============================================
  // EXTRA CONFIGURATION (Environment Variables)
  // ============================================
  extra: {
    // EAS Configuration (debe ir primero)
    eas: {
      projectId: EAS_PROJECT_ID,
    },
    // Variables de entorno para la app
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  },
  
  // ============================================
  // EAS UPDATES (Over-The-Air Updates)
  // ============================================
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    fallbackToCacheTimeout: 0,
  },
  
  // ============================================
  // RUNTIME VERSION
  // ============================================
  runtimeVersion: {
    policy: 'appVersion',
  },
  
  // ============================================
  // EXPERIMENTS
  // ============================================
  experiments: {
    typedRoutes: true,
  },
};
};
