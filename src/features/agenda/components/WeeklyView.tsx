/**
 * WeeklyView - Vista semanal tipo Google Calendar
 * Life Coach AI - Dark Luxury Wellness Theme
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUniversityStore, useCurrentWeekSummary } from '../university.store';
import { StudyBlock, DayOfWeek, DAYS_OF_WEEK } from '@/types/university.types';
import { UNIVERSIDAD_THEME } from '../constants/theme';

const T = UNIVERSIDAD_THEME;
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 - 22:00
const HOUR_HEIGHT = 60;
const DAY_WIDTH = (Dimensions.get('window').width - 60) / 6; // 6 días

const DAY_LABELS: Record<DayOfWeek, string> = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sáb',
};

export const WeeklyView = () => {
  const scrollRef = useRef<ScrollView>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedBlock, setSelectedBlock] = useState<StudyBlock | null>(null);
  
  const subjects = useUniversityStore(state => state.subjects);
  const studyBlocks = useUniversityStore(state => state.studyBlocks);
  const generateSmartStudyPlan = useUniversityStore(state => state.generateSmartStudyPlan);
  const markBlockCompleted = useUniversityStore(state => state.markBlockCompleted);
  const deleteStudyBlock = useUniversityStore(state => state.deleteStudyBlock);
  const getBlocksForWeek = useUniversityStore(state => state.getBlocksForWeek);
  
  const weekBlocks = getBlocksForWeek(currentWeekStart);
  const weeklySummary = useCurrentWeekSummary();

  // Scroll inicial a las 8am
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: (8 - 7) * HOUR_HEIGHT, animated: false });
    }, 100);
  }, []);

  // Navegar semanas
  const navigateWeek = (direction: 'prev' | 'next') => {
    const current = new Date(currentWeekStart);
    current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(current.toISOString().split('T')[0]);
  };

  // Generar plan IA
  const handleGeneratePlan = () => {
    const existingAIBlocks = weekBlocks.filter(b => b.isAISuggested);
    if (existingAIBlocks.length > 0) {
      Alert.alert(
        'Regenerar Plan',
        'Ya tienes un plan generado para esta semana. ¿Quieres reemplazarlo con uno nuevo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Regenerar',
            onPress: () => generateSmartStudyPlan(currentWeekStart),
          },
        ]
      );
    } else {
      generateSmartStudyPlan(currentWeekStart);
    }
  };

  // Obtener todas las clases como bloques
  const getClassBlocks = (): StudyBlock[] => {
    const classBlocks: StudyBlock[] = [];
    const weekDates = getWeekDates(currentWeekStart);

    for (const subject of subjects) {
      subject.classSessions.forEach((session, sessionIndex) => {
        const dayIndex = DAYS_OF_WEEK.indexOf(session.day);
        if (dayIndex >= 0 && dayIndex < 6) {
          classBlocks.push({
            id: `class-${subject.id}-${session.day}-${session.startTime}-${sessionIndex}`,
            subjectId: subject.id,
            day: session.day,
            date: weekDates[dayIndex],
            startTime: session.startTime,
            endTime: session.endTime,
            type: 'clase',
            isAISuggested: false,
            isCompleted: false,
            cutPeriod: 'corte1',
            createdAt: subject.createdAt,
          });
        }
      });
    }
    return classBlocks;
  };

  // Combinar clases y bloques de estudio
  const allBlocks = [...getClassBlocks(), ...weekBlocks];

  // Manejar toque en bloque
  const handleBlockPress = (block: StudyBlock) => {
    if (block.type === 'clase') return; // Las clases no son editables
    setSelectedBlock(block);
  };

  // Eliminar bloque de estudio
  const handleDeleteBlock = () => {
    if (!selectedBlock) return;
    Alert.alert(
      'Eliminar bloque',
      '¿Eliminar este bloque de estudio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteStudyBlock(selectedBlock.id);
            setSelectedBlock(null);
          },
        },
      ]
    );
  };

  // Renderizar bloque
  const renderBlock = (block: StudyBlock) => {
    const subject = subjects.find(s => s.id === block.subjectId);
    if (!subject) return null;

    const startMinutes = timeToMinutes(block.startTime) - 7 * 60;
    const endMinutes = timeToMinutes(block.endTime) - 7 * 60;
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
    const dayIndex = DAYS_OF_WEEK.indexOf(block.day);
    const left = dayIndex * DAY_WIDTH;

    const isClass = block.type === 'clase';
    const bgColor = isClass ? subject.color : subject.color + '60';

    return (
      <TouchableOpacity
        key={block.id}
        onPress={() => handleBlockPress(block)}
        onLongPress={() => !isClass && handleBlockPress(block)}
        style={[
          styles.eventBlock,
          {
            top,
            left,
            width: DAY_WIDTH - 4,
            height: height - 2,
            backgroundColor: bgColor,
            borderLeftColor: subject.color,
          },
          block.isCompleted && styles.eventBlockCompleted,
        ]}
        activeOpacity={0.8}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventCode} numberOfLines={1}>
            {subject.code}
          </Text>
          {block.isAISuggested && <Text style={styles.eventEmoji}>✨</Text>}
          {block.isCompleted && <Text style={styles.eventEmoji}>✓</Text>}
        </View>
        {height > 40 && (
          <Text style={styles.eventTime} numberOfLines={1}>
            {block.startTime} - {block.endTime}
          </Text>
        )}
        {height > 55 && (
          <Text style={styles.eventType} numberOfLines={1}>
            {isClass ? '📚 Clase' : block.type === 'repaso' ? '🔄 Repaso' : '📖 Estudio'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Obtener fecha para mostrar
  const weekDates = getWeekDates(currentWeekStart);
  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      {/* Header de navegación */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.navButton}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>{formatWeekRange(currentWeekStart)}</Text>
          <Text style={styles.navSubtitle}>
            {weeklySummary.cutPeriod === 'corte1' ? 'Primer' : weeklySummary.cutPeriod === 'corte2' ? 'Segundo' : 'Tercer'} Corte
          </Text>
        </View>

        <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.navButton}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Botón generar plan IA */}
      {subjects.length > 0 && (
        <TouchableOpacity onPress={handleGeneratePlan} activeOpacity={0.8}>
          <LinearGradient
            colors={[T.colors.primary, T.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiButton}
          >
            <Text style={styles.aiButtonIcon}>✨</Text>
            <Text style={styles.aiButtonText}>Generar Plan de Estudio IA</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Grid semanal */}
      <ScrollView
        ref={scrollRef}
        style={styles.gridScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Headers de días */}
        <View style={styles.dayHeaders}>
          {DAYS_OF_WEEK.slice(0, 6).map((day, index) => {
            const date = weekDates[index];
            const isToday = date === today;
            const dayNum = new Date(date).getDate();
            
            return (
              <View key={day} style={[styles.dayHeaderItem, { width: DAY_WIDTH }]}>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                  {DAY_LABELS[day]}
                </Text>
                <View style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                  <Text style={[styles.dayNumberText, isToday && styles.dayNumberTextToday]}>
                    {dayNum}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Grid de horas */}
        <View style={styles.gridContainer}>
          {/* Columna de horas */}
          <View style={styles.hoursColumn}>
            {HOURS.map(hour => (
              <View key={hour} style={styles.hourItem}>
                <Text style={styles.hourText}>{hour}:00</Text>
              </View>
            ))}
          </View>

          {/* Grid de eventos */}
          <View style={styles.eventsGrid}>
            {/* Líneas horizontales */}
            {HOURS.map((hour, idx) => (
              <View key={hour} style={[styles.gridRow, idx % 2 === 0 && styles.gridRowAlt]}>
                {DAYS_OF_WEEK.slice(0, 6).map(day => (
                  <View key={day} style={[styles.gridCell, { width: DAY_WIDTH }]} />
                ))}
              </View>
            ))}

            {/* Bloques de eventos */}
            {allBlocks.map(renderBlock)}
          </View>
        </View>
      </ScrollView>

      {/* Modal de gestión de bloque */}
      <Modal
        visible={!!selectedBlock}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedBlock(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBlock(null)}
        >
          <View style={styles.modalContent}>
            {selectedBlock && (() => {
              const subject = subjects.find(s => s.id === selectedBlock.subjectId);
              return (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalColorBar, { backgroundColor: subject?.color || T.colors.primary }]} />
                    <View style={styles.modalHeaderInfo}>
                      <Text style={styles.modalTitle}>{subject?.code || 'Estudio'}</Text>
                      <Text style={styles.modalSubtitle}>{subject?.name}</Text>
                    </View>
                  </View>

                  <View style={styles.modalDetails}>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailIcon}>📅</Text>
                      <Text style={styles.modalDetailText}>
                        {DAY_LABELS[selectedBlock.day]} · {selectedBlock.startTime} - {selectedBlock.endTime}
                      </Text>
                    </View>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailIcon}>
                        {selectedBlock.type === 'repaso' ? '🔄' : '📖'}
                      </Text>
                      <Text style={styles.modalDetailText}>
                        {selectedBlock.type === 'repaso' ? 'Repaso' : 'Estudio independiente'}
                      </Text>
                    </View>
                    {selectedBlock.isAISuggested && (
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailIcon}>✨</Text>
                        <Text style={styles.modalDetailText}>Generado por IA</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      onPress={() => {
                        markBlockCompleted(selectedBlock.id);
                        setSelectedBlock(null);
                      }}
                      style={[
                        styles.modalActionButton,
                        selectedBlock.isCompleted && styles.modalActionButtonActive,
                      ]}
                    >
                      <Text style={styles.modalActionIcon}>
                        {selectedBlock.isCompleted ? '✅' : '⬜'}
                      </Text>
                      <Text style={styles.modalActionText}>
                        {selectedBlock.isCompleted ? 'Completado' : 'Marcar completado'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleDeleteBlock}
                      style={[styles.modalActionButton, styles.modalDeleteButton]}
                    >
                      <Text style={styles.modalActionIcon}>🗑️</Text>
                      <Text style={[styles.modalActionText, styles.modalDeleteText]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
    backgroundColor: T.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.colors.glassBorder,
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
  navCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: T.typography.body,
    fontWeight: T.typography.semibold as '600',
    color: T.colors.textPrimary,
  },
  navSubtitle: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
    marginTop: 2,
  },
  
  // AI Button
  aiButton: {
    marginHorizontal: T.spacing.lg,
    marginTop: T.spacing.md,
    paddingVertical: T.spacing.md,
    borderRadius: T.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonIcon: {
    fontSize: 18,
    marginRight: T.spacing.sm,
  },
  aiButtonText: {
    fontSize: T.typography.body,
    fontWeight: T.typography.semibold as '600',
    color: T.colors.textPrimary,
  },
  
  // Grid Scroll
  gridScroll: {
    flex: 1,
    marginTop: T.spacing.md,
  },
  
  // Day Headers
  dayHeaders: {
    flexDirection: 'row',
    marginLeft: 45,
    marginBottom: T.spacing.xs,
  },
  dayHeaderItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
  },
  dayLabelToday: {
    color: T.colors.primary,
    fontWeight: T.typography.bold as '700',
  },
  dayNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  dayNumberToday: {
    backgroundColor: T.colors.primary,
  },
  dayNumberText: {
    fontSize: T.typography.bodySmall,
    fontWeight: T.typography.medium as '500',
    color: T.colors.textPrimary,
  },
  dayNumberTextToday: {
    color: '#FFFFFF',
  },
  
  // Grid
  gridContainer: {
    flexDirection: 'row',
  },
  hoursColumn: {
    width: 45,
  },
  hourItem: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    paddingTop: -6,
  },
  hourText: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
    textAlign: 'right',
    paddingRight: T.spacing.sm,
  },
  eventsGrid: {
    flex: 1,
    position: 'relative',
  },
  gridRow: {
    height: HOUR_HEIGHT,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: T.colors.glassBorder,
  },
  gridRowAlt: {
    backgroundColor: T.colors.gridAlt,
  },
  gridCell: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.03)',
  },
  
  // Event Blocks
  eventBlock: {
    position: 'absolute',
    borderRadius: 6,
    borderLeftWidth: 3,
    padding: 4,
    overflow: 'hidden',
  },
  eventBlockCompleted: {
    opacity: 0.7,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventCode: {
    fontSize: T.typography.caption,
    fontWeight: T.typography.semibold as '600',
    color: '#FFFFFF',
    maxWidth: DAY_WIDTH - 30,
  },
  eventEmoji: {
    fontSize: 10,
  },
  eventTime: {
    fontSize: T.typography.micro,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  eventType: {
    fontSize: T.typography.micro,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: T.spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: T.colors.surfaceElevated,
    borderRadius: T.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.colors.glassBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  modalColorBar: {
    width: 6,
  },
  modalHeaderInfo: {
    flex: 1,
    padding: T.spacing.lg,
  },
  modalTitle: {
    fontSize: T.typography.h3,
    fontWeight: T.typography.bold as '700',
    color: T.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: T.typography.bodySmall,
    color: T.colors.textSecondary,
    marginTop: 2,
  },
  modalDetails: {
    paddingHorizontal: T.spacing.lg,
    paddingBottom: T.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: T.colors.glassBorder,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.spacing.sm,
  },
  modalDetailIcon: {
    fontSize: 14,
    marginRight: T.spacing.sm,
  },
  modalDetailText: {
    fontSize: T.typography.bodySmall,
    color: T.colors.textSecondary,
  },
  modalActions: {
    padding: T.spacing.md,
    gap: T.spacing.sm,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: T.spacing.md,
    backgroundColor: T.colors.glassBg,
    borderRadius: T.borderRadius.md,
    borderWidth: 1,
    borderColor: T.colors.glassBorder,
  },
  modalActionButtonActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  modalActionIcon: {
    fontSize: 18,
    marginRight: T.spacing.sm,
  },
  modalActionText: {
    fontSize: T.typography.body,
    color: T.colors.textPrimary,
  },
  modalDeleteButton: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  modalDeleteText: {
    color: T.colors.error,
  },
});

// ============================================
// HELPERS
// ============================================

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(weekStart);
  for (let i = 0; i < 6; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 5);
  
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} - ${end.getDate()} ${months[start.getMonth()]}`;
  }
  return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]}`;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
