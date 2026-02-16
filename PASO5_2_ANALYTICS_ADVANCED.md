# PASO 5.2: Analytics Avanzado ✅

**Estado:** Completado ✅  
**Fecha:** 2024  
**Módulos:** 5 servicios + 1 store + 1 hook  
**LOC:** ~1,000 líneas  
**Dependencias:** `zustand`, `AsyncStorage`

---

## 📊 Resumen

El sistema de **Analytics Avanzado** convierte datos de auditoría y salud en **inteligencia accionable**:

1. **Pattern Analyzer** - Detecta patrones horarios y semanales
2. **Predictor** - Predice comportamiento futuro con confianza estimada
3. **Insights Generator** - Crea 5 insights accionables priorizado
4. **Analytics Store** - Persiste análisis en AsyncStorage
5. **useAdvancedAnalytics** - Hook que orquesta todo

---

## 🎯 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│              useAdvancedAnalytics Hook                  │
│  (Orquesta todo, ejecuta automáticamente)               │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼─────┐ ┌──▼──────┐ ┌─▼────────┐
    │  Pattern │ │Predictor│ │ Insights │
    │ Analyzer │ │ Service │ │Generator │
    └────┬─────┘ └──┬──────┘ └─┬────────┘
         │          │          │
         └──────────┼──────────┘
                    │
         ┌──────────▼───────────┐
         │ Analytics Store      │
         │ (Zustand + Cache)    │
         └──────────────────────┘
                    │
         ┌──────────▼───────────┐
         │ Components/Coach IA  │
         └──────────────────────┘
```

---

## 📦 Archivos Creados

### 1. `src/services/analytics/patternAnalyzer.ts` (300 LOC)

**Detecta patrones de comportamiento:**

```typescript
interface HourPattern {
  hour: number;              // 0-23
  avgMinutesLost: number;    // Promedio de minutos
  riskLevel: 'low' | 'medium' | 'high';
  dataPoints: number;        // Cantidad de muestras
}

interface PatternAnalysis {
  hourPatterns: HourPattern[];        // Patrón por hora
  dayPatterns: DayPattern[];          // Patrón por día semana
  peakHour: HourPattern | null;       // Hora con más distracciones
  lowestHour: HourPattern | null;     // Mejor hora
  consistency: number;                // 0-100 (predecibilidad)
}
```

**Funciones principales:**

- `analyzeHourPatterns()` - Detectar cuándo pierdes más tiempo
- `analyzeDayPatterns()` - Detectar qué días son difíciles
- `findCorrelations()` - Ejemplo: sueño ↔ distracciones
- `calculateConsistency()` - Qué tan predecible eres

**Ejemplo:**

```typescript
const analysis = patternAnalyzer.analyzeAll(sessions, metrics);

console.log(analysis.peakHour);  // { hour: 10, avgMinutesLost: 45, riskLevel: 'high' }
console.log(analysis.lowestHour); // { hour: 16, avgMinutesLost: 8 }
console.log(analysis.consistency); // 72% - moderadamente consistente
```

---

### 2. `src/services/analytics/predictor.ts` (250 LOC)

**Predice comportamiento futuro:**

```typescript
interface Prediction {
  minutesLostNextWeek: number;        // Minutos totales
  hoursLostNextWeek: number;          // Convertido a horas
  confidence: number;                 // 0-100 (qué tan seguro)
  contributingFactors: string[];      // Qué afecta
  riskAssessment: 'low' | 'medium' | 'high';
  recommendation: string;             // Acción sugerida
}
```

**Funciones principales:**

- `predictNextWeekMinutesLost()` - Predicción para próxima semana
- `predictHourMinutesLost(hour)` - Predicción para hora específica
- `calculateTrend()` - ¿Mejorando o empeorando?
- `getBestTimeSlots()` - Mejores horas para trabajo profundo
- `getWorstTimeSlots()` - Horas a evitar
- `calculateRequiredImprovement()` - Cuánto mejorar para meta

**Ejemplo:**

```typescript
const prediction = predictor.predictNextWeekMinutesLost(analysis);

