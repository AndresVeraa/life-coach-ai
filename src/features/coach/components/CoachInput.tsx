import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Send } from 'lucide-react-native';

interface CoachInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export const CoachInput = ({ onSend, isLoading = false }: CoachInputProps) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    onSend(text);
    setText('');
  };

  return (
    <View className="flex-row items-center gap-2 p-4 bg-white border-t border-gray-200">
      <TextInput
        className="flex-1 bg-gray-50 p-3 rounded-full border border-gray-200 text-gray-800"
        placeholder="Pregunta algo al Coach..."
        placeholderTextColor="#9CA3AF"
        value={text}
        onChangeText={setText}
        editable={!isLoading}
        multiline
        maxHeight={100}
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={isLoading || !text.trim()}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          isLoading || !text.trim()
            ? 'bg-gray-300'
            : 'bg-indigo-600'
        }`}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Send color="white" size={20} />
        )}
      </TouchableOpacity>
    </View>
  );
};
