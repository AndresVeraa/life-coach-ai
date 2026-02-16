import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { PatternAnalysis, HourPattern, DayPattern } from '@/services/analytics/patternAnalyzer';

interface PatternHeatmapProps {
  analysis: PatternAnalysis | null;
}

/**
 * Componente que muestra un heatmap 2D de patrones
 * X: Horas del día (0-23)
 * Y: Días de la semana
 * Color: Intensidad de distracciones (verde=bajo, rojo=alto)
 */
export const PatternHeatmap: React.FC<PatternHeatmapProps> = ({ analysis }) => {
  const cellSize = 28; // píxeles

  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getColorForMinutes = (minutes: number | undefined): string => {
    if (minutes === undefined || minutes === 0) return 'bg-gray-100';
    if (minutes < 5) return 'bg-green-200';
    if (minutes < 15) return 'bg-yellow-200';
    if (minutes < 30) return 'bg-orange-200';
    return 'bg-red-200';
  };

  const getTextColorForMinutes = (minutes: number | undefined): string => {
    if (minutes === undefined || minutes < 20) return 'text-gray-700';
    return 'text-gray-900';
  };

  if (!analysis) {
    return (
      <View className="bg-gray-50 rounded-lg p-4 mb-4">
        <Text className="text-gray-600 text-center text-sm">
          Sin análisis aún. Completa auditorías para ver patrones.
        </Text>
      </View>
    );
  }

  // Crear matriz 2D: horas x días
  const heatmapData = useMemo(() => {
    const matrix: (number | undefined)[][] = [];

    for (let day = 0; day < 7; day++) {
      const row: (number | undefined)[] = [];
      const dayPattern = analysis.dayPatterns.find((p) => p.dayOfWeek === day);

      for (let hour = 0; hour < 24; hour++) {
        const hourPattern = analysis.hourPatterns.find((p) => p.hour === hour);
        // Usar un promedio simple: (día + hora) / 2
        const minutes =
          hourPattern && dayPattern
            ? (hourPattern.avgMinutesLost + dayPattern.avgMinutesLost) / 2
            : hourPattern
              ? hourPattern.avgMinutesLost
              : dayPattern
                ? dayPattern.avgMinutesLost
                : 0;

        row.push(minutes > 0 ? minutes : undefined);
      }
      matrix.push(row);
    }

    return matrix;
  }, [analysis]);

  // Encontrar min/max para normalización
  const allValues = heatmapData
    .flat()
    .filter((v) => v !== undefined) as number[];
  const maxMinutes = Math.max(...allValues, 1);

  return (
    <View className="mb-6">
      <View className="mb-4">
        <Text className="text-lg font-bold text-gray-900">🔥 Mapa de Calor</Text>
        <Text className="text-sm text-gray-600 mt-1">
          Horas vs Días de la semana (verde=bajo, rojo=alto)
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Contenedor principal */}
        <View>
          {/* Títulos de horas */}
          <View className="flex-row">
            <View style={{ width: 35 }} /> {/* Espacio para etiquetas de días */}
            {analysis.hourPatterns.map((hp) => (
              <View
                key={`hour-${hp.hour}`}
                style={{ width: cellSize }}
                className="items-center justify-center"
              >
                <Text className="text-xs text-gray-600 font-semibold">
                  {hp.hour}h
                </Text>
              </View>
            ))}
          </View>

          {/* Matriz */}
          {heatmapData.map((row, dayIdx) => (
            <View key={`day-${dayIdx}`} className="flex-row">
              {/* Etiqueta del día */}
              <View
                style={{ width: 35 }}
                className="items-center justify-center bg-gray-100 border border-gray-200"
              >
                <Text className="text-xs font-bold text-gray-700">
                  {dayLabels[dayIdx]}
                </Text>
              </View>

              {/* Celdas */}
              {row.map((minutes, hourIdx) => (
                <View
                  key={`cell-${dayIdx}-${hourIdx}`}
                  style={{ width: cellSize, height: cellSize }}
                  className={`${getColorForMinutes(minutes)} border border-gray-200 items-center justify-center`}
                >
                  {minutes !== undefined && minutes > 0 && (
                    <Text
                      className={`text-xs font-bold ${getTextColorForMinutes(minutes)}`}
                    >
                      {Math.round(minutes)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Leyenda */}
      <View className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
        <Text className="text-xs font-semibold text-gray-700 mb-2">Escala de Minutos:</Text>
        <View className="flex-row gap-3 flex-wrap">
          <View className="flex-row items-center gap-1">
            <View className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
            <Text className="text-xs text-gray-600">0 min</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-4 h-4 rounded bg-green-200" />
            <Text className="text-xs text-gray-600">1-5 min</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-4 h-4 rounded bg-yellow-200" />
            <Text className="text-xs text-gray-600">5-15 min</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-4 h-4 rounded bg-orange-200" />
            <Text className="text-xs text-gray-600">15-30 min</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-4 h-4 rounded bg-red-200" />
            <Text className="text-xs text-gray-600">&gt;30 min</Text>
          </View>
        </View>
      </View>

      {/* Insights del mapa */}
      {analysis.peakHour && (
        <View className="mt-4 bg-red-50 rounded-lg p-3 border border-red-200">
          <Text className="text-sm text-red-900 font-semibold mb-1">
            🔴 Zona Crítica Detectada
          </Text>
          <Text className="text-sm text-red-800">
            {analysis.peakHour.hour}:00 - {analysis.peakHour.avgMinutesLost.toFixed(1)} min promedio
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * EJEMPLO DE USO:
 *
 * import { PatternHeatmap } from '@/features/analytics/components/PatternHeatmap';
 * import { useAdvancedAnalytics } from '@/features/analytics/useAdvancedAnalytics';
 *
 * const MyScreen = () => {
 *   const { analysis } = useAdvancedAnalytics();
 *
 *   return (
 *     <ScrollView>
 *       <PatternHeatmap analysis={analysis} />
 *     </ScrollView>
 *   );
 * };
 */
