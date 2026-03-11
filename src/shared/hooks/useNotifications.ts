/**
 * useNotifications Hook
 *
 * Hook para manejar notificaciones en componentes React.
 * Proporciona estado y funciones para interactuar con el servicio de notificaciones.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  requestPermissions,
  getScheduledCount,
  cancelAllNotifications,
  scheduleDailyCoachTip,
  arePermissionsGranted,
} from '@/services/notifications/notificationService';
import { getConfig } from '@/constants/config';

export interface NotificationState {
  permissionsGranted: boolean;
  scheduledCount: number;
  isLoading: boolean;
}

export interface UseNotificationsResult extends NotificationState {
  requestNotificationPermissions: () => Promise<boolean>;
  refreshScheduledCount: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  setupDailyCoachTip: (hour?: number, minute?: number) => Promise<void>;
}

/**
 * Hook para manejar notificaciones
 */
export const useNotifications = (): UseNotificationsResult => {
  const config = getConfig();
  const [state, setState] = useState<NotificationState>({
    permissionsGranted: false,
    scheduledCount: 0,
    isLoading: true,
  });

  // Verificar permisos al montar
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const granted = await arePermissionsGranted();
      
      setState((prev) => ({ ...prev, permissionsGranted: granted }));
      
      if (granted) {
        await refreshScheduledCount();
      }
    } catch (err) {
      if (config.env.DEBUG_MODE) {
        console.warn('[useNotifications] Error verificando permisos:', err);
      }
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const requestNotificationPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestPermissions();
      setState((prev) => ({ ...prev, permissionsGranted: granted }));
      
      if (granted) {
        await refreshScheduledCount();
      }
      
      return granted;
    } catch (err) {
      if (config.env.DEBUG_MODE) {
        console.warn('[useNotifications] Error solicitando permisos:', err);
      }
      return false;
    }
  }, [config.env.DEBUG_MODE]);

  const refreshScheduledCount = useCallback(async (): Promise<void> => {
    try {
      const count = await getScheduledCount();
      setState((prev) => ({ ...prev, scheduledCount: count }));
    } catch (err) {
      if (config.env.DEBUG_MODE) {
        console.warn('[useNotifications] Error obteniendo conteo:', err);
      }
    }
  }, [config.env.DEBUG_MODE]);

  const clearAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await cancelAllNotifications();
      setState((prev) => ({ ...prev, scheduledCount: 0 }));
      
      if (config.env.DEBUG_MODE) {
        console.log('[useNotifications] Todas las notificaciones canceladas');
      }
    } catch (err) {
      if (config.env.DEBUG_MODE) {
        console.warn('[useNotifications] Error cancelando notificaciones:', err);
      }
    }
  }, [config.env.DEBUG_MODE]);

  const setupDailyCoachTip = useCallback(async (hour = 9, minute = 0): Promise<void> => {
    try {
      if (!state.permissionsGranted) {
        const granted = await requestNotificationPermissions();
        if (!granted) return;
      }
      
      await scheduleDailyCoachTip(hour, minute);
      await refreshScheduledCount();
      
      if (config.env.DEBUG_MODE) {
        console.log(`[useNotifications] Coach tip diario programado para ${hour}:${minute}`);
      }
    } catch (err) {
      if (config.env.DEBUG_MODE) {
        console.warn('[useNotifications] Error configurando coach tip:', err);
      }
    }
  }, [state.permissionsGranted, requestNotificationPermissions, refreshScheduledCount, config.env.DEBUG_MODE]);

  return {
    ...state,
    requestNotificationPermissions,
    refreshScheduledCount,
    clearAllNotifications,
    setupDailyCoachTip,
  };
};

/**
 * Hook simplificado para verificar permisos
 */
export const useNotificationPermissions = (): {
  hasPermission: boolean;
  isChecking: boolean;
  request: () => Promise<boolean>;
} => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    arePermissionsGranted().then((granted) => {
      setHasPermission(granted);
      setIsChecking(false);
    });
  }, []);

  const request = useCallback(async () => {
    const granted = await requestPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  return { hasPermission, isChecking, request };
};

export default useNotifications;
