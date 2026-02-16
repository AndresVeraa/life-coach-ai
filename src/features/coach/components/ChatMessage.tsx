import React from 'react';
import { View, Text } from 'react-native';
import type { CoachMessageItem } from '../coach.store';

interface ChatMessageProps {
  message: CoachMessageItem;
}

/**
 * Componente de burbuja de chat
 * - User: Alineado derecha, bg-indigo-600, texto blanco
 * - Assistant/System: Alineado izquierda, bg-gray-200, texto gris-900
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const timeStr = new Date(message.createdAt).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      className={`flex-row mb-4 px-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <View
        className={`max-w-xs rounded-2xl px-4 py-2 ${
          isUser ? 'bg-indigo-600 rounded-br-none' : 'bg-gray-200 rounded-bl-none'
        }`}
      >
        <Text
          className={`text-base ${isUser ? 'text-white' : 'text-gray-900'}`}
        >
          {message.text}
        </Text>
        <Text
          className={`text-xs mt-1 ${isUser ? 'text-indigo-100' : 'text-gray-500'}`}
        >
          {timeStr}
        </Text>
      </View>
    </View>
  );
};
