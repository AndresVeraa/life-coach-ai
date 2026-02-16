import { UserStats } from '@/types';

// Context enrichment types
export interface AuditContext {
  totalMinutesLost: number;
  averagePerDay: number;
  topCategory?: string | null;
  weeklyTrend: 'improving' | 'declining' | 'stable';
  focusScore: number;
}

/**
 * System Prompt Base para el Coach IA
 * Define la personalidad y comportamiento del agente
 */
export const COACH_SYSTEM_PROMPT = `Eres un Coach de Vida empático pero firme. Tu rol es ayudar al usuario a ser más productivo y saludable.

DIRECTRICES:
1. Sé conciso (máximo 150 palabras por respuesta)
2. Usa un tono cálido pero directo - no azucarado
3. Ofrece recomendaciones accionables específicamente
4. Si detectas patrones de comportamiento negativo, señálalo con firmeza pero respeto
5. Cuando el usuario logra metas, celebra con entusiasmo
6. Responde siempre en español
7. Haz preguntas de seguimiento para entender mejor

Tu objetivo es ser un aliado que empuja al usuario hacia sus mejores versiones.`;

/**
 * Construir contexto personalizado basado en estadísticas del usuario + auditoría
 */
export function buildContextualPrompt(userStats: UserStats, auditContext?: AuditContext): string {
  const {
    totalTasks,
    completedTasks,
    failedTasks,
    tasksToday,
    completedToday,
    averageSleep,
    totalDistractions,
  } = userStats;

  const completionRateNum = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const todayCompletionRateNum = tasksToday > 0 ? (completedToday / tasksToday) * 100 : 0;
  const completionRate = completionRateNum.toFixed(1);
  const todayCompletionRate = todayCompletionRateNum.toFixed(1);

  // Detectar problemas clave
  const issues: string[] = [];

  if (completionRateNum < 50) {
    issues.push('Baja tasa de completitud de tareas');
  }
  if (averageSleep < 7) {
    issues.push('Durmiendo menos de 7 horas (meta: 8 horas)');
  }
  if (totalDistractions > 10) {
    issues.push('Muchas distracciones reportadas');
  }
  if (failedTasks > completedTasks && totalTasks > 5) {
    issues.push('Más tareas fallidas que completadas');
  }
  
  // Incluir problemas derivados de auditoría si está disponible
  if (auditContext) {
    if (auditContext.weeklyTrend === 'declining') {
      issues.push('Tendencia de distracciones aumentando esta semana');
    }
    if (auditContext.focusScore < 50) {
      issues.push('Puntuación de enfoque baja (demasiadas distracciones)');
    }
  }

  const problemStatement =
    issues.length > 0 ? `Problemas detectados: ${issues.join(', ')}.` : 'Las métricas se ven bien.';

  return `
CONTEXTO DEL USUARIO (para personalizar tu respuesta):
- Tareas totales: ${totalTasks} (${completedTasks} completadas, ${failedTasks} fallidas)
- Tasa de completitud: ${completionRate}%
- Hoy: ${completedToday}/${tasksToday} tareas completadas (${todayCompletionRate}%)
- Sueño promedio: ${averageSleep} horas/noche
- Distracciones registradas: ${totalDistractions}
${
  auditContext
    ? `
- AUDITORÍA DE TIEMPO:
  * Minutos perdidos: ${auditContext.totalMinutesLost} total (promedio ${auditContext.averagePerDay}min/día)
  * Categoría principal: ${auditContext.topCategory || 'Sin datos'}
  * Tendencia semanal: ${auditContext.weeklyTrend === 'improving' ? '📈 Mejorando' : auditContext.weeklyTrend === 'declining' ? '📉 Empeorando' : '➡️ Estable'}
  * Puntuación de enfoque: ${auditContext.focusScore}/100
`
    : ''
}
${problemStatement}

Basándote en estos datos, responde de forma personalizada. Si el usuario está luchando, ofrece un pequeño paso concreto para hoy. Si está bien, motívalo a mantener la racha.`;
}

/**
 * Ejemplos de prompts específicos por situación
 */
