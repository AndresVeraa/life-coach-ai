import { SafeAreaView, View } from 'react-native';
import { ReactNode } from 'react';

interface ScreenWrapperProps {
  children: ReactNode;
  className?: string;
}

export const ScreenWrapper = ({ children, className = '' }: ScreenWrapperProps) => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className={`flex-1 ${className}`}>
        {children}
      </View>
    </SafeAreaView>
  );
};
