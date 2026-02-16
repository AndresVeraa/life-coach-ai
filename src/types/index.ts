// Domain Models
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  lastSyncAt: number | null;
}

export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  tasksToday: number;
  completedToday: number;
  averageSleep: number;
  totalDistractions: number;
}

// App State
export interface AppContextType {
  user: User | null;
  userStats: UserStats;
  isOffline: boolean;
  isSyncing: boolean;
  setUser: (user: User | null) => void;
  updateUserStats: (stats: Partial<UserStats>) => void;
  setSyncing: (syncing: boolean) => void;
  setOffline: (offline: boolean) => void;
}

// API Responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface InspirationItem {
  id: string;
  title: string;
  author?: string;
  description: string;
  category: 'book' | 'habit' | 'quote';
  relevance: number; // 0-1
  relatedTo: string[]; // tags como 'procrastination', 'sleep', etc
}
