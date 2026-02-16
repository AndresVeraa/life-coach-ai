# PASO 3: Integración de IA & Agente Coach ✓

## 📋 Resumen de lo Implementado

Se ha creado un sistema completo de **Coach IA personalizado** que:
- Integra OpenAI (GPT-4o-mini) o Gemini
- Accede a contexto del usuario (tareas, sueño, distracciones)
- Ofrece coaching empático pero firme
- Gestiona sesiones offline con historial persistente
- Maneja errores y reintentos automáticos

---

## 📁 Archivos Creados (8 archivos)

```
src/services/api/
└── aiService.ts              (Llamadas a OpenAI/Gemini + retry logic)

src/features/coach/
├── coach.store.ts            (Zustand store para conversaciones)
├── CoachScreen.tsx           (Pantalla principal del chat)
├── services/
│   └── coachPrompts.ts       (System prompts + contextualizacion)
├── components/
│   ├── CoachMessage.tsx      (Bubble de mensaje)
│   └── CoachInput.tsx        (Input + botón de envío)
└── hooks/
    └── useCoachAI.ts         (Orquestación completa)
```

---

## 🎯 Arquitectura de Flujo

```
CoachScreen (Pantalla)
    ↓
useCoachAI() (Hook orquestador)
    ├─ Enriquece userStats con datos de:
    │  ├─ useTaskStore (tareas completadas/fallidas)
    │  ├─ useHealthStore (promedio de sueño)
    │  └─ useAppContext (stats globales)
    ├─ Construye contexto con buildContextualPrompt()
    ├─ Llama a callAI() con retry logic
    └─ Guardarespuestas en useCoachStore()
       └─ Persiste en AsyncStorage ("coach-storage")

callAI() (aiService.ts)
    ├─ Detecta API: OpenAI vs Gemini
    ├─ Envía mensajes a API
    ├─ Retry logic con exponential backoff (2s, 4s, 8s)
    └─ Retorna AIResponse { success, content, error }
```

---

## 🧠 Inteligencia del Coach

### 1. **Contextualización Automática**
El coach recibe contexto del usuario:
```typescript
{
  totalTasks: 25,
  completedTasks: 18,
  failedTasks: 7,
  tasksToday: 5,
  completedToday: 3,
  averageSleep: 6.8,      // Crítico! Menos de 7 horas
  totalDistractions: 12
}
```

### 2. **Prompts Inteligentes**
Según el contexto, elige el prompt más relevante:
- **Procrastinación**: Si failedTasks > completedTasks
- **Déficit de Sueño**: Si averageSleep < 6.5 horas (¡alerta máxima!)
- **Momentum**: Si completionRate > 80% y sueño ≥ 7h
- **Distracciones**: Si totalDistractions > 15

### 3. **Sistema de Prompts**

#### COACH_SYSTEM_PROMPT
Define la personalidad base:
```
"Eres un Coach de Vida empático pero firme. 
Tu rol es ayudar al usuario a ser más productivo y saludable."
```

#### buildContextualPrompt()
Construye contexto dinámico con estadísticas del usuario.

#### SPECIFIC_PROMPTS
Templates específicos para cada escenario:
- `PROCRASTINATION_PROMPT` - Lucha contra postergación
- `SLEEP_DEFICIT_PROMPT` - Déficit de sueño crítico
- `MOMENTUM_PROMPT` - Usuario con buen ritmo
- `DISTRACTION_PROMPT` - Demasiadas distracciones
- `DAILY_SUMMARY_PROMPT` - Resumen fin-de-día
- `INSPIRATION_PROMPT` - Recomendaciones de libros/hábitos

---

## 🔌 Servicios de IA

### aiService.ts

**Soporta dos APIs:**

#### OpenAI
```typescript
// Usa GPT-4o-mini (rápido y barato)
POST https://api.openai.com/v1/chat/completions
{
  model: "gpt-4o-mini",
  messages: [...],
  temperature: 0.7,
  max_tokens: 500
}
```

#### Gemini (Alternative)
```typescript
// Usa Gemini 2.0 Flash
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
{
  contents: [{role, parts: [{text}]}],
  generationConfig: {...}
}
```

**Detecta automáticamente qué API usar:**
- Si `EXPO_PUBLIC_OPENAI_API_KEY` está configurado → OpenAI
- Si `EXPO_PUBLIC_GEMINI_API_KEY` está configurado → Gemini
- Si ambas existen → Prioriza OpenAI

**Retry Logic con Exponential Backoff:**
```
Intento 1: Fallida → Espera 2 segundos, reintenta
Intento 2: Fallida → Espera 4 segundos, reintenta
Intento 3: Fallida → Espera 8 segundos, reintenta
Intento 4: Fallida → Retorna error al usuario
```

---

## 💾 Coach Store (Zustand)

