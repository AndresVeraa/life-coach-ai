# PASO 4: Auditoría de Tiempo - Guía Completa

## Visión General

**Módulo de Auditoría** rastrea distracciones y tiempo perdido, proporcionando insights sobre patrones de comportamiento. Los datos se integran directamente con el Coach IA para retroalimentación contextualizada.

**Objetivos:**
- Registrar distracciones en 5 categorías
- Calcular métricas de enfoque automáticamente
- Visualizar tendencias semanales
- Alimentar prompts del Coach con contexto de distracción

---

## Arquitectura

```
src/features/audit/
├── types.ts                    # Interfaces de distracción
├── audit.store.ts              # Zustand store con cálculos
├── hooks/
│   └── useAuditLogger.ts       # Hook para integración coach
└── components/
    ├── DistractionForm.tsx     # Formulario entrada
    ├── AuditSummary.tsx        # Dashboard de métricas
    └── AuditScreen.tsx         # Pantalla principal
```

---

## 1. Tipos de Datos (types.ts)

### Categorías de Distracción

```typescript
type DistractionCategory = 
  | 'redes-sociales'       // 🌐 Instagram, TikTok, Twitter
  | 'personas'             // 👥 Conversations, reuniones
  | 'entretenimiento'      // 🎬 Movies, Games, Netflix
  | 'tareas-administrativas' // 📋 Admin work (not core tasks)
  | 'otro'                 // 🎯 Other/undefined
```

### DistractionEvent
```typescript
interface DistractionEvent {
  id: string                              // UUID
  category: DistractionCategory
  description: string                     // e.g. "Instagram Reels"
  minutesLost: number                     // 1-480 minutes
  timestamp: string                       // ISO date
}
```

### AuditSession
```typescript
interface AuditSession {
  id: string
  date: string                            // YYYY-MM-DD
  distractions: DistractionEvent[]
  totalMinutesLost: number
  completed: boolean
}
```

### AuditMetrics
```typescript
interface AuditMetrics {
  totalMinutesLost: number                // All time
  averageMinutesPerDay: number            // Across all sessions
  totalSessions: number                   // Days tracked
  categoryBreakdown: {
    [key: string]: {
      count: number                       // Times distracted
      totalMinutes: number
      percentage: number                  // % of total lost time
    }
  }
  topCategory: DistractionCategory | null // Most problematic
  weeklyTrend: 'improving' | 'declining' | 'stable'
  last7Days: Array<{
    date: string                          // YYYY-MM-DD
    minutesLost: number
    distractionCount: number
  }>
}
```

---

## 2. Store (audit.store.ts)

### Inicializar Sesión

```typescript
import { useAuditStore } from '@/features/audit/audit.store';

const Component = () => {
  const { createSession } = useAuditStore();
  
  // Crear nueva sesión para hoy
  createSession();
};
```

### Registrar Distracción

```typescript
const { currentSession, addDistraction } = useAuditStore();

addDistraction({
  category: 'redes-sociales',
  description: 'Instagram Reels',
  minutesLost: 23
});

// currentSession.distractions ahora contiene el nuevo evento
```

### Editar/Eliminar

```typescript
const { editDistraction, deleteDistraction } = useAuditStore();

// Editar
editDistraction(distractionId, {
  minutesLost: 35,
  description: 'Updated description'
});

// Eliminar
deleteDistraction(distractionId);
```

### Completar Sesión

```typescript
const { completeSession } = useAuditStore();

// Finalizar sesión actual y calcular métricas
await completeSession();
```

### Acceder a Métricas

```typescript
const { metrics } = useAuditStore();

console.log(metrics.totalMinutesLost);           // 1240
console.log(metrics.topCategory);               // 'redes-sociales'
console.log(metrics.weeklyTrend);               // 'declining'
console.log(metrics.last7Days);                 // Array de 7 días
```

---

## 3. Cálculos de Métricas

### calculateMetrics() - Algoritmo

**Paso 1: Cargar histórico**
```typescript
// Lee todas las sesiones completadas de AsyncStorage
const allSessions = await completeHistory
```

**Paso 2: Desglose por Categoría**
```typescript
categoryBreakdown = {
  'redes-sociales': {
    count: 12,          // 12 events
    totalMinutes: 287,  // sum of minutesLost
    percentage: 35      // 287/820 * 100
  },
  // ... other categories
}
```

**Paso 3: Encontrar Top Category**
```typescript
topCategory = Object.entries(categoryBreakdown)
  .sort((a, b) => b[1].totalMinutes - a[1].totalMinutes)[0][0]
// Result: 'redes-sociales' (most minutes lost)
```

