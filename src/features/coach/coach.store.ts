import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendMessageToGemini } from '@/services/api/geminiService';

export interface CoachMessageItem {
  id: string;
  text: string;
  role: 'user' | 'system' | 'assistant';
  createdAt: number;
}

export interface CoachStore {
  // Estado
  messages: CoachMessageItem[];
  isLoading: boolean;

  // Acciones
  addMessage: (text: string, role: 'user' | 'system' | 'assistant') => void;
  askCoach: (userMessage: string) => Promise<void>;
  clearChat: () => void;
  setLoading: (loading: boolean) => void;
}

export const useCoachStore = create<CoachStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,

      addMessage: (text: string, role: 'user' | 'system' | 'assistant') => {
        const message: CoachMessageItem = {
          id: Date.now().toString(),
          text,
          role,
          createdAt: Date.now(),
        };

        set((state) => ({
          messages: [...state.messages, message],
        }));
      },

      /**
       * Envía un mensaje al usuario y obtiene respuesta inteligente de Gemini
       */
      askCoach: async (userMessage: string) => {
        if (!userMessage.trim()) return;

        // 1. Agregar mensaje del usuario al chat
        get().addMessage(userMessage, 'user');
        set({ isLoading: true });

        try {
          // 2. Llamar a Gemini API
          const response = await sendMessageToGemini(userMessage);

          // 3. Procesar respuesta
          if (response.success && response.content) {
            get().addMessage(response.content, 'assistant');
          } else {
            // Si falla, agregar mensaje de error
            const errorMsg = response.error || 'No pude procesar tu solicitud. Intenta de nuevo.';
            get().addMessage(`❌ ${errorMsg}`, 'assistant');
          }
        } catch (error) {
          console.error('Error en askCoach:', error);
          get().addMessage('❌ Error inesperado. Verifique su conexión a internet.', 'assistant');
        } finally {
          set({ isLoading: false });
        }
      },

      clearChat: () => {
        set({ messages: [] });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'coach-chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
