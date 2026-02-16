import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useAuditStore } from '../audit.store';
import { DistractionCategory, CATEGORY_CONFIG } from '../types';

interface DistractionFormProps {
  onSuccess?: () => void;
}

export const DistractionForm = ({ onSuccess }: DistractionFormProps) => {
  const [selectedCategory, setSelectedCategory] = useState<DistractionCategory>('redes-sociales');
  const [description, setDescription] = useState('');
  const [minutes, setMinutes] = useState('15');
  const { addDistraction, getCurrentSession, deleteDistraction } = useAuditStore();

  const currentSession = getCurrentSession();

  const handleAddDistraction = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Describe qué te distrajo');
      return;
    }

    const minutesNum = parseInt(minutes);
    if (isNaN(minutesNum) || minutesNum <= 0 || minutesNum > 480) {
      Alert.alert('Error', 'Ingresa minutos entre 1 y 480 (8 horas)');
      return;
    }

    addDistraction(selectedCategory, description.trim(), minutesNum);
    setDescription('');
    setMinutes('15');
    onSuccess?.();
  };

  return (
    <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
      {/* Title */}
      <Text className="text-xl font-bold text-gray-900 mb-4">Registrar Distracción</Text>

      {/* Category Selector */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-3">¿Qué tipo?</Text>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(CATEGORY_CONFIG) as DistractionCategory[]).map((category) => {
            const config = CATEGORY_CONFIG[category];
            const isSelected = selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                className={`px-4 py-3 rounded-full border-2 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <Text className={`font-semibold ${isSelected ? 'text-indigo-600' : 'text-gray-600'}`}>
                  {config.emoji} {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">¿Qué hiciste?</Text>
        <TextInput
          className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-800"
          placeholder={`Ej: Scrollear ${CATEGORY_CONFIG[selectedCategory].label}`}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={100}
        />
        <Text className="text-xs text-gray-400 mt-1">{description.length}/100</Text>
      </View>

      {/* Minutes */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Minutos perdidos</Text>
        <View className="flex-row items-center gap-2">
          <TextInput
            className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-800 text-center"
            placeholder="15"
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="number-pad"
          />
          <Text className="text-gray-600 font-semibold">min</Text>
        </View>
        <Text className="text-xs text-gray-400 mt-1">
          Estimación realista (no exagerar)
        </Text>
      </View>

      {/* Button */}
      <TouchableOpacity
        onPress={handleAddDistraction}
        className="bg-indigo-600 p-4 rounded-lg items-center mb-4"
      >
        <Text className="text-white font-semibold">+ Registrar Distracción</Text>
      </TouchableOpacity>

      {/* Current Session Distractions */}
      {currentSession && currentSession.distractions.length > 0 && (
        <View className="border-t border-gray-200 pt-4">
          <Text className="text-sm font-bold text-gray-900 mb-3">
            Registradas hoy ({currentSession.distractions.length})
          </Text>

          {currentSession.distractions.map((distraction) => {
            const config = CATEGORY_CONFIG[distraction.category];
            return (
              <View
                key={distraction.id}
                className="flex-row items-center justify-between bg-gray-50 p-3 rounded-lg mb-2 border border-gray-100"
              >
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900">
                    {config.emoji} {distraction.description}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {distraction.estimatedMinutes} min
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => deleteDistraction(distraction.id)}
                  className="p-2"
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}

          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
            <Text className="text-sm font-bold text-red-700">
              ⚠️ Total hoy: {currentSession.totalMinutesLost} minutos perdidos
            </Text>
            <Text className="text-xs text-red-600 mt-1">
              = {(currentSession.totalMinutesLost / 60).toFixed(1)} horas
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
