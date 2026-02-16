import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSyncManager } from '@/services/sync/hooks/useSyncManager';

/**
 * Componente indicador de estado de sincronización
 * Muestra en la parte superior de la pantalla
 */
export const SyncStatusIndicator = () => {
  const { status, statusMessage, sync, retry, isOnline, isSyncing } = useSyncManager();

  // No mostrar si está sincronizado y online
  if (status === 'synced' && isOnline) {
    return null;
  }

  // Determinar colores según estado
  const getBackgroundColor = (): string => {
    switch (status) {
      case 'syncing':
        return 'bg-blue-50';
      case 'synced':
        return 'bg-green-50';
      case 'pending':
        return 'bg-yellow-50';
      case 'error':
        return 'bg-red-50';
      case 'offline':
        return 'bg-gray-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getTextColor = (): string => {
    switch (status) {
      case 'syncing':
        return 'text-blue-700';
      case 'synced':
        return 'text-green-700';
      case 'pending':
        return 'text-yellow-700';
      case 'error':
        return 'text-red-700';
      case 'offline':
        return 'text-gray-700';
      default:
        return 'text-gray-700';
    }
  };

  const getBorderColor = (): string => {
    switch (status) {
      case 'syncing':
        return 'border-blue-200';
      case 'synced':
        return 'border-green-200';
      case 'pending':
        return 'border-yellow-200';
      case 'error':
        return 'border-red-200';
      case 'offline':
        return 'border-gray-200';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <View
      className={`${getBackgroundColor()} border ${getBorderColor()} border-b px-4 py-3 flex-row items-center justify-between`}
    >
      {/* Izquierda: Spinner + Mensaje */}
      <View className="flex-row items-center flex-1 gap-2">
        {status === 'syncing' && (
          <ActivityIndicator size="small" color={getTextColor().replace('text-', '#')} />
        )}

        <Text className={`${getTextColor()} text-sm font-semibold flex-1`}>{statusMessage}</Text>
      </View>

      {/* Derecha: Botones de acción */}
      {status === 'error' && isOnline && (
        <TouchableOpacity
          onPress={retry}
          disabled={isSyncing}
          className="ml-2 px-3 py-1 bg-red-600 rounded-lg"
        >
          <Text className="text-white text-xs font-semibold">Reintentar</Text>
        </TouchableOpacity>
      )}

      {status === 'pending' && isOnline && !isSyncing && (
        <TouchableOpacity onPress={sync} className="ml-2 px-3 py-1 bg-yellow-600 rounded-lg">
          <Text className="text-white text-xs font-semibold">Sincronizar</Text>
        </TouchableOpacity>
      )}

      {status === 'offline' && (
        <Text className="text-xs text-gray-500 ml-2">Se conectará automáticamente</Text>
      )}
    </View>
  );
};

/**
 * Componente de status detallado (para settings/debug)
 */
export const SyncStatusDetail = () => {
  const { status, isSyncing, isOnline, pendingOperations, lastSyncTime, syncError, sync, retry } =
    useSyncManager();

  return (
    <View className="bg-white rounded-lg p-4 border border-gray-200">
      <Text className="text-lg font-bold text-gray-900 mb-3">📊 Estado de Sincronización</Text>

      {/* Status Badges */}
      <View className="flex-row gap-2 mb-4">
        <View className={`px-3 py-1 rounded-full ${isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
          <Text
            className={`text-xs font-semibold ${isOnline ? 'text-green-700' : 'text-gray-700'}`}
          >
            {isOnline ? '📡 Online' : '📴 Offline'}
          </Text>
        </View>

        <View
          className={`px-3 py-1 rounded-full ${
            isSyncing ? 'bg-blue-100' : status === 'error' ? 'bg-red-100' : 'bg-green-100'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              isSyncing ? 'text-blue-700' : status === 'error' ? 'text-red-700' : 'text-green-700'
            }`}
          >
            {isSyncing ? '🔄 Sincronizando' : status === 'error' ? '❌ Error' : '✅ Sincronizado'}
          </Text>
        </View>
      </View>

      {/* Detalles */}
      <View className="space-y-2 border-t border-gray-100 pt-3">
        <View className="flex-row justify-between">
          <Text className="text-sm text-gray-600">Operaciones pendientes:</Text>
          <Text className="font-semibold text-gray-900">{pendingOperations}</Text>
        </View>

        {lastSyncTime && (
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Última sincronización:</Text>
            <Text className="font-semibold text-gray-900">
              {new Date(lastSyncTime).toLocaleTimeString('es-ES')}
            </Text>
          </View>
        )}

        {syncError && (
          <View className="bg-red-50 p-2 rounded mt-2">
            <Text className="text-xs text-red-700 font-semibold mb-1">Error:</Text>
            <Text className="text-xs text-red-600">{syncError}</Text>
          </View>
        )}
      </View>

      {/* Botones de acción */}
      <View className="flex-row gap-2 mt-4">
        <TouchableOpacity
          onPress={sync}
          disabled={!isOnline || isSyncing}
          className={`flex-1 py-2 rounded-lg ${
            isOnline && !isSyncing ? 'bg-indigo-600' : 'bg-gray-300'
          }`}
        >
          <Text className="text-white font-semibold text-center text-sm">Sincronizar ahora</Text>
        </TouchableOpacity>

        {status === 'error' && (
          <TouchableOpacity
            onPress={retry}
            disabled={!isOnline || isSyncing}
            className={`flex-1 py-2 rounded-lg ${
              isOnline && !isSyncing ? 'bg-red-600' : 'bg-gray-300'
            }`}
          >
            <Text className="text-white font-semibold text-center text-sm">Reintentar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/*
EJEMPLO DE USO:

1. En AppNavigator o RootLayout:
   <View>
     <SyncStatusIndicator />
   </View>

2. En settings screen:
   <View>
     <SyncStatusDetail />
   </View>
*/
