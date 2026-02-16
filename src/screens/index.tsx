import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export default function Home() {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#4F46E5', paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#ffffff' }}>💪 LifeCoach AI</Text>
        <Text style={{ fontSize: 14, color: '#e0e7ff', marginTop: 4 }}>Tu coach de productividad</Text>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>Bienvenido</Text>
          <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 20 }}>
            LifeCoach AI te ayuda a mejorar tu productividad mediante análisis inteligente de tus patrones de trabajo y sueño.
          </Text>
        </View>

        <View style={{ backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 }}>🎯 Módulos</Text>
          <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 18 }}>
            • Tasks: Gestiona tus tareas diarias{'\n'}
            • Health: Monitorea tu sueño{'\n'}
            • Coach: Chat con tu IA personal{'\n'}
            • Audit: Analiza tu productividad
          </Text>
        </View>

        <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400e' }}>💡 Tip</Text>
          <Text style={{ fontSize: 13, color: '#78350f', marginTop: 6, lineHeight: 18 }}>
            Comienza agregando tus tareas del día en la pantalla Tasks para que el coach pueda ayudarte mejor.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
