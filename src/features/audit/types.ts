// Audit & Distraction Types
export type DistractionCategory = 'redes-sociales' | 'personas' | 'entretenimiento' | 'tareas-administrativas' | 'otro';

export interface DistractionEvent {
  id: string;
  category: DistractionCategory;
  description: string;
  estimatedMinutes: number;
  timestamp: number;
  date: string; // ISO date
}

export interface AuditSession {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  distractions: DistractionEvent[];
  totalMinutesLost: number;
  completedAudit: boolean; // ¿Usuario completó el resumen?
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface AuditMetrics {
  totalSessions: number; // Cuántos días auditados
  totalMinutesLost: number; // Total histórico
  averageMinutesPerDay: number; // Promedio diario
  topCategory: DistractionCategory | null; // Categoría más frecuente
  categoryBreakdown: {
    [key in DistractionCategory]: {
      count: number;
      totalMinutes: number;
      percentage: number;
    };
  };
  last7Days: Array<{
    date: string;
    minutesLost: number;
    distractionCount: number;
  }>;
  weeklyTrend: 'improving' | 'declining' | 'stable'; // Tendencia de la semana
}

export interface AuditStore {
  // Estado
  sessions: AuditSession[];
  currentSessionId: string | null;
  metrics: AuditMetrics;

  // Acciones
  createSession: () => void;
  addDistraction: (
    category: DistractionCategory,
    description: string,
    estimatedMinutes: number
  ) => void;
  editDistraction: (id: string, updates: Partial<DistractionEvent>) => void;
  deleteDistraction: (id: string) => void;
  completeSession: (notes: string) => void;
  getCurrentSession: () => AuditSession | null;
  getSessionsByDate: (date: string) => AuditSession | null;
  getMetrics: () => AuditMetrics;
  getSessions: () => AuditSession[];
  clearHistory: () => void;
}

// Mapping de categorías a emojis y colores
export const CATEGORY_CONFIG: Record<
  DistractionCategory,
  { emoji: string; label: string; color: string; examples: string[] }
> = {
  'redes-sociales': {
    emoji: '📱',
    label: 'Redes Sociales',
    color: 'bg-blue-100',
    examples: ['Instagram', 'TikTok', 'Twitter', 'Facebook'],
  },
  personas: {
    emoji: '👥',
    label: 'Personas',
    color: 'bg-green-100',
    examples: ['Conversaciones', 'Interrupciones', 'Llamadas', 'Mensajes'],
  },
  entretenimiento: {
    emoji: '🎮',
    label: 'Entretenimiento',
    color: 'bg-purple-100',
    examples: ['Videos', 'Juegos', 'Series', 'Música'],
  },
  'tareas-administrativas': {
    emoji: '📋',
    label: 'Tareas Admin',
    color: 'bg-yellow-100',
    examples: ['Emails', 'Reuniones', 'Reportes', 'Documentos'],
  },
  otro: {
    emoji: '🤷',
    label: 'Otro',
    color: 'bg-gray-100',
    examples: ['Descansos', 'Distracciones varias'],
  },
};
