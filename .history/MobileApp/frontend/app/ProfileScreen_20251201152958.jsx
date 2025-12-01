// app/(tabs)/ProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiMobile from '../app/apiMobile';

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(''); // pas encore dans le back
  const [vehicleType, setVehicleType] = useState(''); // pas dans la bdd pour l’instant
  const [plate, setPlate] = useState(''); // immatriculation = vehicleInfo

  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(true);
  const [sound, setSound] = useState(true);

  const [userName, setUserName] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [deliveryCount, setDeliveryCount] = useState(0); // à brancher plus tard si tu ajoutes le champ
  const [rating, setRating] = useState(0);
  const [onTimeRate, setOnTimeRate] = useState(0); // à brancher plus tard

  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Erreur', 'Impossible de trouver votre identifiant');
        router.back();
        return;
      }

      // GET /mobile/livreur/{userId} -> LivreurDTO
      const res = await apiMobile.get(`/mobile/livreur/${userId}`);
      const profil = res.data;

      const fullName = `${profil.prenom || ''} ${profil.nom || ''}`.trim();

      setEmail(profil.email || '');
      setPhone(profil.telephone || '');
      setAddress(''); // pas en bdd pour l’instant
      setVehicleType(profil.typeVehicule || ''); // pas en bdd pour l’instant
      setPlate(profil.vehicleInfo || '');

      setUserName(fullName || 'Mon profil');
      // si tu ajoutes dateCreation dans LivreurDTO, tu pourras l’utiliser ici
      setMemberSince(''); 
      setRating(profil.note || 0);

      const initial = {
        email: profil.email || '',
        phone: profil.telephone || '',
        address: '',
        vehicleType: '',
        plate: profil.vehicleInfo || '',
      };
      setOriginalData(initial);
      setHasChanges(false);
    } catch (e) {
      console.log('Erreur chargement profil', e?.response?.data || e);
      Alert.alert(
        'Erreur',
        "Impossible de charger le profil. Réessayez plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const checkChanges = () => {
    if (!originalData) return;
    const changed =
      email !== originalData.email ||
      phone !== originalData.phone ||
      address !== originalData.address ||
      vehicleType !== originalData.vehicleType ||
      plate !== originalData.plate;
    setHasChanges(changed);
  };

  const handleSave = () => {
    // Pour l’instant, pas de PUT côté backend -> juste UI
    Alert.alert(
      'Modifications enregistrées',
      'Vos informations ont été mises à jour.',
      [{ text: 'OK', onPress: () => setIsEditing(false) }],
    );
    setHasChanges(false);
  };

  const handleCancel = () => {
    if (!originalData) {
      setIsEditing(false);
      return;
    }
    setEmail(originalData.email);
    setPhone(originalData.phone);
    setAddress(originalData.address);
    setVehicleType(originalData.vehicleType);
    setPlate(originalData.plate);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/LoginScreen');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon profil</Text>
        <TouchableOpacity
          onPress={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
        >
          <Ionicons
            name={isEditing ? 'checkmark' : 'pencil'}
            size={22}
            color="white"
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* USER CARD */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userName
                ? userName
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase()
                : 'JD'}
            </Text>
          </View>
          <Text style={styles.userName}>{userName || ''}</Text>
          <Text style={styles.memberSince}>
            {memberSince || ''}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Ionicons name="cube" size={24} color="#2563eb" />
              <Text style={styles.statNumber}>{deliveryCount}</Text>
              <Text style={styles.statLabel}>Livraisons</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="star" size={24} color="#f59e0b" />
              <Text style={styles.statNumber}>
                {rating ? `${rating.toFixed(1)}/5` : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Note moyenne</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="trending-up" size={24} color="#10b981" />
              <Text style={styles.statNumber}>
                {onTimeRate ? `${onTimeRate}%` : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>À l’heure</Text>
            </View>
          </View>
        </View>

        {/* INFORMATIONS PERSONNELLES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color="#6b7280" />
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    checkChanges();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.inputValue}>{email}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="call-outline" size={20} color="#6b7280" />
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Téléphone</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    checkChanges();
                  }}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.inputValue}>{phone}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={20} color="#6b7280" />
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Adresse</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                    checkChanges();
                  }}
                  multiline
                />
              ) : (
                <Text style={styles.inputValue}>{address}</Text>
              )}
            </View>
          </View>
        </View>

        {/* VÉHICULE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car-outline" size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Véhicule</Text>
          </View>

          <View style={styles.vehicleRow}>
            <Text style={styles.vehicleLabel}>Type de véhicule</Text>
            {isEditing ? (
              <TextInput
                style={styles.vehicleInput}
                value={vehicleType}
                onChangeText={(text) => {
                  setVehicleType(text);
                  checkChanges();
                }}
              />
            ) : (
              <Text style={styles.vehicleValue}>
                {vehicleType || 'Non renseigné'}
              </Text>
            )}
          </View>

          <View style={styles.vehicleRow}>
            <Text style={styles.vehicleLabel}>Immatriculation</Text>
            {isEditing ? (
              <TextInput
                style={styles.vehicleInput}
                value={plate}
                onChangeText={(text) => {
                  setPlate(text.toUpperCase());
                  checkChanges();
                }}
                autoCapitalize="characters"
              />
            ) : (
              <Text style={[styles.vehicleValue, { fontWeight: 'bold' }]}>
                {plate || 'Non renseignée'}
              </Text>
            )}
          </View>
        </View>

        {/* PARAMÈTRES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Paramètres</Text>
          </View>

          <View style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={20} color="#6b7280" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>
                Recevoir les alertes de nouvelles missions
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#d1d5db', true: '#2563eb' }}
              thumbColor={notifications ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingItem}>
            <Ionicons name="location-outline" size={20} color="#6b7280" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>
                Partager votre position en temps réel
              </Text>
            </View>
            <Switch
              value={location}
              onValueChange={setLocation}
              trackColor={{ false: '#d1d5db', true: '#2563eb' }}
              thumbColor={location ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingItem}>
            <Ionicons name="volume-medium-outline" size={20} color="#6b7280" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Activer les alertes sonores</Text>
            </View>
            <Switch
              value={sound}
              onValueChange={setSound}
              trackColor={{ false: '#d1d5db', true: '#2563eb' }}
              thumbColor={sound ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="key-outline" size={20} color="#6b7280" />
            <Text style={styles.actionText}>Changer le mot de passe</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="help-circle-outline" size={20} color="#6b7280" />
            <Text style={styles.actionText}>Aide et support</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* BOUTONS D'ACTION (édition) */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!hasChanges}
            >
              <Text style={styles.saveText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DÉCONNEXION */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles : garde exactement les tiens
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: 'white' },
  userCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#2563eb' },
  userName: { fontSize: 20, fontWeight: '600', color: '#1f2937' },
  memberSince: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginTop: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  inputWrapper: { marginLeft: 12, flex: 1 },
  inputLabel: { fontSize: 12, color: '#6b7280' },
  textInput: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb',
  },
  inputValue: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  vehicleLabel: { fontSize: 14, color: '#6b7280' },
  vehicleInput: {
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb',
  },
  vehicleValue: { fontSize: 14, color: '#1f2937' },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingText: { flex: 1, marginLeft: 12 },
  settingLabel: { fontSize: 14, color: '#1f2937' },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  actionText: { fontSize: 14, color: '#1f2937', flex: 1, marginLeft: 12 },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelText: { color: '#4b5563', fontWeight: '600' },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonDisabled: { backgroundColor: '#93c5fd', opacity: 0.6 },
  saveText: { color: 'white', fontWeight: '600' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 30,
    paddingVertical: 14,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontHKWeight: '600',
    color: '#ef4444',
  },
});
