import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSameDay, addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import {
  scheduleTaskReminder,
  cancelTaskReminder,
} from '@/services/notifications/notificationService';
import { getConfig } from '@/constants/config';

// --- Types ---
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
  repeatDays?: number[];        // 0=Dom ... 6=Sáb
  scheduledTimestamp?: number;   // Para tareas únicas
  lastCompletedDate?: number;   // Para resetear hábitos diarios
  reminderTime?: string;        // HH:mm — hora del día para este hábito
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
  reminderTime?: string;        // HH:mm sugerido
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
  // Deporte
  { title: 'Correr 20 min', category: 'deporte', icon: '🏅', frequency: 'custom', reminderTime: '06:30' },
  { title: 'Rutina de fuerza', category: 'deporte', icon: '💪', frequency: 'custom', reminderTime: '17:00' },
  // Cuidado Personal
  { title: 'Skincare mañana', category: 'cuidado', icon: '🧴', frequency: 'daily', reminderTime: '07:00' },
  { title: 'Skincare noche', category: 'cuidado', icon: '🌙', frequency: 'daily', reminderTime: '21:30' },
  { title: 'Cuidado dental', category: 'cuidado', icon: '🪥', frequency: 'daily', reminderTime: '07:15' },
  // Hidratación
  { title: '8 vasos de agua', category: 'hidratacion', icon: '🥤', frequency: 'daily', reminderTime: '09:00' },
  { title: 'Té / infusión', category: 'hidratacion', icon: '🍵', frequency: 'daily', reminderTime: '15:00' },
];

// Helper: genera opciones de hora cada 30 min (6:00 - 22:00)
export const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  if (h < 22) TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

// Helper: convierte 'HH:mm' a hora decimal (e.g. '07:30' → 7.5)
export const timeToDecimal = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
};

export const DAYS_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// --- Store ---
interface TasksState {
  tasks: Task[];
  addTask: (taskData: Partial<Task> & { title: string }) => void;
  updateTask: (id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  scheduleTask: (id: string, timestamp: number) => void;
  unscheduleTask: (id: string) => void;
  clearCompleted: () => void;
  getTasksForDate: (date: Date) => Task[];
  checkDailyReset: () => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (taskData) => {
        const config = getConfig();
        const newTask: Task = {
          id: Date.now().toString(),
          title: taskData.title,
          completed: false,
          priority: taskData.priority ?? 'normal',
          tag: taskData.tag ?? 'personal',
          category: taskData.category ?? 'carrera',
          frequency: taskData.frequency ?? 'once',
          repeatDays: taskData.repeatDays,
          scheduledTimestamp: taskData.scheduledTimestamp,
          reminderTime: taskData.reminderTime,
          createdAt: Date.now(),
        };

        // Programar notificación si tiene reminderTime
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

        // Si se actualizó reminderTime, reprogramar notificación
        if (task && data.reminderTime !== undefined) {
          const updatedTask = { ...task, ...data };
          
          // Cancelar notificación anterior
          cancelTaskReminder(id).catch(() => {});
          
          // Si tiene nuevo reminderTime, programar
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

        // Si se completó, cancelar notificación
        if (newCompleted) {
          cancelTaskReminder(id).catch(() => {});
        } else if (task?.reminderTime) {
          // Si se desmarcó, reprogramar si tiene reminderTime
          scheduleReminderForTask(task).catch(() => {});
        }
      },

      removeTask: (id) => {
        // Cancelar notificación al eliminar
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
        // Cancelar notificaciones de tareas completadas
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
                // Reprogramar notificación si tiene reminderTime
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
    }),
    {
      name: 'tasks-pro-v2-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================
// HELPER: Programar recordatorio para una tarea
// ============================================

async function scheduleReminderForTask(task: Task): Promise<void> {
  if (!task.reminderTime) return;
  
  const [hours, minutes] = task.reminderTime.split(':').map(Number);
  let triggerDate: Date;
  
  if (task.frequency === 'once' && task.scheduledTimestamp) {
    // Para tareas únicas, usar la fecha programada
    triggerDate = new Date(task.scheduledTimestamp);
    triggerDate = setHours(triggerDate, hours);
    triggerDate = setMinutes(triggerDate, minutes);
  } else {
    // Para hábitos diarios/custom, programar para hoy o mañana
    const now = new Date();
    triggerDate = setHours(startOfDay(now), hours);
    triggerDate = setMinutes(triggerDate, minutes);
    
    // Si ya pasó la hora hoy, programar para mañana
    if (triggerDate <= now) {
      triggerDate = addDays(triggerDate, 1);
    }
  }
  
  // Solo programar si la fecha es futura
  if (triggerDate > new Date()) {
    const categoryConfig = CATEGORY_CONFIG[task.category];
    const body = `${categoryConfig?.icon || '📋'} ${task.title}`;
    
    await scheduleTaskReminder(task.id, task.title, body, triggerDate);
  }
}