console.log(prediction.hoursLostNextWeek);        // 5.2
console.log(prediction.confidence);               // 87 (87% confianza)
console.log(prediction.riskAssessment);           // 'medium'
console.log(prediction.recommendation);
// → "Tus patrones muestran oportunidades de mejora. Enfócate en las horas críticas."

const bestHours = predictor.getBestTimeSlots(analysis, 3);
// → [9, 14, 16] mejores horas para trabajo importante
```

---

### 3. `src/services/analytics/insights.ts` (300 LOC)

**Convierte análisis en insights accionables:**

```typescript
interface Insight {
  id: string;                    // Único identificador
  title: string;                 // "⚠️ Tu hora crítica: 10:00"
  description: string;           // Explicación
  actionable: boolean;           // ¿Hay algo que hacer?
  suggestedAction?: string;      // "Bloquea Instagram 10-11am"
  impact: 'low' | 'medium' | 'high';
  category: 'pattern' | 'prediction' | 'correlation' | 'opportunity' | 'warning';
  priority: number;              // 1-10 (qué tan urgente)
}
```

**Tipos de insights generados:**

1. **Hora crítica** (⚠️ High Priority)
   - "Pierdes 45 minutos entre 10-11am"
   - Acción: Bloquea apps, sesión Focus Mode

2. **Golden Hour** (✅ High Priority)
   - "Eres más productivo 4-5pm (solo 8 min distracciones)"
   - Acción: Reserva tareas importantes

3. **Día débil** (📉 Medium Priority)
   - "El viernes pierdes más tiempo"
   - Acción: Tareas menos demandantes o más breaks

4. **Correlaciones** (🔗 Medium Priority)
   - "Menos sueño = más distracciones"
   - Acción: Prioriza sueño

5. **Predicción** (⏰ Variable Priority)
   - "Próxima semana: 5.2 horas de distracciones"
   - Acción: Personalizada según riesgo

6. **Oportunidades** (💡 High Priority)
   - "Si reduces 50% en hora crítica, ahorras 225 min/semana"
   - Acción: Implementar mejora específica

**Ejemplo:**

```typescript
const insights = insightsGenerator.generateAllInsights(analysis, prediction);

insights.slice(0, 3).forEach((insight) => {
  console.log(`${insight.title} (Prioridad: ${insight.priority})`);
  console.log(`→ ${insight.suggestedAction}`);
});

// Output:
// ⚠️ Tu hora crítica: 10:00 (Prioridad: 10)
// → Establece un bloqueo de apps de 10:00 a 11:00
//
// 💡 Opportunity: Optimiza tu hora crítica (Prioridad: 8)
// → Usa "Focus Mode" de 10am-11am...
//
// ✅ Tu golden hour: 16:00 (Prioridad: 9)
// → Reserva tus tareas más importantes para esta hora
```

---

### 4. `src/features/analytics/analytics.store.ts` (200 LOC)

**Zustand store con persistencia:**

```typescript
interface AnalyticsState {
  // Análisis actual
  analysis: PatternAnalysis | null;
  prediction: Prediction | null;
  insights: Insight[];

  // Metadatos
  lastAnalyzedAt: number | null;
  analysisFrequency: 'daily' | 'weekly' | 'manual';

  // Histórico
  previousPredictions: Prediction[];

  // Configuración
  targetMinutesLostPerWeek: number;  // Meta (default 3h = 180min)
  enableAutoAnalysis: boolean;

  // Acciones
  updateAll: (analysis, prediction, insights) => void;
  getPredictionTrend: () => number;  // % mejora/empeoramiento
  setTarget: (minutes: number) => void;
  // ... más acciones
}
```

**Hooks disponibles:**

```typescript
// Obtener estado
const { prediction, insights, trend } = useAnalytics();

// Actualizar
const { updateAll } = useAnalyticsUpdate();

// Histórico
const { previousPredictions, getPredictionTrend } = useAnalyticsHistory();

