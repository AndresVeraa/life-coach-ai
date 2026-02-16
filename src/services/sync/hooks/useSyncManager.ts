import { useCallback, useEffect, useState } from 'react';
import { useSyncQueue } from '@/services/sync/syncQueue';
import { syncManager } from '@/services/sync/syncManager';
import NetInfo from '@react-native-community/netinfo';

export type SyncStatus = 'syncing' | 'synced' | 'pending' | 'error' | 'offline';

export interface SyncManagerState {
  status: SyncStatus;
  isSyncing: boolean;
  isOnline: boolean;
  pendingOperations: number;
  lastSyncTime: number | null;
  syncError: string | null;
}

/**
 * Hook para usar el sync manager en componentes
 * Proporciona status de sincronización y métodos para control
 */
export const useSyncManager = () => {
  const [state, setState] = useState<SyncManagerState>({
    status: 'offline',
    isSyncing: false,
    isOnline: false,
    pendingOperations: 0,
    lastSyncTime: null,
    syncError: null,
  });

  const syncQueueState = useSyncQueue();

  /**
   * Actualizar estado desde stores
   */
  const updateState = useCallback(() => {
    const { status, isSyncing, lastSyncTime, syncError, pendingOperations } =
      syncManager.getStatus();

    setState({
      status: (state.isOnline ? status : 'offline') as SyncStatus,
      isSyncing,
      isOnline: state.isOnline,
      pendingOperations,
      lastSyncTime,
      syncError,
    });
  }, [state.isOnline]);

  /**
   * Monitor de conexión de red
   */
  useEffect(() => {
    const subscription = NetInfo.addEventListener((netState) => {
      const isOnline = netState.isConnected ?? false;

      setState((prev) => ({
        ...prev,
        isOnline,
        status: isOnline ? prev.status : 'offline',
      }));

      // Auto-sincronizar cuando se conecta
      if (isOnline && !syncQueueState.isSyncing && syncQueueState.getPendingOperations().length > 0) {
        syncManager.syncAll();
      }
    });

    return () => subscription();
  }, []);

  /**
   * Monitor de cambios en sync queue
   */
  useEffect(() => {
    const unsubscribe = useSyncQueue.subscribe(updateState);

    updateState(); // Initial check
    return () => unsubscribe();
  }, [updateState]);

  /**
   * Sincronizar manualmente
   */
  const sync = useCallback(async () => {
    if (!state.isOnline) {
      console.warn('No hay conexión de red');
      return;
    }

    await syncManager.syncAll();
    updateState();
  }, [state.isOnline, updateState]);

  /**
   * Reintentar operaciones fallidas
   */
  const retry = useCallback(async () => {
    if (!state.isOnline) {
      console.warn('No hay conexión de red');
      return;
    }

    await syncManager.retryFailed();
    updateState();
  }, [state.isOnline, updateState]);

  /**
   * Descargar cambios remotos
   */
  const pull = useCallback(async () => {
    if (!state.isOnline) {
      console.warn('No hay conexión de red');
      return;
    }

    await syncManager.pullRemoteChanges();
    updateState();
  }, [state.isOnline, updateState]);

  /**
   * Limpiar operaciones sincronizadas de la cola
   */
  const clearSynced = useCallback(() => {
    syncQueueState.clearSynced();
    updateState();
  }, []);

  /**
   * Obtener mensajes de status legibles
   */
  const getStatusMessage = (): string => {
    switch (state.status) {
      case 'syncing':
        return '🔄 Sincronizando...';
      case 'synced':
        return state.lastSyncTime
          ? `✅ Sincronizado hace ${getTimeAgo(state.lastSyncTime)}`
          : '✅ Sincronizado';
      case 'pending':
        return `⏳ ${state.pendingOperations} cambios pendientes`;
      case 'error':
        return `❌ Error: ${state.syncError || 'Desconocido'}`;
      case 'offline':
        return '📴 Offline (se sincronizarán cambios cuando haya red)';
      default:
        return 'Estado desconocido';
    }
  };

  return {
    // Estado
    ...state,
    statusMessage: getStatusMessage(),

    // Acciones
    sync,
    retry,
    pull,
    clearSynced,
  };
};

/**
 * Helper: Tiempo relativo (hace X horas/minutos)
 */
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'hace unos segundos';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} minutos`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} horas`;
  return `hace ${Math.floor(seconds / 86400)} días`;
}

/**
 * EJEMPLO DE USO:
 *
 * import { useSyncManager } from '@/services/sync/hooks/useSyncManager';
 *
 * export const MyComponent = () => {
 *   const { status, statusMessage, sync, isOnline, pendingOperations } = useSyncManager();
 *
 *   return (
 *     <View>
 *       <Text className={status === 'error' ? 'text-red-600' : 'text-gray-600'}>
 *         {statusMessage}
 *       </Text>
 *
 *       <TouchableOpacity onPress={sync} disabled={!isOnline || status === 'syncing'}>
 *         <Text>Sincronizar ahora</Text>
 *       </TouchableOpacity>
 *
 *       {pendingOperations > 0 && (
 *         <Text>{pendingOperations} operaciones pendientes</Text>
 *       )}
 *     </View>
 *   );
 * };
 */
