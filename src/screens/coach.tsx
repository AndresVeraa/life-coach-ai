import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { useCoachStore } from '@/features/coach/coach.store';

export default function Coach() {
  const { messages, isLoading, askCoach, clearChat } = useCoachStore();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Scroll al último mensaje cuando hay nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');

    // Llamar a la acción askCoach que usa la API real
    await askCoach(userMessage);
  };

  const renderMessage = ({ item }: any) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={{
          flexDirection: 'row',
          marginBottom: 12,
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          paddingHorizontal: 8
        }}
      >
        <View
          style={{
            maxWidth: '80%',
            backgroundColor: isUser ? '#4F46E5' : '#f3f4f6',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8
          }}
        >
          <Text style={{ color: isUser ? '#ffffff' : '#1f2937', fontSize: 13, lineHeight: 18 }}>
            {item.text}
          </Text>
          <Text style={{ color: isUser ? '#e0e7ff' : '#9ca3af', fontSize: 10, marginTop: 4 }}>
            {new Date(item.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#4F46E5', paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#ffffff' }}>🤖 Coach IA</Text>
        <Text style={{ fontSize: 14, color: '#e0e7ff', marginTop: 4 }}>Inteligencia Real con Gemini</Text>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🤖</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>
            Bienvenido al Coach IA
          </Text>
          <Text style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 18 }}>
            Cuéntame sobre tu día, tus metas o desafíos. Usaré inteligencia real para ayudarte.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={{ flex: 1, padding: 12 }}
          contentContainerStyle={{ paddingBottom: 12 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={{ color: '#6b7280', fontSize: 13 }}>Coach está pensando...</Text>
          </View>
        </View>
      )}

      {/* Input Area */}
      <View style={{ backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: '#f3f4f6',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 14,
              maxHeight: 100
            }}
            placeholder="Cuéntame algo..."
            value={input}
            onChangeText={setInput}
            multiline
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              backgroundColor: isLoading || !input.trim() ? '#d1d5db' : '#4F46E5',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 10,
              justifyContent: 'center'
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        </View>

        {messages.length > 0 && (
          <TouchableOpacity
            onPress={clearChat}
            style={{ marginTop: 8 }}
          >
            <Text style={{ color: '#ef4444', fontSize: 12, textAlign: 'center' }}>Limpiar chat</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
