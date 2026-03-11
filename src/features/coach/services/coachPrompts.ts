import { UserStats } from '@/types';

// Context enrichment types
export interface AuditContext {
  totalMinutesLost: number;
  averagePerDay: number;
  topCategory?: string | null;
  weeklyTrend: 'improving' | 'declining' | 'stable';
  focusScore: number;
}

// University context type
export interface UniversityContext {
  totalSubjects: number;
  totalCredits: number;
  weeklyStudyHoursNeeded: number;
  weeklyStudyHoursCompleted: number;
  isEvaluationWeek: boolean;
  isPreEvaluationWeek: boolean;
  daysUntilNextEvaluation: number;
  cutPeriod: 'corte1' | 'corte2' | 'corte3';
  studyDeficit: number; // hours behind schedule
  classesToday: number;
  studyBlocksToday: number;
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
 * Construir contexto personalizado basado en estadísticas del usuario + auditoría + universidad
 */
export function buildContextualPrompt(
  userStats: UserStats, 
  auditContext?: AuditContext,
  universityContext?: UniversityContext
): string {
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

  // Incluir problemas académicos si hay contexto universitario
  if (universityContext && universityContext.totalSubjects > 0) {
    if (universityContext.isEvaluationWeek) {
      issues.push('🚨 SEMANA DE EXÁMENES - prioridad máxima en estudio');
    } else if (universityContext.isPreEvaluationWeek) {
      issues.push('⚠️ PRE-EXÁMENES - intensificar estudio esta semana');
    } else if (universityContext.daysUntilNextEvaluation > 0 && universityContext.daysUntilNextEvaluation <= 7) {
      issues.push(`Solo ${universityContext.daysUntilNextEvaluation} días para exámenes`);
    }
    
    if (universityContext.studyDeficit > 2) {
      issues.push(`Déficit de ${universityContext.studyDeficit.toFixed(1)}h de estudio esta semana`);
    }
    
    const studyCompletionRate = universityContext.weeklyStudyHoursNeeded > 0 
      ? (universityContext.weeklyStudyHoursCompleted / universityContext.weeklyStudyHoursNeeded) * 100 
      : 0;
    if (studyCompletionRate < 50 && universityContext.weeklyStudyHoursNeeded > 5) {
      issues.push('Progreso de estudio semanal bajo');
    }
  }

  const problemStatement =
    issues.length > 0 ? `Problemas detectados: ${issues.join(', ')}.` : 'Las métricas se ven bien.';

  let universitySection = '';
  if (universityContext && universityContext.totalSubjects > 0) {
    const cutLabel = universityContext.cutPeriod === 'corte1' ? 'Primer' : universityContext.cutPeriod === 'corte2' ? 'Segundo' : 'Tercer';
    universitySection = `
- CONTEXTO UNIVERSITARIO (Semestre 2026-1):
  * Materias: ${universityContext.totalSubjects} (${universityContext.totalCredits} créditos)
  * Corte actual: ${cutLabel} Corte
  * Horas de estudio: ${universityContext.weeklyStudyHoursCompleted.toFixed(1)}/${universityContext.weeklyStudyHoursNeeded.toFixed(1)}h semanales
  * Déficit: ${universityContext.studyDeficit > 0 ? universityContext.studyDeficit.toFixed(1) + 'h' : 'Ninguno ✅'}
  * Hoy: ${universityContext.classesToday} clases, ${universityContext.studyBlocksToday} bloques de estudio
  ${universityContext.isEvaluationWeek ? '* ⚠️ SEMANA DE EVALUACIONES - Modo intensivo x1.5' : ''}
  ${universityContext.isPreEvaluationWeek ? '* ⚠️ PRE-EVALUACIÓN - Modo preparación x1.25' : ''}
  ${universityContext.daysUntilNextEvaluation > 0 && universityContext.daysUntilNextEvaluation <= 14 ? `* ⏰ ${universityContext.daysUntilNextEvaluation} días para próximos exámenes` : ''}
`;
  }

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
}${universitySection}
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

  // ==============================================
  // PROMPTS ACADÉMICOS - Universidad
  // ==============================================
  
  // Semana de exámenes
  EVALUATION_WEEK_PROMPT: `🚨 ALERTA: El usuario está en SEMANA DE EXÁMENES.
Tono: Urgente pero motivador.
Mensaje: "Esta semana es crítica. Los exámenes definen tu corte. Cada hora cuenta."
Recordar: "En semana de evaluaciones, el factor de estudio es x1.5 - necesitas estudiar MÁS de lo normal."
Preguntas:
1. ¿Qué exámenes tienes esta semana y en qué orden?
2. ¿Has hecho un plan de repaso por materia?
Acción inmediata:
- Técnica Pomodoro intensiva: 45min estudio + 5min descanso
- Prioriza materias por fecha de examen y dificultad
- CERO distracciones: silencia TODO excepto emergencias
Cierre: "Después de los exámenes tendrás tiempo de descansar. Ahora, a enfocarte al 100%."`,

  // Pre-semana de exámenes  
  PRE_EVALUATION_PROMPT: `⚠️ PREPARACIÓN: Próxima semana hay exámenes.
Tono: Alerta preventiva pero constructiva.
Mensaje: "La próxima semana es de evaluaciones. Esta semana es tu última oportunidad de prepararte bien."
Recordar: "Factor de estudio x1.25 - es momento de intensificar, no de relajarte."
Checklist para el usuario:
1. ¿Tienes claro qué temas entran en cada examen?
2. ¿Has identificado tus puntos débiles por materia?
3. ¿Tienes material de estudio organizado?
Estrategia:
- Dedica 60% del tiempo a repasar conceptos
- 40% a resolver ejercicios/problemas tipo examen
- Haz simulacros cronometrados si es posible
Cierre: "Los estudiantes exitosos no esperan a la semana de exámenes para prepararse."`,

