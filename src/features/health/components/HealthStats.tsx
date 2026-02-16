import React from 'react';
import { View, Text } from 'react-native';
import { Zap, TrendingUp, Star, Calendar } from 'lucide-react-native';
import { useHealthStore } from '../health.store';

export const HealthStats = () => {
  const { metrics, last7Days } = useHealthStore();

  const getQualityLabel = (quality: number): string => {
    if (quality === 0) return '—';
    if (quality <= 2) return '😫';
    if (quality <= 3) return '😑';
    if (quality === 4) return '😊';
    return '😴';
  };

  const getQualityColor = (quality: number): string => {
    if (quality === 0) return 'bg-gray-200';
    if (quality <= 2) return 'bg-red-200';
    if (quality === 3) return 'bg-yellow-200';
    if (quality === 4) return 'bg-green-200';
    return 'bg-emerald-200';
  };

  return (
    <View className="space-y-4">
      {/* KPI Cards */}
      <View>
        <Text className="text-lg font-bold text-gray-900 mb-3">Este Mes</Text>

        {/* Row 1: Average Sleep & Goal */}
        <View className="flex-row gap-3 mb-3">
          {/* Average Sleep */}
          <View className="flex-1 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Zap size={18} color="#10B981" />
              <Text className="text-xs font-semibold text-gray-600 ml-2">Prom. Sueño</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">
              {metrics.averageSleep.toFixed(1)}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">horas/noche</Text>
          </View>

          {/* Goal Met Indicator */}
          <View className="flex-1 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <View className="flex-row items-center mb-2">
              <TrendingUp size={18} color={metrics.goalMet ? '#10B981' : '#EF4444'} />
              <Text className="text-xs font-semibold text-gray-600 ml-2">Meta 8h</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {metrics.goalMet ? '✓' : '✗'}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              {metrics.goalMet ? 'Cumplida' : 'No cumplida'}
            </Text>
          </View>
        </View>

        {/* Row 2: Consecutive & Records */}
        <View className="flex-row gap-3">
          {/* Consecutive Days */}
          <View className="flex-1 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Calendar size={18} color="#8B5CF6" />
              <Text className="text-xs font-semibold text-gray-600 ml-2">Rachas</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">{metrics.consecutiveDays}</Text>
            <Text className="text-xs text-gray-500 mt-1">días seguidos</Text>
          </View>

          {/* Total Records */}
          <View className="flex-1 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Star size={18} color="#F59E0B" />
              <Text className="text-xs font-semibold text-gray-600 ml-2">Registros</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">{metrics.totalRecordsMonth}</Text>
            <Text className="text-xs text-gray-500 mt-1">este mes</Text>
          </View>
        </View>
      </View>

      {/* Last 7 Days Chart */}
      <View className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <Text className="text-sm font-bold text-gray-900 mb-4">Últimos 7 Días</Text>

        {last7Days.map((day, idx) => (
          <View key={idx} className="mb-3">
            {/* Date Label */}
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-xs font-semibold text-gray-600">
                {new Date(day.date).toLocaleDateString('es-ES', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-bold text-gray-900">{day.hours}h</Text>
                <Text className="text-sm">{getQualityLabel(day.quality)}</Text>
              </View>
            </View>

            {/* Bar chart */}
            <View className="flex-row items-center gap-2">
              <View className="flex-1 bg-gray-100 rounded-full overflow-hidden h-2">
                <View
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${(day.hours / 10) * 100}%` }}
                />
              </View>
              {day.quality > 0 && (
                <View
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${getQualityColor(
                    day.quality
                  )}`}
                >
                  <Text className="text-xs font-bold">{day.quality}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Quality Range Summary */}
      {metrics.bestDay > 0 && (
        <View className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <Text className="text-sm font-bold text-gray-900 mb-3">Calidad Registrada</Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-gray-600 mb-1">Mejor</Text>
              <Text className="text-2xl font-bold text-green-600">{metrics.bestDay}/5</Text>
            </View>
            <View>
              <Text className="text-xs text-gray-600 mb-1">Peor</Text>
              <Text className="text-2xl font-bold text-red-600">{metrics.worstDay}/5</Text>
            </View>
            {metrics.lastRecordDate && (
              <View>
                <Text className="text-xs text-gray-600 mb-1">Último</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {new Date(metrics.lastRecordDate).toLocaleDateString('es-ES')}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};
