/**
 * University Store - Gestión del Calendario Académico
 * Life Coach AI - Semestre 2026-1
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Subject,
  SubjectFormData,
  StudyBlock,
  AcademicEvent,
  WeeklyStudySummary,
  SubjectWeeklySummary,
  CutPeriod,
  DayOfWeek,
  BlockType,
  AlertLevel,
  ACADEMIC_CALENDAR_2026_1,
  SUBJECT_TYPE_COLORS,
  DAYS_OF_WEEK,
  calculateWeeklyStudyHours,
  adjustHoursForEvaluationWeek,
  generateId,
  timeToMinutes,
  minutesToTime,
  calculateDurationHours,
} from '@/types/university.types';
import { useScheduleStore, ScheduleBlock } from '@/store/schedule.store';
import { useTasksStore, Task } from '@/store/tasks.store';

// ============================================
// TIPOS DEL STORE
// ============================================

interface UniversityState {
  // Data
  subjects: Subject[];
  studyBlocks: StudyBlock[];
  academicEvents: AcademicEvent[];
  isInitialized: boolean;
  
  // Actions - Initialization
  initializeAcademicCalendar2026: () => void;
  
  // Actions - Subjects
  addSubject: (data: SubjectFormData) => Subject;
  updateSubject: (id: string, data: Partial<SubjectFormData>) => void;
  deleteSubject: (id: string) => void;
  getSubjectById: (id: string) => Subject | undefined;
  
  // Actions - Study Blocks
  generateSmartStudyPlan: (weekStart: string) => StudyBlock[];
  addStudyBlock: (block: Omit<StudyBlock, 'id' | 'createdAt'>) => StudyBlock;
  updateStudyBlock: (id: string, data: Partial<StudyBlock>) => void;
  deleteStudyBlock: (id: string) => void;
  markBlockCompleted: (blockId: string) => void;
  getBlocksForDate: (date: string) => StudyBlock[];
  getBlocksForWeek: (weekStart: string) => StudyBlock[];
  
  // Actions - Academic Calendar
  addAcademicEvent: (event: Omit<AcademicEvent, 'id'>) => AcademicEvent;
  getUpcomingAcademicEvents: (days: number) => AcademicEvent[];
  getDaysUntilNextEvaluation: () => number;
  getCutPeriodForDate: (date: string) => CutPeriod;
  isEvaluationWeek: (date: string) => boolean;
  isPreEvaluationWeek: (date: string) => boolean;
  
  // Actions - Summaries
  getWeeklySummary: (weekStart: string) => WeeklyStudySummary;
  getTodaySchedule: () => { classes: StudyBlock[]; studyBlocks: StudyBlock[] };
  
  // Utility
  reset: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene el lunes de la semana para una fecha dada
 */
function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Obtiene todas las fechas de una semana
 */
