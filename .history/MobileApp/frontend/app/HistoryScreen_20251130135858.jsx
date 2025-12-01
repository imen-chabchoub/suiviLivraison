import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiMobile from '../app/apiMobile';

export default function HistoryScreen({ navigation }) {
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.log('Aucun userId trouvé en storage');
        return;
      }

      // Appel backend : GET /mobile/livraison/historique/{idLivreur}
      const res = await apiMobile.get(`/mobile/livraison/historique/${userId}`);
      const livraisons = res.data;

      // Adapter les livraisons pour ton UI
      const mapped = livraisons.map((l, index) => ({
        id: String(l.id ?? index),
        code: l.codeBarre || `LIV-${l.id}`,
        client: l.client ? `${l.client.prenom} ${l.client.nom}` : 'Client',
        date: l.dateLivraison || '',  // adapte selon ton DTO (LocalDateTime -> string déjà formatée ?)
        duration: '',                 // si tu n’as pas la durée en back, laisse vide ou calcule plus tard
        proof: true,                  // si tu as une vraie info de preuve, remplace
      }));

      setCompletedDeliveries(mapped);
    } catch (err) {
      console.log('Erreur fetch historique livraisons', err?.response?.data || err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.codeContainer}>
          <Ionicons name="cube" size={18} color="#2563eb" />
          <Text style={styles.code}>{item.code}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Livré</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="person" size={16} color="#6b7280" />
        <Text style={styles.infoText}>{item.client}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="calendar" size={16} color="#6b7280" />
        <Text style={styles.infoText}>{item.date}</Text>
      </View>

      {item.duration ? (
        <View style={styles.infoRow}>
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text style={styles.infoText}>Durée : {item.duration}</Text>
        </View>
      ) : null}

      <View style={styles.infoRow}>
        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
        <Text style={[styles.infoText, styles.proofText]}>
          {item.proof ? 'Preuve complète' : 'Preuve manquante'}
        </Text>
      </View>
    </View>
  );

  const total = completedDeliveries.length;
  const completed = completedDeliveries.filter(d => d.proof).length;

  return (
    <SafeAreaView style={styles.container}>
      

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>Livraisons</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>Complétées</Text>
        </View>
      </View>

      {/* Liste */}
      <FlatList
        data={completedDeliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 20,
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#1f2937' },
  statLabel: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  divider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    height: '100%',
  },
  list: { paddingHorizontal: 16, paddingTop: 16 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  code: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  statusBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { color: 'white', fontSize: 12, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: { fontSize: 14, color: '#4b5563' },
  proofText: { color: '#10b981', fontWeight: '600' },
});