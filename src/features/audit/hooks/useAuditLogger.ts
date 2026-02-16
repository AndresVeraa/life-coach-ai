import { useCallback, useMemo } from 'react';
import { useAuditStore } from '../audit.store';

/**
 * Hook personalizado para acceder a datos de auditoría en el contexto del Coach IA
 * Proporciona utilidades para integrar métricas de distracción con el sistema de coaching
 */
export const useAuditLogger = () => {
  const { metrics, getCurrentSession } = useAuditStore();
  const currentSession = getCurrentSession();

  /**
   * Resumen de distracciones para incluir en prompts del coach
   */
  const distractionSummary = useMemo(
    () => ({
      totalMinutesLost: metrics.totalMinutesLost,
      averagePerDay: metrics.averageMinutesPerDay,
      topCategory: metrics.topCategory,
      weeklyTrend: metrics.weeklyTrend,
      currentSessionCount: currentSession?.distractions.length ?? 0,
    }),
    [metrics, currentSession]
  );

  /**
   * Construye un texto contextual de distracciones para el coach
   */
  const buildDistractionContext = useCallback((): string => {
    if (metrics.totalSessions === 0) {
      return 'Aún no has registrado sesiones de auditoría.';
    }

    const parts: string[] = [];

    // Contexto general
    parts.push(
      `Has perdido ${metrics.totalMinutesLost} minutos en total debido a distracciones.`
    );

    // Promedio diario
    if (metrics.averageMinutesPerDay > 0) {
      parts.push(`En promedio, pierdes ${metrics.averageMinutesPerDay} minutos por día.`);
    }

    // Categoría principal
    if (metrics.topCategory) {
      const topCategoryData = metrics.categoryBreakdown[metrics.topCategory];
      const percentage = topCategoryData.percentage;
      parts.push(
        `Tu mayor distracción es ${metrics.topCategory} (${percentage}% del tiempo perdido).`
      );
    }

    // Tendencia
    if (metrics.weeklyTrend === 'improving') {
      parts.push('¡Buena noticia! Esta semana estás mejorando y perdiendo menos tiempo.');
    } else if (metrics.weeklyTrend === 'declining') {
      parts.push(
        'Tu tendencia muestra que estás perdiendo más tiempo que la semana anterior. Necesitas reforzar tus estrategias.'
      );
    } else {
      parts.push('Tu enfoque se mantiene estable comparado con la semana anterior.');
    }

    return parts.join(' ');
  }, [metrics]);

  /**
   * Obtiene recomendación específica basada en la categoría principal de distracción
   */
  const getDistractionRecommendation = useCallback((): string => {
    const topCategory = metrics.topCategory;

    const recommendations: Record<string, string> = {
      'redes-sociales':
        'Las redes sociales son tu principal distracción. Considera usar bloqueadores de aplicaciones o establecer horarios específicos para revisar tus redes.',
      personas:
        'Las conversaciones con otras personas te restan productividad. Intenta establecer bloques de tiempo "no molestar" cuando necesites concentrarte.',
      entretenimiento:
        'El entretenimiento (películas, música, juegos) consume mucho de tu tiempo. Crea rutinas donde reserves estos para después de trabajo productivo.',
      'tareas-administrativas':
        'Las tareas administrativas rompen tu flujo. Agrúpalas en bloques específicos del día en lugar de hacerlas al azar.',
      otro:
        'Hay varias distracciones misceláneas. Identifica patrones y agrupa las similares para poder abordarlas juntas.',
    };

    return recommendations[topCategory ?? 'otro'] ?? '';
  }, [metrics.topCategory]);

  /**
   * Verifica si el usuario ha tenido un buen día (bajo tiempo de distracción)
   */
  const isProductiveDay = useCallback((): boolean => {
    if (metrics.last7Days.length === 0) return false;

    // Considera un día productivo si está por debajo del promedio personal
    const today = metrics.last7Days[metrics.last7Days.length - 1];
    return today.minutesLost < metrics.averageMinutesPerDay;
  }, [metrics]);

  /**
   * Obtiene áreas donde el usuario es fuerte (menos distracción)
   */
  const getStrengthAreas = useCallback((): string[] => {
    return Object.entries(metrics.categoryBreakdown)
      .filter(([_, data]) => data.percentage < 10 && data.count > 0)
      .map(([category]) => category);
  }, [metrics.categoryBreakdown]);

  /**
   * Genera una puntuación de enfoque del 0 al 100
   * 100 = Sin distracciones
   * 0 = Muchas distracciones (8+ horas/480 minutos)
   */
  const getFocusScore = useCallback((): number => {
    const today = metrics.last7Days[metrics.last7Days.length - 1];
    if (!today) return 100; // Sin datos = perfecta

    // Mapear 0-480 minutos a 100-0 puntos
    const score = Math.max(0, 100 - (today.minutesLost / 480) * 100);
    return Math.round(score);
  }, [metrics.last7Days]);

  return {
    metrics,
    currentSession,
    distractionSummary,
    buildDistractionContext,
    getDistractionRecommendation,
    isProductiveDay,
    getStrengthAreas,
    getFocusScore,
  };
};
