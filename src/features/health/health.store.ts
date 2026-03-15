import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SleepQuality = 'malo' | 'regular' | 'bueno' | 'excelente';
export type TrendDirection = 'mejorando' | 'empeorando' | 'estable';

export interface SleepRecord {
  id: string;
  date: string; // YYYY-MM-DD
  bedTime: string; // HH:MM
  wakeTime: string; // HH:MM
  duration: number; // horas decimales
  quality: SleepQuality;
  notes?: string;
}

export interface WeeklyPoint {
  day: string;
  date: string;
  hours: number | null;
  quality: SleepQuality | null;
}

export interface SleepStats {
  weeklyAverage: number;
  monthlyAverage: number;
  bestStreak: number;
  currentStreak: number;
  totalRecords: number;
  sleepDebt: number;
  trendDirection: TrendDirection;
}

interface LegacySleepRecord {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string;
  quality: 1 | 2 | 3 | 4 | 5;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

interface LegacyMetrics {
  averageSleep: number;
  consecutiveDays: number;
  bestDay: number;
  worstDay: number;
  goalMet: boolean;
  lastRecordDate: string | null;
  totalRecordsMonth: number;
}

export interface SleepLog {
  date: string;
  wakeTime?: string;
  bedTime?: string;
  quality?: number;
}

interface AddSleepRecordInput {
  date: string;
  bedTime?: string;
  wakeTime?: string;
  timeIn?: string;
  timeOut?: string;
  quality: SleepQuality | 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

interface HealthState {
  sleepRecords: SleepRecord[];
  sleepStats: SleepStats;

  addSleepRecord: (record: AddSleepRecordInput) => void;
  updateSleepRecord: (
    id: string,
    changes: Partial<Omit<SleepRecord, 'id' | 'duration'>>
  ) => void;
  deleteSleepRecord: (id: string) => void;
  getSleepHistory: (days: number) => SleepRecord[];
  getWeeklyData: () => WeeklyPoint[];

  records: LegacySleepRecord[];
  metrics: LegacyMetrics;
  last7Days: Array<{ date: string; hours: number; quality: number }>;

  targetWakeTime: string;
  targetBedTime: string;
  wakeAlarmEnabled: boolean;
  bedAlarmEnabled: boolean;
  sleepLogs: SleepLog[];

  setTargets: (wake: string, bed: string) => void;
  toggleAlarm: (type: 'wake' | 'bed') => void;
  logAction: (type: 'wake' | 'sleep') => void;
  updateLog: (date: string, field: 'wakeTime' | 'bedTime', value: string) => void;
  getTodayLog: () => SleepLog | undefined;
  getWeekLogs: () => SleepLog[];

  getSleepRecordsByRange: (startDate: string, endDate: string) => SleepRecord[];
  getMetrics: () => LegacyMetrics;
  clearHistory: () => void;
}

const GOAL_HOURS = 8;
const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const emptyStats: SleepStats = {
  weeklyAverage: 0,
  monthlyAverage: 0,
  bestStreak: 0,
  currentStreak: 0,
  totalRecords: 0,
  sleepDebt: 0,
  trendDirection: 'estable',
};

const emptyLegacyMetrics: LegacyMetrics = {
  averageSleep: 0,
  consecutiveDays: 0,
  bestDay: 0,
  worstDay: 0,
  goalMet: false,
  lastRecordDate: null,
  totalRecordsMonth: 0,
};

function toISODate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function fromISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function calculateDuration(bedTime: string, wakeTime: string): number {
  let diff = toMinutes(wakeTime) - toMinutes(bedTime);
  if (diff < 0) diff += 24 * 60;
  return round1(diff / 60);
}

function normalizeQuality(value: AddSleepRecordInput['quality']): SleepQuality {
  if (typeof value === 'string') return value;
  if (value <= 2) return 'malo';
  if (value === 3) return 'regular';
  if (value === 4) return 'bueno';
  return 'excelente';
}

function qualityToLegacy(value: SleepQuality): 1 | 2 | 3 | 4 | 5 {
  if (value === 'malo') return 2;
  if (value === 'regular') return 3;
  if (value === 'bueno') return 4;
  return 5;
}

function qualityFromDuration(hours: number): SleepQuality {
  if (hours >= 7.5) return 'excelente';
  if (hours >= 6) return 'bueno';
  if (hours >= 4) return 'regular';
  return 'malo';
}

function buildWeeklyData(records: SleepRecord[]): WeeklyPoint[] {
  const recordMap = new Map(records.map(record => [record.date, record]));
  const points: WeeklyPoint[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateIso = toISODate(date);
    const match = recordMap.get(dateIso);

    points.push({
      day: DAY_LABELS[date.getDay()],
      date: dateIso,
      hours: match ? match.duration : null,
      quality: match ? match.quality : null,
    });
  }

  return points;
}

function calculateStreaks(records: SleepRecord[]): { bestStreak: number; currentStreak: number } {
  if (records.length === 0) return { bestStreak: 0, currentStreak: 0 };

  const sorted = [...records].sort(
    (a, b) => fromISODate(a.date).getTime() - fromISODate(b.date).getTime()
  );

  let bestStreak = 0;
  let runningStreak = 0;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (current.duration < 7) {
      runningStreak = 0;
      continue;
    }

    if (runningStreak === 0) {
      runningStreak = 1;
    } else {
      const previousDate = fromISODate(sorted[i - 1].date);
      const currentDate = fromISODate(current.date);
      const diffDays = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
      runningStreak = diffDays <= 1.01 ? runningStreak + 1 : 1;
    }

    if (runningStreak > bestStreak) bestStreak = runningStreak;
  }

