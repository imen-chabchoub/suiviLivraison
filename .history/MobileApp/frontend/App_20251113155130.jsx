import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '/screens/HomeScreen';
import MapScreen from '/screens/MapScreen';
import ScanScreen from '/screens/ScanScreen';
import NotificationsScreen from '/screens/NotificationsScreen';
import HistoryScreen from '/screens/HistoryScreen';
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
       <Stack.Screen name="History" component={HistoryScreen} />
       
      </Stack.Navigator>
    </NavigationContainer>
  );
}