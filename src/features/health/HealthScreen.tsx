import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { SleepQuality, SleepRecord, WeeklyPoint, useHealthStore } from './health.store';

const { width: screenWidth } = Dimensions.get('window');

const COLORS = {
  bg: '#0A0A0F',
  card: '#12121A',
  chipBg: '#1E1E2E',
  textPrimary: '#F0F0FF',
  textSecondary: '#6B6B8A',
  violet: '#7C6FCD',
  teal: '#4ECDC4',
  yellow: '#F0A500',
  red: '#FF6B6B',
  grayBar: '#2A2A3A',
  white10: '#FFFFFF10',
  white08: '#FFFFFF08',
  white15: '#FFFFFF15',
  white20: '#FFFFFF20',
  dangerBg: '#2A1116',
};

const QUALITY_META: Record<SleepQuality, { label: string; emoji: string; color: string }> = {
  malo: { label: 'Malo', emoji: '😴', color: COLORS.red },
  regular: { label: 'Regular', emoji: '😐', color: COLORS.yellow },
  bueno: { label: 'Bueno', emoji: '🙂', color: COLORS.violet },
  excelente: { label: 'Excelente', emoji: '😊', color: COLORS.teal },
};

const DAY_FALLBACK = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function fromMinutes(total: number): string {
  const normalized = ((total % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function shiftTime15(time: string, delta: number): string {
  return fromMinutes(toMinutes(time) + delta);
}

function toDateFromTime(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function formatTimeFromDate(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function calculateDurationHours(bedTime: string, wakeTime: string): number {
  let diffMinutes = toMinutes(wakeTime) - toMinutes(bedTime);
  if (diffMinutes < 0) diffMinutes += 24 * 60;
  return diffMinutes / 60;
}

function formatDuration(hours: number): string {
  const fullHours = Math.floor(hours);
  const minutes = Math.round((hours - fullHours) * 60);
  return `${fullHours} horas ${minutes} minutos`;
}

function getDurationColor(hours: number): string {
  if (hours >= 7) return COLORS.teal;
  if (hours >= 5) return COLORS.yellow;
  return COLORS.red;
}

function getQualityFromPoint(point: WeeklyPoint): SleepQuality | null {
  if (point.quality) return point.quality;
  if (point.hours == null) return null;

  if (point.hours >= 7.5) return 'excelente';
  if (point.hours >= 6) return 'bueno';
  if (point.hours >= 4) return 'regular';
  return 'malo';
}

function getBarColor(point: WeeklyPoint): string {
  const quality = getQualityFromPoint(point);
  if (!quality) return COLORS.grayBar;
  return QUALITY_META[quality].color;
}

function formatDateShort(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  const weekday = date.toLocaleDateString('es-ES', { weekday: 'short' });
  const day = date.toLocaleDateString('es-ES', { day: '2-digit' });
  const month = date.toLocaleDateString('es-ES', { month: 'short' });
  return `${weekday} ${day} ${month}`.replace('.', '');
}

function formatDateLong(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function getTrendMeta(direction: 'mejorando' | 'empeorando' | 'estable') {
  if (direction === 'mejorando') return { arrow: '↑', color: COLORS.teal };
  if (direction === 'empeorando') return { arrow: '↓', color: COLORS.red };
  return { arrow: '→', color: COLORS.textSecondary };
}

type TooltipState = {
  index: number;
  point: WeeklyPoint;
};

const SwipeableHistoryItem: React.FC<{
  record: SleepRecord;
  onDelete: (id: string) => void;
}> = ({ record, onDelete }) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -120));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx <= -80) {
          Alert.alert('Eliminar registro', '¿Deseas eliminar este registro?', [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => {
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                }).start();
              },
            },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: () => onDelete(record.id),
            },
          ]);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const qualityMeta = QUALITY_META[record.quality];

  return (
    <View style={styles.historyItemWrap}>
      <View style={styles.deleteBackground}>
        <Text style={styles.deleteIcon}>🗑️</Text>
      </View>

      <Animated.View style={[styles.historyItem, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <View style={styles.historyTopRow}>
          <Text style={styles.historyDate} numberOfLines={1}>
            {formatDateShort(record.date)}
          </Text>

          <Text style={[styles.historyDuration, { color: qualityMeta.color }]} numberOfLines={1}>
            {formatDuration(record.duration)}
          </Text>

          <View style={[styles.historyQualityChip, { backgroundColor: `${qualityMeta.color}30` }]}>
            <Text style={styles.historyQualityChipText} numberOfLines={1}>
              {qualityMeta.emoji} {qualityMeta.label}
            </Text>
          </View>
        </View>

        {!!record.notes && (
          <Text style={styles.historyNotes} numberOfLines={1} ellipsizeMode="tail">
            {record.notes}
          </Text>
        )}
      </Animated.View>
    </View>
  );
};

export const HealthScreen: React.FC = () => {
  const {
    sleepRecords,
    sleepStats,
    addSleepRecord,
    updateSleepRecord,
    deleteSleepRecord,
    getSleepHistory,
    getWeeklyData,
  } = useHealthStore();

  const [showAllHistory, setShowAllHistory] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const [bedTime, setBedTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<SleepQuality>('bueno');
  const [notes, setNotes] = useState('');

  const [showBedPicker, setShowBedPicker] = useState(false);
  const [showWakePicker, setShowWakePicker] = useState(false);

  const saveScale = useRef(new Animated.Value(1)).current;
  const barAnimations = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayRecord = useMemo(
    () => sleepRecords.find(record => record.date === todayIso),
    [sleepRecords, todayIso]
  );

  const weeklyData = getWeeklyData();
  const history = getSleepHistory(showAllHistory ? 14 : 5);
  const trendMeta = getTrendMeta(sleepStats.trendDirection);

  const durationHours = useMemo(
    () => calculateDurationHours(bedTime, wakeTime),
    [bedTime, wakeTime]
  );

  const debtColor = useMemo(() => {
    if (sleepStats.sleepDebt < 2) return COLORS.teal;
    if (sleepStats.sleepDebt <= 5) return COLORS.yellow;
    return COLORS.red;
  }, [sleepStats.sleepDebt]);

  useEffect(() => {
    if (!todayRecord) {
      setBedTime('23:00');
      setWakeTime('07:00');
      setQuality('bueno');
      setNotes('');
      return;
    }

    setBedTime(todayRecord.bedTime);
    setWakeTime(todayRecord.wakeTime);
    setQuality(todayRecord.quality);
    setNotes(todayRecord.notes ?? '');
  }, [todayRecord]);

  useEffect(() => {
    barAnimations.forEach(anim => anim.setValue(0));
    const sequence = barAnimations.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: false,
      })
    );

    Animated.stagger(50, sequence).start();
  }, [weeklyData, barAnimations]);

  const handleSave = () => {
    const payload = {
      date: todayIso,
      bedTime,
      wakeTime,
      quality,
      notes: notes.trim() || undefined,
    };

    if (todayRecord) {
      updateSleepRecord(todayRecord.id, payload);
    } else {
      addSleepRecord(payload);
    }

    Animated.sequence([
      Animated.timing(saveScale, {
        toValue: 0.95,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(saveScale, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const graphWidth = screenWidth - 32;
  const barsAreaHeight = 140;
  const columnWidth = (graphWidth - 24) / 7;
  const goalBottom = (8 / 10) * barsAreaHeight;
  const dashCount = Math.floor(graphWidth / 10);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Salud & Sueño</Text>
          <View style={styles.subtitleRow}>
            <Text
              style={[
                styles.subtitle,
                { color: sleepStats.weeklyAverage > 0 ? COLORS.teal : COLORS.textSecondary },
              ]}
              numberOfLines={1}
            >
              {sleepStats.weeklyAverage > 0
                ? `Promedio esta semana: ${sleepStats.weeklyAverage.toFixed(1)}h`
                : 'Empieza a registrar tu sueño'}
            </Text>
            <Text style={[styles.trendArrow, { color: trendMeta.color }]}>{trendMeta.arrow}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              sleepStats.trendDirection === 'mejorando' && { borderColor: '#4ECDC455' },
              sleepStats.trendDirection === 'empeorando' && { borderColor: '#FF6B6B55' },
            ]}
          >
            <Text
              style={[
                styles.statValue,
                { color: sleepStats.weeklyAverage >= 7 ? COLORS.teal : COLORS.violet },
              ]}
            >
              {sleepStats.weeklyAverage > 0 ? `${sleepStats.weeklyAverage.toFixed(1)}h` : '—'}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              ESTA SEMANA
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.streakValueRow}>
              <Text
                style={[
                  styles.statValue,
                  { color: sleepStats.currentStreak >= 3 ? COLORS.yellow : COLORS.textPrimary },
                ]}
              >
                {sleepStats.currentStreak > 0 ? sleepStats.currentStreak : '—'}
              </Text>
              {sleepStats.currentStreak > 0 && <Text style={styles.streakSuffix}>d</Text>}
              {sleepStats.currentStreak >= 3 && <Text style={styles.streakFire}>🔥</Text>}
            </View>
            <Text style={styles.statLabel} numberOfLines={1}>
              RACHA ACTUAL
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.debtRow}>
              {sleepStats.sleepDebt > 5 && <Text style={styles.debtWarn}>⚠️</Text>}
              <Text style={[styles.statValue, { color: debtColor }]}>
                {sleepStats.sleepDebt.toFixed(1)}h
              </Text>
            </View>
            <Text style={styles.statLabel} numberOfLines={1}>
              DEUDA SUEÑO
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Últimos 7 días</Text>
            <View style={styles.avgBadge}>
              <Text style={styles.avgBadgeText}>{sleepStats.weeklyAverage.toFixed(1)}h promedio</Text>
            </View>
          </View>

          <View style={[styles.chartCard, { width: graphWidth }]}>
            <View style={[styles.goalLineRow, { bottom: goalBottom + 24 }]}>
              {Array.from({ length: dashCount }).map((_, idx) => (
                <View key={idx} style={styles.goalDash} />
              ))}
            </View>

            {tooltip && <Pressable style={StyleSheet.absoluteFill} onPress={() => setTooltip(null)} />}

            {tooltip && (
              <View
                style={[
                  styles.tooltip,
                  {
                    left: 12 + tooltip.index * columnWidth + columnWidth / 2 - 62,
                    top: 8,
                  },
                ]}
              >
                <Text style={styles.tooltipText} numberOfLines={1}>
                  {formatDateShort(tooltip.point.date)}
                </Text>
                <Text style={styles.tooltipText} numberOfLines={1}>
                  {tooltip.point.hours == null ? 'Sin registro' : `${tooltip.point.hours.toFixed(1)}h`}
                </Text>
                <Text style={styles.tooltipText} numberOfLines={1}>
                  {(() => {
                    const q = getQualityFromPoint(tooltip.point);
                    return q ? `${QUALITY_META[q].emoji} ${QUALITY_META[q].label}` : '—';
                  })()}
                </Text>
              </View>
            )}

            <View style={styles.barsRow}>
              {weeklyData.map((point, idx) => {
                const value = point.hours ?? 0.25;
                const finalHeight = Math.max(4, (Math.min(value, 10) / 10) * barsAreaHeight);
                const animatedHeight = barAnimations[idx].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, finalHeight],
                });

                const dayLabel = point.day?.trim().length
                  ? point.day.charAt(0).toUpperCase()
                  : DAY_FALLBACK[idx];

                return (
                  <TouchableOpacity
                    key={`${point.date}-${idx}`}
                    style={styles.barColumn}
                    activeOpacity={0.9}
                    onPress={() => setTooltip({ index: idx, point })}
                  >
                    <Animated.View
                      style={[
                        styles.bar,
                        {
                          height: animatedHeight,
                          backgroundColor: getBarColor(point),
                        },
                      ]}
                    />
                    <Text style={styles.dayLabel}>{dayLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.section}>
            <View style={styles.registerCard}>
              <Text style={styles.sectionTitle}>Registrar sueño</Text>
              <Text style={styles.registerSubtitle} numberOfLines={1}>
                {formatDateLong(todayIso)}
              </Text>

              {todayRecord && (
                <View style={styles.todayTagRow}>
                  <Text style={styles.todayTagText}>✅ Ya registraste esta noche</Text>
                  <Text style={styles.todayEditText}>Editar</Text>
                </View>
              )}

              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Me acosté</Text>
                <View style={styles.timeControls}>
                  <TouchableOpacity style={styles.roundButton} onPress={() => setBedTime(v => shiftTime15(v, -15))}>
                    <Text style={styles.roundButtonText}>−</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setShowBedPicker(true)}>
                    <Text style={styles.timeDisplay}>{bedTime}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.roundButton} onPress={() => setBedTime(v => shiftTime15(v, 15))}>
                    <Text style={styles.roundButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Me desperté</Text>
                <View style={styles.timeControls}>
                  <TouchableOpacity style={styles.roundButton} onPress={() => setWakeTime(v => shiftTime15(v, -15))}>
                    <Text style={styles.roundButtonText}>−</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setShowWakePicker(true)}>
                    <Text style={styles.timeDisplay}>{wakeTime}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.roundButton} onPress={() => setWakeTime(v => shiftTime15(v, 15))}>
                    <Text style={styles.roundButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.separator} />

              <View
                style={[
                  styles.previewBox,
                  { backgroundColor: `${getDurationColor(durationHours)}22` },
                ]}
              >
                <Text style={[styles.previewText, { color: getDurationColor(durationHours) }]} numberOfLines={1}>
                  🌙 {formatDuration(durationHours)}
                </Text>
              </View>

              <View style={styles.qualityRow}>
                {(Object.keys(QUALITY_META) as SleepQuality[]).map(q => {
                  const isActive = q === quality;
                  return (
                    <TouchableOpacity
                      key={q}
                      onPress={() => setQuality(q)}
                      style={[
                        styles.qualityChip,
                        {
                          backgroundColor: isActive ? QUALITY_META[q].color : COLORS.chipBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.qualityChipText,
                          { color: isActive ? '#FFFFFF' : COLORS.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {QUALITY_META[q].emoji} {QUALITY_META[q].label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Notas (opcional)"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.notesInput}
              />

              <Animated.View style={{ transform: [{ scale: saveScale }] }}>
                <TouchableOpacity onPress={handleSave} activeOpacity={0.9}>
                  <LinearGradient
                    colors={[COLORS.violet, COLORS.teal]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.saveButton}
                  >
                    <Text style={styles.saveButtonText}>
                      {todayRecord ? 'Actualizar registro' : 'Guardar registro'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </KeyboardAvoidingView>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
              Historial ({sleepStats.totalRecords} noches)
            </Text>
            <TouchableOpacity onPress={() => setShowAllHistory(v => !v)}>
              <Text style={styles.linkButton}>{showAllHistory ? 'Ver menos' : 'Ver más'}</Text>
            </TouchableOpacity>
          </View>

          {sleepRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌙</Text>
              <Text style={styles.emptyTitle}>No hay registros aún</Text>
              <Text style={styles.emptySubtitle} numberOfLines={2}>
                Registra tu primer noche de sueño arriba
              </Text>
            </View>
          ) : (
            history.map(record => (
              <SwipeableHistoryItem key={record.id} record={record} onDelete={deleteSleepRecord} />
            ))
          )}
        </View>
      </ScrollView>

      {showBedPicker && (
        <DateTimePicker
          mode="time"
          display={Platform.OS === 'android' ? 'spinner' : 'default'}
          value={toDateFromTime(bedTime)}
          is24Hour
          onChange={(_, date) => {
            setShowBedPicker(false);
            if (date) setBedTime(formatTimeFromDate(date));
          }}
        />
      )}

      {showWakePicker && (
        <DateTimePicker
          mode="time"
          display={Platform.OS === 'android' ? 'spinner' : 'default'}
          value={toDateFromTime(wakeTime)}
          is24Hour
          onChange={(_, date) => {
            setShowWakePicker(false);
            if (date) setWakeTime(formatTimeFromDate(date));
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  header: {
    marginTop: 8,
    marginBottom: 14,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitleRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  trendArrow: {
    fontSize: 18,
    fontWeight: '800',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: screenWidth < 360 ? 'wrap' : 'nowrap',
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    minWidth: screenWidth < 360 ? '48%' : undefined,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.white10,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 36,
  },
  statLabel: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
  },
  streakValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  streakSuffix: {
    marginLeft: 2,
    marginBottom: 4,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  streakFire: {
    marginLeft: 6,
    marginBottom: 6,
    fontSize: 14,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtWarn: {
    marginRight: 6,
    fontSize: 14,
  },

  section: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  avgBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${COLORS.violet}55`,
    backgroundColor: `${COLORS.violet}22`,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  avgBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },

  chartCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.white08,
    borderRadius: 16,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  goalLineRow: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  goalDash: {
    width: 6,
    height: 1,
    backgroundColor: COLORS.white20,
  },
  barsRow: {
    height: 160,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  barColumn: {
    width: 22,
    height: 160,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 18,
    minHeight: 4,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  dayLabel: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tooltip: {
    position: 'absolute',
    width: 124,
    top: 8,
    backgroundColor: COLORS.chipBg,
    borderWidth: 1,
    borderColor: COLORS.violet,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 5,
  },
  tooltipText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },

  registerCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.white10,
    borderRadius: 16,
    padding: 14,
  },
  registerSubtitle: {
    marginTop: 2,
    marginBottom: 10,
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  todayTagRow: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayTagText: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: '700',
  },
  todayEditText: {
    color: COLORS.violet,
    fontSize: 12,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.white15,
    backgroundColor: COLORS.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  timeDisplay: {
    minWidth: 70,
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.white10,
    marginVertical: 10,
  },
  previewBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.white10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '700',
  },
  qualityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  qualityChip: {
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  qualityChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.white10,
    backgroundColor: COLORS.chipBg,
    color: COLORS.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  saveButton: {
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  linkButton: {
    color: COLORS.violet,
    fontSize: 12,
    fontWeight: '700',
  },

  historyItemWrap: {
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.dangerBg,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 18,
  },
  deleteIcon: {
    fontSize: 20,
  },
  historyItem: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.white08,
    borderRadius: 14,
    padding: 12,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDate: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  historyDuration: {
    fontSize: 13,
    fontWeight: '800',
  },
  historyQualityChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  historyQualityChipText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  historyNotes: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  emptyState: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.white08,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 30,
    marginBottom: 6,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});
