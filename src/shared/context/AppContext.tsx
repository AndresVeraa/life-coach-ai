import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppContextType, User, UserStats } from '@/types';
import { CONFIG } from '@/constants/config';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

interface AppState {
  user: User | null;
  userStats: UserStats;
  isOffline: boolean;
  isSyncing: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'UPDATE_STATS'; payload: Partial<UserStats> }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_OFFLINE'; payload: boolean };

const initialState: AppState = {
  user: null,
  userStats: CONFIG.DEFAULT_USER_STATS as UserStats,
  isOffline: false,
  isSyncing: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'UPDATE_STATS':
      return {
        ...state,
        userStats: { ...state.userStats, ...action.payload },
      };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    case 'SET_OFFLINE':
      return { ...state, isOffline: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const networkStatus = useNetworkStatus();

  // Actualizar estado offline cuando cambia la red
  useEffect(() => {
    dispatch({ type: 'SET_OFFLINE', payload: !networkStatus.isConnected });
  }, [networkStatus.isConnected]);

  const value: AppContextType = {
    user: state.user,
    userStats: state.userStats,
    isOffline: state.isOffline,
    isSyncing: state.isSyncing,
    setUser: (user) => dispatch({ type: 'SET_USER', payload: user }),
    updateUserStats: (stats) => dispatch({ type: 'UPDATE_STATS', payload: stats }),
    setSyncing: (syncing) => dispatch({ type: 'SET_SYNCING', payload: syncing }),
    setOffline: (offline) => dispatch({ type: 'SET_OFFLINE', payload: offline }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe ser utilizado dentro de AppProvider');
  }
  return context;
};
