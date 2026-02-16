import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Clock, Calendar } from 'lucide-react-native';
import { useHealthStore } from '../health.store';

interface SleepTrackerProps {
  onSuccess?: () => void;
}

export const SleepTracker = ({ onSuccess }: SleepTrackerProps) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeIn, setTimeIn] = useState('23:00');
  const [timeOut, setTimeOut] = useState('07:00');
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [notes, setNotes] = useState('');

  const { addSleepRecord } = useHealthStore();

  const handleAddRecord = () => {
    // Validar formato HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timeRegex.test(timeIn) || !timeRegex.test(timeOut)) {
      Alert.alert('Error', 'Ingresa horas en formato HH:MM (ej: 23:30)');
      return;
    }

    if (!date) {
      Alert.alert('Error', 'Selecciona una fecha');
      return;
    }

    addSleepRecord({
      date,
      timeIn,
      timeOut,
      quality,
      notes,
    });

    // Reset form
    setTimeIn('23:00');
    setTimeOut('07:00');
    setQuality(4);
    setNotes('');

    onSuccess?.();
    Alert.alert('Éxito', 'Registro de sueño guardado ✓');
  };

  return (
    <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
      {/* Title */}
      <Text className="text-xl font-bold text-gray-900 mb-4">Registrar Sueño</Text>

      {/* Date */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <Calendar size={16} color="#6B7280" />
          <Text className="text-sm font-semibold text-gray-700 ml-2">Fecha</Text>
        </View>
        <TextInput
          className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-800"
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />
      </View>

      {/* Time In */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <Clock size={16} color="#6B7280" />
          <Text className="text-sm font-semibold text-gray-700 ml-2">Hora de Dormir</Text>
        </View>
        <TextInput
          className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-800"
          placeholder="HH:MM"
          value={timeIn}
          onChangeText={setTimeIn}
        />
      </View>

      {/* Time Out */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <Clock size={16} color="#6B7280" />
          <Text className="text-sm font-semibold text-gray-700 ml-2">Hora de Despertar</Text>
        </View>
        <TextInput
          className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-800"
          placeholder="HH:MM"
          value={timeOut}
          onChangeText={setTimeOut}
        />
      </View>

      {/* Quality (1-5 Stars) */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Calidad del Sueño</Text>
        <View className="flex-row justify-between">
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setQuality(level as 1 | 2 | 3 | 4 | 5)}
              className={`w-12 h-12 rounded-lg items-center justify-center ${
                quality === level
                  ? 'bg-indigo-600'
                  : 'bg-gray-100'
              }`}
            >
              <Text className={`font-bold ${quality === level ? 'text-white' : 'text-gray-600'}`}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text className="text-xs text-gray-500 mt-2">Muy Malo ← → Excelente</Text>
      </View>

      {/* Notes */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Notas (opcional)</Text>
        <TextInput
          className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-800 h-20"
          placeholder="Ej: Tuve pesadillas, me desperté varias veces..."
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* Button */}
      <TouchableOpacity
        onPress={handleAddRecord}
        className="bg-indigo-600 p-4 rounded-lg items-center"
      >
        <Text className="text-white font-semibold">Guardar Registro</Text>
      </TouchableOpacity>
    </View>
  );
};
