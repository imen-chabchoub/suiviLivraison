// app/index.tsx
import { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Rediriger vers la page de login par défaut
  return <Redirect href ="/LoginScreen" />;
} 