import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendMessageToGemini, ToolCall } from '@/services/api/geminiService';
import { useTasksStore } from '@/store/tasks.store';
import { useScheduleStore, SCHEDULE_COLORS } from '@/store/schedule.store';

// --- Types ---
export interface ActionResult {
  tool: string;
  label: string;
  success: boolean;
}

export interface CoachMessageItem {
  id: string;
  text: string;
  role: 'user' | 'system' | 'assistant';
  createdAt: number;
  actions?: ActionResult[];   // Acciones ejecutadas por la IA en este mensaje
}

export interface CoachStore {
  messages: CoachMessageItem[];
  isLoading: boolean;

  addMessage: (text: string, role: 'user' | 'system' | 'assistant', actions?: ActionResult[]) => void;
  askCoach: (userMessage: string) => Promise<void>;
  clearChat: () => void;
  setLoading: (loading: boolean) => void;
}

// --- Ejecutor de herramientas ---
const executeToolCall = (toolCall: ToolCall): ActionResult => {
  try {
    switch (toolCall.name) {
      case 'add_habit': {
        const { title, category, frequency, reminderTime } = toolCall.args;
        useTasksStore.getState().addTask({
          title: title || 'Nuevo hábito',
          category: category || 'carrera',
          frequency: frequency || 'daily',
          reminderTime: reminderTime,
          priority: 'normal',
          tag: 'personal',
        });
        return {
          tool: 'add_habit',
          label: `Hábito "${title}" añadido`,
          success: true,
        };
      }

      case 'add_schedule_block': {
        const { title, dayIndex, startHour, duration } = toolCall.args;
        const colorIdx = useScheduleStore.getState().blocks.length % SCHEDULE_COLORS.length;
        useScheduleStore.getState().addBlock({
          title: title || 'Nuevo bloque',
          dayIndex: dayIndex ?? new Date().getDay(),
          startHour: startHour ?? 9,
          duration: duration ?? 1,
          color: SCHEDULE_COLORS[colorIdx],
          type: 'class',
          completed: false,
        });
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return {
          tool: 'add_schedule_block',
          label: `"${title}" agendado el ${dias[dayIndex ?? 0]} a las ${Math.floor(startHour)}:${String(Math.round((startHour % 1) * 60)).padStart(2, '0')}`,
          success: true,
        };
      }

      default:
        return { tool: toolCall.name, label: `Herramienta desconocida: ${toolCall.name}`, success: false };
    }
  } catch (e: any) {
    console.error('Error ejecutando tool:', e);
    return { tool: toolCall.name, label: `Error: ${e.message}`, success: false };
  }
};

// --- Store ---
export const useCoachStore = create<CoachStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,

      addMessage: (text, role, actions) => {
        const message: CoachMessageItem = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          text,
          role,
          createdAt: Date.now(),
          actions,
        };
        set((state) => ({
          messages: [...state.messages, message],
        }));
      },

      askCoach: async (userMessage: string) => {
        if (!userMessage.trim()) return;

        // 1. Agregar msg del usuario
        get().addMessage(userMessage, 'user');
        set({ isLoading: true });

        try {
          // 2. Preparar historial (excluir el msg recién agregado para evitar duplicar)
          const allMsgs = get().messages;
          const history = allMsgs
            .slice(-21, -1) // Últimos 20 ANTERIORES al que acabamos de agregar
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role as 'user' | 'assistant', text: m.text }));

          // 3. Llamar a Gemini con historial
          const response = await sendMessageToGemini(history, userMessage);

          // 4. Ejecutar tool calls si los hay
          let actions: ActionResult[] | undefined;
          if (response.toolCalls && response.toolCalls.length > 0) {
            actions = response.toolCalls.map(executeToolCall);
          }

          // 5. Agregar respuesta del coach
          get().addMessage(response.text, 'assistant', actions);
        } catch (error) {
          console.error('Error en askCoach:', error);
          get().addMessage('❌ Error inesperado. Verifica tu conexión a internet.', 'assistant');
        } finally {
          set({ isLoading: false });
        }
      },

      clearChat: () => set({ messages: [] }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'coach-chat-v2-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
