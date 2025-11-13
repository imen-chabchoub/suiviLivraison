// app/scan.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ScanPage() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const cameraRef = useRef(null);

  // Données de la livraison en cours
  const currentDelivery = {
    packageId: 'PKG001234',
    expectedBarcode: 'PKG001234',
    destination: '123 Rue de la Paix, 75002 Paris',
    client: 'Marie Dupont'
  };

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }) => {
    if (hasScanned) return;
    
    setHasScanned(true);
    setIsScanning(false);
    setScannedData(data);
    verifyBarcode(data);
  };

  const verifyBarcode = async (barcodeData) => {
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (barcodeData === currentDelivery.expectedBarcode) {
        Alert.alert(
          '✅ Code-barres validé !',
          `Colis ${barcodeData} correspond à la livraison prévue.`,
          [
            {
              text: 'Continuer',
              onPress: () => {
                router.push('/MapPage');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          '❌ Code-barres incorrect',
          `Le code scanné (${barcodeData}) ne correspond pas au colis attendu (${currentDelivery.expectedBarcode}).`,
          [
            {
              text: 'Réessayer',
              onPress: resetScanner
            },
            {
              text: 'Annuler',
              style: 'cancel',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur vérification:', error);
      Alert.alert('Erreur', 'Impossible de vérifier le code-barres');
    } finally {
      setIsLoading(false);
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setHasScanned(false);
    setIsScanning(true);
    setManualBarcode('');
    setShowManualInput(false);
  };

  const handleManualSubmit = () => {
    if (!manualBarcode.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un code-barres');
      return;
    }

    setShowManualInput(false);
    setScannedData(manualBarcode);
    setHasScanned(true);
    setIsScanning(false);
    verifyBarcode(manualBarcode.trim());
  };

  const openManualInput = () => {
    setShowManualInput(true);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4299E1" />
          <Text style={styles.loadingText}>Vérification des permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#666" />
          <Text style={styles.permissionTitle}>Accès à la caméra requis</Text>
          <Text style={styles.permissionText}>
            L'accès à la caméra est nécessaire pour scanner les codes-barres des colis.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser l'accès</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.title}>Scanner le colis</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Informations de la livraison */}
      <View style={styles.deliveryInfo}>
        <Text style={styles.deliveryTitle}>Livraison en cours</Text>
        <View style={styles.infoRow}>
          <Ionicons name="cube-outline" size={16} color="#666" />
          <Text style={styles.infoText}>Colis: {currentDelivery.packageId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{currentDelivery.destination}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{currentDelivery.client}</Text>
        </View>
      </View>

      {/* Zone de caméra */}
      <View style={styles.cameraContainer}>
        {isScanning ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'pdf417',
                'aztec',
                'code39',
                'code93',
                'code128',
                'codabar',
                'ean8',
                'ean13',
                'itf14',
                'upc_a',
                'upc_e'
              ],
            }}
            onBarcodeScanned={hasScanned ? undefined : handleBarCodeScanned}
          >
            {/* Overlay de scan */}
            <View style={styles.overlay}>
              {/* Zone de scan centrée */}
              <View style={styles.scanFrame}>
                <View style={styles.cornerTopLeft} />
                <View style={styles.cornerTopRight} />
                <View style={styles.cornerBottomLeft} />
                <View style={styles.cornerBottomRight} />
              </View>
              
              {/* Instructions */}
              <View style={styles.instructions}>
                <Ionicons name="scan-outline" size={24} color="#fff" />
                <Text style={styles.instructionsText}>
                  Scannez le code-barres du colis
                </Text>
                <Text style={styles.instructionsSubtext}>
                  Placez le code dans le cadre
                </Text>
              </View>
            </View>
          </CameraView>
        ) : (
          <View style={styles.resultContainer}>
            {isLoading ? (
              <View style={styles.loadingResult}>
                <ActivityIndicator size="large" color="#4299E1" />
                <Text style={styles.loadingResultText}>Vérification en cours...</Text>
              </View>
            ) : (
              <View style={styles.scanResult}>
                <Ionicons 
                  name="barcode-outline" 
                  size={64} 
                  color="#4299E1" 
                />
                <Text style={styles.scannedCode}>
                  Code scanné: {scannedData}
                </Text>
                <Text style={styles.scanStatus}>
                  {isLoading ? 'Vérification en cours...' : 'Résultat de la vérification ci-dessus'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {isScanning ? (
          // BOUTON FLASH SUPPRIMÉ - SEUL LE BOUTON SAISIE MANUELLE RESTE
          <TouchableOpacity 
            style={styles.manualButton}
            onPress={openManualInput}
          >
            <Ionicons name="keypad-outline" size={20} color="#4299E1" />
            <Text style={styles.manualButtonText}>Saisie manuelle</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.rescanButton}
            onPress={resetScanner}
            disabled={isLoading}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.rescanButtonText}>Scanner à nouveau</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Conseils */}
      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>Conseils de scan :</Text>
        <Text style={styles.tip}>• Assurez-vous que le code est bien éclairé</Text>
        <Text style={styles.tip}>• Tenez le téléphone à 15-20 cm du code</Text>
        <Text style={styles.tip}>• Maintenez le téléphone stable</Text>
        <Text style={styles.tip}>• Utilisez un environnement bien éclairé</Text>
      </View>

      {/* Modal de saisie manuelle */}
      <Modal
        visible={showManualInput}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Saisie manuelle</Text>
            <Text style={styles.modalSubtitle}>
              Entrez le code-barres du colis
            </Text>
            
            <TextInput
              style={styles.textInput}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder="Ex: PKG001234"
              placeholderTextColor="#999"
              autoFocus={true}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleManualSubmit}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowManualInput(false)}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSubmitButton, !manualBarcode.trim() && styles.modalSubmitButtonDisabled]}
                onPress={handleManualSubmit}
                disabled={!manualBarcode.trim()}
              >
                <Text style={styles.modalSubmitButtonText}>Vérifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#4299E1',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  placeholder: {
    width: 40,
  },
  deliveryInfo: {
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
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 8,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    position: 'relative',
    marginBottom: 40,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4299E1',
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4299E1',
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4299E1',
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4299E1',
    borderBottomRightRadius: 12,
  },
  instructions: {
    alignItems: 'center',
  },
  instructionsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  instructionsSubtext: {
    color: '#E2E8F0',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingResult: {
    alignItems: 'center',
  },
  loadingResultText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scanResult: {
    alignItems: 'center',
    padding: 20,
  },
  scannedCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  scanStatus: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center', // Centré maintenant qu'il n'y a qu'un seul bouton
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4299E1',
  },
  manualButtonText: {
    color: '#4299E1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4299E1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tips: {
    backgroundColor: '#FFF5F5',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FED7D7',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C53030',
    marginBottom: 8,
  },
  tip: {
    fontSize: 12,
    color: '#744210',
    marginBottom: 4,
    lineHeight: 16,
  },
  // Styles pour le modal de saisie manuelle
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#2D3748',
    backgroundColor: '#F7FAFC',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubmitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4299E1',
    alignItems: 'center',
  },
  modalSubmitButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  modalSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});