**Paso 4: Tendencia Semanal**
```typescript
const last3Days = last7Days.slice(4, 7)        // Days 5-7
const first4Days = last7Days.slice(0, 4)       // Days 1-4

const last3Avg = sum(last3Days) / 3            // ~45 min/day
const first4Avg = sum(first4Days) / 4          // ~38 min/day

if (last3Avg < first4Avg * 0.9)  → 'improving'    // <10% reduction
if (last3Avg > first4Avg * 1.1)  → 'declining'    // >10% increase
else                               → 'stable'
```

### Ejemplo: Datos Reales

```typescript
// Usuario registra distracciones:
Feb 10: Redes (30min) + Personas (15min) = 45min total
Feb 11: Redes (45min) + Entretenimiento (20min) = 65min total
Feb 12: Redes (35min) + Admin (10min) = 45min total
...
Feb 16: Redes (25min) = 25min total

// Resultado de calculateMetrics():
{
  totalMinutesLost: 820,
  averageMinutesPerDay: 38,
  totalSessions: 21,
  categoryBreakdown: {
    'redes-sociales': {
      count: 45,
      totalMinutes: 287,    // 287/820 = 35%
      percentage: 35
    },
    'personas': {
      count: 12,
      totalMinutes: 165,    // 165/820 = 20%
      percentage: 20
    },
    'entretenimiento': {
      count: 8,
      totalMinutes: 145,    // 145/820 = 18%
      percentage: 18
    },
    'tareas-administrativas': {
      count: 6,
      totalMinutes: 110,    // 110/820 = 13%
      percentage: 13
    },
    'otro': {
      count: 4,
      totalMinutes: 113,    // 113/820 = 14%
      percentage: 14
    }
  },
  topCategory: 'redes-sociales',
  weeklyTrend: 'improving',     // Last 3 days < first 4 days
  last7Days: [
    { date: '2024-02-10', minutesLost: 45, distractionCount: 2 },
    { date: '2024-02-11', minutesLost: 65, distractionCount: 2 },
    // ...
    { date: '2024-02-16', minutesLost: 25, distractionCount: 1 }
  ]
}
```

---

## 4. Hook useAuditLogger

Herramienta para integrar datos de auditoría con el Coach IA.

### Uso Básico

```typescript
import { useAuditLogger } from '@/features/audit/hooks/useAuditLogger';

const MyComponent = () => {
  const { 
    metrics,
    distractionSummary,
    buildDistractionContext,
    getDistractionRecommendation,
    isProductiveDay,
    getFocusScore
  } = useAuditLogger();

  // Acceder a distractionSummary
  console.log(distractionSummary);
  // {
  //   totalMinutesLost: 1240,
  //   averagePerDay: 38,
  //   topCategory: 'redes-sociales',
  //   weeklyTrend: 'improving',
  //   currentSessionCount: 3
  // }
};
```

### Funciones Principales

#### buildDistractionContext()
Genera texto contextual para prompts del Coach:

```typescript
const { buildDistractionContext } = useAuditLogger();

const context = buildDistractionContext();
// Output:
// "Has perdido 1240 minutos en total debido a distracciones. 
//  En promedio, pierdes 38 minutos por día. 
//  Tu mayor distracción es redes-sociales (35% del tiempo perdido). 
//  Esta semana estás mejorando y perdiendo menos tiempo."
```

#### getDistractionRecommendation()
Sugiere acciones específicas basadas en categoría principal:

```typescript
const rec = getDistractionRecommendation();
// "Las redes sociales son tu principal distracción. 
//  Considera usar bloqueadores de aplicaciones o establecer 
//  horarios específicos para revisar tus redes."
```

#### isProductiveDay()
Verifica si hoy fue un buen día:

```typescript
if (isProductiveDay()) {
  // Hoy estuvo por debajo del promedio personal
  showCelebration();
}
```

#### getFocusScore()
Puntuación de enfoque 0-100:

```typescript
const score = getFocusScore();
// 100 = Sin distracciones
// 50 = ~240 min distraído (2 horas)
// 0 = 480+ min distraído (8+ horas)

if (score < 30) {
  // ALERTA: Demasiadas distracciones hoy
}
```

---

## 5. Componentes UI

### DistractionForm.tsx

**Props:** Ninguno (accede a `useAuditStore` internamente)