// Configuración
const { enableAutoAnalysis, setTarget } = useAnalyticsSettings();
```

**Persistencia:**
- Todos los datos se guardan en AsyncStorage automáticamente
- Se restauran al iniciar la app
- Histórico de 12 predicciones mantiene

---

### 5. `src/features/analytics/useAdvancedAnalytics.ts` (250 LOC)

**Hook que lo orquesta todo:**

```typescript
const {
  loading,           // boolean - ejecutando análisis
  error,             // string | null - si hubo error
  analysis,          // PatternAnalysis | null
  prediction,        // Prediction | null
  insights,          // Insight[]
  lastAnalyzedAt,    // timestamp | null
  runAnalysis,       // () => Promise<void> - ejecutar manualmente
  refreshAnalysis,   // () => Promise<void> - forzar nuevo
  getRecommendation, // () => string - mejor recomendación
  getBestHoursForDeepWork, // () => number[] - [9, 14, 16]
  getWorstHours,     // () => number[] - horas a evitar
} = useAdvancedAnalytics();
```

**Características:**

- ✅ Ejecución automática si no hay análisis
- ✅ Auto-refresco cada 24 horas
- ✅ Detección de datos insuficientes (requiere 30+ días)
- ✅ Manejo de errores gracioso
- ✅ Performance optimizado con `useMemo`

**Ejemplo:**

```typescript
const AnalyticsScreen = () => {
  const {
    loading,
    prediction,
    insights,
    getBestHoursForDeepWork,
  } = useAdvancedAnalytics();

  if (loading) return <Text>Analizando patrones...</Text>;

  return (
    <View>
      <Text>Próxima semana: {prediction?.hoursLostNextWeek}h</Text>

      <Text>Mejores horas:</Text>
      {getBestHoursForDeepWork().map((hour) => (
        <Text key={hour}>{hour}:00-{hour+1}:00</Text>
      ))}

      {insights.map((i) => (
        <InsightCard key={i.id} insight={i} />
      ))}
    </View>
  );
};
```

---

## 🚀 Integración con Coach IA

Los insights y patrones enriquecen automáticamente al Coach:

```typescript
// En useCoachAI.ts (futuro)
import { insightsGenerator } from '@/services/analytics';

export const useCoachAI = () => {
  const { insights, analysis } = useAdvancedAnalytics();

  const enrichedContext = {
    // Contexto existente...
    analyticsInsights: insightsGenerator.generateCoachContext(insights),
    // Ahora Coach sabe: hora crítica, tendencias, predicciones
  };

  // Coach genera prompts como:
  // "Veo que pierdes mucho tiempo 10-11am. Intentemos bloquear Instagram?"
  // "Tu viernes es difícil. ¿QUÉ es diferente ese día?"
};
```

---

## 📊 Flujo de Datos

```
AuditStore (30+ sessions)     HealthStore (metrics)
    │                              │
    └──────────────┬───────────────┘
                   │
        ┌──────────▼──────────┐
        │ useAdvancedAnalytics│
        └──────────┬──────────┘
                   │
   ┌───────────────┼───────────────┐
   │               │               │
┌──▼────────┐ ┌───▼──────┐ ┌──────▼───┐
│ Pattern   │ │Predictor │ │ Insights │
│ Analyzer  │ │          │ │Generator │
└──┬────────┘ └───┬──────┘ └──────┬───┘
   │               │               │
   └───────────────┼───────────────┘
                   │
        ┌──────────▼──────────┐
        │ Analytics Store     │
        │ (Zustand+Cache)     │
        └───────────┬─────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
 ┌──▼────────┐ ┌───▼──────┐ ┌──────▼───┐
 │Dashboard  │ │Coach IA  │ │ Settings │
 │Component  │ │(enriched)│ │ Screen   │
 └───────────┘ └──────────┘ └──────────┘
```

---

## ⚙️ Algoritmos Principales

### Consistencia (0-100)

```
valor_bajo → patrón consistente → confianza_alta
valor_alto → patrón variable    → confianza_baja

