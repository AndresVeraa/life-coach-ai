/**
 * AgendaClasesSection - Sección de clases integrada en AgendaScreen
 * Life Coach AI - Dark Luxury Wellness Theme
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useClasesHoy, useClasesDia, useUniversityStats, useProximaClase } from '../hooks/useClasesHoy';
import { useUniversityStore } from '../university.store';
import { UNIVERSIDAD_THEME } from '../constants/theme';

// Configurar LayoutAnimation para Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { colors, spacing, borderRadius, typography } = UNIVERSIDAD_THEME;

type NavigationProp = NativeStackNavigationProp<any>;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const AgendaClasesSection: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [expandedWeek, setExpandedWeek] = useState(false);
  
  const subjects = useUniversityStore(state => state.subjects);
  const clasesHoy = useClasesHoy();
  const stats = useUniversityStats();
  const proximaClase = useProximaClase();

  // Toggle expandir semana
  const toggleWeekExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedWeek(!expandedWeek);
  }, [expandedWeek]);

  // Navegar a pantalla de Universidad
  const goToUniversity = useCallback(() => {
    navigation.navigate('UniversitySchedule');
  }, [navigation]);

  // Si no hay materias, mostrar CTA para agregar
  if (subjects.length === 0) {
    return (
      <TouchableOpacity onPress={goToUniversity} activeOpacity={0.8}>
        <LinearGradient
          colors={[colors.surfaceElevated, colors.surface]}
          style={styles.emptyContainer}
        >
          <View style={styles.emptyContent}>
            <Text style={styles.emptyIcon}>🎓</Text>
            <View style={styles.emptyTextArea}>
              <Text style={styles.emptyTitle}>Configura tu horario</Text>
              <Text style={styles.emptySubtitle}>
                Agrega tus materias para ver tus clases aquí
              </Text>
            </View>
            <View style={styles.emptyArrow}>
              <Text style={styles.emptyArrowText}>→</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con título y botón expandir */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToUniversity} style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🎓</Text>
          <Text style={styles.headerTitle}>Clases de hoy</Text>
          {stats.examAlertLevel !== 'ok' && (
            <View style={[
              styles.alertBadge,
              stats.examAlertLevel === 'critical' && styles.alertCritical
            ]}>
              <Text style={styles.alertText}>
                {stats.daysUntilExam}d
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={toggleWeekExpand} style={styles.expandBtn}>
          <Text style={styles.expandBtnText}>
            {expandedWeek ? 'Ver menos' : 'Semana'}
          </Text>
          <Text style={styles.expandIcon}>{expandedWeek ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de clases de hoy */}
      {clasesHoy.length > 0 ? (
        <View style={styles.clasesContainer}>
          {clasesHoy.map((clase, index) => (
            <ClaseCard key={clase.id} clase={clase} isLast={index === clasesHoy.length - 1} />
          ))}
        </View>
      ) : (
        <View style={styles.noClasesContainer}>
          <Text style={styles.noClasesIcon}>📚</Text>
          <Text style={styles.noClasesText}>Sin clases hoy</Text>
        </View>
      )}

      {/* Vista semanal expandida */}
      {expandedWeek && <WeeklyMiniView />}

      {/* Stats Row */}
      <StatsRow stats={stats} onPress={goToUniversity} />
    </View>
  );
};

// ============================================
// TARJETA DE CLASE
// ============================================

interface ClaseCardProps {
  clase: {
    id: string;
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
  };
  isLast: boolean;
}

const ClaseCard: React.FC<ClaseCardProps> = ({ clase, isLast }) => {
  const isHighlighted = clase.isActive || clase.isNext;
  
  return (
    <View style={[
      styles.claseCard,
      isHighlighted && styles.claseCardHighlighted,
      clase.isPast && styles.claseCardPast,
      !isLast && styles.claseCardMargin,
    ]}>
      <View style={[styles.claseIndicator, { backgroundColor: clase.color }]} />
      
      <View style={styles.claseTimeContainer}>
        <Text style={[styles.claseTime, clase.isPast && styles.textPast]}>
          {clase.startTime}
        </Text>
        <Text style={[styles.claseTimeSeparator, clase.isPast && styles.textPast]}>|</Text>
        <Text style={[styles.claseTimeEnd, clase.isPast && styles.textPast]}>
          {clase.endTime}
        </Text>
      </View>
      
      <View style={styles.claseInfo}>
        <Text 
          style={[styles.claseName, clase.isPast && styles.textPast]}
          numberOfLines={1}
        >
          {clase.subjectCode}
        </Text>
        {clase.location && (
          <Text style={[styles.claseLocation, clase.isPast && styles.textPast]}>
            📍 {clase.location}
          </Text>
        )}
      </View>
      
      {isHighlighted && (
        <View style={[
          styles.statusBadge,
          clase.isActive ? styles.activeBadge : styles.nextBadge
        ]}>
          <Text style={styles.statusText}>
            {clase.isActive ? 'AHORA' : 'SIGUIENTE'}
          </Text>
        </View>
      )}
      
      {clase.type === 'estudio' && (
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>📖</Text>
        </View>
      )}
    </View>
  );
};

// ============================================
// VISTA MINI SEMANAL
// ============================================

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S'];
const DIA_INDICES = [1, 2, 3, 4, 5, 6];

