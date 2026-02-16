import React from 'react';
import { View, Text } from 'react-native';
import { useAuditStore } from '../audit.store';
import { CATEGORY_CONFIG } from '../types';

export const AuditSummary = () => {
  const { metrics } = useAuditStore();

  const getTrendIcon = () => {
    if (metrics.weeklyTrend === 'improving') {
      return <Text className="text-2xl">📈</Text>;
    }
    if (metrics.weeklyTrend === 'declining') {
      return <Text className="text-2xl">📉</Text>;
    }
    return <Text className="text-2xl">➡️</Text>;
  };

  const getTrendLabel = () => {
    if (metrics.weeklyTrend === 'improving')
      return '¡Mejorando! Menos distracciones';
    if (metrics.weeklyTrend === 'declining')
      return 'Empeorando. Más distracciones.';
    return 'Estable. Mismo nivel.';
  };

  return (
    <View className="space-y-4">
      <Text className="text-lg font-bold text-gray-900 mb-3">📊 Estadísticas</Text>

      {/* KPI Row 1: Total y Promedio */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <Text className="text-xs font-semibold text-gray-600 mb-2">Total Histórico</Text>
          <Text className="text-3xl font-bold text-red-600">
            {metrics.totalMinutesLost}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">minutos</Text>
        </View>

        <View className="flex-1 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <Text className="text-xs font-semibold text-gray-600 mb-2">Promedio/Día</Text>
          <Text className="text-3xl font-bold text-orange-600">
            {metrics.averageMinutesPerDay}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">minutos</Text>
        </View>

        <View className="flex-1 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <Text className="text-xs font-semibold text-gray-600 mb-2">Sesiones</Text>
          <Text className="text-3xl font-bold text-indigo-600">
            {metrics.totalSessions}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">días</Text>
        </View>
      </View>

      {/* Tendencia */}
      <View className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          {getTrendIcon()}
          <Text className="text-sm font-bold text-gray-900 flex-1 ml-3">
            {getTrendLabel()}
          </Text>
        </View>
        <Text className="text-xs text-gray-500">
          Comparando últimos 3 días vs primeros 4 días
        </Text>
      </View>

      {/* Desglose por Categoría */}
      <View className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <Text className="text-sm font-bold text-gray-900 mb-3">Por Categoría</Text>

        {(Object.entries(metrics.categoryBreakdown) as any[]).map(([category, data]) => {
          const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];

          if (data.count === 0) return null;

          return (
            <View key={category} className="mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-semibold text-gray-800">
                  {config.emoji} {config.label}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs font-bold text-gray-600">
                    {data.totalMinutes}m
                  </Text>
                  <Text className="text-xs font-bold text-indigo-600">
                    {data.percentage}%
                  </Text>
                </View>
              </View>

              {/* Bar chart */}
              <View className="flex-row items-center gap-2">
                <View className="flex-1 bg-gray-100 rounded-full overflow-hidden h-2">
                  <View
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${data.percentage}%` }}
                  />
                </View>
                <Text className="text-xs text-gray-500 w-8">
                  {data.count}x
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Últimos 7 días */}
      <View className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <Text className="text-sm font-bold text-gray-900 mb-3">Últimos 7 Días</Text>

        {metrics.last7Days.map((day, idx) => {
          const dayName = new Date(day.date).toLocaleDateString('es-ES', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          return (
            <View key={idx} className="mb-2">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-xs font-semibold text-gray-600">{dayName}</Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs font-bold text-gray-900">
                    {day.minutesLost}m
                  </Text>
                  <Text className="text-xs text-gray-500">
                    ({day.distractionCount}x)
                  </Text>
                </View>
              </View>

              {/* Mini bar */}
              <View className="flex-row items-center gap-2">
                <View className="flex-1 bg-gray-100 rounded-full overflow-hidden h-1.5">
                  <View
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min((day.minutesLost / 120) * 100, 100)}%` }}
                  />
                </View>
              </View>
            </View>
          );
        })}

        <Text className="text-xs text-gray-400 mt-3 text-center">
          Escala: hasta 120 min por día
        </Text>
      </View>
    </View>
  );
};
