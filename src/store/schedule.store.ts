import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScheduleBlock {
  id: string;
  dayIndex: number; // 0 = Domingo, 1 = Lunes, ... 6 = Sábado
  startHour: number; // Ej: 9.5 para 09:30
  duration: number; // en horas (1, 1.5, 2, etc.)
  title: string;
  color: string;
  type: 'class' | 'work' | 'other';
  completed: boolean;
}

interface ScheduleState {
  blocks: ScheduleBlock[];
  addBlock: (block: Omit<ScheduleBlock, 'id'>) => void;
  updateBlock: (id: string, updates: Partial<Omit<ScheduleBlock, 'id'>>) => void;
  removeBlock: (id: string) => void;
  toggleCompleted: (id: string) => void;
  getBlocksForDay: (dayIndex: number) => ScheduleBlock[];
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
    }),
    {
      name: 'schedule-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
