import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import { CheckCircle, Plus } from 'lucide-react-native';
import { ScreenWrapper } from '@/shared/ui/ScreenWrapper';
import { useAuditStore } from '../audit.store';
import { DistractionForm } from './DistractionForm';
import { AuditSummary } from './AuditSummary';

export const AuditScreen = () => {
  const { sessions, getCurrentSession, createSession, completeSession } =
    useAuditStore();
  const [showForm, setShowForm] = useState(false);
  const currentSession = getCurrentSession();

  const handleStartNewSession = () => {
    if (currentSession) {
      Alert.alert(
        'Sesión Activa',
        '¿Deseas completar primero la sesión actual?',
        [
          {
            text: 'Completar Sesión',
            onPress: async () => {
              completeSession('Sesión completada');
              createSession();
              setShowForm(true);
            },
            style: 'default',
          },
          {
            text: 'Descartar',
            onPress: () => {
              createSession();
              setShowForm(true);
            },
            style: 'destructive',
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } else {
      createSession();
      setShowForm(true);
    }
  };

  const handleCompleteSession = async () => {
    if (!currentSession || currentSession.distractions.length === 0) {
      Alert.alert('Sesión Vacía', 'Por favor, registra al menos una distracción.');
      return;
    }

    Alert.alert(
      'Completar Sesión',
      `¿Finalizas la sesión con ${currentSession.distractions.length} distracciones registradas?`,
      [
        {
          text: 'Completar',
          onPress: async () => {
            completeSession('Sesión completada desde AuditScreen');
            setShowForm(false);
            Alert.alert('✓ Sesión Completada', 'Tus estadísticas se han actualizado.');
          },
          style: 'default',
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            ⏱️ Auditoría de Tiempo
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            Rastrear distracciones y recuperar tiempo productivo
          </Text>
        </View>

        {/* Form o Placeholder */}
        {showForm ? (
          <View className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">
                📝 Registrar Distracciones
              </Text>
              {currentSession && currentSession.distractions.length > 0 && (
                <View className="bg-indigo-100 px-3 py-1 rounded-full">
                  <Text className="text-xs font-bold text-indigo-700">
                    {currentSession.distractions.length} registrados
                  </Text>
                </View>
              )}
            </View>

            <DistractionForm />

            {currentSession && currentSession.distractions.length > 0 && (
              <TouchableOpacity
                onPress={handleCompleteSession}
                className="bg-indigo-600 rounded-lg p-4 mt-6 flex-row items-center justify-center gap-2"
              >
                <CheckCircle size={18} color="#FFF" />
                <Text className="text-white font-semibold">Completar Sesión</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-indigo-100">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              📊 Sin Sesión Activa
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Inicia una nueva sesión para comenzar a registrar tus distracciones durante el día.
            </Text>
            <TouchableOpacity
              onPress={handleStartNewSession}
              className="bg-indigo-600 rounded-lg p-4 flex-row items-center justify-center gap-2"
            >
              <Plus size={18} color="#FFF" />
              <Text className="text-white font-semibold">Nueva Sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Estadísticas */}
        <AuditSummary />

        {/* Footer Spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Floating Action Button (si hay sesión activa) */}
      {currentSession && !showForm && (
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="absolute bottom-8 right-6 bg-indigo-600 rounded-full p-4 shadow-lg flex-row items-center gap-2 pr-5"
        >
          <Plus size={20} color="#FFF" />
          <Text className="text-white font-semibold text-sm">Nueva Distracción</Text>
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
};
