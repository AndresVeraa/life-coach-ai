import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
  Keyboard,
  Animated,
} from 'react-native';
import {
  useTasksStore,
  PRIORITY_CONFIG,
  TAG_CONFIG,
} from '../store/tasks.store';
import type { Priority, Tag, Task } from '../store/tasks.store';

type FilterMode = 'all' | 'pending' | 'done' | 'urgent';

const FILTERS: { key: FilterMode; label: string; icon: string }[] = [
  { key: 'all', label: 'Todas', icon: '📋' },
  { key: 'pending', label: 'Pendientes', icon: '⏳' },
  { key: 'done', label: 'Listas', icon: '✅' },
  { key: 'urgent', label: 'Urgentes', icon: '🔥' },
];

const PRIORITIES: Priority[] = ['urgent', 'medium', 'normal'];
const TAGS: Tag[] = ['universidad', 'personal', 'proyectos'];

export default function Tasks() {
  const { tasks, addTask, toggleTask, removeTask } = useTasksStore();
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('normal');
  const [selectedTag, setSelectedTag] = useState<Tag>('universidad');
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'pending':
        return tasks.filter((t) => !t.completed);
      case 'done':
        return tasks.filter((t) => t.completed);
      case 'urgent':
        return tasks.filter((t) => t.priority === 'urgent' && !t.completed);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  // Conteos
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalTasks - completedCount;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>📎 Mis Tareas</Text>
            <Text style={styles.headerSub}>{pendingCount} pendientes · {completedCount} listas</Text>
          </View>
          {/* Barra de progreso circular */}
          <View style={styles.progressBadge}>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
            <Text style={styles.progressLabel}>hoy</Text>
          </View>
        </View>

        {/* Barra de progreso */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
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
      </ScrollView>

      {/* Lista de tareas */}
      <ScrollView style={styles.taskList} contentContainerStyle={{ paddingBottom: 120 }}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {filter === 'done' ? '🎉' : filter === 'urgent' ? '😌' : '🎯'}
            </Text>
            <Text style={styles.emptyTitle}>
              {filter === 'done'
                ? 'No hay tareas completadas'
                : filter === 'urgent'
                ? '¡Sin urgencias!'
                : filter === 'pending'
                ? 'Todo está al día'
                : 'No hay tareas aún'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' ? 'Agrega tareas para comenzar' : 'Cambia el filtro para ver más'}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => {
            const pConf = PRIORITY_CONFIG[task.priority];
            const tConf = TAG_CONFIG[task.tag];
            return (
              <TouchableOpacity
                key={task.id}
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
                    style={[
                      styles.taskTitle,
                      task.completed && styles.taskTitleDone,
                    ]}
                    numberOfLines={2}
                  >
                    {task.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    {!task.completed && task.priority === 'urgent' && (
                      <View style={[styles.priorityBadge, { backgroundColor: pConf.bg }]}>
                        <Text style={[styles.priorityBadgeText, { color: pConf.color }]}>
                          {pConf.icon} {pConf.label}
                        </Text>
                      </View>
                    )}
                    {!task.completed && task.priority === 'medium' && (
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
                    {task.completed && (
                      <Text style={styles.doneBadge}>✔ Hecho</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={styles.inputBar}>
        {/* Selectores rápidos */}
        <View style={styles.quickSelectors}>
          {/* Prioridad */}
          <TouchableOpacity
            onPress={() => { setShowPriorityPicker(!showPriorityPicker); setShowTagPicker(false); }}
            style={[styles.quickBtn, { backgroundColor: priConf.bg }]}
          >
            <Text style={{ fontSize: 14 }}>{priConf.icon}</Text>
            <Text style={[styles.quickBtnText, { color: priConf.color }]}>
              {priConf.label}
            </Text>
            <Text style={{ fontSize: 10, color: '#9ca3af' }}>▼</Text>
          </TouchableOpacity>

          {/* Tag */}
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

        {/* Priority picker dropdown */}
        {showPriorityPicker && (
          <View style={styles.pickerDropdown}>
            {PRIORITIES.map((p) => {
              const pc = PRIORITY_CONFIG[p];
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => { setSelectedPriority(p); setShowPriorityPicker(false); }}
                  style={[
                    styles.pickerItem,
                    selectedPriority === p && { backgroundColor: pc.bg },
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>{pc.icon}</Text>
                  <Text style={[styles.pickerItemText, { color: pc.color }]}>{pc.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Tag picker dropdown */}
        {showTagPicker && (
          <View style={styles.pickerDropdown}>
            {TAGS.map((t) => {
              const tc = TAG_CONFIG[t];
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => { setSelectedTag(t); setShowTagPicker(false); }}
                  style={[
                    styles.pickerItem,
                    selectedTag === t && { backgroundColor: tc.color + '18' },
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>{tc.icon}</Text>
                  <Text style={[styles.pickerItemText, { color: tc.color }]}>{tc.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Text input row */}
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
            style={[
              styles.addButton,
              !input.trim() && styles.addButtonDisabled,
            ]}
            disabled={!input.trim()}
          >
            <Text style={styles.addButtonText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  // Filters
  filtersContainer: {
    maxHeight: 52,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
  },
  filterIcon: {
    fontSize: 13,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  // Task list
  taskList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
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
});
