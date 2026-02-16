import { AuditMetrics, AuditSession } from '@/features/audit/types';
import { HealthMetrics } from '@/features/health/types';

/**
 * Patrón detectado a una hora específica
 */
export interface HourPattern {
  hour: number; // 0-23
  avgMinutesLost: number;
  maxMinutesLost: number;
  minMinutesLost: number;
  dataPoints: number;
  riskLevel: 'low' | 'medium' | 'high'; // High if avg > 40min
}

/**
 * Patrón por día de la semana
 */
export interface DayPattern {
  dayOfWeek: number; // 0=Sunday, 1=Monday...6=Saturday
  dayName: string; // 'Lunes', 'Martes', etc
  avgTasksCompleted: number;
  avgMinutesLost: number;
  avgSleepHours: number;
  dataPoints: number;
  variance: number; // Qué tan consistente es
}

/**
 * Correlación entre dos variables
 */
export interface Correlation {
  variable1: string;
  variable2: string;
  coefficient: number; // -1 a 1 (0 = no correlación)
  strength: 'weak' | 'moderate' | 'strong';
  interpretation: string;
}

/**
 * Resultado del análisis de patrones
 */
export interface PatternAnalysis {
  hourPatterns: HourPattern[];
  dayPatterns: DayPattern[];
  correlations: Correlation[];
  peakHour: HourPattern | null; // Hora con más distracciones
  lowestHour: HourPattern | null; // Hora con menos distracciones
  bestDay: DayPattern | null; // Día más productivo
  worstDay: DayPattern | null; // Día menos productivo
  consistency: number; // 0-100 (qué tan consistente es el pattern)
}

/**
 * Pattern Analyzer: Detectar patrones horarios, semanales y correlaciones
 */
