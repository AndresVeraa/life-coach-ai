// ===== Audit Analytics Types =====

export type DistractionCategory =
  | 'redes-sociales'
  | 'ruido'
  | 'pereza'
  | 'personas'
  | 'entretenimiento'
  | 'otro';

export interface AuditEntry {
  id: string;
  timestamp: number;
  type: 'focus' | 'distraction';
  durationMinutes: number;
  category: string; // Ej: 'Estudio', 'Instagram', 'Ruido'
  note?: string;
}

export interface AuditStats {
  score: number;
  focusTime: number;
  lostTime: number;
  topDistraction: string;
  sessionCount: number;
}

export interface AuditState {
  entries: AuditEntry[];
  addEntry: (entry: Omit<AuditEntry, 'id'>) => void;
  removeEntry: (id: string) => void;
  getStats: (range: 'day' | 'week' | 'month') => AuditStats;
  getEntries: (range: 'day' | 'week' | 'month') => AuditEntry[];
  clearHistory: () => void;
}

// Category config for distraction radar
export const DISTRACTION_CATEGORIES: Record<
  DistractionCategory,
  { emoji: string; label: string; color: string; bg: string; examples: string[] }
> = {
  'redes-sociales': {
    emoji: '📱',
    label: 'Redes Sociales',
    color: '#3B82F6',
    bg: '#EFF6FF',
    examples: ['Instagram', 'TikTok', 'Twitter', 'WhatsApp'],
  },
  ruido: {
    emoji: '🔊',
    label: 'Ruido / Ambiente',
    color: '#F59E0B',
    bg: '#FFFBEB',
    examples: ['Vecinos', 'Construcción', 'Música ajena', 'Tráfico'],
  },
  pereza: {
    emoji: '😴',
    label: 'Pereza / Fatiga',
    color: '#EF4444',
    bg: '#FEF2F2',
    examples: ['No me levanto', 'Postergo', 'Sin ganas', 'Cansancio'],
  },
  personas: {
    emoji: '👥',
    label: 'Personas',
    color: '#10B981',
    bg: '#ECFDF5',
    examples: ['Conversaciones', 'Interrupciones', 'Llamadas'],
  },
  entretenimiento: {
    emoji: '🎮',
    label: 'Entretenimiento',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    examples: ['Videos', 'Juegos', 'Series', 'YouTube'],
  },
  otro: {
    emoji: '🤷',
    label: 'Otro',
    color: '#6B7280',
    bg: '#F3F4F6',
    examples: ['Varios', 'Tareas admin', 'Imprevistos'],
  },
};

// Focus categories
export const FOCUS_CATEGORIES = [
  { label: 'Estudio', emoji: '📚' },
  { label: 'Trabajo', emoji: '💼' },
  { label: 'Lectura', emoji: '📖' },
  { label: 'Proyecto', emoji: '🚀' },
  { label: 'Ejercicio', emoji: '🏋️' },
  { label: 'Meditación', emoji: '🧘' },
];
