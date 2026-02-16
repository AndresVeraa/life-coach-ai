/**
 * PASO 5.2 → PASO 5.4: Coach IA Integration with Analytics
 *
 * Este archivo muestra cómo integrar los insights analytics
 * en el sistema Coach IA para coaching más inteligente
 */

import { useCallback, useMemo } from 'react';
import { useAdvancedAnalytics } from '@/features/analytics/useAdvancedAnalytics';
import { insightsGenerator } from '@/services/analytics/insights';
import { useCoachAI } from '@/features/coach/hooks/useCoachAI';
import { useAnalyticsHistory } from '@/features/analytics/analytics.store';

/**
 * Hook mejorado que combina Coach IA + Analytics
 *
 * ANTES: Coach IA solo veía tareas + métricas globales
 * AHORA: Coach IA ve patrones horarios/semanales + predicciones
 */
export const useEnrichedCoachAI = () => {
  // Obtener análisis analytics
  const { analysis, prediction, insights } = useAdvancedAnalytics();
  const { trend: predictionTrend } = useAnalyticsHistory();

  // Obtener Coach IA existente
  const { sendMessage, startConversation, enrichedUserStats, messages } = useCoachAI();

  /**
   * Generar bloque de insights para enriquecer prompts
   */
  const analyticsContextBlock = useMemo(() => {
    const blocks: string[] = [];

    // Avisos específicos
    if (analysis?.peakHour && analysis.peakHour.avgMinutesLost > 40) {
      blocks.push(
        `⚠️ Hora crítica detectada: ${analysis.peakHour.hour}:00-${analysis.peakHour.hour + 1}:00 (${Math.round(analysis.peakHour.avgMinutesLost)} min promedio de distracción)`
      );
    }

    if (analysis?.lowestHour && analysis.lowestHour.avgMinutesLost < 10) {
      blocks.push(
        `✅ Tu golden hour: ${analysis.lowestHour.hour}:00-${analysis.lowestHour.hour + 1}:00 (${Math.round(analysis.lowestHour.avgMinutesLost)} min - mejor hora para tareas importantes)`
      );
    }

    if (analysis?.worstDay) {
      blocks.push(
        `📉 Tu día débil: ${analysis.worstDay.dayName} (${Math.round(analysis.worstDay.avgMinutesLost)} min promedio - considera agrega más breaks)`
      );
    }

    if (prediction) {
      const riskEmoji =
        prediction.riskAssessment === 'high' ? '⚠️' : prediction.riskAssessment === 'medium' ? '⏰' : '✅';
      blocks.push(
        `${riskEmoji} Predicción próxima semana: ${prediction.hoursLostNextWeek}h de distracciones (confianza: ${prediction.confidence}%)`
      );
    }

    // Trend
    if (predictionTrend && Math.abs(predictionTrend) > 0) {
      if (predictionTrend > 10) {
        blocks.push(`📈 Tendencia: Empeorando (+${Math.round(predictionTrend)}%)`);
      } else if (predictionTrend < -10) {
        blocks.push(`📉 Tendencia: Mejorando (${Math.round(predictionTrend)}%)`);
      } else {
        blocks.push(`➡️ Tendencia: Estable`);
      }
    }

    if (analysis && analysis.consistency !== undefined) {
      if (analysis.consistency < 60) {
        blocks.push(
          `🎲 Patrón variable (${analysis.consistency}%): Intenta mantener rutinas más consistentes para mejor precisión`
        );
      }
    }

    return blocks.length > 0 ? `[PATRONES DETECTADOS]\n${blocks.join('\n')}` : '';
  }, [analysis, prediction, predictionTrend]);

  /**
   * Enviar mensaje enriquecido al Coach
   */
  const sendEnrichedMessage = useCallback(
    (userMessage: string) => {
      // Si el mensaje pide análisis, incluir contexto analytics
      if (
        userMessage.toLowerCase().includes('análisis') ||
        userMessage.toLowerCase().includes('patrones') ||
        userMessage.toLowerCase().includes('distracciones') ||
        userMessage.toLowerCase().includes('productividad')
      ) {
        const enrichedMessage =
          `${userMessage}\n\n${analyticsContextBlock}`.trim();
        sendMessage(enrichedMessage);
      } else {
        // Sino, enviar con analytics de forma sutil al fondo
        const messageWithContext =
          analyticsContextBlock.length > 0
            ? `${userMessage}\n\n[Contexto disponible: ${analyticsContextBlock.split('\n')[0]}...]`
            : userMessage;
        sendMessage(messageWithContext);
      }
    },
    [sendMessage, analyticsContextBlock]
  );

  /**
   * Recomendaciones inteligentes basadas en análisis
   */
  const getSmartRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];

    if (analysis?.peakHour && analysis.peakHour.avgMinutesLost > 40) {
      recommendations.push(
        `🎯 Bloquea distracciones ${analysis.peakHour.hour}:00-${analysis.peakHour.hour + 1}:00 (pierdes ${Math.round(analysis.peakHour.avgMinutesLost)} min)`
      );
    }

    if (analysis?.lowestHour && analysis.lowestHour.avgMinutesLost < 10) {
      recommendations.push(
        `⏰ Programa tareas importantes ${analysis.lowestHour.hour}:00-${analysis.lowestHour.hour + 1}:00`
      );
    }

    if (analysis?.worstDay) {
      recommendations.push(
        `📅 ${analysis.worstDay.dayName} es difícil - prepara más breaks`
      );
    }

    if (prediction && prediction.riskAssessment === 'high') {
      recommendations.push(`⚠️ Próxima semana riesgosa - sé proactivo hoy`);
    }

    return recommendations;
  }, [analysis, prediction]);

  /**
   * Sugerencias para tareas importantes
   */
  const suggestBestTimeForImportantTask = useCallback(
    (): { hours: number[]; reason: string } => {
      if (!analysis?.lowestHour) {
        return {
          hours: [9, 10, 14],
          reason: 'Horas mañaneras sugeridas (sin análisis personalizado)',
        };
      }

      const bestHours = [
        analysis.lowestHour.hour,
        analysis.lowestHour.hour + 1,
        analysis.lowestHour.hour > 2 ? analysis.lowestHour.hour - 1 : analysis.lowestHour.hour + 2,
      ].slice(0, 3);

      return {
        hours: bestHours,
        reason: `Basado en tu patrón: ${bestHours.map((h) => `${h}:00`).join(', ')}`,
      };
    },
    [analysis?.lowestHour]
  );

  /**
   * Horas a evitar
   */
  const getHoursToAvoid = useCallback((): { hours: number[]; reason: string } => {
    if (!analysis?.peakHour) {
      return {
        hours: [],
        reason: 'Sin horas críticas identificadas',
      };
    }

    const badHours = [
      analysis.peakHour.hour,
      (analysis.peakHour.hour + 1) % 24,
      (analysis.peakHour.hour - 1 + 24) % 24,
    ].slice(0, 2);

    return {
      hours: badHours,
      reason: `Tus horas críticas según análisis`,
    };
  }, [analysis?.peakHour]);

  return {
    // Métodos existentes del Coach
    sendMessage,
    startConversation,
    enrichedUserStats,
    messages,

    // Métodos nuevos con analytics
    sendEnrichedMessage,
    analyticsContextBlock,
    getSmartRecommendations,
    suggestBestTimeForImportantTask,
    getHoursToAvoid,

    // Estado analytics
    analysis,
    prediction,
    insights,
    predictionTrend,
  };
};