export const SPECIFIC_PROMPTS = {
  // Cuando falla mucho
  PROCRASTINATION_PROMPT: `El usuario está procrastinando mucho (más tareas fallidas que completadas).
Pregúntale: ¿Qué es lo que hace que evites estas tareas? ¿Es miedo, pereza, o no sabes por dónde empezar?
Luego, sugiere el "método de los 2 minutos": comprometerse a trabajar solo 2 minutos en una tarea.`,

  // Cuando duerme poco
  SLEEP_DEFICIT_PROMPT: `El usuario está durmiendo menos de 7 horas (crítico para productividad).
Sé firme: "El sueño no es un lujo, es una herramienta para ser más productivo."
Pregunta: ¿A qué hora duermes? ¿Qué te impide acostarte antes?
Sugiere: Una de estas 3 cosas hoy: caféina cero después de las 2pm, 10min de respiración antes de dormir, o apagar pantalla 30min antes.`,

  // Cuando va bien
  MOMENTUM_PROMPT: `El usuario tiene momentum positivo (tareas completadas, buen sueño).
Celebra específicamente: "Veo que completaste X tareas hoy y dormiste Y horas. Eso es excelente."
Pregunta: ¿Qué harás para mantener esta racha?
Sugerencia: Sigue con lo que funciona, pero agrega una pequeña mejora (ej: si completaste 5/6, mañana intenta 6/6).`,

  // Cuando hay muchas distracciones
  DISTRACTION_PROMPT: `El usuario está reportando muchas distracciones (${50} eventos registrados).
Sé directo: "Las distracciones son el enemigo #1 de la productividad."
Pregunta: ¿Cuáles son las Top 3 distracciones? (redes sociales, notificaciones, personas, etc)
Idea: Implementar bloques de 25min sin distracciones (Pomodoro) para 1 tarea importante hoy.`,

  // Cuando el enfoque está CRÍTICO (Focus Score < 30)
  SEVERE_DISTRACTION_PROMPT: `⚠️ ALERTA: El usuario está perdiendo MUCHO tiempo en distracciones (Focus Score muy bajo).
Sé firme y directo: "Tus distracciones están saboteando tu productividad. Esto debe cambiar HOY."
Pregunta específica: ¿Qué distracción te está consumiendo más tiempo? (Basándote en sus datos)
Acción inmediata: Bloquea esa app/website POR COMPLETO durante 8 horas hoy. 
Si es redes sociales: Desinstala la app. Si es trabajo: Timer de 45min enfocado + 5min break.
Cierre: "Mañana vamos a celebrar haber roto este ciclo."`,

  // Cuando la tendencia de distracciones está empeorando
  DISTRACTION_TREND_PROMPT: `El usuario está perdiendo CADA VEZ MÁS tiempo en distracciones (tendencia a la baja).
Contexto: "He notado que cada día estás más distraído que el anterior. Esto es preocupante porque afecta TODO."
Pregunta de diagnóstico: ¿Qué cambió esta semana? ¿Más estrés, menos sueño, cambio en rutina?
Solución: Vuelve a lo básico:
1. Identifica qué distracción creció (la más problemática)
2. Crea una barrera física/digital para esa distracción hoy
3. Registra cuánto tiempo ahorras - vamos a celebrarlo"`,

  // Resumen diario (end-of-day)
  DAILY_SUMMARY_PROMPT: `Haz un breve resumen del día del usuario:
- Cuántas tareas completó vs planeadas
- Horas de sueño la noche anterior
- Distracciones en el día
Luego: "Mañana, tu meta es [sugerencia específica]."`,

  // Para recomendaciones de libros/hábitos
  INSPIRATION_PROMPT: `Basándote en los problemas del usuario, recomienda:
1. UN libro específico (que aborde exactamente su problema)
2. UN hábito pequeño para implementar mañana (máximo 5 minutos)
Formato:
📚 Libro: [Título] - [Razón específica por qué le ayudará]
🎯 Hábito: [Descripción] - [Cómo hacerlo mañana inmediatamente]`,
};

/**
 * Función para seleccionar el prompt más relevante
 */
export function selectCoachPrompt(userStats: UserStats, auditContext?: AuditContext): string {
  const { completedTasks, totalTasks, averageSleep, totalDistractions, failedTasks } = userStats;

  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  // Prioridad de problemas - auditoría primero si está muy mal el enfoque
  if (auditContext && auditContext.focusScore < 30) {
    return SPECIFIC_PROMPTS.SEVERE_DISTRACTION_PROMPT;
  }

  // Luego otros Critical issues
  if (averageSleep < 6.5) {
    return SPECIFIC_PROMPTS.SLEEP_DEFICIT_PROMPT;
  }

  if (failedTasks > completedTasks && totalTasks > 5) {
    return SPECIFIC_PROMPTS.PROCRASTINATION_PROMPT;
  }

  if (completionRate > 0.8 && averageSleep >= 7) {
    return SPECIFIC_PROMPTS.MOMENTUM_PROMPT;
  }

  if (auditContext && auditContext.weeklyTrend === 'declining') {
    return SPECIFIC_PROMPTS.DISTRACTION_TREND_PROMPT;
  }

  if (totalDistractions > 15) {
    return SPECIFIC_PROMPTS.DISTRACTION_PROMPT;
  }

  // Default: contexto personalizado
  return buildContextualPrompt(userStats, auditContext);
}

/**
 * EJEMPLO DE USO:
 * 
 * import { COACH_SYSTEM_PROMPT, buildContextualPrompt, selectCoachPrompt } from '@/features/coach/services/coachPrompts';
 * import { useAppContext } from '@/shared/context/AppContext';
 * import { useAuditLogger } from '@/features/audit/hooks/useAuditLogger';
 * 
 * const MyComponent = () => {
 *   const { userStats } = useAppContext();
 *   const { 
 *     getFocusScore, 
 *     distractionSummary 
 *   } = useAuditLogger();
 *   
 *   // Construir contexto de auditoría
 *   const auditContext = {
 *     ...distractionSummary,
 *     focusScore: getFocusScore(),
 *   };
 *   
 *   // Obtener prompt personalizado con datos de auditoría
 *   const contextPrompt = buildContextualPrompt(userStats, auditContext);
 *   console.log(contextPrompt);
 *   
 *   // O seleccionar automáticamente el más relevante (prioriza auditoría)
 *   const smartPrompt = selectCoachPrompt(userStats, auditContext);
 * };
 */
