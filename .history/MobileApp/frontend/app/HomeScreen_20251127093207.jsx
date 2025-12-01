import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DeliveryCard from '../components/DeliveryCard';
import EvaluationsScreen from './EvaluationsScreen';
import HistoryScreen from './HistoryScreen';
import { router } from 'expo-router'; 

export default function HomeScreen() {
  const [deliveries, setDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState('Livraisons');

  const mockDeliveries = [
    {
      code: 'PKG001234',
      client: 'Marie Dupont',
      address: '123 Rue de la Paix, 75002 Paris',
      phone: '+33 6 12 34 56 78',
      status: 'En attente',
    },
    {
      code: 'PKG001235',
      client: 'Jean Martin',
      address: '45 Avenue des Champs-Élysées, 75008 Paris',
      phone: '+33 6 23 45 67 89',
      status: 'En attente',
    },
  ];

  useEffect(() => {
    setTimeout(() => setDeliveries(mockDeliveries), 800);
  }, []);

  const handleStart = (d) => router.push('/MapScreen');
  const handleMap = (d) => router.push('/MapScreen');
  const handleScan = (d) => router.push('/ScanScreen');

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ==== HEADER ==== */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Ionicons name="cube" size={24} color="white" />
          </View>
          <Text style={styles.headerTitle}>
            {activeTab === 'Livraisons' ? 'Mes livraisons' : 
             activeTab === 'Historique' ? 'Historique' : 
             'Évaluations'}
          </Text>
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
          {/* === BOUTON PROFIL === */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/ProfileScreen')}
          >
            <Ionicons name="person-circle-outline" size={26} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ==== TABS ==== */}
      <View style={styles.tabContainer}>
        {/* ----- LIVRAISONS ----- */}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Livraisons' && styles.activeTab]}
          onPress={() => handleTabChange('Livraisons')}
        >
          <Ionicons
            name="cube-outline"
            size={18}
            color={activeTab === 'Livraisons' ? '#2563eb' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'Livraisons' && styles.activeTabText,
            ]}
          >
            Livraisons
          </Text>
        </TouchableOpacity>

        {/* ----- HISTORIQUE ----- */}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Historique' && styles.activeTab]}
          onPress={() => handleTabChange('Historique')}
        >
          <Ionicons
            name="time"
            size={18}
            color={activeTab === 'Historique' ? '#2563eb' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'Historique' && styles.activeTabText,
            ]}
          >
            Historique
          </Text>
        </TouchableOpacity>

        {/* ----- ÉVALUATIONS ----- */}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Évaluations' && styles.activeTab]}
          onPress={() => handleTabChange('Évaluations')}
        >
          <Ionicons
            name="star"
            size={18}
            color={activeTab === 'Évaluations' ? '#2563eb' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'Évaluations' && styles.activeTabText,
            ]}
          >
            Évaluations
          </Text>
        </TouchableOpacity>
      </View>

      {/* ==== CONTENU ==== */}
      {activeTab === 'Livraisons' ? (
        <FlatList
          data={deliveries}
          keyExtractor={(i) => i.code}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <DeliveryCard
              delivery={item}
              onStart={() => handleStart(item)}
              onMap={() => handleMap(item)}
              onScan={() => handleScan(item)}
            />
          )}
        />
      ) : activeTab === 'Historique' ? (
        <HistoryScreen />
      ) : activeTab === 'Évaluations' ? (
        <EvaluationsScreen />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 6, borderRadius: 10 },
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: { backgroundColor: 'white' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  activeTabText: { color: '#2563eb' },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  historiqueContent: {
    flex: 1,
    padding: 20,
  },
  historiqueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});