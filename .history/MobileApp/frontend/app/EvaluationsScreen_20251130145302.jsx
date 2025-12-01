import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiMobile from '../app/apiMobile';
export default function EvaluationsScreen() {
  const [ratings, setRatings] = useState({
    average: 0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    comments: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchProfilEvaluation = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.log('Aucun userId trouvé pour les évaluations');
        return;
      }

      const res = await apiMobile.get(`/mobile/evaluation/profil/${userId}`);
      const data = res.data;

      // moyenne est une string formatée "4.7"
      const average = parseFloat(data.moyenne || '0') || 0;
      const total = data.nombreEvaluations || 0;
      const evals = data.evaluations || [];

      // Construire la distribution 1..5
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      evals.forEach(e => {
        const n = e.note || 0;
        if (distribution[n] !== undefined) {
          distribution[n] += 1;
        }
      });

      const comments = evals.map(e => ({
        id: e.id,
        name: e.clientNom || 'Utilisateur anonyme',
        rating: e.note || 0,
        comment: e.commentaire || '',
        date: e.dateEvaluation || '', // adapte si tu ajoutes la date dans le DTO
      }));

      setRatings({
        average,
        total,
        distribution,
        comments,
      });
    } catch (err) {
      console.log('Erreur profil évaluations', err?.response?.data || err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfilEvaluation();
  }, []);

  const renderStars = (count) => (
    <View style={{ flexDirection: 'row' }}>
      {[...Array(5)].map((_, i) => (
        <Ionicons
          key={i}
          name={i < count ? 'star' : 'star-outline'}
          size={18}
          color="#facc15"
        />
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.baseText}>Chargement des évaluations...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {/* ===== SCORE GLOBAL ===== */}
      <View style={styles.summaryCard}>
        <Text style={styles.average}>{ratings.average.toFixed(1)}</Text>
        <Text style={styles.outOf}>/ 5</Text>
        <View style={{ flexDirection: 'row', marginVertical: 6 }}>
          {renderStars(Math.round(ratings.average))}
        </View>
        <Text style={styles.baseText}>Basé sur {ratings.total} évaluations</Text>
      </View>

      {/* ===== DISTRIBUTION ===== */}
      <View style={styles.distributionCard}>
        <Text style={styles.sectionTitle}>Distribution des notes</Text>
        {Object.entries(ratings.distribution)
          .sort(([a], [b]) => b - a)
          .map(([stars, count]) => (
            <View key={stars} style={styles.barRow}>
              <Text style={styles.starLabel}>{stars} ★</Text>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(count / ratings.total) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.count}>{count}</Text>
            </View>
          ))}
      </View>

      {/* ===== COMMENTAIRES ===== */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Commentaires récents</Text>
      <FlatList
        data={ratings.comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.commentName}>{item.name}</Text>
              <Text style={styles.commentDate}>{item.date}</Text>
            </View>
            {renderStars(item.rating)}
            <Text style={styles.commentText}>{item.comment}</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  summaryCard: {
    backgroundColor: 'white',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  average: { fontSize: 48, fontWeight: '700', color: '#111827' },
  outOf: { fontSize: 18, color: '#6b7280' },
  baseText: { fontSize: 14, color: '#6b7280' },
  distributionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  starLabel: { width: 24, color: '#111827' },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  barFill: {
    height: 8,
    backgroundColor: '#facc15',
    borderRadius: 8,
  },
  count: { width: 20, textAlign: 'right', color: '#111827' },
  commentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  commentName: { fontWeight: '600', color: '#111827' },
  commentDate: { color: '#9ca3af', fontSize: 12 },
  commentText: { marginTop: 6, color: '#374151', fontSize: 14 },
});