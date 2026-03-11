/**
 * CalendarView - Vista mensual del calendario académico
 * Life Coach AI - Dark Luxury Wellness Theme
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useUniversityStore } from '../university.store';
import { AcademicEvent, ACADEMIC_CALENDAR_2026_1 } from '@/types/university.types';
import { UNIVERSIDAD_THEME } from '../constants/theme';

const T = UNIVERSIDAD_THEME;

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DAYS_HEADER = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const CalendarView = () => {
  const [currentMonth, setCurrentMonth] = useState(3); // Marzo (inicio semestre)
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const academicEvents = useUniversityStore(state => state.academicEvents);
  const subjects = useUniversityStore(state => state.subjects);
  const studyBlocks = useUniversityStore(state => state.studyBlocks);

  // Navegar meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    let newMonth = currentMonth + (direction === 'next' ? 1 : -1);
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  // Obtener días del mes
  const getDaysInMonth = (): (number | null)[] => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    const days: (number | null)[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  // Obtener eventos para una fecha
  const getEventsForDate = (day: number): AcademicEvent[] => {
    const dateStr = formatDateStr(currentYear, currentMonth, day);
    return academicEvents.filter(event => {
      return dateStr >= event.startDate && dateStr <= event.endDate;
    });
  };

  // Verificar si hay bloques de estudio para una fecha
  const hasStudyBlocks = (day: number): boolean => {
    const dateStr = formatDateStr(currentYear, currentMonth, day);
    return studyBlocks.some(block => block.date === dateStr);
  };

  // Verificar si hay clases para una fecha
  const hasClasses = (day: number): boolean => {
    const dateStr = formatDateStr(currentYear, currentMonth, day);
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0) return false;
    
    const dayMap: Record<number, string> = {
      1: 'lunes', 2: 'martes', 3: 'miercoles',
      4: 'jueves', 5: 'viernes', 6: 'sabado',
    };
    
    const dayName = dayMap[dayOfWeek];
    return subjects.some(subject => 
      subject.classSessions.some(session => session.day === dayName)
    );
  };

  // Verificar si está en período académico
  const isInAcademicPeriod = (day: number): boolean => {
    const dateStr = formatDateStr(currentYear, currentMonth, day);
    const calendar = ACADEMIC_CALENDAR_2026_1;
    return dateStr >= calendar.semesterStart && dateStr <= calendar.semesterEnd;
  };

  // Renderizar día
  const renderDay = (day: number | null, index: number) => {
    if (day === null) {
      return <View key={`empty-${index}`} style={styles.dayEmpty} />;
    }

    const dateStr = formatDateStr(currentYear, currentMonth, day);
    const today = new Date().toISOString().split('T')[0];
    const isToday = dateStr === today;
    const isSelected = dateStr === selectedDate;
    const events = getEventsForDate(day);
    const hasStudy = hasStudyBlocks(day);
    const hasClass = hasClasses(day);
    const inPeriod = isInAcademicPeriod(day);

    const hasEval = events.some(e => e.type === 'evaluacion');

    return (
      <TouchableOpacity
        key={`day-${day}`}
        onPress={() => setSelectedDate(isSelected ? null : dateStr)}
        style={[styles.dayContainer, !inPeriod && styles.dayOutOfPeriod]}
      >
        <View style={[
          styles.dayCircle,
          isToday && styles.dayCircleToday,
          isSelected && !isToday && styles.dayCircleSelected,
          hasEval && styles.dayCircleEval,
        ]}>
          <Text style={[
            styles.dayText,
            isToday && styles.dayTextToday,
            isSelected && !isToday && styles.dayTextSelected,
            !inPeriod && styles.dayTextOutOfPeriod,
          ]}>
            {day}
          </Text>
        </View>
        
        {/* Dots indicadores */}
        <View style={styles.dotsContainer}>
          {hasClass && <View style={[styles.dot, { backgroundColor: T.colors.primary }]} />}
          {hasStudy && <View style={[styles.dot, { backgroundColor: T.colors.success }]} />}
          {events.length > 0 && !hasEval && <View style={[styles.dot, { backgroundColor: T.colors.warning }]} />}
          {hasEval && <View style={[styles.dot, { backgroundColor: T.colors.error }]} />}
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar eventos del día seleccionado
  const renderSelectedDateEvents = () => {
    if (!selectedDate) return null;

    const day = parseInt(selectedDate.split('-')[2]);
    const events = getEventsForDate(day);
    const dateStr = selectedDate;
    const dayBlocks = studyBlocks.filter(b => b.date === dateStr);

    if (events.length === 0 && dayBlocks.length === 0) {
      return (
        <View style={styles.emptyEvents}>
          <Text style={styles.emptyEventsText}>No hay eventos para este día</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.eventsScroll}>
        {events.map(event => (
          <View key={event.id} style={[styles.eventCard, { borderLeftColor: event.color }]}>
            <View style={styles.eventIcon}>
              <Text style={styles.eventIconText}>
                {event.type === 'evaluacion' ? '⚠️' : event.type === 'registro_notas' ? '📝' : '📅'}
              </Text>
            </View>
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              {event.description && (
                <Text style={styles.eventDescription}>{event.description}</Text>
              )}
              <Text style={styles.eventDate}>
                {formatDateRange(event.startDate, event.endDate)}
              </Text>
            </View>
            {event.isHighPriority && (
              <View style={styles.eventPriority}>
                <Text style={styles.eventPriorityText}>⚡</Text>
              </View>
            )}
          </View>
        ))}

        {dayBlocks.length > 0 && (
          <View style={styles.studyBlocksSection}>
            <Text style={styles.studyBlocksTitle}>
              📚 Bloques de estudio ({dayBlocks.length})
            </Text>
            {dayBlocks.map(block => {
              const subject = subjects.find(s => s.id === block.subjectId);
              return (
                <View key={block.id} style={styles.studyBlock}>
                  <View style={[styles.studyBlockDot, { backgroundColor: subject?.color || T.colors.textSecondary }]} />
                  <Text style={styles.studyBlockText}>
                    {subject?.code || 'Materia'} - {block.startTime} a {block.endTime}
                  </Text>
                  {block.isCompleted && <Text style={styles.studyBlockCheck}>✓</Text>}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header de navegación */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.navTitle}>{MONTHS[currentMonth - 1]} {currentYear}</Text>

        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: T.colors.primary }]} />
          <Text style={styles.legendText}>Clases</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: T.colors.success }]} />
          <Text style={styles.legendText}>Estudio</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: T.colors.error }]} />
          <Text style={styles.legendText}>Exámenes</Text>
        </View>
      </View>

      {/* Headers de días */}
      <View style={styles.daysHeader}>
        {DAYS_HEADER.map(day => (
          <View key={day} style={styles.dayHeaderItem}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Grid de días */}
      <View style={styles.daysGrid}>
        {getDaysInMonth().map((day, index) => renderDay(day, index))}
      </View>

      {/* Eventos del día seleccionado */}
      <View style={styles.selectedSection}>
        <Text style={styles.selectedTitle}>
          {selectedDate 
            ? `📅 ${formatFullDate(selectedDate)}`
            : '👆 Selecciona un día para ver detalles'
          }
        </Text>
        {renderSelectedDateEvents()}
      </View>

      {/* Próximos eventos importantes */}
      <View style={styles.upcomingSection}>
        <Text style={styles.upcomingTitle}>🗓️ Próximos Eventos Importantes</Text>
        {academicEvents
          .filter(e => e.startDate >= new Date().toISOString().split('T')[0])
          .slice(0, 5)
          .map(event => (
            <View key={event.id} style={styles.upcomingEvent}>
              <View style={[styles.upcomingBar, { backgroundColor: event.color }]} />
              <View style={styles.upcomingContent}>
                <Text style={styles.upcomingEventTitle}>{event.title}</Text>
                <Text style={styles.upcomingEventDate}>
                  {formatDateRange(event.startDate, event.endDate)}
                </Text>
              </View>
              {event.isHighPriority && <Text style={styles.upcomingPriority}>⚠️</Text>}
            </View>
          ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.colors.background,
  },
  
  // Navigation Header
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: T.borderRadius.md,
    backgroundColor: T.colors.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    fontSize: 24,
    color: T.colors.primary,
    fontWeight: '600',
  },
  navTitle: {
    fontSize: T.typography.h2,
    fontWeight: T.typography.bold as '700',
    color: T.colors.textPrimary,
  },
  
  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: T.spacing.lg,
    marginBottom: T.spacing.md,
    paddingHorizontal: T.spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: T.spacing.xs,
  },
  legendText: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
  },
  
  // Days Header
  daysHeader: {
    flexDirection: 'row',
    paddingHorizontal: T.spacing.sm,
    marginBottom: T.spacing.sm,
  },
  dayHeaderItem: {
    width: '14.28%',
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: T.typography.caption,
    fontWeight: T.typography.medium as '500',
    color: T.colors.textSecondary,
  },
  
  // Days Grid
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: T.spacing.sm,
  },
  dayContainer: {
    width: '14.28%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOutOfPeriod: {
    opacity: 0.4,
  },
  dayEmpty: {
    width: '14.28%',
    height: 48,
  },
  dayCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayCircleToday: {
    backgroundColor: T.colors.primary,
  },
  dayCircleSelected: {
    backgroundColor: T.colors.glassBg,
    borderWidth: 1,
    borderColor: T.colors.primary,
  },
  dayCircleEval: {
    borderWidth: 2,
    borderColor: T.colors.error,
  },
  dayText: {
    fontSize: T.typography.bodySmall,
    color: T.colors.textPrimary,
  },
  dayTextToday: {
    color: '#FFFFFF',
    fontWeight: T.typography.bold as '700',
  },
  dayTextSelected: {
    color: T.colors.primary,
    fontWeight: T.typography.semibold as '600',
  },
  dayTextOutOfPeriod: {
    color: T.colors.textSecondary,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  
  // Selected Date Events
  selectedSection: {
    paddingHorizontal: T.spacing.lg,
    marginTop: T.spacing.lg,
    paddingBottom: T.spacing.lg,
  },
  selectedTitle: {
    fontSize: T.typography.bodySmall,
    fontWeight: T.typography.medium as '500',
    color: T.colors.textSecondary,
    marginBottom: T.spacing.sm,
  },
  eventsScroll: {
    maxHeight: 240,
  },
  emptyEvents: {
    padding: T.spacing.lg,
    backgroundColor: T.colors.surface,
    borderRadius: T.borderRadius.lg,
    alignItems: 'center',
  },
  emptyEventsText: {
    color: T.colors.textSecondary,
    fontSize: T.typography.body,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: T.spacing.md,
    backgroundColor: T.colors.surface,
    borderRadius: T.borderRadius.lg,
    marginBottom: T.spacing.sm,
    borderLeftWidth: 4,
  },
  eventIcon: {
    marginRight: T.spacing.md,
    marginTop: 2,
  },
  eventIconText: {
    fontSize: 16,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: T.typography.body,
    fontWeight: T.typography.semibold as '600',
    color: T.colors.textPrimary,
  },
  eventDescription: {
    fontSize: T.typography.bodySmall,
    color: T.colors.textSecondary,
    marginTop: 4,
  },
  eventDate: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
    marginTop: 4,
  },
  eventPriority: {
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    paddingHorizontal: T.spacing.sm,
    paddingVertical: T.spacing.xs,
    borderRadius: T.borderRadius.sm,
  },
  eventPriorityText: {
    fontSize: 12,
  },
  
  // Study Blocks Section
  studyBlocksSection: {
    marginTop: T.spacing.sm,
  },
  studyBlocksTitle: {
    fontSize: T.typography.bodySmall,
    fontWeight: T.typography.medium as '500',
    color: T.colors.textSecondary,
    marginBottom: T.spacing.sm,
  },
  studyBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: T.spacing.sm,
    backgroundColor: T.colors.glassBg,
    borderRadius: T.borderRadius.md,
    marginBottom: T.spacing.xs,
  },
  studyBlockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: T.spacing.sm,
  },
  studyBlockText: {
    flex: 1,
    fontSize: T.typography.bodySmall,
    color: T.colors.textPrimary,
  },
  studyBlockCheck: {
    fontSize: T.typography.caption,
    color: T.colors.success,
  },
  
  // Upcoming Events Section
  upcomingSection: {
    paddingHorizontal: T.spacing.lg,
    paddingBottom: T.spacing.xxl,
  },
  upcomingTitle: {
    fontSize: T.typography.body,
    fontWeight: T.typography.semibold as '600',
    color: T.colors.textPrimary,
    marginBottom: T.spacing.md,
  },
  upcomingEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: T.spacing.md,
    backgroundColor: T.colors.surface,
    borderRadius: T.borderRadius.lg,
    marginBottom: T.spacing.sm,
  },
  upcomingBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: T.spacing.md,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingEventTitle: {
    fontSize: T.typography.bodySmall,
    fontWeight: T.typography.medium as '500',
    color: T.colors.textPrimary,
  },
  upcomingEventDate: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
    marginTop: 2,
  },
  upcomingPriority: {
    fontSize: 16,
  },
});

// ============================================
// HELPERS
// ============================================

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatFullDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const date = new Date(dateStr);
  const weekday = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
  return `${weekday} ${day} de ${monthNames[month - 1]}`;
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  
  if (start === end) {
    return `${startDate.getDate()} ${months[startDate.getMonth()]}`;
  }
  
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDate.getDate()} - ${endDate.getDate()} ${months[startDate.getMonth()]}`;
  }
  
  return `${startDate.getDate()} ${months[startDate.getMonth()]} - ${endDate.getDate()} ${months[endDate.getMonth()]}`;
}
