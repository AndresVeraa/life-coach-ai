import { PatternAnalysis } from './patternAnalyzer';

/**
 * Predicción de tiempo perdido en la semana siguiente
 */
export interface Prediction {
  minutesLostNextWeek: number;
  hoursLostNextWeek: number;
  confidence: number; // 0-100 (qué tan seguro estamos)
  contributingFactors: string[];
  riskAssessment: 'low' | 'medium' | 'high';
  recommendation: string;
}

/**
 * Predictor: Hacer predicciones basadas en patrones históricos
 */
export const predictor = {
  /**
   * Predecir minutos que perderás la próxima semana
   */
  predictNextWeekMinutesLost: (analysis: PatternAnalysis): Prediction => {
    let totalMinutes = 0;
    let dataPointsUsed = 0;
    const factors: string[] = [];

    // Usar patrones por día para predecir
    analysis.dayPatterns.forEach((dayPattern) => {
      totalMinutes += dayPattern.avgMinutesLost;
      dataPointsUsed += 1;

      if (dayPattern.avgMinutesLost > 50) {
        factors.push(`${dayPattern.dayName}: ${dayPattern.avgMinutesLost}min promedio (Alto riesgo)`);
      }
    });

    // Ajustar por consistencia (si es muy inconsistente, baja confianza)
    const confidence = Math.max(50, Math.min(95, analysis.consistency + 15));

    // Multiplicar por número de horas activas (asumir 14 horas activas por día)
    const predictedMinutes = totalMinutes * 1.1; // +10% buffer

    const riskLevel =
      predictedMinutes > 420 ? 'high' : predictedMinutes > 210 ? 'medium' : 'low';

    // Agregar factores de riesgo adicionales
    if (analysis.peakHour && analysis.peakHour.riskLevel === 'high') {
      factors.push(`Hora crítica: ${analysis.peakHour.hour}:00 (${analysis.peakHour.avgMinutesLost}min)`);
    }

    if (analysis.worstDay) {
      factors.push(`Día débil: ${analysis.worstDay.dayName}`);
    }

    // Generar recomendación
    let recommendation = '';
    if (riskLevel === 'high') {
      recommendation =
        'Tu velocidad de distracciones es preocupante. Considera bloquear apps durante horas pico.';
    } else if (riskLevel === 'medium') {
      recommendation = 'Tus patrones muestran oportunidades de mejora. Enfócate en las horas críticas.';
    } else {
      recommendation = '¡Excelente! Tu ritmo es saludable. Mantén tus buenas prácticas.';
    }

    return {
      minutesLostNextWeek: Math.round(predictedMinutes * 10) / 10,
      hoursLostNextWeek: Math.round((predictedMinutes / 60) * 10) / 10,
      confidence,
      contributingFactors: factors,
      riskAssessment: riskLevel,
      recommendation,
    };
  },

  /**
   * Predecir basado en hora específica
   * ¿Cuántos minutos perderé en la próxima sesión de 10-11am?
   */
  predictHourMinutesLost: (hour: number, analysis: PatternAnalysis): number => {
    const hourPattern = analysis.hourPatterns.find((p) => p.hour === hour);

    if (!hourPattern || hourPattern.dataPoints === 0) {
      return 0; // Sin dato para esa hora
    }

    // Retornar promedio + 20% (la gente tiende a ser pesimista en predicciones)
    return Math.round((hourPattern.avgMinutesLost * 1.2) * 10) / 10;
  },

  /**
   * Predecir tendencia (mejorando o empeorando)
   */
  calculateTrend: (predictions: Prediction[]): 'improving' | 'stable' | 'worsening' => {
    if (predictions.length < 2) return 'stable';

    const recent = predictions[predictions.length - 1].minutesLostNextWeek;
    const previous = predictions[predictions.length - 2].minutesLostNextWeek;

    const diff = recent - previous;
    const percentChange = (diff / previous) * 100;

    if (percentChange < -10) return 'improving';
    if (percentChange > 10) return 'worsening';
    return 'stable';
  },

  /**
   * Score de riesgo (0-100)
   * Cuán probable es que pierdas >7 horas la próxima semana
   */
  calculateRiskScore: (prediction: Prediction): number => {
    const baseScore = (prediction.hoursLostNextWeek / 14) * 100; // %
    const confidenceBoost = prediction.confidence / 100; // 0.5-0.95

    return Math.round(baseScore * confidenceBoost * 100) / 100;
  },

  /**
   * Cuando es el peor momento para empezar una tarea importante
   */
  getWorstTimeSlots: (analysis: PatternAnalysis, count: number = 3): number[] => {
    return analysis.hourPatterns
      .sort((a, b) => b.avgMinutesLost - a.avgMinutesLost)
      .slice(0, count)
      .map((p) => p.hour)
      .sort((a, b) => a - b);
  },

  /**
   * Mejor momento para empezar tarea importante (lowest distractions)
   */
  getBestTimeSlots: (analysis: PatternAnalysis, count: number = 3): number[] => {
    return analysis.hourPatterns
      .sort((a, b) => a.avgMinutesLost - b.avgMinutesLost)
      .slice(0, count)
      .map((p) => p.hour)
      .sort((a, b) => a - b);
  },

  /**
   * Calcular mejora necesaria (qué usar para llegar a meta de 3h/semana)
   */
  calculateRequiredImprovement: (
    prediction: Prediction,
    targetHoursPerWeek: number = 3
  ): { percentageReduction: number; minutesNeedToSave: number } => {
    const targetMinutes = targetHoursPerWeek * 60;
    const currentMinutes = prediction.minutesLostNextWeek;

    if (currentMinutes <= targetMinutes) {
      return { percentageReduction: 0, minutesNeedToSave: 0 };
    }

    const minutesNeedToSave = currentMinutes - targetMinutes;
    const percentageReduction = (minutesNeedToSave / currentMinutes) * 100;

    return {
      percentageReduction: Math.round(percentageReduction * 10) / 10,
      minutesNeedToSave: Math.round(minutesNeedToSave),
    };
  },
};

/**
 * EJEMPLO DE USO:
 *
 * import { predictor } from '@/services/analytics/predictor';
 *
 * const prediction = predictor.predictNextWeekMinutesLost(analysis);
 *
 * console.log(`Próxima semana: ${prediction.hoursLostNextWeek}h`);
 * // Output: Próxima semana: 5.2h
 *
 * console.log('Confianza:', prediction.confidence); // 87
 * console.log('Recomendación:', prediction.recommendation);
 *
 * // Mejores horas para trabajar
 * const bestHours = predictor.getBestTimeSlots(analysis);
 * console.log('Mejor: 9-10am, 2-3pm, 4-5pm');
 *
 * // Cuánto necesito mejorar para 3h/semana
 * const improvement = predictor.calculateRequiredImprovement(prediction, 3);
 * console.log(`Reducir ${improvement.percentageReduction}%`);
 */
