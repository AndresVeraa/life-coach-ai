import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export default function Health() {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#10b981', paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#ffffff' }}>🏥 Salud</Text>
        <Text style={{ fontSize: 14, color: '#d1fae5', marginTop: 4 }}>Monitorea tu bienestar</Text>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: '#ecfdf5', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#047857', marginBottom: 8 }}>😴 Sueño Hoy</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>8h 15m</Text>
          <Text style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>↑ +45 min vs promedio</Text>
        </View>

        <View style={{ backgroundColor: '#ecfdf5', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#047857', marginBottom: 8 }}>⏰ Patrones</Text>
          <Text style={{ fontSize: 13, color: '#059669', lineHeight: 18 }}>
            • Mejor productividad: 09:00 - 12:00{'\n'}
            • Evitar tareas difíciles: 15:00 - 17:00{'\n'}
            • Pico de energía: 10:00 AM
          </Text>
        </View>

        <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400e' }}>💡 Recomendación</Text>
          <Text style={{ fontSize: 13, color: '#78350f', marginTop: 6, lineHeight: 18 }}>
            Tu sueño está por encima del promedio. Intenta mantener esta consistencia.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
