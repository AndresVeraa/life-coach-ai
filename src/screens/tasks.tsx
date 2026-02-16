import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';

export default function Tasks() {
  const [tasks, setTasks] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const addTask = () => {
    if (input.trim()) {
      setTasks([...tasks, input]);
      setInput('');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#4F46E5', paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#ffffff' }}>📎 Mis Tareas</Text>
        <Text style={{ fontSize: 14, color: '#e0e7ff', marginTop: 4 }}>{tasks.length} tareas pendientes</Text>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {tasks.length === 0 ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🎯</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>No hay tareas aún</Text>
            <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>Agrega tareas para comenzar</Text>
          </View>
        ) : (
          tasks.map((task, idx) => (
            <View key={idx} style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#1f2937' }}>✓ {task}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Input */}
      <View style={{ backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 }}
            placeholder="Agregar nueva tarea..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity
            onPress={addTask}
            style={{ backgroundColor: '#4F46E5', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600' }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
