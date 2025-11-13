import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState('0.00 km');
  const [estimatedTime, setEstimatedTime] = useState('0 min');
  const [isLoading, setIsLoading] = useState(true);
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  const webViewRef = useRef(null);
  const locationWatchRef = useRef(null);

  // Données de la livraison
  const deliveryData = {
    packageId: 'PKG001234',
    destination: '123 Rue de la Paix, 75002 Paris',
    client: 'Marie Dupont',
    coordinates: {
      latitude: 48.866667, // Paris
      longitude: 2.333333
    }
  };

  useEffect(() => {
    initializeLocation();
    
    // Nettoyer le watchPosition quand le composant est démonté
    return () => {
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
      }
    };
  }, []);

  const initializeLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La géolocalisation est nécessaire pour cette fonctionnalité.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      setCurrentLocation(userLocation);
      setDestination(deliveryData.coordinates);
      
      // Calculer la distance initiale seulement, sans afficher les vraies valeurs
      const initialDistance = calculateHaversineDistance(userLocation, deliveryData.coordinates);
      setDistance(`${initialDistance.toFixed(2)} km`);
      setEstimatedTime(`${Math.round(initialDistance * 5)} min`);
      
      setIsLoading(false);
      setInitialLocationSet(true);

    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir la localisation');
      setIsLoading(false);
    }
  };

  // Fonction utilitaire pour calculer la distance de Haversine
  const calculateHaversineDistance = (coord1, coord2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const startTracking = () => {
    setIsTracking(true);
    
    // Mettre à jour les valeurs avec les vraies données
    if (currentLocation && destination) {
      const realDistance = calculateHaversineDistance(currentLocation, destination);
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
    // Démarrer le suivi en temps réel
    locationWatchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000, // Mise à jour toutes les 3 secondes
        distanceInterval: 5, // Mise à jour tous les 5 mètres
      },
      (location) => {
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        
        setCurrentLocation(newLocation);

        // Mettre à jour la distance et le temps en temps réel
        if (destination) {
          const realDistance = calculateHaversineDistance(newLocation, destination);
          setDistance(`${realDistance.toFixed(2)} km`);
          setEstimatedTime(`${Math.round(realDistance * 5)} min`);
        }

        if (webViewRef.current && isTracking) {
          webViewRef.current.injectJavaScript(`
            updateUserPosition(${newLocation.latitude}, ${newLocation.longitude});
            true;
          `);
        }
      }
    );
  };

  const handleArrival = () => {
    Alert.alert(
      "Arrivé à destination",
      "Voulez-vous confirmer votre arrivée?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Confirmer", 
          onPress: () => {
            if (locationWatchRef.current) {
              locationWatchRef.current.remove();
            }
            router.push('/ProofDelivery');
          }
        }
      ]
    );
  };

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

        function initializeMap() {
          // Initialiser la carte centrée sur Paris
          map = L.map('map').setView([48.8566, 2.3522], 6); // Zoom sur la France
          
          // Ajouter les tuiles OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }).addTo(map);
          
          // Icône personnalisée pour l'utilisateur (bleu)
          const userIcon = L.divIcon({
            className: 'user-marker',
            html: '<div style="background-color: #4299E1; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          
          // Icône personnalisée pour la destination (rouge)
          const destinationIcon = L.divIcon({
            className: 'destination-marker',
            html: '<div style="background-color: #E53E3E; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          
          // Ajouter le marqueur utilisateur seulement si la localisation est disponible
          if (userLat !== 48.8566 || userLng !== 2.3522) {
            userMarker = L.marker([userLat, userLng], { icon: userIcon })
              .addTo(map)
              .bindPopup('<b>Votre position</b>')
              .openPopup();
          }
          
          // Ajouter le marqueur destination
          destinationMarker = L.marker([destLat, destLng], { icon: destinationIcon })
            .addTo(map)
            .bindPopup('<b>Destination</b><br>${deliveryData.destination}')
            .openPopup();
          
          // Ajouter la ligne de route seulement si la localisation utilisateur est disponible
          if (userLat !== 48.8566 || userLng !== 2.3522) {
            routeLine = L.polyline([[userLat, userLng], [destLat, destLng]], {
              color: '#4299E1',
              weight: 4,
              opacity: 0.7,
              dashArray: '8, 8',
              lineJoin: 'round'
            }).addTo(map);
            
            // Ajuster la vue pour voir les deux points
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
            // Créer le marqueur utilisateur s'il n'existe pas encore
            const userIcon = L.divIcon({
              className: 'user-marker',
              html: '<div style="background-color: #4299E1; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });
            userMarker = L.marker([lat, lng], { icon: userIcon })
              .addTo(map)
              .bindPopup('<b>Votre position</b>');
            
            // Créer la ligne de route si elle n'existe pas
            if (!routeLine) {
              routeLine = L.polyline([[lat, lng], [destLat, destLng]], {
                color: '#48BB78',
                weight: 5,
                opacity: 0.8,
                lineJoin: 'round'
              }).addTo(map);
            }
          } else {
            userMarker.setLatLng([lat, lng]);
          }
          
          if (routeLine) {
            routeLine.setLatLngs([[lat, lng], [destLat, destLng]]);
          }
          
          // Centrer la carte sur la nouvelle position
          map.setView([lat, lng], map.getZoom());
        }
        
        // Initialiser la carte quand la page est chargée
        document.addEventListener('DOMContentLoaded', initializeMap);
      </script>
    </body>
    </html>
  `;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4299E1" />
          <Text style={styles.loadingText}>Chargement de la carte...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Section supérieure avec informations de livraison */}
      <View style={styles.topSection}>
        <Text style={styles.packageId}>{deliveryData.packageId}</Text>
        
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

      {/* Carte - Prend tout l'espace disponible */}
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

      {/* Section inférieure avec destination et boutons */}
      <View style={styles.bottomSection}>
        <View style={styles.destinationContainer}>
          <View style={styles.destinationHeader}>
            <View style={styles.checkbox} />
            <Text style={styles.destinationTitle}>Destination</Text>
          </View>
          <Text style={styles.destinationAddress}>{deliveryData.destination}</Text>
          <Text style={styles.destinationClient}>{deliveryData.client}</Text>
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
              
              {/* BOUTON SCANNER<< AJOUTÉ ICI */}
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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