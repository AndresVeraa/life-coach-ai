import React from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { ScreenWrapper } from '@/shared/ui/ScreenWrapper';
import { SleepTracker } from './components/SleepTracker';
import { HealthStats } from './components/HealthStats';
import { useHealthStore } from './health.store';

export const HealthScreen = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const { records } = useHealthStore();

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simular refresh (normalmente sería sincronización)
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScreenWrapper className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">Mi Salud 🌙</Text>
          <Text className="text-gray-500 mt-1">Registra y monitorea tu sueño</Text>
        </View>

        {/* Sleep Tracker Form */}
        <SleepTracker onSuccess={() => setRefreshing(false)} />

        {/* Health Stats */}
        {records.length > 0 ? (
          <HealthStats />
        ) : (
          <View className="bg-white rounded-xl p-8 items-center justify-center border border-gray-100">
            <Text className="text-gray-400 text-lg text-center mb-2">
              Aún no hay registros de sueño
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              Comienza a registrar tu sueño arriba para ver estadísticas
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};