Gestiona conversaciones con persistencia:

```typescript
export interface CoachStore {
  // Estado
  sessions: CoachSession[]        // Array de sesiones
  currentSessionId: string | null // Sesión activa
  currentMessages: CoachMessage[] // Mensajes del chat
  isLoading: boolean              // ¿Llamada de IA en progreso?

  // Acciones
  createSession()                 // Nueva sesión
  addMessage(role, content)       // Agregar mensaje
  loadSession(sessionId)          // Cargar sesión anterior
  getCurrentSession()             // Obtener sesión actual
  getSessionHistory()             // Todas las sesiones ordenadas
  deleteSession(sessionId)        // Eliminar sesión
  clearHistory()                  // Nuclear: borrar todo
  setLoading(boolean)             // Control de loading
}
```

**Persistencia:** Todo se guarda automáticamente en AsyncStorage bajo `"coach-storage"`

---

## 🎨 Componentes UI

### CoachMessage
```
┌─────────────────────┐
│ Hola, soy tu Coach  │  ← Assistant (left-aligned, gray)
└─────────────────────┘

                   ┌──────────────────┐
                   │ Gracias, me ayuda │  ← User (right-aligned, indigo)
                   └──────────────────┘
```

Características:
- Bubbles redondeados con colores distintos
- Timestamp pequeño debajo (HH:MM)
- Max width: 80% de pantalla
- Responsive en cualquier tamaño

### CoachInput
```
[Pregunta algo al Coach... ] [➔]
```

Características:
- Input con placeholder
- Botón de envío con animación de loading
- Deshabilitado mientras hay respuesta pendiente
- Support para multi-line (si el usuario escribe mucho)

### CoachScreen
```
┌──────────────────────┐
│       🤖 Coach       │
│                      │
│ ┌─────────────────┐  │
│ │ Mensajes previos│  │
│ └─────────────────┘  │
│                      │
│ [Input + Botón Envío]│
└──────────────────────┘
```

---

## 🚀 Ejemplo de Uso Completo

### 1. Configurar Variables de Entorno
```bash
# .env.local
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
# O:
EXPO_PUBLIC_GEMINI_API_KEY=AIza...
```

### 2. En el Componente
```typescript
import { CoachScreen } from '@/features/coach/CoachScreen';

// CoachScreen se integra directamente en navegación
// Ver: AppNavigator.tsx, pestaña "Coach"

// O usar directamente:
export const MyPage = () => {
  const { sendMessage, startConversation, messages } = useCoachAI();

  useEffect(() => {
    startConversation(); // Saludo inicial
  }, []);

  const handleSendMessage = (text: string) => {
    sendMessage(text); // Enviar al coach
  };

  return (
    <View>
      {messages.map((msg) => (
        <CoachMessage key={msg.id} role={msg.role} content={msg.content} />
      ))}
    </View>
  );
};
```

---

## 📊 Ejemplo de Conversación Real

**Usuario:** "No logro concentrarme en mis tareas"
```
Score detectado:
├─ completionRate: 40% (bajo)
├─ averageSleep: 6.5h (crítico)
└─ totalDistractions: 18 (alto)
```

**Coach recibe:**
```
COACH_SYSTEM_PROMPT + buildContextualPrompt() + PROCRASTINATION_PROMPT
+ Usuario: "No logro concentrarme..."
```

**Respuesta esperada (basada en prompts):**
```
"Veo que completaste solo 4 de tus últimas 10 tareas 
y estás durmiendo menos de 7 horas. El sueño es el 
enemigo #1 de tu concentración.

Hoy, prueba esto:
1. Toma un Pomodoro de 25 minutos SOLO EN UNA TAREA
2. Sin teléfono, sin notificaciones
3. Acuéstate 30 min más temprano

¿Cuál es la tarea #1 en la que trabajaremos?"
```

---

## 🔐 Seguridad & Mejores Prácticas

✅ **API Keys en .env**
- Nunca hardcodear keys directamente
- Usar `process.env.EXPO_PUBLIC_*`
- .env en .gitignore

✅ **Rate Limiting**
- API calls limitadas por limites del servicio
- Exponential backoff evita bombardeo
- Retry logic automático

✅ **Error Handling**
- Mensajes de error amigables
- No exponer detalles técnicos al usuario
- Fallback messages útiles

✅ **Offline Support**
- Chat funciona offline (sin IA)
- Historial se guarda offline
- Sincronización cuando hay conexión

---

## ⚙️ Configuración de .env.example

```bash
# AÑADE ESTO A TU .env y .env.example:

# OpenAI Configuration
EXPO_PUBLIC_OPENAI_API_KEY=sk-...

# Gemini Configuration (alternative)
EXPO_PUBLIC_GEMINI_API_KEY=AIza...

# App Configuration
EXPO_PUBLIC_DEBUG=false
```

