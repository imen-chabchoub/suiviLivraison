// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="LoginScreen" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="MapPage" 
          options={{ 
            title: 'Navigation',
            headerStyle: {
              backgroundColor: '#123affff',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerBackTitle: 'Retour'
          }} 
        />
        <Stack.Screen 
          name="ProofDelivery" 
          options={{ 
            title: 'Preuve de livraison',
            headerStyle: {
            backgroundColor: '#123affff',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
            fontWeight: 'bold',
            },
        }} 
        />
        <Stack.Screen 
          name="scan" 
          options={{ 
            title: 'Scanner colis',
            headerStyle: {
              backgroundColor: '#123affff',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        <Stack.Screen 
          name="History" 
          options={{ 
            title: 'Historique',
            headerStyle: {
              backgroundColor: '#123affff',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
      </Stack>
    </>
  );
}