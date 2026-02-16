# PASO 5: Sincronización Backend + Analytics - Plan Detallado

## Visión General

**PASO 5** sincroniza toda la data offline-first con Supabase y añade análisis inteligentes que alimentan mejor coaching.

**Objetivos:**
1. ✅ Sincronizar datos de tareas, salud, auditoría, coach
2. ✅ Manejar conflictos y actualizaciones simultáneas
3. ✅ Analytics avanzado: patrones horarios, predicciones, insights
4. ✅ Sincronización offline-first con retry automático
5. ✅ Análisis de comportamiento para prompts más inteligentes

---

## Arquitectura PASO 5

```
src/services/
├── sync/
│   ├── syncQueue.ts          # Cola de cambios offline
│   ├── syncManager.ts        # Orquestador de sincronización
│   ├── conflictResolver.ts   # Resolución de conflictos
│   └── syncStrategies.ts     # Estrategias por feature
├── db/
│   ├── supabaseClient.ts     # Cliente inicializado
│   ├── schema.ts             # Tipos de BD
│   └── queries.ts            # Helpers de queries
└── analytics/
    ├── patternAnalyzer.ts    # Análisis de patrones (horarios)
    ├── predictor.ts          # Predicciones de comportamiento
    └── insights.ts           # Generación de insights

src/features/
├── analytics/
│   ├── analytics.store.ts    # Zustand store
│   └── hooks/
│       └── useAdvancedAnalytics.ts
└── sync/
    ├── SyncStatus.tsx        # Indicador de sincronización
    └── hooks/
        └── useSyncManager.ts # Hook para manejo de sync

src/shared/
└── hooks/
    └── useSyncEffect.ts      # Hook para sincronizar en background
```

---

## Fase 1: Sincronización (M1-M2)

### 1.1 Supabase Integration

**supabaseClient.ts** - Inicializar cliente
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl!, supabaseKey!);
```

**Tablas a crear en Supabase:**
- `users` - Perfil de usuario
- `tasks` - Tareas sincronizadas
- `sleep_records` - Registros de sueño
- `distractions` - Eventos de distracción
- `conversations` - Mensajes con coach
- `sync_metadata` - Timestamps para conflict resolution

### 1.2 Sync Queue

**syncQueue.ts** - Cola de cambios locales
```typescript
interface SyncOperation {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  table: string
  data: any
  localId: string
  timestamp: number
  retries: number
  lastError?: string
}

export const useSyncQueue = create<SyncQueueStore>()(
  persist(
    (set, get) => ({
      queue: [],
      addToQueue: (op: SyncOperation) => { /* enqueue */ },
      dequeue: (id: string) => { /* remove after success */ },
      getQueue: () => get().queue,
    }),
    { name: 'sync-queue-storage' }
  )
);
```

### 1.3 Sync Manager

**syncManager.ts** - Orquestador
```typescript
export const syncManager = {
  // Sincronizar todo
  syncAll: async () => {
    // 1. Check network
    // 2. Get local changes
    // 3. Resolve conflicts
    // 4. Upload to Supabase
    // 5. Download remote changes
    // 6. Merge local + remote
    // 7. Update local stores
  },

  // Reintento con backoff exponencial
  retryFailedOperations: async () => {
    // Max 3 retries, exponential backoff
  },

  // Resolver conflictos (last-write-wins + custom logic)
  resolveConflict: async (local, remote) => {
    // Strategy: server timestamp > local timestamp
  }
}
```

### 1.4 Conflict Resolution

**Estrategia:** Last-Write-Wins (LWW) con timestamp del servidor
- Si `remote.updatedAt > local.updatedAt` → usar remote
- Si conflicto en tareas: servidor gana (authoritative)
- Si conflicto en salud/auditoría: merge datos (más flexibles)

---

## Fase 2: Analytics Avanzado (M3-M4)

### 2.1 Pattern Analyzer

**Detectar patrones horarios:**
- ¿A qué hora pierdes más tiempo? (9-10am? 3-4pm?)
- ¿Qué día de la semana? (más productivo lunes, peor viernes?)
- ¿Correlaciones?: menos sueño → más distracciones?

```typescript
interface TimePattern {
  hour: number
  avgMinutesLost: number
  dataPoints: number
}

interface DayPattern {
  dayOfWeek: number
  avgTasksCompleted: number
  avgMinutesLost: number
}

