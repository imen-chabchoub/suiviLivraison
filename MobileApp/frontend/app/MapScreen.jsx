// app/MapScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiMobile from '../app/apiMobile';
import { geocodeAddress } from '../app/geocoding';
import { getRoute } from '../app/routing';
const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { deliveryId } = useLocalSearchParams();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState('0.00 km');
  const [estimatedTime, setEstimatedTime] = useState('0 min');
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef(null);
  const locationWatchRef = useRef(null);
  const [routeCoords, setRouteCoords] = useState(null);
  useEffect(() => {
    loadDeliveryAndInit();
    return () => {
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
      }
    };
  }, [deliveryId]);

  const loadDeliveryAndInit = async () => {
    try {
      setIsLoading(true);

      // 1) Récupérer la livraison assignée au livreur
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Erreur', "Impossible de trouver votre identifiant livreur");
        router.back();
        return;
      }

      const res = await apiMobile.get(`/mobile/livraison/assignees/${userId}`);
      const livraisons = res.data || [];

      if (livraisons.length === 0) {
        Alert.alert(
          'Aucune livraison',
          "Vous n'avez aucune livraison assignée.",
          [{ text: 'OK', onPress: () => router.back() }],
        );
        return;
      }

      // Chercher la livraison spécifique par ID, sinon prendre la première
      let l = livraisons[0];
      if (deliveryId) {
        const found = livraisons.find(liv => liv.id.toString() === deliveryId.toString());
        if (found) {
          l = found;
        }
      }

      const address =
        l.adresse || (l.client ? l.client.adresse : '') || 'Paris, France';

      // 2) Géocoder l’adresse avec OpenCage
      const destCoordsFromApi = await geocodeAddress(address);

      const destCoords =
        destCoordsFromApi || {
          latitude: 48.866667,
          longitude: 2.333333,
        };

      setCurrentDelivery({
        id: l.id,
        packageId: l.codeBarre || `LIV-${l.id}`,
        destinationText: address,
        client: l.client ? `${l.client.prenom} ${l.client.nom}` : 'Client',
      });

      setDestination(destCoords);

      // 3) Initialiser la localisation du livreur
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'La géolocalisation est nécessaire pour cette fonctionnalité.',
        );
        setIsLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(userLocation);
      const route = await getRoute(userLocation, destCoords);
      setRouteCoords(route);
      // distance et temps initiaux
      const initialDistance = calculateHaversineDistance(
        userLocation,
        destCoords,
      );
      setDistance(`${initialDistance.toFixed(2)} km`);
      setEstimatedTime(`${Math.round(initialDistance * 5)} min`);

      setIsLoading(false);
    } catch (error) {
      console.error('Erreur init MapScreen:', error?.response?.data || error);
      Alert.alert(
        'Erreur',
        "Impossible de charger la livraison ou la localisation.",
        [{ text: 'OK', onPress: () => router.back() }],
      );
      setIsLoading(false);
    }
  };

  const calculateHaversineDistance = (coord1, coord2) => {
    const R = 6371;
    const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.latitude * Math.PI) / 180) *
        Math.cos((coord2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startTracking = () => {
    setIsTracking(true);

    if (currentLocation && destination) {
      const realDistance = calculateHaversineDistance(
        currentLocation,
        destination,
      );
      setDistance(`${realDistance.toFixed(2)} km`);
      setEstimatedTime(`${Math.round(realDistance * 5)} min`);
    }

    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        startTracking();
        true;
      `);
    }

    startLocationTracking();
  };

const startLocationTracking = async () => {
  const userId = await AsyncStorage.getItem('userId');
  
  locationWatchRef.current = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 3000,    // Vérifie toutes les 3 secondes
      distanceInterval: 5,   // Ou si déplacement > 5m
    },
    async (location) => {
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(newLocation);

      // 🚀 ENVOYER LA POSITION AU BACKEND
      try {
        await apiMobile.post('/mobile/positions/record', 
          {
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
          },
          {
            params: { livreurId: userId }
          }
        );
        console.log('✅ Position enregistrée:', newLocation);
      } catch (error) {
        console.error('❌ Erreur envoi position:', error?.response?.data || error);
      }

      // Mettre à jour la distance et le temps
      if (destination) {
        const realDistance = calculateHaversineDistance(
          newLocation,
          destination,
        );
        setDistance(`${realDistance.toFixed(2)} km`);
        setEstimatedTime(`${Math.round(realDistance * 5)} min`);
      }

      // Mettre à jour la carte
      if (webViewRef.current && isTracking) {
        webViewRef.current.injectJavaScript(`
          updateUserPosition(${newLocation.latitude}, ${newLocation.longitude});
          true;
        `);
      }
    },
  );
};

  const handleArrival = () => {
    Alert.alert('Arrivé à destination', 'Voulez-vous confirmer votre arrivée?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: () => {
          if (locationWatchRef.current) {
            locationWatchRef.current.remove();
          }
          router.push('/ProofDelivery');
        },
      },
    ]);
  };
  const routeLatLngsString = routeCoords
  ? routeCoords.map(p => `[${p.latitude}, ${p.longitude}]`).join(',')
  : '';
  const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <style>
      body { margin: 0; padding: 0; }
      #map { height: 100vh; width: 100vw; }
      .leaflet-control-attribution { 
        font-size: 10px; 
        background: rgba(255, 255, 255, 0.9) !important;
      }
      .user-marker {
        background: transparent !important;
        border: none !important;
      }
      .destination-marker {
        background: transparent !important;
        border: none !important;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script>
      let map;
      let userMarker;
      let destinationMarker;
      let routeLine;
      let userLat = ${currentLocation ? currentLocation.latitude : 48.8566};
      let userLng = ${currentLocation ? currentLocation.longitude : 2.3522};
      let destLat = ${destination ? destination.latitude : 48.866667};
      let destLng = ${destination ? destination.longitude : 2.333333};
      let routePoints = [${routeLatLngsString}];

      function initializeMap() {
        map = L.map('map').setView([48.8566, 2.3522], 6);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);
        
        const userIcon = L.divIcon({
          className: 'user-marker',
          html: '<div style="background-color: #4299E1; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        
        const destinationIcon = L.divIcon({
          className: 'destination-marker',
          html: '<div style="background-color: #E53E3E; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        
        if (userLat !== 48.8566 || userLng !== 2.3522) {
          userMarker = L.marker([userLat, userLng], { icon: userIcon })
            .addTo(map)
            .bindPopup('<b>Votre position</b>')
            .openPopup();
        }
        
        destinationMarker = L.marker([destLat, destLng], { icon: destinationIcon })
          .addTo(map)
          .bindPopup('<b>Destination</b>')
          .openPopup();
        
        if (routePoints.length > 1) {
          routeLine = L.polyline(routePoints, {
            color: '#4299E1',
            weight: 4,
            opacity: 0.8,
            lineJoin: 'round'
          }).addTo(map);

          map.fitBounds(routeLine.getBounds(), { 
            padding: [20, 20],
            maxZoom: 16
          });
        } else if (userLat !== 48.8566 || userLng !== 2.3522) {
          // fallback: simple ligne droite si pas de route
          routeLine = L.polyline([[userLat, userLng], [destLat, destLng]], {
            color: '#4299E1',
            weight: 4,
            opacity: 0.7,
            dashArray: '8, 8',
            lineJoin: 'round'
          }).addTo(map);

          map.fitBounds([[userLat, userLng], [destLat, destLng]], { 
            padding: [20, 20],
            maxZoom: 13
          });
        }
      }
      
      function startTracking() {
        if (routeLine) {
          routeLine.setStyle({ 
            color: '#48BB78', 
            dashArray: null,
            weight: 5,
            opacity: 0.8
          });
        }
      }
      
      function updateUserPosition(lat, lng) {
        if (!userMarker) {
          const userIcon = L.divIcon({
            className: 'user-marker',
            html: '<div style="background-color: #4299E1; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          userMarker = L.marker([lat, lng], { icon: userIcon })
            .addTo(map)
            .bindPopup('<b>Votre position</b>');
        } else {
          userMarker.setLatLng([lat, lng]);
        }

        // on laisse la route ORS telle quelle, on ne la recalcule pas à chaque mouvement
        map.setView([lat, lng], map.getZoom());
      }
      
      document.addEventListener('DOMContentLoaded', initializeMap);
    </script>
  </body>
  </html>
`;


  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <Ionicons name="cube" size={24} color="white" />
            </View>
            <Text style={styles.headerTitle}>Navigation</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push('/NotificationsScreen')}
            >
              <Ionicons name="notifications" size={22} color="white" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>2</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="share-social" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4299E1" />
          <Text style={styles.loadingText}>Chargement de la carte...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Ionicons name="cube" size={24} color="white" />
          </View>
          <Text style={styles.headerTitle}>Navigation</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/NotificationsScreen')}
          >
            <Ionicons name="notifications" size={22} color="white" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="share-social" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.topSection}>
        <Text style={styles.packageId}>
          {currentDelivery ? currentDelivery.packageId : 'Chargement...'}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance restante</Text>
            <Text style={styles.statValue}>{distance}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Temps estimé</Text>
            <Text style={styles.statValue}>{estimatedTime}</Text>
          </View>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onLoadEnd={() => console.log('Carte chargée')}
        />
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.destinationContainer}>
          <View style={styles.destinationHeader}>
            <View style={styles.checkbox} />
            <Text style={styles.destinationTitle}>Destination</Text>
          </View>
          <Text style={styles.destinationAddress}>
            {currentDelivery ? currentDelivery.destinationText : ''}
          </Text>
          <Text style={styles.destinationClient}>
            {currentDelivery ? currentDelivery.client : ''}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {!isTracking ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={startTracking}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>Commencer le trajet</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.arrivalButton}
                onPress={handleArrival}
                activeOpacity={0.8}
              >
                <Text style={styles.arrivalButtonText}>Arrivé à destination</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => router.push('/ScanScreen')}
                activeOpacity={0.8}
              >
                <Ionicons name="barcode-outline" size={20} color="#fff" />
                <Text style={styles.scanButtonText}>Scanner colis</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // tes styles actuels inchangés
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 6,
    borderRadius: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: 'white' },
  headerRight: { flexDirection: 'row', gap: 16, position: 'relative' },
  iconBtn: { padding: 4, position: 'relative' },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  topSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  packageId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  bottomSection: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  destinationContainer: {
    marginBottom: 15,
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4299E1',
    marginRight: 10,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  destinationAddress: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 2,
    marginLeft: 28,
  },
  destinationClient: {
    fontSize: 14,
    color: '#718096',
    marginLeft: 28,
  },
  buttonContainer: {
    gap: 10,
  },
  startButton: {
    backgroundColor: '#0039d5ff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  arrivalButton: {
    backgroundColor: '#48BB78',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  arrivalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#ED8936',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
