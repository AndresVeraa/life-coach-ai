import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export default function Audit() {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#f59e0b', paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#ffffff' }}>📊 Auditoría</Text>
        <Text style={{ fontSize: 14, color: '#fef3c7', marginTop: 4 }}>Analiza tu productividad</Text>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: '#fffbeb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#92400e', marginBottom: 8 }}>🎯 Score de Productividad</Text>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#f59e0b' }}>78%</Text>
          <Text style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>↑ +5% vs semana pasada</Text>
        </View>

        <View style={{ backgroundColor: '#fffbeb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#92400e', marginBottom: 8 }}>⏱️ Tiempo de Enfoque</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>5h 42m</Text>
          <Text style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>Hoy (vs 6h promedio)</Text>
        </View>

        <View style={{ backgroundColor: '#fffbeb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#92400e', marginBottom: 8 }}>📍 Distracciones</Text>
          <Text style={{ fontSize: 13, color: '#b45309', lineHeight: 18 }}>
            • Teléfono: 23 usos{'\n'}
            • Mensajes: 15 interrupciones{'\n'}
            • Apps: 8 cambios de contexto
          </Text>
        </View>

        <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400e' }}>💡 Insight</Text>
          <Text style={{ fontSize: 13, color: '#78350f', marginTop: 6, lineHeight: 18 }}>
            Tu productividad mejora cuando trabajas sin interrupciones entre 10:00 y 12:00.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
