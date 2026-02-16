import { Text } from 'react-native';
import { ScreenWrapper } from '@/shared/ui/ScreenWrapper';

export const DashboardScreen = () => {
  return (
    <ScreenWrapper className="px-4 py-6">
      <Text className="text-3xl font-bold text-gray-900 mb-2">
        Hola, Viajero
      </Text>
      <Text className="text-base text-gray-600 leading-6">
        Bienvenido a tu asistente de productividad. Aquí puedes gestionar tus tareas,
        recibir coaching personalizado y mantenerte enfocado en tus objetivos.
      </Text>
    </ScreenWrapper>
  );
};
