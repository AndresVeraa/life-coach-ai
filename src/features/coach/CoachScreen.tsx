import React, { useEffect, useCallback } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { ScreenWrapper } from '@/shared/ui/ScreenWrapper';
import { useEnrichedCoachAI } from './hooks/useEnrichedCoachAI';
import { CoachMessage } from './components/CoachMessage';
import { CoachInput } from './components/CoachInput';
import { SmartRecommendations } from './components/SmartRecommendations';
import { CoachAnalyticsHeader } from './components/CoachAnalyticsHeader';
import { HoursAlert } from './components/HoursAlert';
import { useCoachStore } from './coach.store';

export const CoachScreen = () => {
  // Usar enriched coach con analytics
  const {
    sendEnrichedMessage,
    startConversation,
    messages,
    getSmartRecommendations,
    suggestBestTimeForImportantTask,
    getHoursToAvoid,
    analysis,
    prediction,
  } = useEnrichedCoachAI();

  const { isLoading } = useCoachStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [dismissedAlert, setDismissedAlert] = React.useState(false);

  useEffect(() => {
    startConversation();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Obtener datos para widgets
  const smartRecs = getSmartRecommendations();
  const { hours: bestTimeHours, reason: bestTimeReason } = suggestBestTimeForImportantTask();
  const { hours: hoursToAvoid, reason: hoursToAvoidReason } = getHoursToAvoid();

  // Determinar tendencia para header
  const getTrendDirection = (): 'improving' | 'stable' | 'worsening' => {
    if (!prediction) return 'stable';
    if (prediction.riskAssessment === 'low') return 'improving';
    if (prediction.riskAssessment === 'high') return 'worsening';
    return 'stable';
  };

  // Handler cuando usuario presiona una recomendación
  const handleRecommendationPress = useCallback((rec: string, idx: number) => {
    // Enviar mensaje enriquecido preguntando sobre la recomendación
    const message = `¿Cómo puedo ${rec.toLowerCase().replace(/🎯|⏰|📅|⚠️/g, '').trim()}?`;
    sendEnrichedMessage(message);
  }, [sendEnrichedMessage]);

  return (
    <ScreenWrapper className="flex-1">
      {messages.length === 0 ? (
        // Empty state - con analytics info
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">🤖</Text>
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            Bienvenido a tu Coach IA
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            Aquí recibirás coaching personalizado basado en tu productividad, sueño y patrones.
          </Text>

          {/* Mostrar algunas recomendaciones iniciales */}
          {smartRecs.length > 0 && (
            <View className="w-full bg-indigo-50 rounded-lg p-4 mb-6">
              <Text className="font-bold text-gray-900 mb-2 text-sm">
                Recomendaciones iniciales:
              </Text>
              {smartRecs.slice(0, 3).map((rec, idx) => (
                <Text key={idx} className="text-gray-700 text-xs mb-2">
                  {rec}
                </Text>
              ))}
            </View>
          )}

          <Text
            onPress={() => startConversation()}
            className="text-indigo-600 font-semibold text-center"
          >
            Toca para comenzar
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 12 }}
        >
          {/* Analytics Header - mejores/peores horas */}
          <CoachAnalyticsHeader
            bestTimeHours={bestTimeHours}
            bestTimeReason={bestTimeReason}
            hoursToAvoid={hoursToAvoid}
            hoursToAvoidReason={hoursToAvoidReason}
            worstDay={analysis?.worstDay?.dayName}
            trendDirection={getTrendDirection()}
          />

          {/* Alert contextual - si es hora crítica o golden hour */}
          {!dismissedAlert && (
            <HoursAlert
              peakHour={analysis?.peakHour?.hour}
              lowestHour={analysis?.lowestHour?.hour}
              peakMinutesLost={analysis?.peakHour?.avgMinutesLost}
              lowestMinutesLost={analysis?.lowestHour?.avgMinutesLost}
              onDismiss={() => setDismissedAlert(true)}
            />
          )}

          {/* Smart Recommendations - acciones inteligentes */}
          <SmartRecommendations
            recommendations={smartRecs}
            onRecommendationPress={handleRecommendationPress}
          />

          {/* Chat messages */}
          {messages.map((msg) => (
            <CoachMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
            />
          ))}

          {isLoading && (
            <View className="mb-4 items-start">
              <View className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-2">
                <Text className="text-base text-gray-600">Escribiendo...</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <CoachInput
        onSend={sendEnrichedMessage}
        isLoading={isLoading}
      />
    </ScreenWrapper>
  );
};
