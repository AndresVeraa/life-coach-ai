import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAdvancedAnalytics } from '../useAdvancedAnalytics';
import { useAnalyticsHistory } from '../analytics.store';
import { QuickStats } from '../components/QuickStats';
import { InsightsList } from '../components/InsightsList';
import { TrendChart } from '../components/TrendChart';
import { PatternHeatmap } from '../components/PatternHeatmap';

/**
 * AnalyticsScreen: Dashboard principal de análisis avanzado
 * Muestra todos los insights, patrones y predicciones
 */
export const AnalyticsScreen = () => {
  const {
    loading,
    error,
    analysis,
    prediction,
    insights,
    refreshAnalysis,
  } = useAdvancedAnalytics();

  const { previousPredictions } = useAnalyticsHistory();

  // Refrescar análisis cuando la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      // No refrescamos automáticamente para evitar demasiadas llamadas
      // Usuario puede hacer pull-to-refresh manualmente
    }, [])
  );

  // Manejador de refrescar
  const handleRefresh = async () => {
    await refreshAnalysis();
  };

  // Estado: Cargando
  if (loading && !prediction) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600 text-center px-4">
          Analizando tus patrones...
        </Text>
        <Text className="mt-2 text-sm text-gray-500 text-center px-4">
          Esto puede tomar unos segundos
        </Text>
      </View>
    );
  }

  // Estado: Error
  if (error && !prediction) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-4xl mb-4">❌</Text>
        <Text className="text-lg font-bold text-gray-900 text-center mb-2">
          Error en Análisis
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          {error}
        </Text>
        <TouchableOpacity
          onPress={handleRefresh}
          className="bg-indigo-600 rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">Intentar de Nuevo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Sin datos
  if (!prediction && !analysis) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-4xl mb-4">📊</Text>
        <Text className="text-lg font-bold text-gray-900 text-center mb-2">
          Sin Análisis Disponible
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          Completa al menos 30 días de auditorías para generar análisis detallados.
        </Text>
        <TouchableOpacity
          onPress={handleRefresh}
          className="bg-indigo-600 rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">Generar Análisis</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl 
          refreshing={loading} 
          onRefresh={handleRefresh}
          tintColor="#6366f1"
        />
      }
    >
      {/* Encabezado */}
      <View className="bg-gradient-to-b from-indigo-600 to-indigo-500 px-4 pt-6 pb-8">
        <Text className="text-white text-3xl font-bold mb-2">📊 Análisis</Text>
        <Text className="text-indigo-100">
          Tu productividad a detalle
        </Text>
      </View>

      <View className="px-4 pt-6">
        {/* Alert si hay error en carga */}
        {error && (
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <Text className="text-yellow-800 text-sm">
              ⚠️ {error}
            </Text>
          </View>
        )}

        {/* Quick Stats */}
        {prediction && (
          <QuickStats 
            prediction={prediction} 
            consistency={analysis?.consistency}
          />
        )}

        {/* Insights List */}
        {insights.length > 0 && (
          <InsightsList insights={insights} maxItems={5} />
        )}

        {/* Trend Chart */}
        {previousPredictions.length > 1 && (
          <TrendChart predictions={previousPredictions} maxItems={8} />
        )}

        {/* Pattern Heatmap */}
        {analysis && (
          <PatternHeatmap analysis={analysis} />
        )}

        {/* Recomendaciones Adicionales */}
        {analysis && (
          <View className="bg-purple-50 rounded-lg p-4 border border-purple-200 mb-6">
            <Text className="text-lg font-bold text-purple-900 mb-3">
              💡 Recomendaciones Clave
            </Text>

            {analysis.lowestHour && (
              <View className="mb-3 pb-3 border-b border-purple-200">
                <Text className="text-sm text-purple-800 font-semibold mb-1">
                  ⏰ Mejor Hora para Tareas Importantes
                </Text>
                <Text className="text-sm text-purple-700">
                  {analysis.lowestHour.hour}:00-{analysis.lowestHour.hour + 1}:00
                  {' • '}
                  Solo {Math.round(analysis.lowestHour.avgMinutesLost)} min distracciones
                </Text>
              </View>
            )}

            {analysis.peakHour && (
              <View className="mb-3 pb-3 border-b border-purple-200">
                <Text className="text-sm text-purple-800 font-semibold mb-1">
                  ⚠️ Horas a Evitar
                </Text>
                <Text className="text-sm text-purple-700">
                  {analysis.peakHour.hour}:00-{analysis.peakHour.hour + 1}:00
                  {' • '}
                  {Math.round(analysis.peakHour.avgMinutesLost)} min promedio
                </Text>
              </View>
            )}

            {analysis.worstDay && (
              <View className="mb-3">
                <Text className="text-sm text-purple-800 font-semibold mb-1">
                  📅 Día Débil
                </Text>
                <Text className="text-sm text-purple-700">
                  {analysis.worstDay.dayName}: Prepara breaks extra
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Footer Info */}
        <View className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
          <Text className="text-xs font-semibold text-gray-700 mb-2">
            ℹ️ Información
          </Text>
          <Text className="text-xs text-gray-600 leading-4">
            Los análisis se actualizan automáticamente cada 24 horas basados en tus auditorías.
            Mientras más datos completes, más precisos serán los patrones detectados.
          </Text>
        </View>

        {/* Acciones Rápidas */}
        <View className="flex-row gap-3 mb-8">
          <TouchableOpacity
            onPress={handleRefresh}
            className="flex-1 bg-indigo-600 rounded-lg py-3 items-center"
          >
            <Text className="text-white font-semibold">
              {loading ? '🔄 Actualizando...' : '🔄 Actualizar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white border border-gray-300 rounded-lg py-3 items-center"
          >
            <Text className="text-gray-700 font-semibold">
              📱 Compartir
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

/**
 * INTEGRACIÓN EN NAVEGACIÓN:
 *
 * En AppNavigator.tsx, agregar tab:
 *
 * <Tab.Screen
 *   name="Analytics"
 *   component={AnalyticsScreen}
 *   options={{
 *     tabBarIcon: ({ color, size }) => (
 *       <Ionicons name="stats-chart" color={color} size={size} />
 *     ),
 *     title: "Análisis",
 *   }}
 * />
 */
