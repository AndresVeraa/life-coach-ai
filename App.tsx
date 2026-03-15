import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { validateAppConfig, getConfig, isEASBuild } from './src/utils/configValidator';
import {
  requestPermissions,
  scheduleDailyCoachTip,
  setupNotificationListeners,
} from './src/services/notifications/notificationService';
import { registerBackgroundSync } from './src/services/background/backgroundSync';
import { syncManager } from './src/services/sync/syncManager';

export default function App() {
  const [configStatus, setConfigStatus] = useState<{
    checking: boolean;
    isValid: boolean;
    errorMessage: string | null;
  }>({
    checking: true,
    isValid: false,
    errorMessage: null,
  });

  const appState = useRef(AppState.currentState);
  const cleanupListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Validar configuración al startup
    const result = validateAppConfig();
    const config = getConfig();
    const inEASBuild = isEASBuild();

    // En EAS builds, mostrar info de debug
    if (inEASBuild || config.env.DEBUG_MODE) {
      console.log('[App] ========================================');
      console.log('[App] Environment:', inEASBuild ? 'EAS Build' : 'Development');
      console.log('[App] Config validation:', result.isValid ? '✓ Valid' : '✗ Invalid');
      console.log('[App] Supabase URL:', config.env.SUPABASE_URL ? '✓ present' : '✗ missing');
      console.log('[App] Supabase Key:', config.env.SUPABASE_ANON_KEY ? '✓ present' : '✗ missing');
      console.log('[App] AI Key:', (config.env.OPENAI_API_KEY || config.env.GEMINI_API_KEY) ? '✓ present' : '✗ missing');
      console.log('[App] ========================================');
    }

    if (result.warnings.length > 0 && config.env.DEBUG_MODE) {
      console.warn('⚠️ Configuration Warnings:');
      result.warnings.forEach((w) => console.warn(`  ${w}`));
    }

    // En EAS builds, ser más permisivo
    const shouldShowError = !result.isValid && !inEASBuild;

    setConfigStatus({
      checking: false,
      isValid: result.isValid || inEASBuild, // En EAS builds, asumir válido
      errorMessage: shouldShowError ? result.errors.join('\n') : null,
    });

    // Si config es válida (o estamos en EAS build), inicializar servicios
    if (result.isValid || inEASBuild) {
      initializeApp();
    }

    return () => {
      // Cleanup notification listeners
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current();
      }
      // Destruir sync manager
      syncManager.destroy();
    };
  }, []);

  const initializeApp = async () => {
    const config = getConfig();

    try {
      // 1. Inicializar sync manager (solo si hay credenciales de Supabase)
      if (config.env.SUPABASE_URL && config.env.SUPABASE_ANON_KEY) {
        syncManager.initialize();
        
        if (config.env.DEBUG_MODE) {
          console.log('[App] Sync manager inicializado');
        }
      } else {
        console.log('[App] Sync manager no inicializado (faltan credenciales Supabase)');
      }
      
      // 2. Solicitar permisos de notificaciones
      const notificationGranted = await requestPermissions();
      
      if (notificationGranted) {
        // 3. Programar tip diario del coach (9:00 AM)
        await scheduleDailyCoachTip(9, 0);
        
        if (config.env.DEBUG_MODE) {
          console.log('[App] Notificaciones configuradas');
        }
      }

      // 4. Registrar background sync
      await registerBackgroundSync();
      
      if (config.env.DEBUG_MODE) {
        console.log('[App] Background sync registrado');
      }

      // 5. Configurar listeners de notificaciones (seguro para Expo Go)
      cleanupListenersRef.current = setupNotificationListeners({
        onNotificationReceived: (notification) => {
          if (config.env.DEBUG_MODE) {
            console.log('[App] Notificación recibida:', notification.request.content.title);
          }
        },
        onNotificationResponse: (response) => {
          if (config.env.DEBUG_MODE) {
            console.log('[App] Notificación tocada:', response.notification.request.content.data);
          }
          handleNotificationResponse(response);
        },
      });

      // 6. Listener para cambios de estado de la app
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      
      return () => {
        subscription.remove();
      };
    } catch (err) {
      console.error('[App] Error inicializando:', err);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    const config = getConfig();
    
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App vuelve al foreground
      if (config.env.DEBUG_MODE) {
        console.log('[App] App activa, sincronizando...');
      }
      
      // Solo sincronizar si hay credenciales de Supabase
      if (config.env.SUPABASE_URL && config.env.SUPABASE_ANON_KEY) {
        syncManager.syncAll();
      }
    }
    
    appState.current = nextAppState;
  };

  const handleNotificationResponse = (response: { notification: { request: { content: { data?: Record<string, unknown> } } } }) => {
    const data = response.notification.request.content.data;
    
    // Manejar navegación según tipo de notificación
    if (data?.type === 'task_reminder' && data?.taskId) {
      // Navegar a la tarea (implementar navegación si es necesario)
      console.log('[App] Navegar a tarea:', data.taskId);
    } else if (data?.type === 'coach_tip') {
      // Navegar al coach
      console.log('[App] Navegar al coach');
    }
  };

  // Mostrar loading mientras se verifica config
  if (configStatus.checking) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Verificando configuración...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Mostrar error si la configuración es inválida (solo en desarrollo local)
  if (!configStatus.isValid && configStatus.errorMessage) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error de Configuración</Text>
          <Text style={styles.errorMessage}>{configStatus.errorMessage}</Text>
          <Text style={styles.errorHelp}>
            Por favor verifica tu archivo .env y asegúrate de que todas las variables requeridas estén configuradas.
          </Text>
          <Text style={styles.errorHint}>
            Consulta .env.example para ver las variables necesarias.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Renderizar app normal si config es válida
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    fontFamily: 'monospace',
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorHelp: {
    fontSize: 14,
    color: '#7f1d1d',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