Fórmula: 100 - (promedio_varianza × 2)
```

### Risk Score (0-100)

```
risgo = (horasLostNextWeek / 14) × confianza × 100

Categorías:
- High:   > 60 (>8.4h/semana)
- Medium: 30-60 (4-8h/semana)
- Low:    < 30 (<4h/semana)
```

### Trend Detection

```
Si último < anterior - 10%: "mejorando" 📉
Si último > anterior + 10%: "empeorando" 📈
Else:                       "estable" ➡️
```

### Predicción

```
predicted = (suma_diaria × 1.1) ÷ 7

- ×1.1 = 10% buffer (la gente tiende a mejorar)
- ÷7 = promedio por día de la semana
```

---

## 🧪 Testing (Manual)

```typescript
// 1. Crear datos simulados
const mockSessions = [
  { date: '2024-01-01', distractions: [...], totalMinutesLost: 45 },
  // ... 30+ sesiones
];

// 2. Ejecutar análisis
const analysis = patternAnalyzer.analyzeAll(mockSessions, metrics);

// 3. Verificar patrones
assert(analysis.peakHour.hour === 10);
assert(analysis.peakHour.avgMinutesLost > 40);

// 4. Predicción
const prediction = predictor.predictNextWeekMinutesLost(analysis);
assert(prediction.confidence > 70);

// 5. Insights
const insights = insightsGenerator.generateAllInsights(analysis, prediction);
assert(insights.length === 5);
assert(insights[0].priority >= 9);
```

---

## 📝 Próximos Pasos

### PASO 5.3: Resolving Analytics Components (3 horas)

A. **AnalyticsScreen.tsx** (300 LOC)
   - Dashboard principal
   - Patrones visuales (gráficos)
   - Insights cards
   - Trend changes

B. **PatternHeatmap.tsx** (200 LOC)
   - Visualización 2D: Hora vs Día
   - Colores: verde (bajo) → rojo (alto)

C. **InsightsList.tsx** (150 LOC)
   - Tarjetas prioritizadas
   - Acciones expandibles
   - Tracking de completadas

### PASO 5.4: Coach IA Integration (2 horas)

- Enriquecer prompts con `generateCoachContext()`
- Mencionar patrones detectados
- Tareas sugeridas basadas en best hours
- Alertas sobre horas críticas

---

## 🎨 Data Flow Completo

```
Usuario registra distracciones
    ↓
AuditStore (30+ sesiones)
    ↓
[click "Ver Análisis"]
    ↓
useAdvancedAnalytics()
    ├─ patternAnalyzer.analyzeAll()
    ├─ predictor.predictNextWeekMinutesLost()
    └─ insightsGenerator.generateAllInsights()
    ↓
AnalyticStore persiste (AsyncStorage)
    ↓
AnalyticsScreen renderiza:
    ├─ "Próxima semana: 5.2h"
    ├─ "Mejor hora: 4pm"
    ├─ "Día débil: Viernes"
    └─ Insights priorizados
    ↓
Coach IA se enriquece con contexto
    ↓
"Veo que pierdes mucho viernes..."
```

---

## ✅ Checklist

- [x] Pattern Analyzer (3 patrones: hora, día, correlación)
- [x] Predictor (predicción con confianza + recomendaciones)
- [x] Insights Generator (5 insights accionables)
- [x] Analytics Store (Zustand + async storage)
- [x] useAdvancedAnalytics hook (orquestador)
- [x] Documentación completa
- [ ] Components UI (PASO 5.3)
- [ ] Coach integration (PASO 5.4)

---

## 📚 Referencias

- **patternAnalyzer.ts**: Análisis per hour/day/correlation
- **predictor.ts**: Predicción + trend detection
- **insights.ts**: Generación de insights + contexto Coach
- **analytics.store.ts**: Zustand store (cache + historial)
- **useAdvancedAnalytics.ts**: Hook orquestador
- **analytics/index.ts**: Exportaciones centralizadas

---

**Listo para:** PASO 5.3 (Components) y 5.4 (Coach Integration) ✅
