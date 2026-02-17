import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
  Keyboard,
  Modal,
} from 'react-native';
import {
  useTasksStore,
  CATEGORY_CONFIG,
  CATEGORIES,
  QUICK_HABITS,
  FREQUENCY_CONFIG,
  DAYS_LABELS,
  TIME_SLOTS,
} from '../store/tasks.store';
import type { Category, Frequency, Task } from '../store/tasks.store';

type FilterMode = 'all' | 'today' | 'done';

const FILTERS: { key: FilterMode; label: string; icon: string }[] = [
  { key: 'all', label: 'Todo', icon: '🌟' },
  { key: 'today', label: 'Hoy', icon: '📅' },
  { key: 'done', label: 'Logrados', icon: '🏆' },
];

const FREQ_OPTIONS: Frequency[] = ['once', 'daily', 'custom'];

export default function Tasks() {
  const { tasks, addTask, updateTask, toggleTask, removeTask, getTasksForDate, checkDailyReset } =
    useTasksStore();
  const [filter, setFilter] = useState<FilterMode>('today');

  // --- Modal state ---
  const [modalVisible, setModalVisible] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('carrera');
  const [formFrequency, setFormFrequency] = useState<Frequency>('daily');
  const [formRepeatDays, setFormRepeatDays] = useState<number[]>([1, 3, 5]);
  const [formReminderTime, setFormReminderTime] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Daily reset on mount
  useEffect(() => {
    checkDailyReset();
  }, []);

  // Filtered tasks
  const todayTasks = useMemo(() => getTasksForDate(new Date()), [tasks]);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'today': {
        // Sorted by reminderTime if available
        const pending = todayTasks.filter((t: Task) => !t.completed);
        return pending.sort((a, b) => {
          if (a.reminderTime && b.reminderTime) return a.reminderTime.localeCompare(b.reminderTime);
          if (a.reminderTime) return -1;
          if (b.reminderTime) return 1;
          return 0;
        });
      }
      case 'done':
        return tasks.filter((t: Task) => t.completed);
      default:
        return tasks;
    }
  }, [tasks, todayTasks, filter]);

  // Stats
  const todayTotal = todayTasks.length;
  const todayDone = todayTasks.filter((t: Task) => t.completed).length;
  const todayPending = todayTotal - todayDone;
  const progressPercent = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  const categoryStats = useMemo(() => {
    const stats: Record<Category, { total: number; done: number }> = {
      cuerpo: { total: 0, done: 0 },
      mente: { total: 0, done: 0 },
      carrera: { total: 0, done: 0 },
      alma: { total: 0, done: 0 },
    };
    todayTasks.forEach((t: Task) => {
      const cat = t.category || 'carrera';
      stats[cat].total++;
      if (t.completed) stats[cat].done++;
    });
    return stats;
  }, [todayTasks]);

  // --- Handlers ---
  const openModal = (
    presetTitle?: string,
    presetCategory?: Category,
    presetFreq?: Frequency,
    presetTime?: string,
  ) => {
    setEditingTask(null);
    setFormTitle(presetTitle ?? '');
    setFormCategory(presetCategory ?? 'carrera');
    setFormFrequency(presetFreq ?? 'daily');
    setFormRepeatDays([1, 3, 5]);
    setFormReminderTime(presetTime ?? null);
    setShowTimePicker(false);
    setModalVisible(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormCategory(task.category || 'carrera');
    setFormFrequency(task.frequency || 'once');
    setFormRepeatDays(task.repeatDays ?? [1, 3, 5]);
    setFormReminderTime(task.reminderTime ?? null);
    setShowTimePicker(false);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) return;
    if (editingTask) {
      updateTask(editingTask.id, {
        title: formTitle.trim(),
        category: formCategory,
        frequency: formFrequency,
        repeatDays: formFrequency === 'custom' ? formRepeatDays : undefined,
        reminderTime: formReminderTime ?? undefined,
      });
    } else {
      addTask({
        title: formTitle.trim(),
        category: formCategory,
        frequency: formFrequency,
        repeatDays: formFrequency === 'custom' ? formRepeatDays : undefined,
        reminderTime: formReminderTime ?? undefined,
      });
    }
    setFormTitle('');
    setFormReminderTime(null);
    setEditingTask(null);
    setModalVisible(false);
    Keyboard.dismiss();
  };

  const handleQuickAdd = (
    title: string,
    category: Category,
    frequency: Frequency,
    reminderTime?: string,
  ) => {
    if (frequency === 'custom') {
      openModal(title, category, 'custom', reminderTime);
    } else {
      addTask({ title, category, frequency, reminderTime });
    }
  };

  const toggleRepeatDay = (day: number) => {
    setFormRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleDelete = (task: Task) => {
    Alert.alert('Eliminar hábito', `¿Eliminar "${task.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeTask(task.id) },
    ]);
  };

  const getFrequencyLabel = (task: Task) => {
    if (task.frequency === 'daily') return '🔄 Diario';
    if (task.frequency === 'custom' && task.repeatDays) {
      return '📆 ' + task.repeatDays.map((d) => DAYS_LABELS[d]).join(', ');
    }
    return '1️⃣ Una vez';
  };

  const selectTime = (time: string) => {
    setFormReminderTime(time);
    setShowTimePicker(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>🌱 Mi Plan</Text>
            <Text style={styles.headerSub}>
              {todayPending} pendientes hoy · {todayDone} logrados
            </Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
            <Text style={styles.progressLabel}>hoy</Text>
          </View>
        </View>

        {/* Category stat pills */}
        <View style={styles.catStatsRow}>
          {CATEGORIES.map((cat) => {
            const cc = CATEGORY_CONFIG[cat];
            const st = categoryStats[cat];
            return (
              <View key={cat} style={[styles.catStatPill, { backgroundColor: cc.bg }]}>
                <Text style={{ fontSize: 14 }}>{cc.icon}</Text>
                <Text style={[styles.catStatText, { color: cc.color }]}>
                  {st.done}/{st.total}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Quick Habits Carousel */}
        <View style={styles.quickSection}>
          <Text style={styles.quickSectionTitle}>⚡ Acciones Rápidas</Text>
          <Text style={styles.quickSectionSub}>Un toque para comenzar un hábito</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickScroll}
          >
            {QUICK_HABITS.map((habit, idx) => {
              const hc = CATEGORY_CONFIG[habit.category];
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.quickCard, { backgroundColor: hc.bg, borderColor: hc.gradient }]}
                  onPress={() =>
                    handleQuickAdd(habit.title, habit.category, habit.frequency, habit.reminderTime)
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickCardIcon}>{habit.icon}</Text>
                  <Text style={[styles.quickCardTitle, { color: hc.color }]} numberOfLines={2}>
                    {habit.title}
                  </Text>
                  <View style={[styles.quickCardCatBadge, { backgroundColor: hc.color + '20' }]}>
                    <Text style={[styles.quickCardCatText, { color: hc.color }]}>
                      {FREQUENCY_CONFIG[habit.frequency].icon}{' '}
                      {habit.reminderTime ? habit.reminderTime : FREQUENCY_CONFIG[habit.frequency].label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={styles.filterIcon}>{f.icon}</Text>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Task / Habit List */}
        <View style={styles.taskList}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>
                {filter === 'done' ? '🏆' : filter === 'today' ? '🎉' : '🌱'}
              </Text>
              <Text style={styles.emptyTitle}>
                {filter === 'done'
                  ? 'Sin logros aún'
                  : filter === 'today'
                  ? '¡Todo completado hoy!'
                  : 'Comienza tu plan'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'done'
                  ? 'Completa hábitos para verlos aquí'
                  : filter === 'today'
                  ? 'Agrega hábitos que se repitan hoy'
                  : 'Usa las acciones rápidas o agrega uno propio'}
              </Text>
            </View>
          ) : (
            filteredTasks.map((task: Task) => {
              const cat = task.category || 'carrera';
              const cc = CATEGORY_CONFIG[cat];
              return (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => openEditModal(task)}
                  onLongPress={() => handleDelete(task)}
                  activeOpacity={0.8}
                  style={[
                    styles.taskCard,
                    { borderLeftColor: task.completed ? '#10b981' : cc.color },
                    task.completed && styles.taskCardCompleted,
                  ]}
                >
                  <View style={[styles.catIconBubble, { backgroundColor: cc.bg }]}>
                    <Text style={{ fontSize: 22 }}>{cc.icon}</Text>
                  </View>

                  <View style={styles.taskBody}>
                    <View style={styles.taskTitleRow}>
                      <Text
                        style={[styles.taskTitle, task.completed && styles.taskTitleDone]}
                        numberOfLines={2}
                      >
                        {task.title}
                      </Text>
                      {task.reminderTime && (
                        <View style={styles.timeBadge}>
                          <Text style={styles.timeBadgeText}>⏰ {task.reminderTime}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.taskMeta}>
                      <View style={[styles.catBadge, { backgroundColor: cc.color + '15' }]}>
                        <Text style={[styles.catBadgeText, { color: cc.color }]}>{cc.label}</Text>
                      </View>
                      <View style={styles.freqBadge}>
                        <Text style={styles.freqBadgeText}>{getFrequencyLabel(task)}</Text>
                      </View>
                      {task.completed && <Text style={styles.doneBadge}>🏆 Logrado</Text>}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleTask(task.id)}
                    style={[
                      styles.checkbox,
                      task.completed && styles.checkboxDone,
                      !task.completed && { borderColor: cc.color },
                    ]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {task.completed ? (
                      <Text style={styles.checkMark}>✓</Text>
                    ) : (
                      <Text style={[styles.checkEmpty, { color: cc.color }]}>○</Text>
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openModal()}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* ===== Create Habit Modal ===== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { setModalVisible(false); setEditingTask(null); }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingTask ? '✏️ Editar Hábito' : '🌱 Nuevo Hábito'}
              </Text>

              {/* Step 1: Title */}
              <Text style={styles.modalLabel}>¿Qué quieres lograr?</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: Leer 15 minutos, Ir al gym..."
                placeholderTextColor="#9ca3af"
                value={formTitle}
                onChangeText={setFormTitle}
                autoFocus
              />

              {/* Step 2: Category */}
              <Text style={styles.modalLabel}>Área de vida</Text>
              <View style={styles.modalCatRow}>
                {CATEGORIES.map((cat) => {
                  const cc = CATEGORY_CONFIG[cat];
                  const active = formCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setFormCategory(cat)}
                      style={[
                        styles.modalCatBtn,
                        { backgroundColor: active ? cc.color : cc.bg, borderColor: cc.gradient },
                      ]}
                    >
                      <Text style={{ fontSize: 20 }}>{cc.icon}</Text>
                      <Text
                        style={[
                          styles.modalCatLabel,
                          { color: active ? '#ffffff' : cc.color },
                        ]}
                      >
                        {cc.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Step 3: Frequency */}
              <Text style={styles.modalLabel}>¿Cuándo?</Text>
              <View style={styles.freqRow}>
                {FREQ_OPTIONS.map((freq) => {
                  const fc = FREQUENCY_CONFIG[freq];
                  const active = formFrequency === freq;
                  return (
                    <TouchableOpacity
                      key={freq}
                      onPress={() => setFormFrequency(freq)}
                      style={[styles.freqBtn, active && styles.freqBtnActive]}
                    >
                      <Text style={{ fontSize: 18 }}>{fc.icon}</Text>
                      <Text style={[styles.freqBtnText, active && styles.freqBtnTextActive]}>
                        {fc.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Day selector (only for custom) */}
              {formFrequency === 'custom' && (
                <View style={styles.daySelector}>
                  <Text style={styles.daySelectorLabel}>Selecciona los días:</Text>
                  <View style={styles.dayRow}>
                    {DAYS_LABELS.map((label, idx) => {
                      const active = formRepeatDays.includes(idx);
                      return (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => toggleRepeatDay(idx)}
                          style={[styles.dayBtn, active && styles.dayBtnActive]}
                        >
                          <Text style={[styles.dayBtnText, active && styles.dayBtnTextActive]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {formRepeatDays.length > 0 && (
                    <Text style={styles.daysSummary}>
                      ✓ {formRepeatDays.map((d) => DAYS_LABELS[d]).join(', ')}
                    </Text>
                  )}
                </View>
              )}

              {/* Step 4: Reminder Time */}
              <Text style={styles.modalLabel}>⏰ Horario (opcional)</Text>
              <TouchableOpacity
                style={styles.timeToggle}
                onPress={() => setShowTimePicker(!showTimePicker)}
                activeOpacity={0.7}
              >
                <Text style={styles.timeToggleIcon}>🕐</Text>
                <Text style={styles.timeToggleText}>
                  {formReminderTime
                    ? `A las ${formReminderTime}`
                    : 'Sin hora fija — Toca para asignar'}
                </Text>
                {formReminderTime ? (
                  <TouchableOpacity
                    onPress={() => {
                      setFormReminderTime(null);
                      setShowTimePicker(false);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.timeClear}>✕</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timeChevron}>{showTimePicker ? '▲' : '▼'}</Text>
                )}
              </TouchableOpacity>

              {showTimePicker && (
                <View style={styles.timeGrid}>
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    style={styles.timeGridList}
                  >
                    <View style={styles.timeGridRow}>
                      {TIME_SLOTS.map((slot) => {
                        const active = formReminderTime === slot;
                        return (
                          <TouchableOpacity
                            key={slot}
                            onPress={() => selectTime(slot)}
                            style={[styles.timeSlot, active && styles.timeSlotActive]}
                          >
                            <Text style={[styles.timeSlotText, active && styles.timeSlotTextActive]}>
                              {slot}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Summary */}
              {formTitle.trim() !== '' && (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>📋 Resumen</Text>
                  <Text style={styles.summaryText}>
                    {CATEGORY_CONFIG[formCategory].icon} {formTitle}
                  </Text>
                  <Text style={styles.summaryDetail}>
                    {FREQUENCY_CONFIG[formFrequency].icon} {FREQUENCY_CONFIG[formFrequency].label}
                    {formFrequency === 'custom' && formRepeatDays.length > 0
                      ? ` (${formRepeatDays.map((d) => DAYS_LABELS[d]).join(', ')})`
                      : ''}
                    {formReminderTime ? ` · ⏰ ${formReminderTime}` : ''}
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => { setModalVisible(false); setEditingTask(null); }}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, !formTitle.trim() && { opacity: 0.4 }]}
                  onPress={handleSave}
                  disabled={!formTitle.trim()}
                >
                  <Text style={styles.saveText}>
                    {editingTask ? 'Guardar Cambios' : 'Crear Hábito'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  // Header
  header: {
    backgroundColor: '#059669',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#ffffff' },
  headerSub: { fontSize: 13, color: '#a7f3d0', marginTop: 4 },
  progressBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  progressLabel: { fontSize: 9, color: '#a7f3d0', fontWeight: '600' },
  catStatsRow: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 4 },
  catStatPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 10,
  },
  catStatText: { fontSize: 12, fontWeight: '800' },
  progressBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: { height: 5, backgroundColor: '#34d399', borderRadius: 3 },
  // Quick Habits
  quickSection: { paddingTop: 16, paddingBottom: 8, paddingLeft: 16 },
  quickSectionTitle: { fontSize: 17, fontWeight: '800', color: '#1f2937' },
  quickSectionSub: { fontSize: 12, color: '#9ca3af', marginTop: 2, marginBottom: 12 },
  quickScroll: { paddingRight: 24, gap: 10 },
  quickCard: {
    width: 120,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickCardIcon: { fontSize: 30 },
  quickCardTitle: { fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  quickCardCatBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 2 },
  quickCardCatText: { fontSize: 9, fontWeight: '800' },
  // Filters
  filtersRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    gap: 4,
  },
  filterChipActive: { backgroundColor: '#059669' },
  filterIcon: { fontSize: 13 },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#ffffff' },
  // Task list
  taskList: { paddingHorizontal: 16 },
  emptyState: { marginTop: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  emptySubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  // Task card
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    alignItems: 'center',
  },
  taskCardCompleted: { opacity: 0.7, backgroundColor: '#f0fdf4' },
  catIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskBody: { flex: 1 },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  taskTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937', lineHeight: 20, flex: 1 },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#059669' },
  timeBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeBadgeText: { fontSize: 10, fontWeight: '800', color: '#92400e' },
  taskMeta: { flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catBadgeText: { fontSize: 10, fontWeight: '800' },
  freqBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
  },
  freqBadgeText: { fontSize: 10, fontWeight: '700', color: '#0369a1' },
  doneBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  checkboxDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  checkMark: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  checkEmpty: { fontSize: 18, fontWeight: '300' },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { fontSize: 28, fontWeight: '700', color: '#ffffff', marginTop: -2 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 14 },
  modalInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  // Category picker in modal
  modalCatRow: { flexDirection: 'row', gap: 8 },
  modalCatBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  modalCatLabel: { fontSize: 11, fontWeight: '800' },
  // Frequency picker
  freqRow: { flexDirection: 'row', gap: 8 },
  freqBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    gap: 4,
  },
  freqBtnActive: { backgroundColor: '#059669' },
  freqBtnText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  freqBtnTextActive: { color: '#ffffff' },
  // Day selector
  daySelector: {
    marginTop: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  daySelectorLabel: { fontSize: 12, fontWeight: '700', color: '#059669', marginBottom: 10 },
  dayRow: { flexDirection: 'row', gap: 6 },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  dayBtnActive: { backgroundColor: '#059669', borderColor: '#059669' },
  dayBtnText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  dayBtnTextActive: { color: '#ffffff' },
  daysSummary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginTop: 10,
    textAlign: 'center',
  },
  // Time picker
  timeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  timeToggleIcon: { fontSize: 18 },
  timeToggleText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
  timeClear: { fontSize: 16, color: '#ef4444', fontWeight: '700', paddingHorizontal: 4 },
  timeChevron: { fontSize: 10, color: '#9ca3af' },
  timeGrid: {
    marginTop: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  timeGridList: { maxHeight: 200, paddingHorizontal: 4, paddingVertical: 6 },
  timeGridRow: { flexDirection: 'row', flexWrap: 'wrap' },
  timeSlot: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 3,
    marginVertical: 3,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeSlotActive: { backgroundColor: '#059669', borderColor: '#059669' },
  timeSlotText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  timeSlotTextActive: { color: '#ffffff' },
  // Summary
  summaryBox: {
    marginTop: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  summaryTitle: { fontSize: 12, fontWeight: '800', color: '#1e40af', marginBottom: 4 },
  summaryText: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  summaryDetail: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  // Modal actions
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  saveText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
});
