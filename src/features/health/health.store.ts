import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SleepRecord, HealthMetrics, HealthState, SleepLog } from './types';

// Helper: calcular horas de sueño entre dos strings HH:MM
function calculateSleepHours(timeIn: string, timeOut: string): number {
  const [inHours, inMinutes] = timeIn.split(':').map(Number);
  const [outHours, outMinutes] = timeOut.split(':').map(Number);

  const inTotalMinutes = inHours * 60 + inMinutes;
  const outTotalMinutes = outHours * 60 + outMinutes;

  let diffMinutes = outTotalMinutes - inTotalMinutes;

  // Si es negativo, asumir que cruzó medianoche
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }

  return diffMinutes / 60;
}

// Helper: obtener fecha ISO (YYYY-MM-DD)
function getISODate(date?: Date): string {
  const d = date || new Date();
  return d.toISOString().split('T')[0];
}

// Helper: calcular métrica de sueño
function calculateMetrics(records: SleepRecord[]): HealthMetrics {
  if (records.length === 0) {
    return {
      averageSleep: 0,
      consecutiveDays: 0,
      bestDay: 0,
      worstDay: 0,
      goalMet: false,
      lastRecordDate: null,
      totalRecordsMonth: 0,
    };
  }

  const sortedRecords = [...records].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calcular horas promedio
  const totalHours = records.reduce((sum, r) => sum + calculateSleepHours(r.timeIn, r.timeOut), 0);
  const averageSleep = totalHours / records.length;

  // Mejor y peor calidad
  const qualities = records.map(r => r.quality);
  const bestDay = Math.max(...qualities);
  const worstDay = Math.min(...qualities);

  // Contar registros del mes actual
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const totalRecordsMonth = records.filter(r => r.date.startsWith(currentMonth)).length;

  // Calcular días consecutivos (desde la fecha más reciente hacia atrás)
  let consecutiveDays = 0;
  if (sortedRecords.length > 0) {
    const lastDate = new Date(sortedRecords[0].date);
    let currentDate = new Date(lastDate);

    for (const record of sortedRecords) {
      const recordDate = new Date(record.date);
      // Comparar si es exactamente 1 día anterior
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - 1);

      if (recordDate.toDateString() === expectedDate.toDateString()) {
        consecutiveDays++;
        currentDate = recordDate;
      } else if (recordDate.toDateString() === currentDate.toDateString()) {
        // Mismo día, skip
        continue;
      } else {
        break;
      }
    }
    consecutiveDays++; // +1 por el día inicial
  }

  return {
    averageSleep: Math.round(averageSleep * 10) / 10,
    consecutiveDays,
    bestDay,
    worstDay,
    goalMet: averageSleep >= 8,
    lastRecordDate: sortedRecords[0]?.date || null,
    totalRecordsMonth,
  };
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      records: [],
      metrics: calculateMetrics([]),
      last7Days: [],

      // --- Circadian Rhythm State ---
      targetWakeTime: '07:00',
      targetBedTime: '23:00',
      wakeAlarmEnabled: false,
      bedAlarmEnabled: false,
      sleepLogs: [],

      // --- Circadian Rhythm Actions ---
      setTargets: (wake: string, bed: string) =>
        set({ targetWakeTime: wake, targetBedTime: bed }),

      toggleAlarm: (type: 'wake' | 'bed') =>
        set((state) => ({
          wakeAlarmEnabled: type === 'wake' ? !state.wakeAlarmEnabled : state.wakeAlarmEnabled,
          bedAlarmEnabled: type === 'bed' ? !state.bedAlarmEnabled : state.bedAlarmEnabled,
        })),

      logAction: (type: 'wake' | 'sleep') =>
        set((state) => {
          const today = getISODate();
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const existingIndex = state.sleepLogs.findIndex((l) => l.date === today);
          const updatedLogs = [...state.sleepLogs];

          if (existingIndex >= 0) {
            const existing = { ...updatedLogs[existingIndex] };
            if (type === 'wake') existing.wakeTime = timeStr;
            else existing.bedTime = timeStr;
            updatedLogs[existingIndex] = existing;
          } else {
            const newLog: SleepLog = {
              date: today,
              ...(type === 'wake' ? { wakeTime: timeStr } : { bedTime: timeStr }),
            };
            updatedLogs.unshift(newLog);
          }

          return { sleepLogs: updatedLogs };
        }),

      updateLog: (date: string, field: 'wakeTime' | 'bedTime', value: string) =>
        set((state) => {
          const idx = state.sleepLogs.findIndex((l) => l.date === date);
          if (idx < 0) return state;
          const updatedLogs = [...state.sleepLogs];
          updatedLogs[idx] = { ...updatedLogs[idx], [field]: value };
          return { sleepLogs: updatedLogs };
        }),

      getTodayLog: () => {
        const today = getISODate();
        return get().sleepLogs.find((l) => l.date === today);
      },

      getWeekLogs: () => {
        const logs = get().sleepLogs;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = getISODate(weekAgo);
        return logs.filter((l) => l.date >= weekAgoStr);
      },

      // --- Sleep Records Actions ---
      addSleepRecord: (record) =>
        set((state) => {
          const newRecord: SleepRecord = {
            ...record,
            id: Date.now().toString(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          const updatedRecords = [newRecord, ...state.records];
          const metrics = calculateMetrics(updatedRecords);
          const last7Days = getLast7Days(updatedRecords);

          return {
            records: updatedRecords,
            metrics,
            last7Days,
          };
        }),

      updateSleepRecord: (id, updates) =>
        set((state) => {
          const updatedRecords = state.records.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
          );

          const metrics = calculateMetrics(updatedRecords);
          const last7Days = getLast7Days(updatedRecords);

          return {
            records: updatedRecords,
            metrics,
            last7Days,
          };
        }),

      deleteSleepRecord: (id) =>
        set((state) => {
          const updatedRecords = state.records.filter((r) => r.id !== id);
          const metrics = calculateMetrics(updatedRecords);
          const last7Days = getLast7Days(updatedRecords);

          return {
            records: updatedRecords,
            metrics,
            last7Days,
          };
        }),

      getSleepRecordsByRange: (startDate: string, endDate: string) => {
        const state = get();
        return state.records.filter(
          (r) => r.date >= startDate && r.date <= endDate
        );
      },

      getMetrics: () => get().metrics,

      clearHistory: () =>
        set({
          records: [],
          metrics: calculateMetrics([]),
          last7Days: [],
        }),
    }),
    {
      name: 'health-v2-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper: obtener últimos 7 días
function getLast7Days(records: SleepRecord[]) {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = getISODate(date);

    const record = records.find((r) => r.date === dateStr);
    const hours = record ? calculateSleepHours(record.timeIn, record.timeOut) : 0;
    const quality = record?.quality || 0;

    last7Days.push({
      date: dateStr,
      hours: Math.round(hours * 10) / 10,
      quality,
    });
  }
  return last7Days;
}
