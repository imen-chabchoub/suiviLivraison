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
        {/* AJOUTER HomeScreen */}
        <Stack.Screen 
          name="HomeScreen" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="MapScreen" 
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
          name="ScanScreen" 
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
          name="HistoryScreen" 
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
        {/* AJOUTER LES ÉCRANS MANQUANTS */}
        <Stack.Screen 
          name="EvaluationsScreen" 
          options={{ 
            title: 'Évaluations',
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
          name="NotificationsScreen" 
          options={{ 
            title: 'Notifications',
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