import { useSyncQueue, SyncOperation } from './syncQueue';
import { getSupabaseClient, updateSyncMetadata, getSyncMetadata } from '@/services/db/supabaseClient';
import { useTaskStore } from '@/features/tasks/tasks.store';
import { useHealthStore } from '@/features/health/health.store';
import { useAuditStore } from '@/features/audit/audit.store';
import { useCoachStore } from '@/features/coach/coach.store';
import { useAuthStore, subscribeToAuthEvents, getCurrentTokens } from '@/features/auth/auth.store';
import { getConfig } from '@/constants/config';

// ============================================
// TYPES
// ============================================

/**
 * Resultado de una operación de sincronización
 */
export interface SyncResult {
  success: boolean;
  operationId: string;
  remoteId?: string;
  error?: string;
}

/**
 * Eventos emitidos por el sync manager
 */
export type SyncEvent =
  | 'SYNC_STARTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_ERROR'
  | 'SESSION_EXPIRED'
  | 'OPERATION_SUCCESS'
  | 'OPERATION_FAILED';

type SyncEventListener = (event: SyncEvent, data?: unknown) => void;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Estrategia de reintento con backoff exponencial
 */
function getRetryDelay(retries: number): number {
  const baseDelay = 1000;
  const maxDelay = 30000;
  const delay = baseDelay * Math.pow(2, retries);
  return Math.min(delay, maxDelay);
}

/**
 * Timestamp formateado para logs
 */
function logTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Log con timestamp
 */
function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const config = getConfig();
  if (!config.env.DEBUG_MODE) return;
  
  const prefix = `[Sync ${logTimestamp()}]`;
  switch (level) {
    case 'info':
      console.log(`${prefix} ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} ⚠️ ${message}`);
      break;
    case 'error':
      console.error(`${prefix} ❌ ${message}`);
      break;
  }
}

/**
 * Obtener cliente Supabase autenticado
 */
async function getAuthenticatedClient() {
  const { getAccessToken, refreshSessionIfNeeded } = useAuthStore.getState();
  
  // Verificar/refrescar sesión
  const isValid = await refreshSessionIfNeeded();
  
  if (!isValid) {
    throw new Error('SESSION_EXPIRED');
  }
  
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    throw new Error('NO_TOKEN');
  }
  
  return getSupabaseClient({ accessToken });
}

/**
 * Obtener user ID actual
 */
function getCurrentUserId(): string | null {
  const user = useAuthStore.getState().user;
  return user?.id || null;
}

// ============================================
// SYNC MANAGER
// ============================================

/**
 * Sync Manager - Orquestador principal de sincronización
 * Usa cliente autenticado y maneja sesiones expiradas
 */
