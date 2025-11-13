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
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ProofDelivery" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ScanScreen" 
          options={{ headerShown: false }}  
        />
        <Stack.Screen 
          name="HistoryScreen" 
          options={{ headerShown: false }} 
        />
        {/* AJOUTER LES ÉCRANS MANQUANTS */}
        <Stack.Screen 
          name="EvaluationsScreen" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="NotificationsScreen" 
          options={{ headerShown: false }} 
        />
      </Stack>
    </>
  );
}