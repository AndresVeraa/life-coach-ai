/**
 * Notification Service
 *
 * Gestiona notificaciones locales para recordatorios de tareas y tips del coach.
 * Compatible con Expo Go (SDK 53+) usando wrapper seguro.
 *
 * DEPENDENCIAS REQUERIDAS:
 * npx expo install expo-notifications expo-task-manager expo-background-fetch
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConfig } from '@/constants/config';

// Importar wrapper seguro en lugar de expo-notifications directamente
import * as SafeNotifications from './notifications.expo';

// ============================================
// TIPOS
// ============================================

export interface NotifiableTask {
  id: string;
  title: string;
  reminderTime?: string | null;
  completed: boolean;
  frequency?: 'once' | 'daily' | 'custom';
  repeatDays?: number[];
}

interface TaskNotificationMap {
  [taskId: string]: string;
}

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEYS = {
  PERMISSIONS_GRANTED: 'notifications_permissions_granted',
  TASK_NOTIFICATION_MAP: 'notifications_task_map',
  DAILY_TIP_SCHEDULED: 'notifications_daily_tip_scheduled',
};

const NOTIFICATION_CHANNEL_ID = 'life-coach-ai-reminders';

const DAILY_TIPS = [
  '🌟 Domingo: Planifica tu semana. 5 minutos de organización = horas de productividad.',
  '💪 Lunes: ¡Nuevo comienzo! Enfócate en tu tarea más importante primero.',
  '🎯 Martes: Pequeños pasos consistentes > grandes saltos esporádicos.',
  '🧠 Miércoles: Mitad de semana. ¿Cómo vas con tus metas? Ajusta si es necesario.',
  '🚀 Jueves: Ya casi llegas. Mantén el momentum, estás más cerca de lo que crees.',
  '🏆 Viernes: Celebra tus logros de la semana, por pequeños que sean.',
  '😴 Sábado: Descansa con intención. El descanso es parte del éxito.',
];

// ============================================
// CONFIGURACIÓN INICIAL (Segura para Expo Go)
// ============================================

SafeNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ============================================
// HELPERS PRIVADOS
// ============================================

const getTaskNotificationMap = async (): Promise<TaskNotificationMap> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TASK_NOTIFICATION_MAP);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveTaskNotificationMap = async (map: TaskNotificationMap): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_NOTIFICATION_MAP, JSON.stringify(map));
  } catch (error) {
    console.error('[Notifications] Error guardando mapeo:', error);
  }
};

const parseTimeToDate = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const calculateNextTrigger = (
  task: NotifiableTask
): unknown | null => {
  if (!task.reminderTime) return null;

  const [hours, minutes] = task.reminderTime.split(':').map(Number);

  switch (task.frequency) {
    case 'once': {
      const triggerDate = parseTimeToDate(task.reminderTime);
      if (triggerDate <= new Date()) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }
      return { date: triggerDate };
    }

    case 'daily': {
      return { hour: hours, minute: minutes, repeats: true };
    }

    case 'custom': {
      if (!task.repeatDays || task.repeatDays.length === 0) {
        return { hour: hours, minute: minutes, repeats: true };
      }

      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      let daysUntilNext = 7;
      for (const day of task.repeatDays) {
        let diff = day - currentDay;
        if (diff < 0) diff += 7;
        if (diff === 0) {
          if (currentHour > hours || (currentHour === hours && currentMinute >= minutes)) {
            diff = 7;
          }
        }
        if (diff < daysUntilNext) {
          daysUntilNext = diff;
        }
      }

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + daysUntilNext);
      nextDate.setHours(hours, minutes, 0, 0);

      return { date: nextDate };
    }

    default:
      return null;
  }
};

// ============================================
// FUNCIONES PÚBLICAS
// ============================================

/**
 * Solicitar permisos de notificaciones al usuario.
 * @returns true si se concedieron permisos
 */
export const requestPermissions = async (): Promise<boolean> => {
  const config = getConfig();

  try {
    const savedPermission = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSIONS_GRANTED);
    if (savedPermission === 'true') {
      const { status } = await SafeNotifications.getPermissionsAsync();
      if (status === 'granted') {
        return true;
      }
    }

    const { status: existingStatus } = await SafeNotifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await SafeNotifications.requestPermissionsAsync();
      finalStatus = status;
    }

    const granted = finalStatus === 'granted';
    await AsyncStorage.setItem(STORAGE_KEYS.PERMISSIONS_GRANTED, String(granted));

    if (granted && Platform.OS === 'android') {
      await SafeNotifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'Recordatorios',
        description: 'Recordatorios de tareas y hábitos',
        importance: SafeNotifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
      });

      if (config.env.DEBUG_MODE) {
        console.log('[Notifications] Canal Android configurado');
      }
    }

    if (config.env.DEBUG_MODE) {
      console.log(`[Notifications] Permisos ${granted ? 'concedidos' : 'denegados'}`);
    }

    return granted;
  } catch (error) {
    console.error('[Notifications] Error solicitando permisos:', error);
    return false;
  }
};

/**
 * Programar recordatorio para una tarea.
 * @param task - Tarea a programar
 * @returns ID de la notificación o null
 */
