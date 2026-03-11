/**
 * AddSubjectModal - Formulario para agregar/editar materias
 * Life Coach AI - Dark Luxury Wellness Theme
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUniversityStore } from '../university.store';
import {
  Subject,
  SubjectFormData,
  ClassSessionFormData,
  SubjectType,
  DayOfWeek,
  SUBJECT_TYPE_COLORS,
  PREDEFINED_COLORS,
  calculateWeeklyStudyHours,
} from '@/types/university.types';
import { UNIVERSIDAD_THEME, SUBJECT_TYPE_THEME } from '../constants/theme';

const T = UNIVERSIDAD_THEME;

const SUBJECT_TYPES: { id: SubjectType; label: string; icon: string }[] = [
  { id: 'tecnica', label: 'Técnica', icon: '📘' },
  { id: 'matematica', label: 'Matemática', icon: '🔢' },
  { id: 'teorica', label: 'Teórica', icon: '📄' },
  { id: 'humanistica', label: 'Humanística', icon: '👥' },
  { id: 'laboratorio', label: 'Laboratorio', icon: '🧪' },
];

const DAY_OPTIONS: { id: DayOfWeek; label: string }[] = [
  { id: 'lunes', label: 'Lun' },
  { id: 'martes', label: 'Mar' },
  { id: 'miercoles', label: 'Mié' },
  { id: 'jueves', label: 'Jue' },
  { id: 'viernes', label: 'Vie' },
  { id: 'sabado', label: 'Sáb' },
];

interface AddSubjectModalProps {
  visible: boolean;
  onClose: () => void;
  editSubject?: Subject | null; // Materia a editar (opcional)
}

const initialSession: ClassSessionFormData = {
  day: 'lunes',
  startTime: '08:00',
  endTime: '10:00',
};

export const AddSubjectModal = ({ visible, onClose, editSubject }: AddSubjectModalProps) => {
  const addSubject = useUniversityStore(state => state.addSubject);
  const updateSubject = useUniversityStore(state => state.updateSubject);
  
  const isEditing = !!editSubject;

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState('3');
  const [type, setType] = useState<SubjectType>('tecnica');
  const [color, setColor] = useState(SUBJECT_TYPE_COLORS.tecnica);
  const [professor, setProfessor] = useState('');
  const [notes, setNotes] = useState('');
  const [sessions, setSessions] = useState<ClassSessionFormData[]>([{ ...initialSession }]);

  // Calculated values
  const creditsNum = parseInt(credits) || 0;
  const weeklyClassHours = sessions.reduce((sum, session) => {
    const start = timeToMinutes(session.startTime);
    const end = timeToMinutes(session.endTime);
    return sum + Math.max(0, (end - start) / 60);
  }, 0);
  const weeklyStudyHours = calculateWeeklyStudyHours(creditsNum, weeklyClassHours);

  // Cargar datos de materia cuando se edita
  useEffect(() => {
    if (editSubject && visible) {
      setCode(editSubject.code);
      setName(editSubject.name);
      setCredits(editSubject.credits.toString());
      setType(editSubject.type);
      setColor(editSubject.color);
      setProfessor(editSubject.professor || '');
      setNotes(editSubject.notes || '');
      setSessions(editSubject.classSessions.map(s => ({
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        classroom: s.classroom,
        location: s.location,
      })));
    } else if (!editSubject && visible) {
      resetForm();
    }
  }, [editSubject, visible]);

  // Update color when type changes (solo si no está editando)
  useEffect(() => {
    if (!isEditing) {
      setColor(SUBJECT_TYPE_COLORS[type]);
    }
  }, [type, isEditing]);

  // Reset form
  const resetForm = () => {
    setCode('');
    setName('');
    setCredits('3');
    setType('tecnica');
    setColor(SUBJECT_TYPE_COLORS.tecnica);
    setProfessor('');
    setNotes('');
    setSessions([{ ...initialSession }]);
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Add session
  const addSession = () => {
    if (sessions.length >= 6) {
      Alert.alert('Límite', 'Máximo 6 sesiones por materia');
      return;
    }
    setSessions([...sessions, { ...initialSession }]);
  };

  // Remove session
  const removeSession = (index: number) => {
    if (sessions.length === 1) {
      Alert.alert('Error', 'Debe haber al menos una sesión de clase');
      return;
    }
    setSessions(sessions.filter((_, i) => i !== index));
  };

  // Update session
  const updateSession = (index: number, field: keyof ClassSessionFormData, value: string) => {
    const updated = [...sessions];
    updated[index] = { ...updated[index], [field]: value };
    setSessions(updated);
  };

  // Validate and submit
  const handleSubmit = () => {
    // Validations
    if (!code.trim()) {
      Alert.alert('Error', 'El código de la materia es requerido');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la materia es requerido');
      return;
    }
    if (creditsNum < 1 || creditsNum > 10) {
      Alert.alert('Error', 'Los créditos deben estar entre 1 y 10');
      return;
    }

    // Validate sessions
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      const start = timeToMinutes(session.startTime);
      const end = timeToMinutes(session.endTime);
      if (start >= end) {
        Alert.alert('Error', `La sesión ${i + 1} tiene horario inválido`);
        return;
      }
    }

    const formData: SubjectFormData = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      credits: creditsNum,
      type,
      weeklyClassHours,
      color,
      professor: professor.trim() || undefined,
      notes: notes.trim() || undefined,
      classSessions: sessions,
    };

    if (isEditing && editSubject) {
      updateSubject(editSubject.id, formData);
      handleClose();
      Alert.alert('¡Actualizado!', `${formData.code} se actualizó correctamente`);
    } else {
      addSubject(formData);
      handleClose();
      Alert.alert('¡Listo!', `${formData.code} agregada exitosamente`);
    }
  };

  // Render session input
  const renderSessionInput = (session: ClassSessionFormData, index: number) => (
    <View key={index} style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>Sesión {index + 1}</Text>
        <TouchableOpacity onPress={() => removeSession(index)} style={styles.sessionDelete}>
          <Text style={styles.sessionDeleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Días */}
      <Text style={styles.inputLabel}>Día</Text>
      <View style={styles.daysRow}>
        {DAY_OPTIONS.map(day => (
          <TouchableOpacity
            key={day.id}
            onPress={() => updateSession(index, 'day', day.id)}
            style={[
              styles.dayChip,
              session.day === day.id && styles.dayChipActive,
            ]}
          >
            <Text style={[
              styles.dayChipText,
              session.day === day.id && styles.dayChipTextActive,
            ]}>
              {day.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Horario */}
      <View style={styles.timeRow}>
        <View style={styles.timeInput}>
          <Text style={styles.inputLabel}>Hora inicio</Text>
          <TextInput
            style={styles.textInput}
            value={session.startTime}
            onChangeText={(v) => updateSession(index, 'startTime', v)}
            placeholder="08:00"
            placeholderTextColor={T.colors.textSecondary}
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <View style={styles.timeInput}>
          <Text style={styles.inputLabel}>Hora fin</Text>
          <TextInput
            style={styles.textInput}
            value={session.endTime}
            onChangeText={(v) => updateSession(index, 'endTime', v)}
            placeholder="10:00"
            placeholderTextColor={T.colors.textSecondary}
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>

      {/* Aula */}
      <View style={styles.classroomInput}>
        <Text style={styles.inputLabel}>Aula (opcional)</Text>
        <TextInput
          style={styles.textInput}
          value={session.classroom || ''}
          onChangeText={(v) => updateSession(index, 'classroom', v)}
          placeholder="Ej: A-301"
          placeholderTextColor={T.colors.textSecondary}
        />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Handle Indicator */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Editar Materia' : 'Nueva Materia'}</Text>
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.8}>
            <LinearGradient
              colors={[T.colors.primary, T.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>{isEditing ? 'Actualizar' : 'Guardar'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Código */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Código de la materia *</Text>
            <TextInput
              style={styles.textInput}
              value={code}
              onChangeText={setCode}
              placeholder="Ej: MAT301"
              placeholderTextColor={T.colors.textSecondary}
              autoCapitalize="characters"
              maxLength={10}
            />
          </View>

          {/* Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre de la materia *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Ej: Cálculo Diferencial"
              placeholderTextColor={T.colors.textSecondary}
              maxLength={50}
            />
          </View>

          {/* Créditos */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Créditos *</Text>
            <View style={styles.creditsRow}>
              {[1, 2, 3, 4, 5, 6].map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCredits(c.toString())}
                  style={[
                    styles.creditChip,
                    credits === c.toString() && styles.creditChipActive,
                  ]}
                >
                  <Text style={[
                    styles.creditChipText,
                    credits === c.toString() && styles.creditChipTextActive,
                  ]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tipo de materia */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tipo de materia</Text>
            <View style={styles.typesGrid}>
              {SUBJECT_TYPES.map(t => {
                const typeTheme = SUBJECT_TYPE_THEME[t.id];
                const isSelected = type === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setType(t.id)}
                    style={[
                      styles.typeCard,
                      isSelected && { borderColor: typeTheme.text, backgroundColor: typeTheme.bg },
                    ]}
                  >
                    <Text style={styles.typeIcon}>{t.icon}</Text>
                    <Text style={[
                      styles.typeLabel,
                      isSelected && { color: typeTheme.text },
                    ]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Color */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.colorsRow}>
              {PREDEFINED_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorCircle, { backgroundColor: c }]}
                >
                  {color === c && <Text style={styles.colorCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Profesor */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Profesor (opcional)</Text>
            <TextInput
              style={styles.textInput}
              value={professor}
              onChangeText={setProfessor}
              placeholder="Nombre del profesor"
              placeholderTextColor={T.colors.textSecondary}
            />
          </View>

          {/* Sesiones de clase */}
          <View style={styles.inputGroup}>
            <View style={styles.sessionsHeader}>
              <Text style={styles.inputLabel}>Horario de clases *</Text>
              <TouchableOpacity onPress={addSession} style={styles.addSessionButton}>
                <Text style={styles.addSessionIcon}>+</Text>
                <Text style={styles.addSessionText}>Agregar</Text>
              </TouchableOpacity>
            </View>
            {sessions.map((session, index) => renderSessionInput(session, index))}
          </View>

          {/* Notas */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notas (opcional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notas adicionales..."
              placeholderTextColor={T.colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Cálculo de horas */}
          <View style={styles.calculationCard}>
            <View style={styles.calculationHeader}>
              <Text style={styles.calculationIcon}>📊</Text>
              <Text style={styles.calculationTitle}>Cálculo Automático</Text>
            </View>
            <Text style={styles.calculationDescription}>
              Basado en {creditsNum} créditos × 48h/semestre ÷ 16 semanas
            </Text>
            
            <View style={styles.calculationStats}>
              <View style={styles.calculationStat}>
                <View style={styles.calculationStatHeader}>
                  <Text style={styles.calculationStatIcon}>⏰</Text>
                  <Text style={styles.calculationStatLabel}>Clase</Text>
                </View>
                <Text style={[styles.calculationStatValue, { color: T.colors.textPrimary }]}>
                  {weeklyClassHours.toFixed(1)}h
                </Text>
                <Text style={styles.calculationStatSub}>por semana</Text>
              </View>
              <View style={styles.calculationStat}>
                <View style={styles.calculationStatHeader}>
                  <Text style={styles.calculationStatIcon}>📖</Text>
                  <Text style={[styles.calculationStatLabel, { color: T.colors.success }]}>Estudio</Text>
                </View>
                <Text style={[styles.calculationStatValue, { color: T.colors.success }]}>
                  {weeklyStudyHours}h
                </Text>
                <Text style={styles.calculationStatSub}>independiente/sem</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.colors.background,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: T.spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: T.colors.glassBorder,
    borderRadius: 2,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: T.colors.glassBorder,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: T.borderRadius.md,
    backgroundColor: T.colors.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: T.colors.textSecondary,
  },
  headerTitle: {
    fontSize: T.typography.h3,
    fontWeight: T.typography.bold as '700',
    color: T.colors.textPrimary,
  },
  saveButton: {
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.sm,
    borderRadius: T.borderRadius.md,
  },
  saveButtonText: {
    fontSize: T.typography.body,
    fontWeight: T.typography.semibold as '600',
    color: T.colors.textPrimary,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.lg,
  },
  
  // Input Groups
  inputGroup: {
    marginBottom: T.spacing.lg,
  },
  inputLabel: {
    fontSize: T.typography.bodySmall,
    fontWeight: T.typography.medium as '500',
    color: T.colors.textSecondary,
    marginBottom: T.spacing.sm,
  },
  textInput: {
    backgroundColor: T.colors.surface,
    borderWidth: 1,
    borderColor: T.colors.glassBorder,
    borderRadius: T.borderRadius.lg,
    padding: T.spacing.md,
    fontSize: T.typography.body,
    color: T.colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  // Credits
  creditsRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
  },
  creditChip: {
    width: 48,
    height: 48,
    borderRadius: T.borderRadius.lg,
    backgroundColor: T.colors.surface,
    borderWidth: 1,
    borderColor: T.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditChipActive: {
    backgroundColor: T.colors.primary,
    borderColor: T.colors.primary,
  },
  creditChipText: {
    fontSize: T.typography.h3,
    fontWeight: T.typography.bold as '700',
    color: T.colors.textSecondary,
  },
  creditChipTextActive: {
    color: '#FFFFFF',
  },
  
  // Types
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing.sm,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    borderRadius: T.borderRadius.lg,
    backgroundColor: T.colors.surface,
    borderWidth: 2,
    borderColor: T.colors.glassBorder,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: T.spacing.xs,
  },
  typeLabel: {
    fontSize: T.typography.bodySmall,
    color: T.colors.textSecondary,
  },
  
  // Colors
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing.md,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCheck: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  
  // Sessions
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.spacing.sm,
  },
  addSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.xs,
    backgroundColor: T.colors.glassBg,
    borderRadius: T.borderRadius.md,
  },
  addSessionIcon: {
    fontSize: 16,
    color: T.colors.primary,
    marginRight: T.spacing.xs,
  },
  addSessionText: {
    fontSize: T.typography.bodySmall,
    color: T.colors.primary,
  },
  sessionCard: {
    backgroundColor: T.colors.surface,
    borderRadius: T.borderRadius.lg,
    padding: T.spacing.md,
    marginBottom: T.spacing.md,
    borderWidth: 1,
    borderColor: T.colors.glassBorder,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.spacing.sm,
  },
  sessionTitle: {
    fontSize: T.typography.bodySmall,
    fontWeight: T.typography.medium as '500',
    color: T.colors.textPrimary,
  },
  sessionDelete: {
    padding: T.spacing.xs,
  },
  sessionDeleteText: {
    fontSize: 16,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing.xs,
    marginBottom: T.spacing.md,
  },
  dayChip: {
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    borderRadius: T.borderRadius.md,
    backgroundColor: T.colors.glassBg,
    borderWidth: 1,
    borderColor: T.colors.glassBorder,
  },
  dayChipActive: {
    backgroundColor: T.colors.primary,
    borderColor: T.colors.primary,
  },
  dayChipText: {
    fontSize: T.typography.bodySmall,
    color: T.colors.textSecondary,
  },
  dayChipTextActive: {
    color: '#FFFFFF',
    fontWeight: T.typography.semibold as '600',
  },
  timeRow: {
    flexDirection: 'row',
    gap: T.spacing.md,
  },
  timeInput: {
    flex: 1,
  },
  classroomInput: {
    marginTop: T.spacing.md,
  },
  
  // Calculation Card
  calculationCard: {
    backgroundColor: 'rgba(124, 111, 205, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(124, 111, 205, 0.3)',
    borderRadius: T.borderRadius.xl,
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
  },
  calculationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.spacing.sm,
  },
  calculationIcon: {
    fontSize: 18,
    marginRight: T.spacing.sm,
  },
  calculationTitle: {
    fontSize: T.typography.body,
    fontWeight: T.typography.semibold as '600',
    color: T.colors.primary,
  },
  calculationDescription: {
    fontSize: T.typography.bodySmall,
    color: T.colors.textSecondary,
    marginBottom: T.spacing.md,
  },
  calculationStats: {
    flexDirection: 'row',
    gap: T.spacing.md,
  },
  calculationStat: {
    flex: 1,
    backgroundColor: T.colors.surface,
    borderRadius: T.borderRadius.lg,
    padding: T.spacing.md,
  },
  calculationStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.spacing.xs,
  },
  calculationStatIcon: {
    fontSize: 14,
    marginRight: T.spacing.xs,
  },
  calculationStatLabel: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
  },
  calculationStatValue: {
    fontSize: T.typography.h2,
    fontWeight: T.typography.bold as '700',
  },
  calculationStatSub: {
    fontSize: T.typography.caption,
    color: T.colors.textSecondary,
  },
  
  bottomSpacer: {
    height: 40,
  },
});

// ============================================
// HELPERS
// ============================================

function timeToMinutes(time: string): number {
  const parts = time.split(':');
  if (parts.length !== 2) return 0;
  const [hours, minutes] = parts.map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}
