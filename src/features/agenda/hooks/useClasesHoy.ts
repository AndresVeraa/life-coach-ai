/**
 * Hooks para integración de Universidad en AgendaScreen
 * Life Coach AI - Dark Luxury Wellness
 */

import { useMemo } from 'react';
import { useUniversityStore, useTodaySchedule, useDaysUntilNextEvaluation } from '../university.store';
import type { Subject, ClassSession, DayOfWeek } from '@/types/university.types';

// ============================================
// TIPOS
// ============================================

export interface ClaseHoy {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  startTime: string;
  endTime: string;
  location?: string;
  color: string;
  type: 'clase' | 'estudio';
  isActive: boolean;
  isNext: boolean;
  isPast: boolean;
}

/**
 * Formato para integración directa en el timeline de AgendaScreen
 */
export interface ClaseTimeline {
  id: string;
  type: 'clase' | 'estudio' | 'repaso';
  title: string;
  code: string;
  hour: number; // Hora decimal (8.5 = 8:30)
  endHour: number;
  color: string;
  subjectType: string;
  professor?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAISuggested?: boolean;
  isCompleted?: boolean;
  blockId?: string; // ID del StudyBlock original
}

export interface UniversityQuickStats {
  totalSubjects: number;
  totalClasesHoy: number;
  horasClaseHoy: number;
  horasEstudioHoy: number;
  daysUntilExam: number;
  examAlertLevel: 'ok' | 'warning' | 'critical';
}

// ============================================
// HELPERS
// ============================================

const DAY_MAP: Record<number, DayOfWeek> = {
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
};

/**
 * Convierte hora string "HH:MM" a minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Obtiene el tiempo actual como "HH:MM"
 */
function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Calcula duración en horas entre dos tiempos
 */
