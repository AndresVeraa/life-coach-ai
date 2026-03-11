/**
 * Background Sync Service
 *
 * Implementa sincronización en segundo plano usando expo-background-fetch
 * y expo-task-manager.
 *
 * DEPENDENCIAS REQUERIDAS:
 * npx expo install expo-notifications expo-task-manager expo-background-fetch
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import { getConfig } from '@/constants/config';

// ============================================
// CONSTANTES
// ============================================

export const BACKGROUND_SYNC_TASK = 'LIFE_COACH_BACKGROUND_SYNC';
const MIN_INTERVAL_SECONDS = 15 * 60;

const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
};

// ============================================
// DEFINICIÓN DE TAREA
// ============================================

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  const config = getConfig();
  const timestamp = new Date().toISOString();

  try {
    if (config.env.DEBUG_MODE) {
      console.log(`[${timestamp}] [BackgroundSync] Iniciando tarea...`);
    }

    // 1. Verificar si hay token de acceso
    const accessToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);

    if (!accessToken) {
      if (config.env.DEBUG_MODE) {
        console.log(`[${timestamp}] [BackgroundSync] Sin token, abortando`);
      }
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // 2. Importar syncManager dinámicamente para evitar circular dependency
    const { syncManager } = await import('@/services/sync/syncManager');
    const { useSyncQueue } = await import('@/services/sync/syncQueue');

    // 3. Verificar si hay operaciones pendientes
    const { getPendingOperations } = useSyncQueue.getState();
    const pendingOps = getPendingOperations();

    if (pendingOps.length === 0) {
      if (config.env.DEBUG_MODE) {
        console.log(`[${timestamp}] [BackgroundSync] Sin operaciones pendientes`);
      }
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    if (config.env.DEBUG_MODE) {
      console.log(
        `[${timestamp}] [BackgroundSync] Sincronizando ${pendingOps.length} operaciones...`
      );
    }

    // 4. Ejecutar sincronización
    await syncManager.syncAll();

    // 5. Verificar resultado
    const remainingOps = getPendingOperations();
    const syncedCount = pendingOps.length - remainingOps.length;

    if (config.env.DEBUG_MODE) {
      console.log(
        `[${timestamp}] [BackgroundSync] Completado: ${syncedCount} sincronizadas, ${remainingOps.length} pendientes`
      );
    }

    return syncedCount > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error(`[${timestamp}] [BackgroundSync] Error:`, error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ============================================
// FUNCIONES PÚBLICAS
// ============================================

/**
 * Registrar la tarea de background sync.
 */
export const registerBackgroundSync = async (): Promise<void> => {
  const config = getConfig();

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);

    if (isRegistered) {
      if (config.env.DEBUG_MODE) {
        console.log('[BackgroundSync] Tarea ya registrada');
      }
      return;
    }

    const status = await BackgroundFetch.getStatusAsync();

    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
      console.warn('[BackgroundSync] Background fetch restringido por el sistema');
      return;
    }

    if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      console.warn('[BackgroundSync] Background fetch denegado por el usuario');
      return;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: MIN_INTERVAL_SECONDS,
      startOnBoot: true,
      stopOnTerminate: false,
    });

    if (config.env.DEBUG_MODE) {
      console.log('[BackgroundSync] Tarea registrada exitosamente');
    }
  } catch (error) {
    console.error('[BackgroundSync] Error registrando tarea:', error);
  }
};

/**
 * Desregistrar la tarea de background sync.
 */
export const unregisterBackgroundSync = async (): Promise<void> => {
  const config = getConfig();

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);

    if (!isRegistered) {
      if (config.env.DEBUG_MODE) {
        console.log('[BackgroundSync] Tarea no estaba registrada');
      }
      return;
    }

    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);

    if (config.env.DEBUG_MODE) {
      console.log('[BackgroundSync] Tarea desregistrada');
    }
  } catch (error) {
    console.error('[BackgroundSync] Error desregistrando tarea:', error);
  }
};

/**
 * Verificar si la tarea está registrada.
 */
export const isBackgroundSyncRegistered = async (): Promise<boolean> => {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  } catch {
    return false;
  }
};

/**
 * Obtener el estado de Background Fetch.
 */
export const getBackgroundFetchStatus = async (): Promise<BackgroundFetch.BackgroundFetchStatus> => {
  try {
    return await BackgroundFetch.getStatusAsync();
  } catch {
    return BackgroundFetch.BackgroundFetchStatus.Denied;
  }
};
