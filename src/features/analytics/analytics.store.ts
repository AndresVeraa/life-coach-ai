import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PatternAnalysis } from '@/services/analytics/patternAnalyzer';
import { Prediction } from '@/services/analytics/predictor';
import { Insight } from '@/services/analytics/insights';

/**
 * Estado completo del análisis y predicciones
 */
export interface AnalyticsState {
  // Análisis actual
  analysis: PatternAnalysis | null;
  prediction: Prediction | null;
  insights: Insight[];

  // Metadatos
  lastAnalyzedAt: number | null;
  analysisFrequency: 'daily' | 'weekly' | 'manual'; // Cuándo hacer análisis

  // Histórico (para ver tendencias)
  previousPredictions: Prediction[];
  analysisHistory: { timestamp: number; analysis: PatternAnalysis }[];

  // Configuración
  targetMinutesLostPerWeek: number; // Meta (default 3 horas = 180 min)
  enableAutoAnalysis: boolean; // Automático vs manual

  // Acciones
  setAnalysis: (analysis: PatternAnalysis) => void;
  setPrediction: (prediction: Prediction) => void;
  setInsights: (insights: Insight[]) => void;
  updateAll: (analysis: PatternAnalysis, prediction: Prediction, insights: Insight[]) => void;

  // Histórico
  addToPredictionHistory: (prediction: Prediction) => void;
  getPredictionTrend: () => number; // % mejora o empeoramiento
  clearHistory: () => void;

  // Configuración
  setTarget: (minutes: number) => void;
  setAutoAnalysis: (enabled: boolean) => void;
  setAnalysisFrequency: (frequency: 'daily' | 'weekly' | 'manual') => void;
}

/**
 * Zustand store para Analytics
 */
export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      analysis: null,
      prediction: null,
      insights: [],
      lastAnalyzedAt: null,
      analysisFrequency: 'weekly',
      previousPredictions: [],
      analysisHistory: [],
      targetMinutesLostPerWeek: 180, // 3 horas
      enableAutoAnalysis: true,

      // === SETTERS ===
      setAnalysis: (analysis) => {
        set({ analysis, lastAnalyzedAt: Date.now() });
      },

      setPrediction: (prediction) => {
        set((state) => ({
          prediction,
          previousPredictions: [prediction, ...state.previousPredictions.slice(0, 12)], // Guardar 12
        }));
      },

      setInsights: (insights) => {
        set({ insights });
      },

      updateAll: (analysis, prediction, insights) => {
        set({
          analysis,
          prediction,
          insights,
          lastAnalyzedAt: Date.now(),
          previousPredictions: [prediction, ...get().previousPredictions.slice(0, 12)],
        });
      },

      // === HISTÓRICO ===
      addToPredictionHistory: (prediction) => {
        const current = get().previousPredictions;
        set({
          previousPredictions: [prediction, ...current.slice(0, 11)],
        });
      },

      getPredictionTrend: () => {
        const { previousPredictions } = get();
        if (previousPredictions.length < 2) return 0;

        const latest = previousPredictions[0].minutesLostNextWeek;
        const previous = previousPredictions[1].minutesLostNextWeek;

        const change = ((latest - previous) / previous) * 100;
        return Math.round(change * 10) / 10;
      },

      clearHistory: () => {
        set({
          previousPredictions: [],
          analysisHistory: [],
        });
      },

      // === CONFIGURACIÓN ===
      setTarget: (minutes) => {
        set({ targetMinutesLostPerWeek: minutes });
      },

      setAutoAnalysis: (enabled) => {
        set({ enableAutoAnalysis: enabled });
      },

      setAnalysisFrequency: (frequency) => {
        set({ analysisFrequency: frequency });
      },
    }),
    {
      name: 'analytics-store',
      storage: AsyncStorage as any,
    }
  )
);

// ============================================
// HOOKS PARA USAR EN COMPONENTES
// ============================================

/**
 * Hook para obtener estado de análisis
 */
export const useAnalytics = () => {
  const {
    analysis,
    prediction,
    insights,
    lastAnalyzedAt,
    targetMinutesLostPerWeek,
    getPredictionTrend,
  } = useAnalyticsStore();

  return {
    analysis,
    prediction,
    insights,
    lastAnalyzedAt,
    targetMinutesLostPerWeek,
    trend: getPredictionTrend(),
    isAnalysisStale: lastAnalyzedAt && Date.now() - lastAnalyzedAt > 24 * 60 * 60 * 1000,
  };
};

/**
 * Hook para actualizar análisis
 */
export const useAnalyticsUpdate = () => {
  const { setAnalysis, setPrediction, setInsights, updateAll } = useAnalyticsStore();

  return {
    setAnalysis,
    setPrediction,
    setInsights,
    updateAll,
  };
};

/**
 * Hook para histórico
 */
export const useAnalyticsHistory = () => {
  const {
    previousPredictions,
    addToPredictionHistory,
    clearHistory,
    getPredictionTrend,
  } = useAnalyticsStore();

  return {
    previousPredictions,
    addToPredictionHistory,
    clearHistory,
    trend: getPredictionTrend(),
  };
};

/**
 * Hook para configuración
 */
export const useAnalyticsSettings = () => {
  const {
    enableAutoAnalysis,
    analysisFrequency,
    targetMinutesLostPerWeek,
    setTarget,
    setAutoAnalysis,
    setAnalysisFrequency,
  } = useAnalyticsStore();

  return {
    enableAutoAnalysis,
    analysisFrequency,
    targetMinutesLostPerWeek,
    setTarget,
    setAutoAnalysis,
    setAnalysisFrequency,
  };
};

/**
 * EJEMPLO DE USO:
 *
 * // En un componente
 * import { useAnalytics, useAnalyticsUpdate } from '@/features/analytics/analytics.store';
 *
 * const MyComponent = () => {
 *   const { prediction, insights, trend } = useAnalytics();
 *   const { updateAll } = useAnalyticsUpdate();
 *
 *   // Analizando datos
 *   const analysis = patternAnalyzer.analyzeAll(sessions, metrics);
 *   const prediction = predictor.predictNextWeekMinutesLost(analysis);
 *   const insights = insightsGenerator.generateAllInsights(analysis, prediction);
 *
 *   // Guardar
 *   updateAll(analysis, prediction, insights);
 *
 *   return (
 *     <View>
 *       <Text>{prediction?.hoursLostNextWeek}h próxima semana</Text>
 *       <Text>Trend: {trend > 0 ? '📈 Empeorando' : '📉 Mejorando'}</Text>
 *       {insights.map((i) => (
 *         <Text key={i.id}>{i.title}</Text>
 *       ))}
 *     </View>
 *   );
 * };
 */
