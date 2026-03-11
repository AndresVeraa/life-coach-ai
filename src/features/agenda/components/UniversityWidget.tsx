/**
 * UniversityWidget - Widget para mostrar información académica en Home
 * Life Coach AI
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useUniversityStore, useTodaySchedule, useDaysUntilNextEvaluation } from '../university.store';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<any>;

export const UniversityWidget = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const subjects = useUniversityStore(state => state.subjects);
  const isInitialized = useUniversityStore(state => state.isInitialized);
  const initializeAcademicCalendar2026 = useUniversityStore(state => state.initializeAcademicCalendar2026);
  
  const todaySchedule = useTodaySchedule();
  const daysUntilNextEval = useDaysUntilNextEvaluation();

  // Inicializar calendario si es necesario
  useEffect(() => {
    if (!isInitialized) {
      initializeAcademicCalendar2026();
    }
  }, [isInitialized, initializeAcademicCalendar2026]);

  // Navegar a la pantalla de universidad
  const handlePress = () => {
    navigation.navigate('UniversitySchedule');
  };

  // Si no hay materias, mostrar CTA para agregar
  if (subjects.length === 0) {
    return (
      <TouchableOpacity onPress={handlePress} style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyIcon}>🎓</Text>
          <View style={styles.emptyTextContainer}>
            <Text style={styles.emptyTitle}>Universidad</Text>
            <Text style={styles.emptySubtitle}>
              Toca para agregar tus materias y organizar tu semestre
            </Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Calcular estadísticas
  const { classes, studyBlocks } = todaySchedule;
  const allTodayBlocks = [...classes, ...studyBlocks].sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );
  
  // Próxima clase/estudio
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const nextBlock = allTodayBlocks.find(b => b.startTime > currentTime);
  const currentBlock = allTodayBlocks.find(b => 
    b.startTime <= currentTime && b.endTime > currentTime
  );

  // Obtener nombre de materia
  const getSubjectName = (subjectId: string): string => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.code || 'Materia';
  };

  const getSubjectColor = (subjectId: string): string => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.color || '#4F46E5';
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🎓</Text>
        <Text style={styles.headerTitle}>Universidad</Text>
        {daysUntilNextEval > 0 && daysUntilNextEval <= 14 && (
          <View style={[
            styles.evalBadge,
            { backgroundColor: daysUntilNextEval <= 7 ? '#FEE2E2' : '#FEF3C7' }
          ]}>
            <Text style={[
              styles.evalText,
              { color: daysUntilNextEval <= 7 ? '#DC2626' : '#CA8A04' }
            ]}>
              ⚠️ {daysUntilNextEval}d para exámenes
            </Text>
          </View>
        )}
        <Text style={styles.arrow}>→</Text>
      </View>

      {/* Estado actual */}
      {currentBlock ? (
        <View style={[styles.currentBlock, { borderLeftColor: getSubjectColor(currentBlock.subjectId) }]}>
          <View style={styles.currentIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.currentLabel}>AHORA</Text>
          </View>
          <Text style={styles.currentTitle}>
            {currentBlock.type === 'clase' ? '📚' : '📖'} {getSubjectName(currentBlock.subjectId)}
          </Text>
          <Text style={styles.currentTime}>
            {currentBlock.startTime} - {currentBlock.endTime}
          </Text>
        </View>
      ) : nextBlock ? (
        <View style={[styles.nextBlock, { borderLeftColor: getSubjectColor(nextBlock.subjectId) }]}>
          <Text style={styles.nextLabel}>SIGUIENTE</Text>
          <Text style={styles.nextTitle}>
            {nextBlock.type === 'clase' ? '📚' : '📖'} {getSubjectName(nextBlock.subjectId)}
          </Text>
          <Text style={styles.nextTime}>{nextBlock.startTime}</Text>
        </View>
      ) : (
        <View style={styles.freeBlock}>
          <Text style={styles.freeText}>
            {allTodayBlocks.length === 0 
              ? '😴 Sin clases ni estudio programado hoy'
              : '✅ Actividades del día completadas'}
          </Text>
        </View>
      )}

      {/* Footer con resumen */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerValue}>{classes.length}</Text>
          <Text style={styles.footerLabel}>Clases</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerItem}>
          <Text style={styles.footerValue}>{studyBlocks.length}</Text>
          <Text style={styles.footerLabel}>Bloques</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerItem}>
          <Text style={styles.footerValue}>{subjects.length}</Text>
          <Text style={styles.footerLabel}>Materias</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyContainer: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
  },
  emptyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  evalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  evalText: {
    fontSize: 11,
    fontWeight: '600',
  },
  currentBlock: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  currentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  currentLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 1,
  },
  currentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  currentTime: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  nextBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  nextLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 4,
  },
  nextTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  nextTime: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  freeBlock: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  freeText: {
    fontSize: 14,
    color: '#059669',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  footerItem: {
    alignItems: 'center',
  },
  footerValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  footerLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  footerDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
});