  const recordMap = new Map(records.map(record => [record.date, record]));
  let currentStreak = 0;

  for (let i = 0; i < 365; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateIso = toISODate(date);
    const record = recordMap.get(dateIso);

    if (!record || record.duration < 7) break;
    currentStreak++;
  }

  return { bestStreak, currentStreak };
}

function calculateTrendDirection(records: SleepRecord[]): TrendDirection {
  const now = new Date();

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - 6);
  const thisWeekStartIso = toISODate(thisWeekStart);

  const previousWeekEnd = new Date(now);
  previousWeekEnd.setDate(now.getDate() - 7);
  const previousWeekStart = new Date(now);
  previousWeekStart.setDate(now.getDate() - 13);

  const previousWeekStartIso = toISODate(previousWeekStart);
  const previousWeekEndIso = toISODate(previousWeekEnd);

  const currentWeekRecords = records.filter(record => record.date >= thisWeekStartIso);
  const previousWeekRecords = records.filter(
    record => record.date >= previousWeekStartIso && record.date <= previousWeekEndIso
  );

  if (currentWeekRecords.length === 0 || previousWeekRecords.length === 0) return 'estable';

  const currentAverage = average(currentWeekRecords.map(record => record.duration));
  const previousAverage = average(previousWeekRecords.map(record => record.duration));

  if (currentAverage - previousAverage >= 0.3) return 'mejorando';
  if (previousAverage - currentAverage >= 0.3) return 'empeorando';
  return 'estable';
}

function calculateSleepStats(records: SleepRecord[]): SleepStats {
  if (records.length === 0) return emptyStats;

  const now = new Date();

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const weekStartIso = toISODate(weekStart);

  const monthStart = new Date(now);
  monthStart.setDate(now.getDate() - 29);
  const monthStartIso = toISODate(monthStart);

  const weeklyRecords = records.filter(record => record.date >= weekStartIso);
  const monthlyRecords = records.filter(record => record.date >= monthStartIso);

  const streaks = calculateStreaks(records);

  const sleepDebt = round1(
    records.reduce((acc, record) => acc + Math.max(0, GOAL_HOURS - record.duration), 0)
  );

  return {
    weeklyAverage: average(weeklyRecords.map(record => record.duration)),
    monthlyAverage: average(monthlyRecords.map(record => record.duration)),
    bestStreak: streaks.bestStreak,
    currentStreak: streaks.currentStreak,
    totalRecords: records.length,
    sleepDebt,
    trendDirection: calculateTrendDirection(records),
  };
}

function toLegacy(records: SleepRecord[]): {
  records: LegacySleepRecord[];
  metrics: LegacyMetrics;
  last7Days: Array<{ date: string; hours: number; quality: number }>;
} {
  const legacyRecords: LegacySleepRecord[] = records.map(record => ({
    id: record.id,
    date: record.date,
    timeIn: record.bedTime,
    timeOut: record.wakeTime,
    quality: qualityToLegacy(record.quality),
    notes: record.notes ?? '',
    createdAt: Number(record.id) || Date.now(),
    updatedAt: Date.now(),
  }));

  const allHours = records.map(record => record.duration);
  const allQuality = legacyRecords.map(record => record.quality);
  const currentMonthKey = toISODate().slice(0, 7);

  const metrics: LegacyMetrics = {
    averageSleep: average(allHours),
    consecutiveDays: calculateStreaks(records).currentStreak,
    bestDay: allQuality.length ? Math.max(...allQuality) : 0,
    worstDay: allQuality.length ? Math.min(...allQuality) : 0,
    goalMet: average(allHours) >= GOAL_HOURS,
    lastRecordDate: records[0]?.date ?? null,
    totalRecordsMonth: legacyRecords.filter(record => record.date.startsWith(currentMonthKey)).length,
  };

  const last7Days = buildWeeklyData(records).map(point => ({
    date: point.date,
    hours: point.hours ?? 0,
    quality: point.quality ? qualityToLegacy(point.quality) : 0,
  }));

  return { records: legacyRecords, metrics, last7Days };
}

function normalizeInput(record: AddSleepRecordInput): Omit<SleepRecord, 'id'> {
  const bedTime = record.bedTime ?? record.timeIn ?? '23:00';
  const wakeTime = record.wakeTime ?? record.timeOut ?? '07:00';
  const quality = normalizeQuality(record.quality);

  return {
    date: record.date,
    bedTime,
    wakeTime,
    duration: calculateDuration(bedTime, wakeTime),
    quality,
    notes: record.notes,
  };
}

