import React from 'react';
import { View, Text } from 'react-native';
import { Prediction } from '@/services/analytics/predictor';

interface QuickStatsProps {
  prediction: Prediction | null;
  consistency: number | undefined;
}

/**
 * Componente que muestra números grandes de estadísticas clave
 */
export const QuickStats: React.FC<QuickStatsProps> = ({ prediction, consistency }) => {
  if (!prediction) {
    return (
      <View className="bg-gray-100 rounded-lg p-4 mb-4">
        <Text className="text-gray-600 text-center">Ejecuta un análisis para ver estadísticas</Text>
      </View>
    );
  }

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 border-l-4 border-red-500';
      case 'medium':
        return 'bg-yellow-100 border-l-4 border-yellow-500';
      case 'low':
        return 'bg-green-100 border-l-4 border-green-500';
    }
  };

  return (
    <View className="space-y-3 mb-6">
      {/* Predicción Principal */}
      <View className={`${getRiskColor(prediction.riskAssessment)} rounded-lg p-4`}>
        <Text className="text-gray-600 text-sm mb-1">Próxima Semana</Text>
        <Text className="text-4xl font-bold text-gray-900 mb-2">
          {prediction.hoursLostNextWeek.toFixed(1)} <Text className="text-lg">horas</Text>
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-xs bg-white rounded px-2 py-1 font-semibold">
            {prediction.confidence}% confianza
          </Text>
          <Text className={`text-xs font-semibold ${
            prediction.riskAssessment === 'high' ? 'text-red-600' :
            prediction.riskAssessment === 'medium' ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {prediction.riskAssessment === 'high' ? '⚠️ Alto riesgo' :
             prediction.riskAssessment === 'medium' ? '⏰ Medio riesgo' :
             '✅ Bajo riesgo'}
          </Text>
        </View>
      </View>

      {/* Fila de Stats Secundarios */}
      <View className="flex-row gap-3">
        {/* Consistencia */}
        <View className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200">
          <Text className="text-gray-600 text-xs mb-1">Consistencia</Text>
          <Text className="text-2xl font-bold text-blue-600">
            {consistency || 0}%
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            {(consistency ?? 0) > 80 ? '🎯 Muy predecible' :
             (consistency ?? 0) > 60 ? '📊 Moderado' :
             '🎲 Variable'}
          </Text>
        </View>

        {/* Minutos Totales */}
        <View className="flex-1 bg-purple-50 rounded-lg p-3 border border-purple-200">
          <Text className="text-gray-600 text-xs mb-1">Total Minutos</Text>
          <Text className="text-2xl font-bold text-purple-600">
            {Math.round(prediction.minutesLostNextWeek)}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">esta semana</Text>
        </View>

        {/* Promedio Diario */}
        <View className="flex-1 bg-orange-50 rounded-lg p-3 border border-orange-200">
          <Text className="text-gray-600 text-xs mb-1">Promedio/Día</Text>
          <Text className="text-2xl font-bold text-orange-600">
            {Math.round(prediction.minutesLostNextWeek / 7)}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">minutos</Text>
        </View>
      </View>

      {/* Recomendación Principal */}
      <View className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <Text className="text-indigo-900 text-sm font-semibold mb-2">💡 Recomendación</Text>
        <Text className="text-indigo-800 text-sm leading-5">
          {prediction.recommendation}
        </Text>
      </View>
    </View>
  );
};

/**
 * EJEMPLO DE USO:
 *
 * import { QuickStats } from '@/features/analytics/components/QuickStats';
 * import { useAdvancedAnalytics } from '@/features/analytics/useAdvancedAnalytics';
 *
 * const MyScreen = () => {
 *   const { prediction, analysis } = useAdvancedAnalytics();
 *
 *   return (
 *     <ScrollView>
 *       <QuickStats prediction={prediction} consistency={analysis?.consistency} />
 *     </ScrollView>
 *   );
 * };
 */
