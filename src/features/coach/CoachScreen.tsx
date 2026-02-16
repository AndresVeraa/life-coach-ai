import React from 'react';
import { View, Text } from 'react-native';
import { ScreenWrapper } from '@/shared/ui/ScreenWrapper';

/**
 * CoachScreen: Chat con Coach IA (Versión simplificada)
 */
export const CoachScreen = () => {
  return (
    <ScreenWrapper className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-gray-900">🤖 Coach IA</Text>
        <Text className="text-gray-600 mt-4 px-6 text-center">
          Chat con tu coach de vida personalizado
        </Text>
      </View>
    </ScreenWrapper>
  );
};
