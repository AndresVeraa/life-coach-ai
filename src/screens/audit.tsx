import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
  Vibration,
} from 'react-native';
import { useAuditStore } from '../features/audit/audit.store';
import {
  DistractionCategory,
  DISTRACTION_CATEGORIES,
  FOCUS_CATEGORIES,
  AuditEntry,
} from '../features/audit/types';

// ── Helpers ──
function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Colors ──
const COLORS = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  primary: '#F59E0B',
  primaryDark: '#D97706',
  primaryLight: '#FEF3C7',
  accent: '#4F46E5',
  accentLight: '#EEF2FF',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  success: '#10B981',
  successLight: '#ECFDF5',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

type TimeRange = 'day' | 'week' | 'month';

// ── Distraction time presets ──
const TIME_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export default function Audit() {
  const { width: W } = useWindowDimensions();
  const { addEntry, getStats, getEntries, clearHistory } = useAuditStore();

  // ── State ──
  const [range, setRange] = useState<TimeRange>('day');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [focusCategory, setFocusCategory] = useState('Estudio');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Distraction modal
  const [showDistractionModal, setShowDistractionModal] = useState(false);
  const [selectedDistractionCat, setSelectedDistractionCat] = useState<DistractionCategory>('redes-sociales');
  const [distractionMinutes, setDistractionMinutes] = useState(15);
  const [distractionNote, setDistractionNote] = useState('');

  // Focus category picker
  const [showFocusPicker, setShowFocusPicker] = useState(false);

  // History
  const [showHistory, setShowHistory] = useState(false);

  // ── Stats ──
  const stats = useMemo(() => getStats(range), [range, getStats]);
  const entries = useMemo(() => getEntries(range), [range, getEntries]);

  // ── Timer logic ──
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const startTimer = useCallback(() => {
    setTimerSeconds(0);
    setTimerRunning(true);
  }, []);

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
    const minutes = Math.max(1, Math.round(timerSeconds / 60));
    addEntry({
      timestamp: Date.now(),
      type: 'focus',
      durationMinutes: minutes,
      category: focusCategory,
    });
    Vibration.vibrate(200);
    Alert.alert(
      '🎯 Sesión Registrada',
      `${formatMinutes(minutes)} de ${focusCategory} añadidos a tu score.`,
      [{ text: 'OK' }]
    );
    setTimerSeconds(0);
  }, [timerSeconds, focusCategory, addEntry]);

  const cancelTimer = useCallback(() => {
    setTimerRunning(false);
    setTimerSeconds(0);
  }, []);

  // ── Distraction handler ──
  const submitDistraction = useCallback(() => {
    const catConfig = DISTRACTION_CATEGORIES[selectedDistractionCat];
    addEntry({
      timestamp: Date.now(),
      type: 'distraction',
      durationMinutes: distractionMinutes,
      category: catConfig.label,
      note: distractionNote || undefined,
    });
    setShowDistractionModal(false);
    setDistractionNote('');
    setDistractionMinutes(15);
    Vibration.vibrate(100);
  }, [selectedDistractionCat, distractionMinutes, distractionNote, addEntry]);

  // ── Distraction radar ──
  const distractionRadar = useMemo(() => {
    const distractions = entries.filter((e) => e.type === 'distraction');
    const grouped: Record<string, number> = {};
    distractions.forEach((d) => {
      grouped[d.category] = (grouped[d.category] || 0) + d.durationMinutes;
    });
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [entries]);

  // Score color
  const scoreColor = stats.score >= 70 ? COLORS.success : stats.score >= 40 ? COLORS.primary : COLORS.danger;
  const scoreBg = stats.score >= 70 ? COLORS.successLight : stats.score >= 40 ? COLORS.primaryLight : COLORS.dangerLight;

  const pad = 14;
  const sbH = StatusBar.currentHeight ?? 44;

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingHorizontal: pad, paddingTop: sbH + 8, paddingBottom: 12 }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>📊 Centro de Analítica</Text>
            <Text style={styles.headerSub}>Tu productividad en tiempo real</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowHistory(true)}
            style={styles.historyBtn}
          >
            <Text style={{ fontSize: 18 }}>📋</Text>
          </TouchableOpacity>
        </View>

        {/* ── Range tabs ── */}
        <View style={styles.rangeTabs}>
          {(['day', 'week', 'month'] as TimeRange[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              style={[
                styles.rangeTab,
                range === r && styles.rangeTabActive,
              ]}
            >
              <Text style={[
                styles.rangeTabText,
                range === r && styles.rangeTabTextActive,
              ]}>
                {r === 'day' ? 'Hoy' : r === 'week' ? 'Semana' : 'Mes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: pad, paddingBottom: 30 }}>

        {/* ══ PRODUCTIVITY SCORE ══ */}
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 20 }]}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 }}>
            ⚡ Productivity Score
          </Text>
          <View style={[styles.scoreBadge, { backgroundColor: scoreBg }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>{stats.score}</Text>
          </View>
          <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 6 }}>
            {stats.score >= 80 ? '🔥 ¡Imparable!' :
             stats.score >= 60 ? '💪 Vas bien' :
             stats.score >= 40 ? '⚠️ Puedes mejorar' : '🚨 ¡Modo alerta!'}
          </Text>

          {/* Mini stats */}
          <View style={styles.miniStatsRow}>
            <View style={[styles.miniStat, { backgroundColor: COLORS.successLight }]}>
              <Text style={{ fontSize: 14 }}>🎯</Text>
              <Text style={[styles.miniStatValue, { color: COLORS.success }]}>{formatMinutes(stats.focusTime)}</Text>
              <Text style={styles.miniStatLabel}>Enfoque</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: COLORS.dangerLight }]}>
              <Text style={{ fontSize: 14 }}>💀</Text>
              <Text style={[styles.miniStatValue, { color: COLORS.danger }]}>{formatMinutes(stats.lostTime)}</Text>
              <Text style={styles.miniStatLabel}>Perdido</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: COLORS.accentLight }]}>
              <Text style={{ fontSize: 14 }}>📊</Text>
              <Text style={[styles.miniStatValue, { color: COLORS.accent }]}>{stats.sessionCount}</Text>
              <Text style={styles.miniStatLabel}>Sesiones</Text>
            </View>
          </View>
        </View>

        {/* ══ FOCUS TIMER ══ */}
        <View style={[styles.card, { alignItems: 'center' }]}>
          <Text style={styles.sectionTitle}>🧠 Modo Enfoque</Text>

          {/* Focus category */}
          <TouchableOpacity
            onPress={() => !timerRunning && setShowFocusPicker(true)}
            style={styles.focusCatBtn}
          >
            <Text style={{ fontSize: 13, color: COLORS.accent, fontWeight: '600' }}>
              {FOCUS_CATEGORIES.find((c) => c.label === focusCategory)?.emoji || '📚'} {focusCategory} ▾
            </Text>
          </TouchableOpacity>

          {/* Timer display */}
          <View style={[styles.timerCircle, { borderColor: timerRunning ? COLORS.success : COLORS.border }]}>
            <Text style={[styles.timerText, { color: timerRunning ? COLORS.success : COLORS.text }]}>
              {formatTimer(timerSeconds)}
            </Text>
            {timerRunning && (
              <Text style={{ fontSize: 10, color: COLORS.success, marginTop: 2 }}>
                ● EN SESIÓN
              </Text>
            )}
          </View>

          {/* Timer buttons */}
          {!timerRunning ? (
            <TouchableOpacity onPress={startTimer} style={styles.startBtn} activeOpacity={0.8}>
              <Text style={styles.startBtnText}>▶ Iniciar Timer</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.timerActions}>
              <TouchableOpacity onPress={stopTimer} style={styles.stopBtn} activeOpacity={0.8}>
                <Text style={styles.stopBtnText}>⏹ Terminar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelTimer} style={styles.cancelBtn} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>✕ Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ══ QUICK DISTRACTION ══ */}
        <TouchableOpacity
          onPress={() => setShowDistractionModal(true)}
          style={styles.distractionBtn}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>🚨</Text>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.distractionBtnTitle}>Registrar Distracción</Text>
            <Text style={styles.distractionBtnSub}>Perdí tiempo en algo...</Text>
          </View>
          <Text style={{ fontSize: 16, color: COLORS.danger }}>+</Text>
        </TouchableOpacity>

        {/* ══ DISTRACTION RADAR ══ */}
        {distractionRadar.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🔍 Ladrones de Tiempo</Text>
            <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 10 }}>
              Tu mayor enemigo: <Text style={{ fontWeight: '700', color: COLORS.danger }}>{stats.topDistraction}</Text>
            </Text>
            {distractionRadar.map(([cat, mins], idx) => {
              const maxMins = distractionRadar[0][1];
              const pct = maxMins > 0 ? (mins / maxMins) * 100 : 0;
              // Find matching category config
              const catKey = Object.keys(DISTRACTION_CATEGORIES).find(
                (k) => DISTRACTION_CATEGORIES[k as DistractionCategory].label === cat
              ) as DistractionCategory | undefined;
              const config = catKey ? DISTRACTION_CATEGORIES[catKey] : null;

              return (
                <View key={cat} style={styles.radarItem}>
                  <View style={styles.radarLabel}>
                    <Text style={{ fontSize: 16 }}>{config?.emoji || '❓'}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.text, marginLeft: 8, flex: 1 }}>{cat}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.danger }}>{formatMinutes(mins)}</Text>
                  </View>
                  <View style={styles.radarBarBg}>
                    <View
                      style={[
                        styles.radarBarFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: config?.color || COLORS.danger,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ══ RECENT ACTIVITY ══ */}
        {entries.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🕐 Actividad Reciente</Text>
            {entries.slice(0, 6).map((entry) => (
              <View key={entry.id} style={styles.activityItem}>
                <View style={[
                  styles.activityDot,
                  { backgroundColor: entry.type === 'focus' ? COLORS.success : COLORS.danger },
                ]} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.text }}>
                    {entry.type === 'focus' ? '🎯' : '💀'} {entry.category}
                  </Text>
                  {entry.note ? (
                    <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>{entry.note}</Text>
                  ) : null}
                </View>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: entry.type === 'focus' ? COLORS.success : COLORS.danger,
                }}>
                  {entry.type === 'focus' ? '+' : '-'}{formatMinutes(entry.durationMinutes)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ══ TIP ══ */}
        <View style={[styles.card, { backgroundColor: COLORS.primaryLight, borderColor: '#FDE68A' }]}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400E' }}>💡 Insight</Text>
          <Text style={{ fontSize: 12, color: '#78350F', marginTop: 4, lineHeight: 17 }}>
            {stats.score >= 70
              ? 'Estás en la zona. Cada sesión de enfoque te acerca a tu mejor versión.'
              : stats.lostTime > stats.focusTime
              ? `"${stats.topDistraction}" te está costando más tiempo del que crees. Intenta bloquearlo 1 hora.`
              : 'Registra más sesiones de enfoque para subir tu score. ¡Cada minuto cuenta!'}
          </Text>
        </View>
      </ScrollView>

      {/* ══════ DISTRACTION MODAL ══════ */}
      <Modal visible={showDistractionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚨 Registrar Distracción</Text>
              <TouchableOpacity onPress={() => setShowDistractionModal(false)}>
                <Text style={{ fontSize: 20, color: COLORS.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>¿Qué te distrajo?</Text>
            <View style={styles.catGrid}>
              {(Object.keys(DISTRACTION_CATEGORIES) as DistractionCategory[]).map((key) => {
                const cat = DISTRACTION_CATEGORIES[key];
                const selected = selectedDistractionCat === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setSelectedDistractionCat(key)}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: selected ? cat.color : cat.bg,
                        borderColor: selected ? cat.color : COLORS.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                    <Text style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color: selected ? '#FFF' : cat.color,
                      marginTop: 2,
                    }}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>¿Cuánto tiempo perdiste?</Text>
            <View style={styles.timePresets}>
              {TIME_PRESETS.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setDistractionMinutes(t)}
                  style={[
                    styles.timeChip,
                    distractionMinutes === t && { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
                  ]}
                >
                  <Text style={[
                    styles.timeChipText,
                    distractionMinutes === t && { color: '#FFF' },
                  ]}>
                    {formatMinutes(t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Nota (opcional)</Text>
            <TextInput
              value={distractionNote}
              onChangeText={setDistractionNote}
              placeholder="Ej: Scrolleando Instagram..."
              placeholderTextColor="#9CA3AF"
              style={styles.noteInput}
            />

            <TouchableOpacity onPress={submitDistraction} style={styles.submitBtn} activeOpacity={0.8}>
              <Text style={styles.submitBtnText}>
                💀 Registrar -{formatMinutes(distractionMinutes)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════ FOCUS CATEGORY PICKER ══════ */}
      <Modal visible={showFocusPicker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🧠 ¿En qué te vas a enfocar?</Text>
              <TouchableOpacity onPress={() => setShowFocusPicker(false)}>
                <Text style={{ fontSize: 20, color: COLORS.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>
            {FOCUS_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                onPress={() => {
                  setFocusCategory(cat.label);
                  setShowFocusPicker(false);
                }}
                style={[
                  styles.focusPickItem,
                  focusCategory === cat.label && { backgroundColor: COLORS.accentLight },
                ]}
              >
                <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginLeft: 12 }}>
                  {cat.label}
                </Text>
                {focusCategory === cat.label && (
                  <Text style={{ marginLeft: 'auto', color: COLORS.accent, fontWeight: '700' }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ══════ HISTORY MODAL ══════ */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Historial</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Text style={{ fontSize: 20, color: COLORS.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {entries.length === 0 ? (
                <Text style={{ textAlign: 'center', color: COLORS.textSecondary, marginVertical: 30, fontSize: 13 }}>
                  No hay registros en este período
                </Text>
              ) : (
                entries.map((entry) => (
                  <View key={entry.id} style={styles.historyItem}>
                    <View style={[
                      styles.historyDot,
                      { backgroundColor: entry.type === 'focus' ? COLORS.success : COLORS.danger },
                    ]} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text }}>
                        {entry.type === 'focus' ? '🎯 Enfoque' : '💀 Distracción'}: {entry.category}
                      </Text>
                      <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>
                        {new Date(entry.timestamp).toLocaleString('es', {
                          hour: '2-digit', minute: '2-digit',
                          day: 'numeric', month: 'short',
                        })}
                        {entry.note ? ` — ${entry.note}` : ''}
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: entry.type === 'focus' ? COLORS.success : COLORS.danger,
                    }}>
                      {entry.type === 'focus' ? '+' : '-'}{formatMinutes(entry.durationMinutes)}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            {entries.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Borrar historial',
                    '¿Estás seguro? Se borrarán todos los registros.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Borrar',
                        style: 'destructive',
                        onPress: () => { clearHistory(); setShowHistory(false); },
                      },
                    ]
                  );
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>🗑️ Borrar todo el historial</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ══════ STYLES ══════
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: '#F59E0B' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 12, color: '#FEF3C7', marginTop: 2 },
  historyBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  rangeTabs: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 3,
  },
  rangeTab: { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  rangeTabActive: { backgroundColor: '#FFF' },
  rangeTabText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  rangeTabTextActive: { color: '#D97706' },

  scroll: { flex: 1 },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Score
  scoreBadge: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreText: { fontSize: 36, fontWeight: '900' },

  miniStatsRow: { flexDirection: 'row', gap: 10, marginTop: 14, width: '100%' },
  miniStat: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  miniStatValue: { fontSize: 14, fontWeight: '800', marginTop: 3 },
  miniStatLabel: { fontSize: 9, color: '#6B7280', marginTop: 1 },

  // Section
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 10 },

  // Focus timer
  focusCatBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: '#EEF2FF', borderRadius: 20, marginBottom: 12,
  },
  timerCircle: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 4, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  timerText: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },

  startBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 30, paddingVertical: 12,
    borderRadius: 12,
  },
  startBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  timerActions: { flexDirection: 'row', gap: 10 },
  stopBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  stopBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
  },
  cancelBtnText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },

  // Distraction button
  distractionBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#FECACA', marginBottom: 10,
  },
  distractionBtnTitle: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
  distractionBtnSub: { fontSize: 11, color: '#B91C1C', marginTop: 1 },

  // Radar
  radarItem: { marginBottom: 10 },
  radarLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  radarBarBg: {
    height: 6, borderRadius: 3, backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  radarBarFill: { height: 6, borderRadius: 3 },

  // Activity
  activityItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 18, paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1F2937' },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginTop: 4 },

  // Category grid
  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10,
  },
  catChip: {
    width: '30%', alignItems: 'center', paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },

  // Time presets
  timePresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  timeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  timeChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  // Note input
  noteInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    padding: 10, fontSize: 13, color: '#1F2937', marginBottom: 14,
    backgroundColor: '#F9FAFB',
  },

  // Submit
  submitBtn: {
    backgroundColor: '#EF4444', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Focus category picker
  focusPickItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 4,
  },

  // History
  historyItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  historyDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  clearBtn: {
    marginTop: 12, paddingVertical: 10, alignItems: 'center',
    borderRadius: 10, backgroundColor: '#FEF2F2',
  },
  clearBtnText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
});