/**
 * EJEMPLOS DE USO
 *
 * 1. En CoachScreen - Enviar mensaje enriquecido
 *    const { sendEnrichedMessage, analyticsContextBlock } = useEnrichedCoachAI();
 *    const handleUserMessage = (msg: string) => {
 *      sendEnrichedMessage(msg); // Auto-detecta si necesita contexto analytics
 *    };
 *
 * 2. Para sugerencias inteligentes
 *    const { getSmartRecommendations } = useEnrichedCoachAI();
 *    const recommendations = getSmartRecommendations();
 *    // Mostrar como "Quick fixes" al usuario
 *
 * 3. Para planificar tareas
 *    const { suggestBestTimeForImportantTask } = useEnrichedCoachAI();
 *    const { hours, reason } = suggestBestTimeForImportantTask();
 *    // "Haz tu tarea importante a las 4pm-5pm"
 *    // "Razón: Basado en tu patrón"
 *
 * 4. Coach sugiere evitar horas específicas
 *    const { getHoursToAvoid } = useEnrichedCoachAI();
 *    const { hours: badHours, reason } = getHoursToAvoid();
 *    // "Evita reuniones 10-11am (tu hora crítica)"
 *
 * 5. Ver contexto análisis disponible
 *    const { analyticsContextBlock } = useEnrichedCoachAI();
 *    console.log(analyticsContextBlock);
 *    // [PATRONES DETECTADOS]
 *    // ⚠️ Hora crítica: 10:00-11:00...
 *    // ✅ Tu golden hour: 16:00-17:00...
 *    // 📉 Tu día débil: Friday...
 */