const WeeklyMiniView: React.FC = () => {
  const today = new Date().getDay();

  return (
    <View style={styles.weekContainer}>
      <View style={styles.weekHeader}>
        {DIAS.map((dia, idx) => {
          const dayIdx = DIA_INDICES[idx];
          const isToday = dayIdx === today;
          return (
            <View
              key={dia}
              style={[styles.weekDayHeader, isToday && styles.weekDayToday]}
            >
              <Text style={[styles.weekDayText, isToday && styles.weekDayTextToday]}>
                {dia}
              </Text>
            </View>
          );
        })}
      </View>
      
      <View style={styles.weekContent}>
        {DIA_INDICES.map((dayIdx) => (
          <DayColumn key={dayIdx} dayIndex={dayIdx} isToday={dayIdx === today} />
        ))}
      </View>
    </View>
  );
};

// ============================================
// COLUMNA DE DÍA
// ============================================

interface DayColumnProps {
  dayIndex: number;
  isToday: boolean;
}

const DayColumn: React.FC<DayColumnProps> = ({ dayIndex, isToday }) => {
  const clases = useClasesDia(dayIndex);

  return (
    <View style={[styles.dayColumn, isToday && styles.dayColumnToday]}>
      {clases.length > 0 ? (
        clases.slice(0, 4).map((clase) => (
          <View
            key={clase.id}
            style={[styles.miniBlock, { backgroundColor: clase.color + '90' }]}
          >
            <Text style={styles.miniBlockTime}>{clase.startTime.slice(0, 2)}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.dayEmptyText}>-</Text>
      )}
      {clases.length > 4 && (
        <Text style={styles.moreText}>+{clases.length - 4}</Text>
      )}
    </View>
  );
};

// ============================================
// FILA DE ESTADÍSTICAS
// ============================================

interface StatsRowProps {
  stats: {
    totalSubjects: number;
    totalClasesHoy: number;
    horasClaseHoy: number;
    horasEstudioHoy: number;
    daysUntilExam: number;
    examAlertLevel: 'ok' | 'warning' | 'critical';
  };
  onPress: () => void;
}

const StatsRow: React.FC<StatsRowProps> = ({ stats, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.totalSubjects}</Text>
        <Text style={styles.statLabel}>Materias</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.horasClaseHoy.toFixed(1)}h</Text>
        <Text style={styles.statLabel}>Clases hoy</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={[
          styles.statValue,
          stats.examAlertLevel === 'critical' && styles.statCritical,
          stats.examAlertLevel === 'warning' && styles.statWarning,
        ]}>
          {stats.daysUntilExam > 0 ? `${stats.daysUntilExam}d` : '∞'}
        </Text>
        <Text style={styles.statLabel}>P/ Examen</Text>
      </View>
      
      <View style={styles.statArrow}>
        <Text style={styles.statArrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  
  // Empty State
  emptyContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  emptyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  emptyTextArea: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyArrowText: {
    fontSize: 16,
    color: colors.primary,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  alertBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.warning + '30',
  },
  alertCritical: {
    backgroundColor: colors.error + '30',
  },
  alertText: {
    fontSize: typography.caption,
    fontWeight: typography.bold,
    color: colors.warning,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  expandBtnText: {
    fontSize: typography.bodySmall,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  expandIcon: {
    fontSize: 10,
    color: colors.primary,
  },
  
  // Clases Container
  clasesContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  
  // Clase Card
  claseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  claseCardMargin: {
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  claseCardHighlighted: {
    backgroundColor: colors.glassBg,
  },
  claseCardPast: {
    opacity: 0.5,
  },
  claseIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  claseTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  claseTime: {
    fontSize: typography.bodySmall,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  claseTimeSeparator: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginHorizontal: 2,
  },
  claseTimeEnd: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  claseInfo: {
    flex: 1,
  },
  claseName: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  claseLocation: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  textPast: {
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
  },
  activeBadge: {
    backgroundColor: colors.secondary + '30',
  },
  nextBadge: {
    backgroundColor: colors.primary + '30',
  },
  statusText: {
    fontSize: typography.micro,
    fontWeight: typography.bold,
    color: colors.secondary,
  },
  typeBadge: {
    marginLeft: spacing.xs,
  },
  typeText: {
    fontSize: 14,
  },
  
  // No clases
  noClasesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  noClasesIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  noClasesText: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  
  // Weekly Mini View
  weekContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  weekDayToday: {
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.sm,
  },
  weekDayText: {
    fontSize: typography.caption,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  weekDayTextToday: {
    color: colors.primary,
  },
  weekContent: {
    flexDirection: 'row',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    minHeight: 60,
  },
  dayColumnToday: {
    backgroundColor: colors.glassBg,
    borderRadius: borderRadius.sm,
  },
  miniBlock: {
    width: '80%',
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 4,
  },
  miniBlockTime: {
    fontSize: typography.micro,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  dayEmptyText: {
    fontSize: typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  moreText: {
    fontSize: typography.micro,
    color: colors.textMuted,
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.h3,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  statCritical: {
    color: colors.error,
  },
  statWarning: {
    color: colors.warning,
  },
  statLabel: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.glassBorder,
    marginHorizontal: spacing.sm,
  },
  statArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  statArrowText: {
    fontSize: 14,
    color: colors.primary,
  },
});

export default AgendaClasesSection;
