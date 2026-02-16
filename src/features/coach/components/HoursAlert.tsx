/**
 * HoursAlert
 *
 * Muestra alerta contextual basada en qué hora es AHORA
 * Si es una hora crítica, avisa al usuario
 * Si es golden hour, anima a enfocarse
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Clock } from 'lucide-react-native';

interface HoursAlertProps {
  peakHour?: number;
  lowestHour?: number;
  peakMinutesLost?: number;
  lowestMinutesLost?: number;
  onDismiss?: () => void;
}

/**
 * Obtiene la hora actual (0-23)
 */
const getCurrentHour = (): number => {
  return new Date().getHours();
};

/**
 * Verifica si la hora actual es la hora de pico
 */
const isCurrentlyInPeakHour = (peakHour: number): boolean => {
  const now = getCurrentHour();
  // Considera la hora actual y la anterior como "hora de pico"
  return now === peakHour || now === (peakHour + 1) % 24;
};

/**
 * Verifica si la hora actual es golden hour
 */
const isCurrentlyInGoldenHour = (lowestHour: number): boolean => {
  const now = getCurrentHour();
  // Considera la hora actual y las próximas 2 horas como "golden hour"
  return (
    now === lowestHour ||
    now === (lowestHour + 1) % 24
  );
};

export const HoursAlert = ({
  peakHour,
  lowestHour,
  peakMinutesLost,
  lowestMinutesLost,
  onDismiss,
}: HoursAlertProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [currentHour, setCurrentHour] = useState(getCurrentHour());

  // Actualizar hora cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(getCurrentHour());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // No renderizar si está dismissido o no hay datos
  if (dismissed || (peakHour === undefined && lowestHour === undefined)) {
    return null;
  }

  const inPeakHour = peakHour !== undefined && isCurrentlyInPeakHour(peakHour);
  const inGoldenHour =
    lowestHour !== undefined && isCurrentlyInGoldenHour(lowestHour);

  // Si está en golden hour, mostrar eso, sino mostrar peak hour alert
  if (inGoldenHour && lowestHour !== undefined) {
    return (
      <View className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-4 flex-row items-start">
        <Text className="text-lg mt-1">✅</Text>
        <View className="flex-1 ml-3">
          <Text className="font-bold text-green-900 text-base mb-1">
            ¡Es tu Golden Hour! ⏰
          </Text>
          <Text className="text-sm text-green-700 leading-5 mb-2">
            Son las {lowestHour}:00 - tu mejor momento para tareas importantes. Solo pierdes {Math.round(lowestMinutesLost || 0)} min en distracciones.
          </Text>
          <Text className="text-xs text-green-600">
            💡 Aprovecha ahora para tu tarea más desafiante
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="p-1 active:opacity-70"
        >
          <Text className="text-green-600 font-semibold text-xs">✕</Text>
        </Pressable>
      </View>
    );
  }

  // Mostrar alerta si está en hora de pico
  if (inPeakHour && peakHour !== undefined) {
    return (
      <View className="mb-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-4 flex-row items-start">
        <Text className="text-lg mt-1">⚠️</Text>
        <View className="flex-1 ml-3">
          <Text className="font-bold text-red-900 text-base mb-1">
            ⚠️ Hora Crítica
          </Text>
          <Text className="text-sm text-red-700 leading-5 mb-2">
            Son las {peakHour}:00-{(peakHour + 1) % 24}:00 — Tu hora más difícil. Típicamente pierdes {Math.round(peakMinutesLost || 0)} minutos.
          </Text>
          <Text className="text-xs text-red-600">
            🎯 Aplica bloques de enfoque ahora
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="p-1 active:opacity-70"
        >
          <Text className="text-red-600 font-semibold text-xs">✕</Text>
        </Pressable>
      </View>
    );
  }

  // Si no es ni pico ni golden hour, pero tenemos datos, mostrar resumen
  if (peakHour !== undefined || lowestHour !== undefined) {
    return (
      <View className="mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg p-4 flex-row items-start">
        <Clock size={20} color="#3b82f6" strokeWidth={2.5} className="mt-1" />
        <View className="flex-1 ml-3">
          <Text className="font-bold text-blue-900 text-base mb-1">
            💡 Patrones Detectados
          </Text>
          <Text className="text-sm text-blue-700 leading-5">
            Mejor hora: {lowestHour}:00 | Crítica: {peakHour}:00
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="p-1 active:opacity-70"
        >
          <Text className="text-blue-600 font-semibold text-xs">✕</Text>
        </Pressable>
      </View>
    );
  }

  return null;
};