function calculateDuration(start: string, end: string): number {
  const startMins = timeToMinutes(start);
  const endMins = timeToMinutes(end);
  return (endMins - startMins) / 60;
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook para obtener las clases de hoy
 * Retorna clases ordenadas por hora con estado actual
 */
export function useClasesHoy(): ClaseHoy[] {
  const subjects = useUniversityStore(state => state.subjects);
  const todaySchedule = useTodaySchedule();
  
  return useMemo(() => {
    const now = new Date();
    const currentTime = getCurrentTime();
    const currentMinutes = timeToMinutes(currentTime);
    const dayIndex = now.getDay();
    const dayOfWeek = DAY_MAP[dayIndex];
    
    // Si es domingo, no hay clases
    if (dayIndex === 0) return [];
    
    const clases: ClaseHoy[] = [];
    let foundNext = false;
    
    // Agregar clases regulares de las materias
    subjects.forEach(subject => {
      subject.classSessions.forEach(session => {
        if (session.day === dayOfWeek) {
          const startMins = timeToMinutes(session.startTime);
          const endMins = timeToMinutes(session.endTime);
          
          const isPast = currentMinutes >= endMins;
          const isActive = currentMinutes >= startMins && currentMinutes < endMins;
          
          clases.push({
            id: session.id,
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            startTime: session.startTime,
            endTime: session.endTime,
            location: session.location,
            color: subject.color,
            type: 'clase',
            isActive,
            isNext: false, // Se asigna después
            isPast,
          });
        }
      });
    });
    
    // Agregar bloques de estudio del día
    todaySchedule.studyBlocks.forEach(block => {
      const subject = subjects.find(s => s.id === block.subjectId);
      if (!subject) return;
      
      const startMins = timeToMinutes(block.startTime);
      const endMins = timeToMinutes(block.endTime);
      const isPast = currentMinutes >= endMins;
      const isActive = currentMinutes >= startMins && currentMinutes < endMins;
      
      clases.push({
        id: block.id,
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        startTime: block.startTime,
        endTime: block.endTime,
        color: subject.color,
        type: 'estudio',
        isActive,
        isNext: false,
        isPast,
      });
    });
    
    // Ordenar por hora de inicio
    clases.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    
    // Marcar la próxima clase
    for (let i = 0; i < clases.length; i++) {
      if (!clases[i].isPast && !clases[i].isActive && !foundNext) {
        clases[i].isNext = true;
        foundNext = true;
        break;
      }
    }
    
    return clases;
  }, [subjects, todaySchedule]);
}

/**
 * Hook para obtener clases de un día específico
 */
export function useClasesDia(dayIndex: number): ClaseHoy[] {
  const subjects = useUniversityStore(state => state.subjects);
  
  return useMemo(() => {
    const dayOfWeek = DAY_MAP[dayIndex];
    if (!dayOfWeek) return [];
    
    const clases: ClaseHoy[] = [];
    
    subjects.forEach(subject => {
      subject.classSessions.forEach(session => {
        if (session.day === dayOfWeek) {
          clases.push({
            id: session.id,
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            startTime: session.startTime,
            endTime: session.endTime,
            location: session.location,
            color: subject.color,
            type: 'clase',
            isActive: false,
            isNext: false,
            isPast: false,
          });
        }
      });
    });
    
    clases.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    return clases;
  }, [subjects, dayIndex]);
}

/**
 * Hook para estadísticas rápidas de universidad
 */
export function useUniversityStats(): UniversityQuickStats {
  const subjects = useUniversityStore(state => state.subjects);
  const daysUntilExam = useDaysUntilNextEvaluation();
  const todaySchedule = useTodaySchedule();
  
  return useMemo(() => {
    const { classes, studyBlocks } = todaySchedule;
    
    // Calcular horas de clase hoy
    let horasClaseHoy = 0;
    classes.forEach(block => {
      horasClaseHoy += calculateDuration(block.startTime, block.endTime);
    });
    
    // Calcular horas de estudio hoy
    let horasEstudioHoy = 0;
    studyBlocks.forEach(block => {
      horasEstudioHoy += calculateDuration(block.startTime, block.endTime);
    });
    
    // Determinar nivel de alerta
    let examAlertLevel: 'ok' | 'warning' | 'critical' = 'ok';
    if (daysUntilExam > 0 && daysUntilExam <= 7) {
      examAlertLevel = 'critical';
    } else if (daysUntilExam > 0 && daysUntilExam <= 14) {
      examAlertLevel = 'warning';
    }
    
    return {
      totalSubjects: subjects.length,
      totalClasesHoy: classes.length,
      horasClaseHoy,
      horasEstudioHoy,
      daysUntilExam,
      examAlertLevel,
    };
  }, [subjects, todaySchedule, daysUntilExam]);
}

/**
 * Hook para obtener la próxima clase/bloque
 */
export function useProximaClase(): ClaseHoy | null {
  const clases = useClasesHoy();
  
  return useMemo(() => {
    // Buscar clase activa o próxima
    const activa = clases.find(c => c.isActive);
    if (activa) return activa;
    
    const proxima = clases.find(c => c.isNext);
    return proxima || null;
  }, [clases]);
}

/**
 * Convierte tiempo "HH:MM" a hora decimal
 */
function timeToDecimal(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

/**
 * Hook que retorna las clases y bloques de estudio en formato compatible con el timeline
 * @param dayIndex - Día de la semana (0=Dom, 1=Lun, etc.)
 */
export function useClasesParaTimeline(dayIndex: number): ClaseTimeline[] {
  const subjects = useUniversityStore(state => state.subjects);
  const studyBlocks = useUniversityStore(state => state.studyBlocks);
  
  return useMemo(() => {
    const dayOfWeek = DAY_MAP[dayIndex];
    if (!dayOfWeek) return [];
    
    const items: ClaseTimeline[] = [];
    
    // 1. Agregar clases regulares de las materias
    subjects.forEach((subject) => {
      subject.classSessions.forEach((session, scheduleIdx) => {
        if (session.day === dayOfWeek) {
          items.push({
            id: `clase-${subject.id}-${scheduleIdx}`,
            type: 'clase',
            title: subject.name,
            code: subject.code,
            hour: timeToDecimal(session.startTime),
            endHour: timeToDecimal(session.endTime),
            color: subject.color,
            subjectType: subject.type,
            professor: subject.professor,
            startTime: session.startTime,
            endTime: session.endTime,
            location: session.location,
          });
        }
      });
    });
    
    // 2. Agregar bloques de estudio generados
    // Calcular la fecha correspondiente a este dayIndex para la semana actual
    const today = new Date();
    const currentDayIndex = today.getDay();
    const daysToTarget = dayIndex - currentDayIndex;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToTarget);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    studyBlocks.forEach((block) => {
      // Verificar si el bloque es de este día (por fecha o por día de semana)
      const matchesByDate = block.date === targetDateStr;
      const matchesByDay = block.day === dayOfWeek;
      
      if (matchesByDate || matchesByDay) {
        const subject = subjects.find(s => s.id === block.subjectId);
        if (!subject) return;
        
        items.push({
          id: `estudio-${block.id}`,
          type: block.type === 'repaso' ? 'repaso' : 'estudio',
          title: subject.name,
          code: subject.code,
          hour: timeToDecimal(block.startTime),
          endHour: timeToDecimal(block.endTime),
          color: subject.color + '80', // Más transparente para diferenciar
          subjectType: subject.type,
          startTime: block.startTime,
          endTime: block.endTime,
          isAISuggested: block.isAISuggested,
          isCompleted: block.isCompleted,
          blockId: block.id,
        });
      }
    });
    
    return items.sort((a, b) => a.hour - b.hour);
  }, [subjects, studyBlocks, dayIndex]);
}
