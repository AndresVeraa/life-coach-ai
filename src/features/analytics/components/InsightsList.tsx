import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Insight } from '@/services/analytics/insights';

interface InsightsListProps {
  insights: Insight[];
  onInsightPress?: (insight: Insight) => void;
  maxItems?: number;
}

/**
 * Componente que muestra insights en tarjetas prioritizadas
 */
export const InsightsList: React.FC<InsightsListProps> = ({ 
  insights, 
  onInsightPress,
  maxItems = 5 
}) => {
  if (insights.length === 0) {
    return (
      <View className="bg-gray-50 rounded-lg p-4 mb-4">
        <Text className="text-gray-600 text-center text-sm">
          Sin insights aún. Completa más auditorías para obtener análisis.
        </Text>
      </View>
    );
  }

  const displayedInsights = insights.slice(0, maxItems);

  const getCategoryEmoji = (category: Insight['category']) => {
    const emojiMap: Record<Insight['category'], string> = {
      'pattern': '🔄',
      'prediction': '🔮',
      'correlation': '🔗',
      'opportunity': '💡',
      'warning': '⚠️',
    };
    return emojiMap[category] || '📊';
  };

  const getImpactColor = (impact: Insight['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'medium':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'low':
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  const getPriorityBadgeColor = (priority: number) => {
    if (priority >= 9) return 'bg-red-100 text-red-700';
    if (priority >= 7) return 'bg-orange-100 text-orange-700';
    if (priority >= 5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-bold text-gray-900">
          ✨ Insights ({displayedInsights.length})
        </Text>
        {insights.length > maxItems && (
          <Text className="text-xs text-gray-500">+{insights.length - maxItems} más</Text>
        )}
      </View>

      <View className="space-y-2">
        {displayedInsights.map((insight) => (
          <TouchableOpacity
            key={insight.id}
            onPress={() => onInsightPress?.(insight)}
            activeOpacity={0.7}
          >
            <View className={`${getImpactColor(insight.impact)} rounded-lg p-4`}>
              {/* Encabezado */}
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-900 font-semibold text-sm leading-5">
                    {getId(insight.id)}{insight.title}
                  </Text>
                </View>
                <View className={`${getPriorityBadgeColor(insight.priority)} rounded px-2 py-1`}>
                  <Text className="text-xs font-bold">
                    P{insight.priority}
                  </Text>
                </View>
              </View>

              {/* Descripción */}
              <Text className="text-gray-700 text-xs mb-3 leading-4">
                {insight.description}
              </Text>

              {/* Acción Sugerida */}
              {insight.suggestedAction && insight.actionable && (
                <View className="bg-white bg-opacity-60 rounded p-3">
                  <Text className="text-gray-600 text-xs mb-1 font-semibold">
                    💬 Acción sugerida:
                  </Text>
                  <Text className="text-gray-700 text-xs leading-4">
                    {insight.suggestedAction}
                  </Text>
                </View>
              )}

              {/* Category Badge */}
              <View className="flex-row items-center gap-2 mt-3">
                <Text className="text-xs text-gray-500 bg-white bg-opacity-40 rounded px-2 py-1">
                  {getCategoryEmoji(insight.category)} {formatCategory(insight.category)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

/**
 * Utilidades
 */
function getId(insightId: string): string {
  const idMap: Record<string, string> = {
    'peak-hour-10': '⚠️ ',
    'best-hour-16': '✅ ',
    'worst-day': '📉 ',
    'best-day': '🚀 ',
    'correlation': '🔗 ',
    'next-week-prediction': '⏰ ',
    'opportunity': '💡 ',
    'consistency': '🎯 ',
  };

  for (const [key, emoji] of Object.entries(idMap)) {
    if (insightId.includes(key)) return emoji;
  }
  return '📊 ';
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    'pattern': 'Patrón',
    'prediction': 'Predicción',
    'correlation': 'Correlación',
    'opportunity': 'Oportunidad',
    'warning': 'Alerta',
  };
  return map[category] || 'Insight';
}

/**
 * EJEMPLO DE USO:
 *
 * import { InsightsList } from '@/features/analytics/components/InsightsList';
 * import { useAdvancedAnalytics } from '@/features/analytics/useAdvancedAnalytics';
 *
 * const MyScreen = () => {
 *   const { insights } = useAdvancedAnalytics();
 *
 *   const handleInsightPress = (insight: Insight) => {
 *     // Hacer algo con el insight
 *     console.log('Insight pressed:', insight.title);
 *   };
 *
 *   return (
 *     <ScrollView>
 *       <InsightsList 
 *         insights={insights}
 *         onInsightPress={handleInsightPress}
 *         maxItems={5}
 *       />
 *     </ScrollView>
 *   );
 * };
 */
