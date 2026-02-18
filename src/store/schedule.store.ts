import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Notas interactivas (post-its) vinculadas a un bloque ---
export interface BlockNote {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export interface ScheduleBlock {
  id: string;
  dayIndex: number; // 0 = Domingo, 1 = Lunes, ... 6 = Sábado
  startHour: number; // Ej: 9.5 para 09:30
  duration: number; // en horas (1, 1.5, 2, etc.)
  title: string;
  color: string;
  type: 'class' | 'work' | 'other';
  completed: boolean;
  notes?: BlockNote[];  // Post-its / checklist del bloque
}

interface ScheduleState {
  blocks: ScheduleBlock[];
  addBlock: (block: Omit<ScheduleBlock, 'id'>) => void;
  updateBlock: (id: string, updates: Partial<Omit<ScheduleBlock, 'id'>>) => void;
  removeBlock: (id: string) => void;
  toggleCompleted: (id: string) => void;
  getBlocksForDay: (dayIndex: number) => ScheduleBlock[];
  // --- Note actions ---
  addNote: (blockId: string, text: string) => void;
  toggleNote: (blockId: string, noteId: string) => void;
  removeNote: (blockId: string, noteId: string) => void;
}

// Colores pastel para las materias
export const SCHEDULE_COLORS = [
  '#c7d2fe', // indigo-200
  '#fecdd3', // rose-200
  '#a7f3d0', // emerald-200
  '#fde68a', // amber-200
  '#a5f3fc', // cyan-200
  '#f5d0fe', // fuchsia-200
  '#bfdbfe', // blue-200
  '#d9f99d', // lime-200
];

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      blocks: [],

      addBlock: (block) =>
        set((state) => ({
          blocks: [
            ...state.blocks,
            { ...block, id: Date.now().toString() },
          ],
        })),

      updateBlock: (id, updates) =>
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      removeBlock: (id) =>
        set((state) => ({
          blocks: state.blocks.filter((b) => b.id !== id),
        })),

      toggleCompleted: (id) =>
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === id ? { ...b, completed: !b.completed } : b
          ),
        })),

      getBlocksForDay: (dayIndex) => {
        return get()
          .blocks.filter((b) => b.dayIndex === dayIndex)
          .sort((a, b) => a.startHour - b.startHour);
      },

      // --- Note actions ---
      addNote: (blockId, text) =>
        set((state) => ({
          blocks: state.blocks.map((b) => {
            if (b.id !== blockId) return b;
            const note: BlockNote = {
              id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
              text,
              done: false,
              createdAt: Date.now(),
            };
            return { ...b, notes: [...(b.notes || []), note] };
          }),
        })),

      toggleNote: (blockId, noteId) =>
        set((state) => ({
          blocks: state.blocks.map((b) => {
            if (b.id !== blockId) return b;
            return {
              ...b,
              notes: (b.notes || []).map((n) =>
                n.id === noteId ? { ...n, done: !n.done } : n
              ),
            };
          }),
        })),

      removeNote: (blockId, noteId) =>
        set((state) => ({
          blocks: state.blocks.map((b) => {
            if (b.id !== blockId) return b;
            return {
              ...b,
              notes: (b.notes || []).filter((n) => n.id !== noteId),
            };
          }),
        })),
    }),
    {
      name: 'schedule-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
