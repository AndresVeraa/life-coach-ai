import { useEffect, useState, useCallback, useMemo } from 'react';
import { patternAnalyzer } from '@/services/analytics/patternAnalyzer';
import { predictor } from '@/services/analytics/predictor';
import { insightsGenerator } from '@/services/analytics/insights';
import { useAuditStore } from '@/features/audit/audit.store';
import { useHealthStore } from '@/features/health/health.store';
import { useAnalyticsStore } from './analytics.store';
import type { PatternAnalysis } from '@/services/analytics/patternAnalyzer';
import type { Prediction } from '@/services/analytics/predictor';
import type { Insight } from '@/services/analytics/insights';

/**
 * Estado del hook de análisis
 */
export interface UseAdvancedAnalyticsState {
  loading: boolean;
  error: string | null;
  analysis: PatternAnalysis | null;
  prediction: Prediction | null;
  insights: Insight[];
  lastAnalyzedAt: number | null;

  // Acciones
  runAnalysis: () => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  getRecommendation: () => string;
  getBestHoursForDeepWork: () => number[];
  getWorstHours: () => number[];
}

/**
 * Hook que integra todo el sistema de análisis avanzado
 * Automáticamente ejecuta análisis cuando hay data disponible
 */
export const useAdvancedAnalytics = (): UseAdvancedAnalyticsState => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos de auditoría y salud
  const { getSessions } = useAuditStore();
  const { metrics } = useHealthStore();

  // Store de análisis
  const {
    analysis: storedAnalysis,
    prediction: storedPrediction,
    insights: storedInsights,
    lastAnalyzedAt,
    updateAll,
  } = useAnalyticsStore();

  /**
   * Ejecutar análisis completo
   */
  const runAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener datos
      const sessions = getSessions();

      if (!sessions || sessions.length === 0) {
        setError('No hay datos de auditoría para analizar. Comienza registrando distracciones.');
        setLoading(false);
        return;
      }

      if (!metrics) {
        setError('No hay datos de salud. Completa tu perfil de salud.');
        setLoading(false);
        return;
      }

      // === FASE 1: ANÁLISIS DE PATRONES ===
      const newAnalysis = patternAnalyzer.analyzeAll(sessions, metrics);

      // === FASE 2: PREDICACIÓN ===
      const newPrediction = predictor.predictNextWeekMinutesLost(newAnalysis);

      // === FASE 3: INSIGHTS ===
      const newInsights = insightsGenerator.generateAllInsights(newAnalysis, newPrediction);

      // === GUARDAR EN TIENDA ===
      updateAll(newAnalysis, newPrediction, newInsights);

      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido en análisis';
      setError(message);
      console.error('Analytics error:', err);
      setLoading(false);
    }
  }, [getSessions, metrics, updateAll]);

  /**
   * Refrescar análisis (fuerza nueva ejecución)
   */
  const refreshAnalysis = useCallback(async () => {
    await runAnalysis();
  }, [runAnalysis]);

  /**
   * Hook que ejecuta análisis automáticamente si:
   * - La data cambió
   * - El análisis es viejo (>24 horas)
   */
  useEffect(() => {
    const isStale = lastAnalyzedAt && Date.now() - lastAnalyzedAt > 24 * 60 * 60 * 1000;
    const noAnalysis = !storedAnalysis;

    if (isStale || noAnalysis) {
      runAnalysis();
    }
  }, []);

  /**
   * Obtener recomendación principal
   */
  const getRecommendation = useCallback((): string => {
    if (!storedPrediction) return 'Ejecuta un análisis para obtener recomendaciones.';

    if (storedInsights.length === 0) {
      return storedPrediction.recommendation;
    }

    const topInsight = storedInsights[0];
    return topInsight.suggestedAction || storedPrediction.recommendation;
  }, [storedPrediction, storedInsights]);

  /**
   * Obtener mejores horas para trabajo profundo
   */
  const getBestHoursForDeepWork = useCallback((): number[] => {
    if (!storedAnalysis) return [];

    return predictor.getBestTimeSlots(storedAnalysis, 2);
  }, [storedAnalysis]);

  /**
   * Obtener peores horas
   */
  const getWorstHours = useCallback((): number[] => {
    if (!storedAnalysis) return [];

    return predictor.getWorstTimeSlots(storedAnalysis, 2);
  }, [storedAnalysis]);

  // Usar useMemo para evitar re-renders innecesarios
  const memoizedState = useMemo(
    () => ({
      loading,
      error,
      analysis: storedAnalysis,
      prediction: storedPrediction,
      insights: storedInsights,
      lastAnalyzedAt,
      runAnalysis,
      refreshAnalysis,
      getRecommendation,
      getBestHoursForDeepWork,
      getWorstHours,
    }),
    [
      loading,
      error,
      storedAnalysis,
      storedPrediction,
      storedInsights,
      lastAnalyzedAt,
      runAnalysis,
      refreshAnalysis,
      getRecommendation,
      getBestHoursForDeepWork,
      getWorstHours,
    ]
  );

  return memoizedState;
};

/**
 * EJEMPLO DE USO:
 *
 * import { useAdvancedAnalytics } from '@/features/analytics/useAdvancedAnalytics';
 *
 * const AnalyticsScreen = () => {
 *   const {
 *     loading,
 *     error,
 *     analysis,
 *     prediction,
 *     insights,
 *     refreshAnalysis,
 *     getRecommendation,
 *     getBestHoursForDeepWork,
 *   } = useAdvancedAnalytics();
 *
 *   if (loading) return <Text>Analizando patrones...</Text>;
 *   if (error) return <Text>Error: {error}</Text>;
 *
 *   return (
 *     <ScrollView>
 *       <Text>Próxima semana: {prediction?.hoursLostNextWeek}h</Text>
 *       <Text>Recomendación: {getRecommendation()}</Text>
 *
 *       {analysis && (
 *         <>
 *           <Text>Mejor hora: {analysis.lowestHour?.hour}:00</Text>
 *           <Text>Hora crítica: {analysis.peakHour?.hour}:00</Text>
 *         </>
 *       )}
 *
 *       {insights.map((insight) => (
 *         <Card key={insight.id}>
 *           <Text>{insight.title}</Text>
 *           <Text>{insight.description}</Text>
 *           {insight.suggestedAction && (
 *             <Button onPress={() => console.log(insight.suggestedAction)}>
 *               {insight.suggestedAction}
 *             </Button>
 *           )}
 *         </Card>
 *       ))}
 *
 *       <Button onPress={refreshAnalysis}>Actualizar análisis</Button>
 *     </ScrollView>
 *   );
 * };
 */
