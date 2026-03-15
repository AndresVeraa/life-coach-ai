import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSameDay, addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import {
  scheduleTaskReminder,
  cancelTaskReminder,
} from '@/services/notifications/notificationService';
import { getConfig } from '@/constants/config';

export type Priority = 'urgent' | 'medium' | 'normal';
export type Tag = 'universidad' | 'personal' | 'proyectos';
export type Category = 'cuerpo' | 'mente' | 'carrera' | 'alma' | 'deporte' | 'cuidado' | 'hidratacion';
export type Frequency = 'once' | 'daily' | 'custom';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  tag: Tag;
  category: Category;
  createdAt: number;
  frequency: Frequency;
  repeatDays?: number[];
  scheduledTimestamp?: number;
  lastCompletedDate?: number;
  reminderTime?: string;
}

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

export const CATEGORY_CONFIG: Record<
  Category,
  { label: string; icon: string; color: string; bg: string; gradient: string }
> = {
  cuerpo:      { label: 'Cuerpo',      icon: '🏋️', color: '#ea580c', bg: '#fff7ed', gradient: '#fed7aa' },
  mente:       { label: 'Mente',       icon: '📚', color: '#7c3aed', bg: '#faf5ff', gradient: '#e9d5ff' },
  carrera:     { label: 'Carrera',     icon: '💼', color: '#2563eb', bg: '#eff6ff', gradient: '#bfdbfe' },
  alma:        { label: 'Alma',        icon: '❤️', color: '#dc2626', bg: '#fef2f2', gradient: '#fecaca' },
  deporte:     { label: 'Deporte',     icon: '⚽', color: '#059669', bg: '#ecfdf5', gradient: '#a7f3d0' },
  cuidado:     { label: 'Cuidado Personal', icon: '💆', color: '#db2777', bg: '#fdf2f8', gradient: '#fbcfe8' },
  hidratacion: { label: 'Hidratación', icon: '💧', color: '#0891b2', bg: '#ecfeff', gradient: '#a5f3fc' },
};

export const CATEGORIES: Category[] = ['cuerpo', 'mente', 'carrera', 'alma', 'deporte', 'cuidado', 'hidratacion'];

export const FREQUENCY_CONFIG: Record<Frequency, { label: string; icon: string }> = {
  once:   { label: 'Una vez', icon: '1️⃣' },
  daily:  { label: 'Todos los días', icon: '🔄' },
  custom: { label: 'Personalizar', icon: '📆' },
};

export interface QuickHabit {
  title: string;
  category: Category;
  icon: string;
  frequency: Frequency;
  reminderTime?: string;
}

export const QUICK_HABITS: QuickHabit[] = [
  { title: 'Leer 10 páginas', category: 'mente', icon: '📖', frequency: 'daily', reminderTime: '21:00' },
  { title: 'Meditar 5 min', category: 'alma', icon: '🧘', frequency: 'daily', reminderTime: '06:30' },
  { title: 'Beber agua', category: 'hidratacion', icon: '💧', frequency: 'daily', reminderTime: '08:00' },
  { title: '30 min ejercicio', category: 'deporte', icon: '🏃', frequency: 'custom', reminderTime: '07:00' },
  { title: 'Estudiar 25 min', category: 'carrera', icon: '📝', frequency: 'daily', reminderTime: '16:00' },
  { title: 'Escribir diario', category: 'alma', icon: '✍️', frequency: 'daily', reminderTime: '22:00' },
  { title: 'Estiramientos', category: 'cuerpo', icon: '🤸', frequency: 'daily', reminderTime: '07:30' },
  { title: 'Podcast educativo', category: 'mente', icon: '🎧', frequency: 'custom', reminderTime: '12:00' },
  { title: 'Correr 20 min', category: 'deporte', icon: '🏅', frequency: 'custom', reminderTime: '06:30' },
  { title: 'Rutina de fuerza', category: 'deporte', icon: '💪', frequency: 'custom', reminderTime: '17:00' },
  { title: 'Skincare mañana', category: 'cuidado', icon: '🧴', frequency: 'daily', reminderTime: '07:00' },
  { title: 'Skincare noche', category: 'cuidado', icon: '🌙', frequency: 'daily', reminderTime: '21:30' },
  { title: 'Cuidado dental', category: 'cuidado', icon: '🪥', frequency: 'daily', reminderTime: '07:15' },
  { title: '8 vasos de agua', category: 'hidratacion', icon: '🥤', frequency: 'daily', reminderTime: '09:00' },
  { title: 'Té / infusión', category: 'hidratacion', icon: '🍵', frequency: 'daily', reminderTime: '15:00' },
];

export const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  if (h < 22) TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

export const timeToDecimal = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
};

export const DAYS_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type AddTaskInput = string | (Partial<Task> & { title: string });

