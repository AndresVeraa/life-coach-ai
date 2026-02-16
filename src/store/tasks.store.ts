import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types ---
export type Priority = 'urgent' | 'medium' | 'normal';
export type Tag = 'universidad' | 'personal' | 'proyectos';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  tag: Tag;
  createdAt: number;
  scheduledTimestamp?: number;
}

// --- Visual configs ---
export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; icon: string; color: string; bg: string }
> = {
  urgent: { label: 'Urgente', icon: '🔴', color: '#dc2626', bg: '#fef2f2' },
  medium: { label: 'Media', icon: '🟠', color: '#f59e0b', bg: '#fffbeb' },
  normal: { label: 'Normal', icon: '🔵', color: '#3b82f6', bg: '#eff6ff' },
};

export const TAG_CONFIG: Record<
  Tag,
  { label: string; icon: string; color: string }
> = {
  universidad: { label: 'Universidad', icon: '🎓', color: '#7c3aed' },
  personal: { label: 'Personal', icon: '🏠', color: '#059669' },
  proyectos: { label: 'Proyectos', icon: '🚀', color: '#0891b2' },
};

// --- Store ---
interface TasksState {
  tasks: Task[];
  addTask: (title: string, priority: Priority, tag: Tag) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  scheduleTask: (id: string, timestamp: number) => void;
  unscheduleTask: (id: string) => void;
  clearCompleted: () => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],

      addTask: (title, priority, tag) =>
        set((state) => ({
          tasks: [
            {
              id: Date.now().toString(),
              title,
              completed: false,
              priority,
              tag,
              createdAt: Date.now(),
            },
            ...state.tasks,
          ],
        })),

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),

      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      scheduleTask: (id, timestamp) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, scheduledTimestamp: timestamp } : t
          ),
        })),

      unscheduleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, scheduledTimestamp: undefined } : t
          ),
        })),

      clearCompleted: () =>
        set((state) => ({
          tasks: state.tasks.filter((t) => !t.completed),
        })),
    }),
    {
      name: 'tasks-pro-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
