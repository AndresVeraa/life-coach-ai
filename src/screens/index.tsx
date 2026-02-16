import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { useScheduleStore, SCHEDULE_COLORS } from '../store/schedule.store';
import type { ScheduleBlock } from '../store/schedule.store';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const FULL_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HOURS_START = 6;
const HOURS_END = 22;
const HOUR_HEIGHT = 64;

const BLOCK_TYPES: { label: string; value: ScheduleBlock['type'] }[] = [
  { label: '📚 Clase', value: 'class' },
  { label: '💼 Trabajo', value: 'work' },
  { label: '📌 Otro', value: 'other' },
];

export default function Home() {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDay());
  const [modalVisible, setModalVisible] = useState(false);
  const [newBlockHour, setNewBlockHour] = useState(8);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockDuration, setNewBlockDuration] = useState('1');
  const [newBlockType, setNewBlockType] = useState<ScheduleBlock['type']>('class');

  const { blocks, addBlock, removeBlock } = useScheduleStore();

  const dayBlocks = useMemo(() => {
    return blocks
      .filter((b) => b.dayIndex === selectedDay)
      .sort((a, b) => a.startHour - b.startHour);
  }, [blocks, selectedDay]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = HOURS_START; h <= HOURS_END; h++) arr.push(h);
    return arr;
  }, []);

  const getGreeting = () => {
    const h = today.getHours();
    if (h < 12) return '🌅 Buenos días';
    if (h < 18) return '☀️ Buenas tardes';
    return '🌙 Buenas noches';
  };

  const nextBlock = useMemo(() => {
    const nowHour = today.getHours() + today.getMinutes() / 60;
    const todayBlocks = blocks
      .filter((b) => b.dayIndex === today.getDay())
      .sort((a, b) => a.startHour - b.startHour);
    return todayBlocks.find((b) => b.startHour > nowHour);
  }, [blocks]);

  const getBlockAtHour = (hour: number): ScheduleBlock | undefined => {
    return dayBlocks.find(
      (b) => hour >= b.startHour && hour < b.startHour + b.duration
    );
  };

  const isBlockStart = (hour: number): boolean => {
    return dayBlocks.some((b) => b.startHour === hour);
  };

  const openAddModal = (hour: number) => {
    setNewBlockHour(hour);
    setNewBlockTitle('');
    setNewBlockDuration('1');
    setNewBlockType('class');
    setModalVisible(true);
  };

  const handleAddBlock = () => {
    if (!newBlockTitle.trim()) {
      Alert.alert('Error', 'Escribe un nombre para el bloque');
      return;
    }
    const dur = parseFloat(newBlockDuration) || 1;
    const colorIndex = blocks.length % SCHEDULE_COLORS.length;
    addBlock({
      dayIndex: selectedDay,
      startHour: newBlockHour,
      duration: dur,
      title: newBlockTitle.trim(),
      color: SCHEDULE_COLORS[colorIndex],
      type: newBlockType,
    });
    setModalVisible(false);
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
    return `${hh.toString().padStart(2, '0')}:00`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.headerTitle}>📅 Mi Agenda</Text>
        <Text style={styles.headerDate}>
          {today.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>

      {/* Próxima clase */}
      {nextBlock && selectedDay === today.getDay() && (
        <View style={styles.nextClassCard}>
          <Text style={styles.nextClassLabel}>⏰ Próximo</Text>
          <Text style={styles.nextClassName}>{nextBlock.title}</Text>
          <Text style={styles.nextClassTime}>
            {formatHour(nextBlock.startHour)} - {formatHour(nextBlock.startHour + nextBlock.duration)}
          </Text>
        </View>
      )}

      {/* Selector de días */}
      <View style={styles.daySelector}>
        {DAYS.map((day, idx) => {
          const isSelected = idx === selectedDay;
          const isToday = idx === today.getDay();
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
              {isToday && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.dayFullName}>{FULL_DAYS[selectedDay]}</Text>

      {/* Timeline */}
      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        {hours.map((hour) => {
          const block = getBlockAtHour(hour);
          const isStart = isBlockStart(hour);

          if (block && !isStart) return null;

          if (block && isStart) {
            const blockHeight = block.duration * HOUR_HEIGHT;
            return (
              <TouchableOpacity
                key={hour}
                onLongPress={() => handleRemoveBlock(block)}
                activeOpacity={0.8}
                style={[
                  styles.blockOccupied,
                  {
                    height: blockHeight,
                    backgroundColor: block.color,
                  },
                ]}
              >
                <View style={styles.blockRow}>
                  <Text style={styles.blockHourLabel}>{formatHour(hour)}</Text>
                  <View style={styles.blockContent}>
                    <Text style={styles.blockIcon}>
                      {block.type === 'class' ? '📚' : block.type === 'work' ? '💼' : '📌'}
                    </Text>
                    <Text style={styles.blockTitle} numberOfLines={1}>
                      {block.title}
                    </Text>
                    <Text style={styles.blockDuration}>
                      {block.duration}h
                    </Text>
                  </View>
                </View>
                <Text style={styles.blockHint}>Mantén presionado para eliminar</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={hour}
              onPress={() => openAddModal(hour)}
              style={styles.blockFree}
              activeOpacity={0.6}
            >
              <Text style={styles.freeHourLabel}>{formatHour(hour)}</Text>
              <View style={styles.freeLine} />
              <Text style={styles.freeText}>+ Agregar</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Modal para agregar bloque */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              📝 Nuevo bloque - {formatHour(newBlockHour)}
            </Text>
            <Text style={styles.modalSubtitle}>
              {FULL_DAYS[selectedDay]}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre (ej: Física Cuántica)"
              placeholderTextColor="#9ca3af"
              value={newBlockTitle}
              onChangeText={setNewBlockTitle}
              autoFocus
            />

            <Text style={styles.modalLabel}>Tipo</Text>
            <View style={styles.typeRow}>
              {BLOCK_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setNewBlockType(t.value)}
                  style={[
                    styles.typeButton,
                    newBlockType === t.value && styles.typeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      newBlockType === t.value && styles.typeTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Duración (horas)</Text>
            <View style={styles.durationRow}>
              {['1', '1.5', '2', '3'].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setNewBlockDuration(d)}
                  style={[
                    styles.durationButton,
                    newBlockDuration === d && styles.durationButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.durationText,
                      newBlockDuration === d && styles.durationTextActive,
                    ]}
                  >
                    {d}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddBlock}
                style={styles.saveButton}
              >
                <Text style={styles.saveText}>Guardar</Text>
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
  blockOccupied: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 2,
    justifyContent: 'space-between',
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
    flex: 1,
  },
  blockDuration: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  blockHint: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
    opacity: 0.6,
  },
  blockFree: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HOUR_HEIGHT,
    paddingHorizontal: 4,
  },
  freeHourLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    width: 44,
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
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: '#4F46E5',
  },
  durationText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  durationTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
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
