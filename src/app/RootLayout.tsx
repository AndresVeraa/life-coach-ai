import React, { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/shared/context/AppContext';

interface RootLayoutProps {
  children: ReactNode;
}

export const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <SafeAreaProvider>
      <AppProvider>
        {children}
      </AppProvider>
    </SafeAreaProvider>
  );
};
