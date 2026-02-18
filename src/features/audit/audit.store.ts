import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { AuditEntry, AuditState, AuditStats } from './types';

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => ({
          entries: [{ ...entry, id: Date.now().toString() }, ...state.entries],
        })),

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      clearHistory: () => set({ entries: [] }),

      getEntries: (range) => {
        const { entries } = get();
        const now = new Date();
        let startDate = startOfDay(now);
        if (range === 'week') startDate = startOfWeek(now, { weekStartsOn: 1 });
        if (range === 'month') startDate = startOfMonth(now);
        return entries.filter((e) => isAfter(new Date(e.timestamp), startDate));
      },

      getStats: (range): AuditStats => {
        const { entries } = get();
        const now = new Date();
        let startDate = startOfDay(now);
        if (range === 'week') startDate = startOfWeek(now, { weekStartsOn: 1 });
        if (range === 'month') startDate = startOfMonth(now);

        const filtered = entries.filter((e) =>
          isAfter(new Date(e.timestamp), startDate)
        );

        // 1. Focus time & lost time
        const focusTime = filtered
          .filter((e) => e.type === 'focus')
          .reduce((acc, curr) => acc + curr.durationMinutes, 0);

        const lostTime = filtered
          .filter((e) => e.type === 'distraction')
          .reduce((acc, curr) => acc + curr.durationMinutes, 0);

        // 2. Productivity Score
        const totalTime = focusTime + lostTime;
        let score = 100;
        if (totalTime > 0) {
          score = Math.round((focusTime / totalTime) * 100);
        }

        // 3. Top distraction category
        const distractionCounts: Record<string, number> = {};
        filtered
          .filter((e) => e.type === 'distraction')
          .forEach((e) => {
            distractionCounts[e.category] =
              (distractionCounts[e.category] || 0) + e.durationMinutes;
          });

        const topDistraction =
          Object.entries(distractionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          'Ninguna';

        return {
          score,
          focusTime,
          lostTime,
          topDistraction,
          sessionCount: filtered.filter((e) => e.type === 'focus').length,
        };
      },
    }),
    {
      name: 'audit-analytics-v2-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