function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(weekStart);
  for (let i = 0; i < 6; i++) { // Lunes a Sábado
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Obtiene el día de la semana para una fecha
 */
function getDayOfWeek(dateStr: string): DayOfWeek {
  const date = new Date(dateStr);
  const dayIndex = date.getDay();
  const days: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  // Ajustar: getDay() devuelve 0 para domingo
  if (dayIndex === 0) return 'sabado'; // No debería pasar, pero por si acaso
  return days[dayIndex - 1];
}

/**
 * Calcula días entre dos fechas
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Fecha de hoy en formato ISO
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Verifica si una fecha está entre dos fechas
 */
function isDateInRange(date: string, start: string, end: string): boolean {
  const d = new Date(date);
  const s = new Date(start);
  const e = new Date(end);
  return d >= s && d <= e;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  subjects: [] as Subject[],
  studyBlocks: [] as StudyBlock[],
  academicEvents: [] as AcademicEvent[],
  isInitialized: false,
};

// ============================================
// STORE
// ============================================

export const useUniversityStore = create<UniversityState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================
      // INITIALIZATION
      // ========================================
      
      initializeAcademicCalendar2026: () => {
        const { isInitialized } = get();
        if (isInitialized) return;

        const calendar = ACADEMIC_CALENDAR_2026_1;
        const events: AcademicEvent[] = [];

        // Inicio de clases
        events.push({
          id: generateId(),
          title: '🎓 Inicio de Clases 2026-1',
          startDate: calendar.sempicoesterStart,
          endDate: calendar.sempicoesterStart,
          type: 'corte',
          cutPeriod: 'corte1',
          color: '#4F46E5',
          isHighPriority: false,
          description: 'Inicio del semestre académico 2026-1',
        });

        // PRIMER CORTE
        events.push({
          id: generateId(),
          title: '📝 Semana de Evaluaciones - Primer Corte',
          startDate: calendar.corte1.evaluationWeek.start,
          endDate: calendar.corte1.evaluationWeek.end,
          type: 'evaluacion',
          cutPeriod: 'corte1',
          color: '#EF4444',
          isHighPriority: true,
          description: 'Exámenes del primer corte',
        });

        events.push({
          id: generateId(),
          title: '📊 Registro de Notas - Primer Corte',
          startDate: calendar.corte1.gradeRegistration.start,
          endDate: calendar.corte1.gradeRegistration.end,
          type: 'registro_notas',
          cutPeriod: 'corte1',
          color: '#F97316',
          isHighPriority: false,
          description: 'Período de registro de notas primer corte',
        });

        // SEGUNDO CORTE
        events.push({
          id: generateId(),
          title: '📝 Semana de Evaluaciones - Segundo Corte',
          startDate: calendar.corte2.evaluationWeek.start,
          endDate: calendar.corte2.evaluationWeek.end,
          type: 'evaluacion',
          cutPeriod: 'corte2',
          color: '#EF4444',
          isHighPriority: true,
          description: 'Exámenes del segundo corte',
        });

        events.push({
          id: generateId(),
          title: '📊 Registro de Notas - Segundo Corte',
          startDate: calendar.corte2.gradeRegistration.start,
          endDate: calendar.corte2.gradeRegistration.end,
          type: 'registro_notas',
          cutPeriod: 'corte2',
          color: '#F97316',
          isHighPriority: false,
          description: 'Período de registro de notas segundo corte',
        });

        // CANCELACIONES
        events.push({
          id: generateId(),
          title: '⚠️ Cancelación de Asignaturas/Semestre',
          startDate: calendar.cancellation.start,
          endDate: calendar.cancellation.end,
          type: 'cancelacion',
          color: '#DC2626',
          isHighPriority: true,
          description: 'Último plazo para cancelar asignaturas o semestre',
        });

        // TERCER CORTE
        events.push({
          id: generateId(),
          title: '📝 Semana de Evaluaciones - Tercer Corte',
          startDate: calendar.corte3.evaluationWeek.start,
          endDate: calendar.corte3.evaluationWeek.end,
          type: 'evaluacion',
          cutPeriod: 'corte3',
          color: '#EF4444',
          isHighPriority: true,
          description: 'Exámenes finales del tercer corte',
        });

        events.push({
          id: generateId(),
          title: '📊 Registro de Notas - Tercer Corte',
          startDate: calendar.corte3.gradeRegistration.start,
          endDate: calendar.corte3.gradeRegistration.end,
          type: 'registro_notas',
          cutPeriod: 'corte3',
          color: '#F97316',
          isHighPriority: false,
          description: 'Período de registro de notas finales',
        });

        // Fin de semestre
        events.push({
          id: generateId(),
          title: '🎉 Fin del Semestre 2026-1',
          startDate: calendar.semesterEnd,
          endDate: calendar.semesterEnd,
          type: 'corte',
          cutPeriod: 'corte3',
          color: '#10B981',
          isHighPriority: false,
          description: 'Finalización del semestre académico',
        });

        set({ academicEvents: events, isInitialized: true });
      },

      // ========================================
      // SUBJECTS
      // ========================================

      addSubject: (data: SubjectFormData) => {
        const weeklyStudyHoursNeeded = calculateWeeklyStudyHours(
          data.credits,
          data.weeklyClassHours
        );

        // Asignar color sugerido si no se especificó
        const color = data.color || SUBJECT_TYPE_COLORS[data.type];

        const newSubject: Subject = {
          id: generateId(),
          code: data.code,
          name: data.name,
          credits: data.credits,
          type: data.type,
          weeklyClassHours: data.weeklyClassHours,
          weeklyStudyHoursNeeded,
          classSessions: data.classSessions.map(session => ({
            ...session,
            id: generateId(),
          })),
          color,
          semester: 1, // 2026-1
          professor: data.professor,
          notes: data.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set(state => ({
          subjects: [...state.subjects, newSubject],
        }));

        return newSubject;
      },

      updateSubject: (id: string, data: Partial<SubjectFormData>) => {
        set(state => ({
          subjects: state.subjects.map(subject => {
            if (subject.id !== id) return subject;

            const updated = { ...subject, ...data };
            
            // Recalcular horas si cambian créditos u horas de clase
            if (data.credits !== undefined || data.weeklyClassHours !== undefined) {
              updated.weeklyStudyHoursNeeded = calculateWeeklyStudyHours(
                updated.credits,
                updated.weeklyClassHours
              );
            }

            updated.updatedAt = new Date().toISOString();
            return updated;
          }),
        }));
      },

      deleteSubject: (id: string) => {
        set(state => ({
          subjects: state.subjects.filter(s => s.id !== id),
          studyBlocks: state.studyBlocks.filter(b => b.subjectId !== id),
        }));
      },

      getSubjectById: (id: string) => {
        return get().subjects.find(s => s.id === id);
      },

      // ========================================
      // STUDY BLOCKS
      // ========================================

      generateSmartStudyPlan: (weekStart: string) => {
        const { subjects, studyBlocks, isEvaluationWeek, isPreEvaluationWeek, getCutPeriodForDate } = get();
        
        if (subjects.length === 0) return [];

        const isEvalWeek = isEvaluationWeek(weekStart);
        const isPreEvalWeek = isPreEvaluationWeek(weekStart);
        const cutPeriod = getCutPeriodForDate(weekStart);
        
        // Eliminar bloques AI existentes de esta semana
        const weekDates = getWeekDates(weekStart);
        const existingNonAIBlocks = studyBlocks.filter(
          b => !b.isAISuggested || !weekDates.includes(b.date || '')
        );

        const newBlocks: StudyBlock[] = [];
        
        // Calcular horas necesarias por materia esta semana
        const subjectHoursNeeded = subjects.map(subject => {
          let hours = subject.weeklyStudyHoursNeeded;
          hours = adjustHoursForEvaluationWeek(hours, isEvalWeek, isPreEvalWeek);
          return { subject, hoursNeeded: hours, hoursAssigned: 0 };
        });

        // Ordenar por prioridad (matemáticas primero, luego técnicas)
        subjectHoursNeeded.sort((a, b) => {
          const priority: Record<string, number> = {
            matematica: 1,
            tecnica: 2,
            laboratorio: 3,
            teorica: 4,
            humanistica: 5,
          };
          return (priority[a.subject.type] || 5) - (priority[b.subject.type] || 5);
        });

        // Horarios preferidos por tipo de materia
        const getPreferredSlots = (type: string): { start: string; end: string; blockSize: number }[] => {
          switch (type) {
            case 'matematica':
            case 'tecnica':
              // Mañanas 8-12, bloques de 2h
              return [
                { start: '08:00', end: '10:00', blockSize: 2 },
                { start: '10:00', end: '12:00', blockSize: 2 },
              ];
            case 'teorica':
            case 'humanistica':
              // Tardes 14-18, bloques de 1h
              return [
                { start: '14:00', end: '15:00', blockSize: 1 },
                { start: '15:00', end: '16:00', blockSize: 1 },
                { start: '16:00', end: '17:00', blockSize: 1 },
                { start: '17:00', end: '18:00', blockSize: 1 },
              ];
            case 'laboratorio':
              // Mañanas o tardes tempranas, bloques de 2h
              return [
                { start: '09:00', end: '11:00', blockSize: 2 },
                { start: '14:00', end: '16:00', blockSize: 2 },
              ];
            default:
              return [
                { start: '14:00', end: '16:00', blockSize: 2 },
              ];
          }
        };

        // Repaso pre-examen (noches 19-21)
        const repasoSlots = [
          { start: '19:00', end: '20:30', blockSize: 1.5 },
          { start: '20:30', end: '22:00', blockSize: 1.5 },
        ];

        // Track de horas por día (máximo 6h por día)
        const hoursPerDay: Record<string, number> = {};
        const occupiedSlots: Record<string, { start: number; end: number; source: string }[]> = {};

        // Inicializar días
        const weekdayDates = weekDates.slice(0, 5); // Lunes a Viernes preferido
        for (const date of weekDates) {
          hoursPerDay[date] = 0;
          occupiedSlots[date] = [];
        }

        // ========================================
        // INTEGRACIÓN: Marcar horas ocupadas de otros módulos
        // ========================================
        
        // 1. Obtener bloques del schedule principal (Mi Día)
        const scheduleBlocks = useScheduleStore.getState().blocks;
        
        // 2. Obtener tareas programadas
        const allTasks = useTasksStore.getState().tasks;
        
        // 3. Agregar bloques del schedule como ocupados
        for (let i = 0; i < 6; i++) { // Lunes a Sábado (dayIndex 1-6)
          const date = weekDates[i];
          const dayIndex = i + 1; // schedule.store usa 0=Dom, 1=Lun, etc.
          
          const dayBlocks = scheduleBlocks.filter(b => b.dayIndex === dayIndex);
          for (const block of dayBlocks) {
            const startMinutes = block.startHour * 60;
            const endMinutes = (block.startHour + block.duration) * 60;
            occupiedSlots[date].push({
              start: startMinutes,
              end: endMinutes,
              source: 'schedule',
            });
          }
        }
        
        // 4. Agregar tareas con horario programado como ocupados
        for (const task of allTasks) {
          if (task.scheduledTimestamp) {
            const taskDate = new Date(task.scheduledTimestamp);
            const dateStr = taskDate.toISOString().split('T')[0];
            
            if (weekDates.includes(dateStr)) {
              const startMinutes = taskDate.getHours() * 60 + taskDate.getMinutes();
              // Duración estimada de tarea: 30 minutos
              occupiedSlots[dateStr].push({
                start: startMinutes,
                end: startMinutes + 30,
                source: 'task',
              });
            }
          }
          
          // Tareas con reminderTime (hábitos)
          if (task.reminderTime && (task.frequency === 'daily' || task.frequency === 'custom')) {
            const [h, m] = task.reminderTime.split(':').map(Number);
            const startMinutes = h * 60 + m;
            
            for (let i = 0; i < 6; i++) {
              const dayIndex = i + 1;
              const date = weekDates[i];
              
              // Verificar si el hábito aplica este día
              let applies = task.frequency === 'daily';
              if (task.frequency === 'custom' && task.repeatDays) {
                applies = task.repeatDays.includes(dayIndex);
              }
              
              if (applies) {
                occupiedSlots[date].push({
                  start: startMinutes,
                  end: startMinutes + 30,
                  source: 'habit',
                });
              }
            }
          }
        }

        // Agregar clases existentes como bloques ocupados
        for (const subject of subjects) {
          for (const session of subject.classSessions) {
            const dayIndex = DAYS_OF_WEEK.indexOf(session.day);
            if (dayIndex >= 0 && dayIndex < weekDates.length) {
              const date = weekDates[dayIndex];
              occupiedSlots[date].push({
                start: timeToMinutes(session.startTime),
                end: timeToMinutes(session.endTime),
                source: 'class',
              });
            }
          }
        }

        // Función para verificar si un slot está disponible
        const isSlotAvailable = (date: string, startTime: string, endTime: string): boolean => {
          const start = timeToMinutes(startTime);
          const end = timeToMinutes(endTime);
          
          // Verificar límites de horario (7am - 10pm)
          if (start < 420 || end > 1320) return false;
          
          // Verificar máximo de horas por día
          const duration = (end - start) / 60;
          if (hoursPerDay[date] + duration > 6) return false;
          
          // Verificar colisiones
          for (const occupied of occupiedSlots[date]) {
            if (!(end <= occupied.start || start >= occupied.end)) {
              return false;
            }
          }
          
          return true;
        };

        // Asignar bloques de estudio
        for (const item of subjectHoursNeeded) {
          const { subject, hoursNeeded } = item;
          let remainingHours = hoursNeeded;
          
          const preferredSlots = getPreferredSlots(subject.type);
          const slotsToTry = isEvalWeek 
            ? [...preferredSlots, ...repasoSlots]
            : preferredSlots;

          // Distribuir entre días de la semana
          const daysToUse = isEvalWeek 
            ? weekDates // Usar todos los días en semana de examen
            : weekdayDates; // Solo lunes-viernes normalmente

          for (const date of daysToUse) {
            if (remainingHours <= 0) break;
            
            for (const slot of slotsToTry) {
              if (remainingHours <= 0) break;
              if (!isSlotAvailable(date, slot.start, slot.end)) continue;

              const duration = Math.min(slot.blockSize, remainingHours);
              const endTime = minutesToTime(timeToMinutes(slot.start) + duration * 60);

              const newBlock: StudyBlock = {
                id: generateId(),
                subjectId: subject.id,
                day: getDayOfWeek(date),
                date,
                startTime: slot.start,
                endTime,
                type: isEvalWeek ? 'repaso' : 'estudio',
                isAISuggested: true,
                isCompleted: false,
                cutPeriod,
                createdAt: new Date().toISOString(),
              };

              newBlocks.push(newBlock);
              remainingHours -= duration;
              hoursPerDay[date] += duration;
              occupiedSlots[date].push({
                start: timeToMinutes(slot.start),
                end: timeToMinutes(endTime),
              });
              
              item.hoursAssigned += duration;
            }
          }
        }

        // Actualizar store con nuevos bloques
        set(state => ({
          studyBlocks: [...existingNonAIBlocks, ...newBlocks],
        }));

        return newBlocks;
      },

      addStudyBlock: (block) => {
        const newBlock: StudyBlock = {
          ...block,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          studyBlocks: [...state.studyBlocks, newBlock],
        }));

        return newBlock;
      },

      updateStudyBlock: (id, data) => {
        set(state => ({
          studyBlocks: state.studyBlocks.map(block =>
            block.id === id ? { ...block, ...data } : block
          ),
        }));
      },

      deleteStudyBlock: (id) => {
        set(state => ({
          studyBlocks: state.studyBlocks.filter(b => b.id !== id),
        }));
      },

      markBlockCompleted: (blockId) => {
        set(state => ({
          studyBlocks: state.studyBlocks.map(block =>
            block.id === blockId ? { ...block, isCompleted: true } : block
          ),
        }));
      },

      getBlocksForDate: (date) => {
        const { studyBlocks } = get();
        return studyBlocks.filter(b => b.date === date);
      },

      getBlocksForWeek: (weekStart) => {
        const { studyBlocks } = get();
        const weekDates = getWeekDates(weekStart);
        return studyBlocks.filter(b => b.date && weekDates.includes(b.date));
      },

      // ========================================
      // ACADEMIC CALENDAR
      // ========================================

      addAcademicEvent: (event) => {
        const newEvent: AcademicEvent = {
          ...event,
          id: generateId(),
        };

        set(state => ({
          academicEvents: [...state.academicEvents, newEvent],
        }));

        return newEvent;
      },

      getUpcomingAcademicEvents: (days) => {
        const { academicEvents } = get();
        const today = getToday();
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + days);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        return academicEvents
          .filter(event => event.startDate >= today && event.startDate <= futureDateStr)
          .sort((a, b) => a.startDate.localeCompare(b.startDate));
      },

      getDaysUntilNextEvaluation: () => {
        const { academicEvents } = get();
        const today = getToday();

        const nextEvaluation = academicEvents
          .filter(e => e.type === 'evaluacion' && e.startDate >= today)
          .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

        if (!nextEvaluation) return -1;
        return daysBetween(today, nextEvaluation.startDate);
      },

      getCutPeriodForDate: (date) => {
        const calendar = ACADEMIC_CALENDAR_2026_1;

        if (isDateInRange(date, calendar.corte1.start, calendar.corte1.end)) {
          return 'corte1';
        }
        if (isDateInRange(date, calendar.corte2.start, calendar.corte2.end)) {
          return 'corte2';
        }
        if (isDateInRange(date, calendar.corte3.start, calendar.corte3.end)) {
          return 'corte3';
        }
        
        // Default al corte más cercano
        const d = new Date(date);
        const corte2Start = new Date(calendar.corte2.start);
        const corte3Start = new Date(calendar.corte3.start);

        if (d < corte2Start) return 'corte1';
        if (d < corte3Start) return 'corte2';
        return 'corte3';
      },

      isEvaluationWeek: (date) => {
        const calendar = ACADEMIC_CALENDAR_2026_1;
        const weekStart = getWeekStart(date);
        
        return (
          isDateInRange(weekStart, calendar.corte1.evaluationWeek.start, calendar.corte1.evaluationWeek.end) ||
          isDateInRange(weekStart, calendar.corte2.evaluationWeek.start, calendar.corte2.evaluationWeek.end) ||
          isDateInRange(weekStart, calendar.corte3.evaluationWeek.start, calendar.corte3.evaluationWeek.end)
        );
      },

      isPreEvaluationWeek: (date) => {
        const calendar = ACADEMIC_CALENDAR_2026_1;
        const weekStart = getWeekStart(date);
        
        // Semana anterior a cada semana de evaluación
        const preEvalWeeks = [
          { start: '2026-04-06', end: '2026-04-11' }, // Semana antes de corte 1
          { start: '2026-05-11', end: '2026-05-16' }, // Semana antes de corte 2
          { start: '2026-06-15', end: '2026-06-20' }, // Semana antes de corte 3
        ];

        return preEvalWeeks.some(week => 
          isDateInRange(weekStart, week.start, week.end)
        );
      },

      // ========================================
      // SUMMARIES
      // ========================================

      getWeeklySummary: (weekStart) => {
        const { subjects, studyBlocks, isEvaluationWeek, isPreEvaluationWeek, getCutPeriodForDate } = get();
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 5);
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        const isEvalWeek = isEvaluationWeek(weekStart);
        const isPreEvalWeek = isPreEvaluationWeek(weekStart);
        const cutPeriod = getCutPeriodForDate(weekStart);

        const weekDates = getWeekDates(weekStart);
        const weekBlocks = studyBlocks.filter(b => b.date && weekDates.includes(b.date));

        const bySubject: SubjectWeeklySummary[] = subjects.map(subject => {
          const baseHours = subject.weeklyStudyHoursNeeded;
          const hoursNeeded = adjustHoursForEvaluationWeek(baseHours, isEvalWeek, isPreEvalWeek);
          
          const subjectBlocks = weekBlocks.filter(b => b.subjectId === subject.id);
          const hoursPlanned = subjectBlocks.reduce((sum, block) => {
            return sum + calculateDurationHours(block.startTime, block.endTime);
          }, 0);
          
          const hoursCompleted = subjectBlocks
            .filter(b => b.isCompleted)
            .reduce((sum, block) => {
              return sum + calculateDurationHours(block.startTime, block.endTime);
            }, 0);

          return {
            subjectId: subject.id,
            subjectName: subject.name,
            subjectColor: subject.color,
            hoursNeeded,
            hoursPlanned,
            hoursCompleted,
            deficit: hoursNeeded - hoursPlanned,
          };
        });

        const totalHoursNeeded = bySubject.reduce((sum, s) => sum + s.hoursNeeded, 0);
        const totalHoursPlanned = bySubject.reduce((sum, s) => sum + s.hoursPlanned, 0);
        const totalHoursCompleted = bySubject.reduce((sum, s) => sum + s.hoursCompleted, 0);
        const deficitHours = Math.max(0, totalHoursNeeded - totalHoursPlanned);
        const surplusHours = Math.max(0, totalHoursPlanned - totalHoursNeeded);

        let alertLevel: AlertLevel = 'ok';
        if (deficitHours > totalHoursNeeded * 0.3) {
          alertLevel = 'critical';
        } else if (deficitHours > 0) {
          alertLevel = 'warning';
        }

        return {
          weekStart,
          weekEnd: weekEndStr,
          isEvaluationWeek: isEvalWeek,
          isPreEvaluationWeek: isPreEvalWeek,
          cutPeriod,
          bySubject,
          totalHoursNeeded,
          totalHoursPlanned,
          totalHoursCompleted,
          alertLevel,
          deficitHours,
          surplusHours,
        };
      },

      getTodaySchedule: () => {
        const { subjects, studyBlocks } = get();
        const today = getToday();
        const dayOfWeek = getDayOfWeek(today);

        // Obtener clases de hoy
        const classBlocks: StudyBlock[] = [];
        for (const subject of subjects) {
          for (const session of subject.classSessions) {
            if (session.day === dayOfWeek) {
              classBlocks.push({
                id: `class-${subject.id}-${session.id}`,
                subjectId: subject.id,
                day: dayOfWeek,
                date: today,
                startTime: session.startTime,
                endTime: session.endTime,
                type: 'clase',
                isAISuggested: false,
                isCompleted: false,
                cutPeriod: 'corte1', // No relevante para clases
                createdAt: subject.createdAt,
              });
            }
          }
        }

        // Obtener bloques de estudio de hoy
        const todayStudyBlocks = studyBlocks.filter(b => b.date === today);

        return {
          classes: classBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime)),
          studyBlocks: todayStudyBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        };
      },

      // ========================================
      // UTILITY
      // ========================================

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'university-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subjects: state.subjects,
        studyBlocks: state.studyBlocks,
        academicEvents: state.academicEvents,
        isInitialized: state.isInitialized,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectSubjects = (state: UniversityState) => state.subjects;
export const selectStudyBlocks = (state: UniversityState) => state.studyBlocks;
export const selectAcademicEvents = (state: UniversityState) => state.academicEvents;
export const selectIsInitialized = (state: UniversityState) => state.isInitialized;

// ============================================
// HOOKS HELPERS
// ============================================

/**
 * Hook para obtener el resumen de la semana actual
 */
export function useCurrentWeekSummary(): WeeklyStudySummary {
  const getWeeklySummary = useUniversityStore(state => state.getWeeklySummary);
  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart(today);
  return getWeeklySummary(weekStart);
}

/**
 * Hook para obtener el horario de hoy
 */
export function useTodaySchedule() {
  return useUniversityStore(state => state.getTodaySchedule());
}

/**
 * Hook para obtener días hasta el próximo examen
 */
export function useDaysUntilNextEvaluation(): number {
  return useUniversityStore(state => state.getDaysUntilNextEvaluation());
}
