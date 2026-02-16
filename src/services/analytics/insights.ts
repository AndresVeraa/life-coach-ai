import { PatternAnalysis } from './patternAnalyzer';
import { Prediction } from './predictor';

/**
 * Un insight accionable para compartir con el usuario
 */
export interface Insight {
  id: string; // unique identifier
  title: string; // Ej: "Tu hora crítica"
  description: string; // Explicación detallada
  actionable: boolean; // ¿Hay algo que hacer?
  suggestedAction?: string; // Ej: "Bloquea Instagram 10-11am"
  impact: 'low' | 'medium' | 'high'; // Cuán importante es
  category: 'pattern' | 'prediction' | 'correlation' | 'opportunity' | 'warning';
  priority: number; // 1-10 (más alto = más urgente)
}

/**
 * Insights Generator: Convertir análisis en insights accionables
 */
export const insightsGenerator = {
  /**
   * Generar todos los insights relevantes
   */
  generateAllInsights: (analysis: PatternAnalysis, prediction: Prediction): Insight[] => {
    const insights: Insight[] = [];

    // === PATRONES HORARIOS ===
    if (analysis.peakHour) {
      insights.push(insightsGenerator.createPeakHourInsight(analysis.peakHour));
    }

    if (analysis.lowestHour) {
      insights.push(insightsGenerator.createBestHourInsight(analysis.lowestHour));
    }

    // === PATRONES SEMANALES ===
    if (analysis.worstDay) {
      insights.push(insightsGenerator.createWorstDayInsight(analysis.worstDay));
    }

    if (analysis.bestDay) {
      insights.push(insightsGenerator.createBestDayInsight(analysis.bestDay));
    }

    // === CORRELACIONES ===
    analysis.correlations.forEach((corr) => {
      insights.push(insightsGenerator.createCorrelationInsight(corr));
    });

    // === PREDICCIONES ===
    insights.push(insightsGenerator.createPredictionInsight(prediction));

    // === OPORTUNIDADES ===
    const opportunities = insightsGenerator.findImprovementOpportunities(analysis, prediction);
    insights.push(...opportunities);

    // === CONSISTENCIA ===
    insights.push(insightsGenerator.createConsistencyInsight(analysis.consistency));

    // Ordenar por prioridad y retornar top 5
    return insights.sort((a, b) => b.priority - a.priority).slice(0, 5);
  },

  /**
   * Insight: Tu hora crítica
   */
  createPeakHourInsight: (peakHour: any): Insight => {
    const hour = peakHour.hour;
    const minutes = peakHour.avgMinutesLost;
    const timeString = `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`;

    return {
      id: `peak-hour-${hour}`,
      title: `⚠️ Tu hora crítica: ${timeString}`,
      description: `Pierdes un promedio de ${minutes} minutos durante esta hora. Es tu momento más vulnerable para distracciones.`,
      actionable: true,
      suggestedAction: `Establece un bloqueo de apps o una sesión de "Deep Work" de ${hour}:00 a ${hour + 1}:00.`,
      impact: 'high',
      category: 'pattern',
      priority: 10,
    };
  },

  /**
   * Insight: Tu mejor hora
   */
  createBestHourInsight: (bestHour: any): Insight => {
    const hour = bestHour.hour;
    const minutes = bestHour.avgMinutesLost;
    const timeString = `${String(hour).padStart(2, '0')}:00`;

    return {
      id: `best-hour-${hour}`,
      title: `✅ Tu golden hour: ${timeString}`,
      description: `Eres más productivo alrededor de las ${timeString} (solo ${minutes} minutos de distracciones).`,
      actionable: true,
      suggestedAction: `Reserva tus tareas más importantes para esta hora.`,
      impact: 'high',
      category: 'opportunity',
      priority: 9,
    };
  },

  /**
   * Insight: Tu peor día
   */
  createWorstDayInsight: (worstDay: any): Insight => {
    return {
      id: `worst-day-${worstDay.dayOfWeek}`,
      title: `📉 Tu día débil: ${worstDay.dayName}`,
      description: `Pierdes en promedio ${worstDay.avgMinutesLost} minutos los ${worstDay.dayName}s. Es tu día menos productivo.`,
      actionable: true,
      suggestedAction: `Planifica tu ${worstDay.dayName} con tareas menos demandantes o agrega más breaks.`,
      impact: 'medium',
      category: 'pattern',
      priority: 7,
    };
  },

  /**
   * Insight: Tu mejor día
   */
  createBestDayInsight: (bestDay: any): Insight => {
    return {
      id: `best-day-${bestDay.dayOfWeek}`,
      title: `🚀 Tu mejor día: ${bestDay.dayName}`,
      description: `Completas un promedio de ${bestDay.avgTasksCompleted} tareas los ${bestDay.dayName}s. ¡Notable!`,
      actionable: true,
      suggestedAction: `Analiza qué haces diferente los ${bestDay.dayName}s y replica ese patrón otros días.`,
      impact: 'medium',
      category: 'opportunity',
      priority: 6,
    };
  },

  /**
   * Insight: Correlaciones detectadas
   */
  createCorrelationInsight: (correlation: any): Insight => {
    return {
      id: `correlation-${correlation.variable1}-${correlation.variable2}`,
      title: `🔗 Conexión detectada: ${correlation.variable1} ↔ ${correlation.variable2}`,
      description: correlation.interpretation,
      actionable: correlation.interpretation.includes('Prioriza') || correlation.interpretation.includes('Considera'),
      suggestedAction: correlation.interpretation,
      impact: correlation.strength === 'strong' ? 'high' : 'medium',
      category: 'correlation',
      priority: correlation.strength === 'strong' ? 8 : 5,
    };
  },

  /**
   * Insight: Predicción para próxima semana
   */
  createPredictionInsight: (prediction: Prediction): Insight => {
    const hours = prediction.hoursLostNextWeek;
    const emoji = prediction.riskAssessment === 'high' ? '⚠️' : prediction.riskAssessment === 'medium' ? '⏰' : '✅';

    return {
      id: 'next-week-prediction',
      title: `${emoji} Próxima semana: ${hours}h de distracciones`,
      description: `Basado en tus patrones, perderás aproximadamente ${hours} horas. Confianza: ${prediction.confidence}%.`,
      actionable: prediction.riskAssessment !== 'low',
      suggestedAction: prediction.recommendation,
      impact: prediction.riskAssessment === 'high' ? 'high' : 'medium',
      category: 'prediction',
      priority: prediction.riskAssessment === 'high' ? 9 : 6,
    };
  },

  /**
   * Insight: Consistencia
   */
  createConsistencyInsight: (consistency: number): Insight => {
    const status =
      consistency > 80
        ? 'Muy consistente - tus patrones son predecibles'
        : consistency > 60
          ? 'Moderadamente consistente'
          : 'Variable - tus patrones cambian mucho';

    const emoji = consistency > 80 ? '🎯' : consistency > 60 ? '📊' : '🎲';

    return {
      id: 'consistency',
      title: `${emoji} Consistencia: ${consistency}%`,
      description: `${status}. Esto afecta qué tan exactas pueden ser las predicciones.`,
      actionable: consistency < 60,
      suggestedAction:
        consistency < 60 ? 'Intenta mantener rutinas más consistentes para mejores insights.' : undefined,
      impact: 'low',
      category: 'pattern',
      priority: 3,
    };
  },

  /**
   * Encontrar oportunidades de mejora
   */
  findImprovementOpportunities: (analysis: PatternAnalysis, prediction: Prediction): Insight[] => {
    const opportunities: Insight[] = [];

    // Oportunidad 1: Mejorar hora crítica
    if (analysis.peakHour && analysis.peakHour.avgMinutesLost > 40) {
      const saveable = analysis.peakHour.avgMinutesLost * 0.5; // Podría ahorrar 50%
      opportunities.push({
        id: 'opportunity-peak-hour',
        title: `💡 Opportunity: Optimiza tu hora crítica`,
        description: `Si reduces distracciones ${analysis.peakHour.hour}:00-${analysis.peakHour.hour + 1}:00 en 50%, podrías ahorrar ~${Math.round(saveable * 5)} minutos/semana.`,
        actionable: true,
        suggestedAction: `Usa "Focus Mode" de 10am-11am: silencia notificaciones, cierra redes sociales.`,
        impact: 'high',
        category: 'opportunity',
        priority: 8,
      });
    }

    // Oportunidad 2: Alavanca tu mejor hora
    if (analysis.lowestHour && analysis.peakHour && analysis.lowestHour.avgMinutesLost < 10) {
      const diff = (analysis.peakHour?.avgMinutesLost ?? 0) - analysis.lowestHour.avgMinutesLost;
      opportunities.push({
        id: 'opportunity-use-best-time',
        title: `🎯 Alavanca tu mejor hora`,
        description: `Tu diferencia pico-valle es de ${Math.round(diff)} minutos. Programa tareas importante durante tu golden hour.`,
        actionable: true,
        suggestedAction: `Bloquea ${analysis.lowestHour.hour}:00 en tu calendario para "Deep Work".`,
        impact: 'medium',
        category: 'opportunity',
        priority: 7,
      });
    }

    // Oportunidad 3: Break consistencia
    // (si es muy variable, sugerir rutinas)

    return opportunities;
  },

  /**
   * Obtener insight principal (más relevante)
   */
  getTopInsight: (insights: Insight[]): Insight | null => {
    return insights.length > 0 ? insights[0] : null;
  },

  /**
   * Formatear insight para mostrar en UI
   */
  formatForDisplay: (insight: Insight): string => {
    return `${insight.title}\n\n${insight.description}${insight.suggestedAction ? `\n\n→ ${insight.suggestedAction}` : ''}`;
  },

  /**
   * Generar contexto enriquecido para Coach IA
   */
  generateCoachContext: (insights: Insight[]): string => {
    const topInsights = insights.slice(0, 3);
    const context = topInsights
      .map((i) => `- ${i.title}: ${i.description}`)
      .join('\n');

    return `Basado en análisis reciente:\n${context}`;
  },
};

/**
 * EJEMPLO DE USO:
 *
 * import { insightsGenerator } from '@/services/analytics/insights';
 *
 * const insights = insightsGenerator.generateAllInsights(analysis, prediction);
 *
 * insights.forEach((insight) => {
 *   console.log(insight.title);
 *   console.log(`Prioridad: ${insight.priority}`);
 *   if (insight.suggestedAction) {
 *     console.log(`→ ${insight.suggestedAction}`);
 *   }
 * });
 *
 * // Usar en Coach IA
 * const coachContext = insightsGenerator.generateCoachContext(insights);
 * // → Incluir en prompt de Coach IA para contexto mejorado
 */