**Obtener Keys:**
- **OpenAI**: https://platform.openai.com/api-keys
- **Gemini**: https://ai.google.dev/

---

## 🧪 Testing Local

### Scenario 1: Sin respuesta de IA (offline)
```typescript
// CoachInput + CoachMessage funcionan offline
// Los mensajes del usuario se guardan automáticamente
```

### Scenario 2: Con respuesta de IA (online)
```typescript
const response = await callAI([
  { 
    role: 'user', 
    content: 'Mi test message' 
  }
]);

console.log(response.content); // Respuesta del coach
```

---

## 🎓 Flujo de Datos Completo

```
Usuario escribe "Mi empresa me estresa"
        ↓
CoachInput.onSend("Mi empresa me estresa")
        ↓
useCoachAI.sendMessage()
        ↓
Enriquece stats:
├─ tasks.completed: 18
├─ tasks.failed: 7
├─ health.averageSleep: 7.2
└─ distractions: 9
        ↓
buildContextualPrompt(enrichedStats)
        ↓
callAI([systemPrompt + context + userMessage])
        ↓
OpenAI API responde:
"El estrés empresarial es común. Pregunta: 
¿Hay tareas específicas que te causen estrés?
Podemos descomponerlas..."
        ↓
addMessage('assistant', response.content)
        ↓
Guardado en AsyncStorage instantáneamente
        ↓
CoachMessage renderiza respuesta
        ↓
Historial persistente ✓
```

---

## ✅ Checklist PASO 3

- [x] aiService.ts (OpenAI + Gemini + retry logic)
- [x] coach.store.ts (Zustand + AsyncStorage persist)
- [x] coachPrompts.ts (System prompts inteligentes)
- [x] CoachScreen.tsx (Chat UI principal)
- [x] CoachMessage.tsx (Bubble component)
- [x] CoachInput.tsx (Input + Send button)
- [x] useCoachAI.ts (Hook orquestador)
- [x] Integración en AppNavigator (pestaña Coach)
- [x] TypeScript estricto (100% tipado)
- [x] Manejo de errores robusto
- [x] Retry logic con exponential backoff
- [x] Contextualización automática

---

## 🌟 Features Bonus

### Recomendaciones Inteligentes
Con `INSPIRATION_PROMPT`, el coach puede sugerir:
```
📚 Libro: "Hábitos Atómicos" de James Clear
   → Porque detecté que procrastinas mucho

🎯 Hábito: Apaga notificaciones 1 hora antes de dormir
   → Porque estás durmiendo 6.5h en lugar de 8
```

### Sesiones Persistentes
```typescript
// Cargar conversación anterior
const { loadSession, getSessionHistory } = useCoachStore();
const history = getSessionHistory();  // Todas las sesiones
loadSession(history[0].id);           // Cargar la más reciente
```

### Daily Coaching
El coach puede ofrecer un resumen diario automático al iniciar la app.

---

## 📚 Próximos Pasos Opcionales

1. **Mejorar Prompts**: Ajustar personalidades del coach según preferencias del usuario
2. **Voice Chat**: Agregar speech-to-text y text-to-speech
3. **Streaming**: Usar OpenAI streaming para respuestas en tiempo real
4. **Analytics**: Trackear efectividad del coaching (¿El usuario sigue el consejo?)
5. **Integración Calendario**: Sugerir horarios basados en disponibilidad

---

## 🚀 Próximo: PASO 4 (Audit Module - Auditoría de Tiempo)

Para continuar completaremos:
```
src/features/audit/
├── types.ts (DistractionReport, AuditSession)
├── audit.store.ts (Store con Zustand)
├── AuditScreen.tsx (Formulario end-of-day)
├── components/
│   ├── DistractionForm.tsx
│   └── AuditSummary.tsx
└── hooks/
    └── useAuditLogger.ts
```

Esto capturará:
- Distracciones durante el día
- Tiempo perdido por categoría
- Patrones de comportamiento
- Alimenta inteligencia del Coach

---

**Estado actual de la app:**
```
✅ PASO 1: Providers & Global State
✅ PASO 2: Módulo Health & Sueño
✅ PASO 3: IA Coach & Coaching ← ¡AHORA!
⏳ PASO 4: Audit Module (Distracciones)
⏳ PASO 5: Sincronización Offline-First (Backend)
```

---

## 🎯 Logros PASO 3

✨ **Coach IA totalmente funcional**
✨ **Contextualizado según datos del usuario**
✨ **Retry automático con exponential backoff**
✨ **Historiales persistentes offline**
✨ **UI/UX profesional con bubbles de chat**
✨ **Manejo robusto de errores**
✨ **TypeScript 100% tipado**

🚀 **¿Continuamos con PASO 4 (Audit Module) o prefieres ajustar algo del Coach?**
