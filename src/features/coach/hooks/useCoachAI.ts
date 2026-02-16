import { useCallback, useEffect, useMemo } from 'react';
import { useCoachStore } from '../coach.store';
import { useAppContext } from '@/shared/context/AppContext';
import { useTaskStore } from '@/features/tasks/tasks.store';
import { useHealthStore } from '@/features/health/health.store';
import { useAuditLogger } from '@/features/audit/hooks/useAuditLogger';
import { callAI, AIMessage } from '@/services/api/aiService';
import { COACH_SYSTEM_PROMPT, selectCoachPrompt } from '../services/coachPrompts';

export function useCoachAI() {
  const { addMessage, messages, setLoading } = useCoachStore();
  const { userStats } = useAppContext();
  const { tasks } = useTaskStore();
  const { metrics } = useHealthStore();
  const { getFocusScore, distractionSummary } = useAuditLogger();

  // Crear sesión si no existe
  useEffect(() => {
    // Sesión se maneja automáticamente en el store
  }, []);

  /**
   * Enriquecer estadísticas del usuario con datos de stores
   */
  const enrichedUserStats = useMemo(
    () => ({
      ...userStats,
      tasksCompleted: tasks.filter((t) => t.completed).length,
      tasksFailed: tasks.filter((t) => !t.completed).length,
      totalTasks: tasks.length,
      averageSleep: metrics.averageSleep,
    }),
    [userStats, tasks, metrics]
  );

  /**
   * Contexto de auditoría para prompts
   */
  const auditContext = useMemo(
    () => ({
      ...distractionSummary,
      focusScore: getFocusScore(),
    }),
    [distractionSummary, getFocusScore]
  );

  /**
   * Enviar mensaje al coach y obtener respuesta
   */
  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return;

      // Limpiar espacios
      const cleanMessage = userMessage.trim();

      // 1. Agregar mensaje del usuario al chat
      addMessage(cleanMessage, 'user');
      setLoading(true);

      try {
        // 2. Construir contexto personalizado - ahora con datos de auditoría
        // Usar selectCoachPrompt para elegir el prompt más adecuado automáticamente
        const contextPrompt = selectCoachPrompt(enrichedUserStats, auditContext);

        // 3. Construir array de mensajes para la IA
        const messages: AIMessage[] = [
          {
            role: 'user',
            content: `${COACH_SYSTEM_PROMPT}\n\n${contextPrompt}\n\nMensaje del usuario: "${cleanMessage}"`,
          },
        ];

        // Incluir historial de conversación (últimos 5 mensajes para context window)
        if (messages.length > 0) {
          const conversationHistory = messages.slice(-5).map((msg: any) => ({
            role: msg.role,
            content: msg.text,
          }));

          messages.unshift(...conversationHistory);
        }

        // 4. Llamar a IA
        const response = await callAI(messages);

        // 5. Manejar respuesta
        if (response.success && response.content) {
          addMessage(response.content, 'assistant');
        } else {
          const errorMessage =
            response.error ||
            'Hubo un problema conectando con el Coach. Intenta de nuevo.';
          addMessage(`❌ ${errorMessage}`, 'assistant');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        addMessage(`❌ Error: ${errorMessage}`, 'assistant');
      } finally {
        setLoading(false);
      }
    },
    [addMessage, setLoading, enrichedUserStats, auditContext, messages]
  );

  /**
   * Iniciar conversación con saludo personalizado
   */
  const startConversation = useCallback(async () => {
    if (messages.length > 0) return; // Ya hay conversación

    setLoading(true);

    try {
      let greeting = `Hola, soy tu Coach de Vida. Estoy aquí para ayudarte a ser más productivo y saludable.`;

      // Personalizar saludo según datos
      if (enrichedUserStats.tasksCompleted > 0) {
        greeting = `Veo que completaste ${enrichedUserStats.tasksCompleted} tareas. ¿En qué te puedo ayudar hoy?`;
      }

      // Si el focus score es muy bajo, iniciar con advertencia
      if (auditContext.focusScore < 50) {
        greeting = `Noto que tienes muchas distracciones (Focus: ${auditContext.focusScore}/100). Hoy vamos a trabajar en recuperar tu enfoque. ¿Empezamos?`;
      }

      addMessage(greeting, 'assistant');
    } finally {
      setLoading(false);
    }
  }, [messages.length, enrichedUserStats, auditContext, addMessage, setLoading]);

  return {
    sendMessage,
    startConversation,
    enrichedUserStats,
    messages: messages,
  };
}

/**
 * EJEMPLO DE USO:
 * 
 * import { useCoachAI } from '@/features/coach/hooks/useCoachAI';
 * 
 * export const CoachScreen = () => {
 *   const { sendMessage, startConversation, messages } = useCoachAI();
 * 
 *   useEffect(() => {
 *     startConversation();
 *   }, []);
 * 
 *   const handleSendMessage = (text: string) => {
 *     sendMessage(text);
 *   };
 * 
 *   return (
 *     <View>
 *       {messages.map((msg) => (
 *         <Text key={msg.id}>
 *           {msg.role === 'user' ? 'Tú: ' : 'Coach: '}
 *           {msg.content}
 *         </Text>
 *       ))}
 *     </View>
 *   );
 * };
 * 
 * NOTA: El hook ahora automáticamente:
 * 1. Enriquece userStats con datos de tasks, health, audit
 * 2. Construye auditContext con distractionSummary + focusScore
 * 3. Usa selectCoachPrompt para elegir automáticamente el mejor prompt
 * 4. Personaliza el saludo inicial basado en focus score y tareas completadas
 */
