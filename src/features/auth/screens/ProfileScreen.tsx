/**
 * ProfileScreen
 *
 * Pantalla de perfil del usuario con opciones:
 * - Ver información personal
 * - Editar nombre/avatar
 * - Logout
 * - Configuración de privacidad
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { ScreenWrapper } from '@/shared/ui/ScreenWrapper';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const ProfileScreen = () => {
  const { user, logout, isLoading, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({ name: editedName });
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', onPress: () => {} },
      {
        text: 'Cerrar Sesión',
        onPress: async () => {
          await logout();
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <ScreenWrapper className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-gradient-to-b from-indigo-600 to-indigo-50 px-6 py-8 items-center">
          <View className="w-20 h-20 bg-indigo-100 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl">👤</Text>
          </View>
          <Text className="text-gray-900 font-bold text-xl mb-1">
            {user?.name || 'Usuario'}
          </Text>
          <Text className="text-gray-600 text-sm">{user?.email}</Text>
          <Text className="text-gray-500 text-xs mt-2">
            Miembro desde{' '}
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric',
                })
              : 'N/A'}
          </Text>
        </View>

        {/* Profile Section */}
        <View className="px-6 py-6">
          <Text className="text-gray-900 font-bold text-lg mb-4">
            Información Personal
          </Text>

          {/* Name Field */}
          <View className="bg-white rounded-lg p-4 mb-4">
            <Text className="text-gray-600 text-xs mb-2 font-semibold">
              NOMBRE
            </Text>
            {isEditing ? (
              <View className="flex-row items-center gap-3">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Tu nombre"
                />
                <Pressable
                  onPress={handleSaveName}
                  disabled={isSaving}
                  className="bg-indigo-600 px-4 py-2 rounded-lg active:bg-indigo-700"
                >
                  <Text className="text-white font-semibold text-sm">
                    {isSaving ? '...' : '✓'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setIsEditing(false)}
                  className="bg-gray-300 px-4 py-2 rounded-lg active:bg-gray-400"
                >
                  <Text className="text-gray-700 font-semibold text-sm">✕</Text>
                </Pressable>
              </View>
            ) : (
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 font-semibold text-base">
                  {user?.name || 'No asignado'}
                </Text>
                <Pressable
                  onPress={() => setIsEditing(true)}
                  className="active:opacity-70"
                >
                  <Text className="text-indigo-600 font-semibold text-sm">
                    Editar
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Email Field - Read only */}
          <View className="bg-white rounded-lg p-4 mb-6">
            <Text className="text-gray-600 text-xs mb-2 font-semibold">
              EMAIL
            </Text>
            <Text className="text-gray-900 font-semibold text-base">
              {user?.email}
            </Text>
            <Text className="text-gray-500 text-xs mt-2">
              Verificado ✓
            </Text>
          </View>

          {/* Stats */}
          <View className="grid grid-cols-2 gap-4 mb-6">
            <View className="bg-white rounded-lg p-4">
              <Text className="text-indigo-600 font-bold text-xl mb-1">~30</Text>
              <Text className="text-gray-600 text-xs">Días activo</Text>
            </View>
            <View className="bg-white rounded-lg p-4">
              <Text className="text-indigo-600 font-bold text-xl mb-1">0</Text>
              <Text className="text-gray-600 text-xs">Horas mejoradas</Text>
            </View>
          </View>

          {/* Settings Section */}
          <Text className="text-gray-900 font-bold text-lg mb-4">
            Configuración
          </Text>

          {/* Settings List */}
          <View className="bg-white rounded-lg overflow-hidden mb-6">
            <Pressable className="p-4 border-b border-gray-100 flex-row items-center justify-between active:bg-gray-50">
              <View>
                <Text className="text-gray-900 font-semibold text-base">
                  Notificaciones
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  Gestiona alertas
                </Text>
              </View>
              <Text className="text-xl">›</Text>
            </Pressable>

            <Pressable className="p-4 border-b border-gray-100 flex-row items-center justify-between active:bg-gray-50">
              <View>
                <Text className="text-gray-900 font-semibold text-base">
                  Privacidad
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  Controlar datos
                </Text>
              </View>
              <Text className="text-xl">›</Text>
            </Pressable>

            <Pressable className="p-4 flex-row items-center justify-between active:bg-gray-50">
              <View>
                <Text className="text-gray-900 font-semibold text-base">
                  Ayuda
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  Soporte y FAQs
                </Text>
              </View>
              <Text className="text-xl">›</Text>
            </Pressable>
          </View>

          {/* Danger Zone */}
          <View className="bg-red-50 rounded-lg p-4 border border-red-200 mb-4">
            <Text className="text-red-900 font-bold text-base mb-3">
              Zona Peligrosa
            </Text>
            <Pressable
              onPress={handleLogout}
              disabled={isLoading}
              className="bg-red-600 rounded-lg py-3 items-center active:bg-red-700"
            >
              <Text className="text-white font-bold text-base">
                {isLoading ? 'Cerrando...' : 'Cerrar Sesión'}
              </Text>
            </Pressable>
            <Text className="text-red-700 text-xs mt-3">
              Se eliminará la sesión local. Tus datos se mantienen en la nube.
            </Text>
          </View>

          {/* Footer */}
          <View className="items-center py-4">
            <Text className="text-gray-500 text-xs text-center">
              Life Coach AI v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};
