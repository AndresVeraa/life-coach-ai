# Universidad + Calendario Académico - Módulo Completo

## 📋 Resumen

Se ha implementado el módulo completo de **Universidad + Calendario Académico** para el semestre 2026-1, integrado con el sistema de Life Coach AI.

## ✅ Archivos Creados

### Tipos
- **`src/types/university.types.ts`** - Definiciones TypeScript completas:
  - Tipos: `DayOfWeek`, `SubjectType`, `BlockType`, `CutPeriod`, `AlertLevel`
  - Interfaces: `Subject`, `ClassSession`, `StudyBlock`, `AcademicEvent`, `WeeklyStudySummary`
  - Constantes: `ACADEMIC_CALENDAR_2026_1` (fechas del semestre, cortes, evaluaciones)
  - Helpers: `calculateWeeklyStudyHours()`, `adjustHoursForEvaluationWeek()`

### Store
- **`src/features/agenda/university.store.ts`** - Zustand store con:
  - Gestión de materias (CRUD)
  - Generación inteligente de plan de estudio (`generateSmartStudyPlan`)
  - Calendario académico precargado (2026-1)
  - Persistencia con AsyncStorage
  - Hooks helpers: `useCurrentWeekSummary()`, `useTodaySchedule()`, `useDaysUntilNextEvaluation()`

### Pantallas
- **`src/features/agenda/screens/UniversityScheduleScreen.tsx`** - Pantalla principal con:
  - Header con alertas de evaluación
  - Estadísticas rápidas
  - 3 tabs: Semana, Calendario, Materias

### Componentes
- **`src/features/agenda/components/WeeklyView.tsx`** - Vista semanal tipo Google Calendar
- **`src/features/agenda/components/CalendarView.tsx`** - Vista mensual con eventos
- **`src/features/agenda/components/SubjectsView.tsx`** - Lista de materias expandibles
- **`src/features/agenda/components/AddSubjectModal.tsx`** - Formulario para agregar materias
- **`src/features/agenda/components/UniversityWidget.tsx`** - Widget para Home screen
- **`src/features/agenda/components/index.ts`** - Exports
- **`src/features/agenda/index.ts`** - Feature exports

## ✅ Archivos Modificados

### Navegación
- **`src/navigation/AppNavigator.tsx`**
  - Añadido import de `UniversityScheduleScreen`
  - Añadida ruta `UniversitySchedule` al Stack.Navigator

### Home Screen
- **`src/screens/index.tsx`**
  - Añadido import de `UniversityWidget`
  - Widget integrado después del selector de días

### Coach IA
- **`src/features/coach/services/coachPrompts.ts`**
  - Nuevo tipo `UniversityContext`
  - `buildContextualPrompt()` ahora acepta contexto universitario
  - `selectCoachPrompt()` prioriza situaciones académicas críticas
  - Nuevos prompts específicos:
    - `EVALUATION_WEEK_PROMPT` - Semana de exámenes
    - `PRE_EVALUATION_PROMPT` - Pre-evaluación
    - `STUDY_DEFICIT_PROMPT` - Déficit de estudio
    - `ACADEMIC_MOMENTUM_PROMPT` - Buen progreso
    - `STUDY_OPPORTUNITY_PROMPT` - Oportunidad de estudio

## 🎓 Funcionalidades

### Calendario Académico 2026-1
- **Inicio:** 2 de marzo 2026
- **Fin:** 27 de junio 2026
- **Duración:** 16 semanas

### Cortes
| Corte | Período | Evaluaciones | Registro Notas |
|-------|---------|--------------|----------------|
| 1er | 2 mar - 18 abr | 13-18 abr | 21-24 abr |
| 2do | 21 abr - 23 may | 18-23 may | 25-28 may |
| 3er | 26 may - 27 jun | 22-27 jun | 30 jun - 3 jul |

### Cálculo de Horas de Estudio
```
horasEstudioSemanal = Math.ceil((créditos * 48 / 16) - horasClase)
```

### Multiplicadores por Semana
- **Semana de evaluaciones:** x1.5
- **Pre-evaluación:** x1.25
- **Normal:** x1.0

### Generación Inteligente de Plan
- Matemáticas/Técnicas → Mañanas (8-12h), bloques de 2h
- Teóricas/Humanísticas → Tardes (14-18h), bloques de 1h
- Repaso pre-examen → Noches (19-22h)
- Máximo 6h estudio/día
- Respeta horario de clases existente

## 🔗 Integración con Coach IA

El Coach ahora puede:
1. Detectar semanas de evaluación y dar consejos urgentes
2. Alertar sobre déficit de estudio
3. Celebrar buen progreso académico
4. Sugerir aprovechamiento de días con pocas clases
5. Personalizar respuestas según el corte actual

## 📱 Uso

1. Desde Home, tocar el widget "🎓 Universidad"
2. O navegar directamente a la pantalla
3. Agregar materias con el botón "+"
4. El sistema calculará automáticamente las horas de estudio necesarias
5. Usar "Generar Plan de Estudio IA" para crear bloques optimizados
6. Marcar bloques completados tocando sobre ellos

## 🛠️ Próximos Pasos Sugeridos

1. [ ] Notificaciones push para recordar bloques de estudio
2. [ ] Integración con Google Calendar / Apple Calendar
3. [ ] Estadísticas de rendimiento por materia
4. [ ] Recomendación de técnicas de estudio por tipo de materia
5. [ ] Widget en pantalla de bloqueo (iOS/Android)