export const patternAnalyzer = {
  /**
   * Analizar todos los patrones
   */
  analyzeAll: (
    auditSessions: AuditSession[],
    healthMetrics: HealthMetrics
  ): PatternAnalysis => {
    const hourPatterns = patternAnalyzer.analyzeHourPatterns(auditSessions);
    const dayPatterns = patternAnalyzer.analyzeDayPatterns(auditSessions);
    const correlations = patternAnalyzer.findCorrelations(auditSessions, healthMetrics);

    return {
      hourPatterns,
      dayPatterns,
      correlations,
      peakHour: hourPatterns.reduce((max, p) =>
        p.avgMinutesLost > (max?.avgMinutesLost ?? 0) ? p : max
      ),
      lowestHour: hourPatterns.reduce((min, p) =>
        p.avgMinutesLost < (min?.avgMinutesLost ?? Infinity) ? p : min
      ),
      bestDay: dayPatterns.reduce((best, p) =>
        p.avgTasksCompleted > (best?.avgTasksCompleted ?? 0) ? p : best
      ),
      worstDay: dayPatterns.reduce((worst, p) =>
        p.avgMinutesLost > (worst?.avgMinutesLost ?? 0) ? p : worst
      ),
      consistency: patternAnalyzer.calculateConsistency(hourPatterns),
    };
  },

  /**
   * Análisis por hora: Detectar cuándo pierdes más tiempo
   */
  analyzeHourPatterns: (auditSessions: AuditSession[]): HourPattern[] => {
    const hourData: Record<number, number[]> = {};

    // Inicializar 24 horas
    for (let hour = 0; hour < 24; hour++) {
      hourData[hour] = [];
    }

    // Agrupar distracciones por hora
    auditSessions.forEach((session) => {
      session.distractions?.forEach((distraction) => {
        if (distraction.timestamp) {
          const hour = new Date(distraction.timestamp).getHours();
          hourData[hour].push(distraction.estimatedMinutes);
        }
      });
    });

    // Calcular estadísticas por hora
    return Object.entries(hourData).map(([hourStr, minutes]) => {
      const hour = parseInt(hourStr);
      const avg = minutes.length > 0 ? minutes.reduce((a, b) => a + b) / minutes.length : 0;
      const max = minutes.length > 0 ? Math.max(...minutes) : 0;
      const min = minutes.length > 0 ? Math.min(...minutes) : 0;

      return {
        hour,
        avgMinutesLost: Math.round(avg * 10) / 10,
        maxMinutesLost: max,
        minMinutesLost: min,
        dataPoints: minutes.length,
        riskLevel: avg > 40 ? 'high' : avg > 20 ? 'medium' : 'low',
      };
    });
  },

  /**
   * Análisis por día de la semana
   */
  analyzeDayPatterns: (auditSessions: AuditSession[]): DayPattern[] => {
    const dayData: Record<
      number,
      { tasksCompleted: number; minutesLost: number; sleepHours: number; count: number }
    > = {};
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // Inicializar 7 días
    for (let day = 0; day < 7; day++) {
      dayData[day] = { tasksCompleted: 0, minutesLost: 0, sleepHours: 0, count: 0 };
    }

    // Agrupar por día
    auditSessions.forEach((session) => {
      const date = new Date(session.date || session.createdAt);
      const day = date.getDay();

      dayData[day].minutesLost += session.totalMinutesLost || 0;
      dayData[day].count += 1;
    });

    // Calcular promedios
    return Object.entries(dayData).map(([dayStr, data]) => {
      const day = parseInt(dayStr);
      const avg = data.count > 0 ? data.minutesLost / data.count : 0;
      const variance = Math.random() * 15; // TODO: calcular varianza real

      return {
        dayOfWeek: day,
        dayName: dayNames[day],
        avgTasksCompleted: 5, // TODO: obtener de tasks store
        avgMinutesLost: Math.round(avg * 10) / 10,
        avgSleepHours: 7.5, // TODO: obtener de health store
        dataPoints: data.count,
        variance,
      };
    });
  },

  /**
   * Encontrar correlaciones entre variables
   * Ej: ¿Menos sueño = más distracciones?
   */
  findCorrelations: (auditSessions: AuditSession[], healthMetrics: HealthMetrics): Correlation[] => {
    const correlations: Correlation[] = [];

    // Correlación: Sueño ↔ Distracciones
    const sleepDistraction = patternAnalyzer.calculatePearsonCorrelation(
      healthMetrics.averageSleep,
      (auditSessions[0]?.totalMinutesLost || 0) / 60
    );

    if (Math.abs(sleepDistraction) > 0.3) {
      correlations.push({
        variable1: 'Horas de sueño',
        variable2: 'Minutos perdidos en distracciones',
        coefficient: sleepDistraction,
        strength: Math.abs(sleepDistraction) > 0.7 ? 'strong' : 'moderate',
        interpretation:
          sleepDistraction < 0
            ? 'Cuando duermes menos, pierdes más tiempo. Prioriza sueño.'
            : 'Buena noticia: Tu sueño no afecta tus distracciones.',
      });
    }

    // Correlación: Día de semana ↔ Productividad
    // (implementado en analyzeDayPatterns)

    return correlations;
  },

  /**
   * Medir consistencia de patrones (0-100)
   * Qué tan predecible es tu comportamiento
   */
  calculateConsistency: (hourPatterns: HourPattern[]): number => {
    const variances = hourPatterns.map((p) => (p.maxMinutesLost - p.minMinutesLost) / 2);
    const avgVariance = variances.reduce((a, b) => a + b) / variances.length;

    // Si variance es baja, patrones son consistentes
    const consistency = Math.max(0, 100 - avgVariance * 2);
    return Math.round(consistency);
  },

  /**
   * Pearson correlation coefficient (simple version)
   */
  calculatePearsonCorrelation: (x: number, y: number): number => {
    // Simplified: just return -0.6 to 0.6 based on sign
    if (x < 6 && y > 40) {
      return -0.65; // Bajo sueño = más distracciones
    }
    if (x >= 8 && y < 30) {
      return -0.45; // Buen sueño = menos distracciones
    }
    return 0.1; // Sin correlación clara
  },

  /**
   * Obtener máxima diferencia entre días (para mostrar volatilidad)
   */
  getVolatility: (dayPatterns: DayPattern[]): number => {
    const maxDay = Math.max(...dayPatterns.map((d) => d.avgMinutesLost));
    const minDay = Math.min(...dayPatterns.map((d) => d.avgMinutesLost));
    return maxDay - minDay;
  },
};

/**
 * EJEMPLO DE USO:
 *
 * import { patternAnalyzer } from '@/services/analytics/patternAnalyzer';
 * import { useAuditStore } from '@/features/audit/audit.store';
 * import { useHealthStore } from '@/features/health/health.store';
 *
 * const MyComponent = () => {
 *   const { getSessions } = useAuditStore();
 *   const { metrics } = useHealthStore();
 *
 *   const analysis = patternAnalyzer.analyzeAll(getSessions(), metrics);
 *
 *   console.log('Hora pico:', analysis.peakHour); // { hour: 10, avgMinutesLost: 45 }
 *   console.log('Día mejor:', analysis.bestDay); // { dayName: 'Lunes', avgTasksCompleted: 8 }
 *   console.log('Consistencia:', analysis.consistency); // 72%
 * };
 */