function recomputeDerived(records: SleepRecord[]) {
  const sortedRecords = [...records].sort(
    (a, b) => fromISODate(b.date).getTime() - fromISODate(a.date).getTime()
  );

  const sleepStats = calculateSleepStats(sortedRecords);
  const legacy = toLegacy(sortedRecords);

  return {
    sleepRecords: sortedRecords,
    sleepStats,
    records: legacy.records,
    metrics: legacy.metrics,
    last7Days: legacy.last7Days,
  };
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      sleepRecords: [],
      sleepStats: emptyStats,

      records: [],
      metrics: emptyLegacyMetrics,
      last7Days: [],

      targetWakeTime: '07:00',
      targetBedTime: '23:00',
      wakeAlarmEnabled: false,
      bedAlarmEnabled: false,
      sleepLogs: [],

      addSleepRecord: (record) =>
        set(state => {
          const normalized = normalizeInput(record);
          const withoutSameDate = state.sleepRecords.filter(item => item.date !== normalized.date);
          const nextRecords = [{ ...normalized, id: Date.now().toString() }, ...withoutSameDate];
          return {
            ...state,
            ...recomputeDerived(nextRecords),
          };
        }),

      updateSleepRecord: (id, changes) =>
        set(state => {
          const updatedRecords = state.sleepRecords.map(record => {
            if (record.id !== id) return record;
            const next = { ...record, ...changes };
            const bedTime = next.bedTime;
            const wakeTime = next.wakeTime;
            return {
              ...next,
              duration: calculateDuration(bedTime, wakeTime),
              quality: next.quality ?? qualityFromDuration(next.duration),
            };
          });

          return {
            ...state,
            ...recomputeDerived(updatedRecords),
          };
        }),

      deleteSleepRecord: (id) =>
        set(state => {
          const filtered = state.sleepRecords.filter(record => record.id !== id);
          return {
            ...state,
            ...recomputeDerived(filtered),
          };
        }),

      getSleepHistory: (days) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (days - 1));
        const cutoffIso = toISODate(cutoff);

        return get().sleepRecords.filter(record => record.date >= cutoffIso);
      },

      getWeeklyData: () => buildWeeklyData(get().sleepRecords),

      setTargets: (wake, bed) => set({ targetWakeTime: wake, targetBedTime: bed }),

      toggleAlarm: (type) =>
        set(state => ({
          wakeAlarmEnabled: type === 'wake' ? !state.wakeAlarmEnabled : state.wakeAlarmEnabled,
          bedAlarmEnabled: type === 'bed' ? !state.bedAlarmEnabled : state.bedAlarmEnabled,
        })),

      logAction: (type) =>
        set(state => {
          const today = toISODate();
          const now = new Date();
          const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const index = state.sleepLogs.findIndex(item => item.date === today);
          const updated = [...state.sleepLogs];

          if (index >= 0) {
            updated[index] = {
              ...updated[index],
              [type === 'wake' ? 'wakeTime' : 'bedTime']: nowTime,
            };
          } else {
            updated.unshift({
              date: today,
              [type === 'wake' ? 'wakeTime' : 'bedTime']: nowTime,
            });
          }

          return { sleepLogs: updated };
        }),

      updateLog: (date, field, value) =>
        set(state => {
          const index = state.sleepLogs.findIndex(item => item.date === date);
          if (index < 0) return state;

          const updated = [...state.sleepLogs];
          updated[index] = { ...updated[index], [field]: value };
          return { sleepLogs: updated };
        }),

      getTodayLog: () => {
        const today = toISODate();
        return get().sleepLogs.find(item => item.date === today);
      },

      getWeekLogs: () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoIso = toISODate(weekAgo);
        return get().sleepLogs.filter(item => item.date >= weekAgoIso);
      },

      getSleepRecordsByRange: (startDate, endDate) =>
        get().sleepRecords.filter(record => record.date >= startDate && record.date <= endDate),

      getMetrics: () => get().metrics,

      clearHistory: () =>
        set({
          sleepRecords: [],
          sleepStats: emptyStats,
          records: [],
          metrics: emptyLegacyMetrics,
          last7Days: [],
          sleepLogs: [],
        }),
    }),
    {
      name: 'health-v3-storage',
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState: unknown) => {
        const state = persistedState as Partial<HealthState> | undefined;
        if (!state) return state;

        if (!state.sleepRecords && Array.isArray(state.records)) {
          const migrated: SleepRecord[] = state.records.map(record => {
            const legacyQuality = typeof record.quality === 'number' ? record.quality : 4;
            const quality = normalizeQuality(legacyQuality as 1 | 2 | 3 | 4 | 5);
            const bedTime = record.timeIn || '23:00';
            const wakeTime = record.timeOut || '07:00';

            return {
              id: String(record.id),
              date: record.date,
              bedTime,
              wakeTime,
              duration: calculateDuration(bedTime, wakeTime),
              quality,
              notes: record.notes || '',
            };
          });

          return {
            ...state,
            ...recomputeDerived(migrated),
          };
        }

        return state;
      },
    }
  )
);
