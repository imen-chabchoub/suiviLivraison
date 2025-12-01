// app/ProofDelivery.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiMobile from '../app/apiMobile';

export default function ProofDelivery() {
  const [photo, setPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [deliveryData, setDeliveryData] = useState(null);

  // Charger la livraison en cours depuis le backend
  useEffect(() => {
    const loadCurrentDelivery = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          Alert.alert('Erreur', 'Impossible de trouver votre identifiant');
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

        const l = livraisons[0];

        setDeliveryData({
          id: l.id,
          packageId: l.codeBarre || `LIV-${l.id}`,
          destination: l.adresse || (l.client ? l.client.adresse : ''),
          client: l.client ? `${l.client.prenom} ${l.client.nom}` : 'Client',
          clientPhone: l.client ? l.client.telephone : '',
        });
      } catch (e) {
        console.log('Erreur chargement livraison', e?.response?.data || e);
        Alert.alert(
          'Erreur',
          "Impossible de récupérer la livraison en cours.",
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
    };

    loadCurrentDelivery();
  }, []);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          "L'accès à la caméra est nécessaire pour prendre une photo.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'La géolocalisation est nécessaire pour la preuve de livraison.',
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      });

      Alert.alert('Succès', 'Localisation enregistrée avec succès');
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      Alert.alert('Erreur', "Impossible d'obtenir la localisation");
    }
  };

  const validateDelivery = async () => {
  if (!deliveryData) {
    Alert.alert('Erreur', 'Aucune livraison chargée');
    return;
  }
  if (!photo) {
    Alert.alert(
      'Photo manquante',
      'La photo du colis livré est obligatoire.'
    );
    return;
  }
  if (!currentLocation) {
    Alert.alert(
      'Localisation manquante',
      'La géolocalisation est obligatoire.'
    );
    return;
  }

  setIsLoading(true);

  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Alert.alert('Erreur', 'Impossible de trouver votre identifiant');
      setIsLoading(false);
      return;
    }

    // 1) Upload de la preuve
    const formData = new FormData();
    formData.append('file', {
      uri: photo,
      name: 'preuve.jpg',
      type: 'image/jpeg',
    });
    formData.append('idLivraison', String(deliveryData.id));

    const resPreuve = await apiMobile.post('/mobile/preuve', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log('Preuve envoyée', resPreuve.status);

    // 2) Mise à jour du statut en LIVREE
    await apiMobile.put(
      '/mobile/livraison/statut',
      null,
      {
        params: {
          idLivraison: deliveryData.id,
          nouveauStatut: 'LIVREE',
        },
      }
    );

    // 3) Succès
    Alert.alert(
      'Livraison validée !',
      'La preuve de livraison a été enregistrée et le statut mis à jour.',
      [
        {
          text: 'OK',
          onPress: () => {
            router.push('/HistoryScreen');
          },
        },
      ]
    );
  } catch (error) {
    console.log(
      'ERR preuve/statut =>',
      error.response?.status,
      error.response?.data
    );
    Alert.alert(
      'Erreur',
      "Impossible d'envoyer la preuve ou de mettre à jour le statut"
    );
  } finally {
    setIsLoading(false);
  }
};



  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View className={styles.logo}>
            <Ionicons name="cube" size={24} color="white" />
          </View>
          <Text style={styles.headerTitle}>Preuve de livraison</Text>
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Infos livraison */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Informations de livraison</Text>
          {deliveryData && (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="cube-outline" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Colis: {deliveryData.packageId}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{deliveryData.destination}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{deliveryData.client}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{deliveryData.clientPhone}</Text>
              </View>
            </>
          )}
        </View>

        {/* Photo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Photo du colis <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>
            Prenez une photo du colis à son emplacement de livraison
          </Text>

          <TouchableOpacity
            style={styles.photoButton}
            onPress={takePhoto}
            activeOpacity={0.8}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#666" />
                <Text style={styles.photoPlaceholderText}>
                  Prendre une photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {photo && (
            <TouchableOpacity style={styles.retakeButton} onPress={takePhoto}>
              <Text style={styles.retakeButtonText}>Reprendre la photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Géolocalisation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Géolocalisation <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>
            Enregistrez votre position actuelle comme preuve de livraison
          </Text>

          <TouchableOpacity
            style={[
              styles.locationButton,
              currentLocation && styles.locationButtonSuccess,
            ]}
            onPress={getCurrentLocation}
            disabled={!!currentLocation}
          >
            <Ionicons
              name={currentLocation ? 'checkmark-circle' : 'location-outline'}
              size={24}
              color={currentLocation ? '#fff' : '#4299E1'}
            />
            <Text
              style={[
                styles.locationButtonText,
                currentLocation && styles.locationButtonTextSuccess,
              ]}
            >
              {currentLocation
                ? 'Localisation enregistrée'
                : 'Enregistrer la position'}
            </Text>
          </TouchableOpacity>

          {currentLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                Lat: {currentLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Lng: {currentLocation.longitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Heure:{' '}
                {new Date(currentLocation.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>

        {/* Validation */}
        <View style={styles.validationSection}>
          <TouchableOpacity
            style={[
              styles.validateButton,
              (!photo || !currentLocation) && styles.validateButtonDisabled,
            ]}
            onPress={validateDelivery}
            disabled={!photo || !currentLocation || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-done-outline"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.validateButtonText}>
                  Valider la livraison
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.validationNote}>
            Tous les champs marqués d'un * sont obligatoires
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },
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
  infoCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#4A5568', marginLeft: 8 },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
    lineHeight: 20,
  },
  required: { color: '#E53E3E' },
  photoButton: {
    height: 200,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoPlaceholder: { alignItems: 'center' },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#718096',
  },
  photoPreview: { width: '100%', height: '100%' },
  retakeButton: { marginTop: 12, alignSelf: 'center' },
  retakeButtonText: {
    color: '#4299E1',
    fontSize: 14,
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4299E1',
  },
  locationButtonSuccess: {
    backgroundColor: '#48BB78',
    borderColor: '#48BB78',
  },
  locationButtonText: {
    color: '#4299E1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationButtonTextSuccess: { color: '#fff' },
  locationInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#4A5568',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  validationSection: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#48BB78',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  validateButtonDisabled: { backgroundColor: '#A0AEC0' },
  validateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  validationNote: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
});