export const scheduleTaskReminder = async (task: NotifiableTask): Promise<string | null> => {
  const config = getConfig();

  try {
    if (!task.reminderTime || task.completed) {
      if (config.env.DEBUG_MODE) {
        console.log(`[Notifications] Tarea ${task.id} no requiere recordatorio`);
      }
      return null;
    }

    const { status } = await SafeNotifications.getPermissionsAsync();
    if (status !== 'granted') {
      if (config.env.DEBUG_MODE) {
        console.log('[Notifications] Sin permisos, no se programa recordatorio');
      }
      return null;
    }

    await cancelTaskReminder(task.id);

    const trigger = calculateNextTrigger(task);
    if (!trigger) {
      return null;
    }

    const notificationId = await SafeNotifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Recordatorio',
        body: task.title,
        data: { type: 'task_reminder', taskId: task.id },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: NOTIFICATION_CHANNEL_ID }),
      },
      trigger,
    });

    const map = await getTaskNotificationMap();
    map[task.id] = notificationId;
    await saveTaskNotificationMap(map);

    if (config.env.DEBUG_MODE) {
      console.log(`[Notifications] Programado recordatorio para tarea ${task.id}: ${notificationId}`);
    }

    return notificationId;
  } catch (error) {
    console.error('[Notifications] Error programando recordatorio:', error);
    return null;
  }
};

/**
 * Cancelar recordatorio de una tarea.
 * @param taskId - ID de la tarea
 */
export const cancelTaskReminder = async (taskId: string): Promise<void> => {
  const config = getConfig();

  try {
    const map = await getTaskNotificationMap();
    const notificationId = map[taskId];

    if (notificationId) {
      await SafeNotifications.cancelScheduledNotificationAsync(notificationId);
      delete map[taskId];
      await saveTaskNotificationMap(map);

      if (config.env.DEBUG_MODE) {
        console.log(`[Notifications] Cancelado recordatorio de tarea ${taskId}`);
      }
    }
  } catch (error) {
    console.error('[Notifications] Error cancelando recordatorio:', error);
  }
};

/**
 * Programar tip diario del coach a las 9:00 AM.
 */
export const scheduleDailyCoachTip = async (): Promise<void> => {
  const config = getConfig();

  try {
    const { status } = await SafeNotifications.getPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const scheduled = await SafeNotifications.getAllScheduledNotificationsAsync();
    const existingTip = scheduled.find((n) => n.request?.content?.data?.type === 'daily_coach_tip');

    if (existingTip) {
      if (config.env.DEBUG_MODE) {
        console.log('[Notifications] Tip diario ya programado');
      }
      return;
    }

    const notificationId = await SafeNotifications.scheduleNotificationAsync({
      content: {
        title: '🤖 Tu Coach IA',
        body: DAILY_TIPS[new Date().getDay()],
        data: { type: 'daily_coach_tip' },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: NOTIFICATION_CHANNEL_ID }),
      },
      trigger: { hour: 9, minute: 0, repeats: true },
    });

    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_TIP_SCHEDULED, notificationId);

    if (config.env.DEBUG_MODE) {
      console.log(`[Notifications] Tip diario programado: ${notificationId}`);
    }
  } catch (error) {
    console.error('[Notifications] Error programando tip diario:', error);
  }
};

/**
 * Cancelar todas las notificaciones programadas.
 */
export const cancelAllNotifications = async (): Promise<void> => {
  const config = getConfig();

  try {
    await SafeNotifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TASK_NOTIFICATION_MAP,
      STORAGE_KEYS.DAILY_TIP_SCHEDULED,
    ]);

    if (config.env.DEBUG_MODE) {
      console.log('[Notifications] Todas las notificaciones canceladas');
    }
  } catch (error) {
    console.error('[Notifications] Error cancelando notificaciones:', error);
  }
};

/**
 * Obtener cantidad de notificaciones programadas.
 * @returns Número de notificaciones
 */
export const getScheduledCount = async (): Promise<number> => {
  try {
    const scheduled = await SafeNotifications.getAllScheduledNotificationsAsync();
    return scheduled.length;
  } catch (error) {
    console.error('[Notifications] Error obteniendo conteo:', error);
    return 0;
  }
};

/**
 * Verificar si los permisos están concedidos.
 * @returns true si están concedidos
 */
export const arePermissionsGranted = async (): Promise<boolean> => {
  try {
    const { status } = await SafeNotifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

/**
 * Obtener todas las notificaciones programadas.
 */
export const getAllScheduledNotifications = async (): Promise<SafeNotifications.Notification[]> => {
  try {
    return await SafeNotifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
};

// ============================================
// LISTENERS (Seguros para Expo Go)
// ============================================

/**
 * Configurar listeners de notificaciones.
 * Seguro para Expo Go - retorna función de cleanup.
 */
export const setupNotificationListeners = (handlers: {
  onNotificationReceived?: (notification: SafeNotifications.Notification) => void;
  onNotificationResponse?: (response: SafeNotifications.NotificationResponse) => void;
}): (() => void) => {
  const config = getConfig();
  
  // Si estamos en Expo Go, no configurar listeners (causa error)
  if (SafeNotifications.isExpoGo) {
    if (config.env.DEBUG_MODE) {
      console.log('[Notifications] Expo Go detectado - listeners deshabilitados');
    }
    return () => {}; // No-op cleanup
  }

  const subscriptions: SafeNotifications.Subscription[] = [];

  if (handlers.onNotificationReceived) {
    const sub = SafeNotifications.addNotificationReceivedListener(handlers.onNotificationReceived);
    subscriptions.push(sub);
  }

  if (handlers.onNotificationResponse) {
    const sub = SafeNotifications.addNotificationResponseReceivedListener(handlers.onNotificationResponse);
    subscriptions.push(sub);
  }

  if (config.env.DEBUG_MODE) {
    console.log(`[Notifications] ${subscriptions.length} listeners configurados`);
  }

  // Retornar función de cleanup
  return () => {
    subscriptions.forEach((sub) => {
      SafeNotifications.removeNotificationSubscription(sub);
    });
    if (config.env.DEBUG_MODE) {
      console.log('[Notifications] Listeners removidos');
    }
  };
};

/**
 * Alias para cleanup (compatibilidad)
 */
export const cleanupNotificationListeners = (cleanup: () => void): void => {
  cleanup();
};
