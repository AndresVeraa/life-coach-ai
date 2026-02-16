/**
 * CoachAnalyticsHeader
 *
 * Muestra información key del coaching basada en análisis:
 * - Mejor hora para tareas (golden hour)
 * - Horas a evitar (pico horario)
 * - Día débil
 * - Estado de tendencia
 */

import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, Zap } from 'lucide-react-native';

interface CoachAnalyticsHeaderProps {
  bestTimeHours?: number[];
  bestTimeReason?: string;
  hoursToAvoid?: number[];
  hoursToAvoidReason?: string;
  worstDay?: string;
  trendDirection?: 'improving' | 'stable' | 'worsening';
}

/**
 * Formatea array de horas a string legible
 * [9, 10, 14] → "9:00 - 10:00 y 14:00"
 */
const formatHours = (hours: number[] | undefined): string => {
  if (!hours || hours.length === 0) return '—';

  return hours
    .map((h) => `${h}:00`)
    .join(', ')
    .replace(/, (\d+):00$/, ' y $1:00');
};

/**
 * Card de tiempo (mejor o peor)
 */
const TimeCard = ({
  emoji,
  title,
  hours,
  reason,
  bgColor,
  borderColor,
}: {
  emoji: string;
  title: string;
  hours: string;
  reason: string;
  bgColor: string;
  borderColor: string;
}) => (
  <View className={`flex-1 ${bgColor} ${borderColor} rounded-lg p-3 border-b-4`}>
    <View className="flex-row items-center mb-2">
      <Text className="text-lg mr-2">{emoji}</Text>
      <Text className="font-semibold text-gray-900 text-sm ml-1">{title}</Text>
    </View>
    <Text className="text-lg font-bold text-gray-900 mb-1">{hours}</Text>
    <Text className="text-xs text-gray-600 leading-4">{reason}</Text>
  </View>
);

/**
 * Badge de estado
 */
const StatusBadge = ({
  emoji,
  label,
  value,
  bgColor,
}: {
  emoji: string;
  label: string;
  value: string;
  bgColor: string;
}) => (
  <View className={`${bgColor} rounded-lg px-3 py-2 mb-2`}>
    <Text className="text-xs text-gray-600 mb-1">{label}</Text>
    <View className="flex-row items-center">
      <Text className="text-base mr-2">{emoji}</Text>
      <Text className="font-semibold text-sm text-gray-900">{value}</Text>
    </View>
  </View>
);

export const CoachAnalyticsHeader = ({
  bestTimeHours,
  bestTimeReason,
  hoursToAvoid,
  hoursToAvoidReason,
  worstDay,
  trendDirection,
}: CoachAnalyticsHeaderProps) => {
  // No renderizar si no hay datos
  if (
    !bestTimeHours &&
    !hoursToAvoid &&
    !worstDay &&
    trendDirection === undefined
  ) {
    return null;
  }

  const bestTimeFormatted = formatHours(bestTimeHours);
  const avoidTimeFormatted = formatHours(hoursToAvoid);

  return (
    <View className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 mb-4">
      {/* Encabezado */}
      <View className="mb-4 flex-row items-center">
        <Zap size={20} color="#6366f1" strokeWidth={2.5} />
        <Text className="text-gray-900 font-bold text-base ml-2">
          Tu Analytics Coaching
        </Text>
      </View>

      {/* Grid: Mejor hora / Horas a evitar */}
      {(bestTimeHours || hoursToAvoid) && (
        <View className="flex-row gap-3 mb-4">
          {bestTimeHours && bestTimeFormatted !== '—' && (
            <TimeCard
              emoji="✨"
              title="Golden Hour"
              hours={bestTimeFormatted}
              reason={bestTimeReason || 'Tu mejor hora para enfoque'}
              bgColor="bg-emerald-50"
              borderColor="border-emerald-400"
            />
          )}

          {hoursToAvoid && avoidTimeFormatted !== '—' && (
            <TimeCard
              emoji="⚠️"
              title="Evita"
              hours={avoidTimeFormatted}
              reason={hoursToAvoidReason || 'Tu hora crítica'}
              bgColor="bg-red-50"
              borderColor="border-red-400"
            />
          )}
        </View>
      )}

      {/* Badges de estado adicional */}
      <View className="flex-row flex-wrap">
        {worstDay && (
          <View className="w-1/2 pr-2 mb-2">
            <StatusBadge
              emoji="📉"
              label="Día Débil"
              value={worstDay}
              bgColor="bg-yellow-50"
            />
          </View>
        )}

        {trendDirection && (
          <View className="w-1/2 pl-2 mb-2">
            <StatusBadge
              emoji={
                trendDirection === 'improving'
                  ? '📈'
                  : trendDirection === 'worsening'
                    ? '📉'
                    : '➡️'
              }
              label="Tendencia"
              value={
                trendDirection === 'improving'
                  ? 'Mejorando'
                  : trendDirection === 'worsening'
                    ? 'Empeorando'
                    : 'Estable'
              }
              bgColor={
                trendDirection === 'improving'
                  ? 'bg-green-50'
                  : trendDirection === 'worsening'
                    ? 'bg-orange-50'
                    : 'bg-blue-50'
              }
            />
          </View>
        )}
      </View>

      {/* Separador */}
      <View className="mt-3 h-px bg-indigo-200" />
      <Text className="text-xs text-gray-500 mt-3">
        ✨ Coach IA personalizado basado en tus patrones
      </Text>
    </View>
  );
};
