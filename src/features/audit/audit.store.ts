import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuditSession,
  AuditMetrics,
  AuditStore,
  DistractionCategory,
  DistractionEvent,
  CATEGORY_CONFIG,
} from './types';

// Helper: obtener fecha ISO actual
function getISODate(date?: Date): string {
  const d = date || new Date();
  return d.toISOString().split('T')[0];
}

// Helper: calcular métricas
function calculateMetrics(sessions: AuditSession[]): AuditMetrics {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalMinutesLost: 0,
      averageMinutesPerDay: 0,
      topCategory: null,
      categoryBreakdown: {
        'redes-sociales': { count: 0, totalMinutes: 0, percentage: 0 },
        personas: { count: 0, totalMinutes: 0, percentage: 0 },
        entretenimiento: { count: 0, totalMinutes: 0, percentage: 0 },
        'tareas-administrativas': { count: 0, totalMinutes: 0, percentage: 0 },
        otro: { count: 0, totalMinutes: 0, percentage: 0 },
      },
      last7Days: [],
      weeklyTrend: 'stable',
    };
  }

  // Total y promedio
  const totalMinutesLost = sessions.reduce(
    (sum, s) => sum + (s.totalMinutesLost || 0),
    0
  );
  const averageMinutesPerDay =
    sessions.length > 0 ? Math.round(totalMinutesLost / sessions.length) : 0;

  // Desglose por categoría
  const categoryBreakdown: Record<
    DistractionCategory,
    { count: number; totalMinutes: number; percentage: number }
  > = {
    'redes-sociales': { count: 0, totalMinutes: 0, percentage: 0 },
    personas: { count: 0, totalMinutes: 0, percentage: 0 },
    entretenimiento: { count: 0, totalMinutes: 0, percentage: 0 },
    'tareas-administrativas': { count: 0, totalMinutes: 0, percentage: 0 },
    otro: { count: 0, totalMinutes: 0, percentage: 0 },
  };

  sessions.forEach((session) => {
    session.distractions.forEach((distraction) => {
      categoryBreakdown[distraction.category].count++;
      categoryBreakdown[distraction.category].totalMinutes +=
        distraction.estimatedMinutes;
    });
  });

  // Calcula porcentajes
  (Object.keys(categoryBreakdown) as DistractionCategory[]).forEach((cat) => {
    const percentage =
      totalMinutesLost > 0
        ? Math.round(
            (categoryBreakdown[cat].totalMinutes / totalMinutesLost) * 100
          )
        : 0;
    categoryBreakdown[cat].percentage = percentage;
  });

  // Top category
  const topCategory = (
    Object.keys(categoryBreakdown) as DistractionCategory[]
  ).reduce((top, cat) =>
    categoryBreakdown[cat].count > categoryBreakdown[top].count ? cat : top
  ) as DistractionCategory;

  // Últimos 7 días
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = getISODate(date);
    const session = sessions.find((s) => s.date === dateStr);
    last7Days.push({
      date: dateStr,
      minutesLost: session?.totalMinutesLost || 0,
      distractionCount: session?.distractions.length || 0,
    });
  }

  // Calcular tendencia de la semana
  const last3Days = last7Days.slice(-3).map((d) => d.minutesLost);
  const first4Days = last7Days.slice(0, 4).map((d) => d.minutesLost);
  const avgLast3 = last3Days.reduce((a, b) => a + b, 0) / 3;
  const avgFirst4 = first4Days.reduce((a, b) => a + b, 0) / 4;
  let weeklyTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (avgLast3 < avgFirst4 * 0.9) {
    weeklyTrend = 'improving';
  } else if (avgLast3 > avgFirst4 * 1.1) {
    weeklyTrend = 'declining';
  }

  return {
    totalSessions: sessions.length,
    totalMinutesLost,
    averageMinutesPerDay,
    topCategory: topCategory && categoryBreakdown[topCategory].count > 0 ? topCategory : null,
    categoryBreakdown,
    last7Days,
    weeklyTrend,
  };
}

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      metrics: calculateMetrics([]),

      createSession: () => {
        const today = getISODate();
        const existingSession = get().sessions.find((s) => s.date === today);

        if (!existingSession) {
          const newSession: AuditSession = {
            id: Date.now().toString(),
            date: today,
            distractions: [],
            totalMinutesLost: 0,
            completedAudit: false,
            notes: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          set((state) => {
            const newSessions = [newSession, ...state.sessions];
            return {
              sessions: newSessions,
              currentSessionId: newSession.id,
              metrics: calculateMetrics(newSessions),
            };
          });
        } else {
          set({ currentSessionId: existingSession.id });
        }
      },

      addDistraction: (category, description, estimatedMinutes) => {
        set((state) => {
          const updatedSessions = state.sessions.map((session) => {
            if (session.id === state.currentSessionId) {
              const newDistraction: DistractionEvent = {
                id: Date.now().toString(),
                category,
                description,
                estimatedMinutes,
                timestamp: Date.now(),
                date: session.date,
              };

              const updatedDistractions = [newDistraction, ...session.distractions];
              const totalMinutesLost = updatedDistractions.reduce(
                (sum, d) => sum + d.estimatedMinutes,
                0
              );

              return {
                ...session,
                distractions: updatedDistractions,
                totalMinutesLost,
                updatedAt: Date.now(),
              };
            }
            return session;
          });

          return {
            sessions: updatedSessions,
            metrics: calculateMetrics(updatedSessions),
          };
        });
      },

      editDistraction: (id, updates) => {
        set((state) => {
          const updatedSessions = state.sessions.map((session) => {
            if (session.id === state.currentSessionId) {
              const updatedDistractions = session.distractions.map((d) =>
                d.id === id ? { ...d, ...updates } : d
              );

              const totalMinutesLost = updatedDistractions.reduce(
                (sum, d) => sum + d.estimatedMinutes,
                0
              );

              return {
                ...session,
                distractions: updatedDistractions,
                totalMinutesLost,
                updatedAt: Date.now(),
              };
            }
            return session;
          });

          return {
            sessions: updatedSessions,
            metrics: calculateMetrics(updatedSessions),
          };
        });
      },

      deleteDistraction: (id) => {
        set((state) => {
          const updatedSessions = state.sessions.map((session) => {
            if (session.id === state.currentSessionId) {
              const updatedDistractions = session.distractions.filter(
                (d) => d.id !== id
              );

              const totalMinutesLost = updatedDistractions.reduce(
                (sum, d) => sum + d.estimatedMinutes,
                0
              );

              return {
                ...session,
                distractions: updatedDistractions,
                totalMinutesLost,
                updatedAt: Date.now(),
              };
            }
            return session;
          });

          return {
            sessions: updatedSessions,
            metrics: calculateMetrics(updatedSessions),
          };
        });
      },

      completeSession: (notes) => {
        set((state) => {
          const updatedSessions = state.sessions.map((session) => {
            if (session.id === state.currentSessionId) {
              return {
                ...session,
                completedAudit: true,
                notes,
                updatedAt: Date.now(),
              };
            }
            return session;
          });

          return {
            sessions: updatedSessions,
            metrics: calculateMetrics(updatedSessions),
          };
        });
      },

      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return sessions.find((s) => s.id === currentSessionId) || null;
      },

      getSessionsByDate: (date: string) => {
        const { sessions } = get();
        return sessions.find((s) => s.date === date) || null;
      },

      getMetrics: () => get().metrics,

      getSessions: () => {
        return get().sessions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },

      clearHistory: () => {
        set({
          sessions: [],
          currentSessionId: null,
          metrics: calculateMetrics([]),
        });
      },
    }),
    {
      name: 'audit-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
