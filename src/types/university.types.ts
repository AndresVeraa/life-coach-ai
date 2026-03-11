/**
 * Tipos para el módulo de Universidad / Calendario Académico
 * Life Coach AI - Semestre 2026-1
 */

// ============================================
// TIPOS BASE
// ============================================

export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';

export type SubjectType = 'tecnica' | 'matematica' | 'teorica' | 'laboratorio' | 'humanistica';

export type BlockType = 'clase' | 'estudio' | 'evaluacion' | 'repaso';

export type CutPeriod = 'corte1' | 'corte2' | 'corte3';

export type AcademicEventType = 'evaluacion' | 'registro_notas' | 'corte' | 'festivo' | 'personal' | 'cancelacion';

export type AlertLevel = 'ok' | 'warning' | 'critical';

// ============================================
// CALENDARIO ACADÉMICO
// ============================================

export interface AcademicEvent {
  id: string;
  title: string;
  startDate: string;        // ISO date "2026-04-13"
  endDate: string;          // ISO date "2026-04-18"
  type: AcademicEventType;
  cutPeriod?: CutPeriod;
  color: string;
  isHighPriority: boolean;  // semanas de examen = true
  subjectIds?: string[];    // qué materias afecta
  description?: string;
}

// ============================================
// MATERIAS
// ============================================

export interface ClassSession {
  id: string;
  day: DayOfWeek;
  startTime: string;        // "08:00"
  endTime: string;          // "10:00"
  location?: string;
}

export interface Subject {
  id: string;
  code: string;             // "167394"
  name: string;
  credits: number;          // 1-6
  type: SubjectType;
  weeklyClassHours: number;
  weeklyStudyHoursNeeded: number;   // calculado: Math.ceil((credits * 48 / 16) - weeklyClassHours)
  classSessions: ClassSession[];
  color: string;
  semester: number;
  professor?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectFormData {
  code: string;
  name: string;
  credits: number;
  type: SubjectType;
  weeklyClassHours: number;
  classSessions: Omit<ClassSession, 'id'>[];
  color: string;
  professor?: string;
  notes?: string;
}

// ============================================
// BLOQUES DE ESTUDIO
// ============================================

export interface StudyBlock {
  id: string;
  subjectId: string;
  day: DayOfWeek;
  date?: string;            // fecha específica si aplica "2026-04-15"
  startTime: string;        // "14:00"
  endTime: string;          // "16:00"
  type: BlockType;
  isAISuggested: boolean;
  isCompleted: boolean;
  cutPeriod: CutPeriod;
  createdAt: string;
}

// ============================================
// RESUMEN SEMANAL
// ============================================

export interface SubjectWeeklySummary {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  hoursNeeded: number;      // aumenta en semanas de examen
  hoursPlanned: number;
  hoursCompleted: number;
  deficit: number;          // hoursNeeded - hoursPlanned (negativo = exceso)
}

export interface WeeklyStudySummary {
  weekStart: string;        // ISO date del lunes
  weekEnd: string;          // ISO date del sábado
  isEvaluationWeek: boolean;
  isPreEvaluationWeek: boolean;
  cutPeriod: CutPeriod;
  bySubject: SubjectWeeklySummary[];
  totalHoursNeeded: number;
  totalHoursPlanned: number;
  totalHoursCompleted: number;
  alertLevel: AlertLevel;
  deficitHours: number;
  surplusHours: number;
}

// ============================================
// CALENDARIO 2026-1 CONSTANTS
// ============================================

export const ACADEMIC_CALENDAR_2026_1 = {
  sempicoesterStart: '2026-03-02',
  semesterEnd: '2026-06-27',
  totalWeeks: 16,
  
  // PRIMER CORTE
  corte1: {
    start: '2026-03-02',
    end: '2026-04-18',
    weeks: 7, // 6 semanas + 1 Semana Santa
    evaluationWeek: {
      start: '2026-04-13',
      end: '2026-04-18',
    },
    gradeRegistration: {
      start: '2026-04-20',
      end: '2026-04-25',
    },
  },
  
  // SEGUNDO CORTE
  corte2: {
    start: '2026-04-20',
    end: '2026-05-23',
    weeks: 5,
    evaluationWeek: {
      start: '2026-05-19',
      end: '2026-05-23',
    },
    gradeRegistration: {
      start: '2026-05-25',
      end: '2026-05-30',
    },
  },
  
  // CANCELACIONES
  cancellation: {
    start: '2026-06-01',
    end: '2026-06-06',
  },
  
  // TERCER CORTE
  corte3: {
    start: '2026-05-25',
    end: '2026-06-27',
    weeks: 5,
    evaluationWeek: {
      start: '2026-06-22',
      end: '2026-06-27',
    },
    gradeRegistration: {
      start: '2026-06-22',
      end: '2026-06-27',
    },
  },
} as const;

// ============================================
// COLORES POR TIPO DE MATERIA
// ============================================

export const SUBJECT_TYPE_COLORS: Record<SubjectType, string> = {
  tecnica: '#3B82F6',       // Azul
  matematica: '#10B981',    // Verde
  teorica: '#F97316',       // Naranja
  laboratorio: '#8B5CF6',   // Morado
  humanistica: '#EAB308',   // Amarillo
};

export const SUBJECT_TYPE_LABELS: Record<SubjectType, string> = {
  tecnica: 'Técnica',
  matematica: 'Matemática',
  teorica: 'Teórica',
  laboratorio: 'Laboratorio',
  humanistica: 'Humanística',
};

export const SUBJECT_TYPE_ICONS: Record<SubjectType, string> = {
  tecnica: '💻',
  matematica: '📐',
  teorica: '📖',
  laboratorio: '🔬',
  humanistica: '🎭',
};

// ============================================
// COLORES PREDEFINIDOS PARA MATERIAS
// ============================================

export const PREDEFINED_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F97316', // Orange
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#84CC16', // Lime
];

// ============================================
// DÍAS DE LA SEMANA
// ============================================

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

export const DAYS_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
};

export const DAYS_OF_WEEK_SHORT: Record<DayOfWeek, string> = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sáb',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calcula las horas de estudio independiente necesarias por semana
 * Fórmula: Math.ceil((créditos * 48 / 16) - horasClaseSemanales)
 */
export function calculateWeeklyStudyHours(credits: number, weeklyClassHours: number): number {
  const totalHoursPerSemester = credits * 48;
  const hoursPerWeek = totalHoursPerSemester / 16;
  const independentStudyHours = hoursPerWeek - weeklyClassHours;
  return Math.max(0, Math.ceil(independentStudyHours));
}

/**
 * Calcula el total de horas en el semestre
 */
export function calculateTotalSemesterHours(credits: number): number {
  return credits * 48;
}

/**
 * Ajusta las horas según si es semana de evaluación
 */
export function adjustHoursForEvaluationWeek(
  baseHours: number,
  isEvaluationWeek: boolean,
  isPreEvaluationWeek: boolean
): number {
  if (isEvaluationWeek) {
    return Math.ceil(baseHours * 1.5); // +50%
  }
  if (isPreEvaluationWeek) {
    return Math.ceil(baseHours * 1.25); // +25%
  }
  return baseHours;
}

/**
 * Genera un ID único
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Convierte hora string a minutos desde medianoche
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a hora string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calcula la duración en horas entre dos tiempos
 */
export function calculateDurationHours(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return (endMinutes - startMinutes) / 60;
}
