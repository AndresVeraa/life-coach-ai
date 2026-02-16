import { useAppContext } from '@/shared/context/AppContext';

/**
 * GUÍA DE USO: AppContext
 * 
 * El AppContext proporciona estado global para toda la aplicación.
 * Incluye información del usuario, estadísticas, y estado de sincronización.
 * 
 * EJEMPLO DE USO EN UN COMPONENTE:
 */

// import { Text, View } from 'react-native';
// import { useAppContext } from '@/shared/context/AppContext';

// export const MyComponent = () => {
//   const { user, userStats, isOffline, isSyncing, setUser, updateUserStats } = useAppContext();

//   return (
//     <View>
//       <Text>Usuario: {user?.name || 'Anónimo'}</Text>
//       <Text>Tareas completadas: {userStats.completedTasks}</Text>
//       <Text>Estado: {isOffline ? '🔴 Offline' : '🟢 Online'}</Text>
//       <Text>Sincronizando: {isSyncing ? 'Sí' : 'No'}</Text>
//     </View>
//   );
// };

/**
 * MÉTODOS DISPONIBLES:
 * 
 * 1. setUser(user: User | null)
 *    - Establece el usuario actual
 *    - Ejemplo: setUser({ id: '1', email: 'user@example.com', name: 'John', createdAt: Date.now(), lastSyncAt: null })
 * 
 * 2. updateUserStats(stats: Partial<UserStats>)
 *    - Actualiza parcialmente las estadísticas del usuario
 *    - Ejemplo: updateUserStats({ completedTasks: 5, failedTasks: 1 })
 * 
 * 3. setSyncing(syncing: boolean)
 *    - Indica si la app está sincronizando datos con el servidor
 *    - Usado internamente por el syncEngine
 * 
 * 4. setOffline(offline: boolean)
 *    - Establece si la app está offline o online
 *    - Se detecta automáticamente mediante useNetworkStatus
 */
