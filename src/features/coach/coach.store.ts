import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  clearChat: () => void;
  setLoading: (loading: boolean) => void;
}

export const useCoachStore = create<CoachStore>()(
  persist(
    (set) => ({
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
