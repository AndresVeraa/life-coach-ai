/**
 * UniversityScheduleScreen - Calendario Académico 2026-1
 * Life Coach AI
 * 
 * Diseño: Dark Luxury Wellness
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUniversityStore, useCurrentWeekSummary, useDaysUntilNextEvaluation } from '../university.store';
import { WeeklyView } from '../components/WeeklyView';
import { CalendarView } from '../components/CalendarView';
import { SubjectsView } from '../components/SubjectsView';
import { AddSubjectModal } from '../components/AddSubjectModal';
import { UNIVERSIDAD_THEME } from '../constants/theme';
import type { Subject } from '@/types/university.types';

const T = UNIVERSIDAD_THEME;

type TabType = 'semana' | 'calendario' | 'materias';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'semana', label: 'Semana', icon: '📅' },
  { id: 'calendario', label: 'Mes', icon: '🗓️' },
  { id: 'materias', label: 'Materias', icon: '📚' },
];

export const UniversityScheduleScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>('semana');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  const initializeAcademicCalendar2026 = useUniversityStore(state => state.initializeAcademicCalendar2026);
  const subjects = useUniversityStore(state => state.subjects);
  const isInitialized = useUniversityStore(state => state.isInitialized);
  
  const weeklySummary = useCurrentWeekSummary();
  const daysUntilNextEval = useDaysUntilNextEvaluation();

  // Inicializar calendario académico
  useEffect(() => {
    if (!isInitialized) {
      initializeAcademicCalendar2026();
    }
  }, [isInitialized, initializeAcademicCalendar2026]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const completionRate = weeklySummary.totalHoursPlanned > 0 
      ? Math.round((weeklySummary.totalHoursCompleted / weeklySummary.totalHoursPlanned) * 100)
      : 0;
    
    return {
      subjectsCount: subjects.length,
      hoursCompleted: weeklySummary.totalHoursCompleted.toFixed(1),
      hoursNeeded: weeklySummary.totalHoursNeeded.toFixed(1),
      completionRate,
    };
  }, [subjects, weeklySummary]);

  // Renderizar alert header
  const renderAlertHeader = () => {
    if (weeklySummary.isEvaluationWeek) {
      return (
        <View style={[styles.alertCard, styles.alertCritical]}>
          <View style={styles.alertIconContainer}>
            <Text style={styles.alertIcon}>⚠️</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>¡Semana de Evaluaciones!</Text>
            <Text style={styles.alertSubtitle}>
              {weeklySummary.cutPeriod === 'corte1' ? 'Primer' : weeklySummary.cutPeriod === 'corte2' ? 'Segundo' : 'Tercer'} Corte • x1.5 horas de estudio
            </Text>
          </View>
        </View>
      );
    }

    if (weeklySummary.isPreEvaluationWeek) {
      return (
        <View style={[styles.alertCard, styles.alertWarning]}>
          <View style={styles.alertIconContainer}>
            <Text style={styles.alertIcon}>⏰</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Pre-Evaluación</Text>
            <Text style={styles.alertSubtitle}>
              ¡Próxima semana hay exámenes! x1.25 horas de estudio
            </Text>
          </View>
        </View>
      );
    }

    if (daysUntilNextEval > 0 && daysUntilNextEval <= 14) {
      return (
        <View style={[styles.alertCard, styles.alertInfo]}>
          <View style={styles.alertIconContainer}>
            <Text style={styles.alertIcon}>📢</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{daysUntilNextEval} días para exámenes</Text>
            <Text style={styles.alertSubtitle}>
              Mantén tu ritmo de estudio constante
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  // Renderizar contenido según tab activo
  const renderContent = () => {
    switch (activeTab) {
      case 'semana':
        return <WeeklyView />;
      case 'calendario':
        return <CalendarView />;
      case 'materias':
        return (
          <SubjectsView 
            onAddSubject={() => {
              setEditingSubject(null);
              setShowAddModal(true);
            }}
            onEditSubject={(subject) => {
              setEditingSubject(subject);
              setShowAddModal(true);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={T.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerEmoji}>🎓</Text>
            <View>
              <Text style={styles.headerTitle}>Universidad</Text>
              <Text style={styles.headerSubtitle}>Semestre 2026-1</Text>
            </View>
          </View>
          
          {/* FAB Button */}
          <TouchableOpacity
            onPress={() => {
              setEditingSubject(null);
              setShowAddModal(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[T.colors.primary, T.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButton}
            >
              <Text style={styles.addButtonIcon}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Alertas de evaluación */}
        {renderAlertHeader()}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: T.colors.primary }]}>
              {stats.subjectsCount}
            </Text>
            <Text style={styles.statLabel}>Materias</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: T.colors.secondary }]}>
              {stats.hoursCompleted}/{stats.hoursNeeded}
            </Text>
            <Text style={styles.statLabel}>Horas/Semana</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: T.colors.success }]}>
              {stats.completionRate}%
            </Text>
            <Text style={styles.statLabel}>Completado</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive,
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabLabel,
                activeTab === tab.id && styles.tabLabelActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Modal de agregar/editar materia */}
      <AddSubjectModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingSubject(null);
        }}
        editSubject={editingSubject}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.colors.background,
  },
  
  // Header
  header: {
    paddingTop: (StatusBar.currentHeight || 44) + T.spacing.sm,
    paddingHorizontal: T.spacing.lg,
    paddingBottom: T.spacing.md,
    backgroundColor: T.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: T.colors.glassBorder,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.spacing.lg,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 32,
    marginRight: T.spacing.md,
  },
  headerTitle: {
    fontSize: T.typography.h1,
    fontWeight: T.typography.bold as '700',
    color: T.colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: T.typography.bodySmall,
    color: T.colors.textSecondary,
    marginTop: 2,
  },
  
  // Add Button
  addButton: {
    width: 48,
    height: 48,
    borderRadius: T.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonIcon: {
    fontSize: 28,
    fontWeight: T.typography.bold as '700',
    color: T.colors.textPrimary,
    marginTop: -2,
  },
  
  // Alert Cards
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: T.spacing.md,
    borderRadius: T.borderRadius.lg,
    marginBottom: T.spacing.md,
    borderWidth: 1,
  },
  alertCritical: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  alertWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  alertInfo: {
    backgroundColor: 'rgba(124, 111, 205, 0.1)',
    borderColor: 'rgba(124, 111, 205, 0.3)',
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: T.borderRadius.md,
    backgroundColor: T.colors.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: T.spacing.md,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: T.typography.body,
    fontWeight: T.typography.bold as '700',
    color: T.colors.textPrimary,
  },
  alertSubtitle: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
    marginTop: 2,
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginBottom: T.spacing.lg,
    gap: T.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: T.colors.glassBg,
    borderWidth: 1,
    borderColor: T.colors.glassBorder,
    borderRadius: T.borderRadius.lg,
    paddingVertical: T.spacing.md,
    paddingHorizontal: T.spacing.sm,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: T.typography.h2,
    fontWeight: T.typography.black as '900',
  },
  statLabel: {
    fontSize: T.typography.micro,
    color: T.colors.textSecondary,
    marginTop: T.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: T.colors.surface,
    borderRadius: T.borderRadius.pill,
    padding: T.spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: T.spacing.sm + 2,
    borderRadius: T.borderRadius.pill,
    gap: T.spacing.xs,
  },
  tabActive: {
    backgroundColor: T.colors.primary,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: T.typography.bodySmall,
    fontWeight: T.typography.semibold as '600',
    color: T.colors.textSecondary,
  },
  tabLabelActive: {
    color: T.colors.textPrimary,
  },
  
  // Content
  content: {
    flex: 1,
  },
});