  // Déficit de estudio significativo
  STUDY_DEFICIT_PROMPT: `📉 PROBLEMA: El usuario tiene un déficit importante de horas de estudio.
Contexto: "Estás atrasado en tus horas de estudio semanal. Esto puede afectar tu rendimiento académico."
Análisis: Menciona específicamente cuántas horas faltan (el déficit).
Preguntas diagnóstico:
1. ¿Qué te está impidiendo cumplir tus bloques de estudio?
2. ¿Los horarios generados se ajustan a tu disponibilidad real?
Solución práctica:
- Reevalúa tu agenda: ¿hay bloques que puedas mover?
- Técnica de "estudio fragmentado": 20min extra aquí y allá suman
- Esta semana, prioriza las materias con más créditos
Recordar la fórmula: "1 crédito = 48h totales / 16 semanas = 3h/semana (clase + independiente)"`,

  // Buen progreso académico
  ACADEMIC_MOMENTUM_PROMPT: `🎓 EXCELENTE: El usuario mantiene buen ritmo de estudio.
Celebrar: "¡Tu progreso académico es excelente! Estás cumpliendo tus metas de estudio."
Estadísticas: Menciona horas completadas vs requeridas.
Motivación: "Los estudiantes que mantienen un ritmo constante tienen mejor retención a largo plazo."
Siguiente nivel:
1. Considera agregar 30min de repaso activo (flashcards, resúmenes)
2. Ayuda a compañeros - enseñar es la mejor forma de aprender
3. Mantén el balance: estudio + descanso = rendimiento sostenible
Cierre: "Sigue así y los exámenes no serán un problema."`,

  // Pocas clases hoy - oportunidad de estudio
  STUDY_OPPORTUNITY_PROMPT: `📚 OPORTUNIDAD: El usuario tiene pocas clases hoy.
Contexto: "Hoy tienes menos carga de clases. Es una excelente oportunidad para adelantar estudio."
Sugerencias organizadas por tiempo disponible:
- Si tienes 1-2h: Repaso rápido de la materia más compleja
- Si tienes 3-4h: Bloque de estudio profundo + ejercicios
- Si tienes 5h+: Combina estudio con tareas/proyectos pendientes
Recordar: "Las horas 'libres' son oro para un estudiante organizado."
Técnica: "Bloque de 90min enfocado → 15min pausa → Repetir"`,
};

/**
 * Función para seleccionar el prompt más relevante
 */
export function selectCoachPrompt(
  userStats: UserStats, 
  auditContext?: AuditContext,
  universityContext?: UniversityContext
): string {
  const { completedTasks, totalTasks, averageSleep, totalDistractions, failedTasks } = userStats;

  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  // PRIORIDAD 1: Contexto universitario crítico (semanas de evaluación)
  if (universityContext && universityContext.totalSubjects > 0) {
    if (universityContext.isEvaluationWeek) {
      return SPECIFIC_PROMPTS.EVALUATION_WEEK_PROMPT;
    }
    if (universityContext.isPreEvaluationWeek) {
      return SPECIFIC_PROMPTS.PRE_EVALUATION_PROMPT;
    }
    // Demasiado cerca de exámenes
    if (universityContext.daysUntilNextEvaluation > 0 && universityContext.daysUntilNextEvaluation <= 3) {
      return SPECIFIC_PROMPTS.EVALUATION_WEEK_PROMPT;
    }
  }

  // PRIORIDAD 2: Problemas de enfoque muy graves (Focus Score crítico)
  if (auditContext && auditContext.focusScore < 30) {
    return SPECIFIC_PROMPTS.SEVERE_DISTRACTION_PROMPT;
  }

  // PRIORIDAD 3: Sueño muy bajo (afecta todo)
  if (averageSleep < 6.5) {
    return SPECIFIC_PROMPTS.SLEEP_DEFICIT_PROMPT;
  }

  // PRIORIDAD 4: Déficit de estudio académico significativo
  if (universityContext && universityContext.totalSubjects > 0 && universityContext.studyDeficit > 3) {
    return SPECIFIC_PROMPTS.STUDY_DEFICIT_PROMPT;
  }

  // PRIORIDAD 5: Procrastinación severa
  if (failedTasks > completedTasks && totalTasks > 5) {
    return SPECIFIC_PROMPTS.PROCRASTINATION_PROMPT;
  }

  // PRIORIDAD 6: Buen momentum (celebrar)
  if (completionRate > 0.8 && averageSleep >= 7) {
    // Si además va bien en estudios, usar prompt académico positivo
    if (universityContext && universityContext.totalSubjects > 0 && universityContext.studyDeficit <= 0) {
      return SPECIFIC_PROMPTS.ACADEMIC_MOMENTUM_PROMPT;
    }
    return SPECIFIC_PROMPTS.MOMENTUM_PROMPT;
  }

  // PRIORIDAD 7: Tendencia de distracciones empeorando
  if (auditContext && auditContext.weeklyTrend === 'declining') {
    return SPECIFIC_PROMPTS.DISTRACTION_TREND_PROMPT;
  }

  // PRIORIDAD 8: Muchas distracciones
  if (totalDistractions > 15) {
    return SPECIFIC_PROMPTS.DISTRACTION_PROMPT;
  }

  // PRIORIDAD 9: Oportunidad de estudio (pocas clases hoy)
  if (universityContext && universityContext.totalSubjects > 0 && universityContext.classesToday <= 1) {
    return SPECIFIC_PROMPTS.STUDY_OPPORTUNITY_PROMPT;
  }

  // Default: contexto personalizado completo
  return buildContextualPrompt(userStats, auditContext, universityContext);
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
