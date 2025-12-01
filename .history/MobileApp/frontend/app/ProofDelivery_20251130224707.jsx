// app/ProofDelivery.jsx
import React, { useState, useRef, useEffect } from 'react';
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
  Dimensions,
  PanResponder,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { captureRef } from 'react-native-view-shot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiMobile from '../app/apiMobile';

const { width: screenWidth } = Dimensions.get('window');

export default function ProofDelivery() {
  const [signature, setSignature] = useState(null);       // URI de l'image de signature
  const [photo, setPhoto] = useState(null);              // URI de la photo du colis
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [deliveryData, setDeliveryData] = useState(null);

  const signatureRef = useRef(null);
  const paths = useRef([]);
  const currentPath = useRef([]);

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

  // PanResponder pour dessiner la signature
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        setIsDrawing(true);
        currentPath.current = [
          {
            x: e.nativeEvent.locationX,
            y: e.nativeEvent.locationY,
          },
        ];
      },
      onPanResponderMove: (e) => {
        if (isDrawing) {
          currentPath.current.push({
            x: e.nativeEvent.locationX,
            y: e.nativeEvent.locationY,
          });
        }
      },
      onPanResponderRelease: () => {
        if (isDrawing) {
          paths.current.push([...currentPath.current]);
          currentPath.current = [];
          setIsDrawing(false);
          saveSignatureAsImage();
        }
      },
    }),
  ).current;

  const saveSignatureAsImage = async () => {
    try {
      if (signatureRef.current) {
        const uri = await captureRef(signatureRef.current, {
          format: 'png',
          quality: 1,
        });
        setSignature(uri);
      }
    } catch (error) {
      console.error('Erreur sauvegarde signature:', error);
    }
  };

  const clearSignature = () => {
    paths.current = [];
    currentPath.current = [];
    setSignature(null);
  };

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
    if (!signature) {
      Alert.alert(
        'Signature manquante',
        'La signature du client est obligatoire.',
      );
      return;
    }
    if (!photo) {
      Alert.alert(
        'Photo manquante',
        'La photo du colis livré est obligatoire.',
      );
      return;
    }
    if (!currentLocation) {
      Alert.alert(
        'Localisation manquante',
        'La géolocalisation est obligatoire.',
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

      const formData = new FormData();

      formData.append('signature', {
        uri: signature,
        name: 'signature.png',
        type: 'image/png',
      });

      formData.append('photoColis', {
        uri: photo,
        name: 'colis.jpg',
        type: 'image/jpeg',
      });

      formData.append('idLivreur', userId);
      formData.append('idLivraison', String(deliveryData.id));
      formData.append('packageId', deliveryData.packageId);
      formData.append('client', deliveryData.client);
      formData.append('destination', deliveryData.destination);
      formData.append('latitude', String(currentLocation.latitude));
      formData.append('longitude', String(currentLocation.longitude));
      formData.append('timestamp', currentLocation.timestamp);

      const res = await apiMobile.post('/mobile/preuve-livraison', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Preuve envoyée', res.status, res.data);

      Alert.alert(
        'Livraison validée !',
        'La preuve de livraison a été enregistrée avec succès.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/HistoryScreen');
            },
          },
        ],
      );
    } catch (error) {
      console.error('Erreur validation:', error?.response?.data || error);
      Alert.alert('Erreur', 'Impossible de valider la livraison');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSignature = () => (
    <View style={styles.signatureContainer}>
      <View
        ref={signatureRef}
        style={styles.signaturePad}
        {...panResponder.panHandlers}
      >
        {paths.current.map((path, pathIndex) => (
          <View key={pathIndex} style={StyleSheet.absoluteFill}>
            {path.map((point, pointIndex) => {
              if (pointIndex === 0) return null;
              const prevPoint = path[pointIndex - 1];
              return (
                <View
                  key={pointIndex}
                  style={[
                    styles.signatureLine,
                    {
                      left: prevPoint.x,
                      top: prevPoint.y,
                      width: Math.sqrt(
                        Math.pow(point.x - prevPoint.x, 2) +
                          Math.pow(point.y - prevPoint.y, 2),
                      ),
                      transform: [
                        {
                          rotate:
                            Math.atan2(
                              point.y - prevPoint.y,
                              point.x - prevPoint.x,
                            ) + 'rad',
                        },
                      ],
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
        {currentPath.current.map((point, pointIndex) => {
          if (pointIndex === 0) return null;
          const prevPoint = currentPath.current[pointIndex - 1];
          return (
            <View
              key={pointIndex}
              style={[
                styles.signatureLine,
                {
                  left: prevPoint.x,
                  top: prevPoint.y,
                  width: Math.sqrt(
                    Math.pow(point.x - prevPoint.x, 2) +
                      Math.pow(point.y - prevPoint.y, 2),
                  ),
                  transform: [
                    {
                      rotate:
                        Math.atan2(
                          point.y - prevPoint.y,
                          point.x - prevPoint.x,
                        ) + 'rad',
                    },
                  ],
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.signatureButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={clearSignature}>
          <Text style={styles.secondaryButtonText}>Effacer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={saveSignatureAsImage}
        >
          <Text style={styles.primaryButtonText}>Sauvegarder</Text>
        </TouchableOpacity>
      </View>

      {signature && (
        <View style={styles.signatureSaved}>
          <Ionicons name="checkmark-circle" size={20} color="#48BB78" />
          <Text style={styles.signatureSavedText}>Signature enregistrée</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
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

        {/* Signature */}
        {/*<View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Signature du client <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>
            Le client doit signer ci-dessous pour confirmer la réception
          </Text>
          {renderSignature()}
        </View>*/}

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
              (!signature || !photo || !currentLocation) &&
                styles.validateButtonDisabled,
            ]}
            onPress={validateDelivery}
            disabled={!signature || !photo || !currentLocation || isLoading}
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
  signatureContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  signaturePad: {
    height: 200,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  signatureLine: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#000000',
    borderRadius: 1.5,
  },
  signatureButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  primaryButton: {
    backgroundColor: '#4299E1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '600',
  },
  signatureSaved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F0FFF4',
    borderTopWidth: 1,
    borderTopColor: '#C6F6D5',
  },
  signatureSavedText: {
    color: '#276749',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
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
