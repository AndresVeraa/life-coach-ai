// Sleep & Health Types
export interface SleepRecord {
  id: string;
  date: string; // ISO date: "2026-02-15"
  timeIn: string; // HH:mm formato 24h
  timeOut: string; // HH:mm formato 24h
  quality: 1 | 2 | 3 | 4 | 5; // Escala 1-5 (Muy malo a Excelente)
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface HealthMetrics {
  averageSleep: number; // Horas en decimales (7.5, 8.2, etc)
  consecutiveDays: number; // Días consecutivos registrados
  bestDay: number; // Mejor calidad registrada (1-5)
  worstDay: number; // Peor calidad registrada (1-5)
  goalMet: boolean; // Si cumplió meta de 8 horas
  lastRecordDate: string | null;
  totalRecordsMonth: number;
}

export interface HealthStats {
  records: SleepRecord[];
  metrics: HealthMetrics;
  last7Days: Array<{
    date: string;
    hours: number;
    quality: number;
  }>;
}

// --- Circadian Rhythm Types ---
export interface SleepLog {
  date: string;        // ISO date: "2026-02-15"
  wakeTime?: string;   // HH:mm — hora real que despertó
  bedTime?: string;    // HH:mm — hora real que fue a dormir
  quality?: number;    // 1-5
}

export interface CircadianState {
  targetWakeTime: string;   // HH:mm meta de despertar
  targetBedTime: string;    // HH:mm meta de dormir
  wakeAlarmEnabled: boolean;
  bedAlarmEnabled: boolean;
  sleepLogs: SleepLog[];
}

export interface CircadianActions {
  setTargets: (wake: string, bed: string) => void;
  toggleAlarm: (type: 'wake' | 'bed') => void;
  logAction: (type: 'wake' | 'sleep') => void;
  updateLog: (date: string, field: 'wakeTime' | 'bedTime', value: string) => void;
  getTodayLog: () => SleepLog | undefined;
  getWeekLogs: () => SleepLog[];
}

// Store Type
export interface HealthState extends HealthStats, CircadianState, CircadianActions {
  addSleepRecord: (record: Omit<SleepRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSleepRecord: (id: string, record: Partial<SleepRecord>) => void;
  deleteSleepRecord: (id: string) => void;
  getSleepRecordsByRange: (startDate: string, endDate: string) => SleepRecord[];
  getMetrics: () => HealthMetrics;
  clearHistory: () => void;
}