**Features:**
- Category selector (5 botones con emojis)
- Description input (100 char limit)
- Minutes input (1-480 validación)
- Inline list de distracciones con delete
- Total time lost indicator

```typescript
import { DistractionForm } from '@/features/audit/components/DistractionForm';

<DistractionForm />
```

### AuditSummary.tsx

**KPI Cards:**
- Total Histórico (minutos totales)
- Promedio/Día (minutos/día)
- Sesiones (días) registrados)

**Tendencia:**
- Indicador visual (📈 mejora, 📉 empeora, ➡️ estable)
- Comparación 3 días vs 4 días

**Desglose por Categoría:**
- Bar chart horizontal para cada categoría
- % y minutos totales
- Count (x veces distraído)

**Últimos 7 Días:**
- Mini bar chart por día
- Date label + minutos + count
- Escala hasta 120 min

```typescript
import { AuditSummary } from '@/features/audit/components/AuditSummary';

<AuditSummary />
```

### AuditScreen.tsx

**Estructura:**
1. Header ("⏱️ Auditoría de Tiempo")
2. Form o Placeholder
   - Si hay sesión activa: DistractionForm + Complete button
   - Si no: CTA para nueva sesión
3. AuditSummary (métricas)
4. Floating Action Button (new distraction)

**Estados:**
```
- No session: Botón "Nueva Sesión"
- Session active (0 distracciones): Form sin botón complete
- Session active (1+ distracciones): Form + Complete button
```

---

## 6. Integración con Coach IA

### coachPrompts.ts - Nueva Lógica

**AuditContext:**
```typescript
interface AuditContext {
  totalMinutesLost: number
  averageMinutesPerDay: number
  topCategory?: string
  weeklyTrend: 'improving' | 'declining' | 'stable'
  focusScore: number
}
```

**selectCoachPrompt() - Prioridades:**
1. focusScore < 30 → SEVERE_DISTRACTION_PROMPT
2. averageSleep < 6.5 → SLEEP_DEFICIT_PROMPT
3. failedTasks > completedTasks → PROCRASTINATION_PROMPT
4. completionRate > 0.8 && sleep >= 7 → MOMENTUM_PROMPT
5. weeklyTrend === 'declining' → DISTRACTION_TREND_PROMPT
6. totalDistractions > 15 → DISTRACTION_PROMPT
7. Default → buildContextualPrompt()

**Nuevos Prompts:**

#### SEVERE_DISTRACTION_PROMPT (Focus < 30)
```
⚠️ ALERTA: El usuario está perdiendo MUCHO tiempo en distracciones.
Sé firme: "Tus distracciones están saboteando tu productividad. Esto debe cambiar HOY."
Pregunta específica basada en topCategory
Acción inmediata: Bloquea esa app/website por 8 horas hoy
```

#### DISTRACTION_TREND_PROMPT (Declining)
```
El usuario está perdiendo CADA VEZ MÁS tiempo.
Contexto: "He notado que cada día estás más distraído."
Pregunta de diagnóstico: ¿Qué cambió esta semana?
Solución: Vuelve a lo básico
```

### useCoachAI.ts - Cambios

```typescript
const { getFocusScore, distractionSummary } = useAuditLogger();

// Construir auditContext
const auditContext = {
  ...distractionSummary,
  focusScore: getFocusScore(),
};

// En sendMessage():
const contextPrompt = selectCoachPrompt(enrichedUserStats, auditContext);

// En startConversation():
if (auditContext.focusScore < 50) {
  greeting = `Noto que tienes muchas distracciones (Focus: ${focusScore}/100)...`;
}
```

---

## 7. Flujo de Uso Completo

### Escenario: Usuario registra distracciones durante el día

```
1. Usuario abre Auditoría tab
   ↓ Crea nueva sesión
   ↓ Ve formulario vacío

2. Registra: "Instagram Reels" (redes-sociales, 23 min)
   ↓ DistractionEvent creado
   ↓ Muestra en lista inline

3. Registra: "Coffee con Juan" (personas, 15 min)
   ↓ 2 eventos en currentSession

4. Presiona "Completar Sesión"
   ↓ completeSession() llamado
   ↓ Histórico guardado en AsyncStorage
   ↓ calculateMetrics() recalcula todas las métricas
   ↓ metrics.last7Days se actualiza
   ↓ metrics.weeklyTrend se recalcula
   ↓ AuditSummary se refresca

5. Usuario abre Coach
   ↓ useCoachAI obtiene auditContext
   ↓ selectCoachPrompt elige mejor prompt basado en:
      - focusScore
      - weeklyTrend
      - topCategory
      - comparación sleepHours
   ↓ Coach envía respuesta personalizada con recomendaciones
```

