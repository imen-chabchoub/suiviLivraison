// src/apiMobile.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// À adapter selon où tourne ton backend :
const BASE_URL = 'http://192.168.0.144:8080'; 
// Android émulateur: 10.0.2.2
// iOS simulateur: http://localhost:8080
// Téléphone réel: http://IP_DE_TON_PC:8080

const apiMobile = axios.create({
  baseURL: BASE_URL,
});

apiMobile.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
console.log('API base URL =', BASE_URL);
export default apiMobile;
