import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useCoachStore, ActionResult } from '@/features/coach/coach.store';

// ── Responsive scaler ──
const rs = (base: number, w: number) => {
  const factor = 1 + (w / 375 - 1) * 0.3;
  return Math.round(base * Math.min(Math.max(factor, 0.85), 1.12));
};

// ── Quick suggestions ──
const QUICK_PROMPTS = [
  { icon: '🏋️', text: 'Quiero hacer ejercicio diario' },
  { icon: '📚', text: 'Agrega el hábito de leer 10 páginas' },
  { icon: '📅', text: 'Tengo clase de Cálculo mañana a las 10' },
  { icon: '🧘', text: 'Quiero empezar a meditar' },
];

// ── Action badge component ──
const ActionBadge = ({ action }: { action: ActionResult }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: action.success ? '#ecfdf5' : '#fef2f2',
      borderWidth: 1,
      borderColor: action.success ? '#a7f3d0' : '#fecaca',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginTop: 8,
      gap: 6,
    }}
  >
    <Text style={{ fontSize: 14 }}>{action.success ? '✅' : '❌'}</Text>
    <Text
      style={{
        fontSize: 12,
        color: action.success ? '#065f46' : '#991b1b',
        fontWeight: '600',
        flex: 1,
      }}
    >
      {action.label}
    </Text>
  </View>
);

export default function Coach() {
  const { width } = useWindowDimensions();
  const { messages, isLoading, askCoach, clearChat } = useCoachStore();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const statusH = StatusBar.currentHeight ?? 0;

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    await askCoach(msg);
  };

  const handleQuick = async (text: string) => {
    if (isLoading) return;
    await askCoach(text);
  };

  const renderMessage = ({ item }: any) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={{
          flexDirection: 'row',
          marginBottom: rs(10, width),
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          paddingHorizontal: rs(8, width),
        }}
      >
        {!isUser && (
          <View
            style={{
              width: rs(28, width),
              height: rs(28, width),
              borderRadius: rs(14, width),
              backgroundColor: '#4F46E5',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 6,
              marginTop: 2,
            }}
          >
            <Text style={{ fontSize: rs(13, width) }}>🤖</Text>
          </View>
        )}
        <View style={{ maxWidth: '78%', flexShrink: 1 }}>
          <View
            style={{
              backgroundColor: isUser ? '#4F46E5' : '#f3f4f6',
              borderRadius: rs(16, width),
              borderTopRightRadius: isUser ? rs(4, width) : rs(16, width),
              borderTopLeftRadius: isUser ? rs(16, width) : rs(4, width),
              paddingHorizontal: rs(14, width),
              paddingVertical: rs(10, width),
            }}
          >
            <Text
              style={{
                color: isUser ? '#ffffff' : '#1f2937',
                fontSize: rs(13, width),
                lineHeight: rs(19, width),
              }}
            >
              {item.text}
            </Text>
          </View>

          {/* Action badges */}
          {item.actions &&
            item.actions.map((action: ActionResult, idx: number) => (
              <ActionBadge key={idx} action={action} />
            ))}

          <Text
            style={{
              color: isUser ? '#a5b4fc' : '#9ca3af',
              fontSize: rs(10, width),
              marginTop: 4,
              textAlign: isUser ? 'right' : 'left',
              paddingHorizontal: 4,
            }}
          >
            {new Date(item.createdAt).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  // ── Empty state ──
  const EmptyState = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rs(24, width) }}>
      <View
        style={{
          width: rs(72, width),
          height: rs(72, width),
          borderRadius: rs(36, width),
          backgroundColor: '#eef2ff',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: rs(16, width),
        }}
      >
        <Text style={{ fontSize: rs(36, width) }}>🤖</Text>
      </View>
      <Text
        style={{
          fontSize: rs(18, width),
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: rs(6, width),
        }}
      >
        Coach IA con Superpoderes
      </Text>
      <Text
        style={{
          fontSize: rs(13, width),
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: rs(19, width),
          marginBottom: rs(20, width),
        }}
      >
        Puedo crear hábitos, agendar clases y organizar tu día. ¡Solo pídemelo!
      </Text>

      {/* Quick prompts */}
      <View style={{ width: '100%', gap: rs(8, width) }}>
        {QUICK_PROMPTS.map((q, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => handleQuick(q.text)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f9fafb',
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: rs(12, width),
              paddingHorizontal: rs(14, width),
              paddingVertical: rs(12, width),
              gap: rs(10, width),
            }}
          >
            <Text style={{ fontSize: rs(18, width) }}>{q.icon}</Text>
            <Text style={{ fontSize: rs(13, width), color: '#374151', flex: 1 }}>"{q.text}"</Text>
            <Text style={{ fontSize: rs(11, width), color: '#9ca3af' }}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: '#4F46E5',
          paddingTop: statusH + rs(12, width),
          paddingBottom: rs(14, width),
          paddingHorizontal: rs(16, width),
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text style={{ fontSize: rs(22, width), fontWeight: '800', color: '#ffffff' }}>
            🤖 Coach IA
          </Text>
          <Text style={{ fontSize: rs(11, width), color: '#c7d2fe', marginTop: 2 }}>
            Gemini 2.5 Flash · Puede agendar y crear hábitos
          </Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={clearChat}
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: rs(8, width),
              paddingHorizontal: rs(10, width),
              paddingVertical: rs(6, width),
            }}
          >
            <Text style={{ color: '#e0e7ff', fontSize: rs(11, width), fontWeight: '600' }}>
              Limpiar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages or empty state */}
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: rs(12, width) }}
          onContentSizeChange={() =>
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50)
          }
        />
      )}

      {/* Typing indicator */}
      {isLoading && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: rs(16, width),
            paddingVertical: rs(8, width),
            gap: 8,
          }}
        >
          <ActivityIndicator size="small" color="#4F46E5" />
          <Text style={{ color: '#6b7280', fontSize: rs(12, width) }}>Coach está pensando...</Text>
        </View>
      )}

      {/* Input */}
      <View
        style={{
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingHorizontal: rs(12, width),
          paddingVertical: rs(10, width),
          paddingBottom: rs(14, width),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: rs(8, width) }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: '#f3f4f6',
              borderRadius: rs(20, width),
              paddingHorizontal: rs(16, width),
              paddingVertical: rs(10, width),
              fontSize: rs(14, width),
              maxHeight: 100,
              color: '#1f2937',
            }}
            placeholder="Dime qué necesitas..."
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            multiline
            editable={!isLoading}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={isLoading || !input.trim()}
            style={{
              backgroundColor: isLoading || !input.trim() ? '#d1d5db' : '#4F46E5',
              width: rs(40, width),
              height: rs(40, width),
              borderRadius: rs(20, width),
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: rs(18, width), fontWeight: '700' }}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
