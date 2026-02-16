# PASO 2: Módulo de Salud & Sueño ✓

## 📋 Resumen de lo Implementado

Se ha creado un módulo **completamente offline** para registrar y monitorear sueño con estadísticas en tiempo real.

### 📁 Archivos Creados (7 archivos)

```
src/features/health/
├── types.ts                      (Tipos: SleepRecord, HealthMetrics, HealthState)
├── health.store.ts               (Zustand store con AsyncStorage persist)
├── HealthScreen.tsx              (Pantalla principal)
├── health.store.usage.ts         (Ejemplos de uso)
└── components/
    ├── SleepTracker.tsx          (Formulario de entrada de sueño)
    └── HealthStats.tsx           (Dashboard de estadísticas)
```

---

## 🎯 Funcionalidades Principales

### 1. **Registro de Sueño**
Formulario tipo tarjeta que permite:
- Seleccionar fecha
- Hora de dormir (HH:MM)
- Hora de despertar (HH:MM)
- Calidad 1-5 (botones interactivos)
- Notas opcionales

✨ **Características:**
- Validación de formato HH:MM
- Cálculo automático de horas dormidas
- Guardado offline automático

### 2. **Dashboard de Estadísticas**
Mostrará (solo si hay registros):
- **Promedio de Sueño**: Horas/noche (ej: 7.5 horas)
- **Meta 8h**: ✓ Cumplida o ✗ No cumplida
- **Racha**: Días consecutivos registrados
- **Registros Mes**: Total del mes actual
- **Últimos 7 Días**: Gráfico con barra de horas + emoji de calidad
- **Rango de Calidad**: Mejor y peor día registrado

### 3. **Store Zustand con Persistencia**
- Almacena todo en **AsyncStorage** (offline-first)
- Acciones:
  - `addSleepRecord(record)` - Agregar nuevo
  - `updateSleepRecord(id, updates)` - Editar existente
  - `deleteSleepRecord(id)` - Eliminar
  - `getSleepRecordsByRange(startDate, endDate)` - Filtrar por rango
  - `getMetrics()` - Obtener estadísticas
  - `clearHistory()` - Limpiar todo

---

## 🧮 Cálculos Implementados

### Horas de Sueño
```typescript
// Calcula automáticamente la diferencia entre hora de dormir y despertar
// Si cruzó medianoche (23:00 → 07:00), suma 24 horas antes de restar
calculateSleepHours(timeIn: "23:00", timeOut: "07:00") // = 8 horas
```

### Métrica de Meta (8 horas)
```typescript
// Verifica si el promedio alcanzó 8 horas
goalMet = averageSleep >= 8 // true | false
```

### Días Consecutivos
```typescript
// Cuenta desde la fecha más reciente hacia atrás
// Si hay "20 de febrero, 19 de febrero, 18 de febrero"
// consecutiveDays = 3
```

### Últimos 7 Días
```typescript
// Crea array de 7 días retrasados con:
// - date (ISO format)
// - hours (dormidas ese día, 0 si sin registro)
// - quality (1-5, 0 si sin registro)
```

---

## 📊 Ejemplo de Uso en Componente

```typescript
import { useHealthStore } from '@/features/health/health.store';

export const MyComponent = () => {
  const { 
    records, 
    metrics, 
    last7Days,
    addSleepRecord,
    updateSleepRecord,
    deleteSleepRecord 
  } = useHealthStore();

  // Agregar registro
  const handleAddSleep = () => {
    addSleepRecord({
      date: '2026-02-15',
      timeIn: '23:30',
      timeOut: '07:15',
      quality: 4,
      notes: 'Dormí bien',
    });
    // Se guarda automáticamente en AsyncStorage
  };

  // Ver estadísticas
  console.log(`Promedio: ${metrics.averageSleep} horas`);
  console.log(`Meta cumplida: ${metrics.goalMet}`);
  console.log(`Últimos 7 días:`, last7Days);

  return null;
};
```

---

## 🎨 UI/UX Details

### SleepTracker (Formulario)
- Cards blancos con bordes sutiles (border-gray-100)
- Input fields con estilo limpio (bg-gray-50)
- Botones de calidad: indigo-600 cuando seleccionado
- Mensajes de validación tipo Alert
- Botón submit con color indigo-600

### HealthStats (Gráficos)
- KPI cards (4 en grid 2x2): Promedio, Meta, Racha, Registros
- Cada card muestra ícono, número grande, descripción
- Gráfico de últimos 7 días: barra de progreso + emoji de calidad
- Fechas en formato: "Lun, Feb 15" (locale es-ES)
- Colors: Verde (bueno), Amarillo (regular), Rojo (malo)

### Empty State
Si no hay registros, muestra mensaje simpático:
```
📭 No hay tareas pendientes
⬆️ Comienza a registrar tu sueño arriba para ver estadísticas
```

---

## 🔄 Integración con Global State (AppContext)

El Health Store es **independiente**, pero puedes integrarlo:

```typescript
// En cualquier componente:
const { user, userStats, updateUserStats } = useAppContext();
const { metrics } = useHealthStore();

// Actualizar stats global con datos de sueño
useEffect(() => {
  updateUserStats({
    averageSleep: metrics.averageSleep,
    consecutiveDays: metrics.consecutiveDays,
  });
}, [metrics]);
```

---

## 🚀 Próximo Paso: PASO 3 (Servicios de IA & Coach)

El módulo Health está **completamente funcional offline**. 

En el PASO 3 crearemos:
1. **aiService.ts** - Integración con OpenAI/Gemini
2. **coach.store.ts** - Store para conversaciones
3. **coachPrompts.ts** - System prompts personalizados
4. **CoachScreen.tsx** - Chat UI
5. **useCoachAI.ts** - Hook de integración

El Coach accederá a:
- Datos de tareas (tasks.store)
- Datos de sueño (health.store)
- Datos globales (AppContext)

Y ofrecerá recomendaciones empáticas basadas en contexto 🤖💡

---

## ✅ Checklist PASO 2

- [x] Types (SleepRecord, HealthMetrics, HealthState)
- [x] Store (Zustand + AsyncStorage persist)
- [x] Formulario SleepTracker
- [x] Dashboard HealthStats
- [x] Pantalla principal HealthScreen
- [x] Cálculos: horas, meta, racha, últimos 7 días
- [x] Navigation integrado (TabNavigator)
- [x] Validación de inputs
- [x] Empty states
- [x] TypeScript estricto
- [x] NativeWind styling

---

## 🎓 Aprendizajes Clave

1. **Cálculo de horas con medianoche**: Validar si timeOut < timeIn
2. **Métrica de racha**: Iterar desde fecha más reciente hacia atrás
3. **Últimos 7 días**: Crear array de fechas retrasadas
4. **AsyncStorage + Zustand**: Persist middleware automático
5. **Validación robusta**: Regex para HH:MM format

---

**¿Listo para PASO 3: Integración de IA & Agente Coach?** 🤖
