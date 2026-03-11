/**
 * SubjectsView - Vista de lista de materias
 * Life Coach AI - Dark Luxury Wellness Theme
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUniversityStore, useCurrentWeekSummary } from '../university.store';
import { Subject, SubjectType, DayOfWeek } from '@/types/university.types';
import { UNIVERSIDAD_THEME, SUBJECT_TYPE_THEME } from '../constants/theme';

const T = UNIVERSIDAD_THEME;

const SUBJECT_TYPE_LABELS: Record<SubjectType, string> = {
  tecnica: 'Técnica',
  matematica: 'Matemática',
  teorica: 'Teórica',
  humanistica: 'Humanística',
  laboratorio: 'Laboratorio',
};

const SUBJECT_TYPE_ICONS: Record<SubjectType, string> = {
  tecnica: '📘',
  matematica: '🔢',
  teorica: '📄',
  humanistica: '👥',
  laboratorio: '🧪',
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
};

interface SubjectsViewProps {
  onAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
}

export const SubjectsView = ({ onAddSubject, onEditSubject }: SubjectsViewProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const subjects = useUniversityStore(state => state.subjects);
  const deleteSubject = useUniversityStore(state => state.deleteSubject);
  const weeklySummary = useCurrentWeekSummary();

  // Calcular totales
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const totalClassHours = subjects.reduce((sum, s) => sum + s.weeklyClassHours, 0);
  const totalStudyHours = subjects.reduce((sum, s) => sum + s.weeklyStudyHoursNeeded, 0);

  // Confirmar eliminación
  const handleDelete = (subject: Subject) => {
    Alert.alert(
      'Eliminar Materia',
      `¿Estás seguro de eliminar "${subject.name}"? Se eliminarán también todos los bloques de estudio asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteSubject(subject.id),
        },
      ]
    );
  };

  // Renderizar resumen de horas semanales
  const renderWeeklySummaryCard = () => {
    const bySubject = weeklySummary.bySubject;
    
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📊 Resumen Semanal</Text>
        
        {bySubject.map(summary => {
          const progress = summary.hoursNeeded > 0
            ? Math.min(100, (summary.hoursPlanned / summary.hoursNeeded) * 100)
            : 0;

          return (
            <View key={summary.subjectId} style={styles.summaryItem}>
              <View style={styles.summaryItemHeader}>
                <View style={styles.summaryItemLeft}>
                  <View style={[styles.summaryDot, { backgroundColor: summary.subjectColor }]} />
                  <Text style={styles.summaryItemName} numberOfLines={1}>
                    {summary.subjectName}
                  </Text>
                </View>
                <Text style={styles.summaryItemHours}>
                  {summary.hoursPlanned.toFixed(1)}/{summary.hoursNeeded.toFixed(1)}h
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: progress >= 100 ? T.colors.success : summary.subjectColor,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}

        {bySubject.length === 0 && (
          <Text style={styles.summaryEmpty}>
            Agrega materias para ver tu resumen semanal
          </Text>
        )}
      </View>
    );
  };

  // Renderizar tarjeta de materia
  const renderSubjectCard = (subject: Subject) => {
    const isExpanded = expandedId === subject.id;
    const summaryData = weeklySummary.bySubject.find(s => s.subjectId === subject.id);
    const hoursThisWeek = summaryData?.hoursCompleted || 0;
    const typeTheme = SUBJECT_TYPE_THEME[subject.type];

    return (
      <View key={subject.id} style={styles.subjectCard}>
        {/* Header */}
        <TouchableOpacity
          onPress={() => setExpandedId(isExpanded ? null : subject.id)}
          style={styles.subjectHeader}
          activeOpacity={0.7}
        >
          <View style={[styles.subjectBar, { backgroundColor: subject.color }]} />

          <View style={styles.subjectInfo}>
            <View style={styles.subjectTypeRow}>
              <View style={[styles.subjectTypeBadge, { backgroundColor: typeTheme.bg }]}>
                <Text style={styles.subjectTypeIcon}>{SUBJECT_TYPE_ICONS[subject.type]}</Text>
                <Text style={[styles.subjectTypeLabel, { color: typeTheme.text }]}>
                  {SUBJECT_TYPE_LABELS[subject.type]}
                </Text>
              </View>
              <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
            </View>

            <Text style={styles.subjectName}>
              {subject.code} - {subject.name}
            </Text>

            <View style={styles.subjectStats}>
              <View style={styles.subjectStat}>
                <Text style={styles.subjectStatText}>{subject.credits} créditos</Text>
              </View>
              <View style={styles.subjectStatDivider} />
              <View style={styles.subjectStat}>
                <Text style={styles.subjectStatIcon}>⏰</Text>
                <Text style={styles.subjectStatText}>{subject.weeklyClassHours}h clase</Text>
              </View>
              <View style={styles.subjectStatDivider} />
              <View style={styles.subjectStat}>
                <Text style={styles.subjectStatIcon}>📖</Text>
                <Text style={[styles.subjectStatText, { color: T.colors.success }]}>
                  {subject.weeklyStudyHoursNeeded}h estudio
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Contenido expandido */}
        {isExpanded && (
          <View style={styles.subjectExpanded}>
            {/* Profesor */}
            {subject.professor && (
              <View style={styles.expandedSection}>
                <Text style={styles.expandedLabel}>Profesor</Text>
                <Text style={styles.expandedValue}>{subject.professor}</Text>
              </View>
            )}

            {/* Horario de clases */}
            <View style={styles.expandedSection}>
              <Text style={styles.expandedLabel}>Horario de Clases</Text>
              {subject.classSessions.map((session, index) => (
                <View key={session.id || `session-${index}`} style={styles.sessionItem}>
                  <View style={[styles.sessionDot, { backgroundColor: subject.color }]} />
                  <Text style={styles.sessionDay}>{DAY_LABELS[session.day]}</Text>
                  <Text style={styles.sessionTime}>
                    {session.startTime} - {session.endTime}
                  </Text>
                  {session.classroom && (
                    <Text style={styles.sessionRoom}>📍 {session.classroom}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* Esta semana */}
            <View style={styles.expandedSection}>
              <Text style={styles.expandedLabel}>Esta Semana</Text>
              <View style={styles.weekStatsRow}>
                <View style={styles.weekStatCard}>
                  <Text style={styles.weekStatLabel}>Completado</Text>
                  <Text style={[styles.weekStatValue, { color: T.colors.success }]}>
                    {hoursThisWeek.toFixed(1)}h
                  </Text>
                </View>
                <View style={styles.weekStatCard}>
                  <Text style={styles.weekStatLabel}>Meta</Text>
                  <Text style={[styles.weekStatValue, { color: T.colors.primary }]}>
                    {subject.weeklyStudyHoursNeeded}h
                  </Text>
                </View>
              </View>
            </View>

            {/* Notas */}
            {subject.notes && (
              <View style={styles.expandedSection}>
                <Text style={styles.expandedLabel}>Notas</Text>
                <Text style={styles.expandedValue}>{subject.notes}</Text>
              </View>
            )}

            {/* Acciones */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => onEditSubject(subject)}
                style={styles.editButton}
              >
                <Text style={styles.editIcon}>✏️</Text>
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(subject)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Resumen total */}
      <View style={styles.totalsRow}>
        <View style={[styles.totalCard, { backgroundColor: 'rgba(124, 111, 205, 0.15)' }]}>
          <Text style={[styles.totalLabel, { color: T.colors.primary }]}>Créditos</Text>
          <Text style={[styles.totalValue, { color: T.colors.primary }]}>{totalCredits}</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: 'rgba(78, 205, 196, 0.15)' }]}>
          <Text style={[styles.totalLabel, { color: T.colors.secondary }]}>Clase/sem</Text>
          <Text style={[styles.totalValue, { color: T.colors.secondary }]}>{totalClassHours}h</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: 'rgba(74, 222, 128, 0.15)' }]}>
          <Text style={[styles.totalLabel, { color: T.colors.success }]}>Estudio/sem</Text>
          <Text style={[styles.totalValue, { color: T.colors.success }]}>{totalStudyHours}h</Text>
        </View>
      </View>

      {/* Resumen semanal */}
      {subjects.length > 0 && renderWeeklySummaryCard()}

      {/* Lista de materias */}
      {subjects.map(renderSubjectCard)}

      {/* Estado vacío */}
      {subjects.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📚</Text>
          </View>
          <Text style={styles.emptyTitle}>Sin materias registradas</Text>
          <Text style={styles.emptyDescription}>
            Agrega tus materias para empezar a organizar tu horario y generar planes de estudio inteligentes
          </Text>
          <TouchableOpacity onPress={onAddSubject} activeOpacity={0.8}>
            <LinearGradient
              colors={[T.colors.primary, T.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Text style={styles.addButtonIcon}>+</Text>
              <Text style={styles.addButtonText}>Agregar Materia</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Botón para agregar */}
      {subjects.length > 0 && (
        <TouchableOpacity onPress={onAddSubject} activeOpacity={0.8}>
          <LinearGradient
            colors={[T.colors.primary, T.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomAddButton}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Agregar Nueva Materia</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.colors.background,
    paddingVertical: T.spacing.lg,
  },
  
  // Totals Row
  totalsRow: {
    flexDirection: 'row',
    marginHorizontal: T.spacing.lg,
    marginBottom: T.spacing.lg,
    gap: T.spacing.sm,
  },
  totalCard: {
    flex: 1,
    borderRadius: T.borderRadius.lg,
    padding: T.spacing.md,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: T.typography.caption,
  },
  totalValue: {
    fontSize: T.typography.h2,
    fontWeight: T.typography.bold as '700',
  },
  
  // Summary Card
  summaryCard: {
    backgroundColor: T.colors.surface,
    borderRadius: T.borderRadius.xl,
    padding: T.spacing.lg,
    marginHorizontal: T.spacing.lg,
    marginBottom: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.colors.glassBorder,
  },
  summaryTitle: {
    fontSize: T.typography.body,
    fontWeight: T.typography.semibold as '600',
    color: T.colors.textPrimary,
    marginBottom: T.spacing.md,
  },
  summaryItem: {
    marginBottom: T.spacing.md,
  },
  summaryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.spacing.xs,
  },
  summaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: T.spacing.sm,
  },
  summaryItemName: {
    fontSize: T.typography.bodySmall,
    color: T.colors.textPrimary,
    flex: 1,
  },
  summaryItemHours: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: T.colors.glassBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryEmpty: {
    color: T.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: T.spacing.lg,
  },
  
  // Subject Card
  subjectCard: {
    backgroundColor: T.colors.surface,
    borderRadius: T.borderRadius.xl,
    marginHorizontal: T.spacing.lg,
    marginBottom: T.spacing.md,
    borderWidth: 1,
    borderColor: T.colors.glassBorder,
    overflow: 'hidden',
  },
  subjectHeader: {
    flexDirection: 'row',
    padding: T.spacing.lg,
  },
  subjectBar: {
    width: 4,
    borderRadius: 2,
    marginRight: T.spacing.md,
    minHeight: 60,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing.xs,
  },
  subjectTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: T.spacing.sm,
    paddingVertical: T.spacing.xs,
    borderRadius: T.borderRadius.sm,
  },
  subjectTypeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  subjectTypeLabel: {
    fontSize: T.typography.caption,
    fontWeight: T.typography.medium as '500',
  },
  expandIcon: {
    fontSize: 12,
    color: T.colors.textSecondary,
  },
  subjectName: {
    fontSize: T.typography.body,
    fontWeight: T.typography.bold as '700',
    color: T.colors.textPrimary,
    marginBottom: T.spacing.sm,
  },
  subjectStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  subjectStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectStatIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  subjectStatText: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
  },
  subjectStatDivider: {
    width: 1,
    height: 12,
    backgroundColor: T.colors.glassBorder,
    marginHorizontal: T.spacing.sm,
  },
  
  // Subject Expanded
  subjectExpanded: {
    borderTopWidth: 1,
    borderTopColor: T.colors.glassBorder,
    padding: T.spacing.lg,
    backgroundColor: T.colors.glassBg,
  },
  expandedSection: {
    marginBottom: T.spacing.md,
  },
  expandedLabel: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
    marginBottom: T.spacing.xs,
  },
  expandedValue: {
    fontSize: T.typography.bodySmall,
    color: T.colors.textPrimary,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.colors.surface,
    borderRadius: T.borderRadius.md,
    padding: T.spacing.sm,
    marginBottom: T.spacing.xs,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: T.spacing.sm,
  },
  sessionDay: {
    flex: 1,
    fontSize: T.typography.bodySmall,
    color: T.colors.textPrimary,
  },
  sessionTime: {
    fontSize: T.typography.bodySmall,
    color: T.colors.textSecondary,
  },
  sessionRoom: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
    marginLeft: T.spacing.sm,
  },
  weekStatsRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
  },
  weekStatCard: {
    flex: 1,
    backgroundColor: T.colors.surface,
    borderRadius: T.borderRadius.md,
    padding: T.spacing.sm,
  },
  weekStatLabel: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
  },
  weekStatValue: {
    fontSize: T.typography.h3,
    fontWeight: T.typography.bold as '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: T.spacing.sm,
    gap: T.spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 111, 205, 0.15)',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    borderRadius: T.borderRadius.md,
  },
  editIcon: {
    fontSize: 14,
    marginRight: T.spacing.xs,
  },
  editText: {
    fontSize: T.typography.bodySmall,
    fontWeight: T.typography.medium as '500',
    color: T.colors.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    borderRadius: T.borderRadius.md,
  },
  deleteIcon: {
    fontSize: 14,
    marginRight: T.spacing.xs,
  },
  deleteText: {
    fontSize: T.typography.bodySmall,
    fontWeight: T.typography.medium as '500',
    color: T.colors.error,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: T.spacing.xxl,
    paddingHorizontal: T.spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: T.colors.glassBg,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: T.spacing.lg,
  },
  emptyIconText: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: T.typography.h3,
    fontWeight: T.typography.semibold as '600',
    color: T.colors.textPrimary,
    marginBottom: T.spacing.sm,
  },
  emptyDescription: {
    fontSize: T.typography.body,
    color: T.colors.textSecondary,
    textAlign: 'center',
    marginBottom: T.spacing.xl,
    paddingHorizontal: T.spacing.lg,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: T.spacing.xl,
    paddingVertical: T.spacing.md,
    borderRadius: T.borderRadius.lg,
  },
  addButtonIcon: {
    fontSize: 20,
    color: T.colors.textPrimary,
    marginRight: T.spacing.sm,
  },
  addButtonText: {
    fontSize: T.typography.body,
    fontWeight: T.typography.semibold as '600',
    color: T.colors.textPrimary,
  },
  bottomAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: T.spacing.lg,
    marginBottom: T.spacing.xl,
    paddingVertical: T.spacing.lg,
    borderRadius: T.borderRadius.lg,
  },
});
