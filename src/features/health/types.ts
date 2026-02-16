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

// Store Type
export interface HealthState extends HealthStats {
  addSleepRecord: (record: Omit<SleepRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSleepRecord: (id: string, record: Partial<SleepRecord>) => void;
  deleteSleepRecord: (id: string) => void;
  getSleepRecordsByRange: (startDate: string, endDate: string) => SleepRecord[];
  getMetrics: () => HealthMetrics;
  clearHistory: () => void;
}
