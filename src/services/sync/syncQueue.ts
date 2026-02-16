import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Operación pendiente de sincronización
 * Se guarda en cola cuando hay cambios offline
 */
export interface SyncOperation {
  id: string; // UUID único para operación
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: 'tasks' | 'sleep_records' | 'distractions' | 'audit_sessions' | 'coach_conversations';
  data: any; // El objeto a sincronizar
  localId: string; // ID local (para mapping)
  timestamp: number; // Cuándo se creó esta operación
  retries: number; // Cuántas veces se intentó sincronizar
  lastError?: string; // Último error si falló
  synced: boolean; // ¿Se sincronizó exitosamente?
}

export interface SyncQueueState {
  // Estado
  queue: SyncOperation[];
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncError: string | null;

  // Acciones
  addOperation: (op: Omit<SyncOperation, 'id' | 'timestamp' | 'retries' | 'synced'>) => void;
  removeOperation: (id: string) => void;
  updateOperation: (id: string, updates: Partial<SyncOperation>) => void;
  markSynced: (id: string) => void;
  getQueue: () => SyncOperation[];
  getPendingOperations: () => SyncOperation[];
  setIsSyncing: (isSyncing: boolean) => void;
  setLastSyncTime: (time: number) => void;
  setSyncError: (error: string | null) => void;
  clearQueue: () => void;
  clearSynced: () => void; // Remover operaciones ya sincronizadas
}

export const useSyncQueue = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isSyncing: false,
      lastSyncTime: null,
      syncError: null,

      addOperation: (op) => {
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...op,
              id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
              retries: 0,
              synced: false,
            },
          ],
          syncError: null,
        }));
      },

      removeOperation: (id) => {
        set((state) => ({
          queue: state.queue.filter((op) => op.id !== id),
        }));
      },

      updateOperation: (id, updates) => {
        set((state) => ({
          queue: state.queue.map((op) => (op.id === id ? { ...op, ...updates } : op)),
        }));
      },

      markSynced: (id) => {
        set((state) => ({
          queue: state.queue.map((op) =>
            op.id === id ? { ...op, synced: true } : op
          ),
        }));
      },

      getQueue: () => get().queue,

      getPendingOperations: () => get().queue.filter((op) => !op.synced),

      setIsSyncing: (isSyncing) => {
        set({ isSyncing });
      },

      setLastSyncTime: (time) => {
        set({ lastSyncTime: time });
      },

      setSyncError: (error) => {
        set({ syncError: error });
      },

      clearQueue: () => {
        set({ queue: [] });
      },

      clearSynced: () => {
        set((state) => ({
          queue: state.queue.filter((op) => !op.synced),
        }));
      },
    }),
    {
      name: 'sync-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * EJEMPLO DE USO:
 *
 * import { useSyncQueue } from '@/services/sync/syncQueue';
 *
 * // Agregar operación a la cola (automáticamente offline-safe)
 * const { addOperation } = useSyncQueue();
 *
 * addOperation({
 *   type: 'CREATE',
 *   table: 'tasks',
 *   data: { title: 'Nueva tarea', description: 'desc' },
 *   localId: 'task_123',
 * });
 *
 * // Verificar operaciones pendientes
 * const { getPendingOperations } = useSyncQueue();
 * const pending = getPendingOperations();
 * console.log(`${pending.length} operaciones pendientes de sincronizar`);
 *
 * // Marcar como sincronizada
 * const { markSynced } = useSyncQueue();
 * markSynced('sync_1708956000000_abc123');
 */
