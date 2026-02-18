import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  Keyboard,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useScheduleStore, SCHEDULE_COLORS } from '../store/schedule.store';
import type { ScheduleBlock } from '../store/schedule.store';
import { useTasksStore, PRIORITY_CONFIG as TASK_PRIORITY, CATEGORY_CONFIG, timeToDecimal } from '../store/tasks.store';
import { useHealthStore } from '../features/health/health.store';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const FULL_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HOURS_START = 5;
const HOURS_END = 23;
const HOUR_HEIGHT = 64;

const BLOCK_TYPES: { label: string; value: ScheduleBlock['type'] }[] = [
  { label: '📚 Clase', value: 'class' },
  { label: '💼 Trabajo', value: 'work' },
  { label: '📌 Otro', value: 'other' },
];

// Generar opciones de hora cada 30 min para el picker
const TIME_OPTIONS: { label: string; value: number }[] = [];
for (let h = HOURS_START; h <= HOURS_END; h++) {
  TIME_OPTIONS.push({ label: `${h.toString().padStart(2, '0')}:00`, value: h });
  if (h < HOURS_END) {
    TIME_OPTIONS.push({ label: `${h.toString().padStart(2, '0')}:30`, value: h + 0.5 });
  }
}

export default function Home() {
  const now = useRef(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(now.current.getDay());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formStartHour, setFormStartHour] = useState(8);
  const [formEndHour, setFormEndHour] = useState(9);
  const [formType, setFormType] = useState<ScheduleBlock['type']>('class');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [formColor, setFormColor] = useState(SCHEDULE_COLORS[0]);

  // Swipe day change via PanResponder
  const swipedRef = useRef(false);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        // Solo capturar si el movimiento horizontal es mayor que el vertical
        return (
          Math.abs(gestureState.dx) > 25 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderMove: () => {},
      onPanResponderRelease: (_evt, gestureState) => {
        const screenW = Dimensions.get('window').width;
        const threshold = screenW * 0.18;
        if (Math.abs(gestureState.dx) > threshold && !swipedRef.current) {
          swipedRef.current = true;
          if (gestureState.dx < 0) {
            setSelectedDay((prev) => (prev + 1) % 7);
          } else {
            setSelectedDay((prev) => (prev - 1 + 7) % 7);
          }
          setTimeout(() => { swipedRef.current = false; }, 300);
        }
      },
    })
  ).current;

  const { blocks, addBlock, updateBlock, removeBlock, toggleCompleted } = useScheduleStore();
  const { tasks: allTasks, toggleTask, checkDailyReset } = useTasksStore();
  const { targetWakeTime, targetBedTime, getTodayLog } = useHealthStore();
  const scrollRef = useRef<ScrollView>(null);

  // Circadian data for timeline markers
  const wakeHour = useMemo(() => timeToDecimal(targetWakeTime), [targetWakeTime]);
  const bedHour = useMemo(() => timeToDecimal(targetBedTime), [targetBedTime]);
  const todayLog = getTodayLog();

  // Resetear hábitos diarios al cambiar de día
  useEffect(() => {
    checkDailyReset();
  }, []);

  // Actualizar reloj cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      checkDailyReset();
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll al momento actual
  useEffect(() => {
    if (selectedDay === now.current.getDay()) {
      const currentHour = now.current.getHours();
      const offset = Math.max(0, (currentHour - HOURS_START - 1) * HOUR_HEIGHT);
      setTimeout(() => scrollRef.current?.scrollTo({ y: offset, animated: true }), 400);
    }
  }, [selectedDay]);

  const dayBlocks = useMemo(() => {
    return blocks
      .filter((b) => b.dayIndex === selectedDay)
      .sort((a, b) => a.startHour - b.startHour);
  }, [blocks, selectedDay]);

  // Scheduled tasks + habits with reminderTime for selected day
  const scheduledTasksForDay = useMemo(() => {
    const items: (typeof allTasks[number] & { hour: number; isHabit?: boolean })[] = [];

    allTasks.forEach((t) => {
      // Tasks with scheduledTimestamp (one-off calendar placement)
      if (t.scheduledTimestamp) {
        const d = new Date(t.scheduledTimestamp);
        if (d.getDay() === selectedDay) {
          items.push({ ...t, hour: d.getHours() + d.getMinutes() / 60 });
        }
        return;
      }

      // Habits with reminderTime that are active on selectedDay
      if (t.reminderTime) {
        let showOnDay = false;
        if (t.frequency === 'daily') showOnDay = true;
        else if (t.frequency === 'custom' && t.repeatDays) {
          showOnDay = t.repeatDays.includes(selectedDay);
        } else if (t.frequency === 'once') {
          showOnDay = new Date(t.createdAt).getDay() === selectedDay;
        }
        if (showOnDay) {
          items.push({ ...t, hour: timeToDecimal(t.reminderTime), isHabit: true });
        }
      }
    });

    return items.sort((a, b) => a.hour - b.hour);
  }, [allTasks, selectedDay]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    const endH = Math.max(HOURS_END, Math.floor(bedHour));
    for (let h = HOURS_START; h <= endH; h++) arr.push(h);
    return arr;
  }, [bedHour]);

  const getGreeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return '🌅 Buenos días';
    if (h < 18) return '☀️ Buenas tardes';
    return '🌙 Buenas noches';
  };

  const currentHourDecimal = currentTime.getHours() + currentTime.getMinutes() / 60;
  const isToday = selectedDay === now.current.getDay();

  // Clima simulado según hora
  const getWeatherIcon = () => {
    const h = currentTime.getHours();
    if (h >= 6 && h < 10) return { icon: '🌤️', temp: '18°' };
    if (h >= 10 && h < 14) return { icon: '☀️', temp: '24°' };
    if (h >= 14 && h < 18) return { icon: '⛅', temp: '22°' };
    if (h >= 18 && h < 21) return { icon: '🌇', temp: '19°' };
    return { icon: '🌙', temp: '15°' };
  };
  const weather = getWeatherIcon();

  const nextBlock = useMemo(() => {
    // Schedule blocks
    const todayBlocks = blocks
      .filter((b) => b.dayIndex === now.current.getDay())
      .sort((a, b) => a.startHour - b.startHour);
    const nextB = todayBlocks.find((b) => b.startHour > currentHourDecimal);

    // Scheduled tasks + habits as virtual blocks
    const taskBlocks = allTasks
      .filter((t) => {
        if (t.completed) return false;
        if (t.scheduledTimestamp) {
          return new Date(t.scheduledTimestamp).getDay() === now.current.getDay();
        }
        if (t.reminderTime) {
          if (t.frequency === 'daily') return true;
          if (t.frequency === 'custom' && t.repeatDays)
            return t.repeatDays.includes(now.current.getDay());
          if (t.frequency === 'once')
            return new Date(t.createdAt).getDay() === now.current.getDay();
        }
        return false;
      })
      .map((t) => {
        let startHour: number;
        if (t.scheduledTimestamp) {
          const d = new Date(t.scheduledTimestamp);
          startHour = d.getHours() + d.getMinutes() / 60;
        } else {
          startHour = t.reminderTime ? timeToDecimal(t.reminderTime) : 8;
        }
        const cat = t.category ? CATEGORY_CONFIG[t.category] : null;
        return {
          id: t.id,
          title: `${cat ? cat.icon : '📝'} ${t.title}`,
          startHour,
          duration: 0.5,
          dayIndex: now.current.getDay(),
          color: cat ? cat.bg : '#f3f4f6',
          type: 'other' as const,
          completed: false,
        };
      });

    const all = [...todayBlocks, ...taskBlocks].sort((a, b) => a.startHour - b.startHour);
    return all.find((b) => b.startHour > currentHourDecimal);
  }, [blocks, allTasks, currentHourDecimal]);

  // "A Continuación" - tiempo restante
  const upNextData = useMemo(() => {
    if (!nextBlock || !isToday) return null;
    const minutesLeft = Math.round((nextBlock.startHour - currentHourDecimal) * 60);
    if (minutesLeft <= 0) return null;
    const hrs = Math.floor(minutesLeft / 60);
    const mins = minutesLeft % 60;
    const timeStr = hrs > 0 ? `${hrs}h ${mins}min` : `${mins} min`;
    return { block: nextBlock, timeStr, minutesLeft };
  }, [nextBlock, currentHourDecimal, isToday]);

  // Sugerencias de estudio: huecos libres de 1-2h antes de una clase
  const prepSuggestions = useMemo(() => {
    const suggestions: { hour: number; className: string; classColor: string }[] = [];
    dayBlocks.forEach((b) => {
      if (b.type !== 'class') return;
      // Buscar si la hora anterior está libre
      const prevHour = Math.floor(b.startHour) - 1;
      if (prevHour < HOURS_START) return;
      const occupied = dayBlocks.some(
        (other) => prevHour >= other.startHour && prevHour < other.startHour + other.duration
      );
      if (!occupied) {
        suggestions.push({ hour: prevHour, className: b.title, classColor: b.color });
      }
    });
    return suggestions;
  }, [dayBlocks]);

  const getBlockAtHour = (hour: number): ScheduleBlock | undefined => {
    return dayBlocks.find(
      (b) => hour >= b.startHour && hour < b.startHour + b.duration
    );
  };

  const isBlockStart = (hour: number): boolean => {
    return dayBlocks.some((b) => Math.floor(b.startHour) === hour);
  };

  // Abrir modal para AGREGAR
  const openAddModal = (hour: number) => {
    setEditingBlock(null);
    setFormTitle('');
    setFormStartHour(hour);
    setFormEndHour(hour + 1);
    setFormType('class');
    setFormColor(SCHEDULE_COLORS[blocks.length % SCHEDULE_COLORS.length]);
    setShowStartPicker(false);
    setShowEndPicker(false);
    setModalVisible(true);
  };

  // Abrir modal para EDITAR
  const openEditModal = (block: ScheduleBlock) => {
    setEditingBlock(block);
    setFormTitle(block.title);
    setFormStartHour(block.startHour);
    setFormEndHour(block.startHour + block.duration);
    setFormType(block.type);
    setFormColor(block.color);
    setShowStartPicker(false);
    setShowEndPicker(false);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      Alert.alert('Error', 'Escribe un nombre para el bloque');
      return;
    }
    if (formEndHour <= formStartHour) {
      Alert.alert('Error', 'La hora de fin debe ser mayor a la de inicio');
      return;
    }
    const duration = formEndHour - formStartHour;

    if (editingBlock) {
      // EDITAR
      updateBlock(editingBlock.id, {
        title: formTitle.trim(),
        startHour: formStartHour,
        duration,
        type: formType,
        color: formColor,
      });
    } else {
      // AGREGAR
      addBlock({
        dayIndex: selectedDay,
        startHour: formStartHour,
        duration,
        title: formTitle.trim(),
        color: formColor,
        type: formType,
        completed: false,
      });
    }
    setModalVisible(false);
    setEditingBlock(null);
  };

  const handleRemoveBlock = (block: ScheduleBlock) => {
    Alert.alert(
      'Eliminar bloque',
      `¿Eliminar "${block.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeBlock(block.id) },
      ]
    );
  };

  const formatHour = (h: number) => {
    const hh = Math.floor(h);
    const mm = h % 1 === 0.5 ? '30' : '00';
    return `${hh.toString().padStart(2, '0')}:${mm}`;
  };

  const formatCurrentTime = () => {
    return `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
  };

  // Posición de la línea de tiempo actual
  const nowLineTop = (currentHourDecimal - HOURS_START) * HOUR_HEIGHT;
  const showNowLine = isToday && currentHourDecimal >= HOURS_START && currentHourDecimal < HOURS_END + 1;

  // Filtrar opciones de fin según inicio
  const endTimeOptions = TIME_OPTIONS.filter((t) => t.value > formStartHour);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} {weather.icon} {weather.temp}</Text>
            <Text style={styles.headerTitle}>📅 Mi Agenda</Text>
          </View>
          <View style={styles.clockBadge}>
            <Text style={styles.clockText}>{formatCurrentTime()}</Text>
          </View>
        </View>
        <Text style={styles.headerDate}>
          {currentTime.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>

      {/* Selector de días */}
      <View style={styles.daySelector}>
        {DAYS.map((day, idx) => {
          const isSelected = idx === selectedDay;
          const isDayToday = idx === now.current.getDay();
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(idx)}
              style={[
                styles.dayButton,
                isSelected && styles.dayButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                ]}
              >
                {day}
              </Text>
              {isDayToday && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.dayFullName}>{FULL_DAYS[selectedDay]}</Text>

      {/* Timeline */}
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <ScrollView
          ref={scrollRef}
          style={styles.timeline}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ position: 'relative' }}>
          {/* Wake time marker */}
          {Math.floor(wakeHour) >= HOURS_START && Math.floor(wakeHour) <= HOURS_END && (
            <View
              style={[styles.circadianLine, { top: (Math.floor(wakeHour) - HOURS_START) * HOUR_HEIGHT }]}
              pointerEvents="none"
            >
              <View style={[styles.circadianPill, { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }]}>
                <Text style={{ fontSize: 12 }}>☀️</Text>
                <Text style={styles.circadianPillTextWake}>
                  Despertar {targetWakeTime.replace(/^0/, '')}
                  {todayLog?.wakeTime ? ` · ✅ ${todayLog.wakeTime.replace(/^0/, '')}` : ''}
                </Text>
              </View>
              <View style={[styles.circadianBar, { backgroundColor: '#FDBA74' }]} />
            </View>
          )}

          {/* Bed time marker */}
          {Math.floor(bedHour) >= HOURS_START && (
            <View
              style={[styles.circadianLine, { top: (Math.floor(bedHour) - HOURS_START) * HOUR_HEIGHT }]}
              pointerEvents="none"
            >
              <View style={[styles.circadianPill, { backgroundColor: '#EEF2FF', borderColor: '#A5B4FC' }]}>
                <Text style={{ fontSize: 12 }}>🌙</Text>
                <Text style={styles.circadianPillTextBed}>
                  Dormir {targetBedTime.replace(/^0/, '')}
                  {todayLog?.bedTime ? ` · ✅ ${todayLog.bedTime.replace(/^0/, '')}` : ''}
                </Text>
              </View>
              <View style={[styles.circadianBar, { backgroundColor: '#A5B4FC' }]} />
            </View>
          )}

          {/* Línea roja del ahora */}
          {showNowLine && (
            <View style={[styles.nowLine, { top: nowLineTop }]} pointerEvents="none">
              <View style={styles.nowDot} />
              <View style={styles.nowLineBar} />
              <Text style={styles.nowTimeLabel}>{formatCurrentTime()}</Text>
            </View>
          )}

          {hours.map((hour) => {
            const block = getBlockAtHour(hour);
            const startsHere = isBlockStart(hour);

            // Si el bloque cubre esta hora pero no empieza aquí, no pintar
            if (block && !startsHere) return null;

            if (block && startsHere) {
              const blockHeight = block.duration * HOUR_HEIGHT;
              const isPast = isToday && (block.startHour + block.duration) <= currentHourDecimal;
              return (
                <View key={hour} style={{ position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => openEditModal(block)}
                    onLongPress={() => handleRemoveBlock(block)}
                    activeOpacity={0.8}
                    style={[
                      styles.blockOccupied,
                      {
                        height: blockHeight,
                        backgroundColor: block.completed ? '#d1fae5' : block.color,
                        opacity: block.completed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <View style={styles.blockRow}>
                      <Text style={styles.blockHourLabel}>
                        {formatHour(block.startHour)}
                      </Text>
                      <View style={styles.blockContent}>
                        <Text style={styles.blockIcon}>
                          {block.type === 'class' ? '📚' : block.type === 'work' ? '💼' : '📌'}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.blockTitle,
                              block.completed && styles.blockTitleCompleted,
                            ]}
                            numberOfLines={1}
                          >
                            {block.title}
                          </Text>
                          <Text style={styles.blockTimeRange}>
                            {formatHour(block.startHour)} → {formatHour(block.startHour + block.duration)}
                          </Text>
                        </View>
                      </View>

                      {/* Botón de completar */}
                      <TouchableOpacity
                        onPress={() => toggleCompleted(block.id)}
                        style={[
                          styles.checkButton,
                          block.completed && styles.checkButtonDone,
                        ]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.checkIcon}>
                          {block.completed ? '✅' : '⬜'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.blockFooter}>
                      {block.completed && (
                        <Text style={styles.completedBadge}>✔ Cumplido</Text>
                      )}
                      {isPast && !block.completed && (
                        <Text style={styles.missedBadge}>⚠ Sin completar</Text>
                      )}
                      <Text style={styles.blockHint}>Toca para editar · Mantén para eliminar</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }

            // Hora libre - ¿hay sugerencia de prep?
            const prep = prepSuggestions.find((s) => s.hour === hour);
            if (prep) {
              return (
                <TouchableOpacity
                  key={hour}
                  onPress={() => openAddModal(hour)}
                  style={styles.blockPrep}
                  activeOpacity={0.7}
                >
                  <Text style={styles.prepHourLabel}>{formatHour(hour)}</Text>
                  <View style={[styles.prepCard, { borderColor: prep.classColor }]}>
                    <Text style={styles.prepIcon}>📖</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prepTitle}>Preparar {prep.className}</Text>
                      <Text style={styles.prepSubtitle}>⚡ Repaso rápido antes de clase</Text>
                    </View>
                    <Text style={styles.prepAdd}>+</Text>
                  </View>
                </TouchableOpacity>
              );
            }

            // Scheduled task or habit at this hour
            const scheduledTask = scheduledTasksForDay.find((t) => Math.floor(t.hour) === hour);
            if (scheduledTask) {
              const isHabit = (scheduledTask as any).isHabit;
              const cat = scheduledTask.category ? CATEGORY_CONFIG[scheduledTask.category] : null;
              const taskPriConfig = TASK_PRIORITY[scheduledTask.priority];
              const borderColor = isHabit && cat ? cat.color : taskPriConfig.color;
              const icon = isHabit && cat ? cat.icon : '📝';
              const subtitle = isHabit
                ? `Hábito · ${cat ? cat.label : ''} · ⏰ ${scheduledTask.reminderTime}`
                : `Tarea · ${taskPriConfig.label}`;
              const badgeBg = isHabit && cat ? cat.bg : taskPriConfig.bg;
              const badgeColor = isHabit && cat ? cat.color : taskPriConfig.color;
              const badgeIcon = isHabit ? '🌱' : taskPriConfig.icon;
              const isDone = scheduledTask.completed;
              return (
                <View key={hour} style={styles.scheduledTaskBlock}>
                  <Text style={styles.freeHourLabel}>{formatHour(hour)}</Text>
                  <View style={[
                    styles.scheduledTaskCard,
                    { borderLeftColor: isDone ? '#10B981' : borderColor },
                    isDone && { backgroundColor: '#ECFDF5', opacity: 0.85 },
                  ]}>
                    <Text style={{ fontSize: 16 }}>{icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.scheduledTaskTitle,
                        isDone && { textDecorationLine: 'line-through', color: '#9CA3AF' },
                      ]}>
                        {scheduledTask.title}
                      </Text>
                      <Text style={styles.scheduledTaskSub}>
                        {isDone ? '✔ Completado' : subtitle}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleTask(scheduledTask.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={[
                        styles.checkButton,
                        isDone && styles.checkButtonDone,
                      ]}
                    >
                      <Text style={styles.checkIcon}>
                        {isDone ? '✅' : '⬜'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={hour}
                onPress={() => openAddModal(hour)}
                style={[
                  styles.blockFree,
                  isToday && hour === Math.floor(currentHourDecimal) && styles.blockFreeNow,
                ]}
                activeOpacity={0.6}
              >
                <Text style={[
                  styles.freeHourLabel,
                  isToday && hour === Math.floor(currentHourDecimal) && styles.freeHourLabelNow,
                ]}>
                  {formatHour(hour)}
                </Text>
                <View style={styles.freeLine} />
                <Text style={styles.freeText}>+ Agregar</Text>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>
      </View>

      {/* Widget "A Continuación" */}
      {upNextData && (
        <View style={styles.upNextWidget}>
          <View style={styles.upNextLeft}>
            <Text style={styles.upNextLabel}>A CONTINUACIÓN</Text>
            <Text style={styles.upNextName} numberOfLines={1}>{upNextData.block.title}</Text>
            <Text style={styles.upNextTime}>
              {formatHour(upNextData.block.startHour)} → {formatHour(upNextData.block.startHour + upNextData.block.duration)}
            </Text>
          </View>
          <View style={styles.upNextRight}>
            <Text style={styles.upNextCountdown}>{upNextData.timeStr}</Text>
            <Text style={styles.upNextCountdownLabel}>
              {upNextData.minutesLeft <= 15 ? '🔴 ¡Ya casi!' : upNextData.minutesLeft <= 60 ? '🟡 Pronto' : '🟢 Relax'}
            </Text>
          </View>
        </View>
      )}

      {/* Modal para agregar/editar bloque */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { setModalVisible(false); setEditingBlock(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingBlock ? '✏️ Editar bloque' : '📝 Nuevo bloque'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {FULL_DAYS[selectedDay]}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre (ej: Física Cuántica)"
              placeholderTextColor="#9ca3af"
              value={formTitle}
              onChangeText={setFormTitle}
              autoFocus
            />

            {/* Tipo */}
            <Text style={styles.modalLabel}>Tipo</Text>
            <View style={styles.typeRow}>
              {BLOCK_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setFormType(t.value)}
                  style={[
                    styles.typeButton,
                    formType === t.value && styles.typeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      formType === t.value && styles.typeTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color */}
            <Text style={styles.modalLabel}>Color</Text>
            <View style={styles.colorRow}>
              {SCHEDULE_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setFormColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    formColor === c && styles.colorDotActive,
                  ]}
                >
                  {formColor === c && <Text style={styles.colorCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {/* Hora inicio */}
            <Text style={styles.modalLabel}>Hora de inicio</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => { Keyboard.dismiss(); setShowStartPicker(!showStartPicker); setShowEndPicker(false); }}
            >
              <Text style={styles.timePickerValue}>{formatHour(formStartHour)}</Text>
              <Text style={styles.timePickerArrow}>▼</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <ScrollView style={styles.timePickerList} nestedScrollEnabled>
                {TIME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={`start-${opt.value}`}
                    style={[
                      styles.timePickerItem,
                      formStartHour === opt.value && styles.timePickerItemActive,
                    ]}
                    onPress={() => {
                      setFormStartHour(opt.value);
                      if (formEndHour <= opt.value) setFormEndHour(opt.value + 1);
                      setShowStartPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.timePickerItemText,
                      formStartHour === opt.value && styles.timePickerItemTextActive,
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Hora fin */}
            <Text style={[styles.modalLabel, { marginTop: 12 }]}>Hora de fin</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => { Keyboard.dismiss(); setShowEndPicker(!showEndPicker); setShowStartPicker(false); }}
            >
              <Text style={styles.timePickerValue}>{formatHour(formEndHour)}</Text>
              <Text style={styles.timePickerArrow}>▼</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <ScrollView style={styles.timePickerList} nestedScrollEnabled>
                {endTimeOptions.map((opt) => (
                  <TouchableOpacity
                    key={`end-${opt.value}`}
                    style={[
                      styles.timePickerItem,
                      formEndHour === opt.value && styles.timePickerItemActive,
                    ]}
                    onPress={() => {
                      setFormEndHour(opt.value);
                      setShowEndPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.timePickerItemText,
                      formEndHour === opt.value && styles.timePickerItemTextActive,
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Duración calculada */}
            <Text style={styles.durationPreview}>
              Duración: {formEndHour - formStartHour > 0 ? `${formEndHour - formStartHour}h` : '—'}
            </Text>

            {/* Botones */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => { setModalVisible(false); setEditingBlock(null); }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              {editingBlock && (
                <TouchableOpacity
                  onPress={() => {
                    handleRemoveBlock(editingBlock);
                    setModalVisible(false);
                    setEditingBlock(null);
                  }}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>🗑</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                style={styles.saveButton}
              >
                <Text style={styles.saveText}>
                  {editingBlock ? 'Actualizar' : 'Guardar'}
                </Text>
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
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: '#c7d2fe',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  clockBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  clockText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  headerDate: {
    fontSize: 13,
    color: '#e0e7ff',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  nextClassCard: {
    backgroundColor: '#eef2ff',
    marginHorizontal: 16,
    marginTop: -8,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  nextClassLabel: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextClassName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e1b4b',
    marginTop: 2,
  },
  nextClassTime: {
    fontSize: 13,
    color: '#4338ca',
    marginTop: 2,
  },
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginTop: 8,
  },
  dayButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  dayButtonSelected: {
    backgroundColor: '#4F46E5',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  dayTextSelected: {
    color: '#ffffff',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginTop: 3,
  },
  dayFullName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'capitalize',
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 12,
  },
  // Línea roja del ahora
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },

  // Circadian markers (wake/bed)
  circadianLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 8,
  },
  circadianPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginLeft: 2,
  },
  circadianPillTextWake: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C2410C',
  },
  circadianPillTextBed: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  circadianBar: {
    flex: 1,
    height: 1.5,
    marginLeft: 4,
    opacity: 0.5,
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  nowLineBar: {
    flex: 1,
    height: 2,
    backgroundColor: '#ef4444',
  },
  nowTimeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
    marginLeft: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  // Block ocupado
  blockOccupied: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 2,
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(0,0,0,0.15)',
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockHourLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    width: 44,
    opacity: 0.7,
  },
  blockContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blockIcon: {
    fontSize: 16,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  blockTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#059669',
  },
  blockTimeRange: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  blockDuration: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  blockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  completedBadge: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  missedBadge: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: '700',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  blockHint: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'right',
    opacity: 0.6,
    flex: 1,
  },
  checkButton: {
    marginLeft: 8,
    padding: 4,
  },
  checkButtonDone: {
    opacity: 1,
  },
  checkIcon: {
    fontSize: 20,
  },
  // Block libre
  blockFree: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HOUR_HEIGHT,
    paddingHorizontal: 4,
  },
  blockFreeNow: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  freeHourLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    width: 44,
  },
  freeHourLabelNow: {
    color: '#d97706',
    fontWeight: '700',
  },
  freeLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  freeText: {
    fontSize: 12,
    color: '#c7d2fe',
    fontWeight: '500',
  },
  // Modal
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
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  modalInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#eef2ff',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  typeText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
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
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: '#374151',
    transform: [{ scale: 1.15 }],
  },
  colorCheck: {
    fontSize: 16,
    fontWeight: '900',
    color: '#374151',
  },
  // Prep suggestion blocks
  blockPrep: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HOUR_HEIGHT,
    paddingHorizontal: 4,
  },
  prepHourLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b5cf6',
    width: 44,
  },
  prepCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  prepIcon: {
    fontSize: 18,
  },
  prepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6d28d9',
  },
  prepSubtitle: {
    fontSize: 10,
    color: '#8b5cf6',
    marginTop: 1,
  },
  prepAdd: {
    fontSize: 20,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  // Up Next widget
  upNextWidget: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    marginHorizontal: 12,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  upNextLeft: {
    flex: 1,
  },
  upNextLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 1,
  },
  upNextName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  upNextTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  upNextRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  upNextCountdown: {
    fontSize: 20,
    fontWeight: '900',
    color: '#60a5fa',
    fontVariant: ['tabular-nums'],
  },
  upNextCountdownLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  durationPreview: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
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
  deleteButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 18,
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
  // Scheduled task in timeline
  scheduledTaskBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  scheduledTaskCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  scheduledTaskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  scheduledTaskSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  scheduledTaskPriBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