### Escenario: Semana completa de tracking

```
Lunes: 45 min (Redes 30, Personas 15)
Martes: 65 min (Redes 45, Entretenimiento 20)
Miércoles: 50 min (Redes 40, Admin 10)
Jueves: 40 min (Redes 25, Entretenimiento 15)
Viernes: 35 min (Redes 20, Personas 15)
Sábado: 38 min (Redes 25, Entretenimiento 13)
Domingo: 25 min (Redes 15, Admin 10)

Total: 298 minutos en 7 días

calculateMetrics():
- totalMinutesLost: 298
- averageMinutesPerDay: 42
- categoryBreakdown['redes-sociales']: { count: 13, totalMinutes: 170, percentage: 57 }
- topCategory: 'redes-sociales'
- last3Days (V/S/D): avg = 32 min/day
- first4Days (L/M/M/J): avg = 50 min/day
- 32 < 50 * 0.9 (45) → weeklyTrend: 'improving'

Coach recibe contexto:
"Has perdido 298 minutos esta semana. La mayoría en redes sociales (57%). 
¡Buena noticia! Esta semana estás mejorando y perdiendo menos tiempo."
```

---

## 8. Datos Persistentes

**AsyncStorage Keys:**
```
- 'audit-storage'           // Zustand persist key
  └── currentSession
      ├── id
      ├── date
      ├── distractions[]
      └── completed (bool)
  └── completedSessions[]
  └── metrics (cached)
```

**Sincronización:**
- Todas las sesiones completadas se guardan automáticamente
- Metrics se recalculan al completar sesión
- No requiere backend - 100% offline

---

## 9. Próximos Pasos (PASO 5)

### Sincronización con Backend
- Crear Supabase table: `audit_sessions`
- Implementar sync queue con retry logic
- Conflict resolution si usuario edita día antiguo

### Refinamientos UI
- Date picker para registrar distracciones de ayer
- Bulk edit: modificar sesión completa
- Export: CSV de datos de auditoría

### Inteligencia IA Avanzada
- Análisis de patrones horarios
- Recomendaciones de bloqueo específicos
- Predicción: "Si sigues así, perderás XXX minutos esta semana"

---

## 10. Testing

### Unit Tests (store calculations)

```typescript
describe('calculateMetrics', () => {
  it('should calculate category percentages correctly', () => {
    const sessions = [
      { 
        distractions: [
          { category: 'redes-sociales', minutesLost: 100 }
        ]
      }
    ];
    
    const metrics = calculateMetrics(sessions);
    expect(metrics.categoryBreakdown['redes-sociales'].percentage).toBe(100);
  });

  it('should determine trend correctly', () => {
    // last3Days avg: 30, first4Days avg: 50
    const metrics = calculateMetrics(sessions);
    expect(metrics.weeklyTrend).toBe('improving');
  });
});
```

### Integration Test (Component)

```typescript
it('should update summary when distraction added', async () => {
  const { getByText } = render(<AuditScreen />);
  
  // Create session and add distraction
  fireEvent.press(getByText('Nueva Sesión'));
  
  // Verify summary updates
  expect(getByText(/Total Histórico/)).toBeVisible();
});
```

---

## Resumen

| Aspecto | Detalles |
|--------|----------|
| **Categorías** | 5 tipos de distracción + descripción |
| **Métricas** | Total, promedio/día, % por categoría, tendencia |
| **UI** | Form + Summary + 5-tab navigation |
| **Coach Integration** | Contexto + prompts automáticos |
| **Persistencia** | AsyncStorage + offline-first |
| **Próximo PASO** | Backend sync + análisis avanzado |

---

## Referencias Rápidas

**Importar Store:**
```typescript
import { useAuditStore } from '@/features/audit/audit.store';
```

**Importar Hook:**
```typescript
import { useAuditLogger } from '@/features/audit/hooks/useAuditLogger';
```

**Importar Screen:**
```typescript
import { AuditScreen } from '@/features/audit/components/AuditScreen';
```

**Tipos:**
```typescript
import { 
  DistractionCategory,
  DistractionEvent,
  AuditSession,
  AuditMetrics,
  CATEGORY_CONFIG
} from '@/features/audit/types';
```

---

**Versión:** PASO 4.0 Completo  
**Estado:** ✅ Implementado (3 componentes + store + hook + integración coach)  
**Siguientes Pasos:** PASO 5 (Backend Sync)
