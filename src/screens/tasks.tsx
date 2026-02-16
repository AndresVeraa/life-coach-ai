import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SectionList,
  TextInput,
  Alert,
  StyleSheet,
  Keyboard,
  Modal,
} from 'react-native';
import {
  useTasksStore,
  PRIORITY_CONFIG,
  TAG_CONFIG,
} from '../store/tasks.store';
import { useScheduleStore } from '../store/schedule.store';
import type { Priority, Tag, Task } from '../store/tasks.store';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HOURS_START = 6;
const HOURS_END = 22;
const TIME_OPTIONS: { label: string; value: number }[] = [];
for (let h = HOURS_START; h <= HOURS_END; h++) {
  TIME_OPTIONS.push({ label: `${h.toString().padStart(2, '0')}:00`, value: h });
  if (h < HOURS_END) {
    TIME_OPTIONS.push({ label: `${h.toString().padStart(2, '0')}:30`, value: h + 0.5 });
  }
}

const PRIORITIES: Priority[] = ['urgent', 'medium', 'normal'];
const TAGS: Tag[] = ['universidad', 'personal', 'proyectos'];
const SECTION_ICONS: Record<Priority, string> = { urgent: '🔥', medium: '⚡', normal: '📌' };

export default function Tasks() {
  const { tasks, addTask, toggleTask, removeTask, scheduleTask, unscheduleTask } = useTasksStore();
  const { blocks } = useScheduleStore();
  const [input, setInput] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('normal');
  const [selectedTag, setSelectedTag] = useState<Tag>('universidad');
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  // Schedule modal state
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [taskToSchedule, setTaskToSchedule] = useState<Task | null>(null);
  const [scheduleDay, setScheduleDay] = useState(new Date().getDay());
  const [scheduleHour, setScheduleHour] = useState(9);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);

  // Group pending tasks by priority (sections)
  const sections = useMemo(() => {
    return PRIORITIES.map((p) => ({
      priority: p,
      title: `${SECTION_ICONS[p]} ${PRIORITY_CONFIG[p].label}`,
      data: tasks.filter((t) => t.priority === p && !t.completed),
    })).filter((s) => s.data.length > 0);
  }, [tasks]);

  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  // Conteos
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalTasks - completedCount;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Find free slot in schedule for a given day
  const findFreeSlot = useCallback(
    (dayIndex: number): number | null => {
      const dayBlocks = blocks
        .filter((b) => b.dayIndex === dayIndex)
        .sort((a, b) => a.startHour - b.startHour);
      const scheduledForDay = tasks.filter((t) => {
        if (!t.scheduledTimestamp) return false;
        const d = new Date(t.scheduledTimestamp);
        return d.getDay() === dayIndex;
      });
      const now = new Date();
      const startFrom =
        dayIndex === now.getDay()
          ? Math.max(HOURS_START, Math.ceil(now.getHours() + now.getMinutes() / 60))
          : HOURS_START;
      for (let h = startFrom; h < HOURS_END - 1; h++) {
        const blockOccupied = dayBlocks.some(
          (b) => h >= b.startHour && h < b.startHour + b.duration
        );
        const taskOccupied = scheduledForDay.some((t) => {
          const d = new Date(t.scheduledTimestamp!);
          const taskHour = d.getHours() + d.getMinutes() / 60;
          return h >= taskHour && h < taskHour + 1;
        });
        if (!blockOccupied && !taskOccupied) return h;
      }
      return null;
    },
    [blocks, tasks]
  );

  const handleAiSuggest = () => {
    const today = new Date().getDay();
    for (let offset = 0; offset < 7; offset++) {
      const day = (today + offset) % 7;
      const hour = findFreeSlot(day);
      if (hour !== null) {
        setScheduleDay(day);
        setScheduleHour(hour);
        setAiSuggested(true);
        return;
      }
    }
    Alert.alert('📅 Sin huecos', 'No se encontraron huecos libres esta semana.');
  };

  const openScheduleModal = (task: Task) => {
    setTaskToSchedule(task);
    setScheduleDay(new Date().getDay());
    setScheduleHour(9);
    setAiSuggested(false);
    setShowTimePicker(false);
    setScheduleModalVisible(true);
  };

  const confirmSchedule = () => {
    if (!taskToSchedule) return;
    const now = new Date();
    const target = new Date(now);
    const currentDay = now.getDay();
    let daysAhead = scheduleDay - currentDay;
    if (daysAhead < 0) daysAhead += 7;
    if (daysAhead === 0 && scheduleHour <= now.getHours()) daysAhead = 7;
    target.setDate(target.getDate() + daysAhead);
    target.setHours(Math.floor(scheduleHour), (scheduleHour % 1) * 60, 0, 0);
    scheduleTask(taskToSchedule.id, target.getTime());
    setScheduleModalVisible(false);
    setTaskToSchedule(null);
    setAiSuggested(false);
  };

  const formatHour = (h: number) => {
    const hh = Math.floor(h);
    const mm = h % 1 === 0.5 ? '30' : '00';
    return `${hh.toString().padStart(2, '0')}:${mm}`;
  };

  const getScheduleInfo = (task: Task) => {
    if (!task.scheduledTimestamp) return null;
    const d = new Date(task.scheduledTimestamp);
    return { day: DAYS[d.getDay()], hour: formatHour(d.getHours() + d.getMinutes() / 60) };
  };

  const handleAdd = () => {
    if (!input.trim()) return;
    addTask(input.trim(), selectedPriority, selectedTag);
    setInput('');
    setSelectedPriority('normal');
    Keyboard.dismiss();
  };

  const handleDelete = (task: Task) => {
    Alert.alert(
      'Eliminar tarea',
      `¿Eliminar "${task.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeTask(task.id) },
      ]
    );
  };

  const priConf = PRIORITY_CONFIG[selectedPriority];

  const renderTaskCard = ({ item: task }: { item: Task }) => {
    const pConf = PRIORITY_CONFIG[task.priority];
    const tConf = TAG_CONFIG[task.tag];
    const schedInfo = getScheduleInfo(task);
    return (
      <TouchableOpacity
        onLongPress={() => handleDelete(task)}
        activeOpacity={0.8}
        style={[
          styles.taskCard,
          { borderLeftColor: task.completed ? '#10b981' : pConf.color },
          task.completed && styles.taskCardCompleted,
        ]}
      >
        <TouchableOpacity
          onPress={() => toggleTask(task.id)}
          style={[
            styles.checkbox,
            task.completed && styles.checkboxDone,
            !task.completed && { borderColor: pConf.color },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {task.completed && <Text style={styles.checkMark}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.taskBody}>
          <Text
            style={[styles.taskTitle, task.completed && styles.taskTitleDone]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <View style={styles.taskMeta}>
            {!task.completed && (task.priority === 'urgent' || task.priority === 'medium') && (
              <View style={[styles.priorityBadge, { backgroundColor: pConf.bg }]}>
                <Text style={[styles.priorityBadgeText, { color: pConf.color }]}>
                  {pConf.icon} {pConf.label}
                </Text>
              </View>
            )}
            <View style={[styles.tagBadge, { backgroundColor: tConf.color + '18' }]}>
              <Text style={[styles.tagBadgeText, { color: tConf.color }]}>
                {tConf.icon} {tConf.label}
              </Text>
            </View>
            {schedInfo && (
              <View style={styles.scheduleBadge}>
                <Text style={styles.scheduleBadgeText}>
                  🕐 {schedInfo.day} {schedInfo.hour}
                </Text>
              </View>
            )}
            {task.completed && <Text style={styles.doneBadge}>✔ Hecho</Text>}
          </View>
        </View>

        {/* Schedule / Unschedule button */}
        {!task.completed && (
          <TouchableOpacity
            onPress={() =>
              task.scheduledTimestamp
                ? unscheduleTask(task.id)
                : openScheduleModal(task)
            }
            style={[
              styles.scheduleBtn,
              task.scheduledTimestamp ? styles.scheduleBtnActive : null,
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 18 }}>
              {task.scheduledTimestamp ? '📅' : '🕐'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>📎 Mis Tareas</Text>
            <Text style={styles.headerSub}>{pendingCount} pendientes · {completedCount} listas</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
            <Text style={styles.progressLabel}>hoy</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Task list grouped by priority */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskCard}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{(section as any).title}</Text>
            <View style={[styles.sectionCount, { backgroundColor: PRIORITY_CONFIG[(section as any).priority].bg }]}>
              <Text style={[styles.sectionCountText, { color: PRIORITY_CONFIG[(section as any).priority].color }]}>
                {section.data.length}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          completedTasks.length > 0 ? (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✅ Completadas</Text>
                <View style={[styles.sectionCount, { backgroundColor: '#d1fae5' }]}>
                  <Text style={[styles.sectionCountText, { color: '#059669' }]}>
                    {completedTasks.length}
                  </Text>
                </View>
              </View>
              {completedTasks.map((task) => (
                <View key={task.id}>
                  {renderTaskCard({ item: task })}
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          completedTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No hay tareas aún</Text>
              <Text style={styles.emptySubtitle}>Agrega tareas para comenzar</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 16, paddingTop: 12 }}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      {/* Input bar */}
      <View style={styles.inputBar}>
        {/* Selectores rápidos */}
        <View style={styles.quickSelectors}>
          <TouchableOpacity
            onPress={() => { setShowPriorityPicker(!showPriorityPicker); setShowTagPicker(false); }}
            style={[styles.quickBtn, { backgroundColor: priConf.bg }]}
          >
            <Text style={{ fontSize: 14 }}>{priConf.icon}</Text>
            <Text style={[styles.quickBtnText, { color: priConf.color }]}>{priConf.label}</Text>
            <Text style={{ fontSize: 10, color: '#9ca3af' }}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setShowTagPicker(!showTagPicker); setShowPriorityPicker(false); }}
            style={[styles.quickBtn, { backgroundColor: TAG_CONFIG[selectedTag].color + '18' }]}
          >
            <Text style={{ fontSize: 14 }}>{TAG_CONFIG[selectedTag].icon}</Text>
            <Text style={[styles.quickBtnText, { color: TAG_CONFIG[selectedTag].color }]}>
              {TAG_CONFIG[selectedTag].label}
            </Text>
            <Text style={{ fontSize: 10, color: '#9ca3af' }}>▼</Text>
          </TouchableOpacity>
        </View>

        {showPriorityPicker && (
          <View style={styles.pickerDropdown}>
            {PRIORITIES.map((p) => {
              const pc = PRIORITY_CONFIG[p];
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => { setSelectedPriority(p); setShowPriorityPicker(false); }}
                  style={[styles.pickerItem, selectedPriority === p && { backgroundColor: pc.bg }]}
                >
                  <Text style={{ fontSize: 14 }}>{pc.icon}</Text>
                  <Text style={[styles.pickerItemText, { color: pc.color }]}>{pc.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {showTagPicker && (
          <View style={styles.pickerDropdown}>
            {TAGS.map((t) => {
              const tc = TAG_CONFIG[t];
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => { setSelectedTag(t); setShowTagPicker(false); }}
                  style={[styles.pickerItem, selectedTag === t && { backgroundColor: tc.color + '18' }]}
                >
                  <Text style={{ fontSize: 14 }}>{tc.icon}</Text>
                  <Text style={[styles.pickerItemText, { color: tc.color }]}>{tc.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Nueva tarea..."
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addButton, !input.trim() && styles.addButtonDisabled]}
            disabled={!input.trim()}
          >
            <Text style={styles.addButtonText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Schedule Modal */}
      <Modal
        visible={scheduleModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📅 Programar Tarea</Text>
            {taskToSchedule && (
              <Text style={styles.modalTaskName} numberOfLines={2}>
                "{taskToSchedule.title}"
              </Text>
            )}

            {/* AI Suggest button */}
            <TouchableOpacity style={styles.aiSuggestBtn} onPress={handleAiSuggest}>
              <Text style={styles.aiSuggestIcon}>🪄</Text>
              <View>
                <Text style={styles.aiSuggestText}>IA Suggest</Text>
                <Text style={styles.aiSuggestSub}>Encontrar hueco libre automáticamente</Text>
              </View>
            </TouchableOpacity>

            {aiSuggested && (
              <View style={styles.aiResultBanner}>
                <Text style={styles.aiResultText}>
                  ✨ Hueco encontrado: {DAYS[scheduleDay]} a las {formatHour(scheduleHour)}
                </Text>
              </View>
            )}

            {/* Day picker */}
            <Text style={styles.modalLabel}>Día</Text>
            <View style={styles.dayPickerRow}>
              {DAYS.map((d, idx) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => { setScheduleDay(idx); setAiSuggested(false); }}
                  style={[
                    styles.dayPickerBtn,
                    scheduleDay === idx && styles.dayPickerBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayPickerText,
                      scheduleDay === idx && styles.dayPickerTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time picker */}
            <Text style={styles.modalLabel}>Hora</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowTimePicker(!showTimePicker)}
            >
              <Text style={styles.timePickerValue}>{formatHour(scheduleHour)}</Text>
              <Text style={styles.timePickerArrow}>▼</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <ScrollView style={styles.timePickerList} nestedScrollEnabled>
                {TIME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={`sched-${opt.value}`}
                    style={[
                      styles.timePickerItem,
                      scheduleHour === opt.value && styles.timePickerItemActive,
                    ]}
                    onPress={() => {
                      setScheduleHour(opt.value);
                      setShowTimePicker(false);
                      setAiSuggested(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.timePickerItemText,
                        scheduleHour === opt.value && styles.timePickerItemTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setScheduleModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={confirmSchedule}>
                <Text style={styles.saveText}>Agendar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  // Header
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 13,
    color: '#c7d2fe',
    marginTop: 4,
  },
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
  progressLabel: {
    fontSize: 10,
    color: '#c7d2fe',
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#34d399',
    borderRadius: 3,
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
  },
  sectionCount: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '800',
  },
  // Task card
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    alignItems: 'flex-start',
  },
  taskCardCompleted: {
    opacity: 0.7,
    backgroundColor: '#f0fdf4',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkMark: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 20,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#059669',
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  scheduleBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scheduleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
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
  // Schedule button
  scheduleBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    marginLeft: 8,
    marginTop: 2,
  },
  scheduleBtnActive: {
    backgroundColor: '#eef2ff',
  },
  // Empty
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 6,
  },
  // Input bar
  inputBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  quickSelectors: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pickerDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Schedule Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  modalTaskName: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 14,
  },
  // AI Suggest
  aiSuggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#e9d5ff',
    marginBottom: 12,
  },
  aiSuggestIcon: {
    fontSize: 28,
  },
  aiSuggestText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7c3aed',
  },
  aiSuggestSub: {
    fontSize: 11,
    color: '#a78bfa',
    marginTop: 1,
  },
  aiResultBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  aiResultText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
  },
  // Day picker
  dayPickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  dayPickerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  dayPickerBtnActive: {
    backgroundColor: '#4F46E5',
  },
  dayPickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  dayPickerTextActive: {
    color: '#ffffff',
  },
  // Time picker
  timePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timePickerValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  timePickerArrow: {
    fontSize: 12,
    color: '#9ca3af',
  },
  timePickerList: {
    maxHeight: 150,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timePickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  timePickerItemActive: {
    backgroundColor: '#eef2ff',
  },
  timePickerItemText: {
    fontSize: 15,
    color: '#374151',
  },
  timePickerItemTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  // Modal actions
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
