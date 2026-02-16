import React from 'react';
import { View, Text } from 'react-native';
import { Prediction } from '@/services/analytics/predictor';

interface TrendChartProps {
  predictions: Prediction[];
  maxItems?: number;
}

/**
 * Componente que muestra el histórico de predicciones como un gráfico simple
 * Usa caracteres y colores para visualizar la tendencia
 */
export const TrendChart: React.FC<TrendChartProps> = ({ predictions, maxItems = 8 }) => {
  if (predictions.length === 0) {
    return (
      <View className="bg-gray-50 rounded-lg p-4 mb-4">
        <Text className="text-gray-600 text-center text-sm">
          Sin histórico aún. Realiza análisis regularmente para ver tendencias.
        </Text>
      </View>
    );
  }

  // Tomar últimos N items
  const displayedPredictions = predictions.slice(0, maxItems);
  const reversedPredictions = [...displayedPredictions].reverse();

  // Encontrar min/max para escalar
  const hours = reversedPredictions.map((p) => p.hoursLostNextWeek);
  const maxHours = Math.max(...hours);
  const minHours = Math.min(...hours);
  const range = maxHours - minHours || 1;

  // Calcular tendencia global
  let globalTrend = '➡️ Estable';
  if (reversedPredictions.length >= 2) {
    const recent = reversedPredictions[reversedPredictions.length - 1].hoursLostNextWeek;
    const previous = reversedPredictions[0].hoursLostNextWeek;
    const change = ((recent - previous) / previous) * 100;

    if (change > 10) {
      globalTrend = `📈 Empeorando (+${Math.round(change)}%)`;
    } else if (change < -10) {
      globalTrend = `📉 Mejorando (${Math.round(change)}%)`;
    }
  }

  // Escalar valor a altura de 1-4
  const scaleToHeight = (value: number): number => {
    const scaled = ((value - minHours) / range) * 3 + 1;
    return Math.round(scaled);
  };

  // Obtener color basado en el nivel
  const getBarColor = (hours: number): string => {
    if (hours >= 7) return 'bg-red-500';
    if (hours >= 5) return 'bg-orange-500';
    if (hours >= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Bar chart
  const maxHeight = 4;
  const bars = reversedPredictions.map((pred, idx) => {
    const height = scaleToHeight(pred.hoursLostNextWeek);
    const barColor = getBarColor(pred.hoursLostNextWeek);

    return (
      <View key={`bar-${idx}`} className="flex-1 items-center gap-1">
        {/* Barra */}
        <View className="w-full flex-row-reverse items-flex-end justify-center gap-0.5">
          {Array.from({ length: maxHeight }).map((_, i) => (
            <View
              key={`segment-${i}`}
              className={`w-1.5 rounded-sm ${i < height ? barColor : 'bg-gray-200'}`}
              style={{ height: 8 }}
            />
          ))}
        </View>
        {/* Etiqueta (hora) */}
        <Text className="text-xs text-gray-600 font-semibold">
          {pred.hoursLostNextWeek.toFixed(1)}h
        </Text>
        {/* Confianza */}
        <Text className="text-xs text-gray-500">{pred.confidence}%</Text>
      </View>
    );
  });

  return (
    <View className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
      {/* Encabezado */}
      <View className="mb-4">
        <Text className="text-lg font-bold text-gray-900">📊 Tendencia</Text>
        <Text className="text-sm text-gray-600 mt-1">{globalTrend}</Text>
      </View>

      {/* Gráfico */}
      <View className="bg-gray-50 rounded-lg p-4 mb-4">
        <View className="flex-row items-flex-end gap-2">
          {bars}
        </View>
      </View>

      {/* Leyenda */}
      <View className="space-y-2">
        <Text className="text-xs font-semibold text-gray-700 mb-2">Riesgo por Nivel:</Text>
        <View className="flex-row gap-3 flex-wrap">
          <View className="flex-row items-center gap-1">
            <View className="w-3 h-3 rounded-sm bg-green-500" />
            <Text className="text-xs text-gray-600">&lt;3h (Bajo)</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-3 h-3 rounded-sm bg-yellow-500" />
            <Text className="text-xs text-gray-600">3-5h (Medio)</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-3 h-3 rounded-sm bg-orange-500" />
            <Text className="text-xs text-gray-600">5-7h (Alto)</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-3 h-3 rounded-sm bg-red-500" />
            <Text className="text-xs text-gray-600">&gt;7h (Crítico)</Text>
          </View>
        </View>
      </View>

      {/* Info */}
      {reversedPredictions.length > 0 && (
        <View className="mt-4 pt-4 border-t border-gray-200">
          <Text className="text-xs text-gray-600">
            📅 {reversedPredictions.length} semanas de histórico
            {reversedPredictions.length >= 2 && ' • Tendencia calculada'}
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * EJEMPLO DE USO:
 *
 * import { TrendChart } from '@/features/analytics/components/TrendChart';
 * import { useAnalyticsHistory } from '@/features/analytics/analytics.store';
 *
 * const MyScreen = () => {
 *   const { previousPredictions } = useAnalyticsHistory();
 *
 *   return (
 *     <ScrollView>
 *       <TrendChart predictions={previousPredictions} maxItems={8} />
 *     </ScrollView>
 *   );
 * };
 */
