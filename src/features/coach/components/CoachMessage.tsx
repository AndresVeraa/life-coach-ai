import React from 'react';
import { View, Text } from 'react-native';

interface CoachMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export const CoachMessage = ({ role, content }: CoachMessageProps) => {
  const isUser = role === 'user';

  return (
    <View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-xs rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-indigo-600 rounded-br-none'
            : 'bg-gray-100 rounded-bl-none border border-gray-200'
        }`}
      >
        <Text
          className={`text-base leading-6 ${
            isUser ? 'text-white' : 'text-gray-800'
          }`}
        >
          {content}
        </Text>
      </View>

      {/* Timestamp (opcional, muy pequeño) */}
      <Text
        className={`text-xs text-gray-400 mt-1 ${
          isUser ? 'mr-2' : 'ml-2'
        }`}
      >
        {new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
};
