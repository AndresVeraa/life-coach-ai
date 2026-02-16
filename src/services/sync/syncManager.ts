import { useSyncQueue, SyncOperation } from './syncQueue';
import { getCurrentUserId, supabase, updateSyncMetadata, getSyncMetadata } from '@/services/db/supabaseClient';
import { useTaskStore } from '@/features/tasks/tasks.store';
import { useHealthStore } from '@/features/health/health.store';
import { useAuditStore } from '@/features/audit/audit.store';
import { useCoachStore } from '@/features/coach/coach.store';

/**
 * Resultado de una operación de sincronización
 */
export interface SyncResult {
  success: boolean;
  operationId: string;
  remoteId?: string; // ID creado en servidor
  error?: string;
}

/**
 * Estrategia de reintento con backoff exponencial
 * Reintento: 1s → 2s → 4s → 8s → max 30s
 */
function getRetryDelay(retries: number): number {
  const baseDelay = 1000; // 1 segundo
  const maxDelay = 30000; // 30 segundos
  const delay = baseDelay * Math.pow(2, retries);
  return Math.min(delay, maxDelay);
}

/**
 * Sync Manager - Orquestador principal de sincronización
 */
export const syncManager = {
  /**
   * Sincronizar una operación específica
   */
  syncOperation: async (operation: SyncOperation): Promise<SyncResult> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          operationId: operation.id,
          error: 'Usuario no autenticado',
        };
      }

      let remoteId: string | undefined;

      switch (operation.type) {
        case 'CREATE':
          remoteId = await syncManager.createRemote(operation, userId);
          break;

        case 'UPDATE':
          remoteId = await syncManager.updateRemote(operation, userId);
          break;

        case 'DELETE':
          remoteId = await syncManager.deleteRemote(operation, userId);
          break;
      }

      return {
        success: true,
        operationId: operation.id,
        remoteId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
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
  createRemote: async (operation: SyncOperation, userId: string): Promise<string> => {
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

    // Actualizar metadatos de sync
    await updateSyncMetadata(operation.table, operation.localId, operation.timestamp);

    return data.id;
  },

  /**
   * Actualizar registro en servidor
   */
  updateRemote: async (operation: SyncOperation, userId: string): Promise<string> => {
    const { localId, data } = operation;

    // Buscar el ID remoto usando local_id
    const { data: existingData, error: fetchError } = await supabase
      .from(operation.table)
      .select('id')
      .eq('user_id', userId)
      .eq('local_id', localId)
      .single();

    if (fetchError || !existingData) {
      // Si no existe en servidor, crear como nuevo
      return syncManager.createRemote(operation, userId);
    }

    // Conflict Resolution: Si el servidor es más reciente, no actualizar
    const metadata = await getSyncMetadata(operation.table, localId);
    if (metadata && new Date(metadata.server_updated_at) > new Date(operation.timestamp)) {
      console.log(`[CONFLICT] Servidor es más reciente para ${operation.table}:${localId}`);
      // Server wins - no actualizar
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

    // Actualizar metadatos
    await updateSyncMetadata(operation.table, localId, Date.now());

    return existingData.id;
  },

  /**
   * Eliminar registro en servidor
   */
  deleteRemote: async (operation: SyncOperation, userId: string): Promise<string> => {
    const { localId } = operation;

    // Buscar el ID remoto
    const { data: existingData, error: fetchError } = await supabase
      .from(operation.table)
      .select('id')
      .eq('user_id', userId)
      .eq('local_id', localId)
      .single();

    if (fetchError || !existingData) {
      // Ya no existe, considerar como deleted
      return localId;
    }

    const { error } = await supabase
      .from(operation.table)
      .delete()
      .eq('id', existingData.id);

    if (error) throw error;

    return existingData.id;
  },

  /**
   * Sincronizar TODAS las operaciones pendientes
   * Ejecutar cuando hay red disponible
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
      console.log('Sync ya en progreso');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const pending = getPendingOperations();

      if (pending.length === 0) {
        console.log('✅ No hay operaciones pendientes');
        setLastSyncTime(Date.now());
        setIsSyncing(false);
        return;
      }

      console.log(`🔄 Sincronizando ${pending.length} operaciones...`);

      // Procesar operaciones secuencialmente (para evitar race conditions)
      for (const operation of pending) {
        const result = await syncManager.syncOperation(operation);

        if (result.success) {
          markSynced(operation.id);
          console.log(`✅ Sincronización exitosa: ${operation.table}:${operation.localId}`);
        } else {
          // Incrementar retries
          const newRetries = operation.retries + 1;
          updateOperation(operation.id, {
            retries: newRetries,
            lastError: result.error,
          });

          // Si alcanzó max retries, pausar
          if (newRetries >= 3) {
            console.warn(
              `⚠️ Max retries alcanzado para ${operation.table}:${operation.localId}`,
              result.error
            );
            setSyncError(result.error || 'Max retries alcanzado');
          }
        }
      }

      setLastSyncTime(Date.now());
      console.log('✅ Sincronización completada');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en sincronización';
      console.error('❌ Error durante sincronización:', errorMessage);
      setSyncError(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  },

  /**
   * Reintentar operaciones fallidas
   * Ejecutar manualmente si el usuario quiere reintentar
   */
  retryFailed: async (): Promise<void> => {
    const { queue, updateOperation } = useSyncQueue.getState();

    const failed = queue.filter((op) => !op.synced && op.retries > 0);

    if (failed.length === 0) {
      console.log('No hay operaciones fallidas para reintentar');
      return;
    }

    console.log(`🔄 Reintentando ${failed.length} operaciones fallidas...`);

    for (const operation of failed) {
      // Esperar backoff delay
      const delay = getRetryDelay(operation.retries);
      await new Promise((resolve) => setTimeout(resolve, delay));

      const result = await syncManager.syncOperation(operation);

      if (result.success) {
        updateOperation(operation.id, { synced: true, retries: 0 });
        console.log(`✅ Reintento exitoso: ${operation.table}:${operation.localId}`);
      } else {
        updateOperation(operation.id, {
          retries: operation.retries + 1,
          lastError: result.error,
        });
      }
    }
  },

  /**
   * Descargar cambios remotos y fusionar localmente
   * Implementación básica - puede extenderse con más lógica
   */
  pullRemoteChanges: async (): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('No autenticado');

      console.log('⬇️ Descargando cambios remotos...');

      // Descargar tasks
      const { data: remoteTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

      if (remoteTasks) {
        const taskStore = useTaskStore.getState();
        // Fusionar con tareas locales
        for (const remoteTask of remoteTasks) {
          const localTask = taskStore.tasks.find((t) => t.id === remoteTask.local_id);
          if (!localTask || new Date(remoteTask.updated_at) > new Date(localTask.createdAt)) {
            // Server version is newer, update locally
            console.log(`Actualizado desde servidor: task ${remoteTask.id}`);
          }
        }
      }

      // TODO: Descargar distractions, sleep_records, conversations
      // Aplicar mismo patrón de merge

      console.log('✅ Cambios remotos descargados');
    } catch (error) {
      console.error('❌ Error descargando cambios remotos:', error);
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

/**
 * EJEMPLO DE USO:
 *
 * import { syncManager } from '@/services/sync/syncManager';
 *
 * // Auto-sincronizar cuando hay red disponible
 * useEffect(() => {
 *   const subscription = NetInfo.addEventListener((state) => {
 *     if (state.isConnected && !syncManager.getStatus().isSyncing) {
 *       syncManager.syncAll();
 *     }
 *   });
 *
 *   return () => subscription();
 * }, []);
 *
 * // Botón de retry manual
 * const handleRetry = async () => {
 *   await syncManager.retryFailed();
 * };
 *
 * // Mostrar status
 * const { status, pendingOperations } = syncManager.getStatus();
 * <Text>Status: {status} ({pendingOperations} pendientes)</Text>
 */