interface TasksState {
  tasks: Task[];
  addTask: (taskData: AddTaskInput) => void;
  updateTask: (id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  scheduleTask: (id: string, timestamp: number) => void;
  unscheduleTask: (id: string) => void;
  clearCompleted: () => void;
  getTasksForDate: (date: Date) => Task[];
  checkDailyReset: () => void;
  deleteTask: (id: string) => void;
  clearTasks: () => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (taskData) => {
        const config = getConfig();
        const baseTask = typeof taskData === 'string' ? { title: taskData } : taskData;

        const newTask: Task = {
          id: Date.now().toString(),
          title: baseTask.title,
          completed: false,
          priority: baseTask.priority ?? 'normal',
          tag: baseTask.tag ?? 'personal',
          category: baseTask.category ?? 'carrera',
          frequency: baseTask.frequency ?? 'once',
          repeatDays: baseTask.repeatDays,
          scheduledTimestamp: baseTask.scheduledTimestamp,
          reminderTime: baseTask.reminderTime,
          createdAt: Date.now(),
        };

        if (newTask.reminderTime) {
          scheduleReminderForTask(newTask).catch((err) => {
            if (config.env.DEBUG_MODE) {
              console.warn('[Tasks] Error programando notificación:', err);
            }
          });
        }

        set((state) => ({
          tasks: [newTask, ...state.tasks],
        }));
      },

      updateTask: (id, data) => {
        const config = getConfig();
        const task = get().tasks.find((t) => t.id === id);

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        }));

        if (task && data.reminderTime !== undefined) {
          const updatedTask = { ...task, ...data };
          cancelTaskReminder(id).catch(() => {});
          if (data.reminderTime) {
            scheduleReminderForTask(updatedTask as Task).catch((err) => {
              if (config.env.DEBUG_MODE) {
                console.warn('[Tasks] Error reprogramando notificación:', err);
              }
            });
          }
        }
      },

      toggleTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        const newCompleted = task ? !task.completed : false;

        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t;
            return {
              ...t,
              completed: newCompleted,
              lastCompletedDate: newCompleted ? Date.now() : undefined,
            };
          }),
        }));

        if (newCompleted) {
          cancelTaskReminder(id).catch(() => {});
        } else if (task?.reminderTime) {
          scheduleReminderForTask(task).catch(() => {});
        }
      },

      removeTask: (id) => {
        cancelTaskReminder(id).catch(() => {});

        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

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

      clearCompleted: () => {
        const completedTasks = get().tasks.filter((t) => t.completed);
        completedTasks.forEach((task) => {
          cancelTaskReminder(task.id).catch(() => {});
        });

        set((state) => ({
          tasks: state.tasks.filter((t) => !t.completed),
        }));
      },

      checkDailyReset: () =>
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.frequency !== 'once' && t.completed && t.lastCompletedDate) {
              if (!isSameDay(new Date(t.lastCompletedDate), new Date())) {
                if (t.reminderTime) {
                  scheduleReminderForTask(t).catch(() => {});
                }
                return { ...t, completed: false };
              }
            }
            return t;
          }),
        })),

      getTasksForDate: (date) => {
        const { tasks } = get();
        const targetDay = date.getDay();
        return tasks.filter((t) => {
          if (t.frequency === 'once') {
            if (t.scheduledTimestamp) {
              return isSameDay(new Date(t.scheduledTimestamp), date);
            }
            return isSameDay(new Date(t.createdAt), date);
          }
          if (t.frequency === 'daily') return true;
          if (t.frequency === 'custom' && t.repeatDays) {
            return t.repeatDays.includes(targetDay);
          }
          return true;
        });
      },

      deleteTask: (id) => get().removeTask(id),

      clearTasks: () => set({ tasks: [] }),
    }),
    {
      name: 'tasks-v2-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state || state.tasks.length > 0) return;

        const hydrateFromLegacy = async () => {
          try {
            const [legacyProRaw, legacySimpleRaw] = await Promise.all([
              AsyncStorage.getItem('tasks-pro-v2-storage'),
              AsyncStorage.getItem('tasks-storage'),
            ]);

            const parsePersist = (raw: string | null) => {
              if (!raw) return null;
              const parsed = JSON.parse(raw);
              return parsed?.state ?? null;
            };

            const legacyPro = parsePersist(legacyProRaw);
            const legacySimple = parsePersist(legacySimpleRaw);

            const merged = new Map<string, Task>();

            if (Array.isArray(legacyPro?.tasks)) {
              legacyPro.tasks.forEach((task: Task) => {
                if (task?.id) merged.set(task.id, task);
              });
            }

            if (Array.isArray(legacySimple?.tasks)) {
              legacySimple.tasks.forEach((task: Partial<Task>) => {
                if (!task?.id || !task.title) return;
                if (merged.has(task.id)) return;

                merged.set(task.id, {
                  id: task.id,
                  title: task.title,
                  completed: !!task.completed,
                  priority: task.priority ?? 'normal',
                  tag: task.tag ?? 'personal',
                  category: task.category ?? 'carrera',
                  frequency: task.frequency ?? 'once',
                  repeatDays: task.repeatDays,
                  scheduledTimestamp: task.scheduledTimestamp,
                  lastCompletedDate: task.lastCompletedDate,
                  reminderTime: task.reminderTime,
                  createdAt: task.createdAt ?? Date.now(),
                });
              });
            }

            if (merged.size > 0) {
              useTasksStore.setState({ tasks: Array.from(merged.values()) });
            }
          } catch {
            // no-op
          }
        };

        hydrateFromLegacy();
      },
    }
  )
);

export const useTaskStore = useTasksStore;

async function scheduleReminderForTask(task: Task): Promise<void> {
  if (!task.reminderTime) return;

  const [hours, minutes] = task.reminderTime.split(':').map(Number);
  let triggerDate: Date;

  if (task.frequency === 'once' && task.scheduledTimestamp) {
    triggerDate = new Date(task.scheduledTimestamp);
    triggerDate = setHours(triggerDate, hours);
    triggerDate = setMinutes(triggerDate, minutes);
  } else {
    const now = new Date();
    triggerDate = setHours(startOfDay(now), hours);
    triggerDate = setMinutes(triggerDate, minutes);
    if (triggerDate <= now) {
      triggerDate = addDays(triggerDate, 1);
    }
  }

  if (triggerDate > new Date()) {
    const categoryConfig = CATEGORY_CONFIG[task.category];
    const body = `${categoryConfig?.icon || '📋'} ${task.title}`;
    await scheduleTaskReminder(task.id, task.title, body, triggerDate);
  }
}
