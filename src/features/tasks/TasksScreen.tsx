import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
} from 'react-native';
import { ScreenWrapper } from '@/shared/ui/ScreenWrapper';
import { useTaskStore, Task } from './tasks.store';
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react-native';

export const TasksScreen = () => {
  const [newTask, setNewTask] = useState('');
  const { tasks, addTask, toggleTask, deleteTask } = useTaskStore();

  const handleAddTask = () => {
    if (newTask.trim().length === 0) return;
    addTask(newTask);
    setNewTask('');
    Keyboard.dismiss();
  };

  const renderItem = ({ item }: { item: Task }) => (
    <View className="flex-row items-center bg-white p-4 mb-3 rounded-xl border border-gray-100 shadow-sm">
      <TouchableOpacity onPress={() => toggleTask(item.id)} className="mr-3">
        {item.completed ? (
          <CheckCircle size={24} color="#10B981" />
        ) : (
          <Circle size={24} color="#9CA3AF" />
        )}
      </TouchableOpacity>

      <View className="flex-1">
        <Text
          className={`text-base ${
            item.completed
              ? 'text-gray-400 line-through'
              : 'text-gray-800'
          }`}
        >
          {item.title}
        </Text>
      </View>

      <TouchableOpacity onPress={() => deleteTask(item.id)} className="p-2">
        <Trash2 size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper className="px-4 py-6">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-gray-900">Mis Objetivos 🎯</Text>
        <Text className="text-gray-500 mt-1">¿Qué quieres lograr hoy?</Text>
      </View>

      <View className="flex-row items-center mb-6">
        <TextInput
          className="flex-1 bg-white p-4 rounded-xl border border-gray-200 mr-3 text-gray-800"
          placeholder="Escribe una nueva tarea..."
          placeholderTextColor="#9CA3AF"
          value={newTask}
          onChangeText={setNewTask}
          onSubmitEditing={handleAddTask}
        />
        <TouchableOpacity
          onPress={handleAddTask}
          className="bg-indigo-600 p-4 rounded-xl items-center justify-center"
        >
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center mt-10 opacity-50">
            <Text className="text-gray-400 text-lg">No hay tareas pendientes</Text>
            <Text className="text-gray-400 text-sm">¡Agrega una para empezar!</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};