export const analyzeTimePatterns = (data: AuditSession[]) => {
  // Agrupar por hora y día
  // Calcular promedios y tendencias
  // Identificar "low focus hours"
}
```

### 2.2 Predictor

**Predicciones basadas en datos históricos:**
- "Si sigues así, perderás ~XXX minutos esta semana"
- "Tiendes a distraerte más viernes por la tarde"
- "Después de dormir < 6h, pierdes 40% más tiempo"

```typescript
export const predictWeeklyLoss = (
  last7Days: AuditMetrics,
  sleepData: HealthMetrics
): Prediction => {
  const trend = analyzeTrend(last7Days)
  const sleepEffect = calculateSleepImpact(sleepData)
  
  return {
    predictedMinutesLost: calculateForecast(),
    confidence: 0.85,
    factors: ['trend', 'sleep', 'dayOfWeek']
  }
}
```

### 2.3 Insights Generator

**Generar insights accionables:**
- "Pierdes más tiempo en X hora. Intenta bloquear la app de Y a Z."
- "Cuando duermes < 6h, tu enfoque cae. Duerme más."
- "Patrón: Los viernes pierdes 30% más. Planifica mejor."

---

## Fase 3: Integración UI (M5)

### 3.1 Sync Status Indicator
```
🔄 Sincronizando... (con spinner)
✅ Sincronizado hace 2 min
❌ Error de sincronización (botón retry)
📴 Offline (sync cuando haya red)
```

### 3.2 Analytics Dashboard
```
src/features/analytics/AnalyticsScreen.tsx
├── Patrones Horarios (gráfico calor por hora)
├── Patrones Semanales (gráfico por día)
├── Predicciones (si sigues así...)
└── Insights (3-5 recomendaciones específicas)
```

---

## Implementación Paso a Paso

### Fase 1: Core Sync (Semana 1)

**M1.1** - Supabase Client + Schema
```bash
npm install @supabase/supabase-js
```
- Crear `supabaseClient.ts`
- Definir tipos de base de datos
- Crear tablas en Supabase desde dashboard

**M1.2** - Sync Queue
- Crear `syncQueue.ts` con Zustand
- Implementar add/remove operations
- Persistir a AsyncStorage

**M1.3** - Sync Manager
- Crear `syncManager.ts`
- Implementar `syncAll()`
- Agregar retry logic con exponential backoff

**M1.4** - Upload Tareas
- Subir tasks a `tasks` table
- Resolver conflictos por ID/timestamp

**M1.5** - Upload Health & Audit
- Subir sleep records
- Subir distractions
- Subir coach conversations

### Fase 2: Analytics (Semana 2)

**M2.1** - Pattern Analyzer
- Detectar patrones horarios
- Detectar patrones por día semana
- Análisis de correlaciones

**M2.2** - Predictor
- Forecast de minutos perdidos
- Relación sueño/distracciones
- Confianza de predicción

**M2.3** - Insights
- Generar 5 insights personalizados
- Basados en patrones + predicciones
- Accionables y específicos

### Fase 3: UI Integration (Semana 3)

**M3.1** - Sync Status
- Indicador en header
- Estados: sincronizando, error, offline

**M3.2** - Analytics Screen
- Nueva tab o pantalla modal
- Visualizaciones interactivas
- Integración con Coach

---

## Datos de Ejemplo

### Input: Histórico de 30 días
```
Distracciones:
- 23 feb: 45min a las 10:30 (redes-sociales)
- 23 feb: 30min a las 15:00 (entretenimiento)
- 24 feb: 50min a las 10:00 (redes-sociales)
- ... (continuar)

Sueño:
- 22 feb: 5.5 horas (bajo)
- 23 feb: 8.2 horas (bueno)
- 24 feb: 6.8 horas (medio)
```

### Output: Patrones
```
Análisis:
- 10:00-11:00: Promedio 45min/día en distracciones (HOT ZONE)
- 15:00-16:00: Promedio 30min/día
- Lunes-Miercoles: 35min/día promedio
- Jueves-Vienes: 48min/día promedio (↑ 37%)
- Correlación sueño: Si < 6h → +40% distracciones

Predicción (Semana siguiente):
- Minutos perdidos estimados: 315 (si mantiene patrón)
- Confianza: 82%
- Mejor día: Lunes (26min)
- Peor día: Viernes (52min)

Insights (Accionables):
1. "Tu 'sweet spot' de enfoque es 11am-3pm. Deja trabajo importante para entonces."
2. "Viernes pierdes 40% más tiempo. Remueve distracciones esos días."
3. "Cuando duermes < 6h, pierdes casi 50min extra. Prioriza sueño."
4. "Redes sociales consume 65% del tiempo perdido. Considera bloquear entre 9am-12pm."
5. "Mejora semanal: 📈 15% menos distracciones que 2 semanas atrás!"
```

---

## Tabla de Progreso PASO 5

| Módulo | M1.1 | M1.2 | M1.3 | M1.4 | M1.5 | M2.1 | M2.2 | M2.3 | M3.1 | M3.2 |
|--------|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|
| Planing | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Code   | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Test   | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

---

## Próximos Pasos Inmediatos

1. ✅ Validar plan PASO 5
2. ⏳ M1.1: Crear `supabaseClient.ts`
3. ⏳ M1.1: Definir schema y crear tablas
4. ⏳ M1.2: Crear `syncQueue.ts`
5. ⏳ M1.3: Crear `syncManager.ts`

---

**Versión:** PASO 5.0 - Planning  
**Estado:** 🎯 En Diseño  
**Siguiente:** Implementación M1.1