export const syncManager = {
  // Event listeners
  _eventListeners: new Set<SyncEventListener>(),
  _unsubscribeAuth: null as (() => void) | null,
  _isInitialized: false,

  /**
   * Inicializar sync manager y suscribirse a eventos de auth
   */
  initialize: () => {
    if (syncManager._isInitialized) return;

    log('Inicializando sync manager');

    syncManager._unsubscribeAuth = subscribeToAuthEvents(
      () => {
        log('Sesión expirada detectada', 'warn');
        syncManager._emitEvent('SESSION_EXPIRED');
      },
      () => {
        log('Sesión refrescada, sincronizando...');
        syncManager.syncAll();
      }
    );

    syncManager._isInitialized = true;
  },

  /**
   * Limpiar recursos
   */
  destroy: () => {
    if (syncManager._unsubscribeAuth) {
      syncManager._unsubscribeAuth();
      syncManager._unsubscribeAuth = null;
    }
    syncManager._eventListeners.clear();
    syncManager._isInitialized = false;
    log('Sync manager destruido');
  },

  /**
   * Suscribirse a eventos de sync
   */
  addEventListener: (listener: SyncEventListener): (() => void) => {
    syncManager._eventListeners.add(listener);
    return () => syncManager._eventListeners.delete(listener);
  },

  /**
   * Emitir evento
   */
  _emitEvent: (event: SyncEvent, data?: unknown) => {
    syncManager._eventListeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch (err) {
        log(`Error en event listener: ${err}`, 'error');
      }
    });
  },

  /**
   * Sincronizar una operación específica
   */
  syncOperation: async (operation: SyncOperation): Promise<SyncResult> => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          operationId: operation.id,
          error: 'Usuario no autenticado',
        };
      }

      // Obtener cliente autenticado
      const supabase = await getAuthenticatedClient();
      let remoteId: string | undefined;

      switch (operation.type) {
        case 'CREATE':
          remoteId = await syncManager._createRemote(supabase, operation, userId);
          break;

        case 'UPDATE':
          remoteId = await syncManager._updateRemote(supabase, operation, userId);
          break;

        case 'DELETE':
          remoteId = await syncManager._deleteRemote(supabase, operation, userId);
          break;
      }

      syncManager._emitEvent('OPERATION_SUCCESS', { operation, remoteId });

      return {
        success: true,
        operationId: operation.id,
        remoteId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Detectar sesión expirada
      if (errorMessage === 'SESSION_EXPIRED' || errorMessage === 'NO_TOKEN') {
        log('Sesión expirada durante operación', 'warn');
        syncManager._emitEvent('SESSION_EXPIRED');
      }

      syncManager._emitEvent('OPERATION_FAILED', { operation, error: errorMessage });

      return {
        success: false,
        operationId: operation.id,
        error: errorMessage,
      };
    }
  },

  /**
   * Crear registro en servidor
   */
  _createRemote: async (supabase: ReturnType<typeof getSupabaseClient>, operation: SyncOperation, userId: string): Promise<string> => {
    log(`CREATE: ${operation.table}:${operation.localId}`);
    
    const { data, error } = await supabase
      .from(operation.table)
      .insert([
        {
          user_id: userId,
          ...operation.data,
          local_id: operation.localId,
        },
      ])
      .select('id')
      .single();

    if (error) throw error;

    await updateSyncMetadata(operation.table, operation.localId, operation.timestamp);

    log(`CREATE exitoso: ${operation.table}:${data.id}`);
    return data.id;
  },

  /**
   * Actualizar registro en servidor
   */
  _updateRemote: async (supabase: ReturnType<typeof getSupabaseClient>, operation: SyncOperation, userId: string): Promise<string> => {
    const { localId, data } = operation;
    log(`UPDATE: ${operation.table}:${localId}`);

    const { data: existingData, error: fetchError } = await supabase
      .from(operation.table)
      .select('id')
      .eq('user_id', userId)
      .eq('local_id', localId)
      .single();

    if (fetchError || !existingData) {
      log(`No existe en servidor, creando nuevo: ${operation.table}:${localId}`);
      return syncManager._createRemote(supabase, operation, userId);
    }

    // Conflict Resolution
    const metadata = await getSyncMetadata(operation.table, localId);
    if (metadata && new Date(metadata.server_updated_at) > new Date(operation.timestamp)) {
      log(`CONFLICTO: Servidor es más reciente para ${operation.table}:${localId}`, 'warn');
      return existingData.id;
    }

    const { error } = await supabase
      .from(operation.table)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingData.id);

    if (error) throw error;

    await updateSyncMetadata(operation.table, localId, Date.now());

    log(`UPDATE exitoso: ${operation.table}:${existingData.id}`);
    return existingData.id;
  },

  /**
   * Eliminar registro en servidor
   */
  _deleteRemote: async (supabase: ReturnType<typeof getSupabaseClient>, operation: SyncOperation, userId: string): Promise<string> => {
    const { localId } = operation;
    log(`DELETE: ${operation.table}:${localId}`);

    const { data: existingData, error: fetchError } = await supabase
      .from(operation.table)
      .select('id')
      .eq('user_id', userId)
      .eq('local_id', localId)
      .single();

    if (fetchError || !existingData) {
      log(`Ya no existe en servidor: ${operation.table}:${localId}`);
      return localId;
    }

    const { error } = await supabase
      .from(operation.table)
      .delete()
      .eq('id', existingData.id);

    if (error) throw error;

    log(`DELETE exitoso: ${operation.table}:${existingData.id}`);
    return existingData.id;
  },

  /**
   * Sincronizar TODAS las operaciones pendientes
   */
  syncAll: async (): Promise<void> => {
    const {
      isSyncing,
      getPendingOperations,
      setIsSyncing,
      setLastSyncTime,
      setSyncError,
      updateOperation,
      markSynced,
    } = useSyncQueue.getState();

    if (isSyncing) {
      log('Sync ya en progreso');
      return;
    }

    // Verificar autenticación
    const userId = getCurrentUserId();
    if (!userId) {
      log('No autenticado, saltando sync', 'warn');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    syncManager._emitEvent('SYNC_STARTED');

    try {
      const pending = getPendingOperations();

      if (pending.length === 0) {
        log('No hay operaciones pendientes ✅');
        setLastSyncTime(Date.now());
        syncManager._emitEvent('SYNC_COMPLETED', { count: 0 });
        return;
      }

      log(`Sincronizando ${pending.length} operaciones...`);

      let successCount = 0;
      let failCount = 0;

      for (const operation of pending) {
        const result = await syncManager.syncOperation(operation);

        if (result.success) {
          markSynced(operation.id);
          successCount++;
        } else {
          failCount++;
          
          // Detectar sesión expirada
          if (result.error === 'SESSION_EXPIRED' || result.error === 'NO_TOKEN') {
            log('Sesión expirada, abortando sync', 'warn');
            setSyncError('SESSION_EXPIRED');
            syncManager._emitEvent('SESSION_EXPIRED');
            return;
          }

          const newRetries = operation.retries + 1;
          updateOperation(operation.id, {
            retries: newRetries,
            lastError: result.error,
          });

          if (newRetries >= 3) {
            log(`Max retries alcanzado para ${operation.table}:${operation.localId}`, 'warn');
            setSyncError(result.error || 'Max retries alcanzado');
          }
        }
      }

      setLastSyncTime(Date.now());
      log(`Sincronización completada: ${successCount} exitosos, ${failCount} fallidos ✅`);
      syncManager._emitEvent('SYNC_COMPLETED', { successCount, failCount });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en sincronización';
      log(`Error durante sincronización: ${errorMessage}`, 'error');
      setSyncError(errorMessage);
      syncManager._emitEvent('SYNC_ERROR', { error: errorMessage });
    } finally {
      setIsSyncing(false);
    }
  },

  /**
   * Reintentar operaciones fallidas
   */
  retryFailed: async (): Promise<void> => {
    const { queue, updateOperation } = useSyncQueue.getState();

    const failed = queue.filter((op) => !op.synced && op.retries > 0);

    if (failed.length === 0) {
      log('No hay operaciones fallidas para reintentar');
      return;
    }

    log(`Reintentando ${failed.length} operaciones fallidas...`);

    for (const operation of failed) {
      const delay = getRetryDelay(operation.retries);
      log(`Esperando ${delay}ms antes de reintentar ${operation.table}:${operation.localId}`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      const result = await syncManager.syncOperation(operation);

      if (result.success) {
        updateOperation(operation.id, { synced: true, retries: 0 });
        log(`Reintento exitoso: ${operation.table}:${operation.localId} ✅`);
      } else {
        updateOperation(operation.id, {
          retries: operation.retries + 1,
          lastError: result.error,
        });
        log(`Reintento fallido: ${operation.table}:${operation.localId}`, 'warn');
      }
    }
  },

  /**
   * Descargar cambios remotos y fusionar localmente
   */
  pullRemoteChanges: async (): Promise<void> => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('No autenticado');

      log('Descargando cambios remotos...');

      const supabase = await getAuthenticatedClient();

      // Descargar tasks
      const { data: remoteTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

      if (remoteTasks) {
        const taskStore = useTaskStore.getState();
        for (const remoteTask of remoteTasks) {
          const localTask = taskStore.tasks.find((t) => t.id === remoteTask.local_id);
          if (!localTask || new Date(remoteTask.updated_at) > new Date(localTask.createdAt)) {
            log(`Actualizado desde servidor: task ${remoteTask.id}`);
          }
        }
      }

      log('Cambios remotos descargados ✅');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error';
      log(`Error descargando cambios remotos: ${errorMessage}`, 'error');
      
      if (errorMessage === 'SESSION_EXPIRED' || errorMessage === 'NO_TOKEN') {
        syncManager._emitEvent('SESSION_EXPIRED');
      }
    }
  },

  /**
   * Status de sincronización
   */
  getStatus: () => {
    const { isSyncing, lastSyncTime, syncError, getPendingOperations } = useSyncQueue.getState();
    const pending = getPendingOperations().length;

    return {
      isSyncing,
      lastSyncTime,
      syncError,
      pendingOperations: pending,
      status: isSyncing ? 'syncing' : syncError ? 'error' : pending > 0 ? 'pending' : 'synced',
    };
  },
};

// Exportar tipos
export type { SyncEvent, SyncEventListener };
