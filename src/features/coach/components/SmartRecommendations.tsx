/**
 * SmartRecommendations
 * 
 * Muestra acciones inteligentes basadas en análisis de patrones
 * - Top 3 recomendaciones del coach
 * - Colores por urgencia
 * - Iconos contextuales
 */

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Zap } from 'lucide-react-native';

interface SmartRecommendationsProps {
  recommendations: string[];
  onRecommendationPress?: (recommendation: string, index: number) => void;
}

const getIconAndColor = (
  text: string
): { icon: string; bgColor: string; textColor: string; borderColor: string } => {
  // 🎯 Target/Action items
  if (text.includes('🎯') || text.includes('Bloquea') || text.includes('bloques')) {
    return {
      icon: '🎯',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-l-red-500',
    };
  }
  // ⏰ Timing/Schedule items
  if (text.includes('⏰') || text.includes('Programa') || text.includes('hora')) {
    return {
      icon: '⏰',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-l-blue-500',
    };
  }
  // 📅 Daily/Weekly items
  if (text.includes('📅') || text.includes('día') || text.includes('débil')) {
    return {
      icon: '📅',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-l-yellow-500',
    };
  }
  // ⚠️ Warning/Alert items
  if (text.includes('⚠️') || text.includes('riesgosa')) {
    return {
      icon: '⚠️',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-l-orange-500',
    };
  }
  // Default lightbulb
  return {
    icon: '💡',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-l-indigo-500',
  };
};

/**
 * Extrae el emoji del inicio del texto
 */
const extractEmoji = (text: string): { emoji: string; cleanText: string } => {
  const emojiMatch = text.match(/^([\p{Emoji}])\s*/u);
  if (emojiMatch) {
    return {
      emoji: emojiMatch[1],
      cleanText: text.substring(emojiMatch[0].length),
    };
  }
  return { emoji: '💡', cleanText: text };
};

/**
 * Tarjeta de recomendación individual
 */
const RecommendationCard = ({
  recommendation,
  index,
  onPress,
}: {
  recommendation: string;
  index: number;
  onPress?: (rec: string, idx: number) => void;
}) => {
  const { emoji, cleanText } = extractEmoji(recommendation);
  const { bgColor, textColor, borderColor } = getIconAndColor(recommendation);

  return (
    <Pressable
      onPress={() => onPress?.(recommendation, index)}
      className={`mr-3 flex-shrink-0 w-56 ${bgColor} border-l-4 ${borderColor} rounded-lg p-3 active:opacity-70`}
    >
      <View className="flex-row items-start">
        <Text className="text-lg mr-2">{emoji}</Text>
        <View className="flex-1 mr-2">
          <Text className={`${textColor} font-semibold text-sm leading-5`}>
            {cleanText}
          </Text>
        </View>
        <Text className="text-gray-400 font-bold text-lg">›</Text>
      </View>
    </Pressable>
  );
};

export const SmartRecommendations = ({
  recommendations,
  onRecommendationPress,
}: SmartRecommendationsProps) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <View className="mb-4">
      {/* Encabezado */}
      <View className="px-4 mb-3 flex-row items-center">
        <Zap size={18} color="#6366f1" strokeWidth={2.5} />
        <Text className="text-gray-900 font-bold text-base ml-2">
          Acciones Inteligentes
        </Text>
        <View className="ml-auto bg-indigo-100 rounded-full px-2 py-1">
          <Text className="text-indigo-700 font-semibold text-xs">
            {recommendations.length}
          </Text>
        </View>
      </View>

      {/* Cards horizontales scrollable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        scrollEventThrottle={16}
      >
        {recommendations.slice(0, 5).map((rec, idx) => (
          <RecommendationCard
            key={`rec-${idx}`}
            recommendation={rec}
            index={idx}
            onPress={onRecommendationPress}
          />
        ))}
      </ScrollView>

      {/* Separador */}
      <View className="mt-4 px-4 h-px bg-gray-100" />
    </View>
  );
};
