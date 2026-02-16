import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CoachMessage } from '@/types';

export interface CoachSession {
  id: string;
  date: string; // ISO date
  messages: CoachMessage[];
  userContext: {
    tasksCompleted: number;
    tasksFailed: number;
    averageSleep: number;
    distractions: number;
  };
}

export interface CoachStore {
  // Estado
  sessions: CoachSession[];
  currentSessionId: string | null;
  currentMessages: CoachMessage[];
  isLoading: boolean;

  // Acciones
  createSession: () => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  loadSession: (sessionId: string) => void;
  getCurrentSession: () => CoachSession | null;
  getSessionHistory: () => CoachSession[];
  deleteSession: (sessionId: string) => void;
  clearHistory: () => void;
  setLoading: (loading: boolean) => void;
}

export const useCoachStore = create<CoachStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      currentMessages: [],
      isLoading: false,

      createSession: () => {
        const newSession: CoachSession = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          messages: [],
          userContext: {
            tasksCompleted: 0,
            tasksFailed: 0,
            averageSleep: 0,
            distractions: 0,
          },
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.id,
          currentMessages: [],
        }));
      },

      addMessage: (role: 'user' | 'assistant', content: string) => {
        const message: CoachMessage = {
          id: Date.now().toString(),
          role,
          content,
          timestamp: Date.now(),
        };

        set((state) => {
          const updatedMessages = [...state.currentMessages, message];
          const updatedSessions = state.sessions.map((session) =>
            session.id === state.currentSessionId
              ? { ...session, messages: updatedMessages }
              : session
          );

          return {
            currentMessages: updatedMessages,
            sessions: updatedSessions,
          };
        });
      },

      loadSession: (sessionId: string) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (session) {
          set({
            currentSessionId: sessionId,
            currentMessages: session.messages,
          });
        }
      },

      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return sessions.find((s) => s.id === currentSessionId) || null;
      },

      getSessionHistory: () => {
        return get().sessions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },

      deleteSession: (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSessionId:
            state.currentSessionId === sessionId ? null : state.currentSessionId,
          currentMessages:
            state.currentSessionId === sessionId ? [] : state.currentMessages,
        }));
      },

      clearHistory: () => {
        set({
          sessions: [],
          currentSessionId: null,
          currentMessages: [],
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'coach-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
