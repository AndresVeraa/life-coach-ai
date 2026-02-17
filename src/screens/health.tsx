import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useHealthStore } from '../features/health/health.store';

// --- Time helpers ---
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const MINUTES_QUICK = ['00', '15', '30', '45'];

function formatTime(t: string) {
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function timeDiffMinutes(target: string, actual: string): number {
  const [th, tm] = target.split(':').map(Number);
  const [ah, am] = actual.split(':').map(Number);
  return (ah * 60 + am) - (th * 60 + tm);
}

function formatDiff(diff: number): string {
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
  if (h > 0) return `${sign}${h}h ${m}m`;
  return `${sign}${m}m`;
}

function getISODate(d?: Date) {
  const date = d || new Date();
  return date.toISOString().split('T')[0];
}

// --- Colors ---
const MORNING = {
  bg: '#FFF7ED',
  card: '#FFFBF5',
  accent: '#F97316',
  accentLight: '#FED7AA',
  accentDark: '#C2410C',
  gradient2: '#FFEDD5',
  text: '#9A3412',
  textLight: '#EA580C',
};

const NIGHT = {
  bg: '#0F172A',
  card: '#1E293B',
  accent: '#6366F1',
  accentLight: '#818CF8',
  accentDark: '#4338CA',
  gradient2: '#0F172A',
  text: '#E2E8F0',
  textLight: '#94A3B8',
};

// Responsive helpers — damped scaling so it doesn't inflate on wider phones
function rs(base: number, w: number) {
  // Only apply 30% of the difference from 375 to avoid bloated layouts
  const scale = 1 + (w / 375 - 1) * 0.3;
  return Math.round(base * Math.max(0.85, Math.min(1.12, scale)));
}

export default function Health() {
  const { width: W, height: H } = useWindowDimensions();
  const isSmall = W < 360;
  const isLarge = W > 420;

  const {
    targetWakeTime,
    targetBedTime,
    wakeAlarmEnabled,
    bedAlarmEnabled,
    setTargets,
    toggleAlarm,
    logAction,
    updateLog,
    getTodayLog,
    getWeekLogs,
    metrics,
    last7Days,
  } = useHealthStore();

  // --- UI State ---
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempWake, setTempWake] = useState(targetWakeTime);
  const [tempBed, setTempBed] = useState(targetBedTime);
  const [editingField, setEditingField] = useState<'wake' | 'bed' | null>(null);
  const [pickerHour, setPickerHour] = useState('07');
  const [pickerMinute, setPickerMinute] = useState('00');
  const [now, setNow] = useState(new Date());

  // --- Edit log state (for adjusting forgotten times) ---
  const [editLogOpen, setEditLogOpen] = useState(false);
  const [editLogType, setEditLogType] = useState<'wake' | 'bed'>('wake');
  const [editLogHour, setEditLogHour] = useState('07');
  const [editLogMinute, setEditLogMinute] = useState('00');

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const todayLog = getTodayLog();
  const weekLogs = getWeekLogs();
  const currentHour = now.getHours();
  const isNightMode = currentHour >= 20 || currentHour < 6;
  const theme = isNightMode ? NIGHT : MORNING;

  // --- Handlers ---
  const handleWake = useCallback(() => logAction('wake'), [logAction]);
  const handleSleep = useCallback(() => logAction('sleep'), [logAction]);

  // Open edit modal for adjusting a logged time
  const openEditLog = useCallback((type: 'wake' | 'bed') => {
    setEditLogType(type);
    const existing = type === 'wake' ? todayLog?.wakeTime : todayLog?.bedTime;
    if (existing) {
      const [h, m] = existing.split(':');
      setEditLogHour(h);
      setEditLogMinute(m);
    } else {
      const n = new Date();
      setEditLogHour(String(n.getHours()).padStart(2, '0'));
      setEditLogMinute(String(n.getMinutes()).padStart(2, '0'));
    }
    setEditLogOpen(true);
  }, [todayLog]);

  const confirmEditLog = useCallback(() => {
    const today = getISODate();
    const newTime = `${editLogHour}:${editLogMinute}`;
    const field = editLogType === 'wake' ? 'wakeTime' : 'bedTime';

    // If log exists, update it; otherwise log it first then update
    if (todayLog) {
      updateLog(today, field, newTime);
    } else {
      logAction(editLogType);
      // Slight delay to ensure log is created, then update
      setTimeout(() => updateLog(today, field, newTime), 50);
    }
    setEditLogOpen(false);
  }, [editLogHour, editLogMinute, editLogType, todayLog, updateLog, logAction]);

  // --- Settings modal ---
  const openSettings = useCallback(() => {
    setTempWake(targetWakeTime);
    setTempBed(targetBedTime);
    setEditingField(null);
    setSettingsOpen(true);
  }, [targetWakeTime, targetBedTime]);

  const saveSettings = useCallback(() => {
    setTargets(tempWake, tempBed);
    setSettingsOpen(false);
  }, [tempWake, tempBed, setTargets]);

  const openTimePicker = useCallback((field: 'wake' | 'bed') => {
    const time = field === 'wake' ? tempWake : tempBed;
    const [h, m] = time.split(':');
    setPickerHour(h);
    const mNum = parseInt(m, 10);
    const snapped = MINUTES_QUICK.reduce((prev, curr) =>
      Math.abs(parseInt(curr) - mNum) < Math.abs(parseInt(prev) - mNum) ? curr : prev
    );
    setPickerMinute(snapped);
    setEditingField(field);
  }, [tempWake, tempBed]);

  const confirmTimePick = useCallback(() => {
    const newTime = `${pickerHour}:${pickerMinute}`;
    if (editingField === 'wake') setTempWake(newTime);
    else setTempBed(newTime);
    setEditingField(null);
  }, [pickerHour, pickerMinute, editingField]);

  // --- Week summary ---
  const weekSummary = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];
      const log = weekLogs.find((l) => l.date === dateStr);
      result.push({ date: dateStr, day: dayName, log, isToday: i === 0 });
    }
    return result;
  }, [weekLogs, now]);

  // --- Responsive values ---
  const pad = rs(14, W);
  const cardPad = rs(12, W);
  const titleSize = rs(20, W);
  const cardTitleSize = rs(16, W);
  const gap = rs(8, W);
  const statW = (W - pad * 2 - gap) / 2;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isNightMode ? '#1E293B' : '#F97316', paddingHorizontal: pad, paddingTop: (StatusBar.currentHeight ?? 44) + rs(8, W), paddingBottom: rs(12, W) }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { fontSize: titleSize }]}>
              {isNightMode ? '🌙 Ritmo Circadiano' : '☀️ Ritmo Circadiano'}
            </Text>
            <Text style={[styles.headerSub, { color: isNightMode ? '#94A3B8' : '#FED7AA', fontSize: rs(13, W) }]}>
              {isNightMode ? 'Modo nocturno activo' : 'Modo diurno activo'}
            </Text>
          </View>
          <TouchableOpacity onPress={openSettings} style={[styles.gearBtn, { width: rs(38, W), height: rs(38, W), borderRadius: rs(19, W) }]}>
            <Text style={{ fontSize: rs(20, W) }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { padding: pad }]}>

        {/* === MORNING CARD === */}
        <View style={[styles.card, { backgroundColor: MORNING.card, borderColor: MORNING.accentLight, padding: cardPad }]}>
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: rs(24, W) }}>☀️</Text>
            <View style={{ marginLeft: rs(10, W), flex: 1 }}>
              <Text style={[styles.cardTitle, { color: MORNING.accentDark, fontSize: cardTitleSize }]}>Despertar</Text>
              <Text style={{ fontSize: rs(12, W), color: MORNING.textLight, marginTop: 1 }}>
                Meta: {formatTime(targetWakeTime)}
              </Text>
            </View>
            {wakeAlarmEnabled && (
              <View style={[styles.alarmBadge, { backgroundColor: MORNING.accentLight }]}>
                <Text style={{ fontSize: rs(11, W), color: MORNING.accentDark }}>🔔 Alarma</Text>
              </View>
            )}
          </View>

          {todayLog?.wakeTime ? (
            <View style={[styles.resultBox, { backgroundColor: MORNING.gradient2, padding: rs(10, W) }]}>
              <View style={styles.resultRow}>
                <View style={styles.resultCol}>
                  <Text style={[styles.resultLabel, { color: MORNING.textLight, fontSize: rs(11, W) }]}>Meta</Text>
                  <Text style={[styles.resultValue, { color: MORNING.accentDark, fontSize: rs(isSmall ? 14 : 16, W) }]}>
                    {formatTime(targetWakeTime)}
                  </Text>
                </View>
                <Text style={{ fontSize: rs(16, W), color: MORNING.accentDark }}>→</Text>
                <View style={styles.resultCol}>
                  <Text style={[styles.resultLabel, { color: MORNING.textLight, fontSize: rs(10, W) }]}>Real</Text>
                  <Text style={[styles.resultValue, { color: MORNING.accentDark, fontSize: rs(isSmall ? 14 : 16, W) }]}>
                    {formatTime(todayLog.wakeTime)}
                  </Text>
                </View>
                <View style={[
                  styles.diffBadge,
                  { backgroundColor: Math.abs(timeDiffMinutes(targetWakeTime, todayLog.wakeTime)) <= 15 ? '#DCFCE7' : '#FEF3C7' }
                ]}>
                  <Text style={{
                    fontSize: rs(12, W),
                    fontWeight: '700',
                    color: Math.abs(timeDiffMinutes(targetWakeTime, todayLog.wakeTime)) <= 15 ? '#166534' : '#92400E',
                  }}>
                    {formatDiff(timeDiffMinutes(targetWakeTime, todayLog.wakeTime))}
                  </Text>
                </View>
              </View>
              <View style={styles.registeredRow}>
                <Text style={{ fontSize: rs(14, W) }}>✅</Text>
                <Text style={[styles.registeredText, { color: MORNING.textLight, fontSize: rs(12, W) }]}>Registrado</Text>
                <TouchableOpacity onPress={() => openEditLog('wake')} style={styles.editBtn}>
                  <Text style={{ fontSize: rs(12, W), color: MORNING.accent }}>✏️ Ajustar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <TouchableOpacity
                onPress={handleWake}
                style={[styles.actionBtn, { backgroundColor: MORNING.accent, paddingVertical: rs(13, W) }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionBtnIcon, { fontSize: rs(18, W) }]}>🌅</Text>
                <Text style={[styles.actionBtnText, { fontSize: rs(15, W) }]}>¡Ya desperté!</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEditLog('wake')} style={styles.forgotBtn}>
                <Text style={{ fontSize: rs(12, W), color: MORNING.textLight }}>
                  🕐 ¿Se te olvidó? Registra la hora manualmente
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* === NIGHT CARD === */}
        <View style={[styles.card, { backgroundColor: NIGHT.card, borderColor: NIGHT.accent, padding: cardPad }]}>
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: rs(24, W) }}>🌙</Text>
            <View style={{ marginLeft: rs(10, W), flex: 1 }}>
              <Text style={[styles.cardTitle, { color: NIGHT.text, fontSize: cardTitleSize }]}>Ir a Dormir</Text>
              <Text style={{ fontSize: rs(12, W), color: NIGHT.textLight, marginTop: 1 }}>
                Meta: {formatTime(targetBedTime)}
              </Text>
            </View>
            {bedAlarmEnabled && (
              <View style={[styles.alarmBadge, { backgroundColor: '#312E81' }]}>
                <Text style={{ fontSize: rs(11, W), color: NIGHT.accentLight }}>🔔 Alarma</Text>
              </View>
            )}
          </View>

          {todayLog?.bedTime ? (
            <View style={[styles.resultBox, { backgroundColor: NIGHT.gradient2, padding: rs(10, W) }]}>
              <View style={styles.resultRow}>
                <View style={styles.resultCol}>
                  <Text style={[styles.resultLabel, { color: NIGHT.textLight, fontSize: rs(11, W) }]}>Meta</Text>
                  <Text style={[styles.resultValue, { color: NIGHT.text, fontSize: rs(isSmall ? 14 : 16, W) }]}>
                    {formatTime(targetBedTime)}
                  </Text>
                </View>
                <Text style={{ fontSize: rs(16, W), color: NIGHT.accentLight }}>→</Text>
                <View style={styles.resultCol}>
                  <Text style={[styles.resultLabel, { color: NIGHT.textLight, fontSize: rs(10, W) }]}>Real</Text>
                  <Text style={[styles.resultValue, { color: NIGHT.text, fontSize: rs(isSmall ? 14 : 16, W) }]}>
                    {formatTime(todayLog.bedTime)}
                  </Text>
                </View>
                <View style={[
                  styles.diffBadge,
                  { backgroundColor: Math.abs(timeDiffMinutes(targetBedTime, todayLog.bedTime)) <= 15 ? '#166534' : '#78350F' }
                ]}>
                  <Text style={{ fontSize: rs(12, W), fontWeight: '700', color: '#FFF' }}>
                    {formatDiff(timeDiffMinutes(targetBedTime, todayLog.bedTime))}
                  </Text>
                </View>
              </View>
              <View style={styles.registeredRow}>
                <Text style={{ fontSize: rs(14, W) }}>✅</Text>
                <Text style={[styles.registeredText, { color: NIGHT.textLight, fontSize: rs(12, W) }]}>Registrado</Text>
                <TouchableOpacity onPress={() => openEditLog('bed')} style={styles.editBtn}>
                  <Text style={{ fontSize: rs(12, W), color: NIGHT.accentLight }}>✏️ Ajustar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <TouchableOpacity
                onPress={handleSleep}
                style={[styles.actionBtn, { backgroundColor: NIGHT.accent, paddingVertical: rs(13, W) }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionBtnIcon, { fontSize: rs(18, W) }]}>🛏️</Text>
                <Text style={[styles.actionBtnText, { fontSize: rs(15, W) }]}>Ir a la cama</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEditLog('bed')} style={styles.forgotBtn}>
                <Text style={{ fontSize: rs(12, W), color: NIGHT.textLight }}>
                  🕐 ¿Se te olvidó? Registra la hora manualmente
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* === WEEK OVERVIEW === */}
        <View style={[styles.card, { backgroundColor: isNightMode ? '#1E293B' : '#FFFFFF', borderColor: isNightMode ? '#334155' : '#E5E7EB', padding: cardPad }]}>
          <Text style={[styles.sectionTitle, { color: isNightMode ? '#E2E8F0' : '#1F2937', fontSize: rs(14, W) }]}>
            📊 Última Semana
          </Text>
          <View style={styles.weekRow}>
            {weekSummary.map((day) => {
              const hasWake = !!day.log?.wakeTime;
              const hasBed = !!day.log?.bedTime;
              const complete = hasWake && hasBed;
              const dotSize = rs(28, W);
              return (
                <View
                  key={day.date}
                  style={[
                    styles.weekDay,
                    day.isToday && { borderColor: isNightMode ? NIGHT.accent : MORNING.accent, borderWidth: 2 },
                  ]}
                >
                  <Text style={{ fontSize: rs(10, W), fontWeight: '600', color: isNightMode ? '#94A3B8' : '#6B7280', marginBottom: rs(3, W) }}>
                    {day.day}
                  </Text>
                  <View style={[
                    styles.weekDot,
                    {
                      width: dotSize, height: dotSize, borderRadius: dotSize / 2,
                      backgroundColor: complete
                        ? '#10B981'
                        : hasWake || hasBed
                          ? '#F59E0B'
                          : isNightMode ? '#334155' : '#E5E7EB',
                    },
                  ]}>
                    <Text style={{ fontSize: rs(9, W), color: '#FFF' }}>
                      {complete ? '✓' : hasWake ? '☀' : hasBed ? '🌙' : ''}
                    </Text>
                  </View>
                  {hasWake && (
                    <Text style={{ fontSize: rs(8, W), fontWeight: '600', color: MORNING.accent }}>
                      {day.log!.wakeTime!.slice(0, 5)}
                    </Text>
                  )}
                  {hasBed && (
                    <Text style={{ fontSize: rs(8, W), fontWeight: '600', color: NIGHT.accentLight }}>
                      {day.log!.bedTime!.slice(0, 5)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* === SLEEP METRICS === */}
        <View style={[styles.card, { backgroundColor: isNightMode ? '#1E293B' : '#FFFFFF', borderColor: isNightMode ? '#334155' : '#E5E7EB', padding: cardPad }]}>
          <Text style={[styles.sectionTitle, { color: isNightMode ? '#E2E8F0' : '#1F2937', fontSize: rs(14, W) }]}>
            📈 Estadísticas de Sueño
          </Text>
          <View style={[styles.statsGrid, { gap: gap }]}>
            {[
              { icon: '😴', value: `${metrics.averageSleep || '—'}h`, label: 'Prom. Sueño', bg: isNightMode ? '#0F172A' : '#F0FDF4', color: isNightMode ? '#E2E8F0' : '#166534' },
              { icon: '🔥', value: `${metrics.consecutiveDays || 0}`, label: 'Días Seguidos', bg: isNightMode ? '#0F172A' : '#EFF6FF', color: isNightMode ? '#E2E8F0' : '#1E40AF' },
              { icon: '⭐', value: `${metrics.bestDay || '—'}/5`, label: 'Mejor Calidad', bg: isNightMode ? '#0F172A' : '#FFFBEB', color: isNightMode ? '#E2E8F0' : '#92400E' },
              { icon: '📅', value: `${metrics.totalRecordsMonth || 0}`, label: 'Este Mes', bg: isNightMode ? '#0F172A' : '#FEF2F2', color: isNightMode ? '#E2E8F0' : '#991B1B' },
            ].map((stat, i) => (
              <View key={i} style={[styles.statBox, { width: statW, backgroundColor: stat.bg, padding: rs(10, W) }]}>
                <Text style={{ fontSize: rs(18, W) }}>{stat.icon}</Text>
                <Text style={[styles.statValue, { color: stat.color, fontSize: rs(16, W) }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: isNightMode ? '#94A3B8' : '#6B7280', fontSize: rs(10, W) }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* === LAST 7 DAYS BAR CHART === */}
        {last7Days.length > 0 && last7Days.some((d) => d.hours > 0) && (
          <View style={[styles.card, { backgroundColor: isNightMode ? '#1E293B' : '#FFFFFF', borderColor: isNightMode ? '#334155' : '#E5E7EB', padding: cardPad }]}>
            <Text style={[styles.sectionTitle, { color: isNightMode ? '#E2E8F0' : '#1F2937', fontSize: rs(14, W) }]}>
              🛏️ Horas de Sueño (7 días)
            </Text>
            <View style={[styles.chartRow, { height: rs(100, W) }]}>
              {last7Days.map((day, idx) => {
                const maxH = 12;
                const barH = Math.max(rs(4, W), (day.hours / maxH) * rs(100, W));
                const good = day.hours >= 7;
                return (
                  <View key={idx} style={styles.chartCol}>
                    <Text style={{ fontSize: rs(9, W), fontWeight: '600', color: isNightMode ? '#94A3B8' : '#6B7280', marginBottom: rs(4, W) }}>
                      {day.hours > 0 ? day.hours : ''}
                    </Text>
                    <View style={[styles.chartBar, { height: barH, backgroundColor: good ? '#10B981' : '#F59E0B', width: rs(18, W) }]} />
                    <Text style={{ fontSize: rs(9, W), color: isNightMode ? '#64748B' : '#9CA3AF', marginTop: rs(4, W) }}>
                      {new Date(day.date).toLocaleDateString('es', { weekday: 'short' }).slice(0, 2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* === TIP === */}
        <View style={[styles.card, { backgroundColor: isNightMode ? '#1E293B' : '#FFFBEB', borderColor: isNightMode ? '#334155' : '#FDE68A', padding: cardPad }]}>
          <Text style={{ fontSize: rs(13, W), fontWeight: '600', color: isNightMode ? '#FDE68A' : '#92400E' }}>
            💡 Consejo Circadiano
          </Text>
          <Text style={{ fontSize: rs(12, W), color: isNightMode ? '#CBD5E1' : '#78350F', marginTop: rs(4, W), lineHeight: rs(17, W) }}>
            La consistencia importa más que la duración. Intenta despertar y dormir a la misma hora cada día, incluso los fines de semana.
          </Text>
        </View>

        <View style={{ height: rs(20, W) }} />
      </ScrollView>

      {/* ===== EDIT LOG MODAL (Ajustar hora olvidada) ===== */}
      <Modal visible={editLogOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isNightMode ? '#1E293B' : '#FFFFFF', padding: rs(16, W), paddingBottom: rs(28, W) }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isNightMode ? '#E2E8F0' : '#1F2937', fontSize: rs(18, W) }]}>
                {editLogType === 'wake' ? '☀️ Ajustar Despertar' : '🌙 Ajustar Hora de Dormir'}
              </Text>
              <TouchableOpacity onPress={() => setEditLogOpen(false)}>
                <Text style={{ fontSize: rs(22, W), color: isNightMode ? '#94A3B8' : '#6B7280' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: rs(13, W), color: isNightMode ? '#94A3B8' : '#6B7280', marginBottom: rs(16, W), lineHeight: rs(18, W) }}>
              {editLogType === 'wake'
                ? '¿A qué hora te despertaste realmente?'
                : '¿A qué hora te fuiste a dormir realmente?'}
            </Text>

            {/* Hour */}
            <Text style={{ fontSize: rs(12, W), fontWeight: '600', color: isNightMode ? '#94A3B8' : '#6B7280', marginBottom: rs(8, W) }}>
              Hora
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: rs(50, W), marginBottom: rs(12, W) }}>
              <View style={[styles.pickerRow, { gap: rs(6, W) }]}>
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setEditLogHour(h)}
                    style={[
                      styles.pickerChip,
                      {
                        paddingHorizontal: rs(12, W), paddingVertical: rs(10, W), borderRadius: rs(10, W),
                        backgroundColor: editLogHour === h
                          ? (editLogType === 'wake' ? MORNING.accent : NIGHT.accent)
                          : (isNightMode ? '#0F172A' : '#F3F4F6'),
                      },
                    ]}
                  >
                    <Text style={{
                      color: editLogHour === h ? '#FFF' : (isNightMode ? '#94A3B8' : '#374151'),
                      fontWeight: editLogHour === h ? '700' : '500',
                      fontSize: rs(14, W),
                    }}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Minutes (all 5-min increments for precision) */}
            <Text style={{ fontSize: rs(12, W), fontWeight: '600', color: isNightMode ? '#94A3B8' : '#6B7280', marginBottom: rs(8, W) }}>
              Minutos
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: rs(50, W), marginBottom: rs(8, W) }}>
              <View style={[styles.pickerRow, { gap: rs(6, W) }]}>
                {MINUTES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setEditLogMinute(m)}
                    style={[
                      styles.pickerChip,
                      {
                        paddingHorizontal: rs(14, W), paddingVertical: rs(10, W), borderRadius: rs(10, W),
                        backgroundColor: editLogMinute === m
                          ? (editLogType === 'wake' ? MORNING.accent : NIGHT.accent)
                          : (isNightMode ? '#0F172A' : '#F3F4F6'),
                      },
                    ]}
                  >
                    <Text style={{
                      color: editLogMinute === m ? '#FFF' : (isNightMode ? '#94A3B8' : '#374151'),
                      fontWeight: editLogMinute === m ? '700' : '500',
                      fontSize: rs(14, W),
                    }}>:{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Preview */}
            <View style={[styles.previewBox, { backgroundColor: isNightMode ? '#0F172A' : '#F9FAFB', padding: rs(14, W), marginTop: rs(12, W) }]}>
              <Text style={{ fontSize: rs(26, W), fontWeight: '800', color: isNightMode ? '#E2E8F0' : '#1F2937' }}>
                {formatTime(`${editLogHour}:${editLogMinute}`)}
              </Text>
            </View>

            {/* Confirm / Cancel */}
            <View style={[styles.pickerActions, { marginTop: rs(16, W), gap: rs(12, W) }]}>
              <TouchableOpacity
                onPress={() => setEditLogOpen(false)}
                style={[styles.pickerBackBtn, { borderColor: isNightMode ? '#475569' : '#D1D5DB', paddingVertical: rs(12, W) }]}
              >
                <Text style={{ color: isNightMode ? '#94A3B8' : '#6B7280', fontWeight: '600', fontSize: rs(14, W) }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmEditLog}
                style={[styles.pickerConfirmBtn, { backgroundColor: editLogType === 'wake' ? MORNING.accent : NIGHT.accent, paddingVertical: rs(12, W) }]}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: rs(14, W) }}>✓ Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== SETTINGS MODAL ===== */}
      <Modal visible={settingsOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isNightMode ? '#1E293B' : '#FFFFFF', padding: rs(16, W), paddingBottom: rs(28, W) }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isNightMode ? '#E2E8F0' : '#1F2937', fontSize: rs(18, W) }]}>
                ⚙️ Configurar Alarmas
              </Text>
              <TouchableOpacity onPress={() => { setSettingsOpen(false); setEditingField(null); }}>
                <Text style={{ fontSize: rs(22, W), color: isNightMode ? '#94A3B8' : '#6B7280' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {editingField === null ? (
              <View>
                {/* Wake setting */}
                <View style={[styles.settingRow, { borderBottomColor: isNightMode ? '#334155' : '#F3F4F6', paddingVertical: rs(12, W) }]}>
                  <View style={styles.settingLeft}>
                    <Text style={{ fontSize: rs(22, W) }}>☀️</Text>
                    <View style={{ marginLeft: rs(10, W) }}>
                      <Text style={{ fontSize: rs(14, W), fontWeight: '700', color: isNightMode ? '#E2E8F0' : '#1F2937' }}>
                        Despertar
                      </Text>
                      <TouchableOpacity onPress={() => openTimePicker('wake')}>
                        <Text style={{ fontSize: rs(15, W), fontWeight: '600', marginTop: 2, color: MORNING.accent }}>
                          {formatTime(tempWake)} ✏️
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.settingRight}>
                    <Text style={{ fontSize: rs(11, W), marginBottom: 4, color: isNightMode ? '#94A3B8' : '#6B7280' }}>Alarma</Text>
                    <Switch
                      value={wakeAlarmEnabled}
                      onValueChange={() => toggleAlarm('wake')}
                      trackColor={{ false: '#D1D5DB', true: MORNING.accentLight }}
                      thumbColor={wakeAlarmEnabled ? MORNING.accent : '#F3F4F6'}
                    />
                  </View>
                </View>

                {/* Bed setting */}
                <View style={[styles.settingRow, { borderBottomColor: 'transparent', paddingVertical: rs(12, W) }]}>
                  <View style={styles.settingLeft}>
                    <Text style={{ fontSize: rs(22, W) }}>🌙</Text>
                    <View style={{ marginLeft: rs(10, W) }}>
                      <Text style={{ fontSize: rs(14, W), fontWeight: '700', color: isNightMode ? '#E2E8F0' : '#1F2937' }}>
                        Ir a dormir
                      </Text>
                      <TouchableOpacity onPress={() => openTimePicker('bed')}>
                        <Text style={{ fontSize: rs(15, W), fontWeight: '600', marginTop: 2, color: NIGHT.accentLight }}>
                          {formatTime(tempBed)} ✏️
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.settingRight}>
                    <Text style={{ fontSize: rs(11, W), marginBottom: 4, color: isNightMode ? '#94A3B8' : '#6B7280' }}>Alarma</Text>
                    <Switch
                      value={bedAlarmEnabled}
                      onValueChange={() => toggleAlarm('bed')}
                      trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
                      thumbColor={bedAlarmEnabled ? NIGHT.accent : '#F3F4F6'}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={saveSettings}
                  style={[styles.saveBtn, { backgroundColor: isNightMode ? NIGHT.accent : MORNING.accent, marginTop: rs(16, W), paddingVertical: rs(12, W) }]}
                >
                  <Text style={[styles.saveBtnText, { fontSize: rs(14, W) }]}>💾 Guardar Cambios</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: rs(16, W), fontWeight: '700', textAlign: 'center', marginBottom: rs(12, W), color: isNightMode ? '#E2E8F0' : '#1F2937' }}>
                  {editingField === 'wake' ? '☀️ Hora de Despertar' : '🌙 Hora de Dormir'}
                </Text>

                <Text style={{ fontSize: rs(12, W), fontWeight: '600', marginBottom: rs(8, W), color: isNightMode ? '#94A3B8' : '#6B7280' }}>Hora</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: rs(50, W), marginBottom: rs(4, W) }}>
                  <View style={[styles.pickerRow, { gap: rs(8, W) }]}>
                    {HOURS.map((h) => (
                      <TouchableOpacity
                        key={h}
                        onPress={() => setPickerHour(h)}
                        style={[
                          styles.pickerChip,
                          {
                            paddingHorizontal: rs(14, W), paddingVertical: rs(10, W), borderRadius: rs(10, W),
                            backgroundColor: pickerHour === h
                              ? (editingField === 'wake' ? MORNING.accent : NIGHT.accent)
                              : (isNightMode ? '#0F172A' : '#F3F4F6'),
                          },
                        ]}
                      >
                        <Text style={{
                          color: pickerHour === h ? '#FFF' : (isNightMode ? '#94A3B8' : '#374151'),
                          fontWeight: pickerHour === h ? '700' : '500',
                          fontSize: rs(15, W),
                        }}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={{ fontSize: rs(12, W), fontWeight: '600', marginBottom: rs(8, W), marginTop: rs(16, W), color: isNightMode ? '#94A3B8' : '#6B7280' }}>
                  Minutos
                </Text>
                <View style={[styles.minuteRow, { gap: rs(10, W) }]}>
                  {MINUTES_QUICK.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setPickerMinute(m)}
                      style={{
                        paddingHorizontal: rs(20, W), paddingVertical: rs(12, W), borderRadius: rs(12, W),
                        backgroundColor: pickerMinute === m
                          ? (editingField === 'wake' ? MORNING.accent : NIGHT.accent)
                          : (isNightMode ? '#0F172A' : '#F3F4F6'),
                      }}
                    >
                      <Text style={{
                        color: pickerMinute === m ? '#FFF' : (isNightMode ? '#94A3B8' : '#374151'),
                        fontWeight: pickerMinute === m ? '700' : '500',
                        fontSize: rs(16, W),
                      }}>:{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[styles.previewBox, { backgroundColor: isNightMode ? '#0F172A' : '#F9FAFB', padding: rs(12, W), marginTop: rs(14, W) }]}>
                  <Text style={{ fontSize: rs(24, W), fontWeight: '800', color: isNightMode ? '#E2E8F0' : '#1F2937' }}>
                    {formatTime(`${pickerHour}:${pickerMinute}`)}
                  </Text>
                </View>

                <View style={[styles.pickerActions, { marginTop: rs(14, W), gap: rs(10, W) }]}>
                  <TouchableOpacity
                    onPress={() => setEditingField(null)}
                    style={[styles.pickerBackBtn, { borderColor: isNightMode ? '#475569' : '#D1D5DB', paddingVertical: rs(12, W) }]}
                  >
                    <Text style={{ color: isNightMode ? '#94A3B8' : '#6B7280', fontWeight: '600', fontSize: rs(14, W) }}>← Atrás</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmTimePick}
                    style={[styles.pickerConfirmBtn, { backgroundColor: editingField === 'wake' ? MORNING.accent : NIGHT.accent, paddingVertical: rs(12, W) }]}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: rs(14, W) }}>✓ Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontWeight: 'bold', color: '#FFF' },
  headerSub: { marginTop: 2 },
  gearBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {},

  // Cards
  card: {
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontWeight: '700' },
  alarmBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // Result box
  resultBox: { borderRadius: 12 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCol: { alignItems: 'center', flex: 1 },
  resultLabel: { fontWeight: '600', marginBottom: 2 },
  resultValue: { fontWeight: '800' },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  registeredRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 8 },
  registeredText: { fontWeight: '600' },
  editBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  forgotBtn: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 6,
  },

  // Action button
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 10,
  },
  actionBtnIcon: {},
  actionBtnText: { color: '#FFF', fontWeight: '800' },

  // Section
  sectionTitle: { fontWeight: '700', marginBottom: 10 },

  // Week
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', flex: 1, paddingVertical: 4, borderRadius: 10 },
  weekDot: { alignItems: 'center', justifyContent: 'center', marginBottom: 3 },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statBox: {
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: { fontWeight: '800', marginTop: 4 },
  statLabel: { marginTop: 2 },

  // Chart
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartCol: { alignItems: 'center', flex: 1 },
  chartBar: { borderRadius: 6 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontWeight: '800' },

  // Settings rows
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingRight: { alignItems: 'center' },

  // Save button
  saveBtn: {
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFF', fontWeight: '800' },

  // Time Picker
  pickerRow: { flexDirection: 'row' },
  pickerChip: {},
  minuteRow: { flexDirection: 'row', justifyContent: 'center' },
  previewBox: {
    borderRadius: 12,
    alignItems: 'center',
  },
  pickerActions: {
    flexDirection: 'row',
  },
  pickerBackBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  pickerConfirmBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
});
