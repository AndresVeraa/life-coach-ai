/**
 * Wrapper seguro para expo-notifications
 * 
 * En Expo Go (SDK 53+), las push notifications remotas no funcionan.
 * Este módulo previene el error al no importar expo-notifications en Expo Go.
 * 
 * Las notificaciones locales SÍ funcionan en Expo Go, pero necesitamos
 * evitar que la librería registre listeners de push automáticamente.
 */

import Constants from 'expo-constants';

// Detectar Expo Go ANTES de cualquier import de expo-notifications
const isExpoGo = Constants.appOwnership === 'expo';

// Tipos que necesitamos exportar
export type NotificationPermissionsStatus = {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
  granted: boolean;
};

export type NotificationContent = {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  data?: Record<string, unknown>;
  sound?: boolean | string;
  badge?: number | null;
};

export type NotificationTrigger = {
  type: string;
  repeats?: boolean;
  [key: string]: unknown;
};

export type Notification = {
  date: number;
  request: {
    identifier: string;
    content: NotificationContent;
    trigger: NotificationTrigger | null;
  };
};

export type NotificationResponse = {
  notification: Notification;
  actionIdentifier: string;
  userText?: string;
};

export type Subscription = {
  remove: () => void;
};

// Mock functions para Expo Go
const mockSubscription: Subscription = { remove: () => {} };

const mockPermissions: NotificationPermissionsStatus = {
  status: 'denied',
  canAskAgain: false,
  granted: false,
};

// ============================================
// API Real (solo si NO es Expo Go)
// ============================================

let Notifications: typeof import('expo-notifications') | null = null;

// Solo cargar expo-notifications si NO estamos en Expo Go
if (!isExpoGo) {
  try {
    // Usar require para evitar que el import estático cause el error
    Notifications = require('expo-notifications');
  } catch (e) {
    console.warn('[Notifications] Error cargando expo-notifications:', e);
  }
}

// ============================================
// Exported Functions (safe wrappers)
// ============================================

export const getPermissionsAsync = async (): Promise<NotificationPermissionsStatus> => {
  if (isExpoGo || !Notifications) {
    console.log('[Notifications] Expo Go detectado - permisos simulados');
    return mockPermissions;
  }
  const result = await Notifications.getPermissionsAsync();
  return {
    status: result.status,
    canAskAgain: result.canAskAgain,
    granted: result.granted,
  };
};

export const requestPermissionsAsync = async (): Promise<NotificationPermissionsStatus> => {
  if (isExpoGo || !Notifications) {
    console.log('[Notifications] Expo Go detectado - no se pueden solicitar permisos de push');
    return mockPermissions;
  }
  const result = await Notifications.requestPermissionsAsync();
  return {
    status: result.status,
    canAskAgain: result.canAskAgain,
    granted: result.granted,
  };
};

export const scheduleNotificationAsync = async (request: {
  content: NotificationContent;
  trigger: unknown;
  identifier?: string;
}): Promise<string> => {
  if (isExpoGo || !Notifications) {
    console.log('[Notifications] Expo Go detectado - notificación NO programada:', request.content.title);
    return `mock-${Date.now()}`;
  }
  return Notifications.scheduleNotificationAsync(request as any);
};

export const cancelScheduledNotificationAsync = async (identifier: string): Promise<void> => {
  if (isExpoGo || !Notifications) return;
  return Notifications.cancelScheduledNotificationAsync(identifier);
};

export const cancelAllScheduledNotificationsAsync = async (): Promise<void> => {
  if (isExpoGo || !Notifications) return;
  return Notifications.cancelAllScheduledNotificationsAsync();
};

export const getAllScheduledNotificationsAsync = async (): Promise<Notification[]> => {
  if (isExpoGo || !Notifications) return [];
  return Notifications.getAllScheduledNotificationsAsync() as Promise<Notification[]>;
};

export const setNotificationChannelAsync = async (
  channelId: string,
  channel: {
    name: string;
    importance: number;
    description?: string;
    sound?: string;
    vibrationPattern?: number[];
    lightColor?: string;
    enableVibrate?: boolean;
    enableLights?: boolean;
  }
): Promise<unknown> => {
  if (isExpoGo || !Notifications) return null;
  return Notifications.setNotificationChannelAsync(channelId, channel as any);
};

export const setNotificationHandler = (handler: {
  handleNotification: (notification: Notification) => Promise<{
    shouldShowAlert: boolean;
    shouldPlaySound: boolean;
    shouldSetBadge: boolean;
  }>;
}): void => {
  if (isExpoGo || !Notifications) return;
  Notifications.setNotificationHandler(handler as any);
};

export const addNotificationReceivedListener = (
  listener: (notification: Notification) => void
): Subscription => {
  if (isExpoGo || !Notifications) return mockSubscription;
  return Notifications.addNotificationReceivedListener(listener as any);
};

export const addNotificationResponseReceivedListener = (
  listener: (response: NotificationResponse) => void
): Subscription => {
  if (isExpoGo || !Notifications) return mockSubscription;
  return Notifications.addNotificationResponseReceivedListener(listener as any);
};

export const removeNotificationSubscription = (subscription: Subscription): void => {
  if (isExpoGo || !Notifications) return;
  Notifications.removeNotificationSubscription(subscription as any);
};

// Re-export Android importance levels
export const AndroidImportance = {
  UNKNOWN: 0,
  UNSPECIFIED: -1000,
  NONE: 0,
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5,
};

// Export flag para que otros módulos sepan si estamos en Expo Go
export { isExpoGo };
