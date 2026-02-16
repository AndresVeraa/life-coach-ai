/**
 * PASO 5.2: Analytics Avanzado - Índice de exportaciones
 *
 * Este módulo proporciona análisis inteligente que mejora el coaching IA
 * con patrones detectados de comportamiento del usuario.
 */

// === Servicios de análisis ===
export { patternAnalyzer } from './patternAnalyzer';
export type { HourPattern, DayPattern, Correlation, PatternAnalysis } from './patternAnalyzer';

export { predictor } from './predictor';
export type { Prediction } from './predictor';

export { insightsGenerator } from './insights';
export type { Insight } from './insights';

// === Store y hooks ===
export {
  useAnalyticsStore,
  useAnalytics,
  useAnalyticsUpdate,
  useAnalyticsHistory,
  useAnalyticsSettings,
} from '@/features/analytics/analytics.store';
export type { AnalyticsState } from '@/features/analytics/analytics.store';

export { useAdvancedAnalytics } from '@/features/analytics/useAdvancedAnalytics';
export type { UseAdvancedAnalyticsState } from '@/features/analytics/useAdvancedAnalytics';

/**
 * QUICK START:
 *
 * 1. En cualquier componente que quiera análisis:
 *    const analytics = useAdvancedAnalytics();
 *
 * 2. El hook automáticamente:
 *    - Ejecuta análisis si hay 30+ días de data
 *    - Detecta patrones horarios y semanales
 *    - Genera predicciones para próxima semana
 *    - Crea 5 insights accionables
 *    - Cachea resultados por 24 horas
 *
 * 3. Usar en Coach IA:
 *    - Incluir insights en contexto de prompt
 *    - Usar predicción para urgencia
 *    - Mencionar patrones detectados
 *
 * INTEGRACIÓN CON COACH:
 * const coachContext = insightsGenerator.generateCoachContext(insights);
 * // → Agregar al prompt de coaching para mejor contexto
 */
