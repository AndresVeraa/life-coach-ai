import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { RootLayout } from '@/app/RootLayout';
import { RootNavigator } from '@/app/RootNavigator';

export default function App() {
  return (
    <RootLayout>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="dark" />
    </RootLayout>
  );
}